import { expect } from "@jest/globals";
import "jest";
import main from "../../src/cli/main";
import "../toBeInstalledGame";
import "../toBeNthInstalledGames";
import "../toBeInstalledBoot";
import "../toBeNthInstalledBoots";
import "../toBeFile";
import "../toBeDirectory";

describe("moroboxai run", () => {
    it("should setup game", async () => {
        expect(0).toBeNthInstalledGames();
        expect(0).toBeNthInstalledBoots();
        await main(["run", "-e", "pong"]);

        // Game should have been installed
        expect(1).toBeNthInstalledGames();
        expect("pong").toBeInstalledGame();

        // Boot should have been installed
        expect(1).toBeNthInstalledBoots();
        expect("Moroxel8AI").toBeInstalledBoot();
    });
});
