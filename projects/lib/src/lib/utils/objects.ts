export function sumValues(obj: { [id: string]: number }) {
    const values = Object.values(obj);
    return values && values.length > 0 ? values.reduce((a, b) => a + b) : 0;
}

export function emptyValues(obj: { [id: string]: any }) {
    const values = Object.values(obj);
    return values && values.length > 0 ? values.reduce((a, b) => a + (b ? 1 : 0)) : 0;
}
