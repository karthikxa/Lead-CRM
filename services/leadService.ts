
import { VALID_CREDENTIALS, SHEET_CSV_URLS } from '../constants';
import { neuralDB } from './localDb';
import { Lead, LeadStatus, SystemAlert } from '../types';

/**
 * Robust CSV parser that handles quoted strings and various line endings.
 */
function parseCSV(text: string) {
  const result: any[] = [];
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return result;

  const headers = (lines[0].match(/(".*?"|[^",]+)/g) || []).map(h => 
    h.replace(/^"|"$/g, '').trim().toLowerCase()
  );

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj: any = {};
    headers.forEach((header, index) => {
      let val = values[index] || '';
      obj[header] = val.replace(/^"|"$/g, '').trim();
    });
    result.push(obj);
  }
  return result;
}

function getFuzzy(obj: any, aliases: string[]): string {
  for (const alias of aliases) {
    const key = alias.toLowerCase();
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return String(obj[key]);
    }
  }
  return "";
}

async function fetchSheetCSV(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Sheet link inaccessible.");
    const text = await response.text();
    return parseCSV(text);
  } catch (e) {
    console.error("CSV Fetch Error:", e);
    return [];
  }
}

export async function loginUser(username: string, password_input: string) {
  const user = VALID_CREDENTIALS.find(u => u.username === username && u.password === password_input);
  if (!user) return { success: false, message: "Access Denied: Neural link rejected." };

  await syncAllState(username);
  const state = await fetchAllState(username);

  return {
    success: true,
    user: user.username,
    role: user.role,
    initialData: state.data
  };
}

export function generateAnomalies(analytics: Lead[], thresholdSeconds: number = 60): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  const grouped = analytics.reduce((acc, lead) => {
    const owner = lead.employeeOwner || 'SYSTEM';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  Object.entries(grouped).forEach(([username, leads]) => {
    // Sort leads by timestamp ascending to find consecutive pairs
    const sorted = [...leads].sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const timeDiff = (new Date(next.lastUpdated).getTime() - new Date(current.lastUpdated).getTime()) / 1000;

      if (timeDiff > 0 && timeDiff < thresholdSeconds) {
        alerts.push({
          id: `alert-${current.id}-${next.id}`,
          snoPair: `${current.Sno} & ${next.Sno}`,
          company: next.Company,
          phone: next.Number,
          status: next.Availability,
          username: username,
          timeDiff: Math.round(timeDiff),
          timestamp: next.lastUpdated,
          isAcknowledged: false,
          rating: next.Ratings,
          website: next.Website,
          summary: next.Summary
        });
      }
    }
  });

  return alerts;
}

export async function fetchAllState(username: string) {
  await syncAllState(username);
  const user = VALID_CREDENTIALS.find(u => u.username === username);
  const role = user?.role || 'EMPLOYEE';

  const dbState = neuralDB.getRawState();
  const analytics = neuralDB.getAnalytics(username, role);
  const tasks = neuralDB.getTasks(username, role);
  const pool = neuralDB.getPool(username);

  return {
    status: "SUCCESS",
    data: {
      dashboard: pool,
      tasks: tasks,
      analytics: analytics,
      alerts: role === 'ADMIN' ? generateAnomalies(dbState.analytics) : []
    }
  };
}

async function syncAllState(username: string) {
  const user = VALID_CREDENTIALS.find(u => u.username === username);
  const isAdmin = user?.role === 'ADMIN';

  // 1. Sync the individual's/specialist's pool
  const csvUrl = SHEET_CSV_URLS[username];
  if (csvUrl) {
    const rawLeads = await fetchSheetCSV(csvUrl);
    const mappedLeads = rawLeads.map((l, i) => mapRawToLead(l, i, username));
    neuralDB.syncPool(username, mappedLeads);
  }

  // 2. If Admin, also sync the Master 'DB' sheet into Analytics
  if (isAdmin && SHEET_CSV_URLS.DB) {
    const masterLeads = await fetchSheetCSV(SHEET_CSV_URLS.DB);
    const mappedMaster = masterLeads.map((l, i) => {
      const owner = getFuzzy(l, ['username', 'user', 'specialist', 'owner']) || "SYSTEM";
      const lead = mapRawToLead(l, i, owner);
      const rawStatus = getFuzzy(l, ['availability', 'status', 'state']).toLowerCase();
      lead.Availability = rawStatus.includes('booked') ? LeadStatus.BOOKED : LeadStatus.DECLINED;
      return lead;
    });
    neuralDB.syncMasterToAnalytics(mappedMaster);
  }
}

function mapRawToLead(l: any, i: number, owner: string): Lead {
  const company = getFuzzy(l, ['company', 'company name', 'name', 'business', 'lead', 'entity', 'client']);
  const phone = getFuzzy(l, ['number', 'phone', 'contact', 'mobile', 'tel']);
  const sno = getFuzzy(l, ['sno', 's.no', 'id', 'serial']);
  
  return {
    id: `csv-${owner}-${sno || i}`,
    Sno: sno || i + 1,
    Company: company || "Unnamed Lead",
    Ratings: getFuzzy(l, ['ratings', 'rating', 'stars']) || "0.0",
    Number: phone || "N/A",
    Website: getFuzzy(l, ['website', 'web', 'url', 'link']) || "NONE",
    Type: getFuzzy(l, ['type', 'category', 'industry', 'niche']) || "N/A",
    Availability: LeadStatus.UNASSIGNED,
    Instagram: getFuzzy(l, ['instagram', 'insta', 'ig']) || "",
    Gmail: getFuzzy(l, ['gmail', 'email', 'mail']) || "",
    Location: getFuzzy(l, ['location', 'area', 'address', 'city']) || "",
    Summary: getFuzzy(l, ['summary', 'notes', 'remarks', 'intel']) || "",
    Check: false,
    employeeOwner: owner,
    lastUpdated: getFuzzy(l, ['date&time', 'datetime', 'timestamp']) || new Date().toISOString()
  };
}

export async function submitLead(username: string, lead: Lead) {
  const user = VALID_CREDENTIALS.find(u => u.username === username);
  const role = user?.role || 'EMPLOYEE';
  
  neuralDB.commitLead(username, lead);

  const state = await fetchAllState(username);
  return { 
    status: "SUCCESS", 
    data: state.data
  };
}

export async function updateTask(username: string, lead: Lead) {
  return submitLead(username, lead);
}

export async function generateAIIntel(company: string, type: string) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: `Company: ${company}, Industry: ${type}. Generate a concise one-sentence CRM summary.` 
      }),
    });
    if (!response.ok) throw new Error('AI Generation Failure');
    const data = await response.json();
    return data.text || "Insight unavailable.";
  } catch (error) {
    return "Intelligence offline.";
  }
}
