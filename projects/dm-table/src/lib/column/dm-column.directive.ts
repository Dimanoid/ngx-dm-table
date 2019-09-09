import { Directive, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ContentChild, TemplateRef } from '@angular/core';
import { InputBoolean, InputCssPixel } from '../utils';

@Directive({
    selector: 'dm-column, [dm-column]',
    exportAs: 'dmColumn'
})
export class DmColumnDirective implements OnInit {

    @Input() title: string;
    @Input() @InputBoolean() pinnable = false;
    @Input() @InputBoolean() sortable = false;
    @Input() @InputBoolean() draggable = false;
    @Input() @InputCssPixel() minWidth;
    @Input() frozen: 'left' | 'right' | 'no' = 'no';

    @ContentChild('header', { static: true }) headerTpl: TemplateRef<any>;
    @ContentChild('cell', { static: true }) cellTpl: TemplateRef<any>;
    @ContentChild('footer', { static: true }) footerTpl: TemplateRef<any>;

    constructor() { }

    ngOnInit() {
    }

}
