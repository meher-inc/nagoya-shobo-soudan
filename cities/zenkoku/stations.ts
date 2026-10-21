/**
 * 一般版（全国）には消防署の一覧を持たない。所在地の消防本部を案内する。
 * src/config/stations.ts と同じ型を保つための空の一覧。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "";

export const STATIONS: readonly Station[] = [];
