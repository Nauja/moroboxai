import * as yargs from "yargs";
import remove from "../utils/remove";

export interface Options {
    // Id of the target
    target: string;
}

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await remove({ target: args.target });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command(
        "rm target",
        "Uninstall a game, boot, or agent",
        {
            target: {
                description: "Id of the target",
                type: "string",
            },
        },
        handle
    );
}
