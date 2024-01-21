export function SortStringsBy(name: string) {
    return (a: any, b: any) => a[name] == null
        ? (b[name] == null ? 0 : -1)
        : (
            b[name] == null
                ? 1
                : (a[name] as string).toLocaleLowerCase().localeCompare(b[name].toLocaleLowerCase())
        );
}

export function SortNumbersBy(name: string) {
    return (a: any, b: any) => a[name] == null
        ? (b[name] == null ? 0 : -1)
        : (
            b[name] == null
                ? 1
                : a[name] - b[name]
        );
}

export function SortBooleansBy(name: string) {
    return (a: any, b: any) => a[name] == b[name]
        ? 0
        : (a[name] ? -1 : 1);
}

export function multiSortFn<T>(sortFns: ((a: T, b: T) => number)[]): (a: T, b: T) => number {
    return (a: T, b: T) => {
        for (const f of sortFns) {
            const res = f(a, b);
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    }
}
