import * as path from "path";
import * as platform from "./platform";

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
