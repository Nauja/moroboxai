import * as path from "path";
import * as fs from "fs";
import { expect } from "@jest/globals";
import * as platform from "../src/utils/platform";

/**
 * Check that a boot is installed.
 */
expect.extend({
    toBeInstalledBoot(actual) {
        if (typeof actual !== "string") {
            throw new Error("Must be of type string!");
        }

        if (!fs.existsSync(path.join(platform.BOOTS_DIR, `${actual}.zip`))) {
            return {
                pass: false,
                message: () =>
                    `expected ${(this as any).utils.printReceived(
                        actual
                    )} boot to be installed`,
            };
        }

        return {
            pass: true,
            message: () =>
                `expected ${(this as any).utils.printReceived(
                    actual
                )} boot to not be installed`,
        };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeInstalledBoot(): void;
    }
    interface Matchers<R> {
        toBeInstalledBoot(): R;
    }
}
