import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/responsive.css' // 引入全局响应式样式
import App from './App.tsx'
import { logCollector } from './utils/logCollector'

// 初始化日志采集器
logCollector.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
