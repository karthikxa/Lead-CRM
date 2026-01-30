
<<<<<<< HEAD
import { VALID_CREDENTIALS, SHEET_CSV_URLS } from '../constants';
import { neuralDB } from './localDb';
import { Lead, LeadStatus } from '../types';

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
=======
import { API_URL } from '../constants';

async function callGAS(payload: any) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      redirect: 'follow',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error("Neural link unauthorized or script deployment error.");
    }

    const data = JSON.parse(text);

    if (data.success === false) {
      throw new Error(data.error || "Action rejected by command center.");
    }

    return data;
  } catch (error: any) {
    console.error("Neural Link Failure:", error);
    throw error;
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  }
}

export async function loginUser(username: string, password_input: string) {
<<<<<<< HEAD
  const user = VALID_CREDENTIALS.find(u => u.username === username && u.password === password_input);
  if (!user) return { success: false, message: "Access Denied: Neural link rejected." };

  await syncAllState(username);

  return {
    success: true,
    user: user.username,
    role: user.role,
    initialData: {
      dashboard: neuralDB.getPool(user.username),
      tasks: neuralDB.getTasks(user.username, user.role),
      analytics: neuralDB.getAnalytics(user.username, user.role),
      alerts: []
    }
  };
}

export async function fetchAllState(username: string) {
  await syncAllState(username);
  const user = VALID_CREDENTIALS.find(u => u.username === username);
  const role = user?.role || 'EMPLOYEE';

  return {
    status: "SUCCESS",
    data: {
      dashboard: neuralDB.getPool(username),
      tasks: neuralDB.getTasks(username, role),
      analytics: neuralDB.getAnalytics(username, role),
      alerts: []
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
      const lead = mapRawToLead(l, i, getFuzzy(l, ['username', 'user', 'specialist', 'owner']) || "SYSTEM");
      // If it's in the master DB, it's likely already actioned
      const rawStatus = getFuzzy(l, ['availability', 'status', 'state']).toLowerCase();
      lead.Availability = rawStatus.includes('booked') ? LeadStatus.BOOKED : LeadStatus.DECLINED;
      return lead;
    });
    // Add to analytics storage
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

  return { 
    status: "SUCCESS", 
    data: {
      dashboard: neuralDB.getPool(username),
      tasks: neuralDB.getTasks(username, role),
      analytics: neuralDB.getAnalytics(username, role),
      alerts: []
    }
  };
}

export async function updateTask(username: string, lead: Lead) {
  return submitLead(username, lead);
}

=======
  try {
    const res = await callGAS({
      action: "login",
      username,
      password: password_input
    });
    return {
      success: true,
      user: res.user,
      role: (res.role === 'admin' ? 'ADMIN' : 'EMPLOYEE') as 'ADMIN' | 'EMPLOYEE'
    };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function fetchActiveData(username: string) {
  try {
    const res = await callGAS({
      action: "fetchActive",
      username
    });
    return { status: "SUCCESS", leads: res.data || [] };
  } catch (e: any) {
    return { status: "ERROR", error: e.message };
  }
}

export async function fetchTasksData(username: string) {
  try {
    const res = await callGAS({
      action: "fetchTasks",
      username
    });
    return { status: "SUCCESS", leads: res.data || [] };
  } catch (e: any) {
    return { status: "ERROR", error: e.message };
  }
}

export async function fetchAnalyticsData(username: string) {
  try {
    const res = await callGAS({
      action: "fetchAnalytics",
      username
    });
    return { status: "SUCCESS", leads: res.data || [] };
  } catch (e: any) {
    return { status: "ERROR", error: e.message };
  }
}

export async function appendToDB(username: string, leads: any[]) {
  try {
    const res = await callGAS({
      action: "appendCompleted",
      username,
      leads
    });
    return { status: "SUCCESS", inserted: res.inserted };
  } catch (e: any) {
    return { status: "ERROR", error: e.message };
  }
}

/**
 * Communicates with the Vercel Serverless API proxy to generate AI insights.
 * This prevents the Gemini API key from being exposed to the client.
 */
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
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
<<<<<<< HEAD
=======
    console.error("AI Bridge Error:", error);
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
    return "Intelligence offline.";
  }
}
