import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmTableComponent } from './dm-table.component';

@NgModule({
    declarations: [DmTableComponent],
    imports: [
        CommonModule
    ],
    exports: [
        DmTableComponent
    ]
})
export class DmTableModule { }
