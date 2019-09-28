import {
    Component, OnInit, AfterViewInit,
    ChangeDetectionStrategy, ViewEncapsulation,
    Input, HostBinding,
    ContentChildren, QueryList, ElementRef, ChangeDetectorRef, NgZone, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild
} from '@angular/core';
import { DmColumnDirective } from '../column/dm-column.directive';
import { _D, getScrollBarSize, emptyCount, Point, InputNumber, SortStringsBy, SortNumbersBy, SortBooleansBy } from '../utils';
import { InputBoolean } from '../utils';

import ResizeObserver from 'resize-observer-polyfill';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DmTableService } from '../dm-table.service';

const MIN_ITEM_SIZE = 30;

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

    @ViewChild('headerWrapper', { static: true }) headerWrapper: ElementRef;

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
        this.updateColumns(this.columnTemplates);
        setTimeout(() => this._cdr.markForCheck());
    }
    get columnTemplatesQL(): QueryList<DmColumnDirective> {
        return this._columnTemplatesQL;
    }
    columnTemplates: DmColumnDirective[] = [];
    private _columnTemplatesOriginal: DmColumnDirective[] = [];

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

    @Input() columnsOrder: number[];
    @Output() columnsOrderChange: EventEmitter<number[]> = new EventEmitter();

    @Input() sort: DmTableSort;
    @Output() sortChange: EventEmitter<DmTableSort> = new EventEmitter();

    @Input() defaultColumnConfig: any;

    hasFooter: boolean = false;
    flexColumnIndex: number = -1;
    tableWidth: number = 0;
    tableLeft: number = 0;
    colWidths: number[] = [];
    colWidthsTmp: number[] = [];
    scrollBarWidth: number = 0;
    scrollBarHeight: number = 0;
    resizeColumnIndex: number = -1;
    resizerDiv: HTMLDivElement;
    resizerX: number = -1000;
    resizeColumnStartPoint: Point;
    columnsOrderReverse: number[];
    horScroll: number = 0;

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
            this.updateColumns(this.columnTemplates);
            setTimeout(() => this._cdr.markForCheck());
        }
        if (this._elemRef && this._elemRef.nativeElement) {
            const ro = new ResizeObserver(entries => {
                if (entries[0]) {
                    [this.scrollBarWidth, this.scrollBarHeight] = getScrollBarSize();
                    const nw = entries[0].contentRect.width - this.scrollBarWidth;
                    if (nw != this.tableWidth) {
                        const rd = nw - this.tableWidth;
                        this.tableWidth = nw;
                        this.colWidthsTmp = this.colWidths.slice();
                        if (rd < 0) {
                            this.shrinkTmpColumns(-rd);
                        }
                        else {
                            this.colWidthsTmp[this.columnsOrderReverse[this.flexColumnIndex]] += this.tableWidth
                                - this.colWidthsTmp.reduce((a, b) => a + b, 0);
                        }
                        this.colWidths = this.colWidthsTmp;
                        this.colWidthsTmp = undefined;
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
        this.hasFooter = false;
        let flexi = cds.length - 1;
        for (let i = 0; i < cds.length; i++) {
            const cd = cds[i];
            if (cd.footerTpl) {
                this.hasFooter = true;
            }
            if (cd.flexible) {
                flexi = i;
            }
        }
        this.flexColumnIndex = flexi;

        if (this.tableWidth > 0) {
            let tcw = 0;
            const cws: number[] = [];
            for (const cd of cds) {
                let w = cd.width ? cd.width : 0;
                if (cd.minWidth && w < cd.minWidth) {
                    w = cd.minWidth;
                }
                else if (cd.maxWidth && w > cd.maxWidth) {
                    w = cd.maxWidth;
                }
                cws.push(w);
                tcw += w;
            }
            if (tcw < this.tableWidth) {
                const ec = emptyCount(cws);
                if (ec > 0) {
                    const w = Math.trunc((this.tableWidth - tcw) / ec);
                    const extraW = this.tableWidth - tcw - w * ec;
                    for (let i = 0; i < cws.length; i++) {
                        if (!cws[i]) {
                            cws[i] = w;
                        }
                    }
                    cws[flexi] += extraW;
                }
                cws[this.flexColumnIndex] += this.tableWidth - cws.reduce((a, b) => a + b, 0);
            }
            else if (tcw > this.tableWidth) {

            }
            this.colWidths = cws;
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

    resizeColumnStart(index: number, resizer: HTMLDivElement, event: MouseEvent): void {
        // _D('[DmTableComponent] resizeColumnStart:', index, resizer, event);
        this.resizerDiv = resizer;
        this.resizeColumnIndex = index;
        this.colWidthsTmp = this.colWidths.slice();
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
        this.colWidths = this.colWidthsTmp;
        this.colWidthsTmp = undefined;
        this.resizeColumnStartPoint = undefined;
        this.resizeColumnIndex = -1;
        this.resizerDiv = null;
        this.resizerX = -1000;
        this._cdr.markForCheck();
    }

    resizeColumnUpdateWidth(delta: number): void {
        const ct = this.columnTemplates[this.resizeColumnIndex];
        const w = this.colWidths[this.resizeColumnIndex];
        let nw = w + delta;
        if (ct.minWidth > nw) {
            nw = ct.minWidth;
        }
        else if (ct.maxWidth && ct.maxWidth < nw) {
            nw = ct.maxWidth;
        }
        this.colWidthsTmp[this.resizeColumnIndex] = nw;
        const fi = this.columnsOrderReverse[this.flexColumnIndex];
        const rd = this.colWidthsTmp.reduce((a, b) => a + b, 0) - this.tableWidth;
        if (rd > 0) {
            this.shrinkTmpColumns(rd, fi != this.resizeColumnIndex);
        }
        else if (rd < 0) {
            const ci = fi == this.resizeColumnIndex ? this.colWidthsTmp.length - 1 : fi;
            this.colWidthsTmp[ci] -= rd;
        }
    }

    shrinkTmpColumns(delta: number, withFlex = true): void {
        let d = delta;
        const fi = withFlex ? this.columnsOrderReverse[this.flexColumnIndex] : this.columnTemplates.length - 1;
        const flexCT = this.columnTemplates[fi];
        const fw = this.colWidthsTmp[fi];
        if (fw - d > flexCT.minWidth) {
            this.colWidthsTmp[fi] -= d;
            return;
        }
        else if (fw > flexCT.minWidth) {
            d -= fw - flexCT.minWidth;
            this.colWidthsTmp[fi] = flexCT.minWidth;
        }
        let i = this.columnTemplates.length;
        while (i--) {
            if (i != (withFlex ? this.flexColumnIndex : this.columnTemplates.length - 1)) {
                const ct = this.columnTemplates[i];
                const cw = this.colWidthsTmp[i];
                if (cw - d > ct.minWidth) {
                    this.colWidthsTmp[i] -= d;
                    return;
                }
                else if (cw > ct.minWidth) {
                    d -= cw - ct.minWidth;
                    this.colWidthsTmp[i] = ct.minWidth;
                }
            }
        }
    }

    updateColumnsOrder(): void {
        let changed = false;
        if (!this.columnsOrder) {
            this.columnsOrder = [];
            changed = true;
        }
        if (this.columnsOrder.length > this.columnTemplates.length) {
            this.columnsOrder.splice(this.columnTemplates.length - 1);
            changed = true;
        }
        else if (this.columnsOrder.length < this.columnTemplates.length) {
            for (let i = 0; i < this.columnTemplates.length; i++) {
                if (this.columnsOrder.indexOf(i) == -1) {
                    this.columnsOrder.push(i);
                }
            }
            changed = true;
        }
        this.columnTemplates = [];
        this.columnsOrderReverse = [];
        for (let i = 0; i < this.columnsOrder.length; i++) {
            this.columnTemplates.push(this._columnTemplatesOriginal[this.columnsOrder[i]]);
            this.columnsOrderReverse[this.columnsOrder[i]] = i;
        }
        if (changed) {
            this.columnsOrderChange.emit(this.columnsOrder);
        }
        this.sortRows();
    }

    columnHeaderDrop(event: CdkDragDrop<any>): void {
        if (event.previousIndex != event.currentIndex) {
            moveItemInArray(this.columnsOrder, event.previousIndex, event.currentIndex);
            moveItemInArray(this.columnTemplates, event.previousIndex, event.currentIndex);
            moveItemInArray(this.colWidths, event.previousIndex, event.currentIndex);
            this.columnsOrderReverse = [];
            for (let i = 0; i < this.columnsOrder.length; i++) {
                this.columnsOrderReverse[this.columnsOrder[i]] = i;
            }
            this.columnsOrderChange.emit(this.columnsOrder);
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

    toggleSort(ind: number) {
        // _D('[DmTableComponent] toggleSort, ind:', ind, 'columnsOrder[ind]:', this.columnsOrder[ind]);
        this.sort = {
            colId: this.columnTemplates[ind].colId,
            order: this.sort && this.sort.colId == this.columnTemplates[ind].colId ? -this.sort.order : 1
        };
        // _D('[DmTableComponent] toggleSort, sort:', this.sort);
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
