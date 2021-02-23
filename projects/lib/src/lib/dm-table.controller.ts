import { BehaviorSubject } from 'rxjs';
import { DmTableControllerState, DmTableGrouppedRows, DmTableSort } from './models';

export type StringOrNumber = string | number;
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
            && item[k].toLocaleLowerCase().contains(f)
        ) {
            return true;
        }
    }
};

export class DmTableController<T> {

    readonly state: BehaviorSubject<DmTableControllerState> = new BehaviorSubject({ itemsTotal: 0, itemsSelected: 0, itemsVisible: 0 });
    readonly visibleItems: BehaviorSubject<T[] | DmTableGrouppedRows<T>[] | undefined> = new BehaviorSubject(undefined);
    readonly selectedIds: BehaviorSubject<StringOrNumber[]> = new BehaviorSubject([]);

    readonly filter: BehaviorSubject<any> = new BehaviorSubject(undefined);
    filterFn: (item: T, filter: any) => boolean | undefined = DM_TABLE_DEFAULT_FILTERFN;

    readonly sort: BehaviorSubject<DmTableSort> = new BehaviorSubject(undefined);
    sortFn: ((items: T[], sort: DmTableSort) => T[])
        | ((items: DmTableGrouppedRows<T>[]) => DmTableGrouppedRows<T>[])
        | undefined;

    private _items: T[] | DmTableGrouppedRows<T>[];

    constructor(public groupped = false, filterFn?: (item: T, filter: any) => boolean, sortFn?: (items: T[]) => T[]) {
        if (filterFn) {
            this.filterFn = filterFn;
        }
        if (sortFn) {
            this.sortFn = sortFn;
        }
        this.filter.subscribe(() => this.invalidate());
        this.sort.subscribe(() => this.invalidate());
    }

    setItems(items: T[] | undefined): void {
        this._items = items;
        this.invalidate();
    }

    invalidate(): void {
        if (this._items == null) {
            this.state.next({ itemsTotal: 0, itemsSelected: 0, itemsVisible: 0 });
            this.visibleItems.next(undefined);
            this.selectedIds.next([]);
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

        const sort = this.sort.getValue();
        if (sort && this.sortFn) {
            items = this.sortFn(items as any, sort);
        }

        this.visibleItems.next(items);
        this.state.next(state);

    }

}