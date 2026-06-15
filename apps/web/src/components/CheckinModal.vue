<script setup lang="ts">
import { ref, computed } from 'vue';
import { Camera, X, Image } from 'lucide-vue-next';
import { MOOD_OPTIONS } from '../types';
import type { MoodEmoji, Task } from '../types';

const props = defineProps<{
  task: Task;
  visible: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: { photo: File | null; mood: MoodEmoji | null; note: string }): void;
}>();

const selectedMood = ref<MoodEmoji | null>(null);
const note = ref('');
const photoFile = ref<File | null>(null);
const photoPreview = ref<string | null>(null);

const noteLength = computed(() => note.value.length);
const isSubmitting = computed(() => props.loading ?? false);

function onPhotoSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('照片不能超过 5MB');
    return;
  }

  photoFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  photoFile.value = null;
  photoPreview.value = null;
}

function selectMood(emoji: MoodEmoji) {
  selectedMood.value = selectedMood.value === emoji ? null : emoji;
}

function handleSubmit() {
  emit('submit', {
    photo: photoFile.value,
    mood: selectedMood.value,
    note: note.value.trim(),
  });
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close');
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleBackdropClick">
      <div class="modal-card">
        <div class="modal-header">
          <h3>打卡 · {{ task.title }}</h3>
          <button class="modal-close" @click="$emit('close')">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Photo section -->
          <div class="photo-section">
            <div v-if="photoPreview" class="photo-preview">
              <img :src="photoPreview" alt="照片预览" />
              <button class="photo-remove" @click="removePhoto">
                <X :size="16" />
              </button>
            </div>
            <label v-else class="photo-upload">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                class="hidden"
                @change="onPhotoSelect"
              />
              <Camera :size="32" />
              <span>拍照 / 选择照片</span>
            </label>
          </div>

          <!-- Mood section -->
          <div class="mood-section">
            <label class="section-label">今天心情</label>
            <div class="mood-picker">
              <button
                v-for="option in MOOD_OPTIONS"
                :key="option.emoji"
                class="mood-btn"
                :class="{ active: selectedMood === option.emoji }"
                @click="selectMood(option.emoji)"
              >
                <span class="mood-emoji">{{ option.emoji }}</span>
                <span class="mood-label">{{ option.label }}</span>
              </button>
            </div>
          </div>

          <!-- Note section -->
          <div class="note-section">
            <label class="section-label">小记</label>
            <textarea
              v-model="note"
              class="note-input"
              placeholder="记录一些今天的小事情..."
              maxlength="500"
              rows="3"
            />
            <span class="note-count">{{ noteLength }}/500</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">取消</button>
          <button
            class="btn-submit"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? '打卡中...' : '打卡！' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: var(--paper);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--muted);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hidden {
  display: none;
}

/* Photo */
.photo-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  border: 2px dashed var(--line-strong);
  border-radius: 12px;
  cursor: pointer;
  color: var(--muted);
  transition: border-color 0.2s, color 0.2s;
}

.photo-upload:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.photo-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.photo-preview img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  display: block;
}

.photo-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Mood */
.section-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 10px;
}

.mood-picker {
  display: flex;
  gap: 8px;
}

.mood-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 2px solid var(--line);
  border-radius: 12px;
  background: none;
  cursor: pointer;
  transition: all 0.2s;
}

.mood-btn.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.mood-emoji {
  font-size: 28px;
  line-height: 1;
}

.mood-label {
  font-size: 11px;
  color: var(--muted);
}

.mood-btn.active .mood-label {
  color: var(--primary-strong);
}

/* Note */
.note-section {
  position: relative;
}

.note-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

.note-input:focus {
  outline: none;
  border-color: var(--primary);
}

.note-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: var(--muted);
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--line);
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cancel {
  background: var(--surface);
  border: none;
  color: var(--ink);
}

.btn-submit {
  background: var(--primary);
  border: none;
  color: white;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
