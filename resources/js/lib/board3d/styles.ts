import type { Group } from 'three';
import type { ArmyId, PieceType } from '@/lib/armies';
import { buildClockwork } from '@/lib/board3d/pieces/clockwork';
import { buildEmber } from '@/lib/board3d/pieces/ember';
import { buildWildwood } from '@/lib/board3d/pieces/wildwood';

/** What a blow knocks loose: cogs and sparks, leaves and thorns, embers... */
export type DebrisKind = 'cogs' | 'leaves' | 'embers';

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

/** The spell bishops and queens cast instead of throwing an orb. */
export type Spell = BoltSpell | TendrilSpell | MissileSpell;

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
};
