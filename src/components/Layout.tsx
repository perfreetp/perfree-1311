import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  ClipboardCheck, ScanSearch, HeartHandshake, UtensilsCrossed,
  AlertTriangle, ArrowRightLeft, BarChart3, Train, ChevronLeft, ChevronRight
} from 'lucide-react'

const navItems = [
  { path: '/preparation', label: '出乘准备', icon: ClipboardCheck },
  { path: '/patrol', label: '车厢巡视', icon: ScanSearch },
  { path: '/service', label: '旅客服务', icon: HeartHandshake },
  { path: '/catering', label: '餐售管理', icon: UtensilsCrossed },
  { path: '/incident', label: '异常上报', icon: AlertTriangle },
  { path: '/handover', label: '交接退乘', icon: ArrowRightLeft },
  { path: '/statistics', label: '数据统计', icon: BarChart3 },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className={`${collapsed ? 'w-[72px]' : 'w-[220px]'} bg-navy-800 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-navy-600/30">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Train className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold leading-tight whitespace-nowrap">乘务协同系统</h1>
              <p className="text-[10px] text-navy-300 whitespace-nowrap">G1234 北京南→上海虹桥</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300 font-medium'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-10 flex items-center justify-center border-t border-navy-600/30 text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
