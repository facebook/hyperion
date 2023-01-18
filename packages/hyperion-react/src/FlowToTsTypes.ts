export interface Class<T, A extends any[] = any[]> extends Function { new(...args: A): T; }
export type mixed = unknown;
