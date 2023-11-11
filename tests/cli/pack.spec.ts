import { expect } from "@jest/globals";
import "jest";
import * as fs from "fs";
import * as path from "path";
import main from "../../src/cli/main";
import { CWD } from "../../src/utils/platform";
import "../toBeEqualFile";

declare const ENV_DIR: string;
declare const DATA_DIR: string;

beforeEach(() => {
    // Create directory to pack
    fs.mkdirSync(path.join(ENV_DIR, "pack"));
});

describe("moroboxai pack", () => {
    it("should pack game from directory", async () => {
        // Pack the game to ./pong.zip
        await main(["pack", path.join(DATA_DIR, "pong")]);
        const actualArchive = path.join(CWD, "pong.zip");
        const expectedArchive = path.join(DATA_DIR, "pong.zip");
        expect(actualArchive).toBeEqualFile(expectedArchive);
    });

    it("should pack game to absolute path", async () => {
        // Pack the game to <env_dir>/pack/pong.zip
        const output = path.join(ENV_DIR, "pack", "pong.zip");
        await main(["pack", "-o", output, path.join(DATA_DIR, "pong")]);
        expect(output).toBeEqualFile(path.join(DATA_DIR, "pong.zip"));
    });

    it("should pack game to relative path", async () => {
        // Pack the game to ./pack/pong.zip
        await main([
            "pack",
            "-o",
            "./pack/pong.zip",
            path.join(DATA_DIR, "pong"),
        ]);
        expect(path.join(ENV_DIR, "pack", "pong.zip")).toBeEqualFile(
            path.join(DATA_DIR, "pong.zip")
        );
    });
});
