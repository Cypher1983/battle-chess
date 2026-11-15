<script setup lang="ts">
import { useId } from 'vue';
import type { HTMLAttributes } from 'vue';

defineOptions({
    inheritAttrs: false,
});

type Props = {
    className?: HTMLAttributes['class'];
};

defineProps<Props>();

/** Unique per instance so several logos on one page don't share a mask. */
const maskId = `logo-swords-${useId()}`;

/** The shield outline, shared by the mask cut-out and the drawn shield. */
const shield =
    'M24 14 L35 17.5 V27.5 C35 34.5 30.5 39 24 42 C17.5 39 13 34.5 13 27.5 V17.5 Z';
</script>

<template>
    <!--
        Battle Chess mark: a crowned shield, half ivory (outline) and half onyx
        (solid), over two crossed swords. Drawn in currentColor only.
    -->
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        :class="className"
        v-bind="$attrs"
    >
        <mask
            :id="maskId"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="48"
            height="48"
        >
            <rect width="48" height="48" fill="white" />
            <path :d="shield" fill="black" stroke="black" stroke-width="5" />
        </mask>

        <g
            :mask="`url(#${maskId})`"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
        >
            <!-- Sword running top-left to bottom-right. -->
            <path d="M5 12 L32 39" stroke-width="2.6" />
            <path d="M29 42 L35 36" stroke-width="2.4" />
            <path d="M32 39 L36 43" stroke-width="2.2" />
            <!-- Sword running top-right to bottom-left. -->
            <path d="M43 12 L16 39" stroke-width="2.6" />
            <path d="M19 42 L13 36" stroke-width="2.4" />
            <path d="M16 39 L12 43" stroke-width="2.2" />
        </g>
        <circle cx="37.6" cy="44.6" r="1.9" fill="currentColor" />
        <circle cx="10.4" cy="44.6" r="1.9" fill="currentColor" />

        <!-- Shield: ivory half as an outline, onyx half solid. -->
        <path
            :d="shield"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
        />
        <path
            d="M24 14 V42 C17.5 39 13 34.5 13 27.5 V17.5 Z"
            fill="currentColor"
        />

        <!-- Crown. -->
        <path
            d="M16.5 11.5 L15.5 5 L20 8 L24 2.5 L28 8 L32.5 5 L31.5 11.5 Z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
            stroke-linejoin="round"
        />
    </svg>
</template>
