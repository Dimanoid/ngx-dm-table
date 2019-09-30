import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';

import { DmColumnDirective } from './dm-column.directive';

@Component({
    template: `
    <dm-column title="Title"
        width="100"
        minWidth="50"
        maxWidth="150"
        sortable="true"
        sort="number"
        headerTooltip="tooltip">
    </dm-column>
    `
})
class TestDmColumnComponent {
}


describe('Directive: DmColumn', () => {

    let component: TestDmColumnComponent;
    let fixture: ComponentFixture<TestDmColumnComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TestDmColumnComponent, DmColumnDirective]
        });
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TestDmColumnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

});
