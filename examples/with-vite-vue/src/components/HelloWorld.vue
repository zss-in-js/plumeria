<script setup lang="ts">
import { ref } from 'vue';
import { css } from '@plumeria/core';

const styles = css.create({
  color: {
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(90deg, #58c6ff 0%, #416389 50%, #ff3bef 100%)',
    backgroundClip: 'text',
  },
  text: {
    textAlign: 'center',
  },
});

defineProps<{ msg: string }>();

const count = ref(0);
</script>

<template>
  <h1 :class="css.props(styles.color)">{{ msg }}</h1>

  <div :class="css.props(styles.text)">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
