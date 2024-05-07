import { BehaviorSubject } from 'rxjs';
import { DmTableControllerState, DmTableGrouppedRows, DmTableSort } from './models';

export const DM_TABLE_DEFAULT_FILTERFN = (item: any, filter: any) => {
    if (filter == null) {
        return true;
    }
    if (!item || typeof filter  !== 'string') {
        return false;
    }
    const keys = Object.keys(item);
    const f = filter.toLocaleLowerCase();
    for (const k of keys) {
        if (
            (keys.length == 1 || k !== 'id')
            && item[k]
            && typeof item[k] === 'string'
            && item[k].toLocaleLowerCase().indexOf(f) > -1
        ) {
            return true;
        }
    }
    return false;
};

export class DmTableController<T, K = any> {

    readonly state: BehaviorSubject<DmTableControllerState> = new BehaviorSubject({ itemsTotal: 0, itemsSelected: 0, itemsVisible: 0 });
    readonly visibleItems: BehaviorSubject<T[] | DmTableGrouppedRows<T>[] | undefined> = new BehaviorSubject<T[] | DmTableGrouppedRows<T>[] | undefined>(undefined);

    readonly filter: BehaviorSubject<any> = new BehaviorSubject(undefined);
    filterFn: (item: T, filter: any) => boolean | undefined = DM_TABLE_DEFAULT_FILTERFN;
    hiddenFilterFn?: (item: T) => boolean | undefined;
    groupFilterFn?: (item: DmTableGrouppedRows<T>) => boolean | undefined;

    readonly sort: BehaviorSubject<DmTableSort | undefined> = new BehaviorSubject<DmTableSort | undefined>(undefined);
    sortFn?: (items: T[], sort?: DmTableSort) => T[];
    groupSortFn?: (items: DmTableGrouppedRows<T>[], sort?: DmTableSort) => DmTableGrouppedRows<T>[];

    private _items?: T[] | DmTableGrouppedRows<T>[];
    readonly selected: Map<K, boolean> = new Map();
    readonly itemsMap: Map<K, T> = new Map();
    readonly visibleItemsMap: Map<K, T> = new Map();
    readonly groupped: BehaviorSubject<boolean> = new BehaviorSubject(false);

    debug: boolean = false;
    private groupsMap: { [id: string]: DmTableGrouppedRows<T> } = {};

    constructor(
        public trackBy?: (item: T, index?: number) => K,
        groupped = false,
        filterFn?: (item: T, filter: any) => boolean,
        sortFn?: <K = T | DmTableGrouppedRows<T>>(items: K[], sort?: DmTableSort) => K[]
    ) {
        this.setTrackBy(trackBy);
        this.groupped.next(groupped);
        if (filterFn) {
            this.filterFn = filterFn;
        }
        if (sortFn) {
            this.sortFn = sortFn;
        }
        this.filter.subscribe(() => this.invalidate());
        this.sort.subscribe(() => this.invalidate());
    }

    setTrackBy(trackBy?: (item: T, index?: number) => K): void {
        if (trackBy) {
            this.trackBy = trackBy;
        }
        if (!this.trackBy) {
            if (this._items) {
                const item = this.groupped.getValue() ? ((this._items[0] as any).rows ? (this._items[0] as any).rows[0] : undefined) : this._items[0];
                if (item && Array.isArray(item)) {
                    this.trackBy = (v: any) => v[0];
                }
                else if (item && typeof item == 'object' && (item as any).id !== undefined) {
                    this.trackBy = (v) => (v as any).id;
                }
                else {
                    this.trackBy = (v) => v as any;
                }
            }
            else {
                this.trackBy = (v) => v as any;
            }
        }
    }

    setItems(items: T[] | DmTableGrouppedRows<T>[] | undefined, trackBy?: (item: T, index?: number) => K): void {
        this._items = items;
        this.groupsMap = {};
        this.itemsMap.clear();
        this.setTrackBy(trackBy);

        if (items) {
            if (this.groupped.getValue()) {
                (this._items as DmTableGrouppedRows<T>[]).forEach((g, i) => {
                    if (!g.id) {
                        g.id = 'i' + i;
                    }
                    this.groupsMap[g.id] = g;
                    for (const r of g.rows) {
                        this.itemsMap.set(this.trackBy!(r), r);
                    }
                });
            }
            else {
                for (const r of (this._items as T[])) {
                    this.itemsMap.set(this.trackBy!(r), r);
                }
            }
        }

        if (this.selected.size > 0) {
            const m: Map<K, boolean> = new Map();
            if (items) {
                if (this.groupped.getValue()) {
                    for (const g of (this._items as DmTableGrouppedRows<T>[])) {
                        for (const r of g.rows) {
                            if (this.selected.get((r as any).id)) {
                                m.set((r as any).id, true);
                            }
                        }
                    }
                }
                else {
                    for (const r of (this._items as T[])) {
                        if (this.selected.get((r as any).id)) {
                            m.set((r as any).id, true);
                        }
                    }
                }
            }
            for (const k of this.selected.keys()) {
                if (!m.has(k)) {
                    this.selected.delete(k);
                }
            }
        }
        this.invalidate();
    }

    invalidate(): void {
        if (this._items == null) {
            this.state.next({ itemsTotal: 0, itemsSelected: 0, itemsVisible: 0 });
            this.visibleItems.next(undefined);
            this.selected.clear();
            return;
        }

        let items: any[] = [];
        const filter = this.filter.getValue();
        const state = Object.assign({}, this.state.getValue());
        state.itemsVisible = 0;
        state.itemsTotal = 0;
        this.visibleItemsMap.clear();

        if (this.groupped.getValue()) {
            for (const g of (this._items as DmTableGrouppedRows<T>[])) {
                let rows: T[] = [];
                for (const r of g.rows) {
                    if (this.hiddenFilterFn && !this.hiddenFilterFn(r)) {
                        continue;
                    }
                    state.itemsTotal++;
                    this.visibleItemsMap.set(this.trackBy!(r), r);
                    if (!this.filterFn || this.filterFn(r, filter)) {
                        rows.push(r);
                        state.itemsVisible++;
                    }
                }
                if (this.sortFn) {
                    rows = this.sortFn(rows, this.sort.getValue());
                }
                if (rows.length > 0 || (this.groupFilterFn && this.groupFilterFn(g))) {
                    (items as DmTableGrouppedRows<T>[]).push({ id: g.id, rows, data: g.data, collapsed: g.collapsed, collapsible: g.collapsible });
                }
            }
            if (this.groupSortFn) {
                items = this.groupSortFn(items, this.sort.getValue());
            }
        }
        else {
            for (const r of (this._items as T[])) {
                if (this.hiddenFilterFn && !this.hiddenFilterFn(r)) {
                    continue;
                }
                state.itemsTotal++;
                this.visibleItemsMap.set(this.trackBy!(r), r);
                if (!this.filterFn || this.filterFn(r, filter)) {
                    (items as T[]).push(r);
                    state.itemsVisible++;
                }
            }
            if (this.sortFn) {
                items = this.sortFn(items, this.sort.getValue());
            }
        }

        this.visibleItems.next(items);
        this.state.next(state);
    }

    setAllSelected(selected: boolean): void {
        this.selected.clear();
        const items = this.visibleItems.getValue();
        if (items && Array.isArray(items) && selected && this.trackBy) {
            if (this.groupped.getValue()) {
                for (const g of (items as DmTableGrouppedRows<T>[])) {
                    for (const r of g.rows) {
                        this.selected.set(this.trackBy(r as any), true);
                    }
                }
            }
            else {
                for (const r of (items as T[])) {
                    const k = this.trackBy(r as any);
                    this.selected.set(k, true);
                }
            }
        }
        const state = Object.assign({}, this.state.getValue());
        state.itemsSelected = this.selected.size;
        this.state.next(state);
    }

    setSelected(keys: K | K[], selected: boolean): void {
        if (Array.isArray(keys)) {
            keys.forEach(k => {
                if (this.visibleItemsMap.get(k)) {
                    this.selected.set(k, selected);
                }
                else {
                    this.selected.delete(k);
                }
            });
        }
        else {
            if (this.visibleItemsMap.get(keys)) {
                this.selected.set(keys, selected);
            }
            else {
                this.selected.delete(keys);
            }
        }
        const state = Object.assign({}, this.state.getValue());
        let count = 0;
        this.selected.forEach(v => {
            if (v) { count++; }
        });
        state.itemsSelected = count;
        this.state.next(state);
    }

    toggleSelected(key: K): void {
        this.setSelected(key, !this.selected.get(key));
    }

    getItem(id: K): T | undefined {
        return this.itemsMap.get(id);
    }

    getSelectedItemIds(): K[] {
        const res: K[] = [];
        for (const [k, v] of this.selected.entries()) {
            if (v) {
                res.push(k)
            }
        }
        return res;
    }

    getSelectedItems(): T[] {
        const res: T[] = [];
        for (const [k, v] of this.selected.entries()) {
            if (v && this.itemsMap.has(k)) {
                res.push(this.itemsMap.get(k)!);
            }
        }
        return res;
    }

    setGroupsCollapsed(groupIds: string[], collapsed: boolean): void {
        // this._L('setGroupsCollapsed', groupIds, collapsed);
        if (this.groupped.getValue()) {
            groupIds.forEach(id => {
                if (this.groupsMap[id]) {
                    // this._L('setGroupsCollapsed', 'item:', this.groupsMap[id]);
                    if (this.groupsMap[id]?.collapsible) {
                        this.groupsMap[id].collapsed = collapsed;
                    }
                }
            });
            // this._L('setGroupsCollapsed', '_items:', [...this._items || []]);
            this.invalidate();
        }
    }

    _log = Function.prototype.bind.apply(console.log, [console, '[DmTableController]']);
    _W = Function.prototype.bind.apply(console.warn, [console, '[DmTableController]']);
    _L(label: string, ...x: any[]): void {
        if (this.debug) {
            this._log(label, ...x);
        }
    }


}
