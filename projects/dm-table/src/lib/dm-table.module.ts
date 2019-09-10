import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmTableComponent } from './table/dm-table.component';
import { DmColumnDirective } from './column/dm-column.directive';

@NgModule({
    declarations: [
        DmTableComponent,
        DmColumnDirective
    ],
    imports: [CommonModule],
    exports: [
        DmTableComponent,
        DmColumnDirective
    ]
})
export class DmTableModule { }
