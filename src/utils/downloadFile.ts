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
    // URL of the source
    src: string | URL;
    /**
     * Path of the destination.
     *
     * A temporary file only is created if this parameter is undefined.
     */
    dst?: string;
    // Called after downloading the file
    callback?: (path: string) => void;
}

async function writeToFile(options: DownloadFileOptions) {
    return new Promise<void>((resolve, reject) => {
        const url = new URL(options.src);
        const req = (url.protocol === "http:" ? http : https).get(
            url,
            (res) => {
                if (res.statusCode === 404) {
                    throw new NotFoundError(options.src.toString());
                }

                if (res.statusCode !== 200) {
                    throw `status code ${res.statusCode}`;
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
    options: DownloadFileOptions
): Promise<void> {
    const url = new URL(options.src);
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
            await writeToFile({
                src: options.src,
                dst: path,
            });

            // Copy to destination
            const dst = options.dst ?? path;
            if (options.dst !== undefined) {
                fs.copyFileSync(path, dst);
            }

            // Notify the caller
            if (options.callback !== undefined) {
                await options.callback(dst);
            }
        }
    );
}
