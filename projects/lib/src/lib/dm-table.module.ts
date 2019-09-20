import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DmTableComponent } from './table/dm-table.component';
import { DmColumnDirective } from './column/dm-column.directive';

@NgModule({
    declarations: [
        DmTableComponent,
        DmColumnDirective
    ],
    imports: [
        CommonModule,
        DragDropModule,
        ScrollingModule
    ],
    exports: [
        DmTableComponent,
        DmColumnDirective
    ]
})
export class DmTableModule { }
