
import { Lead, LeadStatus } from '../types';

/**
 * Normalizes company name to lowercase alphanumeric (matches GAS normalizeText)
 */
function normalizeText(text: string): string {
  return (text || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Normalizes phone to last 10 digits (matches GAS normalizePhone)
 */
function normalizePhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.toString().replace(/\D/g, "");
  return digits.slice(-10);
}

/**
 * Generates keys for deduplication (Phone primary, Company fallback)
 */
function getDedupKeys(lead: { Company?: string; Number?: string }): string[] {
  const keys: string[] = [];
  const p = normalizePhone(lead.Number || "");
  const c = normalizeText(lead.Company || "");
  if (p) keys.push(`p:${p}`);
  if (c) keys.push(`c:${c}`);
  return keys;
}

export interface DeduplicateResult {
  cleaned: Lead[];
  duplicates: Lead[];
  duplicateCount: number;
}

export function cleanAndDeduplicate(
  newLeads: any[],
  activeLeads: Lead[] = [],
  dbLeads: Lead[] = []
): DeduplicateResult {
  if (!Array.isArray(newLeads)) return { cleaned: [], duplicates: [], duplicateCount: 0 };

  const cleaned: Lead[] = [];
  const duplicates: Lead[] = [];
  
  const seenInDB = new Set<string>();
  const seenInActive = new Set<string>();
  const seenInBatch = new Set<string>();

  // Index existing leads
  dbLeads.forEach(l => getDedupKeys(l).forEach(k => seenInDB.add(k)));
  activeLeads.forEach(l => getDedupKeys(l).forEach(k => seenInActive.add(k)));

  newLeads.forEach((raw, idx) => {
    const keys = getDedupKeys(raw);
    const isDBDupe = keys.some(k => seenInDB.has(k));
    const isActiveDupe = keys.some(k => seenInActive.has(k));
    const isBatchDupe = keys.some(k => seenInBatch.has(k));

    const leadObj: Lead = {
      id: raw.Sno ? `L-SNO-${raw.Sno}` : `L-${Date.now()}-${idx}`,
      Company: raw.Company || "Unknown Entity",
      Ratings: raw.Ratings || "0.0",
      Number: raw.Number || "",
      Website: raw.Website || "NONE",
      Type: raw.Type || "N/A",
      Availability: LeadStatus.UNASSIGNED,
      Summary: "",
      Check: "FALSE",
      employeeOwner: "",
      lastUpdated: new Date().toISOString()
    };

    if (isDBDupe || isActiveDupe || isBatchDupe) {
      duplicates.push(leadObj);
    } else {
      // If it's unique, mark its keys as seen in this batch
      keys.forEach(k => seenInBatch.add(k));
      cleaned.push(leadObj);
    }
  });

  return {
    cleaned,
    duplicates,
    duplicateCount: duplicates.length
  };
}
