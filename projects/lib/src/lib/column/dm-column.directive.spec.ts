import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DmColumnDirective } from './dm-column.directive';

describe('DmColumnDirective', () => {
    let component: DmColumnDirective;
    let fixture: ComponentFixture<DmColumnDirective>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DmColumnDirective]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DmColumnDirective);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
