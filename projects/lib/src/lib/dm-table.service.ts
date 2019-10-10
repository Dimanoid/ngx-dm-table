import { Injectable } from '@angular/core';

export const DMT_CONFIG_FIELDS = [
    'pinnable', 'sortable', 'resizable', 'whitespace', 'minWidth', 'maxWidth', 'headerClass', 'cellClass', 'footerClass', 'sort'
];

export class DmTableColumnConfig {
    pinnable: boolean = false;
    sortable: boolean = false;
    resizable: boolean = true;
    whitespace: string = 'normal';
    minWidth: number;
    headerClass: string;
    cellClass: string;
    footerClass: string;
    sort: 'string' | 'number' | 'boolean' | ((a: any, b: any) => number);

    constructor(json?: any) {
        if (!json || typeof json !== 'object') {
            return;
        }
        for (const fn of DMT_CONFIG_FIELDS) {
            if (json[fn] !== undefined) {
                this[fn] = json[fn];
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
