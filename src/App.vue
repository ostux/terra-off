<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <h2 class="text-3xl font-bold underline">{{ t('message.hello') }}</h2>
</template>

<style scoped></style>
