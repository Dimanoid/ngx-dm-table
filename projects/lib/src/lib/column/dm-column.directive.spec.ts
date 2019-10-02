import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';

import { DmTableService } from '../dm-table.service';

import { DmColumnDirective, MIN_COLUMN_WIDTH } from './dm-column.directive';

describe('DmColumnDirective', () => {
    let spectator: SpectatorDirective<DmColumnDirective>;
    const createDirective = createDirectiveFactory({
        directive: DmColumnDirective,
        providers: [DmTableService]
    });

    beforeEach(() => {
        spectator = createDirective(`
            <dm-column title="Title"
                minWidth="10"
                maxWidth="150"
                sortable="true"
                sort="number"
                headerTooltip="tooltip">
            </dm-column>
        `);
    });

    it('should be created', () => {
        expect(spectator.directive).toBeDefined();
    });

    it('should set minWidth to MIN_COLUMN_WIDTH', () => {
        expect(spectator.directive.minWidth).toEqual(MIN_COLUMN_WIDTH);
    });

});
