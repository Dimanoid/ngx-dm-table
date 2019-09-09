import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, ContentChildren, QueryList } from '@angular/core';
import { DmColumnDirective } from '../column';

@Component({
    selector: 'dm-table, [dm-table]',
    exportAs: 'dmTable',
    templateUrl: './dm-table.component.html',
    styles: ['./dm-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DmTableComponent implements OnInit {

    @Input() rows: any[];

    @ContentChildren(DmColumnDirective)
    private _columnTemplates: QueryList<DmColumnDirective>;
    set columnTemplates(val: QueryList<DmColumnDirective>) {
        this._columnTemplates = val;
    }
    get columnTemplates(): QueryList<DmColumnDirective> {
        return this._columnTemplates;
    }


    constructor() { }

    ngOnInit() {
    }

}
