import * as yargs from "yargs";
import pack from "../utils/pack";

interface Options {
    // Path of the target
    path: string;
    // Destination archive
    output?: string;
}

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await pack({
            path: args.path,
            output: args.output,
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command(
        "pack path",
        "Pack a game to archive",
        (yargs) => {
            return yargs
                .positional<string, yargs.PositionalOptions>("path", {
                    description: "Path of the game",
                    type: "string",
                })
                .option<string, yargs.Options>("output", {
                    alias: "o",
                    description: "Destination archive",
                    type: "string",
                });
        },
        handle
    );
}
