import { createServiceFactory, SpectatorService } from '@ngneat/spectator';

import { DmTableService } from './dm-table.service';

describe('DmTableService', () => {
    let spectator: SpectatorService<DmTableService>;
    const createService = createServiceFactory(DmTableService);

    beforeEach(() => spectator = createService());

    it('should be created', () => {
        expect(spectator.service).toBeTruthy();
    });
});
