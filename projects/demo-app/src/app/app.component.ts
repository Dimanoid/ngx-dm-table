import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

    stripes: boolean = true;
    data: any[][] = [];

    ngOnInit() {
        for (let i = 1; i <= 100; i++) {
            this.data.push(
                [
                    `Id${i}`,
                    `String${i}`,
                    `Not very long string with spaces${i}`,
                    `Not_very_long_string_without_spaces${i}`,
                    `Long long long long long long long long long long long long long long long long long long long string with spaces${i}`,
                    `Long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_long_string_without_spaces${i}`,
                ]
            );
        }
    }

}
