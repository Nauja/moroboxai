import * as path from "path";
import * as fs from "fs";

export function copyPongArchive(output: string) {
    fs.cpSync(path.join(global.DATA_GAMES_DIR, "pong.zip"), output);
}

export function copyPongDir(output: string) {
    fs.cpSync(path.join(global.DATA_GAMES_DIR, "pong"), output, {
        recursive: true,
        force: true,
    });
}
