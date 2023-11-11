import * as path from "path";
import * as platform from "./platform";

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
export default function outputFile(output: string, filename: string): string {
    if (!path.isAbsolute(output)) {
        // Make path relative to CWD
        output = path.join(platform.CWD, output);
    }

    if (path.parse(output).ext === "") {
        // Path without ext => directory => append the filename
        return path.join(output, filename);
    }

    return output;
}
