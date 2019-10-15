import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DmTableSort } from '@dimanoid/ngx-dm-table';
import { Point } from './dm-divider.module';

const ICONS = [
    'rocket',
    'palm-tree',
    'nurse-user',
    'female-rounded-1',
    'hat-magician',
    'crown-king-1',
    'apple',
    'doctor',
    'yang-ying',
    'umbrella'
];

const NAMES = [
    'Yuri Gagarin',
    'Robinson Crusoe',
    'Lisa Cuddy',
    'Jennifer Lopez',
    'Charlie Chaplin',
    'Louis XIV',
    'Isaac Newton',
    '‎Gregory House',
    'Gautama Buddha',
    'Mary Poppins'
];

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

    stripes: boolean = true;
    data: any[][] = [];
    lines: string = '100';
    linesList: string[] = ['0', '10', '100', '1000', '10000', '100000'];
    linesGenerating: boolean = true;
    colsData: { [id: string]: any } = {};
    colsVisibility: { [id: string]: boolean } = { 0: true, 1: true, 2: true, 3: false, 4: false, 5: true, 6: true, 7: false, 8: true };
    colsWidth: { [id: string]: number } = { 0: 38, 1: 100, 2: 160, 3: 200, 4: 200, 5: 30, 6: 400, 7: 100 };
    colsOrder: string[];
    sort: DmTableSort;
    public divider: {
        [name: string]: {
            min: number,
            max: number,
            inverse?: boolean,
            vertical?: boolean,
            moving?: boolean,
            start?: number,
            size?: number
        }
    } = {};
    selected: { [id: number]: boolean } = {};
    hideAll: boolean = false;

    Object = Object;
    selectedFn = (row: any) => this.selected[row[0]];

    constructor() {
        this.divider['d1'] = { min: 200, max: 700, vertical: true, size: 300 };
    }

    ngOnInit() {
        this.generateData();
    }

    generateData() {
        this.data = [];
        for (let i = 1; i <= +this.lines; i++) {
            const icon = Math.trunc(Math.random() * ICONS.length);
            const n = Math.floor(Math.random() * 62);
            const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(n);
            this.data.push(
                [
                    i,
                    i,
                    { icon: 'dmtd-' + ICONS[icon], name: NAMES[icon] },
                    `${i}_Not very long string with spaces`,
                    `${i}_Not_very_long_string_without_spaces`,
                    'dmtd-' + ICONS[icon],
                    `${i} sort as string`,
                    i % 2 > 0,
                    char + ` - Random length string:` + ' text'.repeat(n) + ' with spaces',
                ]
            );
        }
        this.linesGenerating = false;
    }

    customSort(a: any, b: any): number {
        return (a[2].name as string).localeCompare(b[2].name);
    }

    log(...args) {
        this.colsData[args[0]] = args[1];
        console.log(...args);
    }

    dividerDragStart(name: string, p: Point) {
        if (this.divider[name]) {
            this.divider[name].moving = true;
            this.divider[name].start = +this.divider[name].size;
        }
    }

    dividerDragEnd(name: string, p: Point) {
        if (this.divider[name]) {
            this.divider[name].moving = false;
            this.__dividerCalc(name, p);
        }
    }

    dividerMove(name: string, p: Point) {
        if (this.divider[name]) {
            this.__dividerCalc(name, p);
        }
    }

    private __dividerCalc(name: string, p: Point) {
        if (this.divider[name]) {
            const axis = this.divider[name].vertical ? 'x' : 'y';
            const m = this.divider[name].inverse ? -1 : 1;
            let size = +this.divider[name].start + (m * p[axis]);
            if (size < this.divider[name].min) {
                size = this.divider[name].min;
            }
            if (size > this.divider[name].max) {
                size = this.divider[name].max;
            }
            this.divider[name].size = size;
        }
    }

}
