import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import type { FoodItem, SalesRecord as SalesRecordType } from '@/types'
import {
  UtensilsCrossed, ShoppingCart, Plus, Minus, AlertTriangle,
  DollarSign, Receipt, TrendingUp, Package, Filter, AlertOctagon
} from 'lucide-react'

type TabKey = 'stock' | 'sales'
type CategoryFilter = '全部' | '热食' | '饮品' | '零食'

const categoryColors: Record<string, string> = {
  '热食': 'bg-orange-100 text-orange-700',
  '饮品': 'bg-blue-100 text-blue-700',
  '零食': 'bg-purple-100 text-purple-700',
}

const paymentColors: Record<string, string> = {
  '现金': 'bg-green-100 text-green-700',
  '微信': 'bg-emerald-100 text-emerald-700',
  '支付宝': 'bg-blue-100 text-blue-700',
  '刷卡': 'bg-purple-100 text-purple-700',
}

function getProgressColor(stock: number, threshold: number): string {
  if (stock <= threshold / 2) return 'bg-red-500'
  if (stock <= threshold) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function StockTab({ foodItems, updateFoodStock, categoryFilter, setCategoryFilter }: {
  foodItems: FoodItem[]
  updateFoodStock: (id: string, delta: number) => void
  categoryFilter: CategoryFilter
  setCategoryFilter: (f: CategoryFilter) => void
}) {
  const categories: CategoryFilter[] = ['全部', '热食', '饮品', '零食']
  const filtered = categoryFilter === '全部' ? foodItems : foodItems.filter(f => f.category === categoryFilter)

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              categoryFilter === cat
                ? 'bg-navy-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => {
          const maxStock = item.threshold * 3
          const percentage = Math.min((item.stock / maxStock) * 100, 100)
          const isLow = item.stock <= item.threshold

          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow relative">
              {isLow && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                    <AlertTriangle className="w-3 h-3" />
                    库存不足
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-navy-700/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-navy-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm truncate pr-16">{item.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[item.category] || 'bg-slate-100 text-slate-600'}`}>
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">库存</span>
                <span className="font-bold text-slate-800">{item.stock}</span>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full mb-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(item.stock, item.threshold)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {item.handoverInfo && (
                <div className="mb-3 bg-blue-50 rounded-lg p-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-blue-600 font-medium">
                    {item.handoverInfo.confirmer
                      ? `已交接 · ${item.handoverInfo.confirmer}`
                      : '待交接 · 已关联备注'}
                  </span>
                  {item.handoverInfo.confirmTime && (
                    <span className="text-[10px] text-blue-400">{item.handoverInfo.confirmTime}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-bold text-base">¥{item.price}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateFoodStock(item.id, -1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => updateFoodStock(item.id, 1)}
                    className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type TimeFilter = '全部' | '最近1小时' | '上午' | '下午'
type PaymentFilter = '全部' | SalesRecordType['payment']

function SalesTab({ foodItems, salesRecords, addSalesRecord }: {
  foodItems: FoodItem[]
  salesRecords: SalesRecordType[]
  addSalesRecord: (record: SalesRecordType) => boolean
}) {
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [payment, setPayment] = useState<SalesRecordType['payment']>('微信')
  const [carriage, setCarriage] = useState('')
  const [carriageFilter, setCarriageFilter] = useState<string>('全部')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('全部')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('全部')
  const [errorMsg, setErrorMsg] = useState('')

  const selectedFood = foodItems.find(f => f.id === selectedItem)
  const amount = selectedFood ? selectedFood.price * quantity : 0

  const totalSales = salesRecords.reduce((sum, r) => sum + r.amount, 0)
  const totalOrders = salesRecords.length
  const avgOrder = totalOrders > 0 ? (totalSales / totalOrders).toFixed(1) : '0'

  const uniqueCarriages = useMemo(() => {
    const set = new Set(salesRecords.map(r => r.carriage))
    return ['全部', ...Array.from(set)]
  }, [salesRecords])

  const paymentOptions: PaymentFilter[] = ['全部', '现金', '微信', '支付宝', '刷卡']
  const timeOptions: TimeFilter[] = ['全部', '最近1小时', '上午', '下午']

  const filteredRecords = useMemo(() => {
    const now = new Date()
    return salesRecords.filter(record => {
      if (carriageFilter !== '全部' && record.carriage !== carriageFilter) {
        return false
      }
      if (paymentFilter !== '全部' && record.payment !== paymentFilter) {
        return false
      }
      if (timeFilter !== '全部') {
        const [hh, mm] = record.time.split(':').map(Number)
        if (timeFilter === '上午') {
          if (hh >= 12) return false
        } else if (timeFilter === '下午') {
          if (hh < 12) return false
        } else if (timeFilter === '最近1小时') {
          const recordTime = new Date()
          recordTime.setHours(hh, mm, 0, 0)
          const diffMs = now.getTime() - recordTime.getTime()
          const diffHours = diffMs / (1000 * 60 * 60)
          if (diffHours > 1 || diffHours < 0) return false
        }
      }
      return true
    })
  }, [salesRecords, carriageFilter, paymentFilter, timeFilter])

  const resetFilters = () => {
    setCarriageFilter('全部')
    setPaymentFilter('全部')
    setTimeFilter('全部')
  }

  const handleSubmit = () => {
    if (!selectedFood || !carriage || quantity <= 0) return

    const record: SalesRecordType = {
      id: String(Date.now()),
      item: selectedFood.name,
      quantity,
      amount,
      payment,
      carriage: carriage.endsWith('车') ? carriage : `${carriage}车`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }

    const success = addSalesRecord(record)
    if (!success) {
      setErrorMsg(`库存不足（仅剩 ${selectedFood.stock} 份），请减少数量或更换餐品`)
      setTimeout(() => setErrorMsg(''), 4000)
      return
    }

    setSelectedItem('')
    setQuantity(1)
    setPayment('微信')
    setCarriage('')
    setErrorMsg('')
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">总销售额</p>
            <p className="text-xl font-bold text-slate-800">¥{totalSales}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">总笔数</p>
            <p className="text-xl font-bold text-slate-800">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">平均客单价</p>
            <p className="text-xl font-bold text-slate-800">¥{avgOrder}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              快速登记
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">餐品</label>
                <select
                  value={selectedItem}
                  onChange={e => setSelectedItem(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">选择餐品</option>
                  {foodItems.map(f => (
                    <option key={f.id} value={f.id}>{f.name} - ¥{f.price}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">数量</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">支付方式</label>
                <select
                  value={payment}
                  onChange={e => setPayment(e.target.value as SalesRecordType['payment'])}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="现金">现金</option>
                  <option value="微信">微信</option>
                  <option value="支付宝">支付宝</option>
                  <option value="刷卡">刷卡</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">车厢</label>
                <input
                  type="text"
                  placeholder="如：5车"
                  value={carriage}
                  onChange={e => setCarriage(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-500">合计金额</span>
                  <span className="text-lg font-bold text-blue-600">¥{amount}</span>
                </div>
                {errorMsg && (
                  <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs">
                    <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFood || !carriage}
                  className="w-full h-10 bg-navy-700 hover:bg-navy-700/90 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  登记销售
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">销售记录</h3>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Filter className="w-4 h-4" />
              </div>
              <div className="bg-white rounded border border-slate-200 px-3 py-1.5 flex items-center gap-2">
                <label className="text-xs text-slate-500">车厢</label>
                <select
                  value={carriageFilter}
                  onChange={e => setCarriageFilter(e.target.value)}
                  className="text-sm bg-transparent focus:outline-none text-slate-700"
                >
                  {uniqueCarriages.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white rounded border border-slate-200 px-3 py-1.5 flex items-center gap-2">
                <label className="text-xs text-slate-500">支付方式</label>
                <select
                  value={paymentFilter}
                  onChange={e => setPaymentFilter(e.target.value as PaymentFilter)}
                  className="text-sm bg-transparent focus:outline-none text-slate-700"
                >
                  {paymentOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white rounded border border-slate-200 px-3 py-1.5 flex items-center gap-2">
                <label className="text-xs text-slate-500">时间</label>
                <select
                  value={timeFilter}
                  onChange={e => setTimeFilter(e.target.value as TimeFilter)}
                  className="text-sm bg-transparent focus:outline-none text-slate-700"
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={resetFilters}
                className="ml-auto px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
              >
                重置筛选
              </button>
            </div>

            <div className="overflow-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">品名</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">数量</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">金额</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">支付方式</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">车厢</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecords.slice().reverse().map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-800 font-medium">{record.item}</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{record.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-blue-600 font-semibold">¥{record.amount}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${paymentColors[record.payment]}`}>
                          {record.payment}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{record.carriage}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{record.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const tabs: { key: TabKey; label: string; icon: typeof UtensilsCrossed }[] = [
  { key: 'stock', label: '餐品库存', icon: Package },
  { key: 'sales', label: '销售登记', icon: ShoppingCart },
]

export default function Catering() {
  const [activeTab, setActiveTab] = useState<TabKey>('stock')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('全部')
  const { foodItems, salesRecords, updateFoodStock, addSalesRecord } = useStore()

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-700 flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6" />
          餐售管理
        </h1>
        <p className="text-sm text-slate-500 mt-1">管理餐品库存与销售登记</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-navy-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'stock' && (
        <StockTab
          foodItems={foodItems}
          updateFoodStock={updateFoodStock}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />
      )}
      {activeTab === 'sales' && (
        <SalesTab
          foodItems={foodItems}
          salesRecords={salesRecords}
          addSalesRecord={addSalesRecord}
        />
      )}
    </div>
  )
}
