import { BootNotFoundError } from "./errors";
import { EPullResult, pull } from "./pullGame";
import openGame from "./openGame";
import { BOOTS_DIR, CWD } from "./platform";

/**
 * Options for packGame.
 */
export interface PackGameOptions {
    // Path of the game
    path: string;
    // Destination archive
    output?: string;
}

/**
 * Download a boot from any known source.
 *
 * Raise ErrnoException if the src is not found.
 * Raise GameNotFoundError if the game is not found.
 * Raise GameHeaderNotFoundError if the header is not found.
 * @param {PullBootOptions} options - options
 */
export default async function packGame(options: PackGameOptions) {
    const game = await openGame({ game: options.path });
    try {
        await game.pack({ output: options.output });
    } finally {
        try {
            await game.close();
        } catch (err) {}
    }
}
