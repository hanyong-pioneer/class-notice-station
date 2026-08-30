<script setup>
import { computed, ref } from 'vue'
import { allEvents, categoryInfo, daysUntil, fmtDate, relDay, urgencyClass, weekday } from '../utils/data.js'
import { buildICS, downloadICS } from '../utils/ics.js'

const props = defineProps({ notices: { type: Array, default: () => [] } })
const showAll = ref(false)

const groups = computed(() => {
  const evts = allEvents(props.notices).filter((e) => showAll.value || daysUntil(e.date) >= 0)
  evts.sort((a, b) => a.date.localeCompare(b.date) || a.notice.id - b.notice.id)
  const map = new Map()
  evts.forEach((e) => {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date).push(e)
  })
  return [...map.entries()]
})

const stats = computed(() => {
  const up = allEvents(props.notices).filter((e) => daysUntil(e.date) >= 0)
  return {
    total: up.length,
    w7: up.filter((e) => daysUntil(e.date) <= 7).length,
    w30: up.filter((e) => daysUntil(e.date) <= 30).length
  }
})

const downloadAll = () => downloadICS('班级通知日历.ics', buildICS(props.notices))
</script>

<template>
  <div>
    <div class="card head-card">
      <div class="tl-title">📅 时间线总览</div>
      <p class="tl-sub">所有通知的截止节点按日期合并,一眼看到接下来该做什么</p>
      <div class="stats">
        <span class="stat"><b>{{ stats.total }}</b> 个未过期节点</span>
        <span class="stat"><b>{{ stats.w7 }}</b> 个在 7 天内</span>
        <span class="stat"><b>{{ stats.w30 }}</b> 个在 30 天内</span>
      </div>
      <div class="tl-actions">
        <button class="btn btn-primary" @click="downloadAll">📅 下载日历(.ics)</button>
        <button class="btn" @click="showAll = !showAll">{{ showAll ? '只看未过期' : '显示全部(含已过期)' }}</button>
      </div>
      <p class="hint">.ics 文件下载后用手机系统日历打开,即可导入全部截止日期并自动提醒</p>
    </div>

    <div v-if="!groups.length" class="state">暂无时间节点</div>

    <div v-for="([date, evts], gi) in groups" :key="date" class="card day-card">
      <div class="day-head">
        <span class="badge" :class="'badge-' + urgencyClass(date)">{{ relDay(date) }}</span>
        <span class="day-date">{{ fmtDate(date) }} · {{ weekday(date) }}</span>
      </div>
      <a v-for="e in evts" :key="gi + '-' + e.notice.id + '-' + e.label" class="evt" :href="'#/notice/' + e.notice.id">
        <span class="evt-dot" :class="'dot-' + urgencyClass(date)"></span>
        <span class="evt-label">{{ e.label }}</span>
        <span class="evt-src">{{ categoryInfo(e.notice.category).icon }} {{ e.notice.title }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.tl-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--deep);
}

.tl-sub {
  color: var(--sub);
  font-size: 13px;
  margin-top: 2px;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 12px 0;
}

.stat {
  font-size: 13px;
  color: var(--sub);
}

.stat b {
  color: var(--deep);
  font-size: 18px;
}

.tl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.hint {
  color: #94a3b8;
  font-size: 12px;
}

.day-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.day-date {
  font-weight: 700;
  font-size: 15px;
}

.evt {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 8px;
}

.evt:hover {
  background: #f8fafc;
}

.evt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 9px;
  flex-shrink: 0;
}

.dot-ok {
  background: #2563eb;
}

.dot-warn {
  background: #f59e0b;
}

.dot-danger {
  background: #dc2626;
}

.dot-expired {
  background: #94a3b8;
}

.evt-label {
  flex: 1;
  font-size: 15px;
}

.evt-src {
  color: var(--sub);
  font-size: 12px;
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
