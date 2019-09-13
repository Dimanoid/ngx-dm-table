import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
registerLocaleData(en);
import {
    NZ_I18N, en_US,
    NzSwitchModule
} from 'ng-zorro-antd';

import { DmTableModule } from '@dimanoid/ngx-dm-table';

import { AppComponent } from './app.component';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule, CommonModule,
        FormsModule, ReactiveFormsModule,
        NzSwitchModule,
        DmTableModule
    ],
    providers: [
        { provide: NZ_I18N, useValue: en_US },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
