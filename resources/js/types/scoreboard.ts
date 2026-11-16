import type { ClanSummary } from './clan';

/** A player's record as shown on the scoreboard. */
export type Standing = {
    /** Left out for guests, who see usernames only. */
    name?: string;
    username: string;
    /** Left out for guests; null for players not in a clan. */
    clan?: ClanSummary | null;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    games: number;
};

export type RankedPlayer = Standing & {
    rank: number;
    is_me?: boolean;
};

/** One page of the scoreboard. */
export type RankedPlayers = {
    data: RankedPlayer[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
