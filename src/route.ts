import { APPLICATION_NAME } from './component/constant';
import { createMcp } from './controller/mcpcontroller';
import { question } from './controller/querycontroller';

const versionPath = `/${APPLICATION_NAME}/v1.0`;
export const routes = [
    {
        method: 'post',
        route: `${versionPath}/mcp`,
        main: createMcp,
    },
    {
        method: 'post',
        route: `${versionPath}/question`,
        main: question,
    },
];
