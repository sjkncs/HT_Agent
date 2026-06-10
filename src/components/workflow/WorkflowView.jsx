import { useState } from 'react'
import { MessageCircle, Puzzle, GitBranch, Database, Layers, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import WorkflowEditor from './WorkflowEditor.jsx'
import ScriptEditor from './ScriptEditor.jsx'
import PluginManager from './PluginManager.jsx'
import FieldRegistry from './FieldRegistry.jsx'
import IntentTaxonomyPanel from './IntentTaxonomyPanel.jsx'
import IntentTestBench from './IntentTestBench.jsx'

const TABS = [
  { id: 'workflow', label: '工作流编排', icon: GitBranch, description: '可视化流程设计' },
  { id: 'fields', label: '字段字典', icon: Database, description: 'Coze 字段注册表' },
  { id: 'intents', label: '意图分类', icon: Layers, description: '统一意图分类体系' },
  { id: 'testbench', label: '意图测试', icon: Zap, description: '实时意图路由测试' },
  { id: 'script', label: '话术编辑', icon: MessageCircle, description: '模板与变量管理' },
  { id: 'plugins', label: '插件管理', icon: Puzzle, description: 'Coze 插件监控' },
]

export default function WorkflowView(qoderProps) {
  const [activeTab, setActiveTab] = useState('workflow')

  return (
    <div className={["flex h-full flex-col", qoderProps?.className].filter(Boolean).join(" ")} data-component="workflow-view" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 border-b px-4 py-1.5"
        style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}
        data-component="workflow-tabs"
       data-qoder-id="qel-workflow-tabs-04d2f34c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-tabs-04d2f34c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;workflow-tabs&quot;,&quot;loc&quot;:{&quot;line&quot;:21,&quot;column&quot;:7}}">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={cn(
                'gap-2',
                isActive
                  ? 'bg-[var(--cursor-surface-500)] text-[var(--cursor-ink)] font-medium'
                  : ''
              )}
              style={{ borderRadius: 'var(--seed-radius)' }}
             data-qoder-id="qel-button-53a0c7d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-53a0c7d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:52,&quot;column&quot;:13}}">
              <Icon className="h-4 w-4"  data-qoder-id="qel-h-4-f76e023f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-f76e023f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:65,&quot;column&quot;:15}}"/>
              <span className="hidden md:inline" data-qoder-id="qel-hidden-c5111da8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-c5111da8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:66,&quot;column&quot;:15}}">{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden" data-qoder-id="qel-flex-1-e243df1d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-e243df1d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:7}}">
        {activeTab === 'workflow' && <WorkflowEditor  data-qoder-id="qel-workfloweditor-bf9129f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workfloweditor-bf9129f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;workfloweditor&quot;,&quot;loc&quot;:{&quot;line&quot;:74,&quot;column&quot;:38}}"/>}
        {activeTab === 'fields' && <FieldRegistry  data-qoder-id="qel-fieldregistry-c028a241" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-fieldregistry-c028a241&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;fieldregistry&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:36}}"/>}
        {activeTab === 'intents' && <IntentTaxonomyPanel  data-qoder-id="qel-intenttaxonomypanel-c3f0424e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-intenttaxonomypanel-c3f0424e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;intenttaxonomypanel&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:37}}"/>}
        {activeTab === 'testbench' && <IntentTestBench  data-qoder-id="qel-intenttestbench-c19de3de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-intenttestbench-c19de3de&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;intenttestbench&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:39}}"/>}
        {activeTab === 'script' && <ScriptEditor  data-qoder-id="qel-scripteditor-c76acf1d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-scripteditor-c76acf1d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;scripteditor&quot;,&quot;loc&quot;:{&quot;line&quot;:75,&quot;column&quot;:36}}"/>}
        {activeTab === 'plugins' && <PluginManager  data-qoder-id="qel-pluginmanager-7522648c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pluginmanager-7522648c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowView.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowView&quot;,&quot;elementRole&quot;:&quot;pluginmanager&quot;,&quot;loc&quot;:{&quot;line&quot;:76,&quot;column&quot;:37}}"/>}
      </div>
    </div>
  )
}
