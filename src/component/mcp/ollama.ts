import { Client as MCPClientSDK } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import * as ollama from 'ollama';
import * as readline from 'readline/promises';
import { URL } from 'url';
import { logger } from '../logger';

// Interface for the structure of tools coming from the MCP server
interface McpServerTool {
    name: string;
    description: string;
    inputSchema: any; // JSONSchema7Definition or similar, adjust as per actual SDK type
}

class MCPClient {
    private mcp: MCPClientSDK;
    private ollama: ollama.Ollama;
    private transport: Transport | null = null;
    private tools: ollama.Tool[] = [];
    private activeModel: string = 'llama3'; // Default model, can be configured

    constructor(ollamaHost: string = 'http://localhost:11434', defaultModel: string = 'llama3') {
        this.ollama = new ollama.Ollama({ host: ollamaHost });
        this.mcp = new MCPClientSDK({ name: 'mcp-ollama-client-cli', version: '1.0.0' });
        this.activeModel = defaultModel;
        logger.info(`MCPClient initialized. Ollama host: ${ollamaHost}, Default model: ${defaultModel}`);
    }

    async connectToServer(urlString: string): Promise<void> {
        try {
            logger.info(`Attempting to connect to MCP server: ${urlString}`);

            const url = new URL(urlString);

            this.transport = new StreamableHTTPClientTransport(url);
            this.mcp.connect(this.transport);
            logger.info('MCP transport connected. Listing tools...');

            const toolsResult = await this.mcp.listTools();
            this.tools = (toolsResult.tools as McpServerTool[]).map((tool: McpServerTool) => {
                return {
                    type: 'function',
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.inputSchema, // Assuming inputSchema is compatible with Ollama's expected JSON schema
                    },
                };
            });
            logger.info(`Connected to MCP server. Available tools: ${this.tools.map(({ function: { name } }) => name).join()}`);
        } catch (e) {
            logger.error(`Failed to connect to MCP server or list tools: ${e.message}`);
            this.transport = null; // Ensure transport is null if connection failed
            throw e;
        }
    }

    async processQuery(query: string): Promise<string> {
        if (!this.transport || this.tools.length === 0) {
            return 'Not connected to an MCP server with tools. Please connect first.';
        }

        const messages: ollama.Message[] = [
            {
                role: 'user',
                content: query,
            },
        ];

        try {
            logger.info(`Processing query with Ollama model ${this.activeModel}: "${query}"`);
            if (this.tools.length > 0) {
                logger.info(`With tools: ${this.tools.map(tool => tool.function.name).join()}`);
            }

            let response = await this.ollama.chat({
                model: this.activeModel,
                messages,
                tools: this.tools.length > 0 ? this.tools : undefined,
                stream: false,
            });

            let finalContent = '';

            if (response.message.tool_calls && response.message.tool_calls.length > 0) {
                logger.info(`Ollama response includes tool calls: ${response.message.tool_calls.map(call => call.function.name).join()}`);
                messages.push(response.message); // Add assistant's response that contains tool_calls

                for (const toolCall of response.message.tool_calls) {
                    const toolName = toolCall.function.name;
                    const toolArgs = toolCall.function.arguments;
                    logger.info(`[Ollama requests tool: ${toolName} with args: ${JSON.stringify(toolArgs)}]`);

                    try {
                        const mcpToolResult = await this.mcp.callTool({
                            name: toolName,
                            arguments: toolArgs,
                        });
                        logger.info(`[MCP Tool ${toolName} responded. Content type: ${typeof mcpToolResult.content}]`);

                        let toolContentString: string;
                        if (typeof mcpToolResult.content === 'string') {
                            toolContentString = mcpToolResult.content;
                        } else if (mcpToolResult.content === null || mcpToolResult.content === undefined) {
                            toolContentString = 'Tool returned no content.';
                        } else {
                            toolContentString = JSON.stringify(mcpToolResult.content);
                        }

                        messages.push({
                            role: 'tool',
                            content: toolContentString,
                            // tool_call_id: toolCall.id, // Ollama's current JS lib doesn't seem to use/expose tool_call_id in the request for tool results
                        });
                    } catch (e) {
                        logger.error(`Error calling MCP tool ${toolName}: ${e.message}`);
                        messages.push({
                            role: 'tool',
                            content: `Error executing tool ${toolName}: ${(e as Error).message}`,
                        });
                    }
                }

                logger.info('Sending tool results back to Ollama...');
                response = await this.ollama.chat({
                    model: this.activeModel,
                    messages,
                    stream: false,
                });
                finalContent = response.message.content;
            } else {
                finalContent = response.message.content;
            }
            return finalContent;
        } catch (error) {
            console.error('Error during Ollama chat processing:', error);
            return `Error processing query with Ollama: ${(error as Error).message}`;
        }
    }

    async chatLoop(): Promise<void> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            logger.info('\n===== MCP Client (Ollama Version) =====');
            const ollamaHost = (await rl.question(`Enter Ollama host (default: http://localhost:11434): `)) || 'http://localhost:11434';
            const ollamaModel = (await rl.question(`Enter Ollama model to use (default: llama3.2:latest): `)) || 'llama3.2:latest';
            this.ollama = new ollama.Ollama({ host: ollamaHost.trim() });
            this.activeModel = ollamaModel.trim();
            logger.info(`Using Ollama at ${ollamaHost.trim()} with model ${this.activeModel}`);

            const url = (await rl.question('Enter path to MCP server URL (default: http://localhost:8080/service/v1.0/mcp): ')) || 'http://localhost:8080/service/v1.0/mcp';
            logger.info(`Connecting to MCP server at ${url.trim()}`);
            await this.connectToServer(url.trim());

            logger.info("\nType your queries or 'quit' to exit.");
            while (true) {
                const message = await rl.question('\nQuery: ');
                if (message.toLowerCase() === 'quit') {
                    break;
                }
                if (this.transport) {
                    // Check if transport is initialized (i.e., connected)
                    const responseText = await this.processQuery(message);
                    logger.info('\nOllama: ' + responseText);
                } else {
                    logger.info('Not connected to MCP server. Please restart and provide a valid server script path.');
                }
            }
        } catch (e) {
            logger.error(`An error occurred in the chat loop: ${e.message}`);
        } finally {
            if (this.transport) {
                try {
                    this.mcp.close();
                    logger.info('\nDisconnected from MCP server.');
                } catch (disconnectError) {
                    logger.error(`Error disconnecting from MCP server: ${disconnectError.message}`);
                }
            }
            rl.close();
            logger.info('Exiting MCP Client.');
        }
    }
}

export async function createChatLoop() {
    const client = new MCPClient();
    await client.chatLoop();
}
