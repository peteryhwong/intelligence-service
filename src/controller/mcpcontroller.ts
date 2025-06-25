import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { logger } from '../component/logger';
import { createMcpServer } from '../component/mcp';
import { register } from '../component/weather';
import { ServerResponse } from 'http';

export async function createMcp(request: Request, response: Response) {
    logger.info(`${JSON.stringify(request.body)}`);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = register(createMcpServer());
    response.on('close', () => {
        logger.info('Request closed');
        transport.close();
        server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(request, response as ServerResponse, request.body);
}
