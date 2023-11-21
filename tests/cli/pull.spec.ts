import { expect } from "@jest/globals";
import "jest";
import * as path from "path";
import * as fs from "fs";
import main from "../../src/cli/main";
import pull from "../../src/utils/pull";
import "../toBeInstalledGame";
import "../toBeNthInstalledGames";
import "../toBeInstalledBoot";
import "../toBeNthInstalledBoots";
import "../toBeInstalledAgent";
import "../toBeNthInstalledAgents";
import "../toBeFile";
import "../toBeDirectory";
import { copyPongArchive, copyPongDir } from "../copyPong";
import { EPullResult } from "../../src/utils/pull/types";

declare const FILE_SERVER_URL: string;
declare const ENV_DIR: string;
declare const DATA_GAMES_DIR: string;

describe("moroboxai pull", () => {
    beforeEach(() => {
        expect(0).toBeNthInstalledGames();
        expect(0).toBeNthInstalledBoots();
        expect(0).toBeNthInstalledAgents();
    });

    it("should pull game with id", async () => {
        await main(["pull", "pong"]);
        expect(1).toBeNthInstalledGames();
        expect(0).toBeNthInstalledBoots();
        expect(0).toBeNthInstalledAgents();
        expect("pong").toBeInstalledGame();
    });

    it("should pull boot with id", async () => {
        await pull("Moroxel8AI", {
            timeout: 1,
        });
        expect(0).toBeNthInstalledGames();
        expect(1).toBeNthInstalledBoots();
        expect(0).toBeNthInstalledAgents();
        expect("Moroxel8AI").toBeInstalledBoot();
    });

    it("should pull agent with id", async () => {
        await pull("random-agent", {
            timeout: 1,
        });
        expect(0).toBeNthInstalledGames();
        expect(0).toBeNthInstalledBoots();
        expect(1).toBeNthInstalledAgents();
        expect("random-agent").toBeInstalledAgent();
    });

    it("should pull game with relative file", async () => {
        // Copy the pong game to test directory
        copyPongArchive(path.join(ENV_DIR, "pong.zip"));

        // Try to pull with relative path
        await main(["pull", `./pong.zip`]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull game with absolute file", async () => {
        // Try to pull with absolute path
        await main(["pull", path.join(DATA_GAMES_DIR, "pong.zip")]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull game with relative directory", async () => {
        // Copy the pong game to test directory
        copyPongDir(path.join(ENV_DIR, "pong"));

        // Try to pull with relative path
        await main(["pull", `./pong`]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull game with absolute directory", async () => {
        // Try to pull with absolute path
        await main(["pull", path.join(DATA_GAMES_DIR, "pong")]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull game with HTTP URL", async () => {
        await main(["pull", `${FILE_SERVER_URL}/games/pong.zip`]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull from custom sources", async () => {
        // Create a directory for the custom sources
        const sourcesDir = path.join(ENV_DIR, "sources");
        fs.mkdirSync(sourcesDir);

        // Copy the pong game to it
        copyPongArchive(path.join(sourcesDir, "custom-pong.zip"));

        // Pull from the custom sources
        await main(["pull", "custom-pong", "--sources", sourcesDir]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull from extra sources", async () => {
        // Create a directory for the custom sources
        const sourcesDir = path.join(ENV_DIR, "sources");
        fs.mkdirSync(sourcesDir);

        // Copy the pong game to it
        copyPongArchive(path.join(sourcesDir, "extra-pong.zip"));

        await main(["pull", "extra-pong", "--extra-sources", sourcesDir]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should not pull already installed game", async () => {
        expect(0).toBeNthInstalledGames();

        // First pull
        expect(await pull("pong")).toBe(EPullResult.Downloaded);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();

        // Try to pull again
        expect(await pull("pong")).toBe(EPullResult.AlreadyDownloaded);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should force pull already installed game", async () => {
        expect(0).toBeNthInstalledGames();

        // First pull
        expect(await pull("pong")).toBe(EPullResult.Downloaded);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();

        // Try to force pull
        expect(await pull("pong", { force: true })).toBe(
            EPullResult.Downloaded
        );
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
    });

    it("should pull game to relative file", async () => {
        const output = path.join(ENV_DIR, "ping.zip");
        await main(["pull", "pong", "-o", "./ping.zip"]);
        expect(0).toBeNthInstalledGames();
        expect(output).toBeFile();
    });

    it("should pull game to absolute file", async () => {
        const output = path.join(ENV_DIR, "ping.zip");
        await main(["pull", "pong", "-o", output]);
        expect(0).toBeNthInstalledGames();
        expect(output).toBeFile();
    });

    it("should pull game to relative file", async () => {
        await main(["pull", "pong", "-o", "./pong.zip"]);
        // 0 as the game is installed in a custom location
        expect(0).toBeNthInstalledGames();
        // The default pong.zip filename should be used
        expect(path.join(ENV_DIR, "pong.zip")).toBeFile();
    });

    it("should pull game to absolute file", async () => {
        const output = path.join(ENV_DIR, "pong.zip");
        await main(["pull", "pong", "-o", output]);
        // 0 as the game is installed in a custom location
        expect(0).toBeNthInstalledGames();
        // The default pong.zip filename should be used
        expect(output).toBeFile();
    });

    it("should pull game and unpack to absolute directory", async () => {
        await main(["pull", "pong", "-u", "-o", ENV_DIR]);
        expect(0).toBeNthInstalledGames();
        // The game should be unpacked to that directory
        expect(path.join(ENV_DIR, "pong")).toBeDirectory();
        expect(path.join(ENV_DIR, "pong", "header.yml")).toBeFile();
    });
});
