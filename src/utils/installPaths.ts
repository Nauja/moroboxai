import * as path from "path";
import { AGENTS_DIR, BOOTS_DIR, CWD, GAMES_DIR } from "./platform";

export interface InstallPathsOptions {
    // Id or path of the target
    target: string;
    // Only searches in builtin directories
    builtinDirsOnly?: boolean;
}

/**
 * Return the possible install paths for a target.
 * @param {string} target - id or path of the target
 */
export default function* installPaths(
    options: InstallPathsOptions
): Generator<string, void, void> {
    // Test the path itself
    if (options.builtinDirsOnly !== true) {
        if (path.isAbsolute(options.target)) {
            yield options.target;
        } else {
            yield path.join(CWD, options.target);
        }
    }

    // Test from the builtin dirs
    for (const dir of [GAMES_DIR, BOOTS_DIR, AGENTS_DIR]) {
        yield path.join(dir, `${options.target}.zip`);
    }
}
