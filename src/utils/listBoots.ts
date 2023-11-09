import * as fs from "fs";
import * as path from "path";
import { BOOTS_DIR } from "./platform";
import { listInstalled } from "./listGames";

export interface Boot {
    path: string;
    id: string;
}

/**
 * List installed boots.
 * @returns boots
 */
export default async function listBoots(): Promise<Boot[]> {
    return listInstalled({
        rootDir: BOOTS_DIR,
        filter: (file) => {
            if (path.parse(file).ext === ".zip") {
                return true;
            }

            return fs.statSync(file).isDirectory();
        },
        transform: async (file): Promise<Boot> => {
            const id = path.parse(file).name;
            return {
                path: path.join(BOOTS_DIR, file),
                id,
            };
        },
    });
}
