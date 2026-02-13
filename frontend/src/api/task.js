// src/api/task.js
// Task and Skill API functions

import { fetchAPI } from './client';

// ========== Skill API ==========

export async function getSkills() {
  return fetchAPI('/skill');
}

export async function createSkill(skillData) {
  return fetchAPI('/skill', {
    method: 'POST',
    body: JSON.stringify(skillData),
  });
}

// ========== Task API ==========

export async function getTasks() {
  return fetchAPI('/task');
}

export async function createTask(taskData) {
  return fetchAPI('/task', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function deleteTask(taskId) {
  return fetchAPI(`/task/${taskId}`, {
    method: 'DELETE',
  });
}
