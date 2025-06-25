import { Request } from 'express';
import { ValidationChain, validationResult } from 'express-validator';

export async function validate(chains: ValidationChain[], req: Request, requireArray = false) {
    for (const chain of chains) {
        await chain.run(req);
    }
    const result = validationResult(req);
    if (result.isEmpty()) {
        return undefined;
    }
    const errors = result.array();
    if (requireArray !== true && errors.length === 1) {
        return errors[0];
    } else {
        return errors;
    }
}
