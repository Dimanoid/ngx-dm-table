export function sumValues(obj: { [id: string]: number }) {
    return Object.values(obj).reduce((a, b) => a + b);
}

export function emptyValues(obj: { [id: string]: any }) {
    return Object.values(obj).reduce((a, b) => a + (b ? 1 : 0));
}
