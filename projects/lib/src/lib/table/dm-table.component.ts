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
        this.columnTemplates = val ? val.toArray() : [];
        for (let i = 0; i < this.columnTemplates.length; i++) {
            if (!this.columnTemplates[i].colId) {
                this.columnTemplates[i].colId = '' + i;
            }
        }
        this._columnTemplatesOriginal = this.columnTemplates.slice();
        this.updateColumnsOrder();
        setTimeout(() => {
            this.updateColumns(this.columnTemplates);
            this._cdr.markForCheck();
        });
    }
    get columnTemplatesQL(): QueryList<DmColumnDirective> {
        return this._columnTemplatesQL;
    }
    columnTemplates: DmColumnDirective[] = [];
    private _columnTemplatesOriginal: DmColumnDirective[] = [];
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

    @Input() colsOrder: string[];
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

    @Input() colsVisibility: { [id: string]: boolean } = {};
    @Output() colsVisibilityChange: EventEmitter<{ [id: string]: boolean }> = new EventEmitter();

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
    colsIndex: { [id: string]: number } = {};
    horScroll: number = 0;
    noColumns: boolean = false;

    constructor(private _elemRef: ElementRef, private _cdr: ChangeDetectorRef, private _ngZone: NgZone, private _dts: DmTableService) {
        [this.scrollBarWidth, this.scrollBarHeight] = getScrollBarSize();
        const xw = this.getHostDims();
        if (xw) {
            this.tableWidth = xw[1] - this.scrollBarWidth;
            this.tableLeft = xw[0];
        }
    }

    ngOnInit() {
        this._dts.setColumnConfig(this.defaultColumnConfig);
    }

    ngAfterViewInit() {
        const xw = this.getHostDims();
        this.tableWidth = xw[1] - this.scrollBarWidth;
        this.tableLeft = xw[0];
        if (this._columnTemplatesQL) {
            setTimeout(() => {
                this.updateColumns(this.columnTemplates);
                this._cdr.markForCheck();
            });
        }
        if (this._elemRef && this._elemRef.nativeElement && ResizeObserver) {
            const ro = new ResizeObserver(entries => {
                if (entries[0]) {
                    [this.scrollBarWidth, this.scrollBarHeight] = getScrollBarSize();
                    const nw = entries[0].contentRect.width - this.scrollBarWidth;
                    if (nw != this.tableWidth) {
                        const rd = nw - this.tableWidth;
                        this.tableWidth = nw;
                        this.colsWidthTmp = Object.assign({}, this.colsWidth);
                        if (rd < 0) {
                            this.shrinkTmpColumns(-rd);
                        }
                        else {
                            this.colsWidthTmp[this.colsIndex[this.flexColumnId]] += this.tableWidth
                                - sumValues(this.colsWidthTmp);
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
    }

    updateColumns(cds: DmColumnDirective[]): void {
        this.ctMap = {};
        this.hasFooter = false;
        if (cds.length < 1) {
            this.noColumns = true;
            return;
        }
        let visChanged = false;
        this.noColumns = false;
        let flexi = cds.length - 1;
        for (let i = 0; i < cds.length; i++) {
            const cd = cds[i];
            if (cd.footerTpl) {
                this.hasFooter = true;
            }
            if (cd.flexible) {
                flexi = i;
            }
            this.ctMap[cd.colId] = cd;
            if (!(cd.colId in this.colsVisibility)) {
                this.colsVisibility[cd.colId] = true;
                visChanged = true;
            }
        }
        this.flexColumnId = cds[flexi].colId;
        if (visChanged) {
            this.colsVisibilityChange.emit(this.colsVisibility);
        }

        let cwChanged = false;
        if (this.tableWidth > 0) {
            let tcw = 0;
            for (const cd of cds) {
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
                const ec = emptyValues(this.colsWidth);
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
                this.colsWidth[this.flexColumnId] += this.tableWidth - sumValues(this.colsWidth);
            }
            else if (tcw > this.tableWidth) {

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
        // _D('[DmTableComponent] resizeColumnStart:', index, resizer, event);
        this.resizerDiv = resizer;
        this.resizeColumnId = colId;
        this.colsWidthTmp = Object.assign({}, this.colsWidth);
        // _D('[DmTableComponent] resizeColumnStart, colWidths:', this.colWidths.slice());
        event.stopPropagation();
        event.preventDefault();
        if (event.pageX) {
            this.resizeColumnStartPoint = new Point(event.pageX, event.pageY);
        }
        else if (event.clientX) {
            this.resizeColumnStartPoint = new Point(event.clientX, event.clientY);
        }
        if (this.resizeColumnStartPoint) {
            document.body.onmousemove = (e: MouseEvent) => {
                // tslint:disable-next-line: deprecation
                e = e || window.event as MouseEvent;
                e.stopPropagation();
                e.preventDefault();
                let endX = 0;
                let endY = 0;
                if (e.pageX) {
                    endX = e.pageX;
                    endY = e.pageY;
                }
                else if (e.clientX) {
                    endX = e.clientX;
                    endY = e.clientX;
                }
                this.resizeColumnMove(endX - this.resizeColumnStartPoint.x);
            };

            document.body.onmouseup = (e: MouseEvent) => {
                document.body.onmousemove = document.body.onmouseup = null;
                // tslint:disable-next-line: deprecation
                e = e || window.event as MouseEvent;
                e.stopPropagation();
                e.preventDefault();
                let endX = 0;
                let endY = 0;
                if (e.pageX) {
                    endX = e.pageX;
                    endY = e.pageY;
                }
                else if (e.clientX) {
                    endX = e.clientX;
                    endY = e.clientX;
                }
                this.resizeColumnEnd(endX - this.resizeColumnStartPoint.x);
            };
        }
        this.resizerX = this.resizerDiv.getBoundingClientRect().left - this.tableLeft;
        this._cdr.markForCheck();
    }

    resizeColumnMove(delta: number): void {
        this.resizerX = this.resizerDiv.getBoundingClientRect().left - this.tableLeft;
        this.resizeColumnUpdateWidth(delta);
        this._cdr.markForCheck();
    }

    resizeColumnEnd(delta: number): void {
        this.resizeColumnUpdateWidth(delta);
        this.colsWidth = this.colsWidthTmp;
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
        this.colsWidthTmp[this.resizeColumnId] = nw;
        const rd = sumValues(this.colsWidthTmp) - this.tableWidth;
        if (rd > 0) {
            this.shrinkTmpColumns(rd, this.flexColumnId != this.resizeColumnId);
        }
        else if (rd < 0) {
            const ci = this.flexColumnId == this.resizeColumnId ? this.colsWidthTmp.length - 1 : this.flexColumnId;
            this.colsWidthTmp[ci] -= rd;
        }
    }

    shrinkTmpColumns(delta: number, withFlex = true): void {
        let d = delta;
        const fid = withFlex ? this.flexColumnId : this.colsOrder[this.colsOrder.length - 1];
        const flexCT = this.ctMap[fid];
        const fw = this.colsWidthTmp[fid];
        if (fw - d > flexCT.minWidth) {
            this.colsWidthTmp[fid] -= d;
            return;
        }
        else if (fw > flexCT.minWidth) {
            d -= fw - flexCT.minWidth;
            this.colsWidthTmp[fid] = flexCT.minWidth;
        }
        let i = this.colsOrder.length;
        while (i--) {
            const id = this.colsOrder[i];
            if (id != fid) {
                const ct = this.ctMap[id];
                const cw = this.colsWidthTmp[id];
                if (cw - d > ct.minWidth) {
                    this.colsWidthTmp[i] -= d;
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
        if (!this.colsOrder) {
            this.colsOrder = [];
            changed = true;
        }
        if (this.colsOrder.length > this.columnTemplates.length) {
            this.colsOrder.splice(this.columnTemplates.length - 1);
            changed = true;
        }
        else if (this.colsOrder.length < this.columnTemplates.length) {
            for (const ct of this.columnTemplates) {
                if (this.colsOrder.indexOf(ct.colId) == -1) {
                    this.colsOrder.push(ct.colId);
                    if (this.colsOrder.length == this.columnTemplates.length) {
                        break;
                    }
                }
            }
            changed = true;
        }
        this.colsIndex = {};
        for (let i = 0; i < this.colsOrder.length; i++) {
            this.colsIndex[this.colsOrder[i]] = i;
        }
        if (changed) {
            this.colsOrderChange.emit(this.colsOrder);
        }
        this.sortRows();
    }

    columnHeaderDrop(event: CdkDragDrop<any>): void {
        if (event.previousIndex != event.currentIndex) {
            moveItemInArray(this.colsOrder, event.previousIndex, event.currentIndex);
            this.colsIndex = {};
            for (let i = 0; i < this.colsOrder.length; i++) {
                this.colsIndex[this.colsOrder[i]] = i;
            }
            this.colsOrderChange.emit(this.colsOrder);
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

}
