import * as express from 'express';
import * as http from 'http';
import { routes } from '../route';
import { APPLICATION_NAME, PORT } from './constant';
import { logger } from './logger';

export function createHttpServer() {
    const app = express();
    app.use(express.urlencoded({ limit: 100000, extended: false }) as express.RequestHandler);
    app.use(express.json({ limit: 100000 }) as express.RequestHandler);
    // request validation middleware
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', `Origin,Accept,Content-Type,X-Owner,X-Requested-With,X-XSRF-Token,X-Access-Token,Authorization,Cache-Control,Expires`);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Max-Age', '3600');
        res.header('Access-Control-Allow-Credentials', 'true');
        logger.info(`Received ${req.method} request for ${req.url}`);
        next();
    });
    routes.forEach(r => {
        const { method, route, main } = r;
        logger.info(`Adding ${method} ${route}`);
        const handler = async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
            try {
                const result = main(req, res);
                if (result instanceof Promise) {
                    await result;
                } else {
                    res.json(result);
                }
            } catch (err) {
                logger.error(err);
                if (err.statusCode === 400) {
                    res.status(400);
                    res.json({ code: 400, msg: err.message });
                } else {
                    res.status(500);
                    res.json({ code: 500, msg: err.message });
                }
            }
        };
        switch (method) {
            case 'put':
                app.put(route, handler);
                break;
            case 'post':
                app.post(route, handler);
                break;
            case 'delete':
                app.delete(route, handler);
                break;
            case 'patch':
                app.patch(route, handler);
                break;
            case 'get':
                app.get(route, handler);
                break;
        }
    });
    const server = http.createServer(app);
    server.listen(PORT);
    logger.info(`${APPLICATION_NAME} is running on http://localhost:${PORT}`);
}
