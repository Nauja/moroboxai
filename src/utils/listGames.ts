import * as fs from "fs";
import * as path from "path";
import { GameHeader } from "moroboxai-game-sdk";
import { GAMES_DIR } from "./platform";
import openGame from "./openGame";

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

export interface Game {
    path: string;
    id: string;
    header: GameHeader;
    size: number;
}

/**
 * List installed games.
 * @returns games
 */
export default async function listGames(): Promise<Game[]> {
    return listInstalled({
        rootDir: GAMES_DIR,
        filter: (file) => {
            if (path.parse(file).ext === ".zip") {
                return true;
            }

            return fs.statSync(file).isDirectory();
        },
        transform: async (file): Promise<Game> => {
            const id = path.parse(file).name;
            const game = await openGame({ game: id });

            return {
                path: path.join(GAMES_DIR, file),
                id,
                header: await game.loadHeader(),
                size: await game.size(),
            };
        },
    });
}
