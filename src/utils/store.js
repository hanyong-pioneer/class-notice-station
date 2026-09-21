// 本机 localStorage 持久化:关注列表、材料勾选、编辑草稿(均只存在用户自己的设备上)
import { reactive } from 'vue'

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

// 关注列表:每个用户自己的浏览器里各存一份,互不影响;关闭网站再打开依然保留。
// 用响应式数组承载,任何组件读写都能即时联动(如“只看关注”下取消关注立即消失)
const followedList = reactive(read('followed', []))

export const isFollowed = (id) => followedList.includes(id)

export function toggleFollow(id) {
  const i = followedList.indexOf(id)
  if (i >= 0) followedList.splice(i, 1)
  else followedList.push(id)
  write('followed', [...followedList])
  return i < 0
}

export const getChecked = (id) => read('checked-' + id, [])

export const setChecked = (id, arr) => write('checked-' + id, arr)

export const getDraft = () => read('draft', null)

export const setDraft = (d) => write('draft', d)
