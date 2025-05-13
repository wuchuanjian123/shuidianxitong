<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <router-view />
</template>


<style>
nav {
  margin-bottom: 2rem;
}

.chart-container {
  margin: 2rem auto;
  width: 80%;
  height: 500px;
  border: 1px solid #eee;
  padding: 1rem;
  border-radius: 8px;
}
</style>
