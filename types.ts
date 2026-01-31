
export enum LeadStatus {
  UNASSIGNED = 'default',
  BOOKED = 'booked',
  DECLINED = 'declined',
  FOLLOW_UP = 'follow up',
  BUSY = 'busy'
}

export interface Lead {
  id: string;
  Sno?: string | number;
  Company: string;
  Ratings: string | number;
  Number: string;
  Website: string;
  Type: string;
  Availability: LeadStatus;
  Instagram?: string;
  Gmail?: string;
  Location?: string;
  Summary: string;
  Check: string | boolean;
  employeeOwner: string;
  lastUpdated: string;
  DateTime?: string;
}

export interface User {
  username: string;
  role: 'ADMIN' | 'EMPLOYEE';
  sheetName?: string;
}

export interface SystemAlert {
  id: string;
  snoPair: string;
  company: string;
  phone: string;
  status: string;
  username: string;
  timeDiff: number;
  timestamp: string;
  isAcknowledged: boolean;
  rating?: string | number;
  website?: string;
  summary?: string;
}

export interface IntelligenceMetrics {
  total: number;
  processed: number;
  booked: number;
  declined: number;
  followUp: number;
  busy: number;
  conversionRate: number;
  dropRate: number;
  followUpLoad: number;
  efficiency: number;
}

export type AppView = 'DASHBOARD' | 'ANALYTICS' | 'TASK_LIST' | 'ALERTS' | 'DATABASE';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  username: string;
}

export interface EmployeeStats {
  username: string;
  efficiency: number;
  booked: number;
  weeklyGoalDelta: number;
  todayRemainder: number;
  completedToday: number;
  processed: number;
  weeklyProgress: number;
  weeklyTarget: number;
}

export interface TaskAssignment {
  id: string;
  employeeUsername: string;
  startDate: string;
  endDate: string;
  weeklyTarget: number;
  dailyTarget: number;
  daysPlanned: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
}
