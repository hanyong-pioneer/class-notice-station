<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { categoryInfo, fmtDate, relDay, urgencyClass, weekday } from '../utils/data.js'
import { getChecked, isFollowed, setChecked, toggleFollow } from '../utils/store.js'
import { buildICS, downloadICS } from '../utils/ics.js'
import { generateLongImage } from '../utils/longImage.js'
import { downloadBlob } from '../utils/download.js'
import { downloadCSV, downloadXLSX } from '../utils/exportSchedule.js'

const props = defineProps({ notice: { type: Object, default: null } })

const cat = computed(() => (props.notice ? categoryInfo(props.notice.category) : null))
const followed = computed(() => (props.notice ? isFollowed(props.notice.id) : false))
const checkedMats = ref(props.notice ? getChecked(props.notice.id) : [])
const busy = ref(false)
const sharePreview = ref(null) // { url, blob }:页内预览长图,微信内靠长按保存/转发

const inWeChat = /MicroMessenger/i.test(navigator.userAgent)

const sanitize = (s) => (s || 'notice').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 24)
const imgName = computed(() => sanitize(props.notice.title) + '.png')

// 原始通知链接:占位符 "#" 视为未收录
const hasOriginal = computed(() => !!(props.notice && props.notice.originalUrl && props.notice.originalUrl !== '#'))

function toggleMat(i) {
  const arr = [...checkedMats.value]
  const at = arr.indexOf(i)
  if (at >= 0) arr.splice(at, 1)
  else arr.push(i)
  checkedMats.value = arr
  setChecked(props.notice.id, arr)
}

const onFollow = () => toggleFollow(props.notice.id)

const subCalendar = () => {
  downloadICS(`通知-${sanitize(props.notice.title)}.ics`, buildICS([props.notice], props.notice.id))
}

const exportCsv = () => downloadCSV([props.notice], `通知-${sanitize(props.notice.title)}.csv`)

async function exportXlsx() {
  try {
    await downloadXLSX([props.notice], `通知-${sanitize(props.notice.title)}.xlsx`)
  } catch {
    alert('Excel 生成失败,请重试')
  }
}

// 点击选项后收起下拉菜单
const closeMenu = (e) => e.currentTarget.closest('details').removeAttribute('open')

function openSharePreview(blob) {
  closeSharePreview()
  sharePreview.value = { url: URL.createObjectURL(blob), blob }
}

function closeSharePreview() {
  if (sharePreview.value) URL.revokeObjectURL(sharePreview.value.url)
  sharePreview.value = null
}

onBeforeUnmount(closeSharePreview)

// 直接跳转 #/notice/A → #/notice/B 时组件不重建,同步材料勾选到新通知
watch(
  () => props.notice,
  (n) => {
    checkedMats.value = n ? getChecked(n.id) : []
  }
)

async function saveImage() {
  if (busy.value) return
  busy.value = true
  try {
    const blob = await generateLongImage(props.notice, cat.value)
    // 微信内会拦截文件下载,统一走页内预览让用户长按保存
    if (inWeChat) openSharePreview(blob)
    else downloadBlob(blob, imgName.value)
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
    const file = new File([blob], imgName.value, { type: 'image/png' })
    // 微信内核不支持 Web Share 且拦截下载,直接走页内预览;其他浏览器优先系统分享
    if (!inWeChat && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
      let canShare = false
      try {
        canShare = navigator.canShare({ files: [file] })
      } catch {
        canShare = false
      }
      if (canShare) {
        try {
          await navigator.share({ files: [file], title: props.notice.title })
          return
        } catch (err) {
          if (err && err.name === 'AbortError') return // 用户主动取消,不打扰
        }
      }
    }
    openSharePreview(blob)
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
        <details class="export-menu">
          <summary class="btn">📅 导出日程 ▾</summary>
          <div class="export-options">
            <button class="opt" @click="subCalendar(); closeMenu($event)">📅 日历(.ics)</button>
            <button class="opt" @click="exportXlsx(); closeMenu($event)">📊 Excel(.xlsx)</button>
            <button class="opt" @click="exportCsv(); closeMenu($event)">📄 表格(.csv)</button>
          </div>
        </details>
      </div>
    </div>

    <div class="card">
      <div class="section-title">📅 时间轴</div>
      <div v-for="(t, i) in (notice.timeline || [])" :key="i" class="tl-row" :class="'tl-' + urgencyClass(t.date)">
        <div class="tl-main">
          <div class="tl-date">{{ fmtDate(t.date) }} · {{ weekday(t.date) }}</div>
          <div class="tl-label" :class="{ done: urgencyClass(t.date) === 'expired' }">{{ t.label }}</div>
        </div>
        <span class="badge" :class="'badge-' + urgencyClass(t.date)">{{ relDay(t.date) }}</span>
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

    <div v-if="(notice.attachments || []).length || hasOriginal" class="card">
      <div class="section-title">📎 资料区</div>
      <a v-for="(a, i) in (notice.attachments || [])" :key="i" class="att" :href="a.url" target="_blank" rel="noopener">
        📄 {{ a.name }} ↗
      </a>
      <a v-if="hasOriginal" class="att primary" :href="notice.originalUrl" target="_blank" rel="noopener">📜 查看 / 下载原始通知 ↗</a>
      <span v-else class="att no-original">📜 原始通知未收录(班内转发通知,暂无官网原文链接)</span>
    </div>

    <div v-if="(notice.pitfalls || []).length" class="card warn">
      <div class="section-title warn-title">⚠️ 避坑提醒</div>
      <div v-for="(p, i) in (notice.pitfalls || [])" :key="i" class="pit">⚠️ {{ p }}</div>
    </div>

    <!-- 长图页内预览:微信内无法直接下载/系统分享,靠长按图片保存到相册或发送给朋友 -->
    <div v-if="sharePreview" class="share-mask" @click.self="closeSharePreview">
      <div class="share-box">
        <div class="share-tip">
          {{ inWeChat ? '微信内无法直接下载,请长按下方图片 → 发送给朋友 或 保存到手机相册' : '请长按图片保存,或点击下方按钮下载' }}
        </div>
        <img class="share-img" :src="sharePreview.url" alt="通知长图" />
        <div class="share-btns">
          <button class="btn btn-primary" @click="downloadBlob(sharePreview.blob, imgName)">⬇ 下载图片</button>
          <button class="btn" @click="closeSharePreview">关闭</button>
        </div>
      </div>
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
  font-size: 22px;
  margin: 10px 0 6px;
  line-height: 1.35;
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
  align-items: center;
}

.export-menu {
  position: relative;
  display: inline-block;
}

.export-menu summary {
  list-style: none;
  cursor: pointer;
}

.export-menu summary::-webkit-details-marker {
  display: none;
}

.export-options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  z-index: 5;
  min-width: 168px;
  padding: 4px;
}

.opt {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 14px;
  color: var(--text);
}

.opt:hover {
  background: var(--light);
}

.tl-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 0 14px 26px;
  position: relative;
  border-bottom: 1px dashed var(--line);
}

.tl-row:last-child {
  border-bottom: none;
}

/* 时间轴竖线 + 圆点,颜色随紧迫度变化 */
.tl-row::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 16px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2563eb;
}

.tl-row::after {
  content: '';
  position: absolute;
  left: 10px;
  top: 28px;
  bottom: -6px;
  width: 2px;
  background: #e2e8f0;
}

.tl-row:last-child::after {
  display: none;
}

.tl-ok::before {
  background: #2563eb;
}

.tl-warn::before {
  background: #f59e0b;
}

.tl-danger::before {
  background: #dc2626;
}

.tl-expired::before {
  background: #94a3b8;
}

.tl-main {
  flex: 1;
}

.badge {
  flex-shrink: 0;
  margin-top: 2px;
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

.att.no-original {
  color: var(--sub);
  font-weight: 400;
  background: #f8fafc;
  border-style: dashed;
  cursor: default;
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

.share-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.share-box {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  max-width: 480px;
  width: 100%;
  max-height: 88vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-tip {
  font-size: 13px;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 8px 10px;
  line-height: 1.5;
  flex-shrink: 0;
}

.share-img {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--line);
  display: block;
}

.share-btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.share-btns .btn {
  flex: 1;
}
</style>
