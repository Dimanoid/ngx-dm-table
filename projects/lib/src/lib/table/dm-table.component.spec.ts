import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DmTableComponent } from './dm-table.component';

describe('DmTableComponent', () => {
    let component: DmTableComponent;
    let fixture: ComponentFixture<DmTableComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DmTableComponent],
            imports: [DragDropModule, ScrollingModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DmTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
