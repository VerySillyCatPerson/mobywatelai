<script setup lang="ts">
import { language, setLanguage } from "../i18n";
import { useDemo } from "../stores/demo";
import Icon from "./Icon.vue";
const s = useDemo();
defineEmits<{ restore: [] }>();
</script>
<template>
  <div class="demo-toolbar">
    <span class="demo-toolbar-label">Sterowanie prototypem</span>
    <div class="language-picker" role="group" aria-label="Język aplikacji">
      <button
        lang="pl"
        :aria-pressed="language === 'pl'"
        aria-label="Polski"
        @click="setLanguage('pl')"
      >
        PL</button
      ><button
        lang="en"
        :aria-pressed="language === 'en'"
        aria-label="English"
        @click="setLanguage('en')"
      >
        EN
      </button>
    </div>
    <button
      class="restore-demo"
      :disabled="s.blocked"
      @click="$emit('restore')"
    >
      <Icon name="reset" :size="16" />Przywróć demo
    </button>
  </div>
</template>
