import { useState } from 'react'
import { useStore } from '@/store'
import {
  Train,
  MapPin,
  Calendar,
  AlertCircle,
  Users,
  ClipboardList,
  UserCheck,
  Check,
  Clock,
} from 'lucide-react'

const tabs = [
  { key: 'task', label: '车次任务单', icon: ClipboardList },
  { key: 'signin', label: '人员签到', icon: UserCheck },
  { key: 'passengers', label: '重点旅客名单', icon: Users },
] as const

type TabKey = (typeof tabs)[number]['key']

const passengerTypeConfig: Record<string, { label: string; className: string }> = {
  高龄旅客: { label: '高龄旅客', className: 'bg-amber-100 text-amber-700' },
  孕妇: { label: '孕妇', className: 'bg-pink-100 text-pink-700' },
  VIP: { label: 'VIP', className: 'bg-purple-100 text-purple-700' },
  儿童: { label: '儿童', className: 'bg-sky-100 text-sky-700' },
  轮椅旅客: { label: '轮椅旅客', className: 'bg-blue-100 text-blue-700' },
  特殊饮食: { label: '特殊饮食', className: 'bg-emerald-100 text-emerald-700' },
}

const avatarColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-rose-500',
]

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function formatTime(timeStr: string | undefined) {
  return timeStr || '--:--'
}

export default function Preparation() {
  const [activeTab, setActiveTab] = useState<TabKey>('task')
  const { trainTask, crewMembers, keyPassengers, signInCrew } = useStore()

  const signedCount = crewMembers.filter((m) => m.signedIn).length
  const totalCount = crewMembers.length
  const signInRate = totalCount > 0 ? (signedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1a365d] text-white px-6 py-4 shadow-lg">
        <h1 className="text-xl font-bold tracking-wide">出乘准备</h1>
        <p className="text-blue-200 text-sm mt-0.5">{trainTask.trainNo} 乘务组工作台</p>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5">
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 mb-5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1a365d] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'task' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-gradient-to-br from-[#1a365d] to-[#2d4a7a] text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Train size={20} className="text-blue-300" />
                <span className="text-lg font-bold">{trainTask.trainNo}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <MapPin size={18} className="text-blue-300 shrink-0" />
                  <div>
                    <p className="text-blue-200 text-xs">运行区间</p>
                    <p className="font-semibold text-sm">
                      {trainTask.departure} → {trainTask.arrival}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <Calendar size={18} className="text-blue-300 shrink-0" />
                  <div>
                    <p className="text-blue-200 text-xs">日期</p>
                    <p className="font-semibold text-sm">{trainTask.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <Train size={18} className="text-blue-300 shrink-0" />
                  <div>
                    <p className="text-blue-200 text-xs">编组</p>
                    <p className="font-semibold text-sm">{trainTask.formation}</p>
                  </div>
                </div>
              </div>
            </div>

            {trainTask.notes.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#1a365d] mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  任务注意事项
                </h3>
                <ul className="space-y-2.5">
                  {trainTask.notes.map((note, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
                    >
                      <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'signin' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#1a365d]">签到进度</h3>
                <span className="text-sm text-slate-500">
                  {signedCount} / {totalCount}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${signInRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {crewMembers.map((member) => {
                const colorClass = getAvatarColor(member.id)
                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center text-center transition-shadow hover:shadow-md"
                  >
                    <div
                      className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-lg mb-2.5`}
                    >
                      {member.avatar}
                    </div>
                    <p className="font-semibold text-sm text-slate-800">{member.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{member.role}</p>

                    {member.signedIn ? (
                      <div className="mt-3 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-medium">
                        <Check size={12} />
                        已签到
                        {member.signInTime && (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Clock size={10} />
                            {formatTime(member.signInTime)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => signInCrew(member.id)}
                        className="mt-3 bg-slate-100 hover:bg-blue-500 text-slate-500 hover:text-white px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-200"
                      >
                        签到
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'passengers' && (
          <div className="animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-[#1a365d]">
                  重点旅客 ({keyPassengers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="text-left px-5 py-3 font-medium">姓名</th>
                      <th className="text-left px-5 py-3 font-medium">类型</th>
                      <th className="text-center px-5 py-3 font-medium">车厢</th>
                      <th className="text-center px-5 py-3 font-medium">座位</th>
                      <th className="text-left px-5 py-3 font-medium">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyPassengers.map((p) => {
                      const config = passengerTypeConfig[p.type] ?? {
                        label: p.type,
                        className: 'bg-slate-100 text-slate-600',
                      }
                      return (
                        <tr
                          key={p.id}
                          className="border-t border-slate-50 hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
                            >
                              {config.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-600">{p.carriage}</td>
                          <td className="px-5 py-3.5 text-center text-slate-600">{p.seat}</td>
                          <td className="px-5 py-3.5 text-slate-500">{p.notes}</td>
                        </tr>
                      )
                    })}
                    {keyPassengers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                          暂无重点旅客
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
