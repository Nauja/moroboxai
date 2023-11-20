import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import tempFile from "./tempFile";
import { NotFoundError } from "./errors";

/**
 * Options for downloadFile.
 */
export interface DownloadFileOptions {
    /**
     * Path of the destination.
     *
     * A temporary file only is created if this parameter is undefined.
     */
    dst?: string;
    // Timeout of the request
    timeout?: number;
}

async function writeToFile(src: string | URL, options: DownloadFileOptions) {
    return new Promise<void>((resolve, reject) => {
        const url = new URL(src);
        const req = (url.protocol === "http:" ? http : https).get(
            url,
            { timeout: options.timeout },
            (res) => {
                if (res.statusCode === 404) {
                    return reject(new NotFoundError(src.toString()));
                }

                if (res.statusCode !== 200) {
                    return reject(`status code ${res.statusCode}`);
                }

                const fileStream = fs.createWriteStream(options.dst);
                fileStream.on("finish", resolve);
                res.pipe(fileStream);
                res.on("error", reject);
            }
        );
        req.on("error", reject);
    });
}

/**
 * Download a file to disk.
 *
 * Raise NotFoundError for 404 errors.
 * @param {DownloadFileOptions} options - options
 * @returns the path of downloaded file
 */
export default async function downloadFile(
    src: string | URL,
    options: DownloadFileOptions,
    callback: (path: string) => void
): Promise<void> {
    const url = new URL(src);
    const ext = path.parse(url.pathname).ext;

    // Download to temporary file
    await tempFile(
        {
            // Keep the same file extension
            postfix: ext,
        },
        // Callback to handle the downloaded file
        async (path) => {
            // Write to file
            await writeToFile(src, {
                dst: path,
                timeout: options.timeout,
            });

            // Copy to destination
            const dst = options.dst ?? path;
            if (options.dst !== undefined) {
                fs.copyFileSync(path, dst);
            }

            // Notify the caller
            if (callback !== undefined) {
                await callback(dst);
            }
        }
    );
}
