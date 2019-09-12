import { Directive, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { InputBoolean, InputCssPixel } from '../utils';

@Directive({
    selector: 'dm-column, [dm-column]',
    exportAs: 'dmColumn'
})
export class DmColumnDirective implements OnInit {

    @Input() title: string;
    @Input() @InputBoolean() pinnable: boolean = false;
    @Input() @InputBoolean() sortable: boolean = false;
    @Input() @InputBoolean() draggable: boolean = false;
    @Input() @InputBoolean() resizeable: boolean = false;
    @Input() @InputCssPixel() minWidth: string | number;
    @Input() frozen: 'left' | 'right' | 'no' = 'no';

    @ContentChild('header', { static: true }) headerTpl: TemplateRef<any>;
    @ContentChild('cell', { static: true }) cellTpl: TemplateRef<any>;
    @ContentChild('footer', { static: true }) footerTpl: TemplateRef<any>;

    constructor() { }

    ngOnInit() {
    }

}
