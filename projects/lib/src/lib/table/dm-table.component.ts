import {
    Component, OnInit, AfterViewInit,
    ChangeDetectionStrategy, ViewEncapsulation,
    Input, HostBinding,
    ContentChildren, QueryList, ElementRef, ChangeDetectorRef, NgZone, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild
} from '@angular/core';
import { DmColumnDirective } from '../column/dm-column.directive';
import { _D, getScrollBarSize, Point, InputNumber, SortStringsBy, SortNumbersBy, SortBooleansBy, emptyValues, _W } from '../utils';
import { InputBoolean, sumValues } from '../utils';

import ResizeObserver from 'resize-observer-polyfill';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DmTableService } from '../dm-table.service';

export const MIN_ITEM_SIZE = 30;

export interface DmTableSort {
    colId: string;
    order: number;
}

export interface DmTableRowContextMenuEvent {
    index: number;
    row: any;
    event: MouseEvent;
}

export interface DmTableHeaderContextMenuEvent {
    colId: string;
    index: number;
    first: boolean;
    last: boolean;
    event: MouseEvent;
}

@Component({
    selector: 'dm-table',
    exportAs: 'dmTable',
    templateUrl: './dm-table.component.html',
    styleUrls: ['./dm-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DmTableComponent implements OnInit, AfterViewInit, OnChanges {
    @HostBinding('class.ngx-dmt-container') _hostCss = true;

    @ViewChild('headerWrapper', { static: false }) headerWrapper: ElementRef;

    private _columnTemplatesQL: QueryList<DmColumnDirective>;
    @ContentChildren(DmColumnDirective)
    set columnTemplatesQL(val: QueryList<DmColumnDirective>) {
        this._columnTemplatesQL = val;
        this.columnTemplates = val ? val.toArray() : null;
        if (!this.columnTemplates) {
            return;
        }
        for (let i = 0; i < this.columnTemplates.length; i++) {
            if (!this.columnTemplates[i].colId) {
                this.columnTemplates[i].colId = '' + i;
            }
        }
        this.updateColumnsOrder();
        setTimeout(() => {
            this.updateColumns();
            this._cdr.markForCheck();
        });
    }
    get columnTemplatesQL(): QueryList<DmColumnDirective> {
        return this._columnTemplatesQL;
    }
    columnTemplates: DmColumnDirective[] = [];
    ctMap: { [colId: string]: DmColumnDirective };

    @Input() rows: any[];

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

    private _colsWidth: { [id: string]: number } = {};
    @Input()
    set colsWidth(v: { [id: string]: number }) {
        this._colsWidth = v && typeof v === 'object' ? v : {};
    }
    get colsWidth(): { [id: string]: number } {
        return this._colsWidth;
    }
    @Output() colsWidthChange: EventEmitter<{ [id: string]: number }> = new EventEmitter();

    @Input() sort: DmTableSort;
    @Output() sortChange: EventEmitter<DmTableSort> = new EventEmitter();

    @Input() defaultColumnConfig: any;
    @Input() tableClass: string;

    private _colsVisibility: { [id: string]: boolean } = {};
    @Input()
    set colsVisibility(v: { [id: string]: boolean }) {
        this._colsVisibility = v ? v : {};
    }
    get colsVisibility(): { [id: string]: boolean } {
        return this._colsVisibility;
    }
    @Output() colsVisibilityChange: EventEmitter<{ [id: string]: boolean }> = new EventEmitter();

    @Input() rowClasses: { [className: string]: (row: any) => boolean } = {};

    @Output() headerContextMenu: EventEmitter<DmTableHeaderContextMenuEvent> = new EventEmitter();
    @Output() rowContextMenu: EventEmitter<DmTableRowContextMenuEvent> = new EventEmitter();

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

    constructor(private _elemRef: ElementRef, private _cdr: ChangeDetectorRef, private _ngZone: NgZone, private _dts: DmTableService) {
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
                this.updateColumns();
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
                            this.shrinkTmpColumns(-rd);
                        }
                        else {
                            this.colsWidthTmp[this.flexColumnId] += this.tableWidth - sumValues(this.colsWidthTmp, this.colsVisibility);
                        }
                        this.colsWidth = this.colsWidthTmp;
                        this.colsWidthChange.emit(this.colsWidth);
                        this.colsWidthTmp = undefined;
                        this._ngZone.run(() => this._cdr.markForCheck());
                    }
                }
            });
            ro.observe(this._elemRef.nativeElement);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // _D('[DmTableComponent] ngOnChanges, changes:', changes);
        if (changes['rows'] || changes['sort']) {
            this.sortRows();
        }
        if (changes['colsVisibility']) {
            this.updateColumnsOrder();
            this.updateColumns();
        }
    }

    updateColumns(): void {
        if (!this.columnTemplates || !this.columnTemplatesQL) {
            return;
        }
        this.ctMap = {};
        this.hasFooter = false;
        if (this.columnTemplates.length < 1) {
            this.noColumns = true;
            return;
        }
        let visChanged = false;
        this.noColumns = false;
        this.flexColumnId = null;
        for (const cd of this.columnTemplates) {
            this.ctMap[cd.colId] = cd;
            if (!(cd.colId in this.colsVisibility)) {
                this.colsVisibility[cd.colId] = true;
                visChanged = true;
            }
            if (this.colsVisibility[cd.colId]) {
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
        if (visChanged) {
            this.colsVisibilityChange.emit(this.colsVisibility);
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
                this.colsWidth = this.colsWidthTmp;
            }
            if (cwChanged) {
                this.colsWidth = Object.assign({}, this.colsWidth);
                this.colsWidthChange.emit(this.colsWidth);
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
        this.resizerX = this.resizerDiv.getBoundingClientRect().left - this.tableLeft;
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
        this.resizerX = this.resizerDiv.getBoundingClientRect().left - this.tableLeft;
        this.resizeColumnUpdateWidth(delta);
        this._cdr.markForCheck();
    }

    resizeColumnEnd(delta: number): void {
        this.resizeColumnUpdateWidth(delta);
        this.colsWidth = Object.assign({}, this.colsWidthTmp);
        this.colsWidthChange.emit(this.colsWidth);
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
            if (this.flexColumnId == this.resizeColumnId) {
                const ci = this.colsOrder.indexOf(this.resizeColumnId);
                if (ci > -1) {
                    let d = rd;
                    if (ci < this.colsOrder.length - 1) {
                        for (let i = ci + 1; i < this.colsOrder.length; i++) {
                            d = this._shrinkTmpColumn(this.colsOrder[i], d);
                        }
                    }
                }
            }
            else {
                const d = this._shrinkTmpColumn(this.flexColumnId, rd);
                this.colsWidthTmp[this.resizeColumnId] = nw - d;
            }
        }
        else if (rd < 0) {
            if (this.flexColumnId == this.resizeColumnId) {
                const ci = this.colsOrder.indexOf(this.resizeColumnId);
                let d = rd;
                if (ci < this.colsOrder.length - 1) {
                    for (let i = ci + 1; i < this.colsOrder.length; i++) {
                        d = this._shrinkTmpColumn(this.colsOrder[i], d);
                    }
                }
                this.colsWidthTmp[this.resizeColumnId] = nw + d;
                const sv = sumValues(this.colsWidthTmp, this.colsVisibility);
                if (this.tableWidth < sv) {
                    this._shrinkTmpColumn(this.colsOrder[this.colsOrder.length - 1], sv - this.tableWidth);
                }
            }
            else {
                this.colsWidthTmp[this.resizeColumnId] = nw;
                const sv = sumValues(this.colsWidthTmp, this.colsVisibility);
                if (this.tableWidth < sv) {
                    this.colsWidthTmp[this.flexColumnId] = this.ctMap[this.flexColumnId].minWidth;
                }
                else {
                    this.colsWidthTmp[this.flexColumnId] = this.colsWidth[this.flexColumnId] - rd;
                }
            }
        }
    }

    _shrinkTmpColumn(id: string, delta: number): number {
        const ct = this.ctMap[id];
        if (this.colsWidth[id] - delta >= ct.minWidth) {
            this.colsWidthTmp[id] = this.colsWidth[id] - delta;
            return 0;
        }
        else if (this.colsWidth[id] > ct.minWidth) {
            delta -= this.colsWidth[id] - ct.minWidth;
            this.colsWidthTmp[id] = ct.minWidth;
        }
        return delta;
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
        if (!this.columnTemplates || !this.colsVisibility) {
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

        this._colsOrder = this._colsOrderOriginal.slice();
        let i = this._colsOrder.length;
        while (i--) {
            if (!this.colsVisibility[this._colsOrder[i]]) {
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
        if (!this.rows || !this.sort || !this.columnTemplates) {
            return;
        }
        const ct = this.columnTemplates.find(item => item.colId == this.sort.colId);
        if (!ct) {
            return;
        }
        let sort = ct.sort;
        // _D('[DmTableComponent] sortRows, ct:', ct);
        if (typeof sort != 'function') {
            if (sort == 'number') {
                sort = SortNumbersBy(ct.colId);
            }
            else if (sort == 'boolean') {
                sort = SortBooleansBy(ct.colId);
            }
            else {
                sort = SortStringsBy(ct.colId);
            }
        }
        const rows = this.rows.sort(sort);
        if (this.sort.order < 0) {
            rows.reverse();
        }
        this.rows = rows.slice();
    }

    toggleSort(id: string) {
        this.sort = {
            colId: id,
            order: this.sort && this.sort.colId == id ? -this.sort.order : 1
        };
        this.sortChange.emit(this.sort);
        this.sortRows();
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

}
