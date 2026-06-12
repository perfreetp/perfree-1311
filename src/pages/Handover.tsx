import { useState } from 'react'
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
  } = useStore()

  const [activeTab, setActiveTab] = useState<'notes' | 'evaluation'>('notes')
  const [showForm, setShowForm] = useState(false)
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formAuthor, setFormAuthor] = useState('')
  const [formRelatedItems, setFormRelatedItems] = useState<RelatedItem[]>([])

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

  const handleSubmitEvaluation = () => {
    if (!evaluator.trim() || !summary.trim()) return
    setSignOffEvaluation({
      serviceQuality,
      teamCooperation,
      safetyCompliance,
      summary,
      evaluator,
      time: new Date().toLocaleString('zh-CN'),
    })
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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-[#1a365d] p-2.5">
            <ClipboardList className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[#1a365d]">交接退乘</h1>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
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

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
              >
                <Plus size={16} />
                新增备注
              </button>
            </div>

            {showForm && (
              <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
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
          </div>
        )}
      </div>
    </div>
  )
}
