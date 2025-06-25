import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function createMcpServer() {
    return new McpServer(
        {
            name: 'weather',
            version: '1.0.0',
        },
        {
            capabilities: {
                resources: {},
                tools: {},
            },
        },
    );
}

export function createMcpClient() {
    return new Client({
        name: 'client',
        version: '1.0.0',
    });
}
