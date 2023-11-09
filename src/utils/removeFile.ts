import * as fs from "fs";

/**
 * Remove a file from disk.
 *
 * ErrnoException is raised only if the error is not ENOENT.
 * @param {string} path - path of the file
 */
export default async function removeFile(path: string) {
    return new Promise<void>((resolve, reject) => {
        fs.rm(path, { force: true }, (err: NodeJS.ErrnoException) => {
            if (err) {
                return reject(err);
            }

            return resolve();
        });
    });
}
