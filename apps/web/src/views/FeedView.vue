<script setup lang="ts">
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { api, ApiError } from '../api';
import PageShell from '../components/PageShell.vue';
import StatePanel from '../components/StatePanel.vue';
import { useToast } from '../composables/useToast';
import type { CommentItem, FeedItem } from '../types';

const { show: showToast } = useToast();
const items = ref<FeedItem[]>([]);
const loading = ref(true);
const loadError = ref('');
const page = ref(1);
const hasMore = ref(false);
const loadingMore = ref(false);

// State per feed item
const expandedComments = ref<Set<number>>(new Set());
const commentLoading = ref<Set<number>>(new Set());
const commentTexts = ref<Record<number, string>>({});
const submittingComment = ref<Set<number>>(new Set());

async function load(append = false) {
  if (append) loadingMore.value = true;
  else { loading.value = true; loadError.value = ''; page.value = 1; }

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
  item.likedByMe = !wasLiked;
  item.likeCount += wasLiked ? -1 : 1;

  try {
    const res = await api.post<{ liked: boolean }>(`/feed/checkins/${item.id}/like`);
    item.likedByMe = res.liked;
  } catch {
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
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    '#1d6b61', '#6366f1', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316',
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
    <section v-if="!loading && !loadError && items.length" class="feed-hero">
      <div class="feed-hero-copy">
        <p class="eyebrow">今天的打卡流</p>
        <h2>{{ items.length }} 条更新</h2>
        <p>这里汇总了今天公开的打卡、照片、心情和互动。</p>
      </div>
      <div class="feed-hero-stats">
        <div class="feed-stat">
          <span>点赞</span>
          <strong>{{ items.reduce((sum, item) => sum + item.likeCount, 0) }}</strong>
        </div>
        <div class="feed-stat">
          <span>评论</span>
          <strong>{{ items.reduce((sum, item) => sum + item.commentCount, 0) }}</strong>
        </div>
      </div>
    </section>

    <!-- Loading skeleton -->
    <div v-if="loading" class="moments-list">
      <div v-for="i in 4" :key="i" class="moments-item">
        <div class="skeleton-avatar" />
        <div class="moments-body">
          <div class="skeleton-line w40 tight" />
          <div class="skeleton-line w80" />
          <div class="skeleton-line w60" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <StatePanel v-else-if="loadError" title="广场内容没有加载出来" :description="loadError" compact>
      <button class="secondary-button" type="button" @click="load()">重新加载</button>
    </StatePanel>

    <!-- Empty state -->
    <StatePanel
      v-else-if="items.length === 0"
      title="今天的广场还没有新动态"
      description="等大家完成打卡后，这里会陆续出现照片、心情和评论。"
      compact
    />

    <!-- Feed list -->
    <div v-else class="moments-list moments-board">
      <article v-for="item in items" :key="item.id" class="moments-item">
        <div class="moments-avatar avatar-swatch" :style="{ background: getAvatarColor(item.username) }">
          {{ getInitial(item.username) }}
        </div>

        <div class="moments-body">
          <div class="moments-head">
            <div class="moments-user-row">
              <span class="moments-username">{{ item.username }}</span>
              <span class="moments-task-tag">{{ item.taskTitle }}</span>
            </div>
            <span class="moments-time">{{ formatTime(item.checkedAt) }}</span>
          </div>

          <div v-if="item.mood || item.note" class="moments-text">
            <span v-if="item.mood" class="moments-mood">{{ item.mood }}</span>
            <span v-if="item.note" class="moments-note">{{ item.note }}</span>
          </div>
          <div v-else class="moments-text moments-text--bare">
            <span class="moments-note moments-note--soft">完成了今天这项打卡。</span>
          </div>

          <div v-if="item.photoUrl" class="moments-photo-wrap">
            <img :src="item.photoUrl" class="moments-photo" loading="lazy" alt="打卡照片" />
          </div>

          <div class="moments-footer">
            <div class="moments-inline-actions">
              <button class="moments-inline-btn" :class="{ liked: item.likedByMe }" type="button" @click="toggleLike(item)">
                <Heart :size="15" :fill="item.likedByMe ? 'currentColor' : 'none'" />
                <span>{{ item.likeCount ? `${item.likeCount} 个赞` : '点赞' }}</span>
              </button>
              <button class="moments-inline-btn" type="button" @click="toggleComments(item)">
                <MessageCircle :size="15" />
                <span>{{ expandedComments.has(item.id) ? '收起评论' : item.commentCount ? `${item.commentCount} 条评论` : '写评论' }}</span>
              </button>
            </div>
          </div>

          <div v-if="item.likeCount > 0" class="moments-like-bar">
            <Heart :size="12" fill="#e25555" stroke="none" />
            <span class="moments-like-names">
              <template v-if="item.likedByMe">
                <strong>我</strong><template v-if="item.likeCount > 1">、还有{{ item.likeCount - 1 }}人</template>
              </template>
              <template v-else>
                {{ item.likeCount }}人觉得很赞
              </template>
            </span>
          </div>

          <div v-if="expandedComments.has(item.id) || item.commentCount > 0" class="moments-comment-section">
            <div v-if="commentLoading.has(item.id)" class="moments-comment-loading">加载中…</div>

            <div v-for="comment in item.comments" :key="comment.id" class="moments-comment">
              <span class="moments-comment-user">{{ comment.username }}</span>
              <span class="moments-comment-colon">:</span>
              <span class="moments-comment-text">{{ comment.content }}</span>
              <button class="moments-comment-del" type="button" aria-label="删除" @click="deleteComment(item, comment)">
                <Trash2 :size="12" />
              </button>
            </div>

            <div v-if="expandedComments.has(item.id)" class="moments-input-row">
              <input
                v-model="commentTexts[item.id]"
                class="moments-input"
                maxlength="500"
                placeholder="评论…"
                :disabled="submittingComment.has(item.id)"
                @keydown.enter.prevent="submitComment(item)"
              />
              <button
                class="moments-send-btn"
                type="button"
                :disabled="!commentTexts[item.id]?.trim() || submittingComment.has(item.id)"
                @click="submitComment(item)"
              >
                <Send :size="14" />
              </button>
            </div>
          </div>
        </div>
      </article>

      <div v-if="hasMore" class="moments-load-more">
        <button class="secondary-button" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中…' : '加载更多' }}
        </button>
      </div>
    </div>
  </PageShell>
</template>
