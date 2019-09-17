import {
    Component, OnInit, AfterViewInit,
    ChangeDetectionStrategy, ViewEncapsulation,
    Input, HostBinding,
    ContentChildren, QueryList, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { DmColumnDirective } from '../column/dm-column.directive';
import { _D, getScrollBarSize, emptyCount, Point } from '../utils';
import { InputBoolean } from '../utils';

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

    private _columnTemplatesQL: QueryList<DmColumnDirective>;
    @ContentChildren(DmColumnDirective)
    set columnTemplatesQL(val: QueryList<DmColumnDirective>) {
        this._columnTemplatesQL = val;
        this.columnTemplates = val ? val.toArray() : [];
        this.updateColumns(this.columnTemplates);
    }
    get columnTemplatesQL(): QueryList<DmColumnDirective> {
        return this._columnTemplatesQL;
    }
    columnTemplates: DmColumnDirective[] = [];

    @Input() @InputBoolean() stripes: boolean = false;

    hasFooter: boolean = false;
    flexColumnIndex: number = -1;
    tableWidth: number = 0;
    colWidths: number[] = [];
    colWidthsTmp: number[] = [];
    scrollBarWidth: number = 0;
    scrollBarHeight: number = 0;
    resizeColumnIndex: number = -1;
    resizeColumnStartPoint: Point;

    constructor(private _elemRef: ElementRef, private _cdr: ChangeDetectorRef) {
        [this.scrollBarWidth, this.scrollBarHeight] = getScrollBarSize();
        const hw = this.getHostWidth();
        if (hw) {
            this.tableWidth = hw - this.scrollBarWidth;
        }
    }

    ngOnInit() {
        _D('[DmTableComponent] ngOnInit, rows:', this.rows);
    }

    ngAfterViewInit() {
        this.tableWidth = this.getHostWidth() - this.scrollBarWidth;
        _D('[DmTableComponent] ngAfterViewInit, tableWidth:', this.tableWidth);
        if (this._columnTemplatesQL) {
            this.updateColumns(this.columnTemplates);
        }
    }

    updateColumns(cds: DmColumnDirective[]): void {
        _D('[DmTableComponent] updateColumns, cds:', cds);

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
        this.colWidthsTmp = this.colWidths.slice();
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
        this.colWidths = this.colWidthsTmp;
        this.colWidthsTmp = undefined;
        this.resizeColumnStartPoint = undefined;
        this.resizeColumnIndex = -1;
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
        const rd = this.colWidthsTmp.reduce((a, b) => a + b, 0) - this.tableWidth;
        if (rd > 0) {
            this.shinkTmpColumns(rd);
        }
        else if (rd < 0) {
            this.colWidthsTmp[this.flexColumnIndex] -= rd;
            _D('[DmTableComponent] resizeColumnUpdateWidth colWidthsTmp:', this.colWidthsTmp[this.flexColumnIndex], 'rd:', rd);
        }
    }

    shinkTmpColumns(delta: number): void {
        const flexCT = this.columnTemplates[this.flexColumnIndex];
        let d = delta;
        const fw = this.colWidthsTmp[this.flexColumnIndex];
        _D('[DmTableComponent] shinkTmpColumns delta:', delta, 'fw:', fw, 'flexCT.minWidth:', flexCT.minWidth);
        if (fw - d > flexCT.minWidth) {
            this.colWidthsTmp[this.flexColumnIndex] -= d;
            _D('[DmTableComponent] shinkTmpColumns colWidthsTmp:', this.colWidthsTmp[this.flexColumnIndex]);
            return;
        }
        else if (fw > flexCT.minWidth) {
            d -= fw - flexCT.minWidth;
            this.colWidthsTmp[this.flexColumnIndex] = flexCT.minWidth;
            _D('[DmTableComponent] shinkTmpColumns colWidthsTmp:', this.colWidthsTmp[this.flexColumnIndex], 'd:', d);
        }
        let i = this.columnTemplates.length;
        while (i--) {
            if (i != this.flexColumnIndex) {
                const ct = this.columnTemplates[i];
                const cw = this.colWidthsTmp[this.flexColumnIndex];
                if (cw - d > ct.minWidth) {
                    this.colWidthsTmp[this.flexColumnIndex] -= d;
                    return;
                }
                else if (cw > ct.minWidth) {
                    d -= cw - ct.minWidth;
                    this.colWidthsTmp[this.flexColumnIndex] = ct.minWidth;
                }
            }
        }
    }

}
