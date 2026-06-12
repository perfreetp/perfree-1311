import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ShieldCheck, PackageSearch, MessageSquareWarning, Wallet, Search, Filter, Download } from 'lucide-react'

const PAYMENT_COLORS: Record<string, string> = {
  '现金': '#10b981',
  '微信': '#3b82f6',
  '支付宝': '#6366f1',
  '刷卡': '#8b5cf6',
}

type HistoryTypeFilter = '全部' | '异常上报' | '投诉记录' | '遗失物品' | '补票记录' | '广播事项' | '低库存' | '交接事项'
type StatusFilter = '全部' | string
type TimeRangeFilter = '全部' | '今天' | '上午' | '下午' | '最近1小时'

interface HistoryRow {
  id: string
  type: string
  typeKey: HistoryTypeFilter
  content: string
  category: string
  location: string
  time: string
  status: string
  handler: string
  handoverConfirmed?: boolean
  handoverConfirmer?: string
  handoverTime?: string
  amount?: number
}

export default function Statistics() {
  const [activeTab, setActiveTab] = useState<'服务指标' | '历史问题查询'>('服务指标')
  const [filterType, setFilterType] = useState<HistoryTypeFilter>('全部')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('全部')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterTimeRange, setFilterTimeRange] = useState<TimeRangeFilter>('全部')
  const [keyword, setKeyword] = useState('')

  const {
    patrolRecords,
    lostItems,
    complaints,
    ticketSupplements,
    salesRecords,
    emergencyReports,
    broadcastItems,
    handoverNotes,
    foodItems,
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
          typeKey: '异常上报',
          content: e.description,
          category: e.type,
          location: e.location,
          time: e.time,
          status: e.status,
          handler: e.reporter,
          handoverConfirmed: e.handoverInfo?.confirmer ? true : e.handoverInfo?.noteId ? false : undefined,
          handoverConfirmer: e.handoverInfo?.confirmer,
          handoverTime: e.handoverInfo?.confirmTime,
        })
      })
    }

    if (filterType === '全部' || filterType === '投诉记录') {
      complaints.forEach(c => {
        rows.push({
          id: c.id,
          type: '投诉',
          typeKey: '投诉记录',
          content: c.content,
          category: c.category,
          location: c.handler,
          time: c.time,
          status: c.status,
          handler: c.handler,
          handoverConfirmed: c.handoverInfo?.confirmer ? true : c.handoverInfo?.noteId ? false : undefined,
          handoverConfirmer: c.handoverInfo?.confirmer,
          handoverTime: c.handoverInfo?.confirmTime,
        })
      })
    }

    if (filterType === '全部' || filterType === '遗失物品') {
      lostItems.forEach(l => {
        rows.push({
          id: l.id,
          type: '遗失物',
          typeKey: '遗失物品',
          content: l.description,
          category: '遗失物品',
          location: l.location,
          time: l.foundTime,
          status: l.status,
          handler: l.handler,
          handoverConfirmed: l.handoverInfo?.confirmer ? true : l.handoverInfo?.noteId ? false : undefined,
          handoverConfirmer: l.handoverInfo?.confirmer,
          handoverTime: l.handoverInfo?.confirmTime,
        })
      })
    }

    if (filterType === '全部' || filterType === '补票记录') {
      ticketSupplements.forEach(t => {
        rows.push({
          id: t.id,
          type: '补票',
          typeKey: '补票记录',
          content: `${t.type} - ${t.passenger}`,
          category: t.type,
          location: `${t.carriage}车${t.seat}座`,
          time: '-',
          status: t.status,
          handler: '-',
          amount: t.amount,
          handoverConfirmed: t.handoverInfo?.confirmer ? true : t.handoverInfo?.noteId ? false : undefined,
          handoverConfirmer: t.handoverInfo?.confirmer,
          handoverTime: t.handoverInfo?.confirmTime,
        })
      })
    }

    if (filterType === '全部' || filterType === '广播事项') {
      broadcastItems.forEach(b => {
        rows.push({
          id: b.id,
          type: '广播',
          typeKey: '广播事项',
          content: b.content,
          category: b.category,
          location: '-',
          time: b.scheduledTime,
          status: b.broadcasted ? '已播放' : '待播放',
          handler: '-',
        })
      })
    }

    if (filterType === '全部' || filterType === '低库存') {
      foodItems.filter(f => f.stock <= f.threshold).forEach(f => {
        rows.push({
          id: f.id,
          type: '低库存',
          typeKey: '低库存',
          content: `${f.name}（库存${f.stock}，阈值${f.threshold}）`,
          category: f.category,
          location: '餐车',
          time: '-',
          status: f.stock <= f.threshold / 2 ? '严重不足' : '库存偏低',
          handler: '-',
        })
      })
    }

    if (filterType === '全部' || filterType === '交接事项') {
      handoverNotes.forEach(h => {
        rows.push({
          id: h.id,
          type: '交接',
          typeKey: '交接事项',
          content: h.content,
          category: h.category,
          location: '-',
          time: h.time,
          status: h.confirmed ? '已确认' : '待确认',
          handler: h.author,
          handoverConfirmed: h.confirmed,
          handoverConfirmer: h.confirmer,
        })
      })
    }

    let filtered = rows

    if (filterStatus !== '全部') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    if (filterLocation.trim()) {
      const loc = filterLocation.trim().toLowerCase()
      filtered = filtered.filter(r =>
        r.location.toLowerCase().includes(loc) ||
        r.category.toLowerCase().includes(loc)
      )
    }

    if (filterTimeRange !== '全部') {
      const now = new Date()
      filtered = filtered.filter(r => {
        if (!r.time || r.time === '-') return filterTimeRange === '全部'
        const parts = r.time.split(/[:：]/)
        if (parts.length < 2) return true
        const hh = parseInt(parts[0])
        const mm = parseInt(parts[1])
        if (isNaN(hh) || isNaN(mm)) return true

        if (filterTimeRange === '上午') return hh < 12
        if (filterTimeRange === '下午') return hh >= 12
        if (filterTimeRange === '最近1小时') {
          const recordTime = new Date()
          recordTime.setHours(hh, mm, 0, 0)
          const diffMs = now.getTime() - recordTime.getTime()
          const diffHours = diffMs / (1000 * 60 * 60)
          return diffHours >= 0 && diffHours <= 1
        }
        return true
      })
    }

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      filtered = filtered.filter(r =>
        r.content.toLowerCase().includes(kw) ||
        r.category.toLowerCase().includes(kw) ||
        r.type.toLowerCase().includes(kw)
      )
    }

    return filtered
  }, [filterType, filterStatus, filterLocation, filterTimeRange, keyword, emergencyReports, complaints, lostItems, ticketSupplements, broadcastItems, foodItems, handoverNotes])

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
      '已归还': 'bg-emerald-100 text-emerald-700',
      '已移交': 'bg-purple-100 text-purple-700',
      '已播放': 'bg-blue-100 text-blue-700',
      '处理中': 'bg-amber-100 text-amber-700',
      '上报中': 'bg-amber-100 text-amber-700',
      '待确认': 'bg-amber-100 text-amber-700',
      '待认领': 'bg-amber-100 text-amber-700',
      '已登记': 'bg-blue-100 text-blue-700',
      '待播放': 'bg-slate-100 text-slate-600',
      '库存偏低': 'bg-amber-100 text-amber-700',
      '严重不足': 'bg-red-100 text-red-700',
      '未收款': 'bg-red-100 text-red-700',
      '待处理': 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-slate-100 text-slate-700'
  }

  const getTypeBadge = (typeKey: HistoryTypeFilter) => {
    const map: Record<HistoryTypeFilter, string> = {
      '全部': 'bg-slate-100 text-slate-700',
      '异常上报': 'bg-red-100 text-red-700',
      '投诉记录': 'bg-amber-100 text-amber-700',
      '遗失物品': 'bg-blue-100 text-blue-700',
      '补票记录': 'bg-emerald-100 text-emerald-700',
      '广播事项': 'bg-purple-100 text-purple-700',
      '低库存': 'bg-orange-100 text-orange-700',
      '交接事项': 'bg-sky-100 text-sky-700',
    }
    return map[typeKey] || 'bg-slate-100 text-slate-700'
  }

  const typeOptions: HistoryTypeFilter[] = ['全部', '异常上报', '投诉记录', '遗失物品', '补票记录', '广播事项', '低库存', '交接事项']
  const timeRangeOptions: TimeRangeFilter[] = ['全部', '今天', '上午', '下午', '最近1小时']

  const handleExport = () => {
    const headers = ['类型', '内容/描述', '分类', '位置', '时间', '状态', '处理人', '交接状态', '确认人']
    const rows = historyRows.map(r => [
      r.type,
      r.content,
      r.category,
      r.location,
      r.time,
      r.status,
      r.handler,
      r.handoverConfirmed === true ? '已交接' : r.handoverConfirmed === false ? '待交接' : '-',
      r.handoverConfirmer || '-',
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `交班核对清单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setFilterType('全部')
    setFilterStatus('全部')
    setFilterLocation('')
    setFilterTimeRange('全部')
    setKeyword('')
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Filter className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">类型</label>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as HistoryTypeFilter)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white min-w-[100px]"
                  >
                    {typeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">状态</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white min-w-[100px]"
                  >
                    <option value="全部">全部</option>
                    {Array.from(new Set(historyRows.map(r => r.status))).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">时间</label>
                  <select
                    value={filterTimeRange}
                    onChange={e => setFilterTimeRange(e.target.value as TimeRangeFilter)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white min-w-[110px]"
                  >
                    {timeRangeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                    placeholder="搜索车厢/位置..."
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                >
                  重置筛选
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出清单
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索内容、分类或类型..."
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a365d] text-xs whitespace-nowrap">类型</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a365d] text-xs whitespace-nowrap">内容/描述</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a365d] text-xs whitespace-nowrap">位置/分类</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a365d] text-xs whitespace-nowrap">时间</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a365d] text-xs whitespace-nowrap">状态</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a365d] text-xs whitespace-nowrap">交接状态</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a365d] text-xs whitespace-nowrap">处理人</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">暂无匹配记录</td>
                    </tr>
                  ) : (
                    historyRows.map(row => (
                      <tr key={`${row.typeKey}-${row.id}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(row.typeKey)}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-[320px] truncate" title={row.content}>{row.content}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.location}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.time}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.handoverConfirmed === true ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              已交接 {row.handoverConfirmer ? `(${row.handoverConfirmer})` : ''}
                            </span>
                          ) : row.handoverConfirmed === false ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              待交接
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.handler}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
              <span>共 <span className="font-semibold text-slate-700">{historyRows.length}</span> 条记录</span>
              <span>交班核对清单可导出用于交接签字</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
