<script setup>
import { computed, ref } from 'vue'
import { categoryInfo, fmtDate, relDay, urgencyClass, weekday } from '../utils/data.js'
import { getChecked, isFollowed, setChecked, toggleFollow } from '../utils/store.js'
import { buildICS, downloadICS } from '../utils/ics.js'
import { generateLongImage } from '../utils/longImage.js'
import { downloadBlob } from '../utils/download.js'

const props = defineProps({ notice: { type: Object, default: null } })

const cat = computed(() => (props.notice ? categoryInfo(props.notice.category) : null))
const followed = ref(props.notice ? isFollowed(props.notice.id) : false)
const checkedMats = ref(props.notice ? getChecked(props.notice.id) : [])
const busy = ref(false)

const sanitize = (s) => (s || 'notice').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 24)

function toggleMat(i) {
  const arr = [...checkedMats.value]
  const at = arr.indexOf(i)
  if (at >= 0) arr.splice(at, 1)
  else arr.push(i)
  checkedMats.value = arr
  setChecked(props.notice.id, arr)
}

const onFollow = () => {
  followed.value = toggleFollow(props.notice.id)
}

const subCalendar = () => {
  downloadICS(`通知-${sanitize(props.notice.title)}.ics`, buildICS([props.notice], props.notice.id))
}

async function saveImage() {
  if (busy.value) return
  busy.value = true
  try {
    const blob = await generateLongImage(props.notice, cat.value)
    downloadBlob(blob, sanitize(props.notice.title) + '.png')
  } catch {
    alert('长图生成失败,请重试')
  } finally {
    busy.value = false
  }
}

async function shareImage() {
  if (busy.value) return
  busy.value = true
  try {
    const blob = await generateLongImage(props.notice, cat.value)
    const file = new File([blob], sanitize(props.notice.title) + '.png', { type: 'image/png' })
    let shared = false
    if (typeof navigator.share === 'function') {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: props.notice.title })
          shared = true
        }
      } catch {
        /* 用户取消或分享失败,降级为下载 */
      }
    }
    if (!shared) downloadBlob(blob, sanitize(props.notice.title) + '.png')
  } catch {
    alert('长图生成失败,请重试')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="!notice" class="state">
    ⚠️ 未找到该通知
    <br />
    <a href="#/" class="btn" style="margin-top: 12px">返回首页</a>
  </div>

  <div v-else>
    <a href="#/" class="back">← 返回列表</a>

    <div class="card head">
      <div class="head-top">
        <span class="cat-chip" :style="{ background: cat.color + '1a', color: cat.color }">{{ cat.icon }} {{ cat.label }}</span>
        <span v-for="tg in (notice.tags || [])" :key="tg" class="tag"># {{ tg }}</span>
        <span class="meta">{{ notice.source }} · 发布于 {{ fmtDate(notice.publishedAt) }}</span>
      </div>
      <h2 class="title">{{ notice.title }}</h2>
      <p v-if="notice.summary" class="summary">{{ notice.summary }}</p>
      <div class="actions">
        <button class="btn" @click="onFollow">{{ followed ? '⭐ 已关注' : '☆ 关注' }}</button>
        <button class="btn" :disabled="busy" @click="saveImage">🖼 {{ busy ? '生成中…' : '保存长图' }}</button>
        <button class="btn" @click="shareImage">📤 分享长图</button>
        <button class="btn" @click="subCalendar">📅 订阅日历</button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">📅 时间轴</div>
      <div v-for="(t, i) in (notice.timeline || [])" :key="i" class="tl-row">
        <span class="badge" :class="'badge-' + urgencyClass(t.date)">{{ relDay(t.date) }}</span>
        <div class="tl-main">
          <div class="tl-date">{{ fmtDate(t.date) }} · {{ weekday(t.date) }}</div>
          <div class="tl-label" :class="{ done: urgencyClass(t.date) === 'expired' }">{{ t.label }}</div>
        </div>
      </div>
    </div>

    <div v-if="(notice.steps || []).length" class="card">
      <div class="section-title">📝 操作步骤</div>
      <ol class="steps">
        <li v-for="(s, i) in (notice.steps || [])" :key="i">{{ s }}</li>
      </ol>
    </div>

    <div v-if="(notice.materials || []).length" class="card">
      <div class="section-title">📂 材料清单</div>
      <label v-for="(m, i) in (notice.materials || [])" :key="i" class="mat">
        <input type="checkbox" :checked="checkedMats.includes(i)" @change="toggleMat(i)" />
        <span :class="{ checked: checkedMats.includes(i) }">{{ m }}</span>
      </label>
      <p class="hint">勾选状态仅保存在你的设备上</p>
    </div>

    <div class="card">
      <div class="section-title">📎 资料区</div>
      <a v-for="(a, i) in (notice.attachments || [])" :key="i" class="att" :href="a.url" target="_blank" rel="noopener">
        📄 {{ a.name }} ↗
      </a>
      <a class="att primary" :href="notice.originalUrl" target="_blank" rel="noopener">📜 查看 / 下载原始通知 ↗</a>
    </div>

    <div v-if="(notice.pitfalls || []).length" class="card warn">
      <div class="section-title warn-title">⚠️ 避坑提醒</div>
      <div v-for="(p, i) in (notice.pitfalls || [])" :key="i" class="pit">⚠️ {{ p }}</div>
    </div>
  </div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 12px;
  color: var(--sub);
  font-size: 14px;
}

.head-top {
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
  font-size: 13px;
}

.tag {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}

.title {
  font-size: 20px;
  margin: 10px 0 6px;
  line-height: 1.4;
}

.summary {
  color: var(--sub);
  font-size: 14px;
  background: var(--light);
  padding: 10px 12px;
  border-radius: 8px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tl-row {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line);
}

.tl-row:last-child {
  border-bottom: none;
}

.tl-main {
  flex: 1;
}

.tl-date {
  font-weight: 700;
  font-size: 15px;
}

.tl-label {
  font-size: 15px;
  margin-top: 2px;
}

.tl-label.done {
  color: #94a3b8;
}

.steps {
  padding-left: 22px;
}

.steps li {
  margin-bottom: 8px;
  font-size: 15px;
}

.mat {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 6px 0;
  cursor: pointer;
}

.mat input[type='checkbox'] {
  width: 18px;
  height: 18px;
  margin-top: 4px;
  accent-color: var(--deep);
  flex-shrink: 0;
}

.mat span {
  font-size: 15px;
}

.mat span.checked {
  color: #94a3b8;
  text-decoration: line-through;
}

.hint {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 8px;
}

.att {
  display: block;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 8px;
  color: var(--deep);
  font-weight: 600;
  font-size: 14px;
}

.att.primary {
  background: var(--light);
  border-color: #bfdbfe;
}

.warn {
  border-color: #fcd34d;
  background: #fffbeb;
}

.warn-title {
  color: #92400e;
}

.pit {
  color: #92400e;
  font-size: 15px;
  padding: 4px 0;
}
</style>
