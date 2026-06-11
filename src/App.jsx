import { useState, useEffect, useRef, useCallback, createContext, useContext, Component } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  MessageSquare, LayoutDashboard, BookOpen, Menu, X, Moon, Sun,
  Shield, User, Headphones, GitBranch, Users, Settings, AlertCircle
} from 'lucide-react'
import ChatInterface from './components/chat/ChatInterface.jsx'
import Sidebar from './components/chat/Sidebar.jsx'
import DashboardView from './components/dashboard/DashboardView.jsx'
import KnowledgeBase from './components/knowledge/KnowledgeBase.jsx'
import WorkflowView from './components/workflow/WorkflowView.jsx'
import QiyuSessionPanel from './components/chat/QiyuSessionPanel.jsx'
import LLMConfigPanel from './components/settings/LLMConfigPanel.jsx'
import ServiceConfigPanel from './components/settings/ServiceConfigPanel.jsx'
import { Button } from '@/components/ui/button.jsx'
import { cn } from './lib/utils.js'
import { restoreLLMConfig } from './lib/llm-client.js'
import { initMCPClient } from './lib/mcp-client.js'

// Restore saved LLM config on app startup (before first render)
restoreLLMConfig()

// Initialize MCP client — auto-register mock handler
initMCPClient().then(status => {
  console.log('[App] MCP 初始化完成:', status)
}).catch(err => {
  console.warn('[App] MCP 初始化警告:', err.message)
})

/* ─── Error Boundary ─── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info?.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center p-6" style={{ background: 'var(--cursor-bg)' }} data-qoder-id="qel-flex-24e11d14" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-24e11d14&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;ErrorBoundary&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:36,&quot;column&quot;:9}}">
          <div className="max-w-md text-center space-y-3" data-qoder-id="qel-max-w-md-5adb2b12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-w-md-5adb2b12&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;ErrorBoundary&quot;,&quot;elementRole&quot;:&quot;max-w-md&quot;,&quot;loc&quot;:{&quot;line&quot;:37,&quot;column&quot;:11}}">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#e74c3c15' }} data-qoder-id="qel-mx-auto-4205e86a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mx-auto-4205e86a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;ErrorBoundary&quot;,&quot;elementRole&quot;:&quot;mx-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:38,&quot;column&quot;:13}}">
              <AlertCircle className="h-6 w-6" style={{ color: '#e74c3c' }}  data-qoder-id="qel-h-6-970c27ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-6-970c27ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;ErrorBoundary&quot;,&quot;elementRole&quot;:&quot;h-6&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:15}}"/>
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-9acfa0d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-9acfa0d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;ErrorBoundary&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:41,&quot;column&quot;:13}}">页面加载出错</h2>
            <p className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-9cd836f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-9cd836f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;ErrorBoundary&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:42,&quot;column&quot;:13}}">
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              className="px-4 py-2 rounded-md text-xs font-medium"
              style={{ background: 'var(--cursor-orange)', color: '#fff' }}
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = '#/' }}
             data-qoder-id="qel-px-4-ece821d3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-ece821d3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;ErrorBoundary&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:45,&quot;column&quot;:13}}">
              返回首页
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ─── Global Context ─── */
export const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

/* ─── Role Badge — Cursor pill style ─── */
function RoleBadge({ role, onToggle }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn(
        'rounded-full gap-2',
        role === 'consumer'
          ? 'bg-[var(--cursor-surface-500)] text-[var(--cursor-ink)]'
          : ''
      )}
      style={{ borderRadius: '9999px' }}
      title={role === 'consumer' ? '当前为消费者模式，点击切换' : '当前为客服模式，点击切换'}
     data-qoder-id="qel-button-c84854eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c84854eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;RoleBadge&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:25,&quot;column&quot;:5}}">
      {role === 'consumer' ? (
        <User className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-c64dd8cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-c64dd8cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;RoleBadge&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:9}}"/>
      ) : (
        <Headphones className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-023412bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-023412bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;RoleBadge&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:41,&quot;column&quot;:9}}"/>
      )}
      {role === 'consumer' ? '消费者' : '客服'}
    </Button>
  )
}

/* ─── Navigation — Cursor warm bar ─── */
function NavBar({ role, onToggleRole, sidebarOpen, onToggleSidebar, ...qoderProps }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const navItems = [
    { path: '/', label: '对话', icon: MessageSquare, match: (p) => p === '/' || p.startsWith('/chat') },
    ...(role === 'staff' ? [
      { path: '/qiyu', label: '七鱼', icon: Users, match: (p) => p === '/qiyu' },
      { path: '/dashboard', label: '运营看板', icon: LayoutDashboard, match: (p) => p === '/dashboard' },
      { path: '/workflow', label: '工作流', icon: GitBranch, match: (p) => p === '/workflow' },
      { path: '/knowledge', label: '知识库', icon: BookOpen, match: (p) => p === '/knowledge' },
      { path: '/settings', label: '模型设置', icon: Settings, match: (p) => p === '/settings' || p.startsWith('/settings/') },
    ] : []),
  ]

  return (
    <header
      className={["flex h-14 items-center justify-between border-b px-4", qoderProps?.className].filter(Boolean).join(" ")}
      style={{ ...({
        minHeight: 'var(--header-height)',
        background: 'var(--cursor-surface-400)',
        borderColor: 'var(--cursor-border-10)',
      }), ...(qoderProps?.style) }}
      data-component="navbar"
     data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="flex items-center gap-3" data-qoder-id="qel-flex-0fc99468" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-0fc99468&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:77,&quot;column&quot;:7}}">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden"
          style={{ borderRadius: 'var(--seed-radius)' }}
          aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
         data-qoder-id="qel-lg-hidden-07f72a23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-lg-hidden-07f72a23&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;lg-hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:78,&quot;column&quot;:9}}">
          {sidebarOpen ? <X className="h-5 w-5"  data-qoder-id="qel-h-5-260391d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-260391d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:86,&quot;column&quot;:26}}"/> : <Menu className="h-5 w-5"  data-qoder-id="qel-h-5-b3ba20e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-b3ba20e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:86,&quot;column&quot;:54}}"/>}
        </Button>
        <Link to="/" className="flex items-center gap-2.5" data-qoder-id="qel-flex-f8d6c06f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f8d6c06f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:9}}">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--cursor-orange)', borderRadius: 'var(--seed-radius)' }}
           data-qoder-id="qel-flex-aa5e3dcc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-aa5e3dcc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:11}}">
            <Shield className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }}  data-qoder-id="qel-h-4-5-c320c5cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-5-c320c5cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;h-4-5&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:13}}"/>
          </div>
          <div className="hidden sm:block" data-qoder-id="qel-hidden-e0cf9057" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-e0cf9057&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:11}}">
            <h1
              className="text-sm font-semibold leading-tight cursor-title"
              style={{ color: 'var(--cursor-ink)' }}
             data-qoder-id="qel-text-sm-4d30ec9c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-4d30ec9c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:13}}">
              阿喜食安助手
            </h1>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-7fe4b5d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7fe4b5d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:13}}">
              HEYTEA Food Safety
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-1" data-component="main-nav" data-qoder-id="qel-main-nav-3b6ba553" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-main-nav-3b6ba553&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;main-nav&quot;,&quot;loc&quot;:{&quot;line&quot;:109,&quot;column&quot;:7}}">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.match(location.pathname)
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-[var(--cursor-surface-500)] text-[var(--cursor-ink)] font-medium'
                  : 'text-[var(--cursor-border-55)] hover:text-[var(--cursor-ink)] hover:bg-[var(--cursor-surface-300)]'
              )}
              style={{ borderRadius: 'var(--seed-radius)' }}
             data-qoder-id="qel-link-87343aea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-87343aea&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:13}}">
              <Icon className="h-4 w-4"  data-qoder-id="qel-h-4-21f8ed85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-21f8ed85&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:15}}"/>
              <span className="hidden md:inline" data-qoder-id="qel-hidden-45b95204" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-45b95204&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:173,&quot;column&quot;:15}}">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2" data-qoder-id="qel-flex-b35e4bf7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b35e4bf7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:130,&quot;column&quot;:7}}">
        <RoleBadge role={role} onToggle={onToggleRole}  data-qoder-id="qel-rolebadge-7dcb9d5f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rolebadge-7dcb9d5f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;rolebadge&quot;,&quot;loc&quot;:{&quot;line&quot;:131,&quot;column&quot;:9}}"/>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? '切换浅色模式' : '切换深色模式'}
          style={{ borderRadius: 'var(--seed-radius)' }}
         data-qoder-id="qel-button-808b0cd8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-808b0cd8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:132,&quot;column&quot;:9}}">
          {darkMode ? <Sun className="h-4 w-4"  data-qoder-id="qel-h-4-4fb711cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-4fb711cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:139,&quot;column&quot;:23}}"/> : <Moon className="h-4 w-4"  data-qoder-id="qel-h-4-45e57290" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-45e57290&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;NavBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:139,&quot;column&quot;:53}}"/>}
        </Button>
      </div>
    </header>
  )
}

/* ─── Constants ─── */
const STAFF_ROUTES = ['/qiyu', '/dashboard', '/workflow', '/knowledge', '/settings']

/* ─── Layout ─── */
function AppLayout(qoderProps) {
  const [role, setRole] = useState(() => {
    try { return localStorage.getItem('app_role') || 'consumer' } catch { return 'consumer' }
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const isChatView = location.pathname === '/' || location.pathname.startsWith('/chat') || location.pathname === '/qiyu'

  // Persist role to localStorage
  useEffect(() => {
    try { localStorage.setItem('app_role', role) } catch { /* silent */ }
  }, [role])

  // Route guard: redirect consumer to home if on a staff-only route
  useEffect(() => {
    if (role === 'consumer') {
      const onStaffRoute = STAFF_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + '/'))
      if (onStaffRoute) {
        navigate('/', { replace: true })
      }
    }
  }, [role, location.pathname, navigate])

  const toggleRole = useCallback(() => {
    setRole((r) => {
      const next = r === 'consumer' ? 'staff' : 'consumer'
      return next
    })
    // After role change, check if we need to navigate away from staff routes
    const nextRole = role === 'consumer' ? 'staff' : 'consumer'
    if (nextRole === 'consumer') {
      const onStaffRoute = STAFF_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + '/'))
      if (onStaffRoute) {
        navigate('/', { replace: true })
      }
    }
  }, [role, location.pathname, navigate])

  return (
    <div className={["flex h-screen flex-col overflow-hidden", qoderProps?.className].filter(Boolean).join(" ")} data-component="app-layout" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <NavBar
        role={role}
        onToggleRole={toggleRole}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
       data-qoder-id="qel-navbar-0c1203d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-navbar-0c1203d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;navbar&quot;,&quot;loc&quot;:{&quot;line&quot;:160,&quot;column&quot;:7}}"/>
      <div className="flex flex-1 overflow-hidden" data-qoder-id="qel-flex-974e3d10" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-974e3d10&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:166,&quot;column&quot;:7}}">
        {isChatView && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            role={role}
           data-qoder-id="qel-sidebar-be5b67e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-be5b67e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;sidebar&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:11}}"/>
        )}
        <main className="flex-1 overflow-hidden h-full flex flex-col" data-qoder-id="qel-flex-1-6c4bba12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-6c4bba12&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:173,&quot;column&quot;:9}}">
          <Routes data-qoder-id="qel-routes-7d2407df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-routes-7d2407df&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;routes&quot;,&quot;loc&quot;:{&quot;line&quot;:174,&quot;column&quot;:11}}">
            <Route path="/" element={<ChatInterface role={role} />}  data-qoder-id="qel-route-ca626ca5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-ca626ca5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:175,&quot;column&quot;:13}}"/>
            <Route path="/chat/:id" element={<ChatInterface role={role} />}  data-qoder-id="qel-route-c9626b12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-c9626b12&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:176,&quot;column&quot;:13}}"/>
            {role === 'staff' && (
              <>
                <Route path="/qiyu" element={<QiyuSessionPanel />}  data-qoder-id="qel-route-d16277aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-d16277aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:17}}"/>
                <Route path="/dashboard" element={<DashboardView />}  data-qoder-id="qel-route-c862697f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-c862697f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:177,&quot;column&quot;:13}}"/>
                <Route path="/workflow" element={<WorkflowView />}  data-qoder-id="qel-route-c76267ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-c76267ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:13}}"/>
                <Route path="/knowledge" element={<KnowledgeBase />}  data-qoder-id="qel-route-c6626659" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-c6626659&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:13}}"/>
                <Route path="/settings" element={<LLMConfigPanel />}  data-qoder-id="qel-route-575afbd7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-575afbd7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:265,&quot;column&quot;:17}}"/>
                <Route path="/settings/services" element={<ServiceConfigPanel />}  data-qoder-id="qel-route-545af71e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-545af71e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:276,&quot;column&quot;:17}}"/>
              </>
            )}
            {/* Fallback: any unmatched or unauthorized route → ChatInterface */}
            <Route path="*" element={<ChatInterface role={role} />}  data-qoder-id="qel-route-545af71e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-545af71e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:269,&quot;column&quot;:13}}"/>
          </Routes>
        </main>
      </div>
    </div>
  )
}

/* ─── App Root ─── */
export default function App() {
  return (
    <ErrorBoundary data-qoder-id="qel-errorboundary-3609f703" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-errorboundary-3609f703&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;errorboundary&quot;,&quot;loc&quot;:{&quot;line&quot;:280,&quot;column&quot;:5}}">
      <AppContext.Provider value={{}} data-qoder-id="qel-appcontext-provider-49cc65c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-appcontext-provider-49cc65c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;appcontext-provider&quot;,&quot;loc&quot;:{&quot;line&quot;:190,&quot;column&quot;:5}}">
        <HashRouter data-qoder-id="qel-browserrouter-fb600161" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-browserrouter-fb600161&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;browserrouter&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:7}}">
          <AppLayout  data-qoder-id="qel-applayout-c18149b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-applayout-c18149b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;applayout&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:9}}"/>
        </HashRouter>
      </AppContext.Provider>
    </ErrorBoundary>
  )
}
