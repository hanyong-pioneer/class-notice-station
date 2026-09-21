// 通知详情长图生成:纯 Canvas 手绘,零依赖
// 思路:第一遍只测量文字换行与各区块高度(不落笔),算出总高;第二遍在最终尺寸的画布上绘制。
// 不用超高的临时画布 —— iOS Safari / 微信内核对画布总面积有限制(约 1677 万像素),超限画布会得到空白图
import { daysUntil, fmtDate, relDay } from './data.js'

const W = 750
const P = 48
const CW = W - P * 2
const DEEP = '#1e3a8a'
const LIGHT = '#dbeafe'
const TEXT = '#1f2937'
const SUB = '#475569'
const WARN_BG = '#fde68a'
const WARN_FG = '#92400e'
const BLUE = '#2563eb'

const F = {
  title: 'bold 40px sans-serif',
  meta: '26px sans-serif',
  chip: '26px sans-serif',
  body: '28px sans-serif',
  small: '24px sans-serif',
  section: 'bold 30px sans-serif'
}
const LH = { title: 56, meta: 40, body: 44, small: 38 }

function wrap(ctx, font, text, maxW) {
  ctx.font = font
  const out = []
  let line = ''
  for (const ch of String(text)) {
    if (ch === '\n') {
      out.push(line)
      line = ''
      continue
    }
    const test = line + ch
    if (line && ctx.measureText(test).width > maxW) {
      out.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line || !out.length) out.push(line)
  return out
}

function urgencyColor(dateStr) {
  const d = daysUntil(dateStr)
  if (d < 0) return '#94a3b8'
  if (d <= 3) return '#dc2626'
  if (d <= 7) return '#d97706'
  return BLUE
}

// 走一遍完整布局:计算各区块高度,并在 paint=true 时落笔。两遍共用同一份逻辑,保证高度一致
function layout(notice, catInfo, ctx, paint) {
  ctx.textBaseline = 'top'
  const text = (str, x, y, font, color) => {
    if (paint) {
      ctx.font = font
      ctx.fillStyle = color
      ctx.fillText(str, x, y)
    }
  }
  const rect = (x, y, w, h, color) => {
    if (paint) {
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)
    }
  }
  const sectionTitle = (y, t, bg = LIGHT, fg = DEEP) => {
    rect(0, y, W, 72, bg)
    text(t, P, y + 18, F.section, fg)
    return y + 72
  }

  let y = 0

  // 头图(深蓝)
  const titleLines = wrap(ctx, F.title, notice.title, CW)
  const summaryLines = notice.summary ? wrap(ctx, F.meta, notice.summary, CW) : []
  const headerH = P + titleLines.length * LH.title + 40 + 46 + 20 + summaryLines.length * LH.meta + P
  rect(0, 0, W, headerH, DEEP)
  let ty = P
  for (const l of titleLines) {
    text(l, P, ty, F.title, '#ffffff')
    ty += LH.title
  }
  ty += 40
  const chipText = `${catInfo.icon} ${catInfo.label}`
  ctx.font = F.chip
  const chipW = ctx.measureText(chipText).width + 36
  rect(P, ty, chipW, 46, LIGHT)
  text(chipText, P + 18, ty + 8, F.chip, DEEP)
  ty += 46 + 20
  text(`${notice.source || ''} · 发布于 ${fmtDate(notice.publishedAt)}`, P, ty, F.meta, '#bfdbfe')
  ty += LH.meta
  for (const l of summaryLines) {
    text(l, P, ty, F.meta, '#ffffff')
    ty += LH.meta
  }
  y = headerH

  // 时间轴
  if ((notice.timeline || []).length) {
    y += 26
    y = sectionTitle(y, '📅 时间轴')
    y += 16
    for (const t of notice.timeline) {
      text(`● ${fmtDate(t.date)}(${relDay(t.date)})`, P, y, F.body, urgencyColor(t.date))
      y += 48
      for (const l of wrap(ctx, F.body, t.label, CW)) {
        text(l, P + 4, y, F.body, TEXT)
        y += LH.body
      }
      y += 34
    }
  }

  // 操作步骤
  if ((notice.steps || []).length) {
    y = sectionTitle(y, '📝 操作步骤')
    y += 16
    notice.steps.forEach((s, i) => {
      const lines = wrap(ctx, F.body, s, CW - 80)
      text(`${i + 1}.`, P, y, F.body, BLUE)
      for (const l of lines) {
        text(l, P + 72, y, F.body, TEXT)
        y += LH.body
      }
      y += 16
    })
  }

  // 材料清单
  if ((notice.materials || []).length) {
    y = sectionTitle(y, '📂 材料清单')
    y += 16
    for (const m of notice.materials) {
      const lines = wrap(ctx, F.body, m, CW - 80)
      text('☐', P, y, F.body, BLUE)
      for (const l of lines) {
        text(l, P + 72, y, F.body, TEXT)
        y += LH.body
      }
      y += 16
    }
  }

  // 资料区
  if ((notice.attachments || []).length) {
    y = sectionTitle(y, '📎 资料区')
    y += 16
    for (const a of notice.attachments) {
      const lines = wrap(ctx, F.small, a.name, CW - 60)
      text('📎', P, y, F.small, BLUE)
      for (const l of lines) {
        text(l, P + 60, y, F.small, SUB)
        y += LH.small
      }
      y += 12
    }
  }

  // 避坑提醒
  if ((notice.pitfalls || []).length) {
    y = sectionTitle(y, '⚠️ 避坑提醒', WARN_BG, WARN_FG)
    y += 16
    for (const p of notice.pitfalls) {
      const lines = wrap(ctx, F.body, p, CW - 80)
      text('⚠️', P, y, F.body, WARN_FG)
      for (const l of lines) {
        text(l, P + 72, y, F.body, WARN_FG)
        y += LH.body
      }
      y += 16
    }
  }

  // 页脚
  y += 12
  rect(0, y, W, 96, DEEP)
  text('班级通知站 · 让每一条通知都看得懂', P, y + 34, F.meta, '#dbeafe')
  y += 96

  return y
}

export function generateLongImage(notice, catInfo) {
  return new Promise((resolve, reject) => {
    try {
      // 第一遍:仅测量,得出总高度
      const measureCtx = document.createElement('canvas').getContext('2d')
      const H = layout(notice, catInfo, measureCtx, false)
      // 第二遍:在恰好容纳内容的画布上绘制(高度可控,不会触发画布面积上限)
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = Math.max(H, 100)
      const ctx = canvas.getContext('2d')
      layout(notice, catInfo, ctx, true)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas toBlob failed'))), 'image/png')
    } catch (err) {
      reject(err)
    }
  })
}
