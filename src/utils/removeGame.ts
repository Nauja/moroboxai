import * as fs from "fs";
import * as path from "path";
import { GAMES_DIR } from "./platform";
import removeFile from "./removeFile";
import removeDir from "./removeDir";
import isID from "./isID";
import { UnexpectedArgumentError } from "./errors";

export interface RemoveGameOptions {
    // Id of the game
    game: string;
}

/**
 * Remove a game from disk.
 *
 * Raise UnexpectedArgumentError if the game is not an id.
 * Raise ErrnoException only if the error is not ENOENT.
 * @param {RemoveGameOptions} options - options
 */
export default async function removeGame(options: RemoveGameOptions) {
    if (!isID(options.game)) {
        throw new UnexpectedArgumentError("game", "should be a game id");
    }

    // Remove games/<game>.zip
    await removeFile(path.join(GAMES_DIR, `${options.game}.zip`));
    // Remove games/<game>
    await removeDir(path.join(GAMES_DIR, options.game));
}
