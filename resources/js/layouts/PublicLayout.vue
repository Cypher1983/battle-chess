<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import AppLogoIcon from '@/components/AppLogoIcon.vue';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/composables/useCurrentUrl';
import { publicNavItems } from '@/lib/publicNavigation';
import { dashboard, home, login, register } from '@/routes';

const page = usePage();
const { isCurrentUrl } = useCurrentUrl();
</script>

<template>
    <div class="flex min-h-svh flex-col bg-background bg-board">
        <header
            class="sticky top-0 z-40 border-b bg-background/85 backdrop-blur"
        >
            <div
                class="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4"
            >
                <Link
                    :href="home()"
                    class="flex shrink-0 items-center gap-2"
                    aria-label="Battle Chess home"
                >
                    <AppLogoIcon class="size-9 text-primary" />
                    <span
                        class="hidden font-display text-sm font-bold tracking-[0.14em] uppercase sm:inline"
                        >{{ page.props.name }}</span
                    >
                </Link>

                <nav
                    class="hidden items-center gap-1 md:flex"
                    aria-label="Main"
                >
                    <Link
                        v-for="item in publicNavItems"
                        :key="item.title"
                        :href="item.href"
                        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary"
                        :class="
                            isCurrentUrl(item.href)
                                ? 'text-primary'
                                : 'text-muted-foreground'
                        "
                    >
                        {{ item.title }}
                    </Link>
                </nav>

                <div class="ml-auto flex items-center gap-2">
                    <Button v-if="page.props.auth.user" size="sm" as-child>
                        <Link :href="dashboard()">Dashboard</Link>
                    </Button>
                    <template v-else>
                        <Button variant="ghost" size="sm" as-child>
                            <Link :href="login()">Log in</Link>
                        </Button>
                        <Button size="sm" as-child>
                            <Link :href="register()">Register</Link>
                        </Button>
                    </template>
                </div>
            </div>

            <!-- Small screens: the same links in a scrollable strip. -->
            <nav
                class="flex gap-1 overflow-x-auto border-t px-2 md:hidden"
                aria-label="Main"
            >
                <Link
                    v-for="item in publicNavItems"
                    :key="item.title"
                    :href="item.href"
                    class="shrink-0 border-b-2 px-3 py-2 text-sm font-medium"
                    :class="
                        isCurrentUrl(item.href)
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                    "
                >
                    {{ item.title }}
                </Link>
            </nav>
        </header>

        <main class="flex-1">
            <slot />
        </main>

        <footer class="border-t bg-background/85">
            <div
                class="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between"
            >
                <div class="flex items-center gap-2">
                    <AppLogoIcon class="size-6 text-primary" />
                    <span>
                        {{ page.props.name }} — chess where every capture is a
                        fight.
                    </span>
                </div>
                <nav class="flex flex-wrap gap-4" aria-label="Footer">
                    <Link
                        v-for="item in publicNavItems"
                        :key="item.title"
                        :href="item.href"
                        class="hover:text-primary"
                    >
                        {{ item.title }}
                    </Link>
                </nav>
            </div>
        </footer>
    </div>
</template>
