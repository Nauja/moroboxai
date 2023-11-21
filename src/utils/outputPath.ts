import makeAbsolute from "./makeAbsolute";

/**
 * Make sure the output path points to a file.
 *
 * The output path is returned unchanged if it ends with a file
 * extension. Otherwise, it is returned with filename appended to it.
 *
 * This is to ensure that some path entered by the user always
 * points to a file, and not a directory.
 *
 * @param {string} output - some path
 * @param {string} filename - default filename
 * @returns output path
 */
export default function outputPath(def: string, output?: string): string {
    return makeAbsolute(output ?? def);
}
