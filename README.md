# ngx-dm-table

![npm version](https://img.shields.io/npm/v/@dimanoid/ngx-dm-table/latest) ![bundle size](https://img.shields.io/bundlephobia/min/@dimanoid/ngx-dm-table) ![build](https://travis-ci.com/Dimanoid/dm-table.svg?branch=release) [![Coverage Status](https://coveralls.io/repos/github/Dimanoid/dm-table/badge.svg?branch=release)](https://coveralls.io/github/Dimanoid/dm-table?branch=release)

demo page: https://dimanoid.github.io/dm-table/

## Installation

`npm i @dimanoid/ngx-dm-table -S`

Add module to imports

```ts
import { DmTableModule } from '@dimanoid/ngx-dm-table';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule, BrowserAnimationsModule, CommonModule,
        .......
        DmTableModule  // <-------
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```


## API

### DmTableComponent `<dm-table></dm-table>`

Property | Description | Type | Default value
---------|-------------|------|--------------
**`[rows]`** | Array of rows to display | `any[]` | 
**`[itemSize]`** | Row height in pixels, minimum if rows has variable height | `number` | **MIN_ITEM_SIZE** (30)
**`[moveableColumns]`** | Whether table columns can be reordered by drag-n-drop or not | `boolean` | **true**
**`[(colsOrder)]`** | Array of row's IDs defining the current display order, can be changed if `[moveableColumns]` is set to **true** | `string[]` | 
**`(colsOrderChange)`** | Callback executed when `[colsOrder]` is changed | `EventEmitter<string[]>` | 
**`[(colsWidth)]`** | Hashmap of columns widths, object where key is column ID and value width in pixels | `{ [id: string]: number }` | 
**`(colsWidthChange)`** | Callback executed when `[colsWidth]` is changed | `EventEmitter<{ [id: string]: number }>` | 
**`[(sort)]`** | Column ID and order used for internal sorting | [`DmTableSort`](#dmtablesort) | 
**`(sortChange)`** | Callback executed when `[sort]` is changed | `EventEmitter<DmTableSort>` | 
**`[defaultColumnConfig]`** | Default config for columns, can be overriden in column's definition | [`DmTableColumnConfig`](#dmtablecolumnconfig) | 

### DmTableSort

```ts
export interface DmTableSort {
    colId: string;
    order: number;
}
```

### DmTableColumnConfig

```ts
export class DmTableColumnConfig {
    pinnable: boolean = false;
    sortable: boolean = false;
    resizeable: boolean = true;
    whitespace: string = 'normal';
    minWidth: number;
    headerClass: string;
    cellClass: string;
    footerClass: string;
    sort: 'string' | 'number' | 'boolean' | ((a: any, b: any) => number);

    constructor(json?: any) { }
}
```