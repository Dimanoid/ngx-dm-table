import {
    Component, OnInit,
    ChangeDetectionStrategy, ViewEncapsulation,
    Input,
    ContentChildren, QueryList, HostBinding
} from '@angular/core';
import { DmColumnDirective } from '../column/dm-column.directive';
import { _D } from '../utils';
import { InputBoolean } from '../utils';

@Component({
    selector: 'dm-table, [dm-table]',
    exportAs: 'dmTable',
    templateUrl: './dm-table.component.html',
    styleUrls: ['./dm-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DmTableComponent implements OnInit {
    @HostBinding('style.position') _hostPosition = 'relative';
    @HostBinding('style.width') _hostWidth = '100%';

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

    constructor() { }

    ngOnInit() {
        _D('[DmTableComponent] ngOnInit, rows:', this.rows);
    }

    updateColumns(cds: QueryList<DmColumnDirective>) {
        _D('[DmTableComponent] updateColumns, cds:', cds.toArray());
    }

}
