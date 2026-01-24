
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
  }
}

export async function loginUser(username: string, password_input: string) {
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
    console.error("AI Bridge Error:", error);
    return "Intelligence offline.";
  }
}
