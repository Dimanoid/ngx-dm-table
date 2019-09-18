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
    linesList: string[] = ['10', '100', '1000', '10000', '100000'];
    linesGenerating: boolean = true;

    ngOnInit() {
        this.generateData();
    }

    generateData() {
        this.data = [];
        for (let i = 1; i <= +this.lines; i++) {
            const icon = Math.trunc(Math.random() * ICONS.length);
            this.data.push(
                [
                    `${i}_Id`,
                    `${i}_String`,
                    `${i}_Not very long string with spaces`,
                    `${i}_Not_very_long_string_without_spaces`,
                    'dmtd-' + ICONS[icon],
                    `${i}_Long long long long long long long long long long long long long long long long long long string with spaces`,
                    `${i}_Long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_string_without_spaces`,
                    `${i}_Extremely long long long long long long long long long long long long long long long long long long long long`
                        + ` long long long long long long long long long long long long long long long long long long long long long long`
                        + ` long long long long long long long long long long long long long long long long long long long long long long`
                        + ` long long long long long long long long long long long long long long long long long long long long long long`
                        + ` string with spaces`,
                ]
            );
        }
        this.linesGenerating = false;
    }

}
