import type { Group } from 'three';
import type { ArmyId, PieceType } from '@/lib/armies';
import { buildClockwork } from '@/lib/board3d/pieces/clockwork';
import { buildEmber } from '@/lib/board3d/pieces/ember';
import { buildFrost } from '@/lib/board3d/pieces/frost';
import { buildTide } from '@/lib/board3d/pieces/tide';
import { buildSwarm } from '@/lib/board3d/pieces/swarm';
import { buildKingdom } from '@/lib/board3d/pieces/kingdom';
import { buildSky } from '@/lib/board3d/pieces/sky';
import { buildSun } from '@/lib/board3d/pieces/sun';
import { buildShadow } from '@/lib/board3d/pieces/shadow';
import { buildMechs } from '@/lib/board3d/pieces/mechs';
import { buildGreek } from '@/lib/board3d/pieces/greek';
import { buildViking } from '@/lib/board3d/pieces/viking';
import { buildWildwood } from '@/lib/board3d/pieces/wildwood';

/** What a blow knocks loose: cogs and sparks, leaves and thorns, embers... */
export type DebrisKind =
    | 'cogs'
    | 'leaves'
    | 'embers'
    | 'shards'
    | 'droplets'
    | 'feathers'
    | 'sand'
    | 'ash'
    | 'scrap'
    | 'bones';

/** A jagged, flickering bolt (lightning): a white-hot core in a glow. */
export type BoltSpell = { kind: 'bolt'; core: number; glow: number };

/** Something that grows out of the ground and lashes the defender. */
export type TendrilSpell = {
    kind: 'tendril';
    stem: number;
    thorn: number;
    tip: number;
};

/** Thrown or conjured missiles that arc onto the defender. */
export type MissileSpell = {
    kind: 'missile';
    shape: 'fireball' | 'shard' | 'glob' | 'axe' | 'bottle' | 'arrow';
    colour: number;
    /** Colour of the halo and the trail left behind. */
    trail: number;
    /** How many fly at once (a volley of arrows, a fan of shards). */
    count?: number;
    /** Whether the missile glows (fire, ice) or not (an axe). */
    glow?: boolean;
};

/** A straight beam of light (a sunbeam, a laser). */
export type BeamSpell = { kind: 'beam'; core: number; glow: number };

/** A spiralling gust (wind, a water spout). */
export type GustSpell = { kind: 'gust'; colour: number };

/** The spell bishops and queens cast instead of throwing an orb. */
export type Spell =
    | BoltSpell
    | TendrilSpell
    | MissileSpell
    | BeamSpell
    | GustSpell;

/** How an army looks and fights in 3D. */
export type ArmyStyle = {
    /** Build the character for a piece type, facing +z. */
    build: (type: PieceType) => Group;
    /** The colour of the army's magic: orbs, trails, spell light. */
    magic: number;
    debris: DebrisKind;
    /** How brightly the debris glows (sparks do, leaves barely). */
    debrisGlow: number;
    spell?: Spell;
};

export const armyStyles: Record<ArmyId, ArmyStyle> = {
    clockwork: {
        build: buildClockwork,
        magic: 0x7fd4ff,
        debris: 'cogs',
        debrisGlow: 0.6,
        spell: { kind: 'bolt', core: 0xe8fbff, glow: 0x5fc8ff },
    },
    wildwood: {
        build: buildWildwood,
        magic: 0x9dff6a,
        debris: 'leaves',
        debrisGlow: 0.15,
        spell: {
            kind: 'tendril',
            stem: 0x4f7a2a,
            thorn: 0xd6336c,
            tip: 0xc6ff6a,
        },
    },
    ember: {
        build: buildEmber,
        magic: 0xff7a1a,
        debris: 'embers',
        debrisGlow: 0.7,
        spell: {
            kind: 'missile',
            shape: 'fireball',
            colour: 0xff7a1a,
            trail: 0xffc23a,
        },
    },
    frost: {
        build: buildFrost,
        magic: 0x7fe8ff,
        debris: 'shards',
        debrisGlow: 0.4,
        spell: {
            kind: 'missile',
            shape: 'shard',
            colour: 0xbfefff,
            trail: 0x7fe8ff,
            count: 3,
        },
    },
    tide: {
        build: buildTide,
        magic: 0x3fe0c8,
        debris: 'droplets',
        debrisGlow: 0.3,
        spell: { kind: 'gust', colour: 0x3fe0c8 },
    },
    swarm: {
        build: buildSwarm,
        magic: 0x7dff3a,
        debris: 'droplets',
        debrisGlow: 0.6,
        spell: {
            kind: 'missile',
            shape: 'glob',
            colour: 0x9dff3a,
            trail: 0x5aff7a,
        },
    },
    kingdom: {
        build: buildKingdom,
        magic: 0xffe08a,
        debris: 'scrap',
        debrisGlow: 0.1,
        spell: {
            kind: 'missile',
            shape: 'arrow',
            colour: 0x8a6a3a,
            trail: 0xfff1b8,
            count: 5,
            glow: false,
        },
    },
    sky: {
        build: buildSky,
        magic: 0x8fe3ff,
        debris: 'feathers',
        debrisGlow: 0.1,
        spell: { kind: 'gust', colour: 0xe6f6ff },
    },
    sun: {
        build: buildSun,
        magic: 0xffc23a,
        debris: 'sand',
        debrisGlow: 0.2,
        spell: { kind: 'beam', core: 0xfff6c8, glow: 0xffc23a },
    },
    shadow: {
        build: buildShadow,
        magic: 0x9effc8,
        debris: 'ash',
        debrisGlow: 0.3,
        spell: { kind: 'bolt', core: 0xf0fff6, glow: 0x9effc8 },
    },
    mechs: {
        build: buildMechs,
        magic: 0x39e6ff,
        debris: 'scrap',
        debrisGlow: 0.5,
        spell: { kind: 'beam', core: 0xffe6ea, glow: 0xff3048 },
    },
    greek: {
        build: buildGreek,
        magic: 0x8fdcff,
        debris: 'shards',
        debrisGlow: 0.3,
        spell: { kind: 'bolt', core: 0xfff6c8, glow: 0xffd24a },
    },
    viking: {
        build: buildViking,
        magic: 0x4fd6c4,
        debris: 'scrap',
        debrisGlow: 0.1,
        spell: {
            kind: 'missile',
            shape: 'axe',
            colour: 0x9aa4ad,
            trail: 0xdfe8ff,
            glow: false,
        },
    },
};
