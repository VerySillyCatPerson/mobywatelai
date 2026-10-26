<script setup lang="ts">
defineProps<{ dog?: boolean; large?: boolean }>();
</script>
<template>
  <div class="pet-avatar" :class="{ large, dog }" aria-hidden="true">
    <svg viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="62" r="47" fill="currentColor" opacity=".1" />
      <path
        v-if="!dog"
        d="M29 53 25 22 49 38M71 38 96 22 91 56"
        fill="#a99ba1"
        stroke="#62545d"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        v-else
        d="M33 44C15 27 12 54 20 69L35 63M86 44C105 27 110 54 100 69L86 63"
        fill="#9f7762"
      />
      <ellipse
        cx="60"
        cy="64"
        rx="35"
        ry="31"
        :fill="dog ? '#c09b7c' : '#c9bdc1'"
      />
      <path
        d="M46 35 52 49M60 34V48M74 35 68 49"
        stroke="#8b7c84"
        stroke-width="5"
        stroke-linecap="round"
      />
      <path
        d="M42 62h5M75 62h5"
        stroke="#283746"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path d="m55 72 5 4 5-4" fill="#a16e72" />
      <path
        d="M60 76v4m0 0-7 3m7-3 7 3M32 72l-17-3m18 10-18 2m73-9 17-3m-18 10 18 2"
        stroke="#62545d"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M42 93c12 5 24 5 36 0"
        stroke="#537c70"
        stroke-width="5"
        stroke-linecap="round"
      />
      <circle cx="60" cy="99" r="5" fill="#d4ae55" />
    </svg>
  </div>
</template>
