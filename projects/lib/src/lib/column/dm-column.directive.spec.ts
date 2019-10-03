import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator/jest';

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

    it('should generate random colId if empty', () => {
        spectator = createDirective('<dm-column></dm-column>');
        expect(spectator.directive.colId).toBeTruthy();
    });

    it('should set minWidth=undefined to MIN_COLUMN_WIDTH', () => {
        spectator = createDirective('<dm-column></dm-column>');
        expect(spectator.directive.minWidth).toEqual(MIN_COLUMN_WIDTH);
    });

    it('should set minWidth=10 to MIN_COLUMN_WIDTH', () => {
        spectator = createDirective('<dm-column minWidth="10"></dm-column>');
        expect(spectator.directive.minWidth).toEqual(MIN_COLUMN_WIDTH);
    });

    it('should set sortable minWidth=10 to MIN_COLUMN_SORT_WIDTH', () => {
        spectator = createDirective('<dm-column minWidth="10" sortable="true"></dm-column>');
        expect(spectator.directive.minWidth).toEqual(MIN_COLUMN_SORT_WIDTH);
    });

    it('should set minWidth=100 to 100', () => {
        spectator = createDirective('<dm-column minWidth="100"></dm-column>');
        expect(spectator.directive.minWidth).toEqual(100);
    });

});
