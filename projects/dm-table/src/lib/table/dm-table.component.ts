import {
    Component, OnInit, AfterViewInit,
    ChangeDetectionStrategy, ViewEncapsulation,
    Input, HostBinding,
    ContentChildren, QueryList, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { DmColumnDirective } from '../column/dm-column.directive';
import { _D, getScrollBarSize, emptyCount, Point } from '../utils';
import { InputBoolean } from '../utils';

const MIN_COLUMN_WIDTH = 30;

@Component({
    selector: 'dm-table',
    exportAs: 'dmTable',
    templateUrl: './dm-table.component.html',
    styleUrls: ['./dm-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DmTableComponent implements OnInit, AfterViewInit {
    @HostBinding('class.ngx-dm-table-container') _hostCss = true;

    @Input() rows: any[][];

    private _columnTemplates: QueryList<DmColumnDirective>;
    @ContentChildren(DmColumnDirective)
    set columnTemplates(val: QueryList<DmColumnDirective>) {
        this._columnTemplates = val;
        this.updateColumns(this._columnTemplates);
    }
    get columnTemplates(): QueryList<DmColumnDirective> {
        return this._columnTemplates;
    }

    @Input() @InputBoolean() stripes: boolean = false;

    hasFooter: boolean = false;
    tableWidth: number = 0;
    colWidths: number[] = [];
    scrollBarWidth: number = 0;
    scrollBarHeight: number = 0;
    resizeColumnIndex: number = -1;
    resizeColumnStartPoint: Point;
    resizeColumnWidth: number = 0;

    constructor(private _elemRef: ElementRef, private _cdr: ChangeDetectorRef) {
        [this.scrollBarWidth, this.scrollBarHeight] = getScrollBarSize();
    }

    ngOnInit() {
        _D('[DmTableComponent] ngOnInit, rows:', this.rows);
    }

    ngAfterViewInit() {
        this.tableWidth = this.getHostWidth();
        _D('[DmTableComponent] ngAfterViewInit, tableWidth:', this.tableWidth);
        if (this._columnTemplates) {
            this.updateColumns(this.columnTemplates);
        }
    }

    updateColumns(cds: QueryList<DmColumnDirective>): void {
        const cdsArray = cds.toArray();
        _D('[DmTableComponent] updateColumns, cdsArray:', cdsArray);
        this.hasFooter = false;
        for (const cd of cdsArray) {
            if (cd.footerTpl) {
                this.hasFooter = true;
            }
        }
        if (this.tableWidth > 0) {
            let maxi = cdsArray.length - 1;
            let tcw = 0;
            const cws: number[] = [];
            for (let i = 0; i < cdsArray.length; i++) {
                const cd = cdsArray[i];
                let w = cd.width ? cd.width : 0;
                if (cd.minWidth && w < cd.minWidth) {
                    w = cd.minWidth;
                }
                else if (cd.maxWidth && w > cd.maxWidth) {
                    w = cd.maxWidth;
                }
                cws.push(w);
                tcw += w;
                if (cd.maximize) {
                    maxi = i;
                }
            }
            _D('[DmTableComponent] updateColumns, tcw:', tcw, 'maxi:', maxi, 'cws:', cws);
            if (tcw < this.tableWidth - this.scrollBarWidth) {
                const ec = emptyCount(cws);
                _D('[DmTableComponent] updateColumns, ec:', ec);
                if (ec > 0) {
                    const w = Math.trunc((this.tableWidth - this.scrollBarWidth - tcw) / ec);
                    const extraW = this.tableWidth - this.scrollBarWidth - tcw - w * ec;
                    _D('[DmTableComponent] updateColumns, w:', w, 'extraW:', extraW);
                    for (let i = 0; i < cws.length; i++) {
                        if (!cws[i]) {
                            cws[i] = w;
                        }
                    }
                    cws[maxi] += extraW;
                }
            }
            else if (tcw > this.tableWidth - this.scrollBarWidth) {

            }
            _D('[DmTableComponent] updateColumns, aftermath cws:', cws);
            this.colWidths = cws;
            setTimeout(() => this._cdr.markForCheck());
        }
    }

    getHostWidth(): number {
        if (this._elemRef && this._elemRef.nativeElement) {
            return this._elemRef.nativeElement.clientWidth;
        }
        return 0;
    }

    resizeColumnStart(index: number, event: MouseEvent): void {
        _D('[DmTableComponent] resizeColumnStart:', index, event);
        this.resizeColumnIndex = index;
        this.resizeColumnWidth = this.colWidths[index];
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
        this._cdr.markForCheck();
    }

    resizeColumnMove(delta: number): void {
        this.resizeColumnUpdateWidth(delta);
        this._cdr.markForCheck();
    }

    resizeColumnEnd(delta: number): void {
        _D('[DmTableComponent] resizeColumnEnd:', delta);
        this.resizeColumnUpdateWidth(delta);
        this.colWidths[this.resizeColumnIndex] = this.resizeColumnWidth;
        this.resizeColumnStartPoint = undefined;
        this.resizeColumnIndex = -1;
        this._cdr.markForCheck();
    }

    resizeColumnUpdateWidth(delta: number) {
        const ct = this.columnTemplates.toArray()[this.resizeColumnIndex];
        const w = this.colWidths[this.resizeColumnIndex];
        let nw = w + delta;
        if (ct.minWidth && ct.minWidth > nw) {
            nw = ct.minWidth;
        }
        else if (nw < MIN_COLUMN_WIDTH) {
            nw = MIN_COLUMN_WIDTH;
        }
        else if (ct.maxWidth && ct.maxWidth < nw) {
            nw = ct.maxWidth;
        }
        this.resizeColumnWidth = nw;
    }

}
