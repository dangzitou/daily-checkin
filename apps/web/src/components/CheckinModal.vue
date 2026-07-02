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
const photoError = ref('');

const noteLength = computed(() => note.value.length);
const isSubmitting = computed(() => props.loading ?? false);

function onPhotoSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    photoError.value = '照片不能超过 5MB';
    setTimeout(() => { photoError.value = ''; }, 3000);
    return;
  }

  photoError.value = '';
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
          <div class="modal-header-copy">
            <p class="modal-eyebrow">完成打卡</p>
            <h3>{{ task.title }}</h3>
            <p class="modal-subcopy">上传照片、记录状态，完成后会立即计入今天的进度和积分。</p>
          </div>
          <button class="modal-close" @click="$emit('close')">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Photo section -->
          <div class="photo-section">
            <p v-if="photoError" class="photo-error">{{ photoError }}</p>
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
              <span>上传照片</span>
            </label>
          </div>

          <!-- Mood section -->
          <div class="mood-section">
            <label class="section-label">今天状态</label>
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
              placeholder="写一点今天的记录"
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
            {{ isSubmitting ? '提交中…' : '完成打卡' }}
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
  z-index: 100;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: var(--paper);
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--line);
}

.modal-header-copy {
  display: grid;
  gap: 4px;
}

.modal-eyebrow {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.modal-subcopy {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.modal-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--muted);
  border-radius: 6px;
  transition: background 180ms ease;
}

.modal-close:hover {
  background: var(--surface);
}

.modal-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hidden {
  display: none;
}

/* Photo */
.photo-upload {
  display: grid;
  place-items: center;
  flex-direction: column;
  gap: 8px;
  min-height: 164px;
  padding: 20px;
  border: 1.5px dashed var(--line-strong);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(251, 251, 248, 0.92), rgba(245, 248, 243, 0.92));
  cursor: pointer;
  color: var(--muted);
  transition: border-color 180ms ease, color 180ms ease;
}

.photo-upload:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.photo-error {
  margin: 0 0 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fdf0f0;
  color: var(--danger, #b42318);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.photo-preview {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
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
  background: rgba(17, 25, 23, 0.62);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 180ms ease;
}

.photo-remove:hover {
  background: rgba(0, 0, 0, 0.75);
}

/* Mood */
.section-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 8px;
}

.mood-picker {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-height: 72px;
  padding: 10px 6px;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: rgba(251, 251, 248, 0.96);
  cursor: pointer;
  transition: all 180ms ease;
}

.mood-btn:hover {
  border-color: var(--line-strong);
}

.mood-btn.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.mood-emoji {
  font-size: 24px;
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
  min-height: 96px;
  padding: 12px 12px 24px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(251, 251, 248, 0.95);
  font-size: 14px;
  line-height: 1.55;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.note-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.note-count {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 11px;
  color: var(--muted);
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 10px;
  padding: 16px 20px 20px;
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(251, 251, 248, 0), rgba(245, 248, 243, 0.62));
}

.btn-cancel,
.btn-submit {
  flex: 1;
  min-height: 46px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms ease, opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.btn-cancel {
  background: rgba(251, 251, 248, 0.95);
  border: 1.5px solid var(--line);
  color: var(--ink);
}

.btn-cancel:hover {
  background: var(--surface-strong);
  border-color: var(--line-strong);
}

.btn-submit {
  background: var(--primary);
  border: none;
  color: white;
  box-shadow: 0 8px 18px rgba(24, 106, 96, 0.18);
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-strong);
  box-shadow: 0 12px 22px rgba(24, 106, 96, 0.22);
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-cancel:active {
  transform: scale(0.98);
}

.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
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
