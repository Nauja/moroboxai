import { expect } from "@jest/globals";
import "jest";
import * as fs from "fs";
import * as path from "path";
import main from "../../src/cli/main";
import { CWD } from "../../src/utils/platform";
import "../toBeInstalledGame";
import "../toBeEqualDirectory";

declare const ENV_DIR: string;
declare const DATA_DIR: string;

describe("moroboxai unpack", () => {
    beforeEach(async () => {
        await main(["pull", "pong"]);

        // Create directory to unpack
        fs.mkdirSync(path.join(ENV_DIR, "unpack"));
    });

    it("should unpack game from id", async () => {
        await main(["unpack", "pong"]);
        const actualDir = path.join(CWD, "pong");
        const expectedDir = path.join(DATA_DIR, "pong");
        expect(actualDir).toBeEqualDirectory(expectedDir);
    });

    it("should unpack game to absolute path", async () => {
        // Unpack the game to <env_dir>/unpack/pong
        const outDir = path.join(ENV_DIR, "unpack");
        await main(["unpack", "-o", outDir, "pong"]);
        expect(path.join(outDir, "pong")).toBeEqualDirectory(
            path.join(DATA_DIR, "pong")
        );
    });

    it("should unpack game to relative path", async () => {
        // Unpack the game to ./unpack/pong
        await main(["unpack", "-o", "./unpack", "pong"]);
        expect(path.join(ENV_DIR, "unpack", "pong")).toBeEqualDirectory(
            path.join(DATA_DIR, "pong")
        );
    });
});
