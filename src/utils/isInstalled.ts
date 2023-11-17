import * as fs from "fs";
import installPaths from "./installPaths";

/**
 * Check if an id is installed.
 * @param {string} id - some id
 * @returns if installed
 */
export default function isInstalled(id: string): boolean {
    for (const path of installPaths(id)) {
        if (fs.existsSync(path)) {
            return true;
        }
    }

    return false;
}
