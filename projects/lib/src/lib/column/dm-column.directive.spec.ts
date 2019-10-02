import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';

import { DmTableService } from '../dm-table.service';

import { DmColumnDirective, MIN_COLUMN_WIDTH, MIN_COLUMN_SORT_WIDTH } from './dm-column.directive';

describe('DmColumnDirective', () => {
    let spectator: SpectatorDirective<DmColumnDirective>;
    const createDirective = createDirectiveFactory({
        directive: DmColumnDirective,
        providers: [DmTableService]
    });

    it('should be created', () => {
        spectator = createDirective('<dm-column></dm-column>');
        expect(spectator.directive).toBeDefined();
    });

    it('should set not sortable minWidth to MIN_COLUMN_WIDTH', () => {
        spectator = createDirective('<dm-column minWidth="10"></dm-column>');
        expect(spectator.directive.minWidth).toEqual(MIN_COLUMN_WIDTH);
    });

    it('should set sortable minWidth to MIN_COLUMN_SORT_WIDTH', () => {
        spectator = createDirective('<dm-column minWidth="10" sortable="true"></dm-column>');
        expect(spectator.directive.minWidth).toEqual(MIN_COLUMN_SORT_WIDTH);
    });

});
