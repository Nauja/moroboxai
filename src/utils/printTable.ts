export default function printTable(keys: string[], data: any[]) {
    console.log(keys.map((key) => `${key.toUpperCase()}\t\t`).join(""));
    data.forEach((line) => {
        console.log(keys.map((key) => `${line[key]}\t\t`).join(""));
    });
}
