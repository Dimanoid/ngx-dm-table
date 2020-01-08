import { Directive, OnInit, Input, ContentChild, TemplateRef, ElementRef } from '@angular/core';
import { InputBoolean, InputNumber, _D } from '../utils';
import { DmTableService, DMT_CONFIG_FIELDS } from '../dm-table.service';

export const MIN_COLUMN_WIDTH = 30;
export const MIN_COLUMN_SORT_WIDTH = MIN_COLUMN_WIDTH + 20;

@Directive({
    selector: 'dm-column',
    exportAs: 'dmColumn'
})
export class DmColumnDirective implements OnInit {
    @Input() colId: string;
    @Input() colIdAlias: string;
    @Input() title: string;
    @Input() @InputBoolean() pinnable: boolean;
    @Input() @InputBoolean() sortable: boolean;
    @Input() @InputBoolean() resizable: boolean;
    @Input() @InputBoolean() flexible: boolean;
    @Input() whitespace: string;
    private _minWidth: number;
    @Input() @InputNumber()
    set minWidth(v: number) {
        this._minWidth = v && v > MIN_COLUMN_WIDTH ? +v : MIN_COLUMN_WIDTH;
    }
    get minWidth(): number {
        return this._minWidth;
    }
    @Input() @InputNumber() maxWidth: number;
    @Input() frozen: 'left' | 'right' | 'no' = 'no';
    @Input() headerTooltip: string;
    @Input() headerClass: string;
    @Input() cellClass: string;
    @Input() footerClass: string;
    @Input() sort: 'string' | 'number' | 'boolean' | ((a: any, b: any) => number);

    @ContentChild('header', { static: true }) headerTpl: TemplateRef<any>;
    @ContentChild('cell', { static: true }) cellTpl: TemplateRef<any>;
    @ContentChild('footer', { static: true }) footerTpl: TemplateRef<any>;

    constructor(private _dts: DmTableService) {}

    ngOnInit() {
        const cfg = this._dts.getColumnConfig();
        for (const field of DMT_CONFIG_FIELDS) {
            if (this[field] === undefined && cfg[field] !== undefined) {
                this[field] = cfg[field];
            }
        }
        if (!this._minWidth || this._minWidth < MIN_COLUMN_WIDTH) {
            this._minWidth = MIN_COLUMN_WIDTH;
        }
        if (this.sortable && this.minWidth < MIN_COLUMN_SORT_WIDTH) {
            this._minWidth = MIN_COLUMN_SORT_WIDTH;
        }
    }

}
