export interface TrainTask {
  id: string
  trainNo: string
  departure: string
  arrival: string
  date: string
  formation: string
  notes: string[]
}

export interface CrewMember {
  id: string
  name: string
  role: string
  avatar: string
  signedIn: boolean
  signInTime?: string
}

export interface KeyPassenger {
  id: string
  name: string
  type: string
  carriage: string
  seat: string
  notes: string
}

export interface PatrolRecord {
  id: string
  carriage: string
  inspector: string
  time: string
  findings: string
  status: 'normal' | 'warning' | 'resolved'
}

export interface HygieneCheck {
  id: string
  carriage: string
  floor: number
  seat: number
  toilet: number
  trash: number
  overall: number
  checker: string
  time: string
}

export interface StationTask {
  id: string
  name: string
  completed: boolean
}

export interface StationStop {
  id: string
  station: string
  arriveTime: string
  departTime: string
  tasks: StationTask[]
}

export interface HandoverInfo {
  noteId: string
  confirmer?: string
  confirmTime?: string
}

export interface LostItem {
  id: string
  description: string
  location: string
  foundTime: string
  status: '待认领' | '已登记' | '已移交' | '已归还'
  handler: string
  handoverInfo?: HandoverInfo
}

export interface TicketSupplement {
  id: string
  passenger: string
  carriage: string
  seat: string
  type: '无票乘车' | '越站乘车' | '变更席别'
  amount: number
  status: '未收款' | '处理中' | '已完成'
  registrationTime?: string
  handoverInfo?: HandoverInfo
}

export interface Complaint {
  id: string
  passenger: string
  content: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: '待处理' | '处理中' | '已解决'
  handler: string
  result: string
  time: string
  handoverInfo?: HandoverInfo
}

export interface FoodItem {
  id: string
  name: string
  category: string
  stock: number
  price: number
  threshold: number
  handoverInfo?: HandoverInfo
}

export interface SalesRecord {
  id: string
  item: string
  quantity: number
  amount: number
  payment: '现金' | '微信' | '支付宝' | '刷卡'
  carriage: string
  time: string
}

export interface EmergencyReport {
  id: string
  type: string
  location: string
  time: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: '上报中' | '处理中' | '已处理'
  reporter: string
  handoverInfo?: HandoverInfo
}

export interface BroadcastItem {
  id: string
  content: string
  scheduledTime: string
  scheduledDateTime: string
  broadcasted: boolean
  actualPlayTime?: string
  category: '到站提醒' | '寻人启事' | '安全提示' | '其他'
}

export type RelatedItemType = '异常上报' | '投诉记录' | '遗失物品' | '低库存'

export interface RelatedItem {
  id: string
  type: RelatedItemType
  title: string
}

export interface HandoverNote {
  id: string
  content: string
  category: string
  author: string
  time: string
  confirmed: boolean
  confirmer?: string
  confirmTime?: string
  relatedItems?: RelatedItem[]
}

export interface SignOffEvaluation {
  serviceQuality: number
  teamCooperation: number
  safetyCompliance: number
  summary: string
  evaluator: string
  time: string
}

export type PendingTaskHandoverType = 'verbal' | 'written' | 'pending'

export interface PendingTaskHandoverRecord {
  id: string
  type: '异常上报' | '投诉记录' | '遗失物品' | '低库存' | '广播事项'
  title: string
  handoverType: PendingTaskHandoverType
}

export interface BatchSnapshotItem {
  id: string
  type: string
  title: string
  status: string
  handler: string
  location?: string
  handoverInfo?: HandoverInfo
}

export interface BatchRoleConfirmation {
  role: string
  name: string
  confirmed: boolean
  confirmTime?: string
  itemIds: string[]
}

export interface HandoverBatch {
  id: string
  batchNo: string
  trainNo: string
  departure: string
  arrival: string
  date: string
  handoverPerson: string
  successorPerson: string
  createdAt: string
  submittedAt?: string
  completedAt?: string
  status: 'draft' | 'submitted' | 'reviewing' | 'completed'
  unclosedItems: BatchSnapshotItem[]
  confirmedNotes: HandoverNote[]
  evaluation?: SignOffEvaluation
  pendingTaskRecords: PendingTaskHandoverRecord[]
  roleConfirmations: BatchRoleConfirmation[]
}
