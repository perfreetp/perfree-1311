import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import type {
  RelatedItem, RelatedItemType, PendingTaskHandoverRecord, HandoverBatch
} from '@/types'
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
  History,
  CheckSquare,
  Square,
  FileCheck,
  Archive,
  Eye,
  ArrowLeft,
  Volume2,
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

const BATCH_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

const BATCH_STATUS_TEXT: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '复核中',
  completed: '已完成',
}

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

function parseDateTimeToMinutes(t: string): number | null {
  const fullMatch = t.match(/(\d{1,2}):(\d{2})/)
  if (fullMatch) {
    const hh = parseInt(fullMatch[1])
    const mm = parseInt(fullMatch[2])
    if (!isNaN(hh) && !isNaN(mm)) return hh * 60 + mm
  }
  const parts = t.split(/[:：]/)
  if (parts.length < 2) return null
  const hh = parseInt(parts[0])
  const mm = parseInt(parts[1])
  if (isNaN(hh) || isNaN(mm)) return null
  return hh * 60 + mm
}

function isUrgentBroadcast(scheduledDateTime: string, now = new Date()): boolean {
  const target = parseDateTimeToMinutes(scheduledDateTime)
  if (target === null) return false
  const cur = now.getHours() * 60 + now.getMinutes()
  const diff = target - cur
  return diff >= 0 && diff <= 15
}

function formatTimeShort(scheduledDateTime: string): string {
  const match = scheduledDateTime.match(/(\d{1,2}):(\d{2})/)
  if (match) return `${match[1]}:${match[2]}`
  return scheduledDateTime
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
    addBroadcastItem,
    ticketSupplements,
    crewMembers,
    trainTask,
    handoverBatches,
    currentBatchId,
    createHandoverBatch,
    updateHandoverBatch,
    confirmRoleInBatch,
    completeHandoverBatch,
    setCurrentBatchId,
  } = useStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'evaluation' | 'batches' | 'review'>('overview')
  const [overviewMode, setOverviewMode] = useState<'summary' | 'byRole'>('summary')
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formAuthor, setFormAuthor] = useState('')
  const [formRelatedItems, setFormRelatedItems] = useState<RelatedItem[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printBatchId, setPrintBatchId] = useState<string | null>(null)
  const [showBatchCreateModal, setShowBatchCreateModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [viewingBatchId, setViewingBatchId] = useState<string | null>(null)
  const [batchFormHandoverPerson, setBatchFormHandoverPerson] = useState('')
  const [batchFormSuccessorPerson, setBatchFormSuccessorPerson] = useState('')

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
  const [pendingTaskRecords, setPendingTaskRecords] = useState<PendingTaskHandoverRecord[]>([])

  const currentBatch = useMemo(() => {
    if (!currentBatchId) return handoverBatches.find(b => b.id === currentBatchId) || null
    return null
  }, [currentBatchId, handoverBatches])

  const viewingBatch = useMemo(() => {
    if (viewingBatchId) return handoverBatches.find(b => b.id === viewingBatchId) || null
    return null
  }, [viewingBatchId, handoverBatches])

  const toggleRelatedItem = (item: RelatedItem) => {
    setFormRelatedItems((prev) =>
      prev.some((i) => i.id === item.id && i.type === item.type)
        ? prev.filter((i) => !(i.id === item.id && i.type === item.type)
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
    const pendingBroadcasts = broadcastItems.filter(b => !b.broadcasted)
    return {
      total: pendingEmergencies.length + pendingComplaints.length + pendingLost.length + lowStockUnconfirmed.length + pendingBroadcasts.length,
      emergencies: pendingEmergencies,
      complaints: pendingComplaints,
      lostItems: pendingLost,
      lowStock: lowStockUnconfirmed,
      broadcasts: pendingBroadcasts,
    }
  }, [emergencyReports, complaints, lostItems, foodItems, broadcastItems])

  const initPendingTaskRecords = () => {
    const records: PendingTaskHandoverRecord[] = []
    pendingTasksSummary.emergencies.forEach(e => {
      records.push({ id: e.id, type: '异常上报', title: `${e.location} ${e.type}`, handoverType: 'pending' })
    })
    pendingTasksSummary.complaints.forEach(c => {
      records.push({ id: c.id, type: '投诉记录', title: c.content.substring(0, 30), handoverType: 'pending' })
    })
    pendingTasksSummary.lostItems.forEach(l => {
      records.push({ id: l.id, type: '遗失物品', title: l.description.substring(0, 30), handoverType: 'pending' })
    })
    pendingTasksSummary.lowStock.forEach(f => {
      records.push({ id: f.id, type: '低库存', title: `${f.name}库存${f.stock}`, handoverType: 'pending' })
    })
    pendingTasksSummary.broadcasts.forEach(b => {
      records.push({ id: b.id, type: '广播事项', title: b.content.substring(0, 30), handoverType: 'pending' })
    })
    setPendingTaskRecords(records)
  }

  const handleSubmitEvaluation = () => {
    if (!evaluator.trim() || !summary.trim()) return
    if (pendingTasksSummary.total > 0 && !showRiskWarning) {
      initPendingTaskRecords()
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

  const handleCreateBatch = () => {
    if (!batchFormHandoverPerson.trim() || !batchFormSuccessorPerson.trim()) return
    const writtenItems = pendingTaskRecords.filter(r => r.handoverType === 'written')
    if (writtenItems.length > 0) {
      alert(`有 ${writtenItems.length} 项需要补交接备注，请先处理`)
      return
    }
    const batchId = createHandoverBatch({
      handoverPerson: batchFormHandoverPerson.trim(),
      successorPerson: batchFormSuccessorPerson.trim(),
      pendingTaskRecords,
    })
    updateHandoverBatch(batchId, { status: 'submitted', submittedAt: new Date().toLocaleString('zh-CN') })
    setShowBatchCreateModal(false)
    setBatchFormHandoverPerson('')
    setBatchFormSuccessorPerson('')
    setActiveTab('batches')
  }

  const handleTogglePendingHandoverType = (id: string, handoverType: 'verbal' | 'written' | 'pending') => {
    setPendingTaskRecords(prev => prev.map(r => r.id === id ? { ...r, handoverType } : r))
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
        subtitle: `${b.category} · 计划${formatTimeShort(b.scheduledDateTime)}`,
        status: isUrgentBroadcast(b.scheduledDateTime) ? '临近播放' : '待播放',
      })
    })

    return Object.values(result)
  }, [crewMembers, emergencyReports, complaints, lostItems, foodItems, broadcastItems])

  const getBatchPrintData = (batch: HandoverBatch | null) => {
    if (batch) {
      const avg = batch.evaluation
        ? (batch.evaluation.serviceQuality + batch.evaluation.teamCooperation + batch.evaluation.safetyCompliance) / 3
        : 0
      return {
        trainNo: batch.trainNo,
        departure: batch.departure,
        arrival: batch.arrival,
        date: batch.date,
        batchNo: batch.batchNo,
        handoverPerson: batch.handoverPerson,
        successorPerson: batch.successorPerson,
        unclosed: batch.unclosedItems.map(u => ({ type: u.type, title: u.title, location: u.location || '-', status: u.status, handler: u.handler, handoverType: batch.pendingTaskRecords.find(r => r.id === u.id && r.type === u.type)?.handoverType || 'pending' })),
        confirmed: batch.confirmedNotes.map(n => ({
          content: n.content,
          author: n.author,
          confirmer: n.confirmer,
          confirmTime: n.confirmTime || n.time,
          related: n.relatedItems?.map(r => r.title).join('、') || '',
        })),
        evaluation: batch.evaluation ? {
          avg: avg.toFixed(1),
          serviceQuality: batch.evaluation.serviceQuality,
          teamCooperation: batch.evaluation.teamCooperation,
          safetyCompliance: batch.evaluation.safetyCompliance,
          summary: batch.evaluation.summary,
          evaluator: batch.evaluation.evaluator,
          time: batch.evaluation.time,
        } : null,
        createdAt: batch.createdAt,
        roleConfirmations: batch.roleConfirmations,
      }
    }
    const unclosed = [
      ...emergencyReports.filter(e => e.status !== '已处理').map(e => ({ type: '异常上报', title: e.type, location: e.location, status: e.status, handler: e.reporter, handoverType: 'pending' })),
      ...complaints.filter(c => c.status !== '已解决').map(c => ({ type: '投诉记录', title: c.content, location: c.category, status: c.status, handler: c.handler, handoverType: 'pending' })),
      ...lostItems.filter(l => l.status === '待认领' || l.status === '已登记').map(l => ({ type: '遗失物品', title: l.description, location: l.location, status: l.status, handler: l.handler, handoverType: 'pending' })),
      ...foodItems.filter(f => f.stock <= f.threshold).map(f => ({ type: '低库存', title: `${f.name}库存${f.stock}`, location: f.category, status: f.stock <= f.threshold / 2 ? '严重不足' : '库存偏低', handler: '餐售员', handoverType: 'pending' })),
      ...broadcastItems.filter(b => !b.broadcasted).map(b => ({ type: '广播事项', title: b.content, location: b.category, status: '待播放', handler: '列车长', handoverType: 'pending' })),
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
      batchNo: currentBatch?.batchNo || '',
      handoverPerson: currentBatch?.handoverPerson || '',
      successorPerson: currentBatch?.successorPerson || '',
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
      createdAt: currentBatch?.createdAt || '',
      roleConfirmations: currentBatch?.roleConfirmations || [],
    }
  }

  const printData = useMemo(() => getBatchPrintData(viewingBatch || currentBatch), [viewingBatch, currentBatch, trainTask, emergencyReports, complaints, lostItems, foodItems, broadcastItems, handoverNotes, signOffEvaluation, evaluationExists])

  const handlePrint = () => {
    window.print()
  }

  const handleExportSheet = () => {
    const sections: string[][] = []
    sections.push(['=== 列车乘务交班单 ==='])
    sections.push(['车次', printData.trainNo])
    sections.push(['线路', `${printData.departure} → ${printData.arrival}`])
    sections.push(['日期', printData.date])
    if (printData.batchNo) sections.push(['批次号', printData.batchNo])
    if (printData.handoverPerson) sections.push(['交班人', printData.handoverPerson])
    if (printData.successorPerson) sections.push(['接班人', printData.successorPerson])
    sections.push([])

    sections.push(['--- 未闭环事项 ---'])
    const unclosedHeaders = ['分类', '事项', '位置/分类', '状态', '处理人', '交接方式']
    sections.push(unclosedHeaders)
    printData.unclosed.forEach(u => {
      const handoverText = u.handoverType === 'verbal' ? '口头交接' : u.handoverType === 'written' ? '书面交接' : '未确认'
      sections.push([u.type, u.title, u.location, u.status, u.handler, handoverText])
    })
    sections.push([])

    sections.push(['--- 已签收事项 ---'])
    const confirmedHeaders = ['交接内容', '交班人', '接班人', '确认时间', '关联事项']
    sections.push(confirmedHeaders)
    printData.confirmed.forEach(c => {
      sections.push([c.content, c.author, c.confirmer || '', c.confirmTime, c.related])
    })
    sections.push([])

    if (printData.evaluation) {
      sections.push(['--- 退乘评价摘要 ---'])
      sections.push(['综合评分', `${printData.evaluation.avg}/5`])
      sections.push(['服务质量', String(printData.evaluation.serviceQuality)])
      sections.push(['团队配合', String(printData.evaluation.teamCooperation)])
      sections.push(['安全合规', String(printData.evaluation.safetyCompliance)])
      sections.push(['评价人', printData.evaluation.evaluator])
      sections.push(['评价时间', printData.evaluation.time])
      sections.push(['评价摘要', printData.evaluation.summary])
      sections.push([])
    }

    if (printData.roleConfirmations.length > 0) {
      sections.push(['--- 岗位复核情况 ---'])
      sections.push(['岗位', '负责人', '复核状态', '复核时间'])
      printData.roleConfirmations.forEach(rc => {
        sections.push([rc.role, rc.name, rc.confirmed ? '已复核' : '待复核', rc.confirmTime || ''])
      })
      sections.push([])
    }

    const csv = sections.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeDate = printData.date.replace(/\//g, '-')
    link.download = `交班单_${printData.trainNo}_${printData.batchNo || new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
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

  const handleConfirmRole = (batchId: string, role: string, confirmer: string) => {
    confirmRoleInBatch(batchId, role, confirmer)
  }

  const handleCompleteBatch = (batchId: string) => {
    const batch = handoverBatches.find(b => b.id === batchId)
    if (!batch) return
    const allConfirmed = batch.roleConfirmations.every(rc => rc.confirmed)
    if (!allConfirmed) {
      alert('请先完成所有岗位的复核确认')
      return
    }
    completeHandoverBatch(batchId)
  }

  const allRoleItemsForBatch = (batch: HandoverBatch) => {
    return batch.roleConfirmations.map(rc => ({
      ...rc,
      items: batch.unclosedItems.filter(u => rc.itemIds.includes(u.id)),
    }))
  }
