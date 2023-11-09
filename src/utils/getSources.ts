import * as fs from "fs";
import * as readline from "readline";
import { SOURCES_LIST } from "./platform";

export interface GetSourcesOptions {
    // The list of sources
    sources?: string[];
    // Additional sources
    extraSources?: string[];
}

/**
 * Read known sources from sources.list.
 * @returns a list of sources
 */
export default async function* getSources(
    options?: GetSourcesOptions
): AsyncGenerator<string, void, void> {
    const stream = fs.createReadStream(SOURCES_LIST);
    try {
        async function* iterSources(): AsyncGenerator<string, void, void> {
            // Iterate from options or the sources file
            for await (const line of options?.sources !== undefined
                ? options.sources
                : readline.createInterface({
                      input: stream,
                      crlfDelay: Infinity,
                  })) {
                yield line;
            }

            // Iterate from extra sources
            if (options?.extraSources !== undefined) {
                for (const line of options.extraSources) {
                    yield line;
                }
            }
        }

        for await (const line of iterSources()) {
            let i = line.indexOf("#");
            if (i < 0) {
                i = undefined;
            }
            let source = line.substring(0, i).trim();
            if (source.startsWith("http:") || source.startsWith("https:")) {
                if (!source.endsWith("/")) {
                    source += "/";
                }

                yield await Promise.resolve(source);
            }
        }
    } finally {
        stream.destroy();
    }
}
