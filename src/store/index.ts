import { create } from 'zustand'
import type {
  TrainTask, CrewMember, KeyPassenger, PatrolRecord, HygieneCheck,
  StationStop, LostItem, TicketSupplement, Complaint, FoodItem,
  SalesRecord, EmergencyReport, BroadcastItem, HandoverNote, SignOffEvaluation
} from '@/types'

const STORAGE_KEY = 'train-crew-data'

interface PersistedData {
  trainTask: TrainTask
  crewMembers: CrewMember[]
  keyPassengers: KeyPassenger[]
  patrolRecords: PatrolRecord[]
  hygieneChecks: HygieneCheck[]
  stationStops: StationStop[]
  lostItems: LostItem[]
  ticketSupplements: TicketSupplement[]
  complaints: Complaint[]
  foodItems: FoodItem[]
  salesRecords: SalesRecord[]
  emergencyReports: EmergencyReport[]
  broadcastItems: BroadcastItem[]
  handoverNotes: HandoverNote[]
  signOffEvaluation: SignOffEvaluation
}

interface TrainCrewState extends PersistedData {
  signInCrew: (id: string) => void
  addPatrolRecord: (record: PatrolRecord) => void
  addHygieneCheck: (check: HygieneCheck) => void
  toggleStationTask: (stopId: string, taskId: string) => void
  addLostItem: (item: LostItem) => void
  updateLostItemStatus: (id: string, status: LostItem['status']) => void
  addTicketSupplement: (ticket: TicketSupplement) => void
  updateTicketSupplementStatus: (id: string, status: TicketSupplement['status']) => void
  addComplaint: (complaint: Complaint) => void
  updateComplaintStatus: (id: string, status: Complaint['status'], result: string) => void
  updateFoodStock: (id: string, delta: number) => void
  addSalesRecord: (record: SalesRecord) => boolean
  addEmergencyReport: (report: EmergencyReport) => void
  updateEmergencyStatus: (id: string, status: EmergencyReport['status']) => void
  toggleBroadcast: (id: string) => void
  addBroadcastItem: (item: BroadcastItem) => void
  addHandoverNote: (note: HandoverNote) => void
  confirmHandoverNote: (id: string, confirmer: string) => void
  setSignOffEvaluation: (evaluation: SignOffEvaluation) => void
}

const mockTrainTask: TrainTask = {
  id: '1',
  trainNo: 'G1234',
  departure: '北京南',
  arrival: '上海虹桥',
  date: '2026-06-12',
  formation: 'CR400AF型 16节编组',
  notes: [
    '本次列车为重点列车，请做好服务质量保障',
    '3号车厢有VIP旅客，注意服务礼仪',
    '近期雷雨天气，注意行车安全提醒',
    '餐车补货已完成，请核对签收',
    '7号车厢空调设备检修，注意旅客舒适度'
  ]
}

const mockCrewMembers: CrewMember[] = [
  { id: '1', name: '张明', role: '列车长', avatar: '张', signedIn: true, signInTime: '06:30' },
  { id: '2', name: '李华', role: '副列车长', avatar: '李', signedIn: true, signInTime: '06:32' },
  { id: '3', name: '王芳', role: '乘务员-1-4车', avatar: '王', signedIn: true, signInTime: '06:35' },
  { id: '4', name: '赵刚', role: '乘务员-5-8车', avatar: '赵', signedIn: false },
  { id: '5', name: '陈静', role: '乘务员-9-12车', avatar: '陈', signedIn: true, signInTime: '06:28' },
  { id: '6', name: '刘洋', role: '乘务员-13-16车', avatar: '刘', signedIn: true, signInTime: '06:40' },
  { id: '7', name: '周敏', role: '餐售员', avatar: '周', signedIn: false },
  { id: '8', name: '吴强', role: '安全员', avatar: '吴', signedIn: true, signInTime: '06:33' },
]

const mockKeyPassengers: KeyPassenger[] = [
  { id: '1', name: '王老先生', type: '高龄旅客', carriage: '3', seat: '3A', notes: '85岁，需协助上下车' },
  { id: '2', name: '李女士', type: '孕妇', carriage: '5', seat: '7D', notes: '孕7月，已安排靠走道座位' },
  { id: '3', name: '张总', type: 'VIP', carriage: '3', seat: '1A', notes: '商务座VIP，提供专属服务' },
  { id: '4', name: '小明', type: '儿童', carriage: '8', seat: '12C', notes: '6岁儿童随行，注意安全提醒' },
  { id: '5', name: '赵先生', type: '轮椅旅客', carriage: '6', seat: '无障碍区', notes: '轮椅旅客，协助上下车与就座' },
  { id: '6', name: '孙女士', type: '特殊饮食', carriage: '9', seat: '5A', notes: '清真饮食需求' },
]

const mockPatrolRecords: PatrolRecord[] = [
  { id: '1', carriage: '1车', inspector: '王芳', time: '07:15', findings: '行李架物品摆放整齐，消防设备正常', status: 'normal' },
  { id: '2', carriage: '3车', inspector: '王芳', time: '07:20', findings: 'VIP旅客已问候，服务需求已记录', status: 'normal' },
  { id: '3', carriage: '5车', inspector: '赵刚', time: '07:25', findings: '孕妇旅客座位舒适度已确认', status: 'normal' },
  { id: '4', carriage: '7车', inspector: '赵刚', time: '07:30', findings: '空调温度偏高，已联系机械师调节', status: 'warning' },
  { id: '5', carriage: '12车', inspector: '陈静', time: '07:35', findings: '发现座椅破损，已登记维修', status: 'resolved' },
  { id: '6', carriage: '16车', inspector: '刘洋', time: '07:40', findings: '卫生间清洁用品不足，已补充', status: 'resolved' },
]

const mockHygieneChecks: HygieneCheck[] = [
  { id: '1', carriage: '1车', floor: 4, seat: 5, toilet: 4, trash: 5, overall: 4.5, checker: '王芳', time: '07:00' },
  { id: '2', carriage: '3车', floor: 5, seat: 5, toilet: 5, trash: 5, overall: 5, checker: '王芳', time: '07:05' },
  { id: '3', carriage: '5车', floor: 4, seat: 4, toilet: 3, trash: 4, overall: 3.75, checker: '赵刚', time: '07:10' },
  { id: '4', carriage: '7车', floor: 3, seat: 3, toilet: 3, trash: 4, overall: 3.25, checker: '赵刚', time: '07:15' },
  { id: '5', carriage: '9车', floor: 4, seat: 4, toilet: 4, trash: 5, overall: 4.25, checker: '陈静', time: '07:20' },
  { id: '6', carriage: '12车', floor: 5, seat: 4, toilet: 4, trash: 4, overall: 4.25, checker: '陈静', time: '07:25' },
  { id: '7', carriage: '16车', floor: 4, seat: 4, toilet: 3, trash: 3, overall: 3.5, checker: '刘洋', time: '07:30' },
]

const mockStationStops: StationStop[] = [
  {
    id: '1', station: '北京南', arriveTime: '--', departTime: '07:00',
    tasks: [
      { id: '1', name: '开启车门', completed: true },
      { id: '2', name: '引导旅客上车', completed: true },
      { id: '3', name: '行李搬运协助', completed: true },
      { id: '4', name: '关闭车门', completed: true },
    ]
  },
  {
    id: '2', station: '济南西', arriveTime: '08:32', departTime: '08:35',
    tasks: [
      { id: '5', name: '提前到岗等候', completed: true },
      { id: '6', name: '开启车门', completed: true },
      { id: '7', name: '旅客上下车引导', completed: true },
      { id: '8', name: '清理车厢', completed: false },
      { id: '9', name: '关闭车门', completed: false },
    ]
  },
  {
    id: '3', station: '徐州东', arriveTime: '09:45', departTime: '09:48',
    tasks: [
      { id: '10', name: '提前到岗等候', completed: false },
      { id: '11', name: '开启车门', completed: false },
      { id: '12', name: '旅客上下车引导', completed: false },
      { id: '13', name: '清理车厢', completed: false },
      { id: '14', name: '关闭车门', completed: false },
    ]
  },
  {
    id: '4', station: '南京南', arriveTime: '10:52', departTime: '10:55',
    tasks: [
      { id: '15', name: '提前到岗等候', completed: false },
      { id: '16', name: '开启车门', completed: false },
      { id: '17', name: '旅客上下车引导', completed: false },
      { id: '18', name: '清理车厢', completed: false },
      { id: '19', name: '关闭车门', completed: false },
    ]
  },
  {
    id: '5', station: '上海虹桥', arriveTime: '12:08', departTime: '--',
    tasks: [
      { id: '20', name: '开启车门', completed: false },
      { id: '21', name: '引导旅客下车', completed: false },
      { id: '22', name: '检查遗留物品', completed: false },
      { id: '23', name: '车厢最终清理', completed: false },
    ]
  },
]

const mockLostItems: LostItem[] = [
  { id: '1', description: '黑色双肩包，内有笔记本电脑', location: '5车12A座位上方', foundTime: '08:40', status: '已登记', handler: '赵刚' },
  { id: '2', description: '银色保温杯', location: '9车卫生间', foundTime: '09:15', status: '待认领', handler: '陈静' },
  { id: '3', description: '儿童玩具熊', location: '8车12C座位', foundTime: '08:55', status: '已归还', handler: '赵刚' },
  { id: '4', description: '蓝色雨伞', location: '3车行李架', foundTime: '10:20', status: '已移交', handler: '王芳' },
]

const mockTicketSupplements: TicketSupplement[] = [
  { id: '1', passenger: '王先生', carriage: '6', seat: '8D', type: '无票乘车', amount: 553, status: '已完成' },
  { id: '2', passenger: '陈女士', carriage: '10', seat: '15A', type: '越站乘车', amount: 156, status: '处理中' },
  { id: '3', passenger: '刘先生', carriage: '14', seat: '3C', type: '变更席别', amount: 230, status: '待处理' },
]

const mockComplaints: Complaint[] = [
  { id: '1', passenger: '张先生', content: '7号车厢空调温度过高，体感不适', category: '环境舒适', priority: 'medium', status: '处理中', handler: '赵刚', result: '已联系机械师调节空调温度', time: '08:50' },
  { id: '2', passenger: '刘女士', content: '邻座旅客大声通话影响休息', category: '旅客纠纷', priority: 'low', status: '已解决', handler: '陈静', result: '已与邻座旅客沟通，提醒其调低音量', time: '09:30' },
  { id: '3', passenger: '赵先生', content: '轮椅通道被行李堵塞，无法通行', category: '安全隐患', priority: 'high', status: '处理中', handler: '刘洋', result: '', time: '10:15' },
]

const mockFoodItems: FoodItem[] = [
  { id: '1', name: '红烧牛肉饭', category: '热食', stock: 45, price: 35, threshold: 10 },
  { id: '2', name: '宫保鸡丁饭', category: '热食', stock: 38, price: 35, threshold: 10 },
  { id: '3', name: '西红柿鸡蛋面', category: '热食', stock: 30, price: 28, threshold: 10 },
  { id: '4', name: '矿泉水', category: '饮品', stock: 120, price: 5, threshold: 30 },
  { id: '5', name: '橙汁', category: '饮品', stock: 60, price: 10, threshold: 20 },
  { id: '6', name: '咖啡', category: '饮品', stock: 25, price: 15, threshold: 10 },
  { id: '7', name: '薯片', category: '零食', stock: 80, price: 8, threshold: 20 },
  { id: '8', name: '巧克力', category: '零食', stock: 15, price: 12, threshold: 20 },
  { id: '9', name: '八宝粥', category: '零食', stock: 40, price: 8, threshold: 15 },
]

const mockSalesRecords: SalesRecord[] = [
  { id: '1', item: '红烧牛肉饭', quantity: 3, amount: 105, payment: '微信', carriage: '5车', time: '08:20' },
  { id: '2', item: '矿泉水', quantity: 5, amount: 25, payment: '现金', carriage: '3车', time: '08:25' },
  { id: '3', item: '宫保鸡丁饭', quantity: 2, amount: 70, payment: '支付宝', carriage: '8车', time: '08:45' },
  { id: '4', item: '咖啡', quantity: 4, amount: 60, payment: '微信', carriage: '3车', time: '09:00' },
  { id: '5', item: '薯片', quantity: 6, amount: 48, payment: '支付宝', carriage: '12车', time: '09:15' },
  { id: '6', item: '西红柿鸡蛋面', quantity: 5, amount: 140, payment: '刷卡', carriage: '9车', time: '09:30' },
  { id: '7', item: '橙汁', quantity: 3, amount: 30, payment: '微信', carriage: '6车', time: '09:50' },
  { id: '8', item: '八宝粥', quantity: 2, amount: 16, payment: '现金', carriage: '14车', time: '10:05' },
]

const mockEmergencyReports: EmergencyReport[] = [
  { id: '1', type: '设备故障', location: '7车', time: '08:30', description: '7号车厢空调制热异常，温度偏高', severity: 'medium', status: '处理中', reporter: '赵刚' },
  { id: '2', type: '旅客突发疾病', location: '10车', time: '09:45', description: '旅客突发心脏不适，需医疗协助', severity: 'critical', status: '处理中', reporter: '陈静' },
  { id: '3', type: '安全隐患', location: '6车', time: '10:15', description: '轮椅通道被行李堵塞', severity: 'high', status: '处理中', reporter: '刘洋' },
]

const mockBroadcastItems: BroadcastItem[] = [
  { id: '1', content: '各位旅客，列车即将到达济南西站，请在济南西站下车的旅客提前做好准备', scheduledTime: '08:25', broadcasted: true, category: '到站提醒' },
  { id: '2', content: '请5车旅客赵先生前往餐车，有旅客寻找', scheduledTime: '08:50', broadcasted: true, category: '寻人启事' },
  { id: '3', content: '各位旅客，列车正在高速运行，请注意看管好随身物品', scheduledTime: '09:00', broadcasted: true, category: '安全提示' },
  { id: '4', content: '列车即将到达徐州东站，请在徐州东站下车的旅客提前做好准备', scheduledTime: '09:35', broadcasted: false, category: '到站提醒' },
  { id: '5', content: '各位旅客，近期雷雨天气，列车可能限速运行，敬请谅解', scheduledTime: '09:40', broadcasted: false, category: '安全提示' },
  { id: '6', content: '列车即将到达南京南站，请在南京南站下车的旅客提前做好准备', scheduledTime: '10:42', broadcasted: false, category: '到站提醒' },
]

const mockHandoverNotes: HandoverNote[] = [
  { id: '1', content: '7号车厢空调故障已联系机械师，尚未完全修复，下一班需跟进', category: '设备异常', author: '赵刚', time: '11:30', confirmed: false, relatedItems: [{ id: '1', type: '异常上报', title: '7号车厢空调制热异常' }] },
  { id: '2', content: '10车旅客心脏不适已得到初步处理，需下一班持续关注', category: '重点旅客', author: '陈静', time: '11:35', confirmed: false, relatedItems: [{ id: '2', type: '异常上报', title: '旅客突发心脏不适' }] },
  { id: '3', content: '5车发现遗失黑色双肩包，已登记待认领', category: '遗失物品', author: '赵刚', time: '11:40', confirmed: false, relatedItems: [{ id: '1', type: '遗失物品', title: '黑色双肩包' }] },
  { id: '4', content: '巧克力库存低于阈值，需补货', category: '物资补给', author: '周敏', time: '11:45', confirmed: false, relatedItems: [{ id: '8', type: '低库存', title: '巧克力库存不足' }] },
]

const mockSignOffEvaluation: SignOffEvaluation = {
  serviceQuality: 0,
  teamCooperation: 0,
  safetyCompliance: 0,
  summary: '',
  evaluator: '',
  time: ''
}

const DEFAULT_DATA: PersistedData = {
  trainTask: mockTrainTask,
  crewMembers: mockCrewMembers,
  keyPassengers: mockKeyPassengers,
  patrolRecords: mockPatrolRecords,
  hygieneChecks: mockHygieneChecks,
  stationStops: mockStationStops,
  lostItems: mockLostItems,
  ticketSupplements: mockTicketSupplements,
  complaints: mockComplaints,
  foodItems: mockFoodItems,
  salesRecords: mockSalesRecords,
  emergencyReports: mockEmergencyReports,
  broadcastItems: mockBroadcastItems,
  handoverNotes: mockHandoverNotes,
  signOffEvaluation: mockSignOffEvaluation,
}

function loadFromStorage(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedData>
      return { ...DEFAULT_DATA, ...parsed }
    }
  } catch {
    // ignore
  }
  return DEFAULT_DATA
}

function saveToStorage(state: PersistedData) {
  try {
    const toSave: PersistedData = {
      trainTask: state.trainTask,
      crewMembers: state.crewMembers,
      keyPassengers: state.keyPassengers,
      patrolRecords: state.patrolRecords,
      hygieneChecks: state.hygieneChecks,
      stationStops: state.stationStops,
      lostItems: state.lostItems,
      ticketSupplements: state.ticketSupplements,
      complaints: state.complaints,
      foodItems: state.foodItems,
      salesRecords: state.salesRecords,
      emergencyReports: state.emergencyReports,
      broadcastItems: state.broadcastItems,
      handoverNotes: state.handoverNotes,
      signOffEvaluation: state.signOffEvaluation,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // ignore
  }
}

const initial = loadFromStorage()

export const useStore = create<TrainCrewState>((set, get) => ({
  ...initial,

  signInCrew: (id) => set((state) => {
    const next = {
      ...state,
      crewMembers: state.crewMembers.map(m =>
        m.id === id ? { ...m, signedIn: true, signInTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) } : m
      )
    }
    saveToStorage(next)
    return next
  }),

  addPatrolRecord: (record) => set((state) => {
    const next = { ...state, patrolRecords: [...state.patrolRecords, record] }
    saveToStorage(next)
    return next
  }),

  addHygieneCheck: (check) => set((state) => {
    const next = { ...state, hygieneChecks: [...state.hygieneChecks, check] }
    saveToStorage(next)
    return next
  }),

  toggleStationTask: (stopId, taskId) => set((state) => {
    const next = {
      ...state,
      stationStops: state.stationStops.map(s =>
        s.id === stopId ? {
          ...s,
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        } : s
      )
    }
    saveToStorage(next)
    return next
  }),

  addLostItem: (item) => set((state) => {
    const next = { ...state, lostItems: [...state.lostItems, item] }
    saveToStorage(next)
    return next
  }),

  updateLostItemStatus: (id, status) => set((state) => {
    const next = {
      ...state,
      lostItems: state.lostItems.map(i => i.id === id ? { ...i, status } : i)
    }
    saveToStorage(next)
    return next
  }),

  addTicketSupplement: (ticket) => set((state) => {
    const next = { ...state, ticketSupplements: [...state.ticketSupplements, ticket] }
    saveToStorage(next)
    return next
  }),

  updateTicketSupplementStatus: (id, status) => set((state) => {
    const next = {
      ...state,
      ticketSupplements: state.ticketSupplements.map(t => t.id === id ? { ...t, status } : t)
    }
    saveToStorage(next)
    return next
  }),

  addComplaint: (complaint) => set((state) => {
    const next = { ...state, complaints: [...state.complaints, complaint] }
    saveToStorage(next)
    return next
  }),

  updateComplaintStatus: (id, status, result) => set((state) => {
    const next = {
      ...state,
      complaints: state.complaints.map(c => c.id === id ? { ...c, status, result } : c)
    }
    saveToStorage(next)
    return next
  }),

  updateFoodStock: (id, delta) => set((state) => {
    const next = {
      ...state,
      foodItems: state.foodItems.map(f => f.id === id ? { ...f, stock: Math.max(0, f.stock + delta) } : f)
    }
    saveToStorage(next)
    return next
  }),

  addSalesRecord: (record) => {
    const state = get()
    const matched = state.foodItems.find(f => f.name === record.item)
    if (matched && matched.stock < record.quantity) {
      return false
    }
    set((s) => {
      const next = {
        ...s,
        salesRecords: [...s.salesRecords, record],
        foodItems: matched
          ? s.foodItems.map(f => f.id === matched.id ? { ...f, stock: Math.max(0, f.stock - record.quantity) } : f)
          : s.foodItems,
      }
      saveToStorage(next)
      return next
    })
    return true
  },

  addEmergencyReport: (report) => set((state) => {
    const next = { ...state, emergencyReports: [...state.emergencyReports, report] }
    saveToStorage(next)
    return next
  }),

  updateEmergencyStatus: (id, status) => set((state) => {
    const next = {
      ...state,
      emergencyReports: state.emergencyReports.map(e => e.id === id ? { ...e, status } : e)
    }
    saveToStorage(next)
    return next
  }),

  toggleBroadcast: (id) => set((state) => {
    const next = {
      ...state,
      broadcastItems: state.broadcastItems.map(b => b.id === id ? { ...b, broadcasted: !b.broadcasted } : b)
    }
    saveToStorage(next)
    return next
  }),

  addBroadcastItem: (item) => set((state) => {
    const next = { ...state, broadcastItems: [...state.broadcastItems, item] }
    saveToStorage(next)
    return next
  }),

  addHandoverNote: (note) => set((state) => {
    const next = { ...state, handoverNotes: [...state.handoverNotes, note] }
    saveToStorage(next)
    return next
  }),

  confirmHandoverNote: (id, confirmer) => set((state) => {
    const next = {
      ...state,
      handoverNotes: state.handoverNotes.map(n => n.id === id ? { ...n, confirmed: true, confirmer } : n)
    }
    saveToStorage(next)
    return next
  }),

  setSignOffEvaluation: (evaluation) => set((state) => {
    const next = { ...state, signOffEvaluation: evaluation }
    saveToStorage(next)
    return next
  }),
}))
