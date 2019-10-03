import { createServiceFactory, SpectatorService } from '@ngneat/spectator';

import { DmTableService, DmTableColumnConfig } from './dm-table.service';

describe('DmTableColumnConfig', () => {
    it('should be created', () => {
        const c = new DmTableColumnConfig();
        expect(c).toBeTruthy();
    });
    it('should has default values', () => {
        const c = new DmTableColumnConfig();
        expect(c.pinnable).toEqual(false);
        expect(c.sortable).toEqual(false);
        expect(c.resizeable).toEqual(true);
        expect(c.whitespace).toEqual('normal');
        expect(c.minWidth).toBeUndefined();
        expect(c.headerClass).toBeUndefined();
        expect(c.cellClass).toBeUndefined();
        expect(c.footerClass).toBeUndefined();
        expect(c.sort).toBeUndefined();
    });
    it('should has default values2', () => {
        const c = new DmTableColumnConfig('test');
        expect(c.pinnable).toEqual(false);
        expect(c.sortable).toEqual(false);
        expect(c.resizeable).toEqual(true);
        expect(c.whitespace).toEqual('normal');
        expect(c.minWidth).toBeUndefined();
        expect(c.headerClass).toBeUndefined();
        expect(c.cellClass).toBeUndefined();
        expect(c.footerClass).toBeUndefined();
        expect(c.sort).toBeUndefined();
    });
    it('should has provided values set', () => {
        const c = new DmTableColumnConfig({ sortable: true, resizeable: false, minWidth: 777 });
        expect(c.pinnable).toEqual(false);
        expect(c.sortable).toEqual(true);
        expect(c.resizeable).toEqual(false);
        expect(c.whitespace).toEqual('normal');
        expect(c.minWidth).toEqual(777);
        expect(c.headerClass).toBeUndefined();
        expect(c.cellClass).toBeUndefined();
        expect(c.footerClass).toBeUndefined();
        expect(c.sort).toBeUndefined();
    });
});

describe('DmTableService', () => {
    let spectator: SpectatorService<DmTableService>;
    const createService = createServiceFactory(DmTableService);

    beforeEach(() => spectator = createService());

    it('should be created', () => {
        expect(spectator.service).toBeTruthy();
    });

    it('should has default config values', () => {
        const c = spectator.service.getColumnConfig();
        expect(c.pinnable).toEqual(false);
        expect(c.sortable).toEqual(false);
        expect(c.resizeable).toEqual(true);
        expect(c.whitespace).toEqual('normal');
        expect(c.minWidth).toBeUndefined();
        expect(c.headerClass).toBeUndefined();
        expect(c.cellClass).toBeUndefined();
        expect(c.footerClass).toBeUndefined();
        expect(c.sort).toBeUndefined();
    });

    it('should set new config values', () => {
        const c = new DmTableColumnConfig({ sortable: true, resizeable: false, minWidth: 777 });
        spectator.service.setColumnConfig(c);
        const c2 = spectator.service.getColumnConfig();
        expect(c.pinnable).toEqual(c2.pinnable);
        expect(c.sortable).toEqual(c2.sortable);
        expect(c.resizeable).toEqual(c2.resizeable);
        expect(c.whitespace).toEqual(c2.whitespace);
        expect(c.minWidth).toEqual(c2.minWidth);
        expect(c.headerClass).toEqual(c2.headerClass);
        expect(c.cellClass).toEqual(c2.cellClass);
        expect(c.footerClass).toEqual(c2.footerClass);
        expect(c.sort).toEqual(c2.sort);
    });
});
