import { home } from '@/routes';
import type { NavItem } from '@/types';

/**
 * Links in the public site header, shown to guests and players alike.
 */
export const publicNavItems: NavItem[] = [
    {
        title: 'Home',
        href: home(),
    },
];
