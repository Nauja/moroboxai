import * as yargs from "yargs";
import unpack from "../utils/unpack";

export interface Options {
    // Id or path of the target
    target: string;
    // Destination directory
    output?: string;
}

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await unpack({ target: args.target, output: args.output });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command(
        "unpack target",
        "Unpack a game, boot, or agent, from archive",
        (yargs) => {
            return yargs
                .positional<string, yargs.PositionalOptions>("target", {
                    description: "Id or path of the target",
                    type: "string",
                })
                .option<string, yargs.Options>("o", {
                    alias: "output",
                    description: "Destination directory",
                    type: "string",
                });
        },
        handle
    );
}
