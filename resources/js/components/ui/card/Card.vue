<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-[inset_0_1px_0_0_var(--card-edge),0_1px_3px_0_rgb(0_0_0/0.1)]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
