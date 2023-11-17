import { expect } from "@jest/globals";
import "jest";
import "../toBeInstalledGame";
import "../toBeNthInstalledGames";
import "../toBeInstalledBoot";
import "../toBeNthInstalledBoots";
import "../toBeInstalledAgent";
import "../toBeNthInstalledAgents";
import "../toBeFile";
import "../toBeDirectory";
import { SOURCES_LIST } from "../../src/utils/platform";

describe("moroboxai", () => {
    it("should have sources.list", async () => {
        console.log(SOURCES_LIST);
        expect(SOURCES_LIST).toBeFile();
    });

    it("should not have anything installed", async () => {
        expect(0).toBeNthInstalledGames();
        expect(0).toBeNthInstalledBoots();
        expect(0).toBeNthInstalledAgents();
    });
});
