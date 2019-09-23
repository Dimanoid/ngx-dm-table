import { Directive, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { InputBoolean, InputNumber } from '../utils';

const MIN_COLUMN_WIDTH = 30;
const MIN_COLUMN_SORT_WIDTH = MIN_COLUMN_WIDTH + 20;

@Directive({
    selector: 'dm-column, [dm-column]',
    exportAs: 'dmColumn'
})
export class DmColumnDirective implements OnInit {

    @Input() colId: string;
    @Input() title: string;
    @Input() @InputBoolean() pinnable: boolean = false;
    @Input() @InputBoolean() sortable: boolean = false;
    @Input() @InputBoolean() resizeable: boolean = true;
    @Input() @InputBoolean() flexible: boolean = false;
    @Input() whitespace: string = 'normal';
    @Input() @InputNumber() width: number;
    private _minWidth: number = MIN_COLUMN_WIDTH;
    @Input() @InputNumber()
    set minWidth(v: number) {
        this._minWidth = v && v > MIN_COLUMN_WIDTH ? +v : MIN_COLUMN_WIDTH;
    }
    get minWidth(): number {
        return this._minWidth;
    }
    @Input() @InputNumber() maxWidth: number;
    @Input() frozen: 'left' | 'right' | 'no' = 'no';
    @Input() headerClass: string;
    @Input() cellClass: string;
    @Input() footerClass: string;
    @Input() sort: 'string' | 'number' | 'boolean' | ((a: any, b: any) => number);

    @ContentChild('header', { static: true }) headerTpl: TemplateRef<any>;
    @ContentChild('cell', { static: true }) cellTpl: TemplateRef<any>;
    @ContentChild('footer', { static: true }) footerTpl: TemplateRef<any>;

    constructor() { }

    ngOnInit() {
        if (this.sortable && this.minWidth < MIN_COLUMN_SORT_WIDTH) {
            this._minWidth = MIN_COLUMN_SORT_WIDTH;
        }
    }

}
