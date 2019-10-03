import { Component, OnInit, ViewEncapsulation } from '@angular/core';

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
        return (a[1].name as string).localeCompare(b[1].name);
    }

    log(...args) {
        this.colsData[args[0]] = args[1];
        console.log(...args);
    }

}
