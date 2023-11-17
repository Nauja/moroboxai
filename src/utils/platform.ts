import * as fs from "fs";
import * as path from "path";
import { MOROBOXAI_SOURCE } from "../constants";

export const DATA_DIR =
    process.env.APPDATA !== undefined
        ? path.join(process.env.APPDATA, "MoroboxAI")
        : process.platform == "darwin"
        ? process.env.HOME + "/Library/Preferences/MoroboxAI"
        : process.env.HOME + "/.local/share/moroboxai";

export const GAMES_DIR = path.join(DATA_DIR, "games");
export const BOOTS_DIR = path.join(DATA_DIR, "boots");
export const AGENTS_DIR = path.join(DATA_DIR, "agents");
export const SOURCES_LIST = path.join(DATA_DIR, "sources.list");
const SOURCES_LIST_CONTENT = `# Official MoroboxAI games\n${MOROBOXAI_SOURCE}`;

export const CWD = process.cwd();

/**
 * Create the necessary directories for MoroboxAI.
 */
export function createDirs() {
    [GAMES_DIR, BOOTS_DIR, AGENTS_DIR].forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    [{ path: SOURCES_LIST, content: SOURCES_LIST_CONTENT }].forEach(
        ({ path, content }) => {
            if (!fs.existsSync(path)) {
                fs.writeFileSync(path, content);
            }
        }
    );
}
