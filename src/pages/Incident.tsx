import { useState } from 'react'
import {
  AlertTriangle,
  Plus,
  MapPin,
  Clock,
  User,
  ChevronRight,
  CheckCircle2,
  Radio,
  FileText,
  X,
} from 'lucide-react'
import { useStore } from '@/store'

type EmergencyReport = {
  id: string
  type: string
  location: string
  time: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: '上报中' | '处理中' | '已处理'
  reporter: string
  handoverInfo?: {
    noteId: string
    confirmer?: string
    confirmTime?: string
  }
}

type BroadcastItem = {
  id: string
  content: string
  scheduledTime: string
  broadcasted: boolean
  category: '到站提醒' | '寻人启事' | '安全提示' | '其他'
}

const severityOrder: Record<EmergencyReport['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const severityBorder: Record<EmergencyReport['severity'], string> = {
  low: 'border-l-blue-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
}

const severityBg: Record<EmergencyReport['severity'], string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const severityLabel: Record<EmergencyReport['severity'], string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
}

const statusStyle: Record<EmergencyReport['status'], string> = {
  上报中: 'bg-amber-100 text-amber-700',
  处理中: 'bg-blue-100 text-blue-700',
  已处理: 'bg-emerald-100 text-emerald-700',
}

const categoryStyle: Record<BroadcastItem['category'], string> = {
  到站提醒: 'bg-blue-100 text-blue-700',
  寻人启事: 'bg-amber-100 text-amber-700',
  安全提示: 'bg-red-100 text-red-700',
  其他: 'bg-slate-100 text-slate-700',
}

const statusFlow: EmergencyReport['status'][] = ['上报中', '处理中', '已处理']

function getNextStatus(current: EmergencyReport['status']): EmergencyReport['status'] | null {
  const idx = statusFlow.indexOf(current)
  if (idx < statusFlow.length - 1) return statusFlow[idx + 1]
  return null
}

const emptyReportForm = {
  type: '设备故障',
  location: '',
  description: '',
  severity: 'medium' as EmergencyReport['severity'],
  reporter: '',
}

const emptyBroadcastForm = {
  content: '',
  scheduledTime: '',
  category: '到站提醒' as BroadcastItem['category'],
}

export default function Incident() {
  const {
    emergencyReports,
    broadcastItems,
    addEmergencyReport,
    updateEmergencyStatus,
    toggleBroadcast,
    addBroadcastItem,
  } = useStore()

  const [activeTab, setActiveTab] = useState<'emergency' | 'broadcast'>('emergency')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportForm, setReportForm] = useState(emptyReportForm)
  const [showBroadcastForm, setShowBroadcastForm] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState(emptyBroadcastForm)

  const sortedReports = [...emergencyReports].sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return new Date(b.time).getTime() - new Date(a.time).getTime()
  })

  const handleSubmitReport = () => {
    if (!reportForm.location || !reportForm.description || !reportForm.reporter) return
    const report: EmergencyReport = {
      id: String(Date.now()),
      type: reportForm.type,
      location: reportForm.location,
      time: new Date().toISOString(),
      description: reportForm.description,
      severity: reportForm.severity,
      status: '上报中',
      reporter: reportForm.reporter,
    }
    addEmergencyReport(report)
    setReportForm(emptyReportForm)
    setShowReportModal(false)
  }

  const handleAdvanceStatus = (id: string, current: EmergencyReport['status']) => {
    const next = getNextStatus(current)
    if (next) updateEmergencyStatus(id, next)
  }

  const handleSubmitBroadcast = () => {
    if (!broadcastForm.content || !broadcastForm.scheduledTime) return
    const item: BroadcastItem = {
      id: String(Date.now()),
      content: broadcastForm.content,
      scheduledTime: broadcastForm.scheduledTime,
      broadcasted: false,
      category: broadcastForm.category,
    }
    addBroadcastItem(item)
    setBroadcastForm(emptyBroadcastForm)
    setShowBroadcastForm(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a365d]">异常上报</h1>
          <p className="mt-1 text-sm text-slate-500">列车乘务协作 · 突发情况与广播管理</p>
        </div>

        <div className="mb-6 flex border-b border-slate-200">
          <button
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'emergency'
                ? 'border-b-2 border-[#3b82f6] text-[#1a365d]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => setActiveTab('emergency')}
          >
            <AlertTriangle className="mr-2 inline-block h-4 w-4" />
            突发情况上报
          </button>
          <button
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'broadcast'
                ? 'border-b-2 border-[#3b82f6] text-[#1a365d]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => setActiveTab('broadcast')}
          >
            <Radio className="mr-2 inline-block h-4 w-4" />
            广播事项提醒
          </button>
        </div>

        {activeTab === 'emergency' && (
          <div>
            <button
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a365d] py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1e3f73] hover:shadow-xl active:scale-[0.98]"
              onClick={() => setShowReportModal(true)}
            >
              <AlertTriangle className="h-6 w-6" />
              紧急上报
            </button>

            {sortedReports.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="mb-3 h-12 w-12" />
                <p className="text-sm">暂无上报记录</p>
              </div>
            )}

            <div className="space-y-4">
              {sortedReports.map((report) => (
                <div
                  key={report.id}
                  className={`rounded-lg border border-l-4 border-slate-200 bg-white p-5 shadow-sm ${severityBorder[report.severity]}`}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityBg[report.severity]}`}>
                      {severityLabel[report.severity]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {report.type}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[report.status]}`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {report.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(report.time).toLocaleString('zh-CN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {report.reporter}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-slate-700">{report.description}</p>

                  {report.handoverInfo && (
                    <div className="mb-3 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2">
                      <span className="text-xs text-blue-600 font-medium">
                        {report.handoverInfo.confirmer
                          ? `已交接 · 确认人：${report.handoverInfo.confirmer}`
                          : '待交接 · 已关联交接备注'}
                      </span>
                      {report.handoverInfo.confirmTime && (
                        <span className="text-xs text-blue-400">· {report.handoverInfo.confirmTime}</span>
                      )}
                    </div>
                  )}

                  {report.status !== '已处理' && (
                    <button
                      className="flex items-center gap-1 rounded-md bg-[#1a365d] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1e3f73]"
                      onClick={() => handleAdvanceStatus(report.id, report.status)}
                    >
                      {getNextStatus(report.status)}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div>
            <button
              className="mb-6 flex items-center gap-2 rounded-lg bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98]"
              onClick={() => setShowBroadcastForm(true)}
            >
              <Plus className="h-4 w-4" />
              新增广播
            </button>

            {showBroadcastForm && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1a365d]">新增广播事项</h3>
                  <button
                    className="text-slate-400 hover:text-slate-600"
                    onClick={() => {
                      setShowBroadcastForm(false)
                      setBroadcastForm(emptyBroadcastForm)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">广播内容</label>
                    <textarea
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                      rows={2}
                      value={broadcastForm.content}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, content: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">计划时间</label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                        value={broadcastForm.scheduledTime}
                        onChange={(e) => setBroadcastForm((p) => ({ ...p, scheduledTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">类别</label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                        value={broadcastForm.category}
                        onChange={(e) =>
                          setBroadcastForm((p) => ({ ...p, category: e.target.value as BroadcastItem['category'] }))
                        }
                      >
                        <option value="到站提醒">到站提醒</option>
                        <option value="寻人启事">寻人启事</option>
                        <option value="安全提示">安全提示</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      onClick={() => {
                        setShowBroadcastForm(false)
                        setBroadcastForm(emptyBroadcastForm)
                      }}
                    >
                      取消
                    </button>
                    <button
                      className="rounded-md bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white hover:bg-blue-600"
                      onClick={handleSubmitBroadcast}
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              </div>
            )}

            {broadcastItems.length === 0 && !showBroadcastForm && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Radio className="mb-3 h-12 w-12" />
                <p className="text-sm">暂无广播事项</p>
              </div>
            )}

            <div className="relative ml-4 border-l-2 border-slate-200 pl-6">
              {broadcastItems.map((item) => (
                <div key={item.id} className="relative mb-6 last:mb-0">
                  <div
                    className={`absolute -left-[1.85rem] top-1 h-3 w-3 rounded-full border-2 ${
                      item.broadcasted ? 'border-emerald-500 bg-emerald-500' : 'border-amber-400 bg-amber-400'
                    }`}
                  />

                  <div
                    className={`rounded-lg border bg-white p-4 shadow-sm ${
                      item.broadcasted ? 'border-slate-100 opacity-60' : 'border-slate-200'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryStyle[item.category]}`}>
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(item.scheduledTime).toLocaleString('zh-CN')}
                      </span>
                    </div>

                    <p className={`mb-3 text-sm ${item.broadcasted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {item.content}
                    </p>

                    <button
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        item.broadcasted
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                      onClick={() => toggleBroadcast(item.id)}
                    >
                      {item.broadcasted ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          已播
                        </>
                      ) : (
                        '待播'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1a365d]">紧急上报</h2>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setShowReportModal(false)
                  setReportForm(emptyReportForm)
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">类型</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  value={reportForm.type}
                  onChange={(e) => setReportForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="设备故障">设备故障</option>
                  <option value="旅客突发疾病">旅客突发疾病</option>
                  <option value="安全隐患">安全隐患</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">严重程度</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  value={reportForm.severity}
                  onChange={(e) =>
                    setReportForm((p) => ({ ...p, severity: e.target.value as EmergencyReport['severity'] }))
                  }
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">发生位置</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  placeholder="如：3号车厢"
                  value={reportForm.location}
                  onChange={(e) => setReportForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">情况描述</label>
                <textarea
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  rows={3}
                  placeholder="请详细描述突发情况..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">上报人</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  placeholder="请输入姓名"
                  value={reportForm.reporter}
                  onChange={(e) => setReportForm((p) => ({ ...p, reporter: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setShowReportModal(false)
                  setReportForm(emptyReportForm)
                }}
              >
                取消
              </button>
              <button
                className="rounded-md bg-[#1a365d] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#1e3f73]"
                onClick={handleSubmitReport}
              >
                提交上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
