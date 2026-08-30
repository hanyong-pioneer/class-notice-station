<script setup>
import { computed, ref } from 'vue'
import { categoryInfo, fmtDate, nextDeadline, relDay, urgencyClass } from '../utils/data.js'
import { isFollowed, toggleFollow } from '../utils/store.js'

const props = defineProps({ notice: { type: Object, required: true } })
const cat = computed(() => categoryInfo(props.notice.category))
const next = computed(() => nextDeadline(props.notice))
const followed = ref(isFollowed(props.notice.id))

const go = () => {
  location.hash = '#/notice/' + props.notice.id
}
const onStar = () => {
  followed.value = toggleFollow(props.notice.id)
}
</script>

<template>
  <div class="card notice-card" @click="go">
    <div class="card-top">
      <span class="cat-chip" :style="{ background: cat.color + '1a', color: cat.color }">{{ cat.icon }} {{ cat.label }}</span>
      <span v-for="tg in (notice.tags || [])" :key="tg" class="tag"># {{ tg }}</span>
      <span class="meta">{{ notice.source }} · {{ fmtDate(notice.publishedAt) }}</span>
      <button class="star" :class="{ on: followed }" @click.stop="onStar" :title="followed ? '取消关注' : '关注'">
        {{ followed ? '⭐' : '☆' }}
      </button>
    </div>
    <h3 class="card-title">{{ notice.title }}</h3>
    <p v-if="notice.summary" class="card-summary">{{ notice.summary }}</p>
    <div v-if="next" class="card-foot">
      <span class="badge" :class="'badge-' + urgencyClass(next.date)">
        ⏰ {{ fmtDate(next.date) }} · {{ relDay(next.date) }}
      </span>
      <div class="deadline-label">{{ next.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.notice-card {
  cursor: pointer;
  transition: border-color 0.15s;
}

.notice-card:hover {
  border-color: #93c5fd;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-chip {
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.meta {
  color: var(--sub);
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}

.star {
  font-size: 18px;
  color: #cbd5e1;
  padding: 0 2px;
}

.star.on {
  color: #f59e0b;
}

.card-title {
  font-size: 17px;
  margin: 8px 0 4px;
  line-height: 1.45;
}

.card-summary {
  color: var(--sub);
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-foot {
  margin-top: 10px;
}

.deadline-label {
  margin-top: 6px;
  font-size: 13px;
  color: var(--sub);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
