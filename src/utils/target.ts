import * as nodePath from "path";
import isID from "./isID";
import isValidURL from "./isValidURL";
import { CWD } from "./platform";
import makeSource, { Source } from "./source";

export interface Target {
    readonly id: string;
    readonly sources?: string[];
    readonly extraSources?: string[];
    readonly url: URL;
    readonly path: string;
    isID(): boolean;
    isURL(): boolean;
    isPath(): boolean;
    isUnknownSource(): boolean;
    isRemote(): boolean;
    toString(): string;
}

abstract class TargetBase implements Target {
    readonly id: string;

    constructor(id: string) {
        this.id = id;
    }

    get url(): URL {
        return null;
    }

    get path(): string {
        return null;
    }

    isID(): boolean {
        return false;
    }

    isURL(): boolean {
        return false;
    }

    isPath(): boolean {
        return false;
    }

    isUnknownSource(): boolean {
        return false;
    }

    isRemote(): boolean {
        return false;
    }
}

class IDTarget extends TargetBase {
    readonly id: string;

    constructor(value: string) {
        super(value);
    }

    isUnknownSource(): boolean {
        return true;
    }

    isRemote(): boolean {
        return true;
    }

    toString(): string {
        return this.id;
    }
}

class URLTarget extends TargetBase {
    readonly id: string;
    private readonly _url: URL;
    readonly sources: string[] = [];
    readonly extraSources: string[];

    constructor(value: URL) {
        const path = value.toString();
        const i = path.lastIndexOf("/") + 1;
        super(nodePath.parse(value.pathname).name);
        this._url = value;
        this.extraSources = [path.substring(0, i)];
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

    isPath(): boolean {
        return false;
    }

    toString(): string {
        return this.url.toString();
    }
}

class PathTarget extends TargetBase {
    private readonly _path: string;
    readonly sources: string[] = [];
    readonly extraSources: string[];

    constructor(path: string) {
        super(nodePath.parse(path).name);
        this._path = path;
        this.extraSources = [nodePath.dirname(path)];
    }

    get path(): string {
        return this._path;
    }

    isPath(): boolean {
        return true;
    }

    toString(): string {
        return this.path;
    }
}

/**
 * Create a target from a source and a value.
 * @param source
 * @param value
 * @returns
 */
function combineSource(source: string | Source, value: string): Target {
    source = makeSource(source);

    if (source.isURL()) {
        return new URLTarget(new URL(value, source.url));
    }

    return new PathTarget(nodePath.join(source.path, value));
}

export function target(value: string | Target): Target;
export function target(source: string | Source, value: string): Target;
export default function target(
    source: string | Source | Target,
    value?: string
): Target {
    if (value !== undefined) {
        return combineSource(source, value);
    }

    if (typeof source !== "string") {
        return source as Target;
    }

    if (isID(source)) {
        return new IDTarget(source);
    }

    if (isValidURL(source)) {
        return new URLTarget(new URL(source));
    }

    if (!nodePath.isAbsolute(source)) {
        source = nodePath.join(CWD, source);
    }

    return new PathTarget(source);
}
