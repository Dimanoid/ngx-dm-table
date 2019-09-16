export function emptyCount(arr: number[]): number {
    let count = 0;
    for (const e of arr) {
        if (!e) {
            count++;
        }
    }
    return count;
}
