import * as fs from "fs";
import * as tmp from "tmp";

/**
 * Options for tempFile.
 */
export interface TempFileOptions {
    // Postfix for the generated name
    postfix?: string;
}

function isOptions(
    value: TempFileOptions | ((path: string) => void)
): value is TempFileOptions {
    return typeof value === "object";
}

/**
 * Create a temporary file name.
 */
function tempFile(callback: (path: string) => Promise<void>): Promise<void>;
function tempFile(
    options: TempFileOptions,
    callback: (path) => Promise<void>
): Promise<void>;
async function tempFile(
    options?: TempFileOptions | ((path: string) => Promise<void>),
    callback?: (path: string) => Promise<void>
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (!isOptions(options)) {
            callback = options;
            options = {};
        }

        tmp.tmpName({ postfix: options.postfix }, async (err, path) => {
            if (err) {
                return reject(err);
            }

            try {
                if (callback !== undefined) {
                    await callback(path);
                }
                return resolve();
            } catch (err) {
                return reject(err);
            } finally {
                try {
                    fs.unlinkSync(path);
                } catch (err) {}
            }
        });
    });
}

export default tempFile;
