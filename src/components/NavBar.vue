<template>
  <nav>
    <router-link 
      v-for="building in buildings" 
      :key="building.id"
      :to="`/building/${building.id}`"
    >
      {{ building.name }}
    </router-link>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const buildings = ref([])

axios.get('http://localhost:3000/buildings')
  .then(res => buildings.value = res.data)
</script>

<style scoped>
nav {
  background: #2c3e50;
  padding: 1rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
}
a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}
a:hover {
  background: #34495e;
}
.router-link-active {
  background: #34495e;
}
</style>