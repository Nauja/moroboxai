import * as yargs from "yargs";
import pull, { EPullResult } from "../utils/pull";

interface Options {
    // Id or URL of the target
    target: string;
    // Pull even if the target is already installed
    force?: boolean;
    // Destination of the archive
    output?: string;
    // Unpack the archive
    unpack?: boolean;
}

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    console.log(`Pulling ${args.target}...`);

    try {
        const result = await pull({
            target: args.target,
            force: args.force,
            output: args.output,
            unpack: args.unpack,
        });
        if (result === EPullResult.Downloaded) {
            console.log("Installed");
        } else if (result === EPullResult.AlreadyDownloaded) {
            console.log("Already installed");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command(
        "pull target",
        "Install a game, boot, or agent",
        (yargs) => {
            return yargs
                .positional<string, yargs.PositionalOptions>("target", {
                    description: "Id or URL of the target",
                    type: "string",
                })
                .option<string, yargs.Options>("force", {
                    alias: "f",
                    description: "Pull even if the target is already installed",
                    type: "boolean",
                    default: false,
                })
                .option<string, yargs.Options>("unpack", {
                    alias: "u",
                    description: "Unpack the archive",
                    type: "boolean",
                    default: false,
                })
                .option<string, yargs.Options>("output", {
                    alias: "o",
                    description:
                        "Destination archive (only used with --unpack)",
                    type: "string",
                });
        },
        handle
    );
}
