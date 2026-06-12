import { useState } from 'react'
import {
  PackageSearch,
  Ticket,
  MessageSquareWarning,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react'
import { useStore } from '@/store'

type TabKey = 'lost' | 'ticket' | 'complaint'

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'lost', label: '遗失物登记', icon: <PackageSearch className="w-4 h-4" /> },
  { key: 'ticket', label: '补票协助', icon: <Ticket className="w-4 h-4" /> },
  { key: 'complaint', label: '投诉处理', icon: <MessageSquareWarning className="w-4 h-4" /> },
]

const lostStatusColor: Record<string, string> = {
  待认领: 'bg-amber-100 text-amber-700',
  已登记: 'bg-blue-100 text-blue-700',
  已移交: 'bg-purple-100 text-purple-700',
  已归还: 'bg-emerald-100 text-emerald-700',
}

const ticketTypeColor: Record<string, string> = {
  无票乘车: 'bg-red-100 text-red-700',
  越站乘车: 'bg-amber-100 text-amber-700',
  变更席别: 'bg-blue-100 text-blue-700',
}

const ticketStatusColor: Record<string, string> = {
  待处理: 'bg-amber-100 text-amber-700',
  处理中: 'bg-blue-100 text-blue-700',
  已完成: 'bg-emerald-100 text-emerald-700',
}

const priorityColor: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
}

const priorityLabel: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export default function Service() {
  const [activeTab, setActiveTab] = useState<TabKey>('lost')

  const {
    lostItems,
    addLostItem,
    updateLostItemStatus,
    ticketSupplements,
    addTicketSupplement,
    updateTicketSupplementStatus,
    complaints,
    addComplaint,
    updateComplaintStatus,
  } = useStore()

  const [showLostModal, setShowLostModal] = useState(false)
  const [lostForm, setLostForm] = useState({ description: '', location: '', handler: '' })

  const [ticketForm, setTicketForm] = useState({
    passenger: '',
    carriage: '',
    seat: '',
    type: '无票乘车' as '无票乘车' | '越站乘车' | '变更席别',
    amount: '',
  })

  const [expandedComplaint, setExpandedComplaint] = useState<string | null>(null)
  const [complaintResult, setComplaintResult] = useState<Record<string, string>>({})
  const [ticketAmountError, setTicketAmountError] = useState(false)

  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/[^\d.]/g, '')
    const match = sanitized.match(/^\d*\.?\d{0,2}/)
    const finalValue = match ? match[0] : ''
    setTicketForm({ ...ticketForm, amount: finalValue })
    if (finalValue) {
      const num = Number(finalValue)
      setTicketAmountError(!(num > 0 && isFinite(num)))
    } else {
      setTicketAmountError(false)
    }
  }

  const handleAddLostItem = () => {
    if (!lostForm.description || !lostForm.location) return
    addLostItem({
      id: Date.now().toString(),
      description: lostForm.description,
      location: lostForm.location,
      foundTime: new Date().toLocaleString('zh-CN'),
      status: '待认领',
      handler: lostForm.handler,
    })
    setLostForm({ description: '', location: '', handler: '' })
    setShowLostModal(false)
  }

  const handleAddTicket = () => {
    if (!ticketForm.passenger || !ticketForm.amount) return
    const amountNum = Number(ticketForm.amount)
    if (!(amountNum > 0 && isFinite(amountNum))) {
      setTicketAmountError(true)
      return
    }
    addTicketSupplement({
      id: Date.now().toString(),
      passenger: ticketForm.passenger,
      carriage: ticketForm.carriage,
      seat: ticketForm.seat,
      type: ticketForm.type,
      amount: amountNum,
      status: '待处理',
    })
    setTicketForm({ passenger: '', carriage: '', seat: '', type: '无票乘车', amount: '' })
    setTicketAmountError(false)
  }

  const handleMoveComplaint = (id: string, newStatus: '处理中' | '已解决') => {
    const result = complaintResult[id] || ''
    updateComplaintStatus(id, newStatus, result)
  }

  const totalAmount = ticketSupplements.reduce((sum, t) => sum + (t.status === '已完成' ? t.amount : 0), 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#1a365d] px-6 py-5">
        <h1 className="text-xl font-bold text-white">旅客服务</h1>
        <p className="text-blue-200 text-sm mt-1">遗失物登记 · 补票协助 · 投诉处理</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#1a365d] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'lost' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1a365d]">遗失物品列表</h2>
              <button
                onClick={() => setShowLostModal(true)}
                className="flex items-center gap-1.5 bg-[#3b82f6] hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                登记遗失物
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">物品描述</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">拾得位置</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">拾得时间</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">状态</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">处理人</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {lostItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                        暂无遗失物记录
                      </td>
                    </tr>
                  ) : (
                    lostItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-slate-800">{item.description}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{item.location}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{item.foundTime}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${lostStatusColor[item.status]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{item.handler || '-'}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={item.status}
                            onChange={(e) => updateLostItemStatus(item.id, e.target.value as any)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="待认领">待认领</option>
                            <option value="已登记">已登记</option>
                            <option value="已移交">已移交</option>
                            <option value="已归还">已归还</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {showLostModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-semibold text-[#1a365d]">登记遗失物</h3>
                    <button onClick={() => setShowLostModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">物品描述</label>
                      <input
                        value={lostForm.description}
                        onChange={(e) => setLostForm({ ...lostForm, description: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="请输入物品描述"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">拾得位置</label>
                      <input
                        value={lostForm.location}
                        onChange={(e) => setLostForm({ ...lostForm, location: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="请输入拾得位置"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">处理人</label>
                      <input
                        value={lostForm.handler}
                        onChange={(e) => setLostForm({ ...lostForm, handler: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="请输入处理人姓名"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowLostModal(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddLostItem}
                      className="px-4 py-2 text-sm bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      确认登记
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ticket' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1a365d]">补票记录</h2>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">
                  已收金额合计：<span className="font-bold text-emerald-800">¥{totalAmount}</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-slate-200">
              <h3 className="text-sm font-semibold text-[#1a365d] mb-4">快速补票</h3>
              <div className="grid grid-cols-6 gap-3">
                <input
                  value={ticketForm.passenger}
                  onChange={(e) => setTicketForm({ ...ticketForm, passenger: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="旅客姓名"
                />
                <input
                  value={ticketForm.carriage}
                  onChange={(e) => setTicketForm({ ...ticketForm, carriage: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="车厢号"
                />
                <input
                  value={ticketForm.seat}
                  onChange={(e) => setTicketForm({ ...ticketForm, seat: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="座位号"
                />
                <select
                  value={ticketForm.type}
                  onChange={(e) => setTicketForm({ ...ticketForm, type: e.target.value as any })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="无票乘车">无票乘车</option>
                  <option value="越站乘车">越站乘车</option>
                  <option value="变更席别">变更席别</option>
                </select>
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={ticketForm.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                      ticketAmountError ? 'border-red-400' : 'border-slate-300'
                    }`}
                    placeholder="金额(元)"
                  />
                  {ticketAmountError && (
                    <span className="text-xs text-red-500 mt-1">请输入有效正数金额</span>
                  )}
                </div>
                <button
                  onClick={handleAddTicket}
                  className="flex items-center justify-center gap-1.5 bg-[#3b82f6] hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">旅客</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">车厢</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">座位</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">类型</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">金额</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">状态</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketSupplements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                        暂无补票记录
                      </td>
                    </tr>
                  ) : (
                    ticketSupplements.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-slate-800">{t.passenger}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{t.carriage}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{t.seat}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketTypeColor[t.type]}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-800">¥{t.amount}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ticketStatusColor[t.status]}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={t.status}
                            onChange={(e) => updateTicketSupplementStatus(t.id, e.target.value as any)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="待处理">待处理</option>
                            <option value="处理中">处理中</option>
                            <option value="已完成">已完成</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'complaint' && (
          <div>
            <h2 className="text-lg font-semibold text-[#1a365d] mb-4">投诉看板</h2>
            <div className="grid grid-cols-3 gap-5">
              {(['待处理', '处理中', '已解决'] as const).map((status) => (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-[#1a365d]">{status}</h3>
                    <span className="bg-slate-100 text-slate-500 text-xs font-medium px-2 py-0.5 rounded-full">
                      {complaints.filter((c) => c.status === status).length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {complaints
                      .filter((c) => c.status === status)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() =>
                            setExpandedComplaint(expandedComplaint === c.id ? null : c.id)
                          }
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-slate-800">{c.passenger}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[c.priority]}`}>
                              {priorityLabel[c.priority]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2 line-clamp-2">{c.content}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{c.category}</span>
                            <span className="text-xs text-slate-400">{c.time}</span>
                          </div>

                          {expandedComplaint === c.id && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                              <p className="text-sm text-slate-700">{c.content}</p>
                              {c.result && (
                                <div className="bg-slate-50 rounded-lg p-3">
                                  <p className="text-xs text-slate-500 mb-1">处理结果</p>
                                  <p className="text-sm text-slate-700">{c.result}</p>
                                </div>
                              )}
                              {status !== '已解决' && (
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">填写处理结果</label>
                                  <textarea
                                    value={complaintResult[c.id] || ''}
                                    onChange={(e) =>
                                      setComplaintResult({ ...complaintResult, [c.id]: e.target.value })
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                                    rows={2}
                                    placeholder="请输入处理结果"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                              <div className="flex gap-2">
                                {status === '待处理' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMoveComplaint(c.id, '处理中')
                                    }}
                                    className="px-3 py-1.5 text-xs bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg transition-colors"
                                  >
                                    开始处理
                                  </button>
                                )}
                                {status === '处理中' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMoveComplaint(c.id, '已解决')
                                    }}
                                    className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                                  >
                                    标记解决
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-center mt-2">
                            {expandedComplaint === c.id ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    {complaints.filter((c) => c.status === status).length === 0 && (
                      <div className="bg-white/50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                        <p className="text-sm text-slate-400">暂无投诉</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
