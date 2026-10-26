<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import Icon from "./Icon.vue";
const props = defineProps<{
  title: string;
  wide?: boolean;
  locked?: boolean;
}>();
const emit = defineEmits<{ close: [] }>();
const panel = ref<HTMLElement>();
let previous: HTMLElement | null = null;
let backgrounds: { element: HTMLElement; wasInert: boolean }[] = [];
function key(e: KeyboardEvent) {
  if (e.key === "Escape" && !props.locked) {
    e.preventDefault();
    emit("close");
  }
  if (e.key === "Tab") {
    const items = panel.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
    );
    if (!items?.length) {
      e.preventDefault();
      return;
    }
    const first = items[0]!,
      last = items[items.length - 1]!;
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === panel.value)
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
onMounted(async () => {
  previous = document.activeElement as HTMLElement;
  await nextTick();
  panel.value?.focus();
  backgrounds = [
    ...document.querySelectorAll<HTMLElement>(
      "#app-shell,.assistant-backdrop,.modal-backdrop",
    ),
  ]
    .filter((el) => !el.contains(panel.value!))
    .map((element) => ({ element, wasInert: element.inert }));
  backgrounds.forEach((b) => (b.element.inert = true));
  document.addEventListener("keydown", key);
  document.querySelector<HTMLElement>("#app-shell")!.style.overflow = "hidden";
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", key);
  backgrounds.forEach((b) => (b.element.inert = b.wasInert));
  document.querySelector<HTMLElement>("#app-shell")!.style.overflow =
    document.querySelector(".assistant-backdrop") ? "hidden" : "";
  previous?.isConnected && previous.focus();
});
</script>
<template>
  <Teleport to="#phone-overlays"
    ><div class="modal-backdrop" @click.self="!locked && emit('close')">
      <section
        ref="panel"
        class="modal"
        :class="{ wide }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
      >
        <header class="modal-header">
          <h2>{{ title }}</h2>
          <button
            v-if="!locked"
            class="icon-button"
            :aria-label="`Zamknij: ${title}`"
            @click="emit('close')"
          >
            <Icon name="close" />
          </button>
        </header>
        <slot />
      </section></div
  ></Teleport>
</template>
