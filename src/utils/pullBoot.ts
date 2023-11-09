import { BootNotFoundError, UnexpectedArgumentError } from "./errors";
import { EPullResult, NotFoundError, pull } from "./pullGame";
import { BOOTS_DIR } from "./platform";

/**
 * Options for pullBoot.
 */
export interface PullBootOptions {
    // Id or URL of the boot
    boot: string;
    // Force downloading even if the boot exists
    force?: boolean;
    // Destination of the archive
    output?: string;
    // Unpack the archive
    unpack?: boolean;
}

/**
 * Download a boot from any known source.
 *
 * Raise UnexpectedArgumentError for invalid boot argument.
 * Raise EPullError.NotFound if the game is not found.
 * @param {PullBootOptions} options - options
 */
export default async function pullBoot(
    options: PullBootOptions
): Promise<EPullResult> {
    try {
        return pull({
            src: options.boot,
            force: options.force,
            output: options.output ?? BOOTS_DIR,
            unpack: options.unpack,
        });
    } catch (err) {
        // Translate errors
        if (err instanceof NotFoundError) {
            throw new BootNotFoundError(err.id);
        }

        if (err instanceof UnexpectedArgumentError) {
            throw new UnexpectedArgumentError("boot", err.reason);
        }

        throw err;
    }
}
