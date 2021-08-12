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

    readonly sort: BehaviorSubject<DmTableSort | undefined> = new BehaviorSubject<DmTableSort | undefined>(undefined);
    sortFn: ((items: T[], sort?: DmTableSort) => T[])
        | ((items: DmTableGrouppedRows<T>[], sort?: DmTableSort) => DmTableGrouppedRows<T>[])
        | undefined;

    private _items?: T[] | DmTableGrouppedRows<T>[];
    readonly selected: Map<K, boolean> = new Map();
    readonly itemsMap: Map<K, T> = new Map();

    constructor(
        private trackBy?: (item: T, index?: number) => K,
        public groupped = false,
        filterFn?: (item: T, filter: any) => boolean,
        sortFn?: (items: T[]) => T[]
    ) {
        if (filterFn) {
            this.filterFn = filterFn;
        }
        if (sortFn) {
            this.sortFn = sortFn;
        }
        this.filter.subscribe(() => this.invalidate());
        this.sort.subscribe(() => this.invalidate());
    }

    setItems(items: T[] | DmTableGrouppedRows<T>[] | undefined, trackBy?: (item: T, index?: number) => K): void {
        this._items = items;
        this.itemsMap.clear();

        if (trackBy) {
            this.trackBy = trackBy;
        }
        else if (items && !this.trackBy) {
            const item = this.groupped ? ((items[0] as any).rows ? (items[0] as any).rows[0] : undefined) : items[0];
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

        if (items) {
            if (this.groupped) {
                for (const g of (this._items as DmTableGrouppedRows<T>[])) {
                    for (const r of g.rows) {
                        this.itemsMap.set(this.trackBy(r), r);
                    }
                }
            }
            else {
                for (const r of (this._items as T[])) {
                    this.itemsMap.set(this.trackBy(r), r);
                }
            }
        }

        if (this.selected.size > 0) {
            const m: Map<K, boolean> = new Map();
            if (items) {
                if (this.groupped) {
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

        let items: T[] | DmTableGrouppedRows<T>[] = [];
        const filter = this.filter.getValue();
        const state = Object.assign({}, this.state.getValue());
        state.itemsVisible = 0;
        state.itemsTotal = 0;

        if (filter && this.filterFn) {
            if (this.groupped) {
                for (const g of (this._items as DmTableGrouppedRows<T>[])) {
                    const rows: T[] = [];
                    for (const r of g.rows) {
                        state.itemsTotal++;
                        if (this.filterFn(r, filter)) {
                            rows.push(r);
                            state.itemsVisible++;
                        }
                    }
                    if (rows.length > 0) {
                        (items as DmTableGrouppedRows<T>[]).push({ rows, data: g.data })
                    }
                }
            }
            else {
                for (const r of (this._items as T[])) {
                    state.itemsTotal++;
                    if (this.filterFn(r, filter)) {
                        (items as T[]).push(r);
                        state.itemsVisible++;
                    }
                }
            }
        }
        else {
            this._items.forEach((v: any) => items.push(v));
            state.itemsVisible = this._items.length;
            state.itemsTotal = this._items.length;
        }

        if (this.sortFn) {
            items = this.sortFn(items as any, this.sort.getValue());
        }

        this.visibleItems.next(items);
        this.state.next(state);

    }

    setAllSelected(selected: boolean): void {
        this.selected.clear();
        if (selected && this.trackBy) {
            if (this.groupped) {
                for (const g of (this._items as DmTableGrouppedRows<T>[])) {
                    for (const r of g.rows) {
                        this.selected.set(this.trackBy(r as any), true);
                    }
                }
            }
            else {
                for (const r of (this._items as T[])) {
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
            keys.forEach(k => this.selected.set(k, selected))
        }
        else {
            this.selected.set(keys, selected);
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

}
