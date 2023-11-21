import * as yargs from "yargs";
import pull from "../utils/pull";
import type { SourcesOptions } from "../utils/pull/types";

type Options = Partial<SourcesOptions> & {
    // Id or URL of the target
    target: string;
    // Pull even if the target is already installed
    force?: boolean;
    // Destination of the archive
    output?: string;
    // Unpack the archive
    unpack?: boolean;
};

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await pull(args.target, {
            force: args.force,
            output: args.output,
            unpack: args.unpack,
            sources: args.sources,
            extraSources: args.extraSources,
        });
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
                    description: "Destination path",
                    type: "string",
                })
                .option<string, yargs.Options>("sources", {
                    description: "Override default sources",
                    type: "array",
                })
                .option<string, yargs.Options>("extra-sources", {
                    description: "Additional sources",
                    type: "array",
                });
        },
        handle
    );
}
