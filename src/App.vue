<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import HomeView from './components/HomeView.vue'
import DetailView from './components/DetailView.vue'
import TimelineView from './components/TimelineView.vue'
import EditorView from './components/EditorView.vue'
import { loadNotices } from './utils/data.js'

const notices = ref([])
const loading = ref(true)
const loadError = ref(false)
const route = ref({ name: 'home' })
const q = ref('')
const cat = ref('all')
const onlyFollowed = ref(false)

// 极简 hash 路由:#/ 、#/notice/:id 、#/timeline 、#/editor[:id]
function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (!parts.length) route.value = { name: 'home' }
  else if (parts[0] === 'notice' && parts[1]) route.value = { name: 'detail', id: Number(parts[1]) }
  else if (parts[0] === 'timeline') route.value = { name: 'timeline' }
  else if (parts[0] === 'editor') route.value = { name: 'editor', id: parts[1] ? Number(parts[1]) : null }
  else route.value = { name: 'home' }
}

async function refresh() {
  loading.value = true
  loadError.value = false
  try {
    notices.value = await loadNotices()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  parseRoute()
  window.addEventListener('hashchange', parseRoute)
  refresh()
})
onBeforeUnmount(() => window.removeEventListener('hashchange', parseRoute))

const currentNotice = computed(() =>
  route.value.name === 'detail' ? notices.value.find((n) => n.id === route.value.id) : null
)

const navItems = [
  { name: 'home', path: '#/', label: '首页', icon: '🏠' },
  { name: 'timeline', path: '#/timeline', label: '时间线', icon: '📅' },
  { name: 'editor', path: '#/editor', label: '班委编辑', icon: '✏️' }
]
</script>

<template>
  <div class="app">
    <header class="topbar">
      <a href="#/" class="brand">📣 班级通知站</a>
      <nav class="nav-desktop">
        <a v-for="it in navItems" :key="it.name" :href="it.path" :class="{ active: route.name === it.name }">
          {{ it.label }}
        </a>
      </nav>
    </header>

    <main class="container">
      <div v-if="loading" class="state">加载中…</div>
      <div v-else-if="loadError" class="state">
        <p>⚠️ 通知数据加载失败</p>
        <br />
        <button class="btn" @click="refresh">重试</button>
      </div>
      <HomeView
        v-else-if="route.name === 'home'"
        :notices="notices"
        v-model:q="q"
        v-model:cat="cat"
        v-model:only-followed="onlyFollowed"
      />
      <TimelineView v-else-if="route.name === 'timeline'" :notices="notices" />
      <DetailView v-else-if="route.name === 'detail'" :notice="currentNotice" />
      <EditorView v-else-if="route.name === 'editor'" :notices="notices" :edit-id="route.id" />
    </main>

    <nav class="nav-mobile">
      <a v-for="it in navItems" :key="it.name" :href="it.path" :class="{ active: route.name === it.name }">
        <span class="nav-icon">{{ it.icon }}</span>
        <span>{{ it.label }}</span>
      </a>
    </nav>

    <footer class="foot">数据来自公开的 notices.json · 更新即全班同步</footer>
  </div>
</template>

<style scoped>
.topbar {
  background: var(--deep);
  color: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  font-weight: 800;
  font-size: 19px;
  letter-spacing: 0.5px;
}

.nav-desktop a {
  color: #dbeafe;
  margin-left: 20px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 15px;
}

.nav-desktop a.active {
  background: #3b82f6;
  color: #fff;
}

.nav-mobile {
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top: 1px solid var(--line);
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-mobile a {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 9px 0 7px;
  color: var(--sub);
  font-size: 12px;
}

.nav-mobile a.active {
  color: var(--deep);
  font-weight: 700;
}

.nav-icon {
  font-size: 22px;
}

.foot {
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
  padding: 24px 0 8px;
}

@media (max-width: 640px) {
  .nav-desktop {
    display: none;
  }
  .nav-mobile {
    display: flex;
  }
}
</style>
