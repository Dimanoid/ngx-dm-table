export type DmTableGrouppedRows<T> = {
    rows: T[],
    data: any
}

export interface DmTableSort {
    colId: string;
    order: number;
}

export interface DmTableRowEvent<T> {
    index: number;
    row: T;
    event: MouseEvent;
}

export interface DmTableHeaderEvent {
    colId: string;
    index: number;
    first: boolean;
    last: boolean;
    event: MouseEvent;
}

export interface DmTableRowsGroup<T> {
    index: number;
    first: number;
    last: number;
    rows: T[];
    data: any;
}

export interface DmTableRowDragEvent<T> {
    index: number;
    row: T;
    event: DragEvent;
}

export interface DmTableControllerState {
    itemsTotal: number;
    itemsVisible: number;
    itemsSelected: number;
    sort?: DmTableSort;
    sortChanged?: boolean;
}
