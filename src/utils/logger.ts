import initDebug from 'debug';

export const base = initDebug('netflix-conductor-utilities');
export const debug = base.extend('debug');
export const error = base.extend('error');
