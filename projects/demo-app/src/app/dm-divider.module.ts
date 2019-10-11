import { NgModule } from '@angular/core';
import { Directive, Input, Output, EventEmitter, ElementRef } from '@angular/core';

export class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

@Directive({
    selector: '[dm-divider]'
})
export class DmDividerDirective {
    @Input() enabled: boolean = true;
    @Output() dmDividerDragStart: EventEmitter<Point> = new EventEmitter();
    @Output() dmDividerDragEnd: EventEmitter<Point> = new EventEmitter();
    @Output() dmDividerMove: EventEmitter<Point> = new EventEmitter();

    private start: Point;
    private _elem: HTMLElement;

    constructor(elemRef: ElementRef) {
        this._elem = elemRef.nativeElement;

        this._elem.onmousedown = (event: MouseEvent) => {
            if (!this.enabled) {
                return;
            }
            // tslint:disable-next-line: deprecation
            event = event || window.event as MouseEvent;
            event.stopPropagation();
            event.preventDefault();
            if (event.pageX) {
                this.start = new Point(event.pageX, event.pageY);
            }
            else if (event.clientX) {
                this.start = new Point(event.clientX, event.clientY);
            }
            if (this.start) {
                this.dmDividerDragStart.emit(this.start);

                document.body.onmousemove = (e: MouseEvent) => {
                    // tslint:disable-next-line: deprecation
                    e = e || window.event as MouseEvent;
                    e.stopPropagation();
                    e.preventDefault();
                    let endX = 0;
                    let endY = 0;
                    if (e.pageX) {
                        endX = e.pageX;
                        endY = e.pageY;
                    }
                    else if (e.clientX) {
                        endX = e.clientX;
                        endY = e.clientX;
                    }
                    this.dmDividerMove.emit(new Point(endX - this.start.x, endY - this.start.y));
                };

                document.body.onmouseup = (e: MouseEvent) => {
                    document.body.onmousemove = document.body.onmouseup = null;
                    // tslint:disable-next-line: deprecation
                    e = e || window.event as MouseEvent;
                    e.stopPropagation();
                    e.preventDefault();
                    let endX = 0;
                    let endY = 0;
                    if (e.pageX) {
                        endX = e.pageX;
                        endY = e.pageY;
                    }
                    else if (e.clientX) {
                        endX = e.clientX;
                        endY = e.clientX;
                    }
                    this.dmDividerDragEnd.emit(new Point(endX - this.start.x, endY - this.start.y));
                    this.start = undefined;
                };
            }
        };

    }

}

@NgModule({
    declarations: [DmDividerDirective],
    exports: [DmDividerDirective]
})
export class DmDividerModule { }
