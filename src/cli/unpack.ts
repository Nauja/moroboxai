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
        await unpack(args.target, { output: args.output });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command(
        "unpack target",
        "Unpack a game, boot, or agent",
        (yargs) => {
            return yargs
                .positional<string, yargs.PositionalOptions>("target", {
                    description: "Id or path of the target",
                    type: "string",
                })
                .option<string, yargs.Options>("o", {
                    alias: "output",
                    description: "Output directory",
                    type: "string",
                });
        },
        handle
    );
}
