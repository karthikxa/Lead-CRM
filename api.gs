
/***********************
 CONFIGURATION
************************/
const SPREADSHEET_ID = "1jGgm5-i3RX-g9gBmWbY9sLcxKUtV3ly1WnaJdaczk98";

const SHEETS = {
  DB: "DB",
  Kavin: "Kavin",
  Bhuvanesh: "Bhuvanesh"
};

const USERS = {
  Kavin: { password: "Kavin@3", role: "user" },
  Bhuvanesh: { password: "Bhuvanesh@11", role: "user" },
  Karthik: { password: "Karthik@17", role: "admin" }
};

/***********************
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

  } catch (err) {
    return json({ success: false, error: err.message });
  }
}

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
}
