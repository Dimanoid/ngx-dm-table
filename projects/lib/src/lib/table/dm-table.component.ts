import {
    Component, OnInit, AfterViewInit,
    ChangeDetectionStrategy, ViewEncapsulation,
    Input, HostBinding,
    ContentChildren, QueryList, ElementRef, ChangeDetectorRef, NgZone,
    Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, AfterContentInit,
    ContentChild, TemplateRef, Renderer2
} from '@angular/core';
import { DmColumnDirective } from '../column/dm-column.directive';
import { getScrollBarSize, Point, InputNumber, SortStringsBy, SortNumbersBy, SortBooleansBy, emptyValues } from '../utils';
import { InputBoolean, sumValues } from '../utils';

import ResizeObserver from 'resize-observer-polyfill';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DmTableService } from '../dm-table.service';

export const MIN_ITEM_SIZE = 30;

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

@Component({
    selector: 'dm-table',
    exportAs: 'dmTable',
    templateUrl: './dm-table.component.html',
    styleUrls: ['./dm-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DmTableComponent implements OnInit, AfterViewInit, OnChanges, AfterContentInit {
    @HostBinding('class.ngx-dmt-container') _hostCss = true;

    @ViewChild('headerWrapper', { static: false }) headerWrapper: ElementRef;

    @ContentChild('groupHeader', { static: false }) groupHeaderTpl: TemplateRef<any>;
    @ContentChild('groupFooter', { static: false }) groupFooterTpl: TemplateRef<any>;

    private _columnTemplatesQL: QueryList<DmColumnDirective>;
    @ContentChildren(DmColumnDirective)
    set columnTemplatesQL(val: QueryList<DmColumnDirective>) {
        this.ctMap = {};
        this._columnTemplatesQL = val;
        this.columnTemplates = val ? val.toArray() : null;
        if (!this.columnTemplates) {
            return;
        }
        for (let i = 0; i < this.columnTemplates.length; i++) {
            if (!this.columnTemplates[i].colId) {
                this.columnTemplates[i].colId = '' + i;
            }
            this.ctMap[this.columnTemplates[i].colId] = this.columnTemplates[i];
        }
    }
    get columnTemplatesQL(): QueryList<DmColumnDirective> {
        return this._columnTemplatesQL;
    }
    columnTemplates: DmColumnDirective[];
    ctMap: { [colId: string]: DmColumnDirective };

    rows: any[];
    groups: DmTableRowsGroup[];
    groupStart: { [index: number]: DmTableRowsGroup };
    groupEnd: { [index: number]: DmTableRowsGroup };
    @Input() data: any[];
    @Input() trackBy: (index: number, item: any) => any;
    @Input() @InputBoolean() groupped: boolean = false;

    private _itemSize: number = MIN_ITEM_SIZE;
    @Input() @InputNumber()
    set itemSize(v: number) {
        this._itemSize = v && v > MIN_ITEM_SIZE ? +v : MIN_ITEM_SIZE;
    }
    get itemSize(): number {
        return this._itemSize;
    }

    @Input() @InputBoolean() moveableColumns: boolean = true;

    private _colsOrderOriginal: string[];
    private _colsOrder: string[];
    @Input()
    set colsOrder(v: string[]) {
        this._colsOrderOriginal = v;
        this.updateColumnsOrder();
    }
    get colsOrder(): string[] {
        return this._colsOrder;
    }
    @Output() colsOrderChange: EventEmitter<string[]> = new EventEmitter();

    private _colsWidthEmited: { [id: string]: number } = {};
    private _colsWidth: { [id: string]: number } = {};
    @Input()
    set colsWidth(v: { [id: string]: number }) {
        this._colsWidth = v && typeof v === 'object' ? v : {};
    }
    get colsWidth(): { [id: string]: number } {
        return this._colsWidth;
    }
    @Output() colsWidthChange: EventEmitter<{ [id: string]: number }> = new EventEmitter();

    @Input() externalSort: boolean = false;
    @Input() sort: DmTableSort;
    @Output() sortChange: EventEmitter<DmTableSort> = new EventEmitter();

    @Input() defaultColumnConfig: any;
    @Input() tableClass: string;
    @Input() colsVisibility: { [id: string]: boolean };
    @Input() rowClasses: { [className: string]: (row: any) => boolean } = {};

    @Output() headerClick: EventEmitter<DmTableHeaderEvent> = new EventEmitter();
    @Output() headerContextMenu: EventEmitter<DmTableHeaderEvent> = new EventEmitter();

    @Output() rowClick: EventEmitter<DmTableRowEvent> = new EventEmitter();
    @Output() rowContextMenu: EventEmitter<DmTableRowEvent> = new EventEmitter();

    @Input() rowsDragEnabled: boolean = false;
    @Input() rowsDropEnabled: boolean = false;
    @Output() rowDragStart: EventEmitter<DmTableRowDragEvent> = new EventEmitter();
    @Output() rowDragEnd: EventEmitter<DmTableRowDragEvent> = new EventEmitter();
    @Output() rowDrop: EventEmitter<DmTableRowDragEvent> = new EventEmitter();
    @Input() rowDropAllowed: (event: DmTableRowDragEvent) => boolean = () => true;

    hasFooter: boolean = false;
    flexColumnId: string;
    tableWidth: number = 0;
    tableLeft: number = 0;
    colsWidthTmp: { [id: string]: number } = {};
    scrollBarWidth: number = 0;
    scrollBarHeight: number = 0;
    resizeColumnId: string;
    resizerDiv: HTMLDivElement;
    resizerX: number = -1000;
    resizeColumnStartPoint: Point;
    horScroll: number = 0;
    noColumns: boolean;

    constructor(
        private _elemRef: ElementRef,
        private _cdr: ChangeDetectorRef,
        private _ngZone: NgZone,
        private _r2: Renderer2,
        private _dts: DmTableService
    ) {
        this.updateHelpers();
    }

    ngOnInit() {
        this._dts.setColumnConfig(this.defaultColumnConfig);
    }

    ngAfterViewInit() {
        this.updateHelpers();
        const xw = this.getHostDims();
        this.tableWidth = xw[1] - this.scrollBarWidth;
        this.tableLeft = xw[0];
        if (this._columnTemplatesQL) {
            setTimeout(() => {
                this.initColumnWidths();
                this._cdr.markForCheck();
            });
        }
        if (this._elemRef && this._elemRef.nativeElement && ResizeObserver) {
            const ro = new ResizeObserver(entries => {
                if (entries[0]) {
                    const tw = this.tableWidth;
                    this.updateHelpers();
                    const nw = Math.round(entries[0].contentRect.width - this.scrollBarWidth);
                    if (nw != tw) {
                        const rd = nw - tw;
                        this.tableWidth = nw;
                        this.colsWidthTmp = Object.assign({}, this.colsWidth);
                        if (rd < 0) {
                            this.colsWidthTmp[this.flexColumnId] += rd;
                        }
                        else {
                            this.colsWidthTmp[this.flexColumnId] += this.tableWidth - sumValues(this.colsWidthTmp, this.colsVisibility);
                        }
                        this._colsWidth = this.colsWidthTmp;
                        this.colsWidthChangeEmit(this._colsWidth);
                        this.colsWidthTmp = undefined;
                        this._ngZone.run(() => this._cdr.markForCheck());
                    }
                }
            });
            ro.observe(this._elemRef.nativeElement);
        }
    }

    ngAfterContentInit() {
        this.updateColumnsOrder();
        this.initColumns();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data'] || changes['sort']) {
            this.sortRows();
        }
        if (changes['colsVisibility']) {
            this.updateColumnsOrder();
        }
        if (changes['colsWidth']) {
            if (this.colsWidth != this._colsWidthEmited) {
                this._colsWidthEmited = undefined;
                this.updateColumnsOrder();
                this.initColumnWidths();
            }
        }
    }

    initColumns(): void {
        if (!this.columnTemplates || !this.columnTemplatesQL) {
            return;
        }
        this.hasFooter = false;
        if (this.columnTemplates.length < 1) {
            this.noColumns = true;
            return;
        }
        this.noColumns = false;
        this.flexColumnId = null;
        for (const cd of this.columnTemplates) {
            if (!this.colsVisibility || this.colsVisibility[cd.colId]) {
                if (cd.footerTpl) {
                    this.hasFooter = true;
                }
                if (cd.flexible) {
                    this.flexColumnId = cd.colId;
                }
            }
        }
        if (this.flexColumnId == null) {
            for (let i = this.colsOrder.length - 1; i > 0; i--) {
                this.flexColumnId = this.colsOrder[i];
                break;
            }
        }
        this.initColumnWidths();
    }

    initColumnWidths(): void {
        if (!this.ctMap) {
            return;
        }
        let cwChanged = false;
        if (this.tableWidth > 0) {
            let tcw = 0;
            for (const cid of this.colsOrder) {
                const cd = this.ctMap[cid];
                let w = this.colsWidth[cd.colId] || 0;
                if (cd.minWidth && w < cd.minWidth) {
                    w = cd.minWidth;
                }
                else if (cd.maxWidth && w > cd.maxWidth) {
                    w = cd.maxWidth;
                }
                if (w != this.colsWidth[cd.colId]) {
                    this.colsWidth[cd.colId] = w;
                    cwChanged = true;
                }
                tcw += w;
            }
            if (tcw < this.tableWidth) {
                const ec = emptyValues(this.colsWidth, this.colsVisibility);
                if (ec > 0) {
                    const w = Math.trunc((this.tableWidth - tcw) / ec);
                    const extraW = this.tableWidth - tcw - w * ec;
                    for (const id in this.colsWidth) {
                        if (!this.colsWidth[id]) {
                            this.colsWidth[id] = w;
                        }
                    }
                    this.colsWidth[this.flexColumnId] += extraW;
                }
                this.colsWidth[this.flexColumnId] += this.tableWidth - sumValues(this.colsWidth, this.colsVisibility);
            }
            else if (tcw > this.tableWidth) {
                this.colsWidthTmp = Object.assign({}, this.colsWidth);
                this.shrinkTmpColumns(tcw - this.tableWidth);
                this._colsWidth = this.colsWidthTmp;
            }
            if (cwChanged) {
                this._colsWidth = Object.assign({}, this.colsWidth);
                this.colsWidthChangeEmit(this._colsWidth);
            }
        }
    }

    getHostDims(): [number, number] {
        if (this._elemRef && this._elemRef.nativeElement) {
            return [
                this._elemRef.nativeElement.getBoundingClientRect().left,
                this._elemRef.nativeElement.clientWidth
            ];
        }
        return null;
    }

    resizeColumnStart(colId: string, resizer: HTMLDivElement, event: MouseEvent): void {
        this.resizerDiv = resizer;
        this.resizeColumnId = colId;
        this.colsWidthTmp = Object.assign({}, this.colsWidth);
        event.stopPropagation();
        event.preventDefault();
        if (event.pageX) {
            this.resizeColumnStartPoint = new Point(event.pageX, event.pageY);
        }
        else if (event.clientX) {
            this.resizeColumnStartPoint = new Point(event.clientX, event.clientY);
        }
        if (this.resizeColumnStartPoint) {
            document.body.onmousemove = e => this.resizeColumnMove(this._getEndX(e) - this.resizeColumnStartPoint.x);
            document.body.onmouseup = e => {
                document.body.onmousemove = document.body.onmouseup = null;
                this.resizeColumnEnd(this._getEndX(e) - this.resizeColumnStartPoint.x);
            };
        }
        this.resizerX = this._getResizerOffset();
        this._cdr.markForCheck();
    }

    private _getEndX(e: MouseEvent): number {
        // tslint:disable-next-line: deprecation
        e = e || window.event as MouseEvent;
        e.stopPropagation();
        e.preventDefault();
        let endX = 0;
        if (e.pageX) {
            endX = e.pageX;
        }
        else if (e.clientX) {
            endX = e.clientX;
        }
        return endX;
    }

    resizeColumnMove(delta: number): void {
        this.resizerX = this._getResizerOffset();
        this.resizeColumnUpdateWidth(delta);
        this._cdr.markForCheck();
    }

    resizeColumnEnd(delta: number): void {
        this.resizeColumnUpdateWidth(delta);
        this._colsWidth = Object.assign({}, this.colsWidthTmp);
        this.colsWidthChangeEmit(this.colsWidth);
        this.colsWidthTmp = undefined;
        this.resizeColumnStartPoint = undefined;
        this.resizeColumnId = undefined;
        this.resizerDiv = null;
        this.resizerX = -1000;
        this._cdr.markForCheck();
    }

    resizeColumnUpdateWidth(delta: number): void {
        const ct = this.ctMap[this.resizeColumnId];
        const w = this.colsWidth[this.resizeColumnId];
        let nw = w + delta;
        if (ct.minWidth > nw) {
            nw = ct.minWidth;
        }
        else if (ct.maxWidth && ct.maxWidth < nw) {
            nw = ct.maxWidth;
        }
        const rd = nw - w;
        if (rd > 0) {
            this.colsWidthTmp[this.resizeColumnId] = nw;
        }
        else if (rd < 0) {
            if (this.flexColumnId == this.resizeColumnId) {
                this.colsWidthTmp[this.resizeColumnId] = nw;
                let sv = sumValues(this.colsWidthTmp, this.colsVisibility);
                if (this.tableWidth > sv) {
                    const fci = this.colsOrder.indexOf(this.flexColumnId);
                    if (fci > -1 && fci < this.colsOrder.length - 1) {
                        const lid = this.colsOrder[this.colsOrder.length - 1];
                        if (!this.ctMap[lid].maxWidth || this.tableWidth - sv + this.colsWidth[lid] <= this.ctMap[lid].maxWidth) {
                            this.colsWidthTmp[lid] += this.tableWidth - sv;
                        }
                        else if (this.colsWidth[lid] < this.ctMap[lid].maxWidth) {
                            const ld = this.ctMap[lid].maxWidth - this.colsWidth[lid];
                            sv -= ld;
                            this.colsWidthTmp[lid] += ld;
                        }
                    }
                    this.colsWidthTmp[this.resizeColumnId] += this.tableWidth - sv;
                }
            }
            else {
                this.colsWidthTmp[this.resizeColumnId] = nw;
                const sv = sumValues(this.colsWidthTmp, this.colsVisibility);
                if (this.tableWidth > sv) {
                    this.colsWidthTmp[this.flexColumnId] = this.colsWidth[this.flexColumnId] - rd;
                }
            }
        }
    }

    shrinkTmpColumns(delta: number, withFlex = true): void {
        let d = delta;
        const fid = withFlex ? this.flexColumnId : this.colsOrder[this.colsOrder.length - 1];
        const fct = this.ctMap[fid];
        const fw = this.colsWidthTmp[fid];
        if (!fct) {
            return;
        }
        if (fw - d >= fct.minWidth) {
            this.colsWidthTmp[fid] -= d;
            return;
        }
        else if (fw > fct.minWidth) {
            d -= fw - fct.minWidth;
            this.colsWidthTmp[fid] = fct.minWidth;
        }
        let i = this.colsOrder.length;
        while (i--) {
            const id = this.colsOrder[i];
            if (id != fid) {
                const ct = this.ctMap[id];
                const cw = this.colsWidthTmp[id];
                if (cw - d >= ct.minWidth) {
                    this.colsWidthTmp[id] -= d;
                    return;
                }
                else if (cw > ct.minWidth) {
                    d -= cw - ct.minWidth;
                    this.colsWidthTmp[id] = ct.minWidth;
                }
            }
        }
    }

    updateColumnsOrder(): void {
        let changed = false;
        if (!this.columnTemplates || !this.ctMap) {
            return;
        }
        if (!this._colsOrderOriginal) {
            this._colsOrderOriginal = [];
            changed = true;
        }
        if (this._colsOrderOriginal.length > this.columnTemplates.length) {
            this._colsOrderOriginal.splice(this.columnTemplates.length - 1);
            changed = true;
        }
        else if (this._colsOrderOriginal.length < this.columnTemplates.length) {
            for (const ct of this.columnTemplates) {
                if (this._colsOrderOriginal.indexOf(ct.colId) == -1) {
                    this._colsOrderOriginal.push(ct.colId);
                    if (this._colsOrderOriginal.length == this.columnTemplates.length) {
                        break;
                    }
                }
            }
            changed = true;
        }
        let i = this._colsOrderOriginal.length;
        while (i--) {
            if (!this.ctMap[this._colsOrderOriginal[i]]) {
                this._colsOrderOriginal.splice(i, 1);
                changed = true;
            }
        }

        this._colsOrder = this._colsOrderOriginal.slice();
        i = this._colsOrder.length;
        while (i--) {
            if (this.colsVisibility && !this.colsVisibility[this._colsOrder[i]]) {
                this._colsOrder.splice(i, 1);
            }
        }

        if (changed) {
            setTimeout(() => this.colsOrderChange.emit(this._colsOrderOriginal));
        }
    }

    columnHeaderDrop(event: CdkDragDrop<any>): void {
        if (event.previousIndex != event.currentIndex) {
            moveItemInArray(this.colsOrder, event.previousIndex, event.currentIndex);
            const co: string[] = this.colsOrder.slice();
            for (const id of this._colsOrderOriginal) {
                if (co.indexOf(id) == -1) {
                    co.push(id);
                }
            }
            this._colsOrderOriginal = co;
            this.colsOrderChange.emit(this._colsOrderOriginal);
            this._cdr.markForCheck();
        }
    }

    sortRows(): void {
        if (this.groupped) {
            this.rows = [];
            this.groups = [];
            this.groupStart = {};
            this.groupEnd = {};
            for (const group of this.data) {
                if (group.rows) {
                    const gr = {
                        index: this.groups.length,
                        first: this.rows.length,
                        last: this.rows.length,
                        rows: group.rows,
                        data: group.data
                    };
                    this.rows.push(...group.rows);
                    gr.last = this.rows.length - 1;
                    this.groups.push(gr);
                    this.groupStart[gr.first] = gr;
                    this.groupEnd[gr.last] = gr;
                }
            }
        }
        else {
            this.rows = this.data;
        }
        if (!this.data || !this.sort || !this.columnTemplates) {
            return;
        }
        const ct = this.columnTemplates.find(item => item.colId == this.sort.colId);
        if (!ct) {
            return;
        }
        if (this.externalSort) {
            this._cdr.markForCheck();
            return;
        }
        let sort: (a: any, b: any) => number;
        if (typeof ct.sort != 'function') {
            if (ct.sort == 'number') {
                sort = SortNumbersBy(ct.colId);
            }
            else if (ct.sort == 'boolean') {
                sort = SortBooleansBy(ct.colId);
            }
            else {
                sort = SortStringsBy(ct.colId);
            }
        }
        else {
            sort = ct.sort;
        }
        if (this.groupped) {
            for (const group of this.groups) {
                group.rows = group.rows.sort((a, b) => this.sort.order < 0 ? sort(b, a) : sort(a, b));
            }
            this.groups = this.groups.sort(
                (a, b) => this.sort.order < 0 ? sort(b.rows[0], a.rows[0]) : sort(a.rows[0], b.rows[0])
            );
            this.groupStart = {};
            this.groupEnd = {};
            for (let i = 0; i < this.groups.length; i++) {
                const group = this.groups[i];
                group.index = i;
                this.groupStart[this.rows.length] = group;
                this.rows.push(...group.rows);
                this.groupStart[this.rows.length - 1] = group;
            }
        }
        else {
            this.rows = this.data.sort((a, b) => this.sort.order < 0 ? sort(b, a) : sort(a, b));
        }
        this.rows = this.rows.slice();
        this._cdr.markForCheck();
    }

    toggleSort(id: string) {
        if (this.ctMap[id].colIdAlias) {
            id = this.ctMap[id].colIdAlias;
        }
        this.sort = {
            colId: id,
            order: this.sort && this.sort.colId == id ? -this.sort.order : 1
        };
        this.sortChange.emit(this.sort);
        // this.sortRows();
        this._cdr.markForCheck();
    }

    scroll(e: Event) {
        const sl = (e.target as Element).scrollLeft;
        if (this.headerWrapper && this.headerWrapper.nativeElement) {
            this.headerWrapper.nativeElement.scrollLeft = sl;
        }
    }

    updateHelpers() {
        [this.scrollBarWidth, this.scrollBarHeight] = getScrollBarSize();
        const xw = this.getHostDims();
        if (xw) {
            this.tableWidth = xw[1] - this.scrollBarWidth;
            this.tableLeft = xw[0];
        }
    }

    getRowClasses(row: any): string {
        let res = '';
        if (this.rowClasses) {
            for (const k in this.rowClasses) {
                if (this.rowClasses[k](row)) {
                    res += ' ' + k;
                }
            }
        }
        return res;
    }

    colsWidthChangeEmit(v: { [id: string]: number }): void {
        this._colsWidthEmited = v;
        this.colsWidthChange.emit(v);
    }

    private _getOffset(el: HTMLElement): { x: number, y: number } {
        let _x = 0;
        let _y = 0;
        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            _x += el.offsetLeft - el.scrollLeft;
            _y += el.offsetTop - el.scrollTop;
            el = el.offsetParent as HTMLElement;
        }
        return { y: _y, x: _x };
    }

    private _getResizerOffset(): number {
        const to = this._getOffset(this._elemRef.nativeElement);
        const ro = this._getOffset(this.resizerDiv);
        return ro.x - to.x;
    }

    trackByFn = (index: number, row: any): any => this.trackBy ? this.trackBy(index, row) : row;

    onRowDragStart(index: number, row: any, event: DragEvent) {
        this.rowDragStart.emit({ index, row, event });
    }

    onRowDragEnd(index: number, row: any, event: DragEvent) {
        this.rowDragEnd.emit({ index, row, event });
    }

    onRowDragEnter(index: number, row: any, event: DragEvent, el: HTMLTableRowElement) {
        this._r2.addClass(el, 'ngx-dmt-row-dragover');
        this._r2.addClass(el, this.rowDropAllowed({ index, row, event }) ? 'ngx-dmt-row-drop-allowed' : 'ngx-dmt-row-drop-forbiden');
    }

    onRowDragLeave(index: number, row: any, event: DragEvent, el: HTMLTableRowElement) {
        this._removeDragClasses(el);
    }

    onRowDragOver(index: number, row: any, event: DragEvent, el: HTMLTableRowElement) {
        if (!this.rowsDropEnabled) {
            return;
        }
        event.preventDefault();
        this._r2.addClass(el, 'ngx-dmt-row-dragover');
        this._r2.addClass(el, this.rowDropAllowed({ index, row, event }) ? 'ngx-dmt-row-drop-allowed' : 'ngx-dmt-row-drop-forbiden');
    }

    onRowDrop(index: number, row: any, event: DragEvent, el: HTMLTableRowElement) {
        if (this.rowsDropEnabled && this.rowDropAllowed({ index, row, event })) {
            event.preventDefault();
            this.rowDrop.emit({ index, row, event });
        }
        this._removeDragClasses(el);
    }

    private _removeDragClasses(el: HTMLTableRowElement) {
        this._r2.removeClass(el, 'ngx-dmt-row-dragover');
        this._r2.removeClass(el, 'ngx-dmt-row-drop-allowed');
        this._r2.removeClass(el, 'ngx-dmt-row-drop-forbiden');
    }

}
