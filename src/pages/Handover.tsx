import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import type { RelatedItem, RelatedItemType } from '@/types'
import {
  ClipboardList,
  Star,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  User,
  FileText,
  MessageSquare,
  AlertTriangle,
  PackageSearch,
  MessageSquareWarning,
  Package,
  Link2,
  LayoutDashboard,
  AlertOctagon,
  Megaphone,
  ChevronRight,
  Users,
  Layers,
  Printer,
  Download,
  X,
  ShieldAlert,
  Zap,
} from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  设备异常: 'bg-red-100 text-red-700',
  重点旅客: 'bg-amber-100 text-amber-700',
  遗失物品: 'bg-blue-100 text-blue-700',
  物资补给: 'bg-orange-100 text-orange-700',
  其他: 'bg-slate-100 text-slate-700',
}

const RELATED_ITEM_COLORS: Record<RelatedItemType, string> = {
  异常上报: 'bg-red-100 text-red-700',
  投诉记录: 'bg-amber-100 text-amber-700',
  遗失物品: 'bg-blue-100 text-blue-700',
  低库存: 'bg-orange-100 text-orange-700',
}

const CATEGORIES = ['设备异常', '重点旅客', '遗失物品', '物资补给', '其他']

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            size={24}
            className={
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-300'
            }
          />
        </button>
      ))}
    </div>
  )
}

function parseTimeToMinutes(t: string): number | null {
  const parts = t.split(/[:：]/)
  if (parts.length < 2) return null
  const hh = parseInt(parts[0])
  const mm = parseInt(parts[1])
  if (isNaN(hh) || isNaN(mm)) return null
  return hh * 60 + mm
}

function isUrgentBroadcast(scheduledTime: string, now = new Date()): boolean {
  const target = parseTimeToMinutes(scheduledTime)
  if (target === null) return false
  const cur = now.getHours() * 60 + now.getMinutes()
  const diff = target - cur
  return diff >= 0 && diff <= 15
}

export default function Handover() {
  const {
    handoverNotes,
    signOffEvaluation,
    addHandoverNote,
    confirmHandoverNote,
    setSignOffEvaluation,
    emergencyReports,
    complaints,
    lostItems,
    foodItems,
    broadcastItems,
    toggleBroadcast,
    ticketSupplements,
    crewMembers,
    trainTask,
  } = useStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'evaluation'>('overview')
  const [overviewMode, setOverviewMode] = useState<'summary' | 'byRole'>('summary')
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formAuthor, setFormAuthor] = useState('')
  const [formRelatedItems, setFormRelatedItems] = useState<RelatedItem[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)

  const evaluationExists =
    signOffEvaluation.serviceQuality > 0 ||
    signOffEvaluation.teamCooperation > 0 ||
    signOffEvaluation.safetyCompliance > 0

  const [serviceQuality, setServiceQuality] = useState(
    signOffEvaluation.serviceQuality
  )
  const [teamCooperation, setTeamCooperation] = useState(
    signOffEvaluation.teamCooperation
  )
  const [safetyCompliance, setSafetyCompliance] = useState(
    signOffEvaluation.safetyCompliance
  )
  const [summary, setSummary] = useState(signOffEvaluation.summary)
  const [evaluator, setEvaluator] = useState(signOffEvaluation.evaluator)
  const [showRiskWarning, setShowRiskWarning] = useState(false)

  const toggleRelatedItem = (item: RelatedItem) => {
    setFormRelatedItems((prev) =>
      prev.some((i) => i.id === item.id && i.type === item.type)
        ? prev.filter((i) => !(i.id === item.id && i.type === item.type))
        : [...prev, item]
    )
  }

  const handleAddNote = () => {
    if (!formContent.trim() || !formAuthor.trim()) return
    addHandoverNote({
      id: String(Date.now()),
      content: formContent,
      category: formCategory,
      author: formAuthor,
      time: new Date().toLocaleString('zh-CN'),
      confirmed: false,
      relatedItems: formRelatedItems.length > 0 ? formRelatedItems : undefined,
    })
    setFormContent('')
    setFormCategory(CATEGORIES[0])
    setFormAuthor('')
    setFormRelatedItems([])
    setShowForm(false)
  }

  const handleConfirm = (id: string) => {
    confirmHandoverNote(id, '接班人')
  }

  const pendingTasksSummary = useMemo(() => {
    const pendingEmergencies = emergencyReports.filter(e => e.status !== '已处理')
    const pendingComplaints = complaints.filter(c => c.status !== '已解决')
    const pendingLost = lostItems.filter(l => l.status === '待认领' || l.status === '已登记')
    const lowStockUnconfirmed = foodItems.filter(f => f.stock <= f.threshold && (!f.handoverInfo || !f.handoverInfo.confirmer))
    return {
      total: pendingEmergencies.length + pendingComplaints.length + pendingLost.length + lowStockUnconfirmed.length,
      emergencies: pendingEmergencies,
      complaints: pendingComplaints,
      lostItems: pendingLost,
      lowStock: lowStockUnconfirmed,
    }
  }, [emergencyReports, complaints, lostItems, foodItems])

  const handleSubmitEvaluation = () => {
    if (!evaluator.trim() || !summary.trim()) return
    if (pendingTasksSummary.total > 0 && !showRiskWarning) {
      setShowRiskWarning(true)
      return
    }
    setSignOffEvaluation({
      serviceQuality,
      teamCooperation,
      safetyCompliance,
      summary,
      evaluator,
      time: new Date().toLocaleString('zh-CN'),
    })
    setShowRiskWarning(false)
  }

  const averageScore =
    evaluationExists
      ? (
          (signOffEvaluation.serviceQuality +
            signOffEvaluation.teamCooperation +
            signOffEvaluation.safetyCompliance) /
          3
        ).toFixed(1)
      : null

  const roleGroups = useMemo(() => {
    const result: Record<string, {
      role: string
      name: string
      member: any
      items: { type: string; icon: string; title: string; subtitle: string; status: string; handoverInfo?: any }[]
    }> = {}

    crewMembers.forEach(m => {
      const key = m.role
      if (!result[key]) {
        result[key] = {
          role: key,
          name: m.name,
          member: m,
          items: [],
        }
      }
    })

    const roleMatch = (role: string, name: string): boolean => {
      const groups = Object.keys(result)
      return groups.some(g => g.includes(role) || role.includes(g) || result[g].name === name)
    }

    const groupByHandler = (name: string) => {
      for (const k of Object.keys(result)) {
        if (result[k].name === name) return k
      }
      return null
    }

    const groupByCarriage = (location: string) => {
      const match = location.match(/(\d+)\s*车/)
      if (!match) return null
      const carNo = parseInt(match[1])
      for (const k of Object.keys(result)) {
        const rangeMatch = k.match(/乘务员-(\d+)-(\d+)车/)
        if (rangeMatch) {
          const from = parseInt(rangeMatch[1])
          const to = parseInt(rangeMatch[2])
          if (carNo >= from && carNo <= to) return k
        }
      }
      return null
    }

    emergencyReports.filter(e => e.status !== '已处理').forEach(e => {
      const groupKey = groupByHandler(e.reporter) || groupByCarriage(e.location) || '其他事项'
      if (!result[groupKey]) {
        result[groupKey] = { role: groupKey, name: '未分配', member: null, items: [] }
      }
      result[groupKey].items.push({
        type: '异常上报',
        icon: 'emergency',
        title: e.type,
        subtitle: `${e.location} · ${e.time}`,
        status: e.status,
        handoverInfo: e.handoverInfo,
      })
    })

    complaints.filter(c => c.status !== '已解决').forEach(c => {
      const groupKey = groupByHandler(c.handler) || '其他事项'
      if (!result[groupKey]) {
        result[groupKey] = { role: groupKey, name: '未分配', member: null, items: [] }
      }
      result[groupKey].items.push({
        type: '投诉记录',
        icon: 'complaint',
        title: c.content,
        subtitle: `${c.passenger} · ${c.category}`,
        status: c.status,
        handoverInfo: c.handoverInfo,
      })
    })

    lostItems.filter(l => l.status === '待认领' || l.status === '已登记').forEach(l => {
      const groupKey = groupByHandler(l.handler) || groupByCarriage(l.location) || '其他事项'
      if (!result[groupKey]) {
        result[groupKey] = { role: groupKey, name: '未分配', member: null, items: [] }
      }
      result[groupKey].items.push({
        type: '遗失物品',
        icon: 'lost',
        title: l.description,
        subtitle: l.location,
        status: l.status,
        handoverInfo: l.handoverInfo,
      })
    })

    foodItems.filter(f => f.stock <= f.threshold).forEach(f => {
      const groupKey = '餐售员'
      if (!result[groupKey]) {
        result[groupKey] = { role: groupKey, name: '未分配', member: null, items: [] }
      }
      result[groupKey].items.push({
        type: '低库存',
        icon: 'stock',
        title: `${f.name}（库存${f.stock}）`,
        subtitle: f.category,
        status: f.stock <= f.threshold / 2 ? '严重不足' : '库存偏低',
        handoverInfo: f.handoverInfo,
      })
    })

    broadcastItems.filter(b => !b.broadcasted).forEach(b => {
      const groupKey = '列车长'
      if (!result[groupKey]) {
        result[groupKey] = { role: groupKey, name: '未分配', member: null, items: [] }
      }
      result[groupKey].items.push({
        type: '广播事项',
        icon: 'broadcast',
        title: b.content,
        subtitle: `${b.category} · 计划${b.scheduledTime}`,
        status: isUrgentBroadcast(b.scheduledTime) ? '临近播放' : '待播放',
      })
    })

    return Object.values(result)
  }, [crewMembers, emergencyReports, complaints, lostItems, foodItems, broadcastItems])

  const printData = useMemo(() => {
    const unclosed = [
      ...emergencyReports.filter(e => e.status !== '已处理').map(e => ({ type: '异常上报', title: e.type, location: e.location, status: e.status, handler: e.reporter })),
      ...complaints.filter(c => c.status !== '已解决').map(c => ({ type: '投诉记录', title: c.content, location: c.category, status: c.status, handler: c.handler })),
      ...lostItems.filter(l => l.status === '待认领' || l.status === '已登记').map(l => ({ type: '遗失物品', title: l.description, location: l.location, status: l.status, handler: l.handler })),
      ...foodItems.filter(f => f.stock <= f.threshold).map(f => ({ type: '低库存', title: `${f.name}库存${f.stock}`, location: f.category, status: f.stock <= f.threshold / 2 ? '严重不足' : '库存偏低', handler: '餐售员' })),
      ...broadcastItems.filter(b => !b.broadcasted).map(b => ({ type: '广播事项', title: b.content, location: b.category, status: '待播放', handler: '列车长' })),
    ]
    const confirmed = handoverNotes.filter(n => n.confirmed).map(n => ({
      content: n.content,
      author: n.author,
      confirmer: n.confirmer,
      confirmTime: n.confirmTime || n.time,
      related: n.relatedItems?.map(r => r.title).join('、') || '',
    }))
    const avg = (signOffEvaluation.serviceQuality + signOffEvaluation.teamCooperation + signOffEvaluation.safetyCompliance) / 3
    return {
      trainNo: trainTask.trainNo,
      departure: trainTask.departure,
      arrival: trainTask.arrival,
      date: trainTask.date,
      unclosed,
      confirmed,
      evaluation: evaluationExists ? {
        avg: avg.toFixed(1),
        serviceQuality: signOffEvaluation.serviceQuality,
        teamCooperation: signOffEvaluation.teamCooperation,
        safetyCompliance: signOffEvaluation.safetyCompliance,
        summary: signOffEvaluation.summary,
        evaluator: signOffEvaluation.evaluator,
        time: signOffEvaluation.time,
      } : null,
    }
  }, [trainTask, emergencyReports, complaints, lostItems, foodItems, broadcastItems, handoverNotes, signOffEvaluation, evaluationExists])

  const handlePrint = () => {
    window.print()
  }

  const handleExportSheet = () => {
    const headers = ['车次', '发车', '到达', '日期', '分类', '事项', '位置/分类', '状态', '处理人']
    const rows: string[][] = []
    printData.unclosed.forEach(u => {
      rows.push([printData.trainNo, printData.departure, printData.arrival, printData.date, u.type, u.title, u.location, u.status, u.handler])
    })
    const h2 = ['分类', '交接内容', '交班人', '接班人', '确认时间', '关联事项']
    printData.confirmed.forEach(c => {
      rows.push(['已签收事项', c.content, c.author, c.confirmer || '', c.confirmTime, c.related])
    })
    if (printData.evaluation) {
      rows.push(['退乘评价', `综合评分：${printData.evaluation.avg}/5`, `服务质量${printData.evaluation.serviceQuality} 团队配合${printData.evaluation.teamCooperation} 安全合规${printData.evaluation.safetyCompliance}`, printData.evaluation.evaluator, printData.evaluation.time, printData.evaluation.summary])
    }
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `交班单_${printData.trainNo}_${printData.date.replace(/\//g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getItemIcon = (iconKey: string) => {
    switch (iconKey) {
      case 'emergency': return <AlertOctagon className="w-4 h-4 text-red-500" />
      case 'complaint': return <MessageSquareWarning className="w-4 h-4 text-amber-500" />
      case 'lost': return <PackageSearch className="w-4 h-4 text-blue-500" />
      case 'stock': return <Package className="w-4 h-4 text-orange-500" />
      case 'broadcast': return <Megaphone className="w-4 h-4 text-purple-500" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3 no-print">
          <div className="rounded-lg bg-[#1a365d] p-2.5">
            <ClipboardList className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a365d]">交接退乘</h1>
            <p className="text-sm text-slate-500">{trainTask.trainNo} · {trainTask.departure} → {trainTask.arrival} · {trainTask.date}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm no-print">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#1a365d] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard size={16} />
            交班总览
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'bg-[#1a365d] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={16} />
            交班备注
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'evaluation'
                ? 'bg-[#1a365d] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star size={16} />
            退乘评价
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between no-print">
              <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200">
                <button
                  onClick={() => setOverviewMode('summary')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    overviewMode === 'summary' ? 'bg-[#1a365d] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers size={14} />
                  总览视图
                </button>
                <button
                  onClick={() => setOverviewMode('byRole')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    overviewMode === 'byRole' ? 'bg-[#1a365d] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users size={14} />
                  按岗位分组
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  打印交班单
                </button>
                <button
                  onClick={() => { setShowForm(true); setActiveTab('notes'); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#3b82f6] rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增交接备注
                </button>
              </div>
            </div>

            {overviewMode === 'summary' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: '未处理异常', count: emergencyReports.filter(e => e.status !== '已处理').length, Icon: AlertOctagon, bg: 'bg-red-50', text: 'text-red-700' },
                    { label: '未解决投诉', count: complaints.filter(c => c.status !== '已解决').length, Icon: MessageSquareWarning, bg: 'bg-amber-50', text: 'text-amber-700' },
                    { label: '待认领遗失物', count: lostItems.filter(l => l.status === '待认领' || l.status === '已登记').length, Icon: PackageSearch, bg: 'bg-blue-50', text: 'text-blue-700' },
                    { label: '低库存餐品', count: foodItems.filter(f => f.stock <= f.threshold).length, Icon: Package, bg: 'bg-orange-50', text: 'text-orange-700' },
                    { label: '待播广播', count: broadcastItems.filter(b => !b.broadcasted).length, Icon: Megaphone, bg: 'bg-purple-50', text: 'text-purple-700' },
                  ].map(({ label, count, Icon, bg, text }) => (
                    <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${text}`} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">{label}</p>
                          <p className={`text-2xl font-bold ${text}`}>{count}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-[#1a365d] flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-red-500" />
                        未处理异常
                      </h3>
                      <span className="text-xs text-slate-400">{emergencyReports.filter(e => e.status !== '已处理').length} 项</span>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-auto">
                      {emergencyReports.filter(e => e.status !== '已处理').length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">暂无未处理异常</p>
                      ) : (
                        emergencyReports.filter(e => e.status !== '已处理').map(e => (
                          <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{e.type}</p>
                              <p className="text-xs text-slate-500">{e.location} · {e.time}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {e.handoverInfo ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                  {e.handoverInfo.confirmer ? '已交接' : '待交接'}
                                </span>
                              ) : null}
                              <span className="text-xs text-amber-600 whitespace-nowrap">{e.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-[#1a365d] flex items-center gap-2">
                        <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                        未解决投诉
                      </h3>
                      <span className="text-xs text-slate-400">{complaints.filter(c => c.status !== '已解决').length} 项</span>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-auto">
                      {complaints.filter(c => c.status !== '已解决').length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">暂无未解决投诉</p>
                      ) : (
                        complaints.filter(c => c.status !== '已解决').map(c => (
                          <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{c.content}</p>
                              <p className="text-xs text-slate-500">{c.passenger} · {c.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.handoverInfo ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                  {c.handoverInfo.confirmer ? '已交接' : '待交接'}
                                </span>
                              ) : null}
                              <span className="text-xs text-amber-600 whitespace-nowrap">{c.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-[#1a365d] flex items-center gap-2">
                        <PackageSearch className="w-4 h-4 text-blue-500" />
                        待认领遗失物
                      </h3>
                      <span className="text-xs text-slate-400">{lostItems.filter(l => l.status === '待认领' || l.status === '已登记').length} 项</span>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-auto">
                      {lostItems.filter(l => l.status === '待认领' || l.status === '已登记').length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">暂无待认领遗失物</p>
                      ) : (
                        lostItems.filter(l => l.status === '待认领' || l.status === '已登记').map(l => (
                          <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{l.description}</p>
                              <p className="text-xs text-slate-500">{l.location}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {l.handoverInfo ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                  {l.handoverInfo.confirmer ? '已交接' : '待交接'}
                                </span>
                              ) : null}
                              <span className="text-xs text-blue-600 whitespace-nowrap">{l.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-[#1a365d] flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-500" />
                        低库存餐品
                      </h3>
                      <span className="text-xs text-slate-400">{foodItems.filter(f => f.stock <= f.threshold).length} 项</span>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-auto">
                      {foodItems.filter(f => f.stock <= f.threshold).length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">库存充足</p>
                      ) : (
                        foodItems.filter(f => f.stock <= f.threshold).map(f => (
                          <div key={f.id} className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700">{f.name}</p>
                                <p className="text-xs text-slate-500">{f.category} · 库存 {f.stock}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {f.handoverInfo ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600" title={f.handoverInfo.confirmer ? `${f.handoverInfo.confirmer} · ${f.handoverInfo.confirmTime}` : '已关联备注'}>
                                    {f.handoverInfo.confirmer ? '已交接' : '待交接'}
                                  </span>
                                ) : null}
                                <span className={`text-xs whitespace-nowrap px-2 py-0.5 rounded-full ${
                                  f.stock <= f.threshold / 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {f.stock <= f.threshold / 2 ? '严重不足' : '库存偏低'}
                                </span>
                              </div>
                            </div>
                            {f.handoverInfo?.confirmer && (
                              <p className="text-[10px] text-blue-500">签收：{f.handoverInfo.confirmer} · {f.handoverInfo.confirmTime}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#1a365d] flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-500" />
                      待播广播
                    </h3>
                    <span className="text-xs text-slate-400">{broadcastItems.filter(b => !b.broadcasted).length} 条</span>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-auto">
                    {broadcastItems.filter(b => !b.broadcasted).length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">全部广播已播放</p>
                    ) : (
                      broadcastItems
                        .filter(b => !b.broadcasted)
                        .sort((a, b) => (parseTimeToMinutes(a.scheduledTime) || 0) - (parseTimeToMinutes(b.scheduledTime) || 0))
                        .map(b => {
                          const urgent = isUrgentBroadcast(b.scheduledTime)
                          return (
                            <div
                              key={b.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                                urgent ? 'bg-red-50 border border-red-200 hover:bg-red-100/60' : 'bg-slate-50 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {urgent && <Zap className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" />}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${urgent ? 'text-red-800' : 'text-slate-700'}`}>{b.content}</p>
                                  <p className="text-xs text-slate-500">
                                    {b.category} · 计划 {b.scheduledTime}
                                    {urgent && <span className="ml-2 text-red-600 font-medium">（临近播放）</span>}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleBroadcast(b.id)}
                                className="ml-2 px-3 py-1 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex-shrink-0"
                              >
                                标记已播
                              </button>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 no-print">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    查看交接备注
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {overviewMode === 'byRole' && (
              <div className="space-y-3">
                {roleGroups.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
                    暂无岗位数据
                  </div>
                ) : (
                  roleGroups.map(group => {
                    const isOpen = expandedRole === group.role
                    return (
                      <div key={group.role} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedRole(isOpen ? null : group.role)}
                          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-medium text-sm flex-shrink-0">
                              {group.name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-[#1a365d]">{group.role}</p>
                              <p className="text-xs text-slate-500">负责人：{group.name}{group.member?.signedIn ? '' : '（未签到）'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                              group.items.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {group.items.length === 0 ? '已全部闭环' : `${group.items.length} 项待处理`}
                            </span>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </div>
                        </button>
                        {isOpen && group.items.length > 0 && (
                          <div className="px-5 pb-4 space-y-2 border-t border-slate-100 pt-3 bg-slate-50/50">
                            {group.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:shadow-sm transition-shadow">
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  {getItemIcon(item.icon)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${RELATED_ITEM_COLORS[item.type as RelatedItemType] || 'bg-slate-100 text-slate-600'}`}>
                                        {item.type}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 ml-2">
                                  {item.handoverInfo ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                      {item.handoverInfo.confirmer ? '已交接' : '待交接'}
                                    </span>
                                  ) : null}
                                  <span className={`text-xs whitespace-nowrap px-2 py-0.5 rounded-full ${
                                    item.status.includes('临近') || item.status.includes('严重') ? 'bg-red-100 text-red-700'
                                    : item.status.includes('已') ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {isOpen && group.items.length === 0 && (
                          <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                            <p className="text-center text-sm text-emerald-600 py-2">该岗位所有事项已闭环 ✓</p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex justify-between no-print">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  打印交班单
                </button>
                <button
                  onClick={handleExportSheet}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出CSV
                </button>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
              >
                <Plus size={16} />
                新增备注
              </button>
            </div>

            {showForm && (
              <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm no-print">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      备注内容
                    </label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                      placeholder="请输入交接备注内容..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        分类
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        交班人
                      </label>
                      <input
                        type="text"
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                        placeholder="请输入姓名"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      关联待处理事项
                    </label>
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {emergencyReports.filter((e) => e.status !== '已处理').length > 0 && (
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                            <AlertTriangle size={14} />
                            异常上报
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {emergencyReports
                              .filter((e) => e.status !== '已处理')
                              .map((e) => {
                                const item: RelatedItem = {
                                  id: e.id,
                                  type: '异常上报',
                                  title: `${e.location} ${e.type}`,
                                }
                                const selected = formRelatedItems.some(
                                  (i) => i.id === item.id && i.type === item.type
                                )
                                return (
                                  <button
                                    key={`${item.type}-${item.id}`}
                                    type="button"
                                    onClick={() => toggleRelatedItem(item)}
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                      selected
                                        ? 'bg-[#1a365d] text-white'
                                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {item.title}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                      {complaints.filter((c) => c.status !== '已解决').length > 0 && (
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                            <MessageSquareWarning size={14} />
                            投诉记录
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {complaints
                              .filter((c) => c.status !== '已解决')
                              .map((c) => {
                                const item: RelatedItem = {
                                  id: c.id,
                                  type: '投诉记录',
                                  title: c.content,
                                }
                                const selected = formRelatedItems.some(
                                  (i) => i.id === item.id && i.type === item.type
                                )
                                return (
                                  <button
                                    key={`${item.type}-${item.id}`}
                                    type="button"
                                    onClick={() => toggleRelatedItem(item)}
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                      selected
                                        ? 'bg-[#1a365d] text-white'
                                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {item.title}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                      {lostItems.filter((l) => l.status === '待认领' || l.status === '已登记').length > 0 && (
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                            <PackageSearch size={14} />
                            遗失物品
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {lostItems
                              .filter((l) => l.status === '待认领' || l.status === '已登记')
                              .map((l) => {
                                const item: RelatedItem = {
                                  id: l.id,
                                  type: '遗失物品',
                                  title: l.description,
                                }
                                const selected = formRelatedItems.some(
                                  (i) => i.id === item.id && i.type === item.type
                                )
                                return (
                                  <button
                                    key={`${item.type}-${item.id}`}
                                    type="button"
                                    onClick={() => toggleRelatedItem(item)}
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                      selected
                                        ? 'bg-[#1a365d] text-white'
                                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {item.title}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                      {foodItems.filter((f) => f.stock <= f.threshold).length > 0 && (
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-orange-600">
                            <Package size={14} />
                            低库存
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {foodItems
                              .filter((f) => f.stock <= f.threshold)
                              .map((f) => {
                                const item: RelatedItem = {
                                  id: f.id,
                                  type: '低库存',
                                  title: `${f.name}库存${f.stock}件`,
                                }
                                const selected = formRelatedItems.some(
                                  (i) => i.id === item.id && i.type === item.type
                                )
                                return (
                                  <button
                                    key={`${item.type}-${item.id}`}
                                    type="button"
                                    onClick={() => toggleRelatedItem(item)}
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                      selected
                                        ? 'bg-[#1a365d] text-white'
                                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {item.title}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                      {emergencyReports.filter((e) => e.status !== '已处理').length === 0 &&
                        complaints.filter((c) => c.status !== '已解决').length === 0 &&
                        lostItems.filter((l) => l.status === '待认领' || l.status === '已登记').length === 0 &&
                        foodItems.filter((f) => f.stock <= f.threshold).length === 0 && (
                          <p className="text-xs text-slate-400">暂无待处理事项</p>
                        )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowForm(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddNote}
                      disabled={!formContent.trim() || !formAuthor.trim()}
                      className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      提交备注
                    </button>
                  </div>
                </div>
              </div>
            )}

            {handoverNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-slate-400">
                <MessageSquare size={48} className="mb-3 opacity-40" />
                <p className="text-sm">暂无交接备注</p>
              </div>
            ) : (
              handoverNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLORS[note.category] || CATEGORY_COLORS['其他']}`}
                    >
                      {note.category}
                    </span>
                    {note.confirmed ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 size={12} />
                        已确认 · {note.confirmer}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        <Clock size={12} />
                        待确认
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-slate-700">
                    {note.content}
                  </p>
                  {note.relatedItems && note.relatedItems.length > 0 && (
                    <div className="mb-3 flex items-start gap-1.5">
                      <Link2 size={12} className="mt-0.5 text-slate-400" />
                      <div className="flex flex-wrap gap-1.5">
                        {note.relatedItems.map((item) => (
                          <span
                            key={`${item.type}-${item.id}`}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${RELATED_ITEM_COLORS[item.type]}`}
                          >
                            {item.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {note.author}
                      </span>
                      <span>{note.time}</span>
                      {note.confirmed && note.confirmTime && (
                        <span>签收：{note.confirmTime}</span>
                      )}
                    </div>
                    {!note.confirmed && (
                      <button
                        onClick={() => handleConfirm(note.id)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600"
                      >
                        确认签收
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="space-y-4">
            {averageScore && (
              <div className="rounded-xl bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] p-6 text-white shadow-md">
                <p className="text-sm opacity-80">综合评分</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{averageScore}</span>
                  <span className="text-lg opacity-60">/ 5.0</span>
                </div>
                {evaluationExists && (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                    <CheckCircle2 size={12} />
                    已提交
                  </span>
                )}
              </div>
            )}

            {!evaluationExists && showRiskWarning && pendingTasksSummary.total > 0 && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-red-800 flex items-center gap-1.5">
                      交班风险提醒
                      <span className="text-xs font-normal text-red-600">（{pendingTasksSummary.total} 项待办未闭环）</span>
                    </h3>
                    <p className="text-xs text-red-600 mt-0.5">提交退乘评价前请确认以下事项已处理或完成交接：</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {pendingTasksSummary.emergencies.length > 0 && (
                        <div className="bg-white rounded-lg p-2.5 border border-red-200">
                          <p className="text-xs font-semibold text-red-700 mb-1">⚠️ 未处理异常（{pendingTasksSummary.emergencies.length}）</p>
                          <div className="space-y-0.5">
                            {pendingTasksSummary.emergencies.slice(0, 3).map(e => (
                              <p key={e.id} className="text-xs text-slate-600 truncate">· {e.type} - {e.location}</p>
                            ))}
                            {pendingTasksSummary.emergencies.length > 3 && (
                              <p className="text-xs text-slate-400">…还有 {pendingTasksSummary.emergencies.length - 3} 项</p>
                            )}
                          </div>
                        </div>
                      )}
                      {pendingTasksSummary.complaints.length > 0 && (
                        <div className="bg-white rounded-lg p-2.5 border border-amber-200">
                          <p className="text-xs font-semibold text-amber-700 mb-1">📝 未解决投诉（{pendingTasksSummary.complaints.length}）</p>
                          <div className="space-y-0.5">
                            {pendingTasksSummary.complaints.slice(0, 3).map(c => (
                              <p key={c.id} className="text-xs text-slate-600 truncate">· {c.content}</p>
                            ))}
                            {pendingTasksSummary.complaints.length > 3 && (
                              <p className="text-xs text-slate-400">…还有 {pendingTasksSummary.complaints.length - 3} 项</p>
                            )}
                          </div>
                        </div>
                      )}
                      {pendingTasksSummary.lostItems.length > 0 && (
                        <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                          <p className="text-xs font-semibold text-blue-700 mb-1">🎒 待认领遗失物（{pendingTasksSummary.lostItems.length}）</p>
                          <div className="space-y-0.5">
                            {pendingTasksSummary.lostItems.slice(0, 3).map(l => (
                              <p key={l.id} className="text-xs text-slate-600 truncate">· {l.description}</p>
                            ))}
                            {pendingTasksSummary.lostItems.length > 3 && (
                              <p className="text-xs text-slate-400">…还有 {pendingTasksSummary.lostItems.length - 3} 项</p>
                            )}
                          </div>
                        </div>
                      )}
                      {pendingTasksSummary.lowStock.length > 0 && (
                        <div className="bg-white rounded-lg p-2.5 border border-orange-200">
                          <p className="text-xs font-semibold text-orange-700 mb-1">📦 低库存未签收（{pendingTasksSummary.lowStock.length}）</p>
                          <div className="space-y-0.5">
                            {pendingTasksSummary.lowStock.slice(0, 3).map(f => (
                              <p key={f.id} className="text-xs text-slate-600 truncate">· {f.name}（剩{f.stock}）</p>
                            ))}
                            {pendingTasksSummary.lowStock.length > 3 && (
                              <p className="text-xs text-slate-400">…还有 {pendingTasksSummary.lowStock.length - 3} 项</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setShowRiskWarning(false)}
                        className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        返回处理
                      </button>
                      <button
                        onClick={handleSubmitEvaluation}
                        className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
                      >
                        确认仍提交评价
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(!showRiskWarning || evaluationExists) && (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-base font-semibold text-[#1a365d]">
                    评分维度
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        服务质量
                      </span>
                      <StarRating
                        value={serviceQuality}
                        onChange={setServiceQuality}
                        readonly={evaluationExists}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        团队配合
                      </span>
                      <StarRating
                        value={teamCooperation}
                        onChange={setTeamCooperation}
                        readonly={evaluationExists}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        安全合规
                      </span>
                      <StarRating
                        value={safetyCompliance}
                        onChange={setSafetyCompliance}
                        readonly={evaluationExists}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-[#1a365d]">
                    退乘总结
                  </h3>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    readOnly={evaluationExists}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="请输入退乘总结..."
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-[#1a365d]">
                    评价人
                  </h3>
                  <input
                    type="text"
                    value={evaluator}
                    onChange={(e) => setEvaluator(e.target.value)}
                    readOnly={evaluationExists}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="请输入评价人姓名"
                  />
                </div>

                {!evaluationExists && (
                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={
                      !evaluator.trim() ||
                      !summary.trim() ||
                      serviceQuality === 0 ||
                      teamCooperation === 0 ||
                      safetyCompliance === 0
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a365d] px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#2d4a7c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={16} />
                    提交评价
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 no-print">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-[#1a365d]">交班单预览</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportSheet}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出CSV
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#3b82f6] rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    打印
                  </button>
                  <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div id="printable-area" className="px-8 py-6 overflow-auto bg-white">
                <div className="text-center mb-6 pb-4 border-b-2 border-[#1a365d]">
                  <h2 className="text-2xl font-bold text-[#1a365d]">列车乘务交班单</h2>
                  <div className="mt-2 flex justify-center gap-6 text-sm text-slate-600 flex-wrap">
                    <span>车次：<strong>{printData.trainNo}</strong></span>
                    <span>线路：<strong>{printData.departure} → {printData.arrival}</strong></span>
                    <span>日期：<strong>{printData.date}</strong></span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#1a365d] mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    未闭环事项（{printData.unclosed.length}）
                  </h3>
                  {printData.unclosed.length === 0 ? (
                    <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3 text-center">✓ 所有事项已闭环</p>
                  ) : (
                    <table className="w-full text-sm border border-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 text-xs">分类</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 text-xs">事项</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 text-xs">位置/分类</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 text-xs">状态</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 text-xs">处理人</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printData.unclosed.map((u, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="px-3 py-1.5 text-xs">{u.type}</td>
                            <td className="px-3 py-1.5 text-xs">{u.title}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{u.location}</td>
                            <td className="px-3 py-1.5 text-xs">{u.status}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{u.handler}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#1a365d] mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    已签收事项（{printData.confirmed.length}）
                  </h3>
                  {printData.confirmed.length === 0 ? (
                    <p className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3 text-center">暂无已签收事项</p>
                  ) : (
                    <div className="space-y-2">
                      {printData.confirmed.map((c, i) => (
                        <div key={i} className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-200">
                          <p className="text-sm text-slate-700 mb-1">{c.content}</p>
                          <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                            <span>交班人：{c.author}</span>
                            <span>接班人：{c.confirmer}</span>
                            <span>确认时间：{c.confirmTime}</span>
                            {c.related && <span>关联：{c.related}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {printData.evaluation && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#1a365d] mb-3 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      退乘评价摘要
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-[#1a365d]">{printData.evaluation.avg}</span>
                        <span className="text-sm text-slate-500">/ 5.0 综合评分</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                        <div>服务质量：<strong>{printData.evaluation.serviceQuality}</strong></div>
                        <div>团队配合：<strong>{printData.evaluation.teamCooperation}</strong></div>
                        <div>安全合规：<strong>{printData.evaluation.safetyCompliance}</strong></div>
                      </div>
                      {printData.evaluation.summary && (
                        <p className="text-sm text-slate-600 mb-2">总结：{printData.evaluation.summary}</p>
                      )}
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>评价人：{printData.evaluation.evaluator}</span>
                        <span>时间：{printData.evaluation.time}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-10">
                  <div>
                    <p className="text-xs text-slate-500 mb-8">交班人签字：</p>
                    <div className="border-b border-slate-400 w-40"></div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-8">接班人签字：</p>
                    <div className="border-b border-slate-400 w-40"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
