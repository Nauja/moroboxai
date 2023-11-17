import * as path from "path";
import { AGENTS_DIR, BOOTS_DIR, CWD, GAMES_DIR } from "./platform";

/**
 * Return the possible install paths for a target.
 * @param {string} target - id or path of the target
 */
export default function* installPaths(
    target: string
): Generator<string, void, void> {
    // Test the path itself
    if (path.isAbsolute(target)) {
        yield target;
    } else {
        yield path.join(CWD, target);
    }

    // Test from the builtin dirs
    for (const dir of [GAMES_DIR, BOOTS_DIR, AGENTS_DIR]) {
        yield path.join(dir, `${target}.zip`);
    }
}
