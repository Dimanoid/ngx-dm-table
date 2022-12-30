import { sumValues } from './utils';
import { DmColumnDirective } from './column/dm-column.directive';

export type TDmTableResizePolicyBase<T> = {

    onColumnResize: (
        resizeColumnId: string,
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<T> },
    ) => { [id: string]: number };

    onTableResize: (
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<T> },
    ) => { [id: string]: number };

}

export function dmtGetFlexColumnId<T>(
    colsOrder: string[],
    colsVisibility: { [id: string]: boolean },
    ctMap: { [colId: string]: DmColumnDirective<T> }
): string {
    let flexColumnId = null;
    for (const cid of Object.keys(ctMap)) {
        const cd = ctMap[cid];
        if (!colsVisibility || colsVisibility[cd.colId!]) {
            if (cd.flexible) {
                flexColumnId = cd.colId;
            }
        }
    }
    if (flexColumnId == null) {
        for (let i = colsOrder.length - 1; i > 0; i--) {
            if (!colsVisibility || colsVisibility[colsOrder[i]]) {
                flexColumnId = colsOrder[i];
                break;
            }
        }
    }
    if (flexColumnId == null) {
        flexColumnId = colsOrder[0];
    }
    return flexColumnId!;
}

export function dmtNormalizeWidth(w: number, ct: { minWidth?: number | string, maxWidth?: number | string }): number {
    let nw = w;
    if (ct.minWidth && ct.minWidth > nw) {
        nw = +ct.minWidth;
    }
    else if (ct.maxWidth && ct.maxWidth < nw) {
        nw = +ct.maxWidth;
    }
    return nw;
}

export function dmtGetNextVisibleColumnRight(colId: string, colsOrder: string[], colsVisibility: { [id: string]: boolean }): string | undefined {
    let resId: string | undefined;
    let f: boolean = false;
    colsOrder?.forEach(id => {
        if (!resId) {
            if (!f) {
                if (id == colId) {
                    f = true;
                }
            }
            else if (colsVisibility[id]) {
                resId = id;
            }
        }
    });
    return resId;
}

export function dmtGetLastVisibleColumn(colsOrder: string[], colsVisibility: { [id: string]: boolean }): string | undefined {
    let resId: string | undefined;
    colsOrder?.forEach(id => {
        if (colsVisibility[id]) {
            resId = id;
        }
    });
    return resId;
}

export function dmtNormalizeTableWidth(
    portalWidth: number,
    colsOrder: string[],
    colsVisibility: { [id: string]: boolean },
    colsWidthTmp: { [id: string]: number },
    ctMap: { [colId: string]: DmColumnDirective<any> },
): void {
    const flexColumnId = dmtGetFlexColumnId(colsOrder, colsVisibility, ctMap);
    const tw = Object.keys(colsWidthTmp).filter(id => colsVisibility[id]).map(id => colsWidthTmp[id]).reduce((c, w) => c + w, 0);
    if (tw < portalWidth) {
        colsWidthTmp[flexColumnId] += portalWidth - tw;
    }
}

export const DmTableResizePolicySimple: TDmTableResizePolicyBase<any> = {
    onColumnResize(
        resizeColumnId: string,
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<any> }
    ): { [id: string]: number } {
        const colsWidthTmp: { [id: string]: number } = { ...colsWidth };
        colsWidthTmp[resizeColumnId] = dmtNormalizeWidth(colsWidth[resizeColumnId] + delta, ctMap[resizeColumnId]);
        dmtNormalizeTableWidth(portalWidth, colsOrder, colsVisibility, colsWidthTmp, ctMap);
        return colsWidthTmp;
    },

    onTableResize(
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<any>
    }): { [id: string]: number } {
        return { ...colsWidth };
    }
}

export const DmTableResizePolicyFit: TDmTableResizePolicyBase<any> = {
    onColumnResize(
        resizeColumnId: string,
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<any> }
    ): { [id: string]: number } {
        const colsWidthTmp: { [id: string]: number } = { ...colsWidth };
        const ct = ctMap[resizeColumnId];
        const w = colsWidth[resizeColumnId];
        const flexColumnId = dmtGetFlexColumnId(colsOrder, colsVisibility, ctMap);
        const nw = dmtNormalizeWidth(w + delta, ct);
        const rd = nw - w;

        if (rd > 0) {
            colsWidthTmp[resizeColumnId] = nw;
            if (flexColumnId != resizeColumnId) {
                const sv = sumValues(colsWidthTmp, colsVisibility) + rd;
                if (portalWidth >= sv) {
                    colsWidthTmp[flexColumnId] += portalWidth - sv;
                }
                else {
                    let d = sv - portalWidth - rd;
                    if (colsWidthTmp[flexColumnId] > ctMap[flexColumnId].minWidth) {
                        const dd = colsWidthTmp[flexColumnId] - +ctMap[flexColumnId].minWidth;
                        if (d <= dd) {
                            colsWidthTmp[flexColumnId] -= d;
                        }
                        else {
                            colsWidthTmp[flexColumnId] -= dd;
                            d -= dd;
                            for (let i = colsOrder.length - 1; i > 0; i--) {
                                const did = colsOrder[i];
                                if (did != resizeColumnId) {
                                    const ddd = colsWidthTmp[did] - +ctMap[did].minWidth;
                                    if (d <= ddd) {
                                        colsWidthTmp[did] -= d;
                                        break;
                                    }
                                    else {
                                        colsWidthTmp[did] -= ddd;
                                        d -= ddd;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else if (rd < 0) {
            if (flexColumnId == resizeColumnId) {
                colsWidthTmp[resizeColumnId] = nw;
                let sv = sumValues(colsWidthTmp, colsVisibility);
                if (portalWidth > sv) {
                    const fci = colsOrder.indexOf(flexColumnId);
                    if (fci > -1 && fci < colsOrder.length - 1) {
                        const lid = colsOrder[colsOrder.length - 1];
                        if (!ctMap[lid].maxWidth || portalWidth - sv + colsWidth[lid] <= ctMap[lid].maxWidth!) {
                            colsWidthTmp[lid] += portalWidth - sv;
                        }
                        else if (colsWidth[lid] < ctMap[lid].maxWidth!) {
                            const ld = +ctMap[lid].maxWidth! - colsWidth[lid];
                            sv -= ld;
                            colsWidthTmp[lid] += ld;
                        }
                    }
                    colsWidthTmp[resizeColumnId] += portalWidth - sv;
                }
            }
            else {
                colsWidthTmp[resizeColumnId] = nw;
                const sv = sumValues(colsWidthTmp, colsVisibility);
                if (portalWidth > sv) {
                    colsWidthTmp[flexColumnId] = colsWidth[flexColumnId] - rd;
                }
            }
        }
        return colsWidthTmp;
    },

    onTableResize(
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<any>
    }): { [id: string]: number } {
        const colsWidthTmp: { [id: string]: number } = Object.assign({}, colsWidth);
        const flexColumnId = dmtGetFlexColumnId(colsOrder, colsVisibility, ctMap);

        if (delta > 0) {
            colsWidthTmp[flexColumnId] += delta;
        }
        else if (delta < 0) {
            const cw = dmtNormalizeWidth(colsWidthTmp[flexColumnId] + delta, ctMap[flexColumnId]);
            let dr = Math.abs(delta) - colsWidthTmp[flexColumnId] + cw;
            if (dr > 0) {
                for (let i = colsOrder.length - 1; i > 0; i--) {
                    const did = colsOrder[i];
                    const ccw = dmtNormalizeWidth(colsWidthTmp[did] - dr, ctMap[did]);
                    const ddr = dr - colsWidthTmp[did] + ccw;
                    if (ddr <= 0) {
                        colsWidthTmp[did] -= dr;
                        break;
                    }
                    colsWidthTmp[did] = ddr;
                    dr -= ddr;
                }
            }
            else {
                colsWidth[flexColumnId] += delta;
            }
        }
        return colsWidthTmp;
    }
}

export const DmTableResizePolicyMsword: TDmTableResizePolicyBase<any> = {
    onColumnResize(
        resizeColumnId: string,
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<any> }
    ): { [id: string]: number } {
        // console.log('DmTableResizePolicyMsword <<<', {...colsWidth});
        const colsWidthTmp: { [id: string]: number } = { ...colsWidth };
        let nw = dmtNormalizeWidth(colsWidth[resizeColumnId] + delta, ctMap[resizeColumnId]);
        const left = delta - (nw - colsWidth[resizeColumnId]);
        
        // console.log('\t\t\t left:', left, 'delta:', delta, 'nw:', nw, 'colsWidth[resizeColumnId]:', colsWidth[resizeColumnId]);
        if (delta > 0) {
            let d = left;
            let after = false;
            for (const id of colsOrder) {
                if (after && (!colsVisibility || colsVisibility[id])) {
                    colsWidthTmp[id] = dmtNormalizeWidth(colsWidthTmp[id] + d, ctMap[id]);
                    d = d - (colsWidthTmp[id] - colsWidth[id]);
                    if (d < 1) {
                        d = 0;
                        break;
                    }
                }
                else if (id == resizeColumnId) {
                    after = true;
                }
            }
            nw += d;
        }
        else if (delta < 0) {
            let d = -left;
            let before = false;
            for (const id of [...colsOrder].reverse()) {
                if (before && (!colsVisibility || colsVisibility[id])) {
                    colsWidthTmp[id] = dmtNormalizeWidth(colsWidthTmp[id] - d, ctMap[id]);
                    d = d - (colsWidthTmp[id] - colsWidth[id]);
                    if (d < 1) {
                        d = 0;
                        break;
                    }
                }
                else if (id == resizeColumnId) {
                    before = true;
                }
            }
        }
        colsWidthTmp[resizeColumnId] = nw
        dmtNormalizeTableWidth(portalWidth, colsOrder, colsVisibility, colsWidthTmp, ctMap);
        // console.log('\t\t\t>>>>>>>>>>>>>>>>> ', {...colsWidthTmp});
        return colsWidthTmp;
    },

    onTableResize(
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<any>
    }): { [id: string]: number } {
        const colsWidthTmp: { [id: string]: number } = Object.assign({}, colsWidth);
        const flexColumnId = dmtGetFlexColumnId(colsOrder, colsVisibility, ctMap);
        colsWidthTmp[flexColumnId] += delta;
        if (delta < 0) {
            colsWidthTmp[flexColumnId] = dmtNormalizeWidth(colsWidthTmp[flexColumnId] + delta, ctMap[flexColumnId]);
        }
        dmtNormalizeTableWidth(portalWidth, colsOrder, colsVisibility, colsWidthTmp, ctMap);
        return colsWidthTmp;
    }
}

export type TDmTableResizePolicy<T> = 'simple' | 'fit' | 'msword' | TDmTableResizePolicyBase<T>;

export const DmTableResizePolicyMap = {
    'simple': DmTableResizePolicySimple,
    'fit': DmTableResizePolicyFit,
    'msword': DmTableResizePolicyMsword
};
