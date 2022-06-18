import * as StreamZip from 'node-stream-zip';

/**
 * Load a .zip file to memory.
 * @param {string} file - Path to file.
 * @param {function} callback - Called when done.
 */
export function loadZip(file: string, callback: (err: any, zip: StreamZip) => void) {
    const zip = new StreamZip({
        file,
        storeEntries: true
    });

    zip.on('ready', () => {
        callback(undefined, zip);
    });

    zip.on('error', _ => {
        callback(_, undefined);
    });
}

/**
 * Read an entry from a .zip file.
 *
 * ```js
 * data = readZipEntry(zip, 'foo.txt');
 * ```
 *
 * Will raise an exception if entry doesn't exist.
 * @param {StreamZip} zip - Zip file.
 * @param {string} entry - Zip entry.
 * @returns {Buffer} Entry data.
 */
export function readZipEntry(zip: StreamZip, entry: string): Buffer {
    try {
        return zip.entryDataSync(entry);
    } catch (_) {
        throw new Error(`No ${entry}`);
    }
}

/**
 * Read an entry from a .zip file as JSON object.
 *
 * ```js
 * data = readZipEntryJSON(zip, 'foo.txt');
 * ```
 *
 * Will raise an exception if entry doesn't exist or is not
 * a valid JSON file.
 * @param {StreamZip} zip - Zip file.
 * @param {string} entry - Zip entry.
 * @returns {any} JSON object
 */
export function readZipEntryJSON(zip: StreamZip, entry: string): any {
    return JSON.parse(readZipEntry(zip, entry).toString());
}
