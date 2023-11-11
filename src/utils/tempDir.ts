import * as fs from "fs";
import * as tmp from "tmp";

/**
 * Options for tempDir.
 */
export interface TempDirOptions {
    // Don't delete the directory after
    preserve?: boolean;
}

function isOptions(
    value: TempDirOptions | ((path: string) => void)
): value is TempDirOptions {
    return typeof value === "object";
}

/**
 * Create a temporary directory name.
 */
function tempDir(callback: (path: string) => Promise<void>): Promise<void>;
function tempDir(
    options: TempDirOptions,
    callback: (path) => Promise<void>
): Promise<void>;
async function tempDir(
    options?: TempDirOptions | ((path: string) => Promise<void>),
    callback?: (path: string) => Promise<void>
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let _options: TempDirOptions = {};
        if (!isOptions(options)) {
            callback = options;
        } else {
            _options = options;
        }

        tmp.dir(async (err, path, cleanupCallback) => {
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
                if (_options.preserve !== true) {
                    try {
                        fs.rmSync(path, { recursive: true, force: true });
                    } catch (err) {}
                    try {
                        cleanupCallback();
                    } catch (err) {}
                }
            }
        });
    });
}

export default tempDir;
