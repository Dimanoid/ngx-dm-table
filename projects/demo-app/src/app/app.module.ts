import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { DmTableModule } from '@dimanoid/ngx-dm-table';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DmTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
