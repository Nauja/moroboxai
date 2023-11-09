import listGames from "../utils/listGames";
import printTable from "../utils/printTable";

export default async function () {
    try {
        const games = await listGames();
        printTable(
            ["id", "size"],
            games.map((game) => {
                return {
                    id: game.id,
                    size: game.size,
                };
            })
        );
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
