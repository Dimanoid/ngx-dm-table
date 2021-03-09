import { BehaviorSubject } from 'rxjs';
import { DmTableControllerState, DmTableGrouppedRows, DmTableSort } from './models';

export const DM_TABLE_DEFAULT_FILTERFN = (item, filter) => {
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

export class DmTableController<T> {

    readonly state: BehaviorSubject<DmTableControllerState> = new BehaviorSubject({ itemsTotal: 0, itemsSelected: 0, itemsVisible: 0 });
    readonly visibleItems: BehaviorSubject<T[] | DmTableGrouppedRows<T>[] | undefined> = new BehaviorSubject(undefined);

    readonly filter: BehaviorSubject<any> = new BehaviorSubject(undefined);
    filterFn: (item: T, filter: any) => boolean | undefined = DM_TABLE_DEFAULT_FILTERFN;

    readonly sort: BehaviorSubject<DmTableSort> = new BehaviorSubject(undefined);
    sortFn: ((items: T[], sort: DmTableSort) => T[])
        | ((items: DmTableGrouppedRows<T>[]) => DmTableGrouppedRows<T>[])
        | undefined;

    private _items: T[] | DmTableGrouppedRows<T>[];
    readonly selected: Map<number | string, boolean> = new Map();
    readonly itemsMap: Map<number | string, T> = new Map();

    constructor(
        public groupped = false,
        private trackBy?: (index: number, item: T) => any,
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

    setItems(items: T[] | DmTableGrouppedRows<T>[] | undefined, trackBy?: (index: number, item: T) => any): void {
        this._items = items;
        this.itemsMap.clear();

        if (trackBy) {
            this.trackBy = trackBy;
        }
        else if (items) {
            const item = this.groupped ? ((items[0] as any).rows ? (items[0] as any).rows[0] : undefined) : items[0];
            if (item && Array.isArray(item)) {
                this.trackBy = (_, v) => v[0];
            }
            else if (item && typeof item == 'object' && (item as any).id !== undefined) {
                this.trackBy = (_, v) => (v as any).id;
            }
            else {
                this.trackBy = (_, v) => v;
            }
        }
        else {
            this.trackBy = (_, v) => v;
        }

        if (this.groupped) {
            for (const g of (this._items as DmTableGrouppedRows<T>[])) {
                for (const r of g.rows) {
                    this.itemsMap.set(this.trackBy(-1, r), r);
                }
            }
        }
        else {
            for (const r of (this._items as T[])) {
                this.itemsMap.set(this.trackBy(-1, r), r);
            }
        }

        if (this.selected.size > 0) {
            const m: Map<number | string, boolean> = new Map();
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
            items.push(...this._items as any);
            state.itemsVisible = this._items.length;
            state.itemsTotal = this._items.length;
        }

        const sort = this.sort.getValue();
        if (sort && this.sortFn) {
            items = this.sortFn(items as any, sort);
        }

        this.visibleItems.next(items);
        this.state.next(state);

    }

    setAllSelected(selected: boolean): void {
        this.selected.clear();
        if (selected) {
            if (this.groupped) {
                for (const g of (this._items as DmTableGrouppedRows<T>[])) {
                    for (const r of g.rows) {
                        this.selected.set(this.trackBy(-1, r as any), true);
                    }
                }
            }
            else {
                for (const r of (this._items as T[])) {
                    const k = this.trackBy(-1, r as any);
                    this.selected.set(k, true);
                }
            }
        }
        const state = Object.assign({}, this.state.getValue());
        state.itemsSelected = this.selected.size;
        this.state.next(state);
    }

    setSelected(keys: string | number | (string | number)[], selected: boolean): void {
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

    toggleSelected(key: string | number): void {
        this.setSelected(key, !this.selected.get(key));
    }

    getItem(id: string | number): T | undefined {
        return this.itemsMap.get(id);
    }

    getSelectedItemIds(): (string | number)[] {
        const res: (string | number)[] = [];
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
            if (v && this._items[k]) {
                res.push(this._items[k])
            }
        }
        return res;
    }

}
