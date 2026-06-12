import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ShieldCheck, PackageSearch, MessageSquareWarning, Wallet, Search, Filter } from 'lucide-react'

const PAYMENT_COLORS: Record<string, string> = {
  '现金': '#10b981',
  '微信': '#3b82f6',
  '支付宝': '#6366f1',
  '刷卡': '#8b5cf6',
}

type FilterType = '全部' | '异常上报' | '投诉记录' | '交接事项'

interface HistoryRow {
  id: string
  type: string
  content: string
  category: string
  time: string
  status: string
  handler: string
  handoverConfirmed?: boolean
  handoverConfirmer?: string
}

export default function Statistics() {
  const [activeTab, setActiveTab] = useState<'服务指标' | '历史问题查询'>('服务指标')
  const [filterType, setFilterType] = useState<FilterType>('全部')
  const [keyword, setKeyword] = useState('')

  const {
    patrolRecords,
    lostItems,
    complaints,
    ticketSupplements,
    salesRecords,
    emergencyReports,
    handoverNotes,
  } = useStore()

  const patrolRate = useMemo(() => {
    if (patrolRecords.length === 0) return 0
    const done = patrolRecords.filter(r => r.status === 'normal' || r.status === 'resolved').length
    return Math.round((done / patrolRecords.length) * 100)
  }, [patrolRecords])

  const lostReturnRate = useMemo(() => {
    if (lostItems.length === 0) return 0
    const returned = lostItems.filter(i => i.status === '已归还').length
    return Math.round((returned / lostItems.length) * 100)
  }, [lostItems])

  const complaintRate = useMemo(() => {
    if (complaints.length === 0) return 0
    const resolved = complaints.filter(c => c.status === '已解决').length
    return Math.round((resolved / complaints.length) * 100)
  }, [complaints])

  const totalTicketAmount = useMemo(() => {
    return ticketSupplements
      .filter(t => t.status === '已完成')
      .reduce((sum, t) => sum + t.amount, 0)
  }, [ticketSupplements])

  const complaintByCategory = useMemo(() => {
    const map = new Map<string, number>()
    complaints.forEach(c => {
      map.set(c.category, (map.get(c.category) || 0) + 1)
    })
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [complaints])

  const salesByPayment = useMemo(() => {
    const map = new Map<string, number>()
    salesRecords.forEach(s => {
      map.set(s.payment, (map.get(s.payment) || 0) + s.amount)
    })
    return Array.from(map, ([name, value]) => ({ name, value }))
  }, [salesRecords])

  const emergencyByType = useMemo(() => {
    const map = new Map<string, number>()
    emergencyReports.forEach(e => {
      map.set(e.type, (map.get(e.type) || 0) + 1)
    })
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [emergencyReports])

  const historyRows: HistoryRow[] = useMemo(() => {
    const rows: HistoryRow[] = []

    if (filterType === '全部' || filterType === '异常上报') {
      emergencyReports.forEach(e => {
        rows.push({
          id: e.id,
          type: '异常上报',
          content: e.description,
          category: e.location,
          time: e.time,
          status: e.status,
          handler: e.reporter,
        })
      })
    }

    if (filterType === '全部' || filterType === '投诉记录') {
      complaints.forEach(c => {
        rows.push({
          id: c.id,
          type: '投诉',
          content: c.content,
          category: c.category,
          time: c.time,
          status: c.status,
          handler: c.handler,
        })
      })
    }

    if (filterType === '全部' || filterType === '交接事项') {
      handoverNotes.forEach(h => {
        rows.push({
          id: h.id,
          type: '交接',
          content: h.content,
          category: h.category,
          time: h.time,
          status: h.confirmed ? '已确认' : '待确认',
          handler: h.author,
          handoverConfirmed: h.confirmed,
          handoverConfirmer: h.confirmer,
        })
      })
    }

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      return rows.filter(r => r.content.toLowerCase().includes(kw) || r.category.toLowerCase().includes(kw))
    }

    return rows
  }, [filterType, keyword, emergencyReports, complaints, handoverNotes])

  const kpiCards = [
    { label: '巡视完成率', value: `${patrolRate}%`, icon: ShieldCheck, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: '遗失物归还率', value: `${lostReturnRate}%`, icon: PackageSearch, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: '投诉处理率', value: `${complaintRate}%`, icon: MessageSquareWarning, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: '补票收入', value: `¥${totalTicketAmount}`, icon: Wallet, color: 'bg-[#1a365d]', bg: 'bg-slate-50', text: 'text-[#1a365d]' },
  ]

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      '已解决': 'bg-emerald-100 text-emerald-700',
      '已处理': 'bg-emerald-100 text-emerald-700',
      '已确认': 'bg-emerald-100 text-emerald-700',
      '已完成': 'bg-emerald-100 text-emerald-700',
      '处理中': 'bg-amber-100 text-amber-700',
      '上报中': 'bg-amber-100 text-amber-700',
      '待确认': 'bg-amber-100 text-amber-700',
      '待处理': 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-slate-100 text-slate-700'
  }

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      '异常上报': 'bg-red-100 text-red-700',
      '投诉': 'bg-amber-100 text-amber-700',
      '交接': 'bg-blue-100 text-blue-700',
    }
    return map[type] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a365d]">数据统计</h1>
        <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
          {(['服务指标', '历史问题查询'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[#1a365d] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === '服务指标' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-5">
            {kpiCards.map(card => (
              <div key={card.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-base font-semibold text-[#1a365d] mb-4">投诉分类统计</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={complaintByCategory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="数量" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-base font-semibold text-[#1a365d] mb-4">销售支付方式分布</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={salesByPayment}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8' }}
                  >
                    {salesByPayment.map(entry => (
                      <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                    formatter={(value: number) => `¥${value}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-base font-semibold text-[#1a365d] mb-4">异常上报类型统计</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={emergencyByType} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} name="数量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === '历史问题查询' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as FilterType)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              >
                {(['全部', '异常上报', '投诉记录', '交接事项'] as FilterType[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索内容或分类..."
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-[#1a365d]">类型</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a365d]">内容/描述</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a365d]">位置/分类</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a365d]">时间</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a365d]">状态</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a365d]">交接状态</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a365d]">处理人</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">暂无匹配记录</td>
                  </tr>
                ) : (
                  historyRows.map(row => (
                    <tr key={`${row.type}-${row.id}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(row.type)}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[300px] truncate">{row.content}</td>
                      <td className="px-4 py-3 text-slate-500">{row.category}</td>
                      <td className="px-4 py-3 text-slate-500">{row.time}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.type === '交接' ? (
                          row.handoverConfirmed ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              已交接 (确认人: {row.handoverConfirmer})
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              待交接
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.handler}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
