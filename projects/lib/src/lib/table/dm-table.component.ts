import {
    Component, OnInit, AfterViewInit,
    ChangeDetectionStrategy, ViewEncapsulation,
    Input, HostBinding,
    ContentChildren, QueryList, ElementRef, ChangeDetectorRef, NgZone,
    Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, AfterContentInit,
    ContentChild, TemplateRef, Renderer2
} from '@angular/core';
import { DmColumnDirective } from '../column/dm-column.directive';
import { getScrollBarSize, Point, InputNumber, SortStringsBy, SortNumbersBy, SortBooleansBy, emptyValues, multiSortFn } from '../utils';
import { InputBoolean, sumValues } from '../utils';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DmTableService } from '../dm-table.service';
import { DmTableRowsGroup, DmTableSort, DmTableHeaderEvent, DmTableRowEvent, DmTableRowDragEvent, DmTableGrouppedRows } from '../models';
import { DmTableController } from '../dm-table.controller';
import { Subscription } from 'rxjs';
import { DmTableResizePolicyMap, TDmTableResizePolicy } from '../dm-table-resize-policies';

export const MIN_ITEM_SIZE = 30;

@Component({
    selector: 'dm-table',
    exportAs: 'dmTable',
    templateUrl: './dm-table.component.html',
    styleUrls: ['./dm-table.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DmTableComponent<T> implements OnInit, AfterViewInit, OnChanges, AfterContentInit {
    @HostBinding('class.ngx-dmt-container') _hostCss = true;

    @ViewChild('headerWrapper', { static: false }) headerWrapper?: ElementRef;

    @ContentChild('selectColumn', { static: false }) selectColumnTpl?: TemplateRef<any>;
    @ContentChild('selectColumnHeader', { static: false }) selectColumnHeaderTpl?: TemplateRef<any>;
    @ContentChild('groupHeader', { static: false }) groupHeaderTpl?: TemplateRef<any>;
    @ContentChild('groupFooter', { static: false }) groupFooterTpl?: TemplateRef<any>;
    @ContentChild('noItems', { static: false }) noItemsTpl?: TemplateRef<any>;
    @ContentChild('noItemsVisible', { static: false }) noItemsVisibleTpl?: TemplateRef<any>;

    private _columnTemplatesQL?: QueryList<DmColumnDirective<T>>;
    @ContentChildren(DmColumnDirective)
    set columnTemplatesQL(val: QueryList<DmColumnDirective<T>> | undefined) {
        this.ctMap = {};
        this._columnTemplatesQL = val;
        this.columnTemplates = val ? val.toArray() : undefined;
        if (!this.columnTemplates) {
            return;
        }
        for (let i = 0; i < this.columnTemplates.length; i++) {
            if (!this.columnTemplates[i].colId) {
                this.columnTemplates[i].colId = '' + i;
            }
            this.ctMap[this.columnTemplates[i].colId!] = this.columnTemplates[i];
        }
        this.checkSortFn();
    }
    get columnTemplatesQL(): QueryList<DmColumnDirective<T>> | undefined {
        return this._columnTemplatesQL;
    }
    columnTemplates?: DmColumnDirective<T>[];
    ctMap?: { [colId: string]: DmColumnDirective<T> };

    @Input() @InputBoolean() debug: boolean | string = false;

    rows?: ({ row: T | DmTableGrouppedRows<T> } | { type: 1 | 2, group: DmTableRowsGroup<T> })[];
    groups?: DmTableRowsGroup<T>[];
    groupStart?: { [index: number]: DmTableRowsGroup<T> };
    groupEnd?: { [index: number]: DmTableRowsGroup<T> };
    @Input() controller?: DmTableController<T>;

    private _itemSize: number = MIN_ITEM_SIZE;
    @Input() @InputNumber()
    set itemSize(v: number | string) {
        this._itemSize = v && +v > MIN_ITEM_SIZE ? +v : MIN_ITEM_SIZE;
    }
    get itemSize(): number | string{
        return this._itemSize;
    }

    @Input() @InputBoolean() moveableColumns: boolean | string = true;

    private _colsOrderOriginal?: string[];
    private _colsOrder?: string[];
    @Input()
    set colsOrder(v: string[] | undefined) {
        this._colsOrderOriginal = v;
        this.updateColumnsOrder();
    }
    get colsOrder(): string[] | undefined {
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

    @Input() defaultColumnConfig: any;
    @Input() tableClass?: string;

    private _colsVisibility?: { [id: string]: boolean };
    @Input()
    set colsVisibility(v: { [id: string]: boolean } | undefined) {
        this._colsVisibility = v;
        setTimeout(() => {
            this.initColumnWidths();
            this._cdr.markForCheck();
        });
    }
    get colsVisibility(): { [id: string]: boolean } | undefined {
        return this._colsVisibility;
    }

    @Input() rowClasses: {
        [className: string]: (row: { [colId: string]: any }, index: number, group?: DmTableRowsGroup<T>) => boolean
    } = {};

    @Output() headerClick: EventEmitter<DmTableHeaderEvent> = new EventEmitter();
    @Output() headerContextMenu: EventEmitter<DmTableHeaderEvent> = new EventEmitter();

    @Output() rowClick: EventEmitter<DmTableRowEvent<T>> = new EventEmitter();
    @Output() rowContextMenu: EventEmitter<DmTableRowEvent<T>> = new EventEmitter();

    @Input() @InputBoolean() rowsDragEnabled: boolean | string = false;
    @Input() @InputBoolean() rowsDropEnabled: boolean | string = false;
    @Output() rowDragStart: EventEmitter<DmTableRowDragEvent<T>> = new EventEmitter();
    @Output() rowDragEnd: EventEmitter<DmTableRowDragEvent<T>> = new EventEmitter();
    @Output() rowDrop: EventEmitter<DmTableRowDragEvent<T>> = new EventEmitter();
    @Input() rowDropAllowed: (event: DmTableRowDragEvent<T>) => boolean = () => true;

    @Input() @InputBoolean() showSelectColumn: boolean | string = false;
    @Input() @InputNumber() selectColumnWidth: number | string = 50;

    @Input() resizePolicy: TDmTableResizePolicy<T> = 'flex';

    hasFooter: boolean = false;
    flexColumnId?: string;
    tableWidth: number = 0;
    tableLeft: number = 0;
    colsWidthTmp: { [id: string]: number } = {};
    scrollBarWidth: number = 0;
    scrollBarHeight: number = 0;
    resizeColumnId?: string;
    resizerDiv?: HTMLDivElement;
    resizerX: number = -1000;
    resizeColumnStartPoint?: Point;
    horScroll: number = 0;
    noColumns?: boolean;
    allRowsSelected: boolean = false;
    allRowsNotSelected: boolean = true;
    noItems: boolean = true;
    noItemsVisible: boolean = false;
    disableChanges: boolean = false;
    groupped: boolean = false;
    sort?: DmTableSort;
    sortCount: number = 0;
    sortFn?: <K = T | DmTableGrouppedRows<T>>(items: K[], sort?: DmTableSort) => K[];

    abs = Math.abs;

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
        const xw = this.getHostDims() || [0, 100];
        this.tableWidth = xw[1] - this.scrollBarWidth - (this.showSelectColumn ? +this.selectColumnWidth : 0);
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
                        this.tableWidth = nw - (this.showSelectColumn ? +this.selectColumnWidth : 0);
                        const colsWidthTmp = Object.assign({}, this.colsWidth);
                        if (this.resizeColumnId && this.colsWidthTmp[this.resizeColumnId]) {
                            colsWidthTmp[this.resizeColumnId] = this.colsWidthTmp[this.resizeColumnId];
                        }
                        if (rd < 0) {
                            colsWidthTmp[this.flexColumnId!] += rd;
                        }
                        else {
                            colsWidthTmp[this.flexColumnId!] += this.tableWidth - sumValues(colsWidthTmp, this._colsVisibility!);
                        }
                        this.colsWidthTmp = this.resizeColumnId ? colsWidthTmp : {};
                        this._colsWidth = colsWidthTmp;
                        this.colsWidthChangeEmit(this._colsWidth);
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

    private _S: { [id: string]: Subscription } = {};
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['controller']) {
            Object.keys(this._S).forEach(k => {
                this._S[k]?.unsubscribe();
                delete this._S[k];
            });
            if (this.controller) {
                this._S.sort = this.controller.sort.subscribe(sort => {
                    this.sort = sort;
                    this.sortCount = sort ? Object.keys(sort).length : 0;
                    this._cdr.markForCheck();
                });
                this._S.state = this.controller.state.subscribe(state => {
                    this.noItems = state.itemsTotal == 0;
                    this.noItemsVisible = state.itemsVisible == 0 && state.itemsTotal > 0;
                    this.allRowsSelected = state.itemsSelected >= state.itemsVisible && state.itemsVisible > 0;
                    this.allRowsNotSelected = state.itemsSelected == 0;
                    this.updateGlobalStyles();
                    this._cdr.markForCheck();
                });
                this._S.groupped = this.controller.groupped.subscribe(gr => {
                    this.groupped = gr;
                    this.updateRows();
                    this._cdr.markForCheck();
                });
                this._S.items = this.controller.visibleItems.subscribe(items => {
                    this.updateRows();
                    this._cdr.markForCheck();
                });
            }
            this.checkSortFn();
        }
        if (changes['colsVisibility']) {
            this.updateColumnsOrder();
        }
        if (changes['colsWidth']) {
            if (this.disableChanges) {
                this.disableChanges = false;
                return;
            }
            this.updateColumnsOrder();
            this.initColumnWidths();
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
        this.flexColumnId = undefined;
        for (const cd of this.columnTemplates) {
            if (!this._colsVisibility || this._colsVisibility[cd.colId!]) {
                if (cd.footerTpl) {
                    this.hasFooter = true;
                }
                if (cd.flexible) {
                    this.flexColumnId = cd.colId;
                }
            }
        }
        if (this.flexColumnId == null) {
            for (let i = this.colsOrder!.length - 1; i > 0; i--) {
                this.flexColumnId = this.colsOrder![i];
                break;
            }
        }
        this.initColumnWidths();
    }

    initColumnWidths(): void {
        if (!this.ctMap) {
            return;
        }
        if (this.tableWidth > 0) {
            const [tcw, cwChanged] = this.getNormalizedTableWidth();
            if (tcw < this.tableWidth) {
                const ec = emptyValues(this.colsWidth, this._colsVisibility);
                if (ec > 0) {
                    const w = Math.trunc((this.tableWidth - tcw) / ec);
                    const extraW = this.tableWidth - tcw - w * ec;
                    for (const id in this.colsWidth) {
                        if (!this.colsWidth[id]) {
                            this.colsWidth[id] = w;
                        }
                    }
                    this.colsWidth[this.flexColumnId!] += extraW;
                }
                this.colsWidth[this.flexColumnId!] += this.tableWidth - sumValues(this.colsWidth, this._colsVisibility);
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

    getHostDims(): [number, number] | null {
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
            document.body.onmousemove = e => this.resizeColumnMove(this._getEndX(e) - (this.resizeColumnStartPoint ? this.resizeColumnStartPoint.x! : 0));
            document.body.onmouseup = e => {
                document.body.onmousemove = document.body.onmouseup = null;
                this.resizeColumnEnd(this._getEndX(e) - (this.resizeColumnStartPoint ? this.resizeColumnStartPoint.x! : 0));
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
        this.colsWidthTmp = {};
        this.resizeColumnStartPoint = undefined;
        this.resizeColumnId = undefined;
        this.resizerDiv = undefined;
        this.resizerX = -1000;
        this._cdr.markForCheck();
    }

    resizeColumnUpdateWidth(delta: number): void {
        let rp = (typeof this.resizePolicy == 'string' ? DmTableResizePolicyMap[this.resizePolicy] : this.resizePolicy);
        if (!rp || !rp.onColumnResize) {
            rp = DmTableResizePolicyMap.simple;
        }
        this._L('resizeColumnUpdateWidth', 'rp:', rp);
        this.colsWidthTmp = rp.onColumnResize(
            this.resizeColumnId!,
            this.tableWidth,
            delta,
            this.colsOrder!,
            this._colsVisibility!,
            this.colsWidth,
            this.ctMap!
        );
    }

    shrinkTmpColumns(delta: number, withFlex = true): void {
        let d = delta;
        const fid: string = withFlex ? this.flexColumnId! : this.colsOrder![this.colsOrder!.length - 1];
        const fct = this.ctMap![fid];
        const fw = this.colsWidthTmp[fid];
        if (!fct) {
            return;
        }
        if (fw - d >= +fct.minWidth) {
            this.colsWidthTmp[fid] -= d;
            return;
        }
        else if (fw > +fct.minWidth) {
            d -= fw - +fct.minWidth;
            this.colsWidthTmp[fid] = +fct.minWidth;
        }
        let i = this.colsOrder!.length;
        while (i--) {
            const id = this.colsOrder![i];
            if (id != fid) {
                const ct = this.ctMap![id];
                const cw = this.colsWidthTmp[id];
                if (cw - d >= +ct.minWidth) {
                    this.colsWidthTmp[id] -= d;
                    return;
                }
                else if (cw > +ct.minWidth) {
                    d -= cw - +ct.minWidth;
                    this.colsWidthTmp[id] = +ct.minWidth;
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
                if (this._colsOrderOriginal.indexOf(ct.colId!) == -1) {
                    this._colsOrderOriginal.push(ct.colId!);
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
            if (this._colsVisibility && !this._colsVisibility[this._colsOrder[i]]) {
                this._colsOrder.splice(i, 1);
            }
        }

        if (changed) {
            setTimeout(() => this.colsOrderChange.emit(this._colsOrderOriginal));
        }
    }

    columnHeaderDrop(event: CdkDragDrop<any>): void {
        if (event.previousIndex != event.currentIndex) {
            moveItemInArray(this.colsOrder!, event.previousIndex, event.currentIndex);
            const co: string[] = this.colsOrder!.slice();
            for (const id of this._colsOrderOriginal!) {
                if (co.indexOf(id) == -1) {
                    co.push(id);
                }
            }
            this._colsOrderOriginal = co;
            this.colsOrderChange.emit(this._colsOrderOriginal);
            this._cdr.markForCheck();
        }
    }

    updateRows(): void {
        this._W('updateRows', this.controller);
        if (this.controller) {
            const items = this.controller.visibleItems.getValue();
            this._L('updateRows', items);
            if (items) {
                if (this.groupped) {
                    this.rows = [];
                    this.groups = [];
                    this.groupStart = {};
                    this.groupEnd = {};
                    for (const row of items) {
                        const group = row as DmTableGrouppedRows<T>;
                        if (group.rows?.length || group.collapsible) {
                            const gr = {
                                id: group.id!,
                                index: this.groups.length,
                                first: this.rows?.length || 0,
                                last: this.rows?.length || 0,
                                // rows: group.rows,
                                data: group.data,
                                collapsed: group.collapsed,
                                collapsible: group.collapsible
                            };
                            if (this.groupHeaderTpl) {
                                this.rows.push({ type: 1, group: gr });
                            }
                            if (group.rows?.length && (!group.collapsible || !group.collapsed)) {
                                this.rows.push(...group.rows.map(row => ({ row })));
                                gr.last = this.rows.length - 1;
                                if (this.groupFooterTpl) {
                                    this.rows.push({ type: 2, group: gr });
                                }
                            }
                            this.groups.push(gr);
                            this.groupStart[gr.first] = gr;
                            this.groupEnd[gr.last] = gr;
                        }
                    }
                }
                else {
                    this.rows = items.map(row => ({ row }));
                }
            }
        }
        this._L('updateRows', this.rows);
        // this.rows = this.rows.slice();
        this._cdr.markForCheck();
    }

    toggleSort(id: string) {
        this.sort = { [id]: -(this.sort?.[id] || -1) };
        if (this.controller) {
            this.controller.sort.next(this.sort);
        }
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
            this.tableWidth = xw[1] - this.scrollBarWidth
                - (this.showSelectColumn ? +this.selectColumnWidth : 0);
            this.tableLeft = xw[0];
        }
    }

    getRowClasses(row: any, index: number): string {
        let res = this.isRowSelected(row) ? 'ngx-dmt-selected' : '';
        if (this.rowClasses) {
            for (const k in this.rowClasses) {
                if (this.rowClasses[k](row, index, this.groupStart ? this.groupStart[index] : undefined)) {
                    res += ' ' + k;
                }
            }
        }
        return res;
    }

    getCellClasses(row: any, colId: string, rowIndex: number, colIndex: number) {
        const cell = this.ctMap![colId];
        let res = cell.cellClass;
        if (cell.cellClasses) {
            for (const k in cell.cellClasses) {
                if (cell.cellClasses[k](row, colId, rowIndex, colIndex, this.groupStart ? this.groupStart[rowIndex] : undefined)) {
                    res += ' ' + k;
                }
            }
        }
        return res;
    }

    colsWidthChangeEmit(v: { [id: string]: number }): void {
        this.disableChanges = true;
        setTimeout(() => this.disableChanges = false);
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
        const ro = this._getOffset(this.resizerDiv!);
        return ro.x - to.x;
    }

    trackByFn = (index: number, row: any): any => this.controller?.trackBy ? this.controller.trackBy(row, index) : row;

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

    onRowDragLeave(_index: number, _row: any, _event: DragEvent, el: HTMLTableRowElement) {
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

    isRowSelected(row: any): boolean {
        if (this.controller) {
            return !!this.controller.selected.get(this.controller.trackBy ? this.controller.trackBy(row) : row);
        }
        else {
            return false;
        }
    }

    toggleSelect(row: any, e: MouseEvent): void {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (this.controller) {
            this.controller.toggleSelected(this.controller.trackBy ? this.controller.trackBy(row) : row);
        }
    }

    toggleSelectAll(e: MouseEvent): void {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (this.controller) {
            this.controller.setAllSelected(!this.allRowsSelected);
        }
    }

    getNormalizedTableWidth(): [number, boolean] {
        let cwChanged = false;
        let tcw = 0;
        for (const cid of this.colsOrder!) {
            const cd = this.ctMap![cid];
            let w = this.colsWidth[cd.colId!] || 0;
            if (cd.minWidth && w < +cd.minWidth) {
                w = +cd.minWidth;
            }
            else if (cd.maxWidth && w > +cd.maxWidth) {
                w = +cd.maxWidth;
            }
            if (w != this.colsWidth[cd.colId!]) {
                this.colsWidth[cd.colId!] = w;
                cwChanged = true;
            }
            tcw += w;
        }
        return [tcw, cwChanged];
    }

    updateGlobalStyles(): void {
        if (this.controller) {
            if (this.controller.state.getValue().itemsSelected > 0) {
                this._r2.addClass(this._elemRef.nativeElement, 'ngx-dmt-selecting');
            }
            else {
                this._r2.removeClass(this._elemRef.nativeElement, 'ngx-dmt-selecting');
            }
            if (this.allRowsSelected) {
                this._r2.addClass(this._elemRef.nativeElement, 'ngx-dmt-selected-all');
            }
            else {
                this._r2.removeClass(this._elemRef.nativeElement, 'ngx-dmt-selected-all');
            }
            if (this.allRowsNotSelected) {
                this._r2.addClass(this._elemRef.nativeElement, 'ngx-dmt-selected-none');
            }
            else {
                this._r2.removeClass(this._elemRef.nativeElement, 'ngx-dmt-selected-none');
            }
        }
    }

    sortItems<K = T | DmTableGrouppedRows<T>>(items: K[], sort?: DmTableSort): K[] {
        this._L('sortItems', sort, items);
        if (this.ctMap && items.length > 1 && sort) {
            const sfns: ((a: T, b: T) => number)[] = [];
            for (const id of Object.keys(sort).sort((a, b) => Math.abs(sort[a]) - Math.abs(sort[b]))) {
                if (this.ctMap[id]?.sortable) {
                    if (!this.ctMap[id].sort || this.ctMap[id].sort == 'string') {
                        sfns.push(sort[id] > 0 ? SortStringsBy(id) : (a, b) => SortStringsBy(id)(b, a));
                    }
                    else if (this.ctMap[id].sort == 'number') {
                        sfns.push(sort[id] > 0 ? SortNumbersBy(id) : (a, b) => SortNumbersBy(id)(b, a));
                    }
                    else if (this.ctMap[id].sort == 'boolean') {
                        sfns.push(sort[id] > 0 ? SortBooleansBy(id) : (a, b) => SortBooleansBy(id)(b, a));
                    }
                    else if (typeof this.ctMap[id].sort == 'function') {
                        sfns.push(sort[id] > 0 ? this.ctMap[id].sort as any : (a, b) => (this.ctMap![id].sort as any)(b, a));
                    }
                }
            }
            if (sfns.length > 0) {
                if (this.groupped) {
                    (items as  DmTableGrouppedRows<T>[]).forEach(g => {
                        if (g?.rows) {
                            g.rows.sort(multiSortFn(sfns));
                        }
                    });
                }
                else {
                    (items as any).sort(multiSortFn(sfns));
                }
            }
        }
        return items;
    }

    checkSortFn(): void {
        if (this.controller && !this.controller.sortFn) {
            this.controller.sortFn = (items, sort) => this.sortItems(items, sort);
        }
    }

    _log = Function.prototype.bind.apply(console.log, [console, '[DmTable]']);
    _W = Function.prototype.bind.apply(console.warn, [console, '[DmTable]']);
    _L(label: string, ...x: any[]): void {
        if (this.debug) {
            this._log(label, ...x);
        }
    }

}
