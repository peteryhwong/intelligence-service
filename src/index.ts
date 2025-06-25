import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import 'express-validator';
import 'reflect-metadata';
import { MCP_CLIENT } from './component/constant';
import { createMcpServer } from './component/mcp';
import { createChatLoop } from './component/mcp/ollama';
import { createHttpServer } from './component/server';
import { register } from './component/weather';

async function mcpServer() {
    const transport = new StdioServerTransport();
    const server = register(createMcpServer());
    await server.connect(transport);
    console.error('Weather MCP Server running on stdio');
}

if (!MCP_CLIENT) {
    createHttpServer();
} else if (MCP_CLIENT) {
    createChatLoop();
} else {
    mcpServer().catch(error => {
        console.error('Fatal error in main():', error);
        process.exit(1);
    });
}
