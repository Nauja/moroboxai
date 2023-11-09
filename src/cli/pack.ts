import * as yargs from "yargs";
import packGame from "../utils/packGame";
import { CWD } from "../utils/platform";

export interface Options {
    // Path of the game
    path: string;
    // Destination archive
    output?: string;
}

/**
 * Pack a game to archive.
 * @param args - arguments
 */
export default async function (args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await packGame({
            path: args.path,
            output: args.output,
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
