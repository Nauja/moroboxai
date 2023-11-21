import * as path from "path";
import { CWD } from "./platform";

/**
 * Make an absolute path.
 * @param {string} value - some path
 * @returns absolute path
 */
export default function makeAbsolute(value: string): string {
    if (!path.isAbsolute(value)) {
        return path.join(CWD, value);
    }

    return value;
}
