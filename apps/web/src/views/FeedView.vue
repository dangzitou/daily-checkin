<script setup lang="ts">
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { api } from '../api';
import PageShell from '../components/PageShell.vue';
import type { CommentItem, FeedItem } from '../types';

const items = ref<FeedItem[]>([]);
const loading = ref(true);
const page = ref(1);
const hasMore = ref(false);
const loadingMore = ref(false);

// Comment state per feed item
const expandedComments = ref<Set<number>>(new Set());
const commentLoading = ref<Set<number>>(new Set());
const commentTexts = ref<Record<number, string>>({});
const submittingComment = ref<Set<number>>(new Set());

async function load(append = false) {
  if (append) loadingMore.value = true;
  else loading.value = true;

  try {
    const res = await api.get<{ items: FeedItem[]; hasMore: boolean; page: number }>(
      `/feed/today?page=${page.value}&limit=20`
    );
    if (append) {
      items.value.push(...res.items);
    } else {
      items.value = res.items;
    }
    hasMore.value = res.hasMore;
  } catch {
    // silent
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function loadMore() {
  page.value++;
  load(true);
}

async function toggleLike(item: FeedItem) {
  // Optimistic update
  const wasLiked = item.likedByMe;
  item.likedByMe = !wasLiked;
  item.likeCount += wasLiked ? -1 : 1;

  try {
    const res = await api.post<{ liked: boolean }>(`/feed/checkins/${item.id}/like`);
    // Sync with server response
    item.likedByMe = res.liked;
    item.likeCount += res.liked ? (wasLiked ? 0 : 0) : (wasLiked ? 0 : 0);
  } catch {
    // Revert on error
    item.likedByMe = wasLiked;
    item.likeCount += wasLiked ? 1 : -1;
  }
}

function toggleComments(item: FeedItem) {
  if (expandedComments.value.has(item.id)) {
    expandedComments.value.delete(item.id);
  } else {
    expandedComments.value.add(item.id);
    if (item.comments.length < item.commentCount) {
      loadAllComments(item);
    }
  }
}

async function loadAllComments(item: FeedItem) {
  commentLoading.value.add(item.id);
  try {
    const comments = await api.get<CommentItem[]>(`/feed/checkins/${item.id}/comments`);
    item.comments = comments;
  } catch {
    // silent
  } finally {
    commentLoading.value.delete(item.id);
  }
}

async function submitComment(item: FeedItem) {
  const text = commentTexts.value[item.id]?.trim();
  if (!text) return;

  submittingComment.value.add(item.id);
  try {
    const comment = await api.post<CommentItem>(`/feed/checkins/${item.id}/comments`, { content: text });
    item.comments.push(comment);
    item.commentCount++;
    commentTexts.value[item.id] = '';
  } catch {
    // silent
  } finally {
    submittingComment.value.delete(item.id);
  }
}

async function deleteComment(item: FeedItem, comment: CommentItem) {
  try {
    await api.delete(`/feed/comments/${comment.id}`);
    item.comments = item.comments.filter((c) => c.id !== comment.id);
    item.commentCount--;
  } catch {
    // silent
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

onMounted(() => load());
</script>

<template>
  <PageShell title="广场" eyebrow="今日动态">
    <div v-if="loading" class="empty-state">正在加载</div>

    <div v-else-if="items.length === 0" class="empty-state">
      今天还没有人打卡哦~
    </div>

    <div v-else class="feed-list">
      <article v-for="item in items" :key="item.id" class="feed-card">
        <!-- Header -->
        <div class="feed-header">
          <div class="feed-avatar">{{ getInitial(item.username) }}</div>
          <div class="feed-meta">
            <span class="feed-username">{{ item.username }}</span>
            <span class="feed-task">{{ item.taskTitle }}</span>
          </div>
          <span class="feed-time">{{ formatTime(item.checkedAt) }}</span>
        </div>

        <!-- Content -->
        <div class="feed-content">
          <div v-if="item.mood || item.note" class="feed-text">
            <span v-if="item.mood" class="feed-mood">{{ item.mood }}</span>
            <span v-if="item.note" class="feed-note">{{ item.note }}</span>
          </div>
          <img
            v-if="item.photoUrl"
            :src="item.photoUrl"
            class="feed-photo"
            loading="lazy"
            alt="打卡照片"
          />
        </div>

        <!-- Actions -->
        <div class="feed-actions">
          <button
            class="feed-action-btn"
            :class="{ active: item.likedByMe }"
            type="button"
            @click="toggleLike(item)"
          >
            <Heart :size="18" :fill="item.likedByMe ? 'currentColor' : 'none'" />
            <span v-if="item.likeCount > 0">{{ item.likeCount }}</span>
          </button>
          <button
            class="feed-action-btn"
            :class="{ active: expandedComments.has(item.id) }"
            type="button"
            @click="toggleComments(item)"
          >
            <MessageCircle :size="18" />
            <span v-if="item.commentCount > 0">{{ item.commentCount }}</span>
          </button>
        </div>

        <!-- Comments section -->
        <div v-if="expandedComments.has(item.id)" class="feed-comments">
          <div v-if="commentLoading.has(item.id)" class="feed-comment-loading">加载中...</div>

          <div v-for="comment in item.comments" :key="comment.id" class="feed-comment">
            <span class="feed-comment-user">{{ comment.username }}</span>
            <span class="feed-comment-text">{{ comment.content }}</span>
            <button
              class="feed-comment-delete"
              type="button"
              aria-label="删除评论"
              @click="deleteComment(item, comment)"
            >
              <Trash2 :size="14" />
            </button>
          </div>

          <!-- Comment input -->
          <form class="feed-comment-form" @submit.prevent="submitComment(item)">
            <input
              v-model="commentTexts[item.id]"
              class="feed-comment-input"
              maxlength="500"
              placeholder="写评论..."
              :disabled="submittingComment.has(item.id)"
            />
            <button
              class="feed-comment-submit"
              type="submit"
              :disabled="!commentTexts[item.id]?.trim() || submittingComment.has(item.id)"
            >
              <Send :size="16" />
            </button>
          </form>
        </div>
      </article>

      <!-- Load more -->
      <div v-if="hasMore" class="feed-load-more">
        <button class="secondary-button" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
  </PageShell>
</template>
