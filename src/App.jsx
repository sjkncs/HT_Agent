import { useState, useEffect, useCallback, lazy, Suspense, createContext, useContext, Component } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  MessageSquare, LayoutDashboard, BookOpen, Menu, X, Moon, Sun,
  Shield, User, Headphones, GitBranch, Users, Settings, AlertCircle,
  Target, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from './lib/utils.js'
import { restoreLLMConfig } from './lib/llm-client.js'
import { initMCPClient } from './lib/mcp-client.js'

// Restore saved LLM config on startup
restoreLLMConfig()

// Initialize MCP client
initMCPClient().then(status => {
  console.log('[App] MCP 初始化完成:', status)
}).catch(err => {
  console.warn('[App] MCP 初始化警告:', err.message)
})

// ─── Lazy-loaded route components ───
const ChatInterface = lazy(() => import('./components/chat/ChatInterface.jsx'))
const Sidebar = lazy(() => import('./components/chat/Sidebar.jsx'))
const DashboardView = lazy(() => import('./components/dashboard/DashboardView.jsx'))
const KnowledgeBase = lazy(() => import('./components/knowledge/KnowledgeBase.jsx'))
const WorkflowView = lazy(() => import('./components/workflow/WorkflowView.jsx'))
const QiyuSessionPanel = lazy(() => import('./components/chat/QiyuSessionPanel.jsx'))
const LLMConfigPanel = lazy(() => import('./components/settings/LLMConfigPanel.jsx'))
const ServiceConfigPanel = lazy(() => import('./components/settings/ServiceConfigPanel.jsx'))
const OptimizationSelector = lazy(() => import('./components/OptimizationSelector.jsx'))

// ─── Loading fallback ───
function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--cursor-orange)]" />
    </div>
  )
}

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
        <div className="flex h-screen items-center justify-center p-6" style={{ background: 'var(--cursor-bg)' }}>
          <div className="max-w-md text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#e74c3c15' }}>
              <AlertCircle className="h-6 w-6" style={{ color: '#e74c3c' }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>页面加载出错</h2>
            <p className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              className="px-4 py-2 rounded-md text-xs font-medium"
              style={{ background: 'var(--cursor-orange)', color: '#fff' }}
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = '#/' }}>
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
export function useApp() { return useContext(AppContext) }

/* ─── Role Badge ─── */
function RoleBadge({ role, onToggle }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn('rounded-full gap-2', role === 'consumer' ? 'bg-[var(--cursor-surface-500)] text-[var(--cursor-ink)]' : '')}
      style={{ borderRadius: '9999px' }}
      title={role === 'consumer' ? '当前为消费者模式，点击切换' : '当前为客服模式，点击切换'}>
      {role === 'consumer'
        ? <User className="h-3.5 w-3.5" />
        : <Headphones className="h-3.5 w-3.5" />}
      {role === 'consumer' ? '消费者' : '客服'}
    </Button>
  )
}

/* ─── Navigation Bar ─── */
function NavBar({ role, onToggleRole, sidebarOpen, onToggleSidebar }) {
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
      { path: '/optimize', label: '优化方向', icon: Target, match: (p) => p === '/optimize' },
      { path: '/settings', label: '模型设置', icon: Settings, match: (p) => p === '/settings' || p.startsWith('/settings/') },
    ] : []),
  ]

  return (
    <header className="flex h-14 items-center justify-between border-b px-4"
      style={{ minHeight: 'var(--header-height)', background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}
      data-component="navbar">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden"
          style={{ borderRadius: 'var(--seed-radius)' }}
          aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--cursor-orange)', borderRadius: 'var(--seed-radius)' }}>
            <Shield className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold leading-tight cursor-title" style={{ color: 'var(--cursor-ink)' }}>
              阿喜食安助手
            </h1>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--cursor-border-55)' }}>
              HEYTEA Food Safety
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-1" data-component="main-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.match(location.pathname)
          return (
            <Link key={item.path} to={item.path} title={item.label}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-[var(--cursor-surface-500)] text-[var(--cursor-ink)] font-medium'
                  : 'text-[var(--cursor-border-55)] hover:text-[var(--cursor-ink)] hover:bg-[var(--cursor-surface-300)]'
              )}
              style={{ borderRadius: 'var(--seed-radius)' }}>
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2">
        <RoleBadge role={role} onToggle={onToggleRole} />
        <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? '切换浅色模式' : '切换深色模式'}
          style={{ borderRadius: 'var(--seed-radius)' }}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}

/* ─── Constants ─── */
const STAFF_ROUTES = ['/qiyu', '/dashboard', '/workflow', '/knowledge', '/optimize', '/settings']

/* ─── Layout ─── */
function AppLayout() {
  const [role, setRole] = useState(() => {
    try { return localStorage.getItem('app_role') || 'consumer' } catch { return 'consumer' }
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const isChatView = location.pathname === '/' || location.pathname.startsWith('/chat') || location.pathname === '/qiyu'

  useEffect(() => {
    try { localStorage.setItem('app_role', role) } catch { /* silent */ }
  }, [role])

  useEffect(() => {
    if (role === 'consumer') {
      const onStaffRoute = STAFF_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + '/'))
      if (onStaffRoute) navigate('/', { replace: true })
    }
  }, [role, location.pathname, navigate])

  const toggleRole = useCallback(() => {
    setRole((r) => r === 'consumer' ? 'staff' : 'consumer')
    const nextRole = role === 'consumer' ? 'staff' : 'consumer'
    if (nextRole === 'consumer') {
      const onStaffRoute = STAFF_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + '/'))
      if (onStaffRoute) navigate('/', { replace: true })
    }
  }, [role, location.pathname, navigate])

  return (
    <div className="flex h-screen flex-col overflow-hidden" data-component="app-layout">
      <NavBar role={role} onToggleRole={toggleRole} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        {isChatView && (
          <Suspense fallback={null}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />
          </Suspense>
        )}
        <main className="flex-1 overflow-hidden h-full flex flex-col">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ChatInterface role={role} />} />
              <Route path="/chat/:id" element={<ChatInterface role={role} />} />
              {role === 'staff' && (
                <>
                  <Route path="/qiyu" element={<QiyuSessionPanel />} />
                  <Route path="/dashboard" element={<DashboardView />} />
                  <Route path="/workflow" element={<WorkflowView />} />
                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/optimize" element={<OptimizationSelector />} />
                  <Route path="/settings" element={<LLMConfigPanel />} />
                  <Route path="/settings/services" element={<ServiceConfigPanel />} />
                </>
              )}
              <Route path="*" element={<ChatInterface role={role} />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

/* ─── App Root ─── */
export default function App() {
  return (
    <ErrorBoundary>
      <AppContext.Provider value={{}}>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </AppContext.Provider>
    </ErrorBoundary>
  )
}
