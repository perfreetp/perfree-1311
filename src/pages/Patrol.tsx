import { useState } from 'react'
import { useStore } from '@/store'
import {
  ClipboardCheck,
  SprayCan,
  Train,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  ChevronRight,
  Clock,
  User,
  MapPin,
} from 'lucide-react'

const tabs = [
  { key: 'patrol', label: '巡视记录', icon: ClipboardCheck },
  { key: 'hygiene', label: '卫生检查', icon: SprayCan },
  { key: 'station', label: '站停作业', icon: Train },
] as const

type TabKey = (typeof tabs)[number]['key']

const statusConfig = {
  normal: { label: '正常', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  warning: { label: '警告', bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
  resolved: { label: '已处理', bg: 'bg-blue-100', text: 'text-blue-700', icon: CircleDot },
}

const borderColors = {
  normal: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  resolved: 'border-l-blue-500',
}

function scoreBadge(score: number) {
  if (score >= 5) return 'bg-emerald-100 text-emerald-700'
  if (score >= 4) return 'bg-blue-100 text-blue-700'
  if (score >= 3) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function Patrol() {
  const [activeTab, setActiveTab] = useState<TabKey>('patrol')
  const { patrolRecords, hygieneChecks, stationStops, addPatrolRecord, addHygieneCheck, toggleStationTask } = useStore()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a365d]">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a365d]">车厢巡视</h1>
        </div>

        <div className="mb-6 flex gap-2 rounded-xl bg-white p-1.5 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1a365d] text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'patrol' && (
          <div className="space-y-4">
            {patrolRecords.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-slate-400 shadow-sm">
                <ClipboardCheck className="mb-3 h-12 w-12" />
                <p className="text-sm">暂无巡视记录</p>
              </div>
            )}
            {patrolRecords.map((record) => {
              const config = statusConfig[record.status]
              const StatusIcon = config.icon
              return (
                <div
                  key={record.id}
                  className={`rounded-xl border-l-4 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${borderColors[record.status]}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-[#1a365d] px-2.5 py-1 text-xs font-semibold text-white">
                        {record.carriage}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        {record.inspector}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {record.time}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{record.findings}</p>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'hygiene' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#1a365d]/5">
                    <th className="px-4 py-3 text-left font-semibold text-[#1a365d]">车厢</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#1a365d]">地面</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#1a365d]">座椅</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#1a365d]">卫生间</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#1a365d]">垃圾桶</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#1a365d]">综合评分</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#1a365d]">检查人</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#1a365d]">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {hygieneChecks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        暂无卫生检查记录
                      </td>
                    </tr>
                  )}
                  {hygieneChecks.map((check) => (
                    <tr
                      key={check.id}
                      className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-[#1a365d] px-2 py-0.5 text-xs font-semibold text-white">
                          {check.carriage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge(check.floor)}`}>
                          {check.floor}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge(check.seat)}`}>
                          {check.seat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge(check.toilet)}`}>
                          {check.toilet}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge(check.trash)}`}>
                          {check.trash}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block min-w-[2.5rem] rounded-lg px-2.5 py-1 text-sm font-bold ${
                            check.overall >= 5
                              ? 'bg-emerald-500 text-white'
                              : check.overall >= 4
                                ? 'bg-blue-500 text-white'
                                : check.overall >= 3
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-red-500 text-white'
                          }`}
                        >
                          {check.overall}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {check.checker}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {check.time}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'station' && (
          <div className="space-y-6">
            {stationStops.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-slate-400 shadow-sm">
                <Train className="mb-3 h-12 w-12" />
                <p className="text-sm">暂无站停作业记录</p>
              </div>
            )}
            <div className="flex gap-4 overflow-x-auto pb-4">
              {stationStops.map((stop, idx) => {
                const completedCount = stop.tasks.filter((t) => t.completed).length
                const totalCount = stop.tasks.length
                const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
                return (
                  <div
                    key={stop.id}
                    className="min-w-[280px] flex-shrink-0 rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="border-b border-slate-100 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#3b82f6]" />
                        <h3 className="text-base font-bold text-[#1a365d]">{stop.station}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{stop.arriveTime}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>{stop.departTime}</span>
                      </div>
                    </div>

                    <div className="px-4 pt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">作业进度</span>
                        <span
                          className={`text-xs font-bold ${
                            completedCount === totalCount ? 'text-emerald-600' : 'text-[#3b82f6]'
                          }`}
                        >
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            completedCount === totalCount ? 'bg-emerald-500' : 'bg-[#3b82f6]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 px-4 pb-4">
                      {stop.tasks.map((task) => (
                        <label
                          key={task.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleStationTask(stop.id, task.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                          />
                          <span
                            className={`text-sm ${
                              task.completed
                                ? 'text-slate-400 line-through'
                                : 'text-slate-700'
                            }`}
                          >
                            {task.name}
                          </span>
                          {task.completed && (
                            <CheckCircle2 className="ml-auto h-4 w-4 flex-shrink-0 text-emerald-500" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
