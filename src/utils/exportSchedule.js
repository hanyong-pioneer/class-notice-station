// 日程导出:CSV / Excel(.xlsx)。
// Excel 库(xlsx)按需动态加载,只有点"导出 Excel"时才下载对应代码块,不影响首屏体积
import { categoryInfo, daysUntil, weekday } from './data.js'
import { downloadText } from './download.js'

const HEADERS = ['日期', '星期', '剩余天数', '事项', '通知标题', '分类', '发布单位']

export function buildRows(notices) {
  return notices
    .flatMap((n) =>
      (n.timeline || []).map((t) => ({
        日期: t.date,
        星期: weekday(t.date),
        剩余天数: daysUntil(t.date) < 0 ? '已过期' : daysUntil(t.date) + ' 天',
        事项: t.label,
        通知标题: n.title,
        分类: categoryInfo(n.category).label,
        发布单位: n.source || ''
      }))
    )
    .sort((a, b) => a.日期.localeCompare(b.日期))
}

const escCsv = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function downloadCSV(notices, name) {
  const rows = buildRows(notices)
  const lines = [HEADERS.join(',')]
  for (const r of rows) lines.push(HEADERS.map((h) => escCsv(r[h])).join(','))
  downloadText(name, lines.join('\r\n'), 'text/csv')
}

export async function downloadXLSX(notices, name) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(buildRows(notices))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '日程')
  XLSX.writeFile(wb, name)
}
