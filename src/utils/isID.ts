import * as path from "path";

/**
 * Check a string is an id.
 * @param {string} value - some string
 * @returns if an id
 */
export default function isID(value: string): boolean {
    try {
        return path.parse(value).name === value;
    } catch (err) {
        return false;
    }
}
