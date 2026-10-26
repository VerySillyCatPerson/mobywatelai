<script setup lang="ts">
import type { Field } from "../domain/types";
import Icon from "./Icon.vue";
const props = defineProps<{
  field: Field;
  value: any;
  error?: string;
  prefix: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ change: [value: any]; preview: [label: string] }>();
function check(value: string) {
  const set = new Set<string>(props.value || []);
  set.has(value) ? set.delete(value) : set.add(value);
  emit("change", [...set]);
}
</script>
<template>
  <fieldset
    v-if="['radio', 'checkboxes'].includes(field.kind || '')"
    class="field"
    :disabled="disabled"
    :aria-describedby="
      error
        ? `${prefix}-${field.key}-error`
        : field.hint
          ? `${prefix}-${field.key}-hint`
          : undefined
    "
  >
    <legend>
      {{ field.label
      }}<span v-if="field.required" class="required"> · wymagane</span>
    </legend>
    <p
      v-if="field.hint"
      :id="`${prefix}-${field.key}-hint`"
      class="muted field-hint"
    >
      {{ field.hint }}
    </p>
    <div class="options">
      <div v-for="opt in field.options" :key="opt.value" class="option-wrap">
        <label
          class="option"
          :class="{
            selected:
              field.kind === 'checkboxes'
                ? value?.includes(opt.value)
                : value === opt.value,
          }"
          ><input
            :type="field.kind === 'checkboxes' ? 'checkbox' : 'radio'"
            :name="`${prefix}-${field.key}`"
            :value="opt.value"
            :checked="
              field.kind === 'checkboxes'
                ? value?.includes(opt.value)
                : value === opt.value
            "
            :aria-invalid="!!error"
            @change="
              field.kind === 'checkboxes'
                ? check(opt.value)
                : emit('change', opt.value)
            "
          /><span>{{ opt.label }}</span></label
        ><button
          v-if="
            opt.value.startsWith('invoice-') ||
            opt.value === 'wrong-file' ||
            opt.value === 'child-photo'
          "
          type="button"
          class="text-button preview-button"
          @click="emit('preview', opt.label)"
        >
          <Icon name="eye" :size="17" />Podgląd
        </button>
      </div>
    </div>
    <p v-if="error" :id="`${prefix}-${field.key}-error`" class="field-error">
      {{ error }}
    </p>
  </fieldset>
  <div v-else class="field">
    <label v-if="field.kind === 'check'" class="option"
      ><input
        type="checkbox"
        :checked="!!value"
        :disabled="disabled"
        @change="emit('change', ($event.target as HTMLInputElement).checked)"
      /><span>{{ field.label }}</span></label
    ><template v-else
      ><label :for="`${prefix}-${field.key}`"
        >{{ field.label
        }}<span v-if="field.required" class="required"> · wymagane</span></label
      ><textarea
        v-if="field.kind === 'textarea'"
        :id="`${prefix}-${field.key}`"
        :value="value || ''"
        :disabled="disabled"
        rows="7"
        :aria-invalid="!!error"
        :aria-describedby="`${prefix}-${field.key}-hint ${prefix}-${field.key}-error`"
        @input="
          emit('change', ($event.target as HTMLTextAreaElement).value)
        " /><input
        v-else
        :id="`${prefix}-${field.key}`"
        :value="value || ''"
        :disabled="disabled"
        type="text"
        :inputmode="
          field.key === 'chipNumber' || field.key === 'verificationCode'
            ? 'numeric'
            : undefined
        "
        autocomplete="off"
        :aria-invalid="!!error"
        :aria-describedby="`${prefix}-${field.key}-hint ${prefix}-${field.key}-error`"
        @input="emit('change', ($event.target as HTMLInputElement).value)"
    /></template>
    <p :id="`${prefix}-${field.key}-hint`" class="muted field-hint">
      {{ field.hint
      }}<span v-if="field.maxLength">
        {{ (value || "").length }} / {{ field.maxLength }} znaków</span
      >
    </p>
    <button
      v-if="field.sample"
      type="button"
      class="text-button sample"
      :disabled="disabled"
      @click="emit('change', field.sample)"
    >
      <Icon name="plus" :size="17" />{{
        field.key === "verificationCode"
          ? "Wstaw kod demonstracyjny"
          : field.key === "chipNumber"
            ? "Wstaw numer przykładowy"
            : "Użyj szkicu demonstracyjnego"
      }}
    </button>
    <p :id="`${prefix}-${field.key}-error`" class="field-error">{{ error }}</p>
  </div>
</template>
