import * as fs from 'fs';
import * as StreamZip from 'node-stream-zip';

const GAME_HEADER_NAME: string = 'header.json';

/**
 * Read a game header.
 *
 * ```js
 * readGameHeader('/some/file.zip', (err, header) => {
 *     if (err !== undefined) {
 *         console.error(err);
 *         return;
 *     }
 *
 *     console.log(header);
 * });
 * ```
 *
 * Each game is bundled in a .zip with a header.json file
 * containing the game metadata. This function reads the
 * content of header.json as a JSON object.
 *
 * callback will be called with either:
 * * err if an IO error occured.
 * * header if header.json was successfully parsed.
 * @param {string} file - Game .zip file.
 * @param {function} callback - Function called when done or an error occured.
 */
function readGameHeader(file: string, callback: (err: any, header: any) => void): void {
    // open zip file
    const zip = new StreamZip({
        file,
        storeEntries: true
    });

    // read header content
    zip.on('ready', () => {
        let content: string;
        let header: any;

        // try to read header
        try {
            content = zip.entryDataSync(GAME_HEADER_NAME).toString();
        } catch(_) {
            if (callback !== undefined) {
                callback(new Error(`No ${GAME_HEADER_NAME}`), undefined);
            }
            return;
        }

        // try to parse
        try {
            header = JSON.parse(content);
        } catch(_) {
            if (callback !== undefined) {
                callback(_, undefined);
            }
            return;
        }

        // found game header
        zip.close();
        if (callback !== undefined) {
            callback(undefined, header);
        }
    });

    // couldn't read zip file
    zip.on('error', _ => {
        if (callback !== undefined) {
            callback(_, undefined);
        }
    });
}

/**
 * Read games headers bundled in zip files.
 *
 * ```js
 * readGamesHeaders(['a.zip', 'b.zip'], (err, file, header) => {
 *     if (err !== undefined) {
 *         console.error(err);
 *         return;
 *     }
 *
 *     console.log(file, header);
 * }, () => {
 *     console.log('done');
 * });
 * ```
 *
 * Each game is bundled in a .zip archive and contains a
 * header.json file describing the game.
 *
 * callback will be called for each file when:
 *   * There is no header.json in the .zip file.
 *   * header.json file can't be parsed.
 *   * an header.json file has been found and parsed.
 *
 * done will be called when process complete.
 * @param {string[]} files - Games directory.
 * @param {function} callback - Function called for each file.
 * @param {function} done - Function called when done.
 */
function readGamesHeaders(files: string[], callback: (err: any | null, file: string, header: any) => void, done: () => void): void {
    // map each file to a promise and wait for all
    Promise.all(
        files.map(file => new Promise((resolve, _) => {
            readGameHeader(file, (err, header) => {
                // callback is called for each file
                if (callback !== undefined) {
                    callback(err, file, header);
                }
                resolve();
            });
        }))
    ).then(done);
}

/**
 * List .zip files contained in a directory.
 *
 * ```js
 * listZipFiles('/some/dir', (err, files) => {
 *     if (err !== undefined) {
 *         console.error(err);
 *         return;
 *     }
 *
 *     console.log(files);
 * });
 * ```
 *
 * @param {string} root - Parent directory.
 * @param {function} callback - Function called on completion.
 */
function listZipFiles(root: string, callback: (err: any | null, files: string[]) => void): void {
    fs.readdir(root, (err, files) => {
        // couldn't access the directory
        if (err) {
            callback(err, undefined);
            return;
        }

        // list zip files
        callback(undefined, files.filter(file => file.endsWith('.zip')));
    });
}

export { readGameHeader, readGamesHeaders, listZipFiles };
