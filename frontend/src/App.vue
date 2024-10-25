<script setup>
import { ref } from 'vue';
import CommentSection from './components/CommentSection.vue';

const userId = ref('');
const users = ref(null);
const newEmail = ref('');
const errorMessage = ref('');

const backendUrl = process.env.VUE_APP_BACKEND_URL; // Ambil URL dari variabel lingkungan

const getUser = async () => {
  try {
    const response = await fetch(`${backendUrl}/api/user/${userId.value}`); // Gunakan backendUrl
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    users.value = await response.json();
    errorMessage.value = ''; // Clear any previous error messages
  } catch (error) {
    errorMessage.value = error.message; // Display the error message from backend
  }
};

const changeEmail = async () => {
  try {
    const response = await fetch(`${backendUrl}/api/user/${userId.value}/change-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: newEmail.value }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    alert('Email updated successfully');
    errorMessage.value = ''; // bersihin error message sebelumnya
  } catch (error) {
    errorMessage.value = error.message; // nampilin error message dari backend
  }
};
</script>


<template>
  <div id="app">
    <h1>User Dashboard</h1>
    <div>
      <input v-model="userId" placeholder="Enter User ID" />
      <button @click="getUser">Get User Info</button>
    </div>
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>
    <div v-if="users">
      <template v-for="user in users" :key="user.id">
        <h2>{{ user.name }}</h2>
        <p>Email: {{ user.email }}</p>
        <hr />
      </template>
    </div>
    <CommentSection />
    <form @submit.prevent="changeEmail">
      <h3>Change Email</h3>
      <input v-model="newEmail" placeholder="New Email" />
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<style>
.error-message {
  color: red;
  font-weight: bold;
}
</style>
