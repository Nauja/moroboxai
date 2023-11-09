import { expect } from "@jest/globals";
import "jest";
import * as path from "path";
import main from "../../src/cli/main";
import pullGame, { EPullResult } from "../../src/utils/pullGame";
import "../toBeInstalledGame";
import "../toBeNthInstalledGames";
import "../toBeFile";
import "../toBeDirectory";
import { UnexpectedArgumentError } from "../../src/utils/errors";

declare const FILE_SERVER_URL: string;
declare const ENV_DIR: string;

describe("moroboxai pull", () => {
    it("should not have games installed", async () => {
        expect(0).toBeNthInstalledGames();
    });

    it("should pull game with id", async () => {
        await main(["pull", "pong"]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull game with HTTP URL", async () => {
        await main(["pull", `${FILE_SERVER_URL}/pong.zip`]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    /**
     * Only two modes are supported, either downloading by id => it
     * will search for id.zip on every source available, or by
     * URL => it will directly download from the URL.
     */
    it("should only accept id or URL", async () => {
        await expect(pullGame({ game: `pong.zip` })).rejects.toThrow(
            UnexpectedArgumentError
        );
    });

    // Only games archived as .zip can be downloaded and unpacked
    it("should only accept .zip URLs", async () => {
        await expect(
            pullGame({ game: `${FILE_SERVER_URL}/pong.txt` })
        ).rejects.toThrow(UnexpectedArgumentError);
    });

    it("should not pull already installed game", async () => {
        expect(0).toBeNthInstalledGames();
        // First pull
        expect(await pullGame({ game: "pong" })).toBe(EPullResult.Downloaded);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
        // Try to pull again
        expect(await pullGame({ game: "pong" })).toBe(
            EPullResult.AlreadyDownloaded
        );
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should force pull already installed game", async () => {
        expect(0).toBeNthInstalledGames();
        // First pull
        expect(await pullGame({ game: "pong" })).toBe(EPullResult.Downloaded);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
        // Try to force pull
        expect(await pullGame({ game: "pong", force: true })).toBe(
            EPullResult.Downloaded
        );
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull game to custom directory", async () => {
        await main(["pull", "pong", "-o", ENV_DIR]);
        // 0 as the game is installed in a custom location
        expect(0).toBeNthInstalledGames();
        // The default pong.zip filename should be used
        expect(path.join(ENV_DIR, "pong.zip")).toBeFile();
    });

    it("should pull game to custom filename", async () => {
        const output = path.join(ENV_DIR, "ping.zip");
        await main(["pull", "pong", "-o", output]);
        expect(0).toBeNthInstalledGames();
        expect(output).toBeFile();
    });

    it("should pull game and unpack to custom directory", async () => {
        await main(["pull", "pong", "-u", "-o", ENV_DIR]);
        expect(0).toBeNthInstalledGames();
        // The game should be unpacked to that directory
        expect(path.join(ENV_DIR, "pong")).toBeDirectory();
        expect(path.join(ENV_DIR, "pong", "header.yml")).toBeFile();
    });
});
