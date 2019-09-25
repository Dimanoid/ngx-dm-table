import { Injectable } from '@angular/core';

export const DMT_CONFIG_FIELDS = [
    'pinnable', 'sortable', 'resizeable', 'whitespace', 'minWidth', 'maxWidth', 'headerClass', 'cellClass', 'footerClass', 'sort'
];

export class DmTableColumnConfig {
    pinnable: boolean = false;
    sortable: boolean = false;
    resizeable: boolean = true;
    whitespace: string = 'normal';
    minWidth: number = undefined;
    headerClass: string;
    cellClass: string;
    footerClass: string;
    sort: 'string' | 'number' | 'boolean' | ((a: any, b: any) => number);

    constructor(c?: any) {
        if (!c || typeof c !== 'object') {
            return;
        }
        for (const fn of DMT_CONFIG_FIELDS) {
            if (c[fn] !== undefined) {
                this[fn] = c[fn];
            }
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class DmTableService {

    private _columnConfig: DmTableColumnConfig = new DmTableColumnConfig();

    constructor() { }

    setColumnConfig(config: DmTableColumnConfig) {
        this._columnConfig = new DmTableColumnConfig(config);
    }

    getColumnConfig(): DmTableColumnConfig {
        return this._columnConfig;
    }

}
