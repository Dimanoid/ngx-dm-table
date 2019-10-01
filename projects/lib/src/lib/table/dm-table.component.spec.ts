import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DmTableService } from '../dm-table.service';
import { DmTableComponent } from './dm-table.component';

describe('DmTableComponent', () => {
    let spectator: Spectator<DmTableComponent>;
    const createComponent = createComponentFactory({
        component: DmTableComponent,
        imports: [DragDropModule, ScrollingModule],
        providers: [DmTableService]
    });

    beforeEach(() => spectator = createComponent());

    it('should be created', () => {
        expect(spectator.component).toBeTruthy();
    });
});
