import * as path from "path";
import * as fs from "fs";
import { expect } from "@jest/globals";
import * as platform from "../src/utils/platform";

/**
 * Check that an agent is installed.
 */
expect.extend({
    toBeInstalledAgent(actual) {
        if (typeof actual !== "string") {
            throw new Error("Must be of type string!");
        }

        if (!fs.existsSync(path.join(platform.AGENTS_DIR, `${actual}.zip`))) {
            return {
                pass: false,
                message: () =>
                    `expected ${(this as any).utils.printReceived(
                        actual
                    )} agent to be installed`,
            };
        }

        return {
            pass: true,
            message: () =>
                `expected ${(this as any).utils.printReceived(
                    actual
                )} agent to not be installed`,
        };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeInstalledAgent(): void;
    }
    interface Matchers<R> {
        toBeInstalledAgent(): R;
    }
}
