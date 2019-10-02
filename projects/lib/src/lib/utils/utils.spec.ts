import { emptyCount } from './arrays';
import { sumValues, emptyValues } from './objects';

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
