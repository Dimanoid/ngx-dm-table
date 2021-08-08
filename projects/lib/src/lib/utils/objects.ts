export function sumValues(obj: { [id: string]: number }, visible?: { [id: string]: boolean }): number {
    let sum = 0;
    for (const key in obj) {
        if (!visible || visible[key]) {
            sum += obj[key];
        }
    }
    return sum;
}

export function emptyValues(obj: { [id: string]: any }, visible?: { [id: string]: boolean }): number {
    let count = 0;
    for (const key in obj) {
        if ((!visible || visible[key]) && !obj[key]) {
            count++;
        }
    }
    return count;
}
