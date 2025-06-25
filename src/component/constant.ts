import * as configJson from '../resource/api.json';

export const ENV = process.env;

export const NODE_ENV = ENV.NODE_ENV;

export const APPLICATION_NAME = 'service';

export const CONFIG = configJson;

export const PORT = 8080;

export const DISABLE_HTTP_SERVER = ENV.DISABLE_HTTP_SERVER === 'true';

export const DISABLE_DB = ENV.DISABLE_DB === 'true';

export const MCP_CLIENT = ENV.MCP_CLIENT === 'true';
