import { usePage } from '@inertiajs/vue3';
import {
    BookOpen,
    LayoutGrid,
    Mail,
    Shield,
    Swords,
    Trophy,
} from '@lucide/vue';
import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import { armies, dashboard, invites, play, rules, scoreboard } from '@/routes';
import type { NavItem } from '@/types';

/**
 * Main navigation shared by the sidebar and header layouts.
 *
 * The Invites item carries a badge with the number of open challenges.
 */
export function useMainNavItems(): ComputedRef<NavItem[]> {
    const page = usePage();

    return computed(() => [
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
            badge: page.props.pendingInvitations || undefined,
        },
        {
            title: 'Scoreboard',
            href: scoreboard(),
            icon: Trophy,
        },
        {
            title: 'Armies',
            href: armies(),
            icon: Shield,
        },
        {
            title: 'Rules',
            href: rules(),
            icon: BookOpen,
        },
    ]);
}
