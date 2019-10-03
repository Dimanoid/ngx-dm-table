import { emptyCount } from './arrays';
import { sumValues, emptyValues } from './objects';
import { Point } from './point';
import { SortStringsBy, SortNumbersBy } from './sort-functions';

describe('utils/arrays/emptyCount', () => {
    it('should return 0 for empty array', () => {
        expect(emptyCount([])).toEqual(0);
    });
    it('should return 0 for [1,2,3]', () => {
        expect(emptyCount([1, 2, 3])).toEqual(0);
    });
    it('should return 1 for [0,1,2,3]', () => {
        expect(emptyCount([0, 1, 2, 3])).toEqual(1);
    });
    it('should return 3 for [0,0,0]', () => {
        expect(emptyCount([0, 0, 0])).toEqual(3);
    });
});

describe('utils/objects/sumValues', () => {
    it('should return 0 for empty object', () => {
        expect(sumValues({})).toEqual(0);
    });
    it('should return 6 for { a: 1, b: 2, c: 3 }', () => {
        expect(sumValues({ a: 1, b: 2, c: 3 })).toEqual(6);
    });
});

describe('utils/objects/emptyValues', () => {
    it('should return 0 for empty object', () => {
        expect(emptyValues({})).toEqual(0);
    });
    it('should return 2 for { a: 1, b: 0, c: 3, d: 0 }', () => {
        expect(emptyValues({ a: 1, b: 0, c: 3, d: 0 })).toEqual(2);
    });
});

describe('utils/point', () => {
    it('should be created', () => {
        const p = new Point();
        expect(p).toBeTruthy();
        expect(p.x).toBeUndefined();
        expect(p.y).toBeUndefined();
    });
    it('should be created with x set', () => {
        const p = new Point(77);
        expect(p).toBeTruthy();
        expect(p.x).toEqual(77);
        expect(p.y).toBeUndefined();
    });
    it('should be created with x and y set', () => {
        const p = new Point(77, 88);
        expect(p).toBeTruthy();
        expect(p.x).toEqual(77);
        expect(p.y).toEqual(88);
    });
});

describe('utils/sort-functions', () => {
    const data = [
        { str: 'bbb', num: 222, bool: false },
        { str: 'ccc', num: 333, bool: true },
        { str: 'aaa', num: 111, bool: false }
    ];
    it('should sort strings', () => {
        const res = data.sort(SortStringsBy('str'));
        expect(res[0].str).toEqual('aaa');
        expect(res[1].str).toEqual('bbb');
        expect(res[2].str).toEqual('ccc');
    });
    it('should sort numbers', () => {
        const res = data.sort(SortNumbersBy('num'));
        expect(res[0].num).toEqual(111);
        expect(res[1].num).toEqual(222);
        expect(res[2].num).toEqual(333);
    });
    it('should sort booleans', () => {
        const res = data.sort(SortNumbersBy('bool'));
        expect(res[0].bool).toEqual(false);
        expect(res[1].bool).toEqual(false);
        expect(res[2].bool).toEqual(true);
    });
});
