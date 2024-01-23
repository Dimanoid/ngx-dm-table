import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { DmTableController, DmTableSort, DmTableRowDragEvent, DmTableControllerState, DmTableRowEvent, DmTableGrouppedRows } from '@dimanoid/ngx-dm-table';
import { Point } from './dm-divider.module';
import pkg from '../../../lib/package.json';

const ICONS = [
    'rocket',
    'palm-tree',
    'nurse-user',
    'female-rounded-1',
    'hat-magician',
    'crown-king-1',
    'apple',
    'doctor',
    'yang-ying',
    'umbrella'
];

const NAMES = [
    'Yuri Gagarin',
    'Robinson Crusoe',
    'Lisa Cuddy',
    'Jennifer Lopez',
    'Charlie Chaplin',
    'Louis XIV',
    'Isaac Newton',
    'Gregory House',
    'Gautama Buddha',
    'Mary Poppins'
];

const COLS_WIDTH = { 0: 100, 1: 160, 2: 200, 3: 200, 4: 30, 5: 400, 6: 100 };

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
    @ViewChild('dragHelper', { static: false }) dragHelper?: ElementRef;

    ver = pkg.version;
    dataTables: { [key: string]: any[][] } = {};
    grouppedDataTables: { [key: string]: DmTableGrouppedRows<any[]>[] } = {};
    stripes: boolean = false;
    data: any[] = [];
    lines: string = '100';
    linesList: string[] = ['0', '10', '100', '1000', '10000', '100000', '300000'];
    linesGenerating: boolean = true;
    colsData: { [id: string]: any } = {};
    colsVisibility: { [id: string]: boolean } = {0: true, 1: true, 2: false, 3: false, 4: true, 5: true, 6: false, 7: true };
    colsWidth: { [id: string]: number } = Object.assign({}, COLS_WIDTH);
    colsOrder?: string[];
    sort?: DmTableSort;
    public divider: {
        [name: string]: {
            min: number,
            max: number,
            inverse?: boolean,
            vertical?: boolean,
            moving?: boolean,
            start?: number,
            size?: number
        }
    } = {};
    hideAll: boolean = false;
    dndEnabled: boolean = true;
    multiLineDnd: boolean = false;
    evenRowDrop: boolean = false;
    resizePolicy: string = 'flex';
    isEvenFn = (row: any, colId: number | string) => !(row[colId] % 2);
    dropAllowedFn = (e: DmTableRowDragEvent<any[]>) => !this.evenRowDrop || !(e.row[0] % 2);
    groupped: boolean = false;

    dragging: any;
    dropped: any;
    dragIds?: number[];

    Object = Object;
    selectedFn = (row: { [colId: string]: any }) => !!this.controller.selected.get(row[0]);
    trackBy = (item: any[]) => item[0];

    controller: DmTableController<any[], number> = new DmTableController(this.trackBy);
    state?: DmTableControllerState;

    constructor() {
        this.divider['d1'] = { min: 200, max: 700, vertical: true, size: 300 };
    }

    ngOnInit() {
        this.generateData();
        this.updateData();
        this.controller.state.subscribe(state => this.state = state);
        this.controller.groupSortFn = items => items.sort(this.sortStringsBy(g => g.data.name));
        this.controller.debug = true;
    }

    generateData() {
        const data: any[] = [];
        const gData: DmTableGrouppedRows<any>[] = [];
        for (let i = 1; i <= 300000; i++) {
            const icon = Math.trunc(Math.random() * ICONS.length);
            const n = Math.floor(Math.random() * 62);
            const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(n);
            data.push([
                i,
                { ind: icon, icon: 'dmtd-' + ICONS[icon], name: NAMES[icon] },
                `${i}_Not very long string with spaces`,
                `${i}_Not_very_long_string_without_spaces`,
                'dmtd-' + ICONS[icon],
                `${i} sort as string`,
                i % 2 > 0,
                char + ` - Random length string:` + ' text'.repeat(n) + ' with spaces',
            ]);
        }
        this.linesList.forEach(k => {
            this.dataTables[k] = data.slice(0, +k);
            this.grouppedDataTables[k] = [];
            ICONS.forEach((id, ind) => this.grouppedDataTables[k].push({
                rows: this.dataTables[k].filter(row => row[1].ind == ind),
                data: { ind, icon: 'dmtd-' + ICONS[ind], name: NAMES[ind] },
                collapsible: true,
                collapsed: ind > 0 && ind < 5
            }));
        });
        this.linesGenerating = false;
    }

    updateData() {
        this.data = this.groupped ? this.grouppedDataTables[this.lines] : this.dataTables[this.lines];
        this.controller.groupped.next(this.groupped);
        this.controller.setItems(this.data);
        this._log('updateData', this.data);
    }

    customSort(a: any, b: any): number {
        return (a[1].name as string).localeCompare(b[1].name);
    }

    log(...args: any[]) {
        this.colsData[args[0]] = args[1];
        console.log(...args);
    }

    dividerDragStart(name: string, p: Point) {
        if (this.divider[name]) {
            this.divider[name].moving = true;
            this.divider[name].start = +this.divider[name].size!;
        }
    }

    dividerDragEnd(name: string, p: Point) {
        if (this.divider[name]) {
            this.divider[name].moving = false;
            this.__dividerCalc(name, p);
        }
    }

    dividerMove(name: string, p: Point) {
        if (this.divider[name]) {
            this.__dividerCalc(name, p);
        }
    }

    private __dividerCalc(name: string, p: Point) {
        if (this.divider[name]) {
            const axis = this.divider[name].vertical ? 'x' : 'y';
            const m = this.divider[name].inverse ? -1 : 1;
            let size = +this.divider[name].start! + (m * p[axis]);
            if (size < this.divider[name].min) {
                size = this.divider[name].min;
            }
            if (size > this.divider[name].max) {
                size = this.divider[name].max;
            }
            this.divider[name].size = size;
        }
    }

    resetWidths() {
        this.colsWidth = Object.assign({}, COLS_WIDTH);
    }

    onRowDragStart(e: DmTableRowDragEvent<any[]>) {
        console.log('onRowDragStart', e);
        this.dragIds = [];
        if (!this.multiLineDnd) {
            this.dragIds = [e.row[0]];
        }
        else {
            this.dragIds = this.controller.getSelectedItemIds();
            if (this.dragIds!.length == 0) {
                this.dragIds!.push(e.row[0]);
            }
            const helper = this.dragHelper!.nativeElement;
            e.event.dataTransfer!.setDragImage(helper, -5, -5);
        }
        e.event.dataTransfer!.setData('text/plain', JSON.stringify(this.dragIds));
        this.dragging = this.dragIds;
        this.dropped = null;
    }

    onRowDragEnd(e: DmTableRowDragEvent<any[]>) {
        this._log('onRowDragEnd', e);
        this.dragging = null;
    }

    onRowDrop(e: DmTableRowDragEvent<any[]>) {
        this._log('onRowDrop', e);
        const dd: any = { droppedOn: e.row[0] };
        try {
            const data = JSON.parse(e.event.dataTransfer!.getData('text/plain'));
            dd.droppedIds = data;
        }
        catch (ex: any) {
            dd.error = ex.toString();
        }
        this.dropped = dd;
    }

    rowClick(e: DmTableRowEvent<any[]>): void {
        this.controller.toggleSelected(e.row[0]);
    }

    updateSelectCol(): void {
        this.colsVisibility = Object.assign({}, this.colsVisibility);
    }

    toggleCollapsed(id: string, collapsed: boolean): void {
        if (this.groupped) {
            this.controller.setGroupsCollapsed([id], collapsed);
        }
    }

    sortStringsBy(fn: (obj: any) => string): (a: any, b: any) => number {
        return (a: any, b: any) => fn(a) == null
            ? (fn(b) == null ? 0 : -1)
            : (
                fn(b) == null
                    ? 1
                    : (fn(a) as string).toLocaleLowerCase().localeCompare(fn(b).toLocaleLowerCase())
            );
    }

    _log(...args: any): void {
        console.log('[DmTableDemoApp]', ...args);
    }

}
