import * as fs from "fs";
import installPaths from "./installPaths";

export interface IsInstalledOptions {
    // Only searches in builtin directories
    builtinDirsOnly?: boolean;
}
/**
 * Check if an id is installed.
 * @param {string} id - some id
 * @returns if installed
 */
export default function isInstalled(id: string);
export default function isInstalled(id: string, options: IsInstalledOptions);
export default function isInstalled(
    id: string,
    options?: IsInstalledOptions
): boolean {
    for (const path of installPaths({
        target: id,
        builtinDirsOnly: options?.builtinDirsOnly,
    })) {
        if (fs.existsSync(path)) {
            return true;
        }
    }

    return false;
}
