
/***********************
<<<<<<< HEAD
CONFIGURATION
=======
 CONFIGURATION
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
************************/
const SPREADSHEET_ID = "1jGgm5-i3RX-g9gBmWbY9sLcxKUtV3ly1WnaJdaczk98";

const SHEETS = {
  DB: "DB",
  Kavin: "Kavin",
<<<<<<< HEAD
  Bhuvanesh: "Bhuvanesh",
  Logesh: "Logesh"
=======
  Bhuvanesh: "Bhuvanesh"
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
};

const USERS = {
  Kavin: { password: "Kavin@3", role: "user" },
  Bhuvanesh: { password: "Bhuvanesh@11", role: "user" },
<<<<<<< HEAD
  Logesh: { password: "Logesh@28", role: "user" },
=======
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  Karthik: { password: "Karthik@17", role: "admin" }
};

/***********************
<<<<<<< HEAD
HELPERS - NORMALIZATION
************************/
function normalizePhone(p) {
  if (!p || String(p).toLowerCase() === "n/a") return "";
  return p.toString().replace(/\D/g, "").slice(-10);
}

function normalizeKeyText(t) {
  if (!t || String(t).toLowerCase() === "n/a" || String(t).toLowerCase() === "unknown entity") return "";
  return t.toString().toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function getLeadKey(phone, company) {
  const p = normalizePhone(phone);
  const c = normalizeKeyText(company);
  if (!p && !c) return null;
  // Prioritize phone for unique mapping, fallback to company
  return p ? "P_" + p : "C_" + c;
}

function normalizeStatus(value) {
  if (!value) return "";
  let status = String(value).toLowerCase().trim();
  if (status.includes("booked") || status === "book") return "booked";
  if (status.includes("decline") || status.includes("reject")) return "declined";
  if (status.includes("follow")) return "follow up";
  if (status.includes("busy")) return "busy";
  return status;
}

/***********************
HELPERS - COLUMN FINDER
************************/
function findColumnIndex(headers, possibleNames) {
  for (let i = 0; i < headers.length; i++) {
    const headerClean = String(headers[i]).trim().toLowerCase();
    for (let name of possibleNames) {
      if (headerClean === name.toLowerCase()) return i;
    }
  }
  return -1;
}

function getDBColumns(headers) {
  return {
    Sno: findColumnIndex(headers, ["sno", "s.no", "s no", "serial"]),
    Company: findColumnIndex(headers, ["company", "company name"]),
    Ratings: findColumnIndex(headers, ["ratings", "rating"]),
    Number: findColumnIndex(headers, ["number", "phone", "mobile", "contact"]),
    Website: findColumnIndex(headers, ["website", "web", "url"]),
    Type: findColumnIndex(headers, ["type", "category"]),
    Availability: findColumnIndex(headers, ["availability", "status"]),
    Instagram: findColumnIndex(headers, ["instagram", "insta", "ig"]),
    Gmail: findColumnIndex(headers, ["gmail", "email", "mail"]),
    Location: findColumnIndex(headers, ["location", "area", "address"]),
    Summary: findColumnIndex(headers, ["summary", "notes", "remarks"]),
    Check: findColumnIndex(headers, ["check", "checked", "done"]),
    DateTime: findColumnIndex(headers, ["date&time", "datetime", "timestamp"]),
    Username: findColumnIndex(headers, ["username", "user", "assigned"])
  };
}

function buildRowObject(row, headers) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[String(h).trim()] = row[i];
  });
  return obj;
}

function json(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/***********************
ENTRY POINTS
************************/
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const username = body.username;

    switch (action) {
      case "login": return json(login(body.username, body.password));
      case "fetchAll": return json(fetchAllData(username));
      case "submitLead": return json(submitLead(username, body.lead));
      case "updateTask": return json(updateTask(username, body.lead));
      default: return json({ success: false, error: "Invalid action" });
    }
=======
 HELPERS
************************/
function normalizePhone(p) {
  return p ? p.toString().replace(/\D/g, "").slice(-10) : "";
}

function normalizeText(t) {
  return (t || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function findUser(username) {
  if (!username) return null;
  const target = username.toLowerCase();
  for (let key in USERS) {
    if (key.toLowerCase() === target) return { name: key, ...USERS[key] };
  }
  return null;
}

/***********************
 ENTRY POINTS
************************/
function doGet() {
  return json({ status: "ZODZY CRM API LIVE", time: new Date().toISOString() });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === "login")
      return json(login(body.username, body.password));

    if (body.action === "fetchActive")
      return json(fetchActiveLeads(body.username));

    if (body.action === "fetchTasks")
      return json(fetchTasks(body.username));

    if (body.action === "appendCompleted")
      return json(appendCompletedLeads(body.username, body.leads));

    if (body.action === "fetchAnalytics")
      return json(fetchAnalytics(body.username));

    return json({ success: false, error: "Invalid action" });

>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
  } catch (err) {
    return json({ success: false, error: err.message });
  }
}

<<<<<<< HEAD
function login(username, password) {
  if (!USERS[username] || USERS[username].password !== password) {
    return { success: false, error: "Authentication failed" };
  }
  return { success: true, user: username, role: USERS[username].role, initialData: fetchAllData(username) };
}

function fetchAllData(username) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const dashboard = fetchActiveLeadsInternal(username, ss);
  const tasks = fetchTasksInternal(username, ss);
  const analytics = fetchAnalyticsInternal(username, ss);
  
  return {
    success: true,
    dashboard: dashboard.data || [],
    tasks: tasks.data || [],
    analytics: analytics.data || [],
    alerts: (USERS[username].role === 'admin') ? [] : [] // Logic for alerts omitted for brevity
  };
}

function fetchActiveLeadsInternal(username, ss) {
  const userSheet = ss.getSheetByName(username);
  if (!userSheet) return { data: [] };

  const dbSheet = ss.getSheetByName(SHEETS.DB);
  const dbData = dbSheet.getDataRange().getValues();
  const dbHeaders = dbData.shift();
  const dbCOL = getDBColumns(dbHeaders);

  // Map of all keys currently in the Database
  const usedKeys = new Set();
  dbData.forEach(row => {
    const p = dbCOL.Number >= 0 ? row[dbCOL.Number] : "";
    const c = dbCOL.Company >= 0 ? row[dbCOL.Company] : "";
    const key = getLeadKey(p, c);
    if (key) usedKeys.add(key);
  });

  const userData = userSheet.getDataRange().getValues();
  if (userData.length <= 1) return { data: [] };
  const userHeaders = userData.shift();
  const uNumIdx = findColumnIndex(userHeaders, ["number", "phone", "mobile", "contact"]);
  const uCompIdx = findColumnIndex(userHeaders, ["company", "company name"]);

  const active = [];
  userData.forEach((row) => {
    const p = uNumIdx >= 0 ? row[uNumIdx] : "";
    const c = uCompIdx >= 0 ? row[uCompIdx] : "";
    const key = getLeadKey(p, c);
    
    // Only include if it has a key AND that key isn't in DB already
    if (key && !usedKeys.has(key)) {
      active.push(buildRowObject(row, userHeaders));
    }
  });
  return { data: active };
}

function fetchTasksInternal(username, ss) {
  const dbSheet = ss.getSheetByName(SHEETS.DB);
  const data = dbSheet.getDataRange().getValues();
  if (data.length <= 1) return { data: [] };
  const headers = data.shift();
  const COL = getDBColumns(headers);
  const tasks = [];
  data.forEach(row => {
    const status = normalizeStatus(row[COL.Availability]);
    const rowUser = COL.Username >= 0 ? String(row[COL.Username]).trim() : "";
    if ((status === "follow up" || status === "busy") && (rowUser === username || USERS[username].role === 'admin')) {
      tasks.push(buildRowObject(row, headers));
    }
  });
  return { data: tasks };
}

function fetchAnalyticsInternal(username, ss) {
  const dbSheet = ss.getSheetByName(SHEETS.DB);
  const data = dbSheet.getDataRange().getValues();
  if (data.length <= 1) return { data: [] };
  const headers = data.shift();
  const COL = getDBColumns(headers);
  const items = [];
  data.forEach(row => {
    const status = normalizeStatus(row[COL.Availability]);
    const rowUser = COL.Username >= 0 ? String(row[COL.Username]).trim() : "";
    if ((status === "booked" || status === "declined") && (rowUser === username || USERS[username].role === 'admin')) {
      items.push(buildRowObject(row, headers));
    }
  });
  return { data: items };
}

function submitLead(username, lead) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const dbSheet = ss.getSheetByName(SHEETS.DB);
  const dbData = dbSheet.getDataRange().getValues();
  const headers = dbData.shift();
  const COL = getDBColumns(headers);
  const key = getLeadKey(lead.Number, lead.Company);

  // Check for duplicate to avoid multiple appends
  if (key) {
    for (let i = 0; i < dbData.length; i++) {
      if (getLeadKey(dbData[i][COL.Number], dbData[i][COL.Company]) === key) {
        return updateTask(username, lead);
      }
    }
  }

  const newRow = Array(headers.length).fill("");
  if (COL.Sno >= 0) newRow[COL.Sno] = dbData.length + 1;
  if (COL.Company >= 0) newRow[COL.Company] = lead.Company || "Unknown Entity";
  if (COL.Ratings >= 0) newRow[COL.Ratings] = lead.Ratings || 0;
  if (COL.Number >= 0) newRow[COL.Number] = lead.Number || "";
  if (COL.Website >= 0) newRow[COL.Website] = lead.Website || "";
  if (COL.Type >= 0) newRow[COL.Type] = lead.Type || "";
  if (COL.Availability >= 0) newRow[COL.Availability] = normalizeStatus(lead.Availability);
  if (COL.Summary >= 0) newRow[COL.Summary] = lead.Summary || "";
  if (COL.Username >= 0) newRow[COL.Username] = username;
  if (COL.DateTime >= 0) newRow[COL.DateTime] = new Date();
  if (COL.Check >= 0) newRow[COL.Check] = true;
  if (COL.Instagram >= 0) newRow[COL.Instagram] = lead.Instagram || "";
  if (COL.Gmail >= 0) newRow[COL.Gmail] = lead.Gmail || "";
  if (COL.Location >= 0) newRow[COL.Location] = lead.Location || "";

  dbSheet.appendRow(newRow);
  SpreadsheetApp.flush();
  Utilities.sleep(600); // Ensure sheet internal indices catch up
  return { success: true, data: fetchAllData(username) };
}

function updateTask(username, lead) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const dbSheet = ss.getSheetByName(SHEETS.DB);
  const data = dbSheet.getDataRange().getValues();
  const headers = data.shift();
  const COL = getDBColumns(headers);
  const key = getLeadKey(lead.Number, lead.Company);

  let rowNum = -1;
  if (key) {
    for (let i = 0; i < data.length; i++) {
      if (getLeadKey(data[i][COL.Number], data[i][COL.Company]) === key) {
        rowNum = i + 2;
        break;
      }
    }
  }

  if (rowNum === -1) return { success: false, error: "Lead identifier not found in database" };

  if (COL.Availability >= 0) dbSheet.getRange(rowNum, COL.Availability + 1).setValue(normalizeStatus(lead.Availability));
  if (COL.Summary >= 0) dbSheet.getRange(rowNum, COL.Summary + 1).setValue(lead.Summary || "");
  if (COL.DateTime >= 0) dbSheet.getRange(rowNum, COL.DateTime + 1).setValue(new Date());
  if (COL.Check >= 0) dbSheet.getRange(rowNum, COL.Check + 1).setValue(true);
  if (COL.Instagram >= 0 && lead.Instagram) dbSheet.getRange(rowNum, COL.Instagram + 1).setValue(lead.Instagram);
  if (COL.Gmail >= 0 && lead.Gmail) dbSheet.getRange(rowNum, COL.Gmail + 1).setValue(lead.Gmail);
  if (COL.Location >= 0 && lead.Location) dbSheet.getRange(rowNum, COL.Location + 1).setValue(lead.Location);

  SpreadsheetApp.flush();
  Utilities.sleep(600);
  return { success: true, data: fetchAllData(username) };
=======
/***********************
 AUTH
************************/
function login(username, password) {
  const userObj = findUser(username);
  if (!userObj) return { success: false, error: "User not found" };
  if (userObj.password !== password)
    return { success: false, error: "Incorrect password" };

  return {
    success: true,
    user: userObj.name,
    role: userObj.role
  };
}

/***********************
 FETCH ACTIVE LEADS
************************/
function fetchActiveLeads(username) {
  const userObj = findUser(username);
  if (!userObj) throw new Error("Unauthorized");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = ss.getSheetByName(userObj.name);
  if (!userSheet) throw new Error("User data sheet not found");
  
  const dbSheet = ss.getSheetByName(SHEETS.DB);
  if (!dbSheet) throw new Error("Master database sheet not found");

  const dbRows = dbSheet.getDataRange().getValues();
  const dbHeaders = dbRows.shift();
  const DB_COL = {};
  dbHeaders.forEach((h, i) => (DB_COL[h.toLowerCase()] = i));

  const completedIndex = new Set();
  const numCol = DB_COL["number"];
  const compCol = DB_COL["company"];

  dbRows.forEach(r => {
    const key = normalizePhone(r[numCol]) || normalizeText(r[compCol]);
    if (key) completedIndex.add(key);
  });

  const rows = userSheet.getDataRange().getValues();
  if (rows.length < 2) return { success: true, user: userObj.name, total: 0, data: [] };
  
  const headers = rows.shift();
  const localIndex = new Set();
  const output = [];

  rows.forEach(r => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = r[i]));

    const key = normalizePhone(obj.Number) || normalizeText(obj.Company);
    if (!key || completedIndex.has(key) || localIndex.has(key)) return;

    localIndex.add(key);
    output.push(obj);
  });

  return { success: true, user: userObj.name, total: output.length, data: output };
}

/***********************
 FETCH TASKS (FOLLOW-UP / BUSY FROM DB)
************************/
function fetchTasks(username) {
  const userObj = findUser(username);
  if (!userObj) throw new Error("Unauthorized");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.DB);
  if (!sheet) throw new Error("Master database sheet not found");

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return { success: true, data: [] };

  const headers = rows.shift();
  const COL = {};
  headers.forEach((h, i) => (COL[h.toLowerCase()] = i));

  const output = [];
  const statusCol = COL["availability"];
  const userCol = COL["username"];

  rows.forEach(r => {
    const status = String(r[statusCol] || "").toLowerCase();
    const rowUser = String(r[userCol] || "").toLowerCase();

    if ((status === "follow up" || status === "busy") && 
        (userObj.role === "admin" || rowUser === userObj.name.toLowerCase())) {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = r[i]));
      output.push(obj);
    }
  });

  return { success: true, data: output };
}

/***********************
 APPEND COMPLETED
************************/
function appendCompletedLeads(username, leads) {
  const userObj = findUser(username);
  if (!userObj) throw new Error("Unauthorized");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.DB);
  if (!sheet) throw new Error("Master database sheet not found");

  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const COL = {};
  headers.forEach((h, i) => (COL[h.toLowerCase()] = i));

  const finalizedIndex = new Set();
  const numCol = COL["number"];
  const compCol = COL["company"];
  const snoCol = COL["sno"];
  const statusCol = COL["availability"];

  rows.forEach(r => {
    const status = String(r[statusCol] || "").toLowerCase();
    if (status === "booked" || status === "declined") {
      const key = normalizePhone(r[numCol]) || normalizeText(r[compCol]);
      if (key) finalizedIndex.add(key);
    }
  });

  let lastSno = rows.length ? Number(rows[rows.length - 1][snoCol]) || 0 : 0;
  const now = new Date();
  const insert = [];

  leads.forEach(l => {
    const availability = (l.Availability || "").toLowerCase();
    if (!["booked", "declined", "follow up", "busy"].includes(availability)) return;

    const key = normalizePhone(l.Number) || normalizeText(l.Company);
    if ((availability === "booked" || availability === "declined") && key && finalizedIndex.has(key)) return;

    lastSno++;
    insert.push([
      lastSno, l.Company || "", l.Ratings || "0.0", l.Number || "", 
      l.Website || "NONE", l.Type || "N/A", availability, l.Summary || "", 
      "TRUE", now, userObj.name
    ]);
  });

  if (insert.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, insert.length, insert[0].length).setValues(insert);
  }

  return { success: true, inserted: insert.length };
}

/***********************
 FETCH ANALYTICS
************************/
function fetchAnalytics(username) {
  const userObj = findUser(username);
  if (!userObj) throw new Error("Unauthorized");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.DB);
  if (!sheet) throw new Error("Master database sheet not found");

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return { success: true, data: [] };

  const headers = rows.shift();
  const COL = {};
  headers.forEach((h, i) => (COL[h.toLowerCase()] = i));

  const output = [];
  const usernameCol = COL["username"];

  rows.forEach(r => {
    const rowUser = String(r[usernameCol] || "").toLowerCase();
    if (userObj.role === "admin" || rowUser === userObj.name.toLowerCase()) {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = r[i]));
      output.push(obj);
    }
  });

  return { success: true, total: output.length, data: output };
>>>>>>> 6c51c09624cc1a13d393f6fc3645ca050fe88c1c
}
