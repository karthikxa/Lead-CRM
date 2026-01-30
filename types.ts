
export enum LeadStatus {
  UNASSIGNED = 'default',
  BOOKED = 'booked',
  DECLINED = 'declined',
  FOLLOW_UP = 'follow up',
  BUSY = 'busy'
}

export interface Lead {
  id: string;
<<<<<<< HEAD
=======
  // Sno is the serial number from the data source, used for display and tracking
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  Sno?: string | number;
  Company: string;
  Ratings: string | number;
  Number: string;
  Website: string;
  Type: string;
  Availability: LeadStatus;
<<<<<<< HEAD
  Instagram?: string;
  Gmail?: string;
  Location?: string;
  Summary: string;
  Check: string | boolean;
  employeeOwner: string;
  lastUpdated: string;
  DateTime?: string;
=======
  Summary: string;
  Check: string; // 'TRUE' or 'FALSE'
  employeeOwner: string;
  lastUpdated: string;
  DateTime?: string; // Appended during lock
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
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
<<<<<<< HEAD
  timeDiff: number;
  timestamp: string;
  isAcknowledged: boolean;
=======
  timeDiff: number; // in seconds
  timestamp: string;
  isAcknowledged: boolean;
  // Fields for detailed view requested
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  rating: string | number;
  website: string;
  summary: string;
}

<<<<<<< HEAD
=======
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

export type AppView = 'DASHBOARD' | 'ANALYTICS' | 'TASK_LIST' | 'ALERTS';

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

>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
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
<<<<<<< HEAD

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
}

export type AppView = 'DASHBOARD' | 'ANALYTICS' | 'TASK_LIST' | 'ALERTS' | 'DATABASE';
=======
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
