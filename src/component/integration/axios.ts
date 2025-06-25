import axios from 'axios';
import { logger } from '../logger';

axios.interceptors.request.use(request => {
    logger.info(`Request: ${request.method} ${request.url}`);
    return request;
});

axios.interceptors.response.use(response => {
    logger.info(`Response: ${JSON.stringify(response, null, 2)}`);
    return response;
});
