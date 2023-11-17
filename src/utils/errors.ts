export class MoroboxAIError extends Error {}

export class NotFoundError extends MoroboxAIError {
    what: string;

    constructor(what: string) {
        super(`${what} not found`);
        this.what = what;
    }
}

export class NotGameError extends MoroboxAIError {
    id: string;

    constructor(id: string) {
        super(`${id} is not a game`);
        this.id = id;
    }
}

export class InvalidHeaderError extends MoroboxAIError {}

export class GameNotFoundError extends NotFoundError {
    id: string;

    constructor(id: string) {
        super(`Game ${id} not found`);
        this.id = id;
    }
}

export class BootNotFoundError extends NotFoundError {
    id: string;

    constructor(id: string) {
        super(`Boot ${id} not found`);
        this.id = id;
    }
}

export class HeaderNotFoundError extends MoroboxAIError {
    id: string;

    constructor(id: string) {
        super(`${id} header not found`);
        this.id = id;
    }
}

export class UnexpectedArgumentError extends MoroboxAIError {
    arg: string;
    reason: string;

    constructor(arg: string, reason: string) {
        super(`Invalid argument ${arg}: ${reason}`);
        this.arg = arg;
        this.reason = reason;
    }
}

export class CantPackError extends MoroboxAIError {
    path: string;
    reason: string;

    constructor(path: string, reason: string) {
        super(`Can't pack ${path}: ${reason}`);
        this.path = path;
        this.reason = reason;
    }
}

export class CantUnpackError extends MoroboxAIError {
    path: string;
    reason: string;

    constructor(path: string, reason: string) {
        super(`Can't unpack ${path}: ${reason}`);
        this.path = path;
        this.reason = reason;
    }
}

export function isENOENT(err: NodeJS.ErrnoException) {
    return err.code === "ENOENT";
}
