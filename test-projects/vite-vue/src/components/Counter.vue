<script setup lang="ts">
import { ref } from 'vue'

const { initial } = defineProps<{ initial: number }>()

const count = ref(initial ?? 0)
</script>

<template>
  <div className={styles.counter}>
    <div data-testid="count">{{count}}</div>
    <button @click=count++>Increment</button>
    <button @click=count-->Decrement</button>
  </div>
</template>