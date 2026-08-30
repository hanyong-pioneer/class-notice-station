// 生成 .ics 日历文件:所有时间节点转为全天事件,含提前 1 天的提醒
import { downloadText } from './download.js'

const esc = (s) =>
  String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

export function buildICS(notices, onlyId = null) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClassNoticeStation//ZH//CN',
    'CALSCALE:GREGORIAN'
  ]
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  for (const n of notices) {
    if (onlyId != null && n.id !== onlyId) continue
    ;(n.timeline || []).forEach((t, i) => {
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:notice-${n.id}-${i}@classnotice`)
      lines.push(`DTSTAMP:${stamp}`)
      lines.push(`DTSTART;VALUE=DATE:${t.date.replace(/-/g, '')}`)
      lines.push(`SUMMARY:${esc('[' + n.title + '] ' + t.label)}`)
      lines.push(`DESCRIPTION:${esc('来源:' + (n.source || '') + ' | 班级通知站')}`)
      lines.push('BEGIN:VALARM')
      lines.push('ACTION:DISPLAY')
      lines.push('DESCRIPTION:截止提醒')
      lines.push('TRIGGER:-P1D')
      lines.push('END:VALARM')
      lines.push('END:VEVENT')
    })
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(name, content) {
  downloadText(name, content, 'text/calendar')
}
