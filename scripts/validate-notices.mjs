// 零依赖校验脚本:检查 public/notices.json 的结构与字段,提交前/CI 中都会执行
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'public', 'notices.json')

let data
try {
  data = JSON.parse(readFileSync(file, 'utf8'))
} catch (e) {
  console.error('✗ notices.json 读取或解析失败:', e.message)
  process.exit(1)
}

const errors = []
const CATS = new Set(['competition', 'practice', 'award', 'course', 'activity', 'other'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

if (typeof data.updatedAt !== 'string') errors.push('缺少 updatedAt 字段')
if (!Array.isArray(data.notices) || data.notices.length === 0) {
  errors.push('notices 必须是非空数组')
} else {
  const seen = new Set()
  data.notices.forEach((n, i) => {
    const tag = `notices[${i}]`
    if (!Number.isInteger(n.id)) errors.push(`${tag}.id 必须是整数`)
    else if (seen.has(n.id)) errors.push(`${tag}.id=${n.id} 重复`)
    else seen.add(n.id)

    if (typeof n.title !== 'string' || !n.title.trim()) errors.push(`${tag}.title 不能为空`)
    if (!CATS.has(n.category)) errors.push(`${tag}.category 必须是 ${[...CATS].join('/')} 之一`)
    if (typeof n.publishedAt !== 'string' || !DATE_RE.test(n.publishedAt)) errors.push(`${tag}.publishedAt 格式应为 YYYY-MM-DD`)
    if (typeof n.originalUrl !== 'string' || !n.originalUrl.trim()) errors.push(`${tag}.originalUrl 不能为空(没有可填 #)`)

    if (!Array.isArray(n.timeline) || n.timeline.length === 0) errors.push(`${tag}.timeline 不能为空数组`)
    else {
      n.timeline.forEach((t, j) => {
        if (typeof t.date !== 'string' || !DATE_RE.test(t.date)) errors.push(`${tag}.timeline[${j}].date 格式应为 YYYY-MM-DD`)
        if (typeof t.label !== 'string' || !t.label.trim()) errors.push(`${tag}.timeline[${j}].label 不能为空`)
      })
    }

    for (const key of ['steps', 'materials', 'pitfalls']) {
      if (!Array.isArray(n[key])) errors.push(`${tag}.${key} 必须是数组`)
    }

    if (n.attachments !== undefined) {
      if (!Array.isArray(n.attachments)) errors.push(`${tag}.attachments 必须是数组`)
      else {
        n.attachments.forEach((a, j) => {
          if (typeof a?.name !== 'string' || !a.name.trim() || typeof a?.url !== 'string' || !a.url.trim()) {
            errors.push(`${tag}.attachments[${j}] 需要 name 和 url`)
          }
        })
      }
    }

    if (n.tags !== undefined) {
      if (!Array.isArray(n.tags)) errors.push(`${tag}.tags 必须是数组`)
      else {
        n.tags.forEach((tg, j) => {
          if (typeof tg !== 'string' || !tg.trim()) errors.push(`${tag}.tags[${j}] 不能为空字符串`)
        })
      }
    }
  })
}

if (errors.length) {
  console.error('✗ notices.json 校验失败:\n- ' + errors.join('\n- '))
  process.exit(1)
}
console.log('✓ notices.json 校验通过,共 ' + data.notices.length + ' 条通知')
