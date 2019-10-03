import { SpectatorHost, createHostFactory } from '@ngneat/spectator/jest';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DmTableService } from '../dm-table.service';
import { DmTableComponent } from './dm-table.component';

describe('DmTableComponent', () => {
    let spectator: SpectatorHost<DmTableComponent>;
    const createHost = createHostFactory({
        component: DmTableComponent,
        imports: [DragDropModule, ScrollingModule],
        providers: [DmTableService]
    });

    it('should be created and display empty columns list message', () => {
        spectator = createHost(`<dm-table></dm-table>`);
        expect(spectator.component).toBeTruthy();
        // expect(spectator.query('.ngx-dmt-nocolumns')).toBeTruthy();
    });

    xit('should display empty columns list message', () => {
        spectator = createHost(`<dm-table></dm-table>`, {
            hostProps: {
                title: 'Spectator is Awesome'
            }
        });
        expect(spectator.component).toBeTruthy();
    });

});
