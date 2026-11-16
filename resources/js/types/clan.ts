import type { Emblem } from '@/lib/emblems';

/** A clan as shown beside its members' names. */
export type ClanSummary = {
    id: number;
    name: string;
    tag: string;
    emblem: Emblem;
};
