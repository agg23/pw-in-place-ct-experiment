<script setup lang="ts">
import { defineStore } from 'pinia'

const store = defineStore('store', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count += 1;
    }
  }
})();
</script>

<template>
  <div>
    <div data-testid="count">{{store.count}}</div>
    <button @click=store.increment>Increment</button>
  </div>
</template>