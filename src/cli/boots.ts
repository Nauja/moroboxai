import listBoots from "../utils/listBoots";
import printTable from "../utils/printTable";

export default async function () {
    try {
        const boots = await listBoots();
        printTable(
            ["id", "size"],
            boots.map((boot) => {
                return {
                    id: boot.id,
                    size: "tbd",
                };
            })
        );
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
