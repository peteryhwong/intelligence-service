export interface Logger {
    info(msg: any): void;
    warn(msg: any): void;
    error(msg: any): void;
    debug(msg: any): void;
}

class CommonLogger implements Logger {
    info(msg: string): void {
        console.log(msg);
    }

    warn(msg: string): void {
        console.log(msg);
    }

    error(msg: string): void {
        console.error(msg);
    }

    debug(msg: string): void {
        console.log(msg);
    }
}

export const logger: Logger = new CommonLogger();
