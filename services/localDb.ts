
import { Lead, LeadStatus } from '../types';

const DB_KEY = 'zodzy_neural_db_v4';

export interface DatabaseSchema {
  pool: Record<string, Lead[]>; 
  analytics: Lead[];            
  tasks: Lead[];                
  lastSync: string;
}

class NeuralDB {
  private data: DatabaseSchema;

  constructor() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
    } else {
      this.data = {
        pool: {},
        analytics: [],
        tasks: [],
        lastSync: new Date(0).toISOString()
      };
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  private getLeadKey(lead: any): string {
    const company = String(lead.Company || lead.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const phone = String(lead.Number || lead.number || '').replace(/\D/g, '').slice(-10);
    return `K_${company}_${phone}`;
  }

  public getRawState(): DatabaseSchema {
    return { ...this.data };
  }

  public clearDatabase() {
    localStorage.removeItem(DB_KEY);
    window.location.reload();
  }

  public seedMockData() {
    const mockSpecialists = ['Kavin', 'Bhuvanesh', 'Logesh'];
    const mockCompanies = ['Cyberdyne Systems', 'Stark Industries', 'Wayne Enterprises', 'Oscorp Corp', 'Umbrella Corp'];
    const statuses = [LeadStatus.BOOKED, LeadStatus.DECLINED, LeadStatus.FOLLOW_UP, LeadStatus.BUSY];

    const mockAnalytics: Lead[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `mock-ana-${i}`,
      Sno: i + 1,
      Company: mockCompanies[i % mockCompanies.length],
      Ratings: (Math.random() * 2 + 3).toFixed(1),
      Number: `+91 ${9000000000 + i}`,
      Website: 'https://example.com',
      Type: 'Technology',
      Availability: statuses[i % 2], // Booked or Declined
      employeeOwner: mockSpecialists[i % mockSpecialists.length],
      Summary: `Strategic alignment confirmed. Entity demonstrates high intent for Q3 deployment. [Generated Mock Data]`,
      Check: true,
      lastUpdated: new Date(Date.now() - Math.random() * 100000000).toISOString()
    }));

    const mockTasks: Lead[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `mock-task-${i}`,
      Sno: i + 10,
      Company: `${mockCompanies[i % mockCompanies.length]} (Region ${i})`,
      Ratings: (Math.random() * 2 + 2).toFixed(1),
      Number: `+91 ${8000000000 + i}`,
      Website: 'https://example.com',
      Type: 'Manufacturing',
      Availability: statuses[2 + (i % 2)], // Follow-up or Busy
      employeeOwner: mockSpecialists[i % mockSpecialists.length],
      Summary: `Re-engagement required. Specialist noted budget cycle constraints. [Generated Mock Data]`,
      Check: false,
      lastUpdated: new Date(Date.now() - Math.random() * 50000000).toISOString()
    }));

    this.data.analytics = [...mockAnalytics];
    this.data.tasks = [...mockTasks];
    this.save();
    window.location.reload();
  }

  public getPool(username: string): Lead[] {
    return this.data.pool[username] || [];
  }

  public getTasks(username: string, role: string): Lead[] {
    if (role === 'ADMIN') return this.data.tasks;
    return this.data.tasks.filter(l => l.employeeOwner === username);
  }

  public getAnalytics(username: string, role: string): Lead[] {
    if (role === 'ADMIN') return this.data.analytics;
    return this.data.analytics.filter(l => l.employeeOwner === username);
  }

  public syncPool(username: string, incomingLeads: Lead[]) {
    const processedKeys = new Set([
      ...this.data.analytics.map(l => this.getLeadKey(l)),
      ...this.data.tasks.map(l => this.getLeadKey(l))
    ]);

    const filteredPool = incomingLeads.filter(l => !processedKeys.has(this.getLeadKey(l)));
    this.data.pool[username] = filteredPool;
    this.save();
  }

  public syncMasterToAnalytics(masterLeads: Lead[]) {
    const existingKeys = new Set(this.data.analytics.map(l => this.getLeadKey(l)));
    
    masterLeads.forEach(lead => {
      const key = this.getLeadKey(lead);
      if (!existingKeys.has(key)) {
        this.data.analytics.push(lead);
        existingKeys.add(key);
      }
    });

    this.data.analytics.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    this.data.lastSync = new Date().toISOString();
    this.save();
  }

  public commitLead(username: string, lead: Lead): DatabaseSchema {
    const leadKey = this.getLeadKey(lead);
    
    const userPool = this.data.pool[username] || [];
    this.data.pool[username] = userPool.filter(l => this.getLeadKey(l) !== leadKey);

    const status = lead.Availability;
    if (status === LeadStatus.BOOKED || status === LeadStatus.DECLINED) {
      this.data.tasks = this.data.tasks.filter(l => this.getLeadKey(l) !== leadKey);
      this.data.analytics.unshift({ ...lead, lastUpdated: new Date().toISOString() });
    } else if (status === LeadStatus.FOLLOW_UP || status === LeadStatus.BUSY) {
      this.data.tasks = this.data.tasks.filter(l => this.getLeadKey(l) !== leadKey);
      this.data.tasks.unshift({ ...lead, lastUpdated: new Date().toISOString() });
    }

    this.save();
    return this.data;
  }
}

export const neuralDB = new NeuralDB();
