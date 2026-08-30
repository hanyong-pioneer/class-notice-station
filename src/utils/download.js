// 浏览器端文件下载工具

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// bom=true 时加 UTF-8 BOM,Windows 上打开含中文的 .ics/.txt 不乱码
export function downloadText(name, content, mime = 'text/plain', bom = true) {
  downloadBlob(new Blob([(bom ? '﻿' : '') + content], { type: mime + ';charset=utf-8' }), name)
}
