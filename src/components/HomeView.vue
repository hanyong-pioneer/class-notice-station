<script setup>
import { computed } from 'vue'
import { CATEGORIES, allEvents, daysUntil, fmtDate, searchHit } from '../utils/data.js'
import { isFollowed } from '../utils/store.js'
import NoticeCard from './NoticeCard.vue'

const props = defineProps({
  notices: { type: Array, default: () => [] },
  q: { type: String, default: '' },
  cat: { type: String, default: 'all' },
  onlyFollowed: { type: Boolean, default: false }
})
const emit = defineEmits(['update:q', 'update:cat', 'update:onlyFollowed'])

const catKeys = ['all', ...Object.keys(CATEGORIES)]
const qLocal = computed({
  get: () => props.q,
  set: (v) => emit('update:q', v)
})
const setCat = (k) => emit('update:cat', k)
const toggleOnly = () => emit('update:onlyFollowed', !props.onlyFollowed)

const filtered = computed(() =>
  props.notices
    .filter(
      (n) =>
        (props.cat === 'all' || n.category === props.cat) &&
        (!props.onlyFollowed || isFollowed(n.id)) &&
        searchHit(n, props.q)
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
)

// 未来 7 天内的截止节点速览
const soonEvents = computed(() =>
  allEvents(props.notices)
    .filter((e) => {
      const d = daysUntil(e.date)
      return d >= 0 && d <= 7
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
)
</script>

<template>
  <div>
    <div class="search-wrap">
      <input v-model="qLocal" class="input search" type="search" placeholder="🔍 搜索标题、关键词、步骤、材料…" />
      <button v-if="qLocal" class="search-clear" @click="qLocal = ''">✕</button>
    </div>

    <div class="chips">
      <button v-for="k in catKeys" :key="k" class="chip" :class="{ on: cat === k }" @click="setCat(k)">
        {{ k === 'all' ? '全部' : CATEGORIES[k].icon + ' ' + CATEGORIES[k].label }}
      </button>
      <button class="chip" :class="{ on: onlyFollowed }" @click="toggleOnly">⭐ 关注</button>
    </div>

    <div v-if="soonEvents.length" class="card soon">
      <div class="soon-title">⏰ 未来 7 天待办</div>
      <div class="soon-list">
        <a v-for="e in soonEvents" :key="e.notice.id + '-' + e.date" class="soon-chip" :href="'#/notice/' + e.notice.id">
          {{ fmtDate(e.date) }} · {{ e.label }}
        </a>
      </div>
    </div>

    <div class="result-count">共 {{ filtered.length }} 条通知</div>

    <NoticeCard v-for="n in filtered" :key="n.id" :notice="n" />

    <div v-if="!filtered.length" class="state">😕 没有符合条件的通知,换个关键词试试</div>
  </div>
</template>

<style scoped>
.search-wrap {
  position: relative;
  margin-bottom: 12px;
}

.search {
  padding-right: 40px;
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sub);
  font-size: 14px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.soon {
  margin-bottom: 14px;
}

.soon-title {
  font-weight: 700;
  color: var(--deep);
  font-size: 14px;
  margin-bottom: 8px;
}

.soon-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.soon-chip {
  background: var(--light);
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  white-space: nowrap;
}

.result-count {
  color: var(--sub);
  font-size: 13px;
  margin: 0 2px 10px;
}
</style>
