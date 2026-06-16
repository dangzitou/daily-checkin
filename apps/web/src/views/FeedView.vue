<script setup lang="ts">
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { api, ApiError } from '../api';
import PageShell from '../components/PageShell.vue';
import { useToast } from '../composables/useToast';
import type { CommentItem, FeedItem } from '../types';

const { show: showToast } = useToast();
const items = ref<FeedItem[]>([]);
const loading = ref(true);
const loadError = ref('');
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
  else { loading.value = true; loadError.value = ''; }

  try {
    const res = await api.get<{ items: FeedItem[]; hasMore: boolean; page: number }>(
      `/feed/today?page=${page.value}&limit=20`,
    );
    if (append) items.value.push(...res.items);
    else items.value = res.items;
    hasMore.value = res.hasMore;
  } catch (err) {
    loadError.value = err instanceof ApiError ? err.message : '加载失败';
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
  const wasLiked = item.likedByMe;
  const wasCount = item.likeCount;
  // Optimistic
  item.likedByMe = !wasLiked;
  item.likeCount += wasLiked ? -1 : 1;

  try {
    const res = await api.post<{ liked: boolean }>(`/feed/checkins/${item.id}/like`);
    item.likedByMe = res.liked;
  } catch {
    // Revert
    item.likedByMe = wasLiked;
    item.likeCount = wasCount;
    showToast('操作失败', 'error');
  }
}

function toggleComments(item: FeedItem) {
  if (expandedComments.value.has(item.id)) {
    expandedComments.value.delete(item.id);
  } else {
    expandedComments.value.add(item.id);
    if (item.comments.length < item.commentCount) loadAllComments(item);
  }
}

async function loadAllComments(item: FeedItem) {
  commentLoading.value.add(item.id);
  try {
    item.comments = await api.get<CommentItem[]>(`/feed/checkins/${item.id}/comments`);
  } catch {
    showToast('加载评论失败', 'error');
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
    showToast('评论失败', 'error');
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
    showToast('删除失败', 'error');
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

// Generate consistent color from username
function getAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #1f7268 0%, #2a9d8f 100%)',
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

onMounted(() => load());
</script>

<template>
  <PageShell title="广场" eyebrow="今日动态">
    <!-- Loading skeleton -->
    <div v-if="loading" class="feed-list">
      <div v-for="i in 3" :key="i" class="feed-card">
        <div class="feed-header">
          <div class="skeleton-avatar" />
          <div style="flex:1"><div class="skeleton-line w60" /><div class="skeleton-line w40" /></div>
        </div>
        <div class="skeleton-line w80" />
        <div class="skeleton-photo" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="empty-state actionable-empty">
      <span>{{ loadError }}</span>
      <button class="secondary-button" type="button" @click="load()">重新加载</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="empty-state">
      今天还没有人打卡
    </div>

    <!-- Feed list -->
    <div v-else class="feed-list">
      <article v-for="item in items" :key="item.id" class="feed-card">
        <!-- Header -->
        <div class="feed-header">
          <div class="feed-avatar" :style="{ background: getAvatarColor(item.username) }">
            {{ getInitial(item.username) }}
          </div>
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
          <div v-if="item.photoUrl" class="feed-photo-wrap">
            <img :src="item.photoUrl" class="feed-photo" loading="lazy" alt="打卡照片" />
          </div>
        </div>

        <!-- Actions -->
        <div class="feed-actions">
          <button
            class="feed-action-btn"
            :class="{ active: item.likedByMe }"
            type="button"
            @click="toggleLike(item)"
          >
            <Heart :size="17" :fill="item.likedByMe ? 'currentColor' : 'none'" :stroke-width="item.likedByMe ? 0 : 1.8" />
            <span>{{ item.likeCount > 0 ? item.likeCount : '赞' }}</span>
          </button>
          <button
            class="feed-action-btn"
            :class="{ active: expandedComments.has(item.id) }"
            type="button"
            @click="toggleComments(item)"
          >
            <MessageCircle :size="17" :stroke-width="1.8" />
            <span>{{ item.commentCount > 0 ? item.commentCount : '评论' }}</span>
          </button>
        </div>

        <!-- Comments -->
        <div v-if="expandedComments.has(item.id)" class="feed-comments">
          <div v-if="commentLoading.has(item.id)" class="feed-comment-loading">加载中…</div>

          <div v-for="comment in item.comments" :key="comment.id" class="feed-comment">
            <span class="feed-comment-user">{{ comment.username }}</span>
            <span class="feed-comment-text">{{ comment.content }}</span>
            <button class="feed-comment-delete" type="button" aria-label="删除评论" @click="deleteComment(item, comment)">
              <Trash2 :size="13" />
            </button>
          </div>

          <form class="feed-comment-form" @submit.prevent="submitComment(item)">
            <input
              v-model="commentTexts[item.id]"
              class="feed-comment-input"
              maxlength="500"
              placeholder="写评论…"
              :disabled="submittingComment.has(item.id)"
            />
            <button
              class="feed-comment-submit"
              type="submit"
              :disabled="!commentTexts[item.id]?.trim() || submittingComment.has(item.id)"
            >
              <Send :size="15" />
            </button>
          </form>
        </div>
      </article>

      <div v-if="hasMore" class="feed-load-more">
        <button class="secondary-button" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中…' : '加载更多' }}
        </button>
      </div>
    </div>
  </PageShell>
</template>
