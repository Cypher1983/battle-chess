import { LayoutGrid, Mail, Swords, Trophy } from '@lucide/vue';
import { dashboard, invites, play, scoreboard } from '@/routes';
import type { NavItem } from '@/types';

/**
 * Main navigation shared by the sidebar and header layouts.
 */
export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Play',
        href: play(),
        icon: Swords,
    },
    {
        title: 'Invites',
        href: invites(),
        icon: Mail,
    },
    {
        title: 'Scoreboard',
        href: scoreboard(),
        icon: Trophy,
    },
];
