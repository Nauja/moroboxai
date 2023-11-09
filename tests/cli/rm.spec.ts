import { expect } from "@jest/globals";
import "jest";
import main from "../../src/cli/main";
import removeGame from "../../src/utils/removeGame";
import "../toBeInstalledGame";
import "../toBeNthInstalledGames";
import "../toBeFile";
import "../toBeDirectory";
import { UnexpectedArgumentError } from "../../src/utils/errors";

describe("moroboxai rm", () => {
    it("should not throw", async () => {
        // Remove a game that's not installed
        expect(0).toBeNthInstalledGames();
        await main(["rm", "pong"]);
        expect(0).toBeNthInstalledGames();
    });

    it("should remove game with id", async () => {
        // Pull the game
        await main(["pull", "pong"]);
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();
        // Remove it
        await main(["rm", "pong"]);
        expect(0).toBeNthInstalledGames();
    });

    it("should only accept id", async () => {
        await expect(removeGame({ game: "pong.zip" })).rejects.toThrow(
            UnexpectedArgumentError
        );
    });
});
