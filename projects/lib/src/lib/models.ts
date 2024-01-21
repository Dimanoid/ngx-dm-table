export type DmTableGrouppedRows<T> = {
    id?: string;
    rows: T[];
    data: any;
    collapsible?: boolean;
    collapsed?: boolean;
}

export type DmTableSort = {
    [colId: string]: number;
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
    id: string;
    index: number;
    first: number;
    last: number;
    // rows: T[];
    data: any;
    collapsible?: boolean;
    collapsed?: boolean;
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
