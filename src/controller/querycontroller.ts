import { Request, Response } from 'express';
import { body } from 'express-validator';
import { getResponse } from '../component/langchain';
import { logger } from '../component/logger';

export async function question(request: Request, response: Response) {
    const checks = await body('user', 'user is not valid').isString().run(request);
    if (!checks.isEmpty()) {
        response.status(400).json(checks.array()[0]);
        return;
    }
    const answer = await getResponse(request.body.user);
    try {
        response.status(200).json({ answer });
    } catch (err) {
        logger.error(err.message);
        response.status(500).json({ msg: 'Something went wrong' });
    }
}
