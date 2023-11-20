import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { SOURCES_LIST } from "./platform";
import type { Source } from "./source";
import makeSource from "./source";
import type { SourcesOptions } from "./pull/types";

export type GetSourcesOptions = Partial<SourcesOptions> & {};

/**
 * Read known sources from sources.list and/or options.
 * @returns a list of sources
 */
export default async function* getSources(
    options?: GetSourcesOptions
): AsyncGenerator<Source, void, void> {
    async function* iterSources(): AsyncGenerator<string, void, void> {
        // Sources from options override the sources file
        if (options.sources !== undefined) {
            for (const source of options.sources) {
                yield source;
            }

            return;
        }

        // Parse the sources file
        const stream = fs.createReadStream(SOURCES_LIST);
        try {
            for await (const line of options?.sources !== undefined
                ? options.sources
                : readline.createInterface({
                      input: stream,
                      crlfDelay: Infinity,
                  })) {
                let i = line.indexOf("#");
                if (i < 0) {
                    i = undefined;
                }

                // Allow URL
                let source = line.substring(0, i).trim();
                if (source.startsWith("http:") || source.startsWith("https:")) {
                    if (!source.endsWith("/")) {
                        source += "/";
                    }

                    yield source;
                }

                // Allow absolute path
                if (path.isAbsolute(source)) {
                    yield source;
                }
            }
        } finally {
            stream.destroy();
        }
    }

    for await (const source of iterSources()) {
        yield await Promise.resolve(makeSource(source));
    }

    // Extra sources from options
    if (options?.extraSources !== undefined) {
        for (const source of options.extraSources) {
            yield await Promise.resolve(makeSource(source));
        }
    }
}
