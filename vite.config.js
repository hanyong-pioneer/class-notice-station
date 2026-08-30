import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' 相对路径,保证部署到 GitHub Pages 的 /仓库名/ 子路径下也能正常加载
export default defineConfig({
  base: './',
  plugins: [vue()]
})
