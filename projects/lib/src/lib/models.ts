export interface DmTableSort {
    colId: string;
    order: number;
}

export interface DmTableRowEvent {
    index: number;
    row: any;
    event: MouseEvent;
}

export interface DmTableHeaderEvent {
    colId: string;
    index: number;
    first: boolean;
    last: boolean;
    event: MouseEvent;
}

export interface DmTableRowsGroup {
    index: number;
    first: number;
    last: number;
    rows: any[];
    data: any;
}

export interface DmTableRowDragEvent {
    index: number;
    row: any;
    event: DragEvent;
}
