import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
registerLocaleData(en);
import {
    NZ_I18N, en_US,
    NzSwitchModule,
    NzSelectModule,
    NzToolTipModule,
    NzCheckboxModule
} from 'ng-zorro-antd';
import { DmDividerModule } from './dm-divider.module';

import { DmTableModule } from '@dimanoid/ngx-dm-table';

import { AppComponent } from './app.component';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule, BrowserAnimationsModule, CommonModule,
        FormsModule, ReactiveFormsModule,
        NzSwitchModule, NzSelectModule, NzToolTipModule, NzCheckboxModule,
        DmDividerModule, DmTableModule
    ],
    providers: [
        { provide: NZ_I18N, useValue: en_US },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
