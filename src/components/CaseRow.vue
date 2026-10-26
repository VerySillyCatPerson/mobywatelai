<script setup lang="ts">
import { computed } from "vue";
import type { CaseRecord } from "../domain/types";
import { flows, statusLabels } from "../domain/flows";
import { useDemo } from "../stores/demo";
import { canContent } from "../domain/engine";
import Icon from "./Icon.vue";
const props = defineProps<{ item: CaseRecord }>();
const s = useDemo();
const content = computed(() => canContent(s.world, props.item));
</script>
<template>
  <RouterLink :to="`/cases/${item.id}`" class="list-row case-row"
    ><span class="tile-icon" :class="item.flowId === 'F04' ? 'sage' : ''"
      ><Icon :name="content ? flows[item.flowId].icon : 'cases'" /></span
    ><span class="row-main"
      ><strong>{{ s.title(item) }}</strong
      ><span v-if="content" class="muted"
        >{{ flows[item.flowId].subject }} ·
        {{ flows[item.flowId].steps[item.currentStep]?.title }}</span
      ><span v-else class="muted">Status i termin</span
      ><span class="badge" :class="item.status">{{
        statusLabels[item.status]
      }}</span></span
    ><Icon name="chevron" :size="18"
  /></RouterLink>
</template>
