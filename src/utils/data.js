// 数据加载、分类、日期计算、搜索等公共逻辑

export const CATEGORIES = {
  competition: { label: '竞赛', icon: '🏆', color: '#2563eb' },
  practice: { label: '社会实践', icon: '🌱', color: '#059669' },
  award: { label: '评奖评优', icon: '🎖️', color: '#d97706' },
  course: { label: '课程学习', icon: '📖', color: '#7c3aed' },
  activity: { label: '活动', icon: '🎪', color: '#db2777' },
  other: { label: '其他', icon: '📌', color: '#64748b' }
}

export const categoryInfo = (k) => CATEGORIES[k] || CATEGORIES.other

// 解析 YYYY-MM-DD 为本地时区日期(避免 new Date(str) 的 UTC 偏移问题)
export function parseDate(s) {
  const p = String(s).split('-').map(Number)
  return new Date(p[0], (p[1] || 1) - 1, p[2] || 1)
}

export function todayStart() {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

// 距今天数:0=今天,负数=已过期
export function daysUntil(s) {
  return Math.round((parseDate(s) - todayStart()) / 864e5)
}

export function fmtDate(s) {
  const d = parseDate(s)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function weekday(s) {
  return '周' + '日一二三四五六'[parseDate(s).getDay()]
}

export function relDay(s) {
  const n = daysUntil(s)
  if (n < 0) return '已过期'
  if (n === 0) return '今天'
  if (n === 1) return '明天'
  return `剩${n}天`
}

export function urgencyClass(s) {
  const n = daysUntil(s)
  if (n < 0) return 'expired'
  if (n <= 3) return 'danger'
  if (n <= 7) return 'warn'
  return 'ok'
}

// 下一条未过期的截止节点
export function nextDeadline(n) {
  const up = (n.timeline || []).filter((t) => daysUntil(t.date) >= 0)
  return up.length ? up.slice().sort((a, b) => a.date.localeCompare(b.date))[0] : null
}

// 全文搜索:标题、摘要、来源、分类、原文、时间轴、步骤、材料、避坑、附件名
export function searchHit(n, q) {
  const s = (q || '').trim().toLowerCase()
  if (!s) return true
  const hay = [
    n.title,
    n.summary,
    n.source,
    categoryInfo(n.category).label,
    n.originalText,
    ...(n.timeline || []).map((t) => t.date + ' ' + t.label),
    ...(n.steps || []),
    ...(n.materials || []),
    ...(n.pitfalls || []),
    ...(n.attachments || []).map((a) => a.name),
    ...(n.tags || [])
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
  return hay.includes(s)
}

export async function loadNotices() {
  const res = await fetch('notices.json', { cache: 'no-cache' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  return (data.notices || []).map((n) => ({ ...n }))
}

// 展开所有通知的时间节点为扁平事件列表
export function allEvents(notices) {
  return notices.flatMap((n) => (n.timeline || []).map((t) => ({ date: t.date, label: t.label, notice: n })))
}
