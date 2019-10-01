import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';

import { DmTableService } from '../dm-table.service';

import { DmColumnDirective } from './dm-column.directive';

describe('DmColumnDirective', () => {
    let spectator: SpectatorDirective<DmColumnDirective>;
    const createDirective = createDirectiveFactory({
        directive: DmColumnDirective,
        providers: [DmTableService]
    });

    beforeEach(() => {
        spectator = createDirective(`
            <dm-column title="Title"
                width="100"
                minWidth="50"
                maxWidth="150"
                sortable="true"
                sort="number"
                headerTooltip="tooltip">
            </dm-column>
        `);
        console.log('spectator');
    });

    it('should be created', () => {
        const instance = spectator.directive;
        expect(instance).toBeDefined();
    });
});
