export function emptyCount(arr: number[]): number {
    let count = 0;
    for (const item of arr) {
        if (!item) {
            count++;
        }
    }
    return count;
}
