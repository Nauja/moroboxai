import { expect } from "@jest/globals";
import "jest";
import * as path from "path";
import main from "../../src/cli/main";
import { CWD } from "../../src/utils/platform";
import "../toBeEqualFile";

declare const ENV_DIR: string;
declare const DATA_DIR: string;

const mockExit = jest.spyOn(process, "exit").mockImplementation((number) => {
    if (number !== 0) {
        throw new Error("process.exit: " + number);
    }

    return undefined as never;
});

describe("moroboxai pack", () => {
    it("should pack game from directory", async () => {
        // Pack the game to pong.zip
        await main(["pack", path.join(DATA_DIR, "pong")]);
        const actualArchive = path.join(CWD, "pong.zip");
        const expectedArchive = path.join(DATA_DIR, "pong.zip");
        expect(actualArchive).toBeEqualFile(expectedArchive);
    });

    it("should pack game to output directory", async () => {
        // Pack the game to <env_dir>/pong.zip
        await main(["pack", "-o", ENV_DIR, path.join(DATA_DIR, "pong")]);
        const actualArchive = path.join(ENV_DIR, "pong.zip");
        const expectedArchive = path.join(DATA_DIR, "pong.zip");
        expect(actualArchive).toBeEqualFile(expectedArchive);
    });

    it("should pack game to output file", async () => {
        // Pack the game to ping.zip
        await main(["pack", "-o", "ping.zip", path.join(DATA_DIR, "pong")]);
        const actualArchive = path.join(CWD, "ping.zip");
        const expectedArchive = path.join(DATA_DIR, "pong.zip");
        expect(actualArchive).toBeEqualFile(expectedArchive);
    });
});
