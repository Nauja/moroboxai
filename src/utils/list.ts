import * as fs from "fs";
import * as path from "path";
import open, { Header } from "./open";
import printTable from "./printTable";

/**
 * List elements installed in a directory.
 * @param options
 * @returns
 */
export async function listInstalled<MappedType>(options: {
    rootDir: string;
    filter: (file: string) => boolean;
    transform: (file: string) => Promise<MappedType>;
}): Promise<MappedType[]> {
    return new Promise<MappedType[]>((resolve) => {
        fs.readdir(options.rootDir, async (err, files) => {
            if (err) {
                return resolve([]);
            }

            const results: MappedType[] = [];
            await Promise.all(
                files.map(
                    (file) =>
                        new Promise<void>(async (resolve) => {
                            try {
                                results.push(await options.transform(file));
                            } catch (err) {}

                            return resolve();
                        })
                )
            );

            return resolve(results);
        });
    });
}

export interface Element {
    path: string;
    id: string;
    header: Header;
    size: number;
}

export interface ListOptions {
    // Directory to list
    rootDir: string;
}

/**
 * List installed games, boots, or agents.
 */
export default async function list(options: ListOptions): Promise<Element[]> {
    return listInstalled({
        rootDir: options.rootDir,
        filter: (file) => {
            if (path.parse(file).ext === ".zip") {
                return true;
            }

            return fs.statSync(file).isDirectory();
        },
        transform: async (file): Promise<Element> => {
            return new Promise<Element>(async (resolve) => {
                const id = path.parse(file).name;
                await open({ target: id }, async (reader) => {
                    return resolve({
                        path: path.join(options.rootDir, file),
                        id,
                        header: await reader.loadHeader(),
                        size: await reader.size(),
                    });
                });
            });
        },
    });
}

export interface PrintListOptions {
    rootDir: string;
}

export async function printList(options: PrintListOptions) {
    const games = await list({ rootDir: options.rootDir });

    printTable(
        ["id", "size"],
        games.map((game) => {
            return {
                id: game.id,
                size: game.size,
            };
        })
    );
}
