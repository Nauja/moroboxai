import * as fs from "fs";

/**
 * Remove a directory from disk.
 *
 * ErrnoException is raised only if the error is not ENOENT.
 * @param {string} path - path of the directory
 */
export default async function removeDir(path: string) {
    return new Promise<void>((resolve, reject) => {
        fs.rmdir(path, (err: NodeJS.ErrnoException) => {
            if (err && err.code !== "ENOENT") {
                return reject(err);
            }

            return resolve();
        });
    });
}
