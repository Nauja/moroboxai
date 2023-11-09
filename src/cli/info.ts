import { GAMES_DIR } from "../utils/platform";

export default function (): void {
    console.log(`Games dir: ${GAMES_DIR}`);
    process.exit(0);
}
