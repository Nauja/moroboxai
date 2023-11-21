import * as yargs from "yargs";
import pack from "../utils/pack";

interface Options {
    // Target to pack
    target: string;
    // Destination archive
    output?: string;
}

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await pack(args.target, { output: args.output });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command(
        "pack target",
        "Pack a game, boot, or agent",
        (yargs) => {
            return yargs
                .positional<string, yargs.PositionalOptions>("target", {
                    description: "Id or path of the target",
                    type: "string",
                })
                .option<string, yargs.Options>("output", {
                    alias: "o",
                    description: "Output path",
                    type: "string",
                });
        },
        handle
    );
}
