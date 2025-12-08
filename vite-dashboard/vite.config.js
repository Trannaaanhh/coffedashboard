import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Khi bạn gọi API /orders ở frontend, nó sẽ tự chuyển hướng sang localhost:3000/orders
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Nếu bạn không dùng prefix /api mà gọi thẳng /orders, /users thì cấu hình như này:
      '/orders': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/login': 'http://localhost:3000',
    }
  }
})