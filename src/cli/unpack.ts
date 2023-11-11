import * as yargs from "yargs";
import unpackGame from "../utils/unpackGame";

/**
 * Options for unpackGame.
 */
export interface Options {
    // Id or path of the game
    path: string;
    // Destination directory
    output?: string;
}

/**
 * Unpack a game from archive.
 * @param args - arguments
 */
export default async function (args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await unpackGame({ game: args.path, output: args.output });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
