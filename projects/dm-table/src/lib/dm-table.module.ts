import { NgModule } from '@angular/core';
import { DmTableComponent } from './table/dm-table.component';
import { DmColumnDirective } from './column/dm-column.directive';

@NgModule({
    declarations: [
        DmTableComponent,
        DmColumnDirective
    ],
    imports: [],
    exports: [
        DmTableComponent,
        DmColumnDirective
    ]
})
export class DmTableModule { }
