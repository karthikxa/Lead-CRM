
export const VALID_CREDENTIALS = [
  { username: "Kavin", password: "Kavin@3", role: "EMPLOYEE" as const },
  { username: "Bhuvanesh", password: "Bhuvanesh@11", role: "EMPLOYEE" as const },
  { username: "Logesh", password: "Logesh@28", role: "EMPLOYEE" as const },
  { username: "Karthik", password: "Karthik@17", role: "ADMIN" as const }
];

// Map of user names to their respective CSV export links from the Google Sheet
// This allows the app to fetch real data without needing the Apps Script (GS) logic
export const SHEET_CSV_URLS: Record<string, string> = {
  Kavin: "https://docs.google.com/spreadsheets/d/1jGgm5-i3RX-g9gBmWbY9sLcxKUtV3ly1WnaJdaczk98/gviz/tq?tqx=out:csv&sheet=Kavin",
  Bhuvanesh: "https://docs.google.com/spreadsheets/d/1jGgm5-i3RX-g9gBmWbY9sLcxKUtV3ly1WnaJdaczk98/gviz/tq?tqx=out:csv&sheet=Bhuvanesh",
  Logesh: "https://docs.google.com/spreadsheets/d/1jGgm5-i3RX-g9gBmWbY9sLcxKUtV3ly1WnaJdaczk98/gviz/tq?tqx=out:csv&sheet=Logesh",
  DB: "https://docs.google.com/spreadsheets/d/1jGgm5-i3RX-g9gBmWbY9sLcxKUtV3ly1WnaJdaczk98/gviz/tq?tqx=out:csv&sheet=DB"
};

export const EMPLOYEE_USERS = [
  { username: "Kavin", sheetName: "Kavin" },
  { username: "Bhuvanesh", sheetName: "Bhuvanesh" },
  { username: "Logesh", sheetName: "Logesh" }
];

export const API_URL = "";
