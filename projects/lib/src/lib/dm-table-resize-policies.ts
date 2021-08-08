import { sumValues } from './utils';
import { DmColumnDirective } from './column/dm-column.directive';

export interface IDmTableResizePolicy<T> {

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
            flexColumnId = colsOrder[i];
            break;
        }
    }
    return flexColumnId!;
}

export function dmtNormalizeWidth(w: number, ct: { minWidth: number | string, maxWidth: number | string }): number {
    let nw = w;
    if (ct.minWidth > nw) {
        nw = +ct.minWidth;
    }
    else if (ct.maxWidth && ct.maxWidth < nw) {
        nw = +ct.maxWidth;
    }
    return nw;
}

export class DmTableResizePolicyFit<T> implements IDmTableResizePolicy<T> {

    onColumnResize(
        resizeColumnId: string,
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<T>
    }): { [id: string]: number } {
        const colsWidthTmp: { [id: string]: number } = Object.assign({}, colsWidth);
        const ct = ctMap[resizeColumnId];
        const w = colsWidth[resizeColumnId];
        const flexColumnId = dmtGetFlexColumnId(colsOrder, colsVisibility, ctMap);
        const nw = dmtNormalizeWidth(w + delta, ct as any);
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
    }

    onTableResize(
        portalWidth: number,
        delta: number,
        colsOrder: string[],
        colsVisibility: { [id: string]: boolean },
        colsWidth: { [id: string]: number },
        ctMap: { [colId: string]: DmColumnDirective<T>
    }): { [id: string]: number } {
        const colsWidthTmp: { [id: string]: number } = Object.assign({}, colsWidth);
        const flexColumnId = dmtGetFlexColumnId(colsOrder, colsVisibility, ctMap);

        if (delta > 0) {
            colsWidthTmp[flexColumnId] += delta;
        }
        else if (delta < 0) {
            const cw = dmtNormalizeWidth(colsWidthTmp[flexColumnId] + delta, ctMap[flexColumnId] as any);
            let dr = Math.abs(delta) - colsWidthTmp[flexColumnId] + cw;
            if (dr > 0) {
                for (let i = colsOrder.length - 1; i > 0; i--) {
                    const did = colsOrder[i];
                    const ccw = dmtNormalizeWidth(colsWidthTmp[did] - dr, ctMap[did] as any);
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
