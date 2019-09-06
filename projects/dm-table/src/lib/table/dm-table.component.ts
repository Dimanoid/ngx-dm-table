import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'dm-table, [dm-table]',
    exportAs: 'dmTable',
    templateUrl: './dm-table.component.html',
    styles: ['./dm-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DmTableComponent implements OnInit {

    constructor() { }

    ngOnInit() {
    }

}
