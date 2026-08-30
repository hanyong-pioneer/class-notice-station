// 本机 localStorage 持久化:关注列表、材料勾选、编辑草稿(均只存在用户自己的设备上)

const read = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k))
    return v === null || v === undefined ? d : v
  } catch {
    return d
  }
}

const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* 存储满或隐私模式,静默失败 */
  }
}

export const isFollowed = (id) => read('followed', []).includes(id)

export function toggleFollow(id) {
  const s = read('followed', [])
  const i = s.indexOf(id)
  if (i >= 0) s.splice(i, 1)
  else s.push(id)
  write('followed', s)
  return i < 0
}

export const getChecked = (id) => read('checked-' + id, [])

export const setChecked = (id, arr) => write('checked-' + id, arr)

export const getDraft = () => read('draft', null)

export const setDraft = (d) => write('draft', d)
