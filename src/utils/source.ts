import * as nodePath from "path";
import isValidURL from "./isValidURL";
import { CWD } from "./platform";
import { UnexpectedArgumentError } from "./errors";

export interface Source {
    readonly url: URL;
    readonly path: string;
    isURL(): boolean;
    isPath(): boolean;
    isRemote(): boolean;
}

abstract class SourceBase implements Source {
    get url(): URL {
        return null;
    }

    get path(): string {
        return null;
    }

    isURL(): boolean {
        return false;
    }

    isPath(): boolean {
        return false;
    }

    isRemote(): boolean {
        return false;
    }
}

class URLSource extends SourceBase {
    private readonly _url: URL;

    constructor(value: string) {
        super();
        this._url = new URL(value);
    }

    get url(): URL {
        return this._url;
    }

    isURL(): boolean {
        return true;
    }

    isRemote(): boolean {
        return true;
    }
}

class PathSource extends SourceBase {
    private readonly _path: string;

    constructor(value: string) {
        super();
        this._path = value;
    }

    get path(): string {
        return this._path;
    }

    isPath(): boolean {
        return true;
    }
}

export default function source(value: string | Source): Source {
    if (typeof value !== "string") {
        return value;
    }

    if (isValidURL(value)) {
        return new URLSource(value);
    }

    if (!nodePath.isAbsolute(value)) {
        value = nodePath.join(CWD, value);
    }

    if (nodePath.parse(value).ext !== "") {
        throw new UnexpectedArgumentError("source", "must not be a file");
    }

    return new PathSource(value);
}
