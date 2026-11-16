<script setup lang="ts">
import ClanEmblem from '@/components/ClanEmblem.vue';
import type { ClanSummary } from '@/types';

defineProps<{
    clan: ClanSummary;
}>();
</script>

<template>
    <span
        class="inline-flex shrink-0 items-center gap-1 align-middle text-xs font-medium text-muted-foreground"
        :title="clan.name"
        data-test="clan-badge"
    >
        <ClanEmblem class="size-4" :emblem="clan.emblem" />
        <span class="sr-only">Clan {{ clan.name }}, tag</span>
        [{{ clan.tag }}]
    </span>
</template>
