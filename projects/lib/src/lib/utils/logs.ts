// tslint:disable: no-console
export const _D = console.debug;
export const _L = console.log;
export const _I = console.info;
export const _W = console.warn;
export const _E = console.error;
export const _tS = console.time;
export const _tL =  (console as any).timeLog ? (console as any).timeLog : console.log;
export const _tE = console.timeEnd;
