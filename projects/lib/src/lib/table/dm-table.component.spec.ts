import { fakeAsync, flush } from '@angular/core/testing';
import { SpectatorHost, createHostFactory } from '@ngneat/spectator/jest';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DmTableService } from '../dm-table.service';
import { DmTableComponent } from './dm-table.component';
import { DmColumnDirective } from '../column/dm-column.directive';

describe('DmTableComponent', () => {
    let spectator: SpectatorHost<DmTableComponent>;
    const createHost = createHostFactory({
        component: DmTableComponent,
        declarations: [DmColumnDirective],
        imports: [DragDropModule, ScrollingModule],
        providers: [DmTableService]
    });

    it('should be created and display empty columns list message', fakeAsync(() => {
        spectator = createHost(`<dm-table></dm-table>`);
        expect(spectator.component).toBeTruthy();
        flush();
        spectator.detectChanges();
        expect(spectator.query('.ngx-dmt-nocolumns > span')).toExist();
        expect(spectator.query('.ngx-dmt-header-wrapper')).not.toExist();
        expect(spectator.query('.ngx-dmt-body-wrapper')).not.toExist();
        expect(spectator.query('.ngx-dmt-footer-wrapper')).not.toExist();
    }));

    it('should be created with 5 columns', fakeAsync(() => {
        spectator = createHost(`
            <dm-table>
                <dm-column colId="cid1"></dm-column>
                <dm-column colId="cid2"></dm-column>
                <dm-column colId="cid3"></dm-column>
                <dm-column colId="cid4"></dm-column>
                <dm-column colId="cid5"></dm-column>
            </dm-table>
        `);
        expect(spectator.component).toBeTruthy();
        flush();
        spectator.detectChanges();
        expect(spectator.query('.ngx-dmt-nocolumns > span')).not.toExist();
        expect(spectator.query('.ngx-dmt-header-wrapper')).toExist();
        expect(spectator.query('.ngx-dmt-body-wrapper')).toExist();
        expect(spectator.query('.ngx-dmt-footer-wrapper')).not.toExist();
        // console.log(spectator.query('.ngx-dmt-header-wrapper > table.ngx-dmt.ngx-dmt-header > thead').children[0]);
        // expect(spectator.query('.ngx-dmt-header-wrapper > table.ngx-dmt.ngx-dmt-header > thead > tr').children.length).toEqual(5);
        expect(spectator.component.columnTemplates.length).toEqual(5);
        let count = 0;
        const cids = ['cid1', 'cid2', 'cid3', 'cid4', 'cid5'];
        for (const ct of spectator.component.columnTemplates) {
            const ind = cids.indexOf(ct.colId);
            if (ind != -1) {
                count++;
                cids.splice(ind, 1);
            }
        }
        expect(count).toEqual(5);
    }));

});
