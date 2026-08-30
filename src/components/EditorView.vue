<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { CATEGORIES } from '../utils/data.js'
import { getDraft, setDraft } from '../utils/store.js'
import { downloadText } from '../utils/download.js'

const props = defineProps({
  notices: { type: Array, default: () => [] },
  editId: { type: Number, default: null }
})

const todayStr = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const emptyForm = () => ({
  id: null,
  title: '',
  category: 'competition',
  source: '',
  publishedAt: todayStr(),
  originalUrl: '',
  summary: '',
  originalText: '',
  tags: '',
  timeline: [{ date: '', label: '' }],
  steps: [''],
  materials: [''],
  pitfalls: [''],
  attachments: []
})

const form = reactive(emptyForm())
const catKeys = Object.keys(CATEGORIES)
const selectedId = ref(null)
const errors = ref([])
const generated = ref('')
const resultVisible = ref(false)
const copied = ref(false)
const draftMsg = ref('')
const textareaRef = ref(null)

const addTimeline = () => form.timeline.push({ date: '', label: '' })
const removeTimeline = (i) => {
  if (form.timeline.length > 1) form.timeline.splice(i, 1)
}
const addItem = (list) => list.push('')
const removeItem = (list, i) => list.splice(i, 1)
const addAttach = () => form.attachments.push({ name: '', url: '' })
const removeAttach = (i) => form.attachments.splice(i, 1)

function fillFromNotice(n) {
  const src = JSON.parse(JSON.stringify(n))
  if (Array.isArray(src.tags)) src.tags = src.tags.join(', ')
  Object.assign(form, emptyForm(), src)
  if (!form.timeline.length) form.timeline.push({ date: '', label: '' })
  if (!form.steps.length) form.steps.push('')
  if (!form.materials.length) form.materials.push('')
  if (!form.pitfalls.length) form.pitfalls.push('')
}

function loadSelected() {
  const n = props.notices.find((x) => x.id === selectedId.value)
  if (n) fillFromNotice(n)
}

function resetForm() {
  Object.assign(form, emptyForm())
  selectedId.value = null
}

function saveDraft() {
  setDraft(JSON.parse(JSON.stringify(form)))
  draftMsg.value = '✓ 草稿已保存到本机浏览器'
}

function loadDraft() {
  const d = getDraft()
  if (!d) {
    draftMsg.value = '没有已保存的草稿'
    return
  }
  Object.assign(form, emptyForm(), d)
  draftMsg.value = '✓ 草稿已载入'
}

function validate() {
  errors.value = []
  if (!form.title.trim()) errors.value.push('标题不能为空')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.publishedAt)) errors.value.push('发布日期格式应为 YYYY-MM-DD')
  if (!form.originalUrl.trim()) errors.value.push('请填写原始通知链接(没有可填 #)')
  const validTl = form.timeline.filter((t) => t.date && t.label.trim())
  if (!validTl.length) errors.value.push('时间轴至少需要一条完整记录(日期 + 事项)')
  else {
    const bad = form.timeline.filter((t) => (t.date && !t.label.trim()) || (!t.date && t.label.trim()))
    if (bad.length) errors.value.push(`时间轴有 ${bad.length} 条不完整,生成时会自动忽略`)
  }
  return !errors.value.length
}

function buildNotice() {
  const maxId = props.notices.reduce((m, n) => Math.max(m, n.id), 0)
  return {
    id: form.id ?? maxId + 1,
    title: form.title.trim(),
    category: form.category,
    source: form.source.trim(),
    publishedAt: form.publishedAt,
    originalUrl: form.originalUrl.trim(),
    summary: form.summary.trim(),
    originalText: form.originalText.trim(),
    tags: (form.tags || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    timeline: form.timeline
      .filter((t) => t.date && t.label.trim())
      .map((t) => ({ date: t.date, label: t.label.trim() })),
    steps: form.steps.map((s) => s.trim()).filter(Boolean),
    materials: form.materials.map((s) => s.trim()).filter(Boolean),
    pitfalls: form.pitfalls.map((s) => s.trim()).filter(Boolean),
    attachments: form.attachments
      .filter((a) => a.name.trim() && a.url.trim())
      .map((a) => ({ name: a.name.trim(), url: a.url.trim() }))
  }
}

async function generate() {
  if (!validate()) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const n = buildNotice()
  const list = props.notices.some((x) => x.id === n.id)
    ? props.notices.map((x) => (x.id === n.id ? n : x))
    : [...props.notices, n]
  generated.value = JSON.stringify({ updatedAt: todayStr(), notices: list }, null, 2)
  resultVisible.value = true
  await nextTick()
  if (textareaRef.value) textareaRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function copy() {
  try {
    await navigator.clipboard.writeText(generated.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    const ta = textareaRef.value
    if (ta) {
      ta.focus()
      ta.select()
      document.execCommand('copy')
    }
  }
}

const download = () => downloadText('notices.json', generated.value, 'application/json', false)

// 通过 #/editor/3 进入时自动载入对应通知
watch(
  () => props.editId,
  (id) => {
    if (id == null) return
    const n = props.notices.find((x) => x.id === id)
    if (n) {
      selectedId.value = id
      fillFromNotice(n)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <div class="card">
      <div class="section-title">✏️ 班委编辑:录入 / 修改通知</div>
      <div class="row">
        <select v-model="selectedId" class="input" @change="loadSelected">
          <option :value="null" disabled>— 选择要编辑的已有通知 —</option>
          <option v-for="n in notices" :key="n.id" :value="n.id">{{ n.title }}</option>
        </select>
        <button class="btn" @click="resetForm">清空为新通知</button>
      </div>
      <div class="row draft-row">
        <button class="btn" @click="saveDraft">💾 保存草稿</button>
        <button class="btn" @click="loadDraft">📂 载入草稿</button>
        <span class="draft-msg">{{ draftMsg }}</span>
      </div>
    </div>

    <div class="card">
      <div class="section-title">基本信息</div>
      <div class="field">
        <label>通知标题 *</label>
        <input v-model="form.title" class="input" placeholder="如:关于组织参加2026年全国大学生数学建模竞赛的通知" />
      </div>
      <div class="grid2">
        <div class="field">
          <label>分类 *</label>
          <select v-model="form.category" class="input">
            <option v-for="k in catKeys" :key="k" :value="k">{{ CATEGORIES[k].icon }} {{ CATEGORIES[k].label }}</option>
          </select>
        </div>
        <div class="field">
          <label>发布单位</label>
          <input v-model="form.source" class="input" placeholder="如:教务处" />
        </div>
      </div>
      <div class="grid2">
        <div class="field">
          <label>发布日期 *</label>
          <input v-model="form.publishedAt" type="date" class="input" />
        </div>
        <div class="field">
          <label>原始通知链接 *</label>
          <input v-model="form.originalUrl" class="input" placeholder="https://…(没有可填 #)" />
        </div>
      </div>
      <div class="field">
        <label>一句话摘要(显示在列表卡片)</label>
        <textarea v-model="form.summary" class="textarea" rows="2" placeholder="如:9月5日报名截止,9月10日校内选拔…"></textarea>
      </div>
      <div class="field">
        <label>原文全文(用于全文搜索,选填)</label>
        <textarea v-model="form.originalText" class="textarea" rows="3" placeholder="粘贴官方通知原文…"></textarea>
      </div>
      <div class="field">
        <label>子标签(选填,逗号分隔,如:选课, 材料填写)</label>
        <input v-model="form.tags" class="input" placeholder="选课, 材料填写" />
      </div>
    </div>

    <div class="card">
      <div class="section-title">📅 时间轴(至少一条完整)</div>
      <div v-for="(t, i) in form.timeline" :key="i" class="li-edit">
        <input v-model="form.timeline[i].date" type="date" class="input date-input" />
        <input v-model="form.timeline[i].label" class="input" placeholder="事项,如:报名截止(17:00前交纸质版)" />
        <button class="del" @click="removeTimeline(i)" title="删除">✕</button>
      </div>
      <button class="btn add" @click="addTimeline">+ 添加时间节点</button>
    </div>

    <div class="card">
      <div class="section-title">📝 操作步骤</div>
      <div v-for="(s, i) in form.steps" :key="i" class="li-edit">
        <span class="no">{{ i + 1 }}</span>
        <textarea v-model="form.steps[i]" rows="2" class="textarea" :placeholder="'第 ' + (i + 1) + ' 步该做什么…'"></textarea>
        <button class="del" @click="removeItem(form.steps, i)" title="删除">✕</button>
      </div>
      <button class="btn add" @click="addItem(form.steps)">+ 添加步骤</button>
    </div>

    <div class="card">
      <div class="section-title">📂 材料清单</div>
      <div v-for="(m, i) in form.materials" :key="i" class="li-edit">
        <span class="no">📄</span>
        <input v-model="form.materials[i]" class="input" placeholder="需要提交的材料,如:报名信息表(需签名)" />
        <button class="del" @click="removeItem(form.materials, i)" title="删除">✕</button>
      </div>
      <button class="btn add" @click="addItem(form.materials)">+ 添加材料</button>
    </div>

    <div class="card">
      <div class="section-title">📎 资料区(附件模板,选填)</div>
      <div v-for="(a, i) in form.attachments" :key="i" class="li-edit">
        <input v-model="form.attachments[i].name" class="input" placeholder="附件名称" />
        <input v-model="form.attachments[i].url" class="input" placeholder="附件链接" />
        <button class="del" @click="removeAttach(i)" title="删除">✕</button>
      </div>
      <button class="btn add" @click="addAttach">+ 添加附件</button>
    </div>

    <div class="card">
      <div class="section-title">⚠️ 避坑提醒</div>
      <div v-for="(p, i) in form.pitfalls" :key="i" class="li-edit">
        <span class="no">⚠️</span>
        <input v-model="form.pitfalls[i]" class="input" placeholder="常见错误、容易被忽略的细节…" />
        <button class="del" @click="removeItem(form.pitfalls, i)" title="删除">✕</button>
      </div>
      <button class="btn add" @click="addItem(form.pitfalls)">+ 添加提醒</button>
    </div>

    <div v-if="errors.length" class="card err-box">
      <div class="err-title">✗ 请修正以下问题:</div>
      <div v-for="(e, i) in errors" :key="i" class="err-item">· {{ e }}</div>
    </div>

    <div class="gen-area">
      <button class="btn btn-primary" @click="generate">✅ 校验并生成 JSON</button>
    </div>

    <div v-if="resultVisible" class="card">
      <div class="section-title">📄 生成结果</div>
      <textarea ref="textareaRef" :value="generated" class="textarea result" readonly></textarea>
      <div class="gen-btns">
        <button class="btn" @click="copy">{{ copied ? '✓ 已复制' : '📋 复制 JSON' }}</button>
        <button class="btn" @click="download">⬇ 下载 notices.json</button>
      </div>
      <div class="usage">
        <b>如何发布:</b>
        <div>1. 推荐:把生成内容(或原始通知)发给 Claude Code,由 AI 校验并代提交</div>
        <div>2. 手动:下载后替换仓库中的 public/notices.json,git 提交推送</div>
        <div>3. 也可以直接复制到 GitHub 网页版编辑 public/notices.json</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.draft-row {
  margin-top: 10px;
}

.draft-msg {
  color: #16a34a;
  font-size: 13px;
}

.field {
  margin-bottom: 12px;
}

.field label {
  display: block;
  font-size: 13px;
  color: var(--sub);
  margin-bottom: 6px;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 480px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
}

.li-edit {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: flex-start;
}

.date-input {
  flex-shrink: 0;
  width: 160px;
}

.no {
  width: 28px;
  font-weight: 700;
  color: var(--deep);
  padding-top: 10px;
  flex-shrink: 0;
}

.del {
  color: #dc2626;
  font-size: 16px;
  padding: 8px 10px;
  flex-shrink: 0;
}

.add {
  margin-top: 4px;
}

.err-box {
  border-color: #fca5a5;
  background: #fef2f2;
}

.err-title {
  color: #b91c1c;
  font-weight: 700;
  margin-bottom: 6px;
}

.err-item {
  color: #b91c1c;
  font-size: 14px;
}

.gen-area {
  text-align: center;
  margin: 18px 0;
}

.result {
  height: 280px;
  font-family: Consolas, Menlo, monospace;
  font-size: 12px;
  white-space: pre;
}

.gen-btns {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.usage {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--sub);
  font-size: 13px;
}
</style>
