import * as fs from "fs";
import { expect } from "@jest/globals";
import * as platform from "../src/utils/platform";

/**
 * Check that the expected number is the number of installed games.
 */
expect.extend({
    toBeNthInstalledGames(expected) {
        if (typeof expected !== "number") {
            throw new Error("Must be of type number!");
        }

        const actual = fs.readdirSync(platform.GAMES_DIR).length;
        return actual === expected
            ? {
                  pass: true,
                  message: () =>
                      `expected to not have ${(this as any).utils.printReceived(
                          expected
                      )} games installed`,
              }
            : {
                  pass: false,
                  message: () =>
                      `expected to have ${(this as any).utils.printReceived(
                          expected
                      )} games installed`,
              };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeNthInstalledGames(): void;
    }
    interface Matchers<R> {
        toBeNthInstalledGames(): R;
    }
}
