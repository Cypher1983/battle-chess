import type { Group } from 'three';
import type { ArmyId, PieceType } from '@/lib/armies';
import { buildClockwork } from '@/lib/board3d/pieces/clockwork';
import { buildWildwood } from '@/lib/board3d/pieces/wildwood';

/** What a blow knocks loose: Clockwork sheds cogs, the Wildwood leaves. */
export type DebrisKind = 'cogs' | 'leaves';

/** The spell bishops and queens cast instead of throwing an orb. */
export type SpellKind = 'lightning' | 'vine';

/** How an army looks and fights in 3D. */
export type ArmyStyle = {
    /** Build the character for a piece type, facing +z. */
    build: (type: PieceType) => Group;
    /** The colour of the army's magic: orbs, trails, spell light. */
    magic: number;
    debris: DebrisKind;
    /** How brightly the debris glows (sparks do, leaves barely). */
    debrisGlow: number;
    spell?: SpellKind;
};

export const armyStyles: Record<ArmyId, ArmyStyle> = {
    clockwork: {
        build: buildClockwork,
        magic: 0x7fd4ff,
        debris: 'cogs',
        debrisGlow: 0.6,
        spell: 'lightning',
    },
    wildwood: {
        build: buildWildwood,
        magic: 0x9dff6a,
        debris: 'leaves',
        debrisGlow: 0.15,
        spell: 'vine',
    },
};
