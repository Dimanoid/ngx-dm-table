# ngx-dm-table

![npm version](https://img.shields.io/npm/v/@dimanoid/ngx-dm-table/latest) ![bundle size](https://img.shields.io/bundlephobia/min/@dimanoid/ngx-dm-table) ![build](https://travis-ci.com/Dimanoid/ngx-dm-table.svg?branch=release) [![Coverage Status](https://coveralls.io/repos/github/Dimanoid/ngx-dm-table/badge.svg?branch=release)](https://coveralls.io/github/Dimanoid/ngx-dm-table?branch=release)

Demo page: https://dimanoid.github.io/ngx-dm-table/

## Installation

Install the library and dependecies:

  `npm i -S @angular/cdk resize-observer-polyfill @dimanoid/ngx-dm-table`

Add module to imports:

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
<br>

### DmTableComponent `<dm-table></dm-table>`

Property | Description | Type | Default value
---------|-------------|------|--------------
**`[data]`** | Array of rows to display | `any[]` | 
**`[trackBy]`** | trackBy function that will be used in `*cdkVirtualFor` | `(index: number, item: T) => any` | 
**`[itemSize]`** | Row height in pixels, minimum if rows has variable height | `number` | **MIN_ITEM_SIZE** (30)
**`[moveableColumns]`** | Whether table columns can be reordered by drag-n-drop or not | `boolean` | **true**
**`[(colsOrder)]`** | Array of row's IDs defining the current display order, can be changed if `[moveableColumns]` is set to **true** | `string[]` | 
**`(colsOrderChange)`** | Callback executed when `[colsOrder]` is changed | `EventEmitter<string[]>` | 
**`[(colsWidth)]`** | Hashmap of columns widths, object where key is column ID and value is width in pixels | `{ [id: string]: number }` | 
**`(colsWidthChange)`** | Callback executed when `[colsWidth]` is changed | `EventEmitter<{ [id: string]: number }>` | 
**`[colsVisibility]`** | Hashmap of columns visibility, object where key is column ID and value is boolean indicating if this column should be displayed | `{ [id: string]: boolean }` |
**`[externalSort]`** | If `true` no internal sort will be performed, just change value and display | `boolean` | **false**
**`[(sort)]`** | Column ID and order used for internal sorting | [`DmTableSort`](#DmTableSort) | 
**`(sortChange)`** | Callback executed when `[sort]` is changed | `EventEmitter<`[`DmTableSort`](#DmTableSort)`>` | 
**`[defaultColumnConfig]`** | Default config for columns, can be overriden in column's definition | [`DmTableColumnConfig`](#DmTableColumnConfig) | 
**`[tableClass]`** | CSS classes that will be added to the `<table>` tags (header, body and footer tables) | `string` | 
**`[rowClasses]`** | Hashmap where key is CSS classes that will be added to row's `<tr>` tag if value function will return true | `{ [className: string]: (row: any) => boolean }` |
**`(headerClick)`** | Fires when table header is clicked | `EventEmitter<`[`DmTableHeaderEvent`](#DmTableHeaderEvent)`>` | 
**`(headerContextMenu)`** | Fires when table header is right-clicked | `EventEmitter<`[`DmTableHeaderEvent`](#DmTableHeaderEvent)`>` | 
**`(rowClick)`** | Fires when table row is clicked | `EventEmitter<`[`DmTableRowEvent`](#DmTableRowEvent)`>` |
**`(rowContextMenu)`** | Fires when table row is right-clicked | `EventEmitter<`[`DmTableRowEvent`](#DmTableRowEvent)`>` | 

<br><br>

### DmColumnDirective `<dm-column></dm-column>`

Property | Description | Type
---------|-------------|-----
**`[colId]`** | Unique ID of the column | `string`
**`[title]`** | Column header title string, will be displayed if no `#header` template is defined | `string`
**`[pinnable]`** | *Not yet implemented* | `boolean`
**`[sortable]`** | Whether the table can be sorted by this column or not | `boolean`
**`[resizable]`** | Whether this column can be resized or not | `boolean`
**`[flexible]`** | Should be set for the column that will "accumulate" all the size change first, if not set the last column will be marked as flexible, if more then one column set as flexible last one will be used | `boolean`
**`[whitespace]`** | This will be set as a value of the CSS property `whitespace` for every cell in this column | `string`
**`[minWidth]`** | Minimum width of the column in pixels, column will not be shrinked less then this value | `number`
**`[maxWidth]`** | Maximum width of the column in pixels, column will not be expanded more then this value | `number`
**`[frozen]`** | *Not yet implemented* | `'left' \| 'right' \| 'no'`
**`[headerTooltip]`** | This will be set as a `title` of column's header tag  | `string`
**`[headerClass]`** | CSS classes that will be added to column's header `<th>` tag | `string`
**`[cellClass]`** | CSS classes that will be added to column's cell `<td>` tag | `string`
**`[footerClass]`** | CSS classes that will be added to column's footer `<td>` tag | `string`
**`[sort]`** | Type of data for internal sort or custom sort function | `'string' \| 'number' \| 'boolean' \| ((a: any, b: any) => number)`

<br>

### DmTableSort

```ts
export interface DmTableSort {
    colId: string;
    order: number;
}
```
<br>

### DmTableColumnConfig
```ts
export class DmTableColumnConfig {
    pinnable: boolean = false;
    sortable: boolean = false;
    resizable: boolean = true;
    whitespace: string = 'normal';
    minWidth: number;
    headerClass: string;
    cellClass: string;
    footerClass: string;
    sort: 'string' | 'number' | 'boolean' | ((a: any, b: any) => number);

    constructor(json?: any) { }
}
```
<br>

### DmTableHeaderEvent
```ts
export interface DmTableHeaderEvent {
    colId: string;
    index: number;
    first: boolean;
    last: boolean;
    event: MouseEvent;
}
```
<br>

### DmTableRowEvent
```ts
export interface DmTableRowEvent {
    index: number;
    row: any;
    event: MouseEvent;
}
```
<br>

### Example
```html
<dm-table class="ngx-dmt-stripes"
    [data]="[
        [1, 'one', { key: 'value1' }],
        [2, 'two', { key: 'value2' }],
        [3, 'three', { key: 'value3' }]
    ]"
    [colsWidth]="{ 0: 50 }"
    [defaultColumnConfig]="{ minWidth: 200 }">
    <dm-column title="ID"
        minWidth="50" maxWidth="150"
        sortable="true" sort="number">
    </dm-column>
    <dm-column title="Text" sortable="true" sort="string"></dm-column>
    <dm-column>
        <ng-template #header>
            <div>
                <i style="color: red">
                    <u>Key value</u>
                </i>
            </div>
        </ng-template>
        <ng-template #cell let-item>
            <div>
                key: <b>{{ item['key'] }}</b>
            </div>
        </ng-template>
    </dm-column>
</dm-table>
```

#### Result
<p>
    <img src="https://raw.githubusercontent.com/dimanoid/ngx-dm-table/master/assets/readme1.png">
</p>
