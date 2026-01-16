// Google Apps Script for Access Management System - OPTIMIZED VERSION
// Deployed as Web App with "Execute as: Me" and "Who has access: Anyone"

// Sheet names
const SHEETS = {
  USERS: "Users",
  APPLICATIONS: "Applications",
  ACCESS_REQUESTS: "Access Requests",
  ACCESS_REGISTRY: "Access Registry",
  NOTIFICATIONS: "Notifications",
};

// Column mappings
const USER_COLUMNS = {
  ID: 0,
  NAME: 1,
  EMAIL: 2,
  ROLE: 3,
  STATUS: 4,
  JOIN_DATE: 5,
  OFFBOARD_DATE: 6,
  INVITED_BY: 7,
  CREATED_AT: 8,
};

const APPLICATION_COLUMNS = {
  ID: 0,
  NAME: 1,
  CATEGORY: 2,
  DESCRIPTION: 3,
  ADMIN_EMAILS: 4,
  CREATED_AT: 5,
  CREATED_BY: 6,
};

const ACCESS_REQUEST_COLUMNS = {
  ID: 0,
  EMPLOYEE_ID: 1,
  APPLICATION_ID: 2,
  TYPE: 3,
  STATUS: 4,
  REQUEST_DATE: 5,
  APPROVED_DATE: 6,
  APPROVED_BY: 7,
  ADMIN_NOTES: 8,
  JUSTIFICATION: 9,
  AUTO_GENERATED: 10,
};

// Cache for spreadsheet and sheets
let _spreadsheet = null;
let _sheetCache = {};

// Utility functions
function generateId() {
  return Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function getSpreadsheet() {
  if (!_spreadsheet) {
    _spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }
  return _spreadsheet;
}

function getSheet(sheetName) {
  if (!_sheetCache[sheetName]) {
    _sheetCache[sheetName] = getSpreadsheet().getSheetByName(sheetName);
  }
  return _sheetCache[sheetName];
}

// Optimized: Get all data at once with minimal processing
function getAllSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  return data.slice(1); // Remove header
}

// Google authentication helper - OPTIMIZED
function authenticateWithGoogle(credential) {
  const parts = credential.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format");
  }

  // Optimized base64 decoding
  let payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  while (payloadBase64.length % 4) payloadBase64 += "=";

  const payload = JSON.parse(
    Utilities.newBlob(Utilities.base64Decode(payloadBase64)).getDataAsString(),
  );

  // Single pass through users data
  const data = getAllSheetData(SHEETS.USERS);
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[USER_COLUMNS.EMAIL] === payload.email) {
      if (row[USER_COLUMNS.STATUS] === "active") {
        return {
          id: row[USER_COLUMNS.ID],
          name: row[USER_COLUMNS.NAME] || payload.name,
          email: payload.email,
          role: row[USER_COLUMNS.ROLE],
          status: "active",
          join_date: row[USER_COLUMNS.JOIN_DATE],
          offboard_date: row[USER_COLUMNS.OFFBOARD_DATE],
          invited_by: row[USER_COLUMNS.INVITED_BY],
          google_id: payload.sub,
        };
      } else {
        throw new Error(
          "Your account is not active. Please contact your administrator.",
        );
      }
    }
  }

  throw new Error(
    "Your email address is not authorized to access this system. Please contact your administrator to be added to the user list.",
  );
}

// Traditional authentication helper - OPTIMIZED
function authenticateUser(email, password) {
  const data = getAllSheetData(SHEETS.USERS);
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (
      row[USER_COLUMNS.EMAIL] === email &&
      row[USER_COLUMNS.STATUS] === "active"
    ) {
      return {
        id: row[USER_COLUMNS.ID],
        name: row[USER_COLUMNS.NAME],
        email: row[USER_COLUMNS.EMAIL],
        role: row[USER_COLUMNS.ROLE],
        status: row[USER_COLUMNS.STATUS],
        join_date: row[USER_COLUMNS.JOIN_DATE],
        offboard_date: row[USER_COLUMNS.OFFBOARD_DATE],
        invited_by: row[USER_COLUMNS.INVITED_BY],
      };
    }
  }
  return null;
}

// Login handler
function handleLogin(data) {
  try {
    let user;
    if (data.password === "google-token" && data.email) {
      user = authenticateWithGoogle(data.email);
    } else {
      user = authenticateUser(data.email, data.password);
    }

    if (user) {
      const token = Utilities.base64Encode(
        JSON.stringify({
          userId: user.id,
          timestamp: Date.now(),
        }),
      );
      return createResponse(true, "Login successful", { user, token });
    }
    return createResponse(false, "Invalid credentials", null, 401);
  } catch (error) {
    return createResponse(false, error.message || "Login failed", null, 500);
  }
}

// Google Login handler
function handleGoogleLogin(data) {
  try {
    if (!data.credential) {
      return createResponse(false, "No credential provided", null, 400);
    }

    const user = authenticateWithGoogle(data.credential);
    if (user) {
      const token = Utilities.base64Encode(
        JSON.stringify({
          userId: user.id,
          timestamp: Date.now(),
        }),
      );
      return createResponse(true, "Google login successful", { user, token });
    }
    return createResponse(false, "User not authorized", null, 401);
  } catch (error) {
    return createResponse(
      false,
      error.message || "Google login failed",
      null,
      500,
    );
  }
}

// Dashboard handler - OPTIMIZED with getLastRow
function handleGetDashboard() {
  const usersSheet = getSheet(SHEETS.USERS);
  const appsSheet = getSheet(SHEETS.APPLICATIONS);
  const requestsSheet = getSheet(SHEETS.ACCESS_REQUESTS);
  const registrySheet = getSheet(SHEETS.ACCESS_REGISTRY);

  return createResponse(true, "Dashboard data retrieved", {
    total_users: Math.max(0, usersSheet.getLastRow() - 1),
    total_applications: Math.max(0, appsSheet.getLastRow() - 1),
    pending_requests: Math.max(0, requestsSheet.getLastRow() - 1),
    active_access: Math.max(0, registrySheet.getLastRow() - 1),
    recent_requests: [],
    notifications: [],
  });
}

// OPTIMIZED: Batch load initial data
function handleGetInitialData() {
  const usersData = getAllSheetData(SHEETS.USERS);
  const appsData = getAllSheetData(SHEETS.APPLICATIONS);

  const users = usersData
    .filter((row) => row[USER_COLUMNS.ID])
    .map((row) => ({
      id: row[USER_COLUMNS.ID],
      name: row[USER_COLUMNS.NAME],
      email: row[USER_COLUMNS.EMAIL],
      role: row[USER_COLUMNS.ROLE],
      status: row[USER_COLUMNS.STATUS],
      join_date: row[USER_COLUMNS.JOIN_DATE],
    }));

  const applications = appsData
    .filter((row) => row[APPLICATION_COLUMNS.ID])
    .map((row) => {
      const adminEmailsStr = row[APPLICATION_COLUMNS.ADMIN_EMAILS];
      const adminEmails =
        adminEmailsStr &&
        typeof adminEmailsStr === "string" &&
        adminEmailsStr.trim()
          ? adminEmailsStr
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e)
          : [];

      return {
        id: row[APPLICATION_COLUMNS.ID],
        name: row[APPLICATION_COLUMNS.NAME],
        category: row[APPLICATION_COLUMNS.CATEGORY],
        description: row[APPLICATION_COLUMNS.DESCRIPTION],
        admin_emails: adminEmails,
        created_at: row[APPLICATION_COLUMNS.CREATED_AT],
        created_by: row[APPLICATION_COLUMNS.CREATED_BY],
      };
    });

  return createResponse(true, "Initial data loaded", {
    users,
    applications,
    stats: {
      total_users: users.length,
      total_applications: applications.length,
    },
  });
}

// OPTIMIZED Applications handler
function handleGetApplications() {
  const data = getAllSheetData(SHEETS.APPLICATIONS);

  const applications = data
    .filter((row) => row[APPLICATION_COLUMNS.ID])
    .map((row) => {
      const adminEmailsStr = row[APPLICATION_COLUMNS.ADMIN_EMAILS];
      const adminEmails =
        adminEmailsStr &&
        typeof adminEmailsStr === "string" &&
        adminEmailsStr.trim()
          ? adminEmailsStr
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e)
          : [];

      return {
        id: row[APPLICATION_COLUMNS.ID],
        name: row[APPLICATION_COLUMNS.NAME],
        category: row[APPLICATION_COLUMNS.CATEGORY],
        description: row[APPLICATION_COLUMNS.DESCRIPTION],
        admin_emails: adminEmails,
        created_at: row[APPLICATION_COLUMNS.CREATED_AT],
        created_by: row[APPLICATION_COLUMNS.CREATED_BY],
      };
    });

  return createResponse(
    true,
    `Found ${applications.length} applications`,
    applications,
  );
}

function handleCreateApplication(data) {
  const sheet = getSheet(SHEETS.APPLICATIONS);
  const existingData = getAllSheetData(SHEETS.APPLICATIONS);

  const maxId = existingData.reduce((max, row) => {
    const id = parseInt(row[APPLICATION_COLUMNS.ID]);
    return !isNaN(id) && id > max ? id : max;
  }, 0);

  const newId = maxId + 1;
  const timestamp = getCurrentTimestamp();
  const newApp = [
    newId,
    data.name || "",
    data.category || "",
    data.description || "",
    "",
    timestamp,
    "current-user",
  ];

  sheet.appendRow(newApp);
  return createResponse(true, "Application created", {
    id: newId,
    name: newApp[1],
    category: newApp[2],
    description: newApp[3],
    admin_emails: [],
    created_at: timestamp,
    created_by: "current-user",
  });
}

// OPTIMIZED: Batch update using setValues
function handleUpdateApplication(data) {
  const sheet = getSheet(SHEETS.APPLICATIONS);
  const appData = getAllSheetData(SHEETS.APPLICATIONS);

  const adminEmails = data.admin_emails
    ? data.admin_emails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e)
    : [];

  for (let i = 0; i < appData.length; i++) {
    if (appData[i][APPLICATION_COLUMNS.ID] == data.id) {
      const rowIndex = i + 2; // +2: 1 for header, 1 for 1-based indexing

      // Batch update all columns at once
      sheet
        .getRange(rowIndex, APPLICATION_COLUMNS.NAME + 1, 1, 4)
        .setValues([
          [
            data.name || "",
            data.category || "",
            data.description || "",
            adminEmails.join(","),
          ],
        ]);

      return createResponse(true, "Application updated", {
        id: data.id,
        name: data.name,
        category: data.category,
        description: data.description,
        admin_emails: adminEmails,
      });
    }
  }

  return createResponse(false, "Application not found", null, 404);
}

function handleDeleteApplication(data) {
  const sheet = getSheet(SHEETS.APPLICATIONS);
  const appData = getAllSheetData(SHEETS.APPLICATIONS);

  for (let i = 0; i < appData.length; i++) {
    if (appData[i][APPLICATION_COLUMNS.ID] == data.id) {
      sheet.deleteRow(i + 2); // +2: 1 for header, 1 for 1-based indexing
      return createResponse(true, "Application deleted", { id: data.id });
    }
  }

  return createResponse(false, "Application not found", null, 404);
}

function handleGetUsers() {
  const data = getAllSheetData(SHEETS.USERS);

  const users = data
    .filter((row) => row[USER_COLUMNS.ID])
    .map((row) => ({
      id: row[USER_COLUMNS.ID],
      name: row[USER_COLUMNS.NAME],
      email: row[USER_COLUMNS.EMAIL],
      role: row[USER_COLUMNS.ROLE],
      status: row[USER_COLUMNS.STATUS],
      join_date: row[USER_COLUMNS.JOIN_DATE],
    }));

  return createResponse(true, `Found ${users.length} users`, users);
}

// OPTIMIZED Access Registry handlers
function handleGetAccessRegistry(data) {
  const allData = getAllSheetData(SHEETS.ACCESS_REGISTRY);

  const registry = allData
    .filter((row) => {
      if (!row[0]) return false;

      const entry = {
        status: row[5] || "active",
        employee_id: row[1],
        application_id: row[2],
      };

      if (data.status && entry.status !== data.status) return false;
      if (data.employee_id && entry.employee_id != data.employee_id)
        return false;
      if (data.application_id && entry.application_id != data.application_id)
        return false;

      return true;
    })
    .map((row) => ({
      id: row[0],
      employee_id: row[1],
      application_id: row[2],
      granted_date: row[3],
      granted_by: row[4],
      status: row[5] || "active",
      revoked_date: row[6],
      revoked_by: row[7],
    }));

  return createResponse(
    true,
    `Found ${registry.length} registry entries`,
    registry,
  );
}

// OPTIMIZED: Batch update
function handleRevokeAccessRegistry(data) {
  const sheet = getSheet(SHEETS.ACCESS_REGISTRY);
  const registryData = getAllSheetData(SHEETS.ACCESS_REGISTRY);

  for (let i = 0; i < registryData.length; i++) {
    if (registryData[i][0] == data.id) {
      const rowIndex = i + 2;
      const timestamp = getCurrentTimestamp();
      const revokedBy = data.revoked_by || "current-user";

      // Batch update all 3 columns at once
      sheet
        .getRange(rowIndex, 6, 1, 3)
        .setValues([["revoked", timestamp, revokedBy]]);

      return createResponse(true, "Access revoked", {
        id: data.id,
        status: "revoked",
        revoked_date: timestamp,
        revoked_by: revokedBy,
      });
    }
  }

  return createResponse(false, "Registry entry not found", null, 404);
}

// OPTIMIZED Access Requests handlers
function handleGetAccessRequests(data) {
  let sheet = getSheet(SHEETS.ACCESS_REQUESTS);
  if (!sheet) {
    const spreadsheet = getSpreadsheet();
    spreadsheet.insertSheet(SHEETS.ACCESS_REQUESTS);
    sheet = getSheet(SHEETS.ACCESS_REQUESTS);
    sheet.appendRow([
      "ID",
      "Employee ID",
      "Application ID",
      "Type",
      "Status",
      "Request Date",
      "Approved Date",
      "Approved By",
      "Admin Notes",
      "Justification",
      "Auto Generated",
    ]);
    return createResponse(true, "Access Requests sheet created", []);
  }

  const allData = getAllSheetData(SHEETS.ACCESS_REQUESTS);

  const requests = allData
    .filter((row) => {
      if (!row[ACCESS_REQUEST_COLUMNS.ID]) return false;

      const request = {
        status: row[ACCESS_REQUEST_COLUMNS.STATUS] || "pending",
        employee_id: row[ACCESS_REQUEST_COLUMNS.EMPLOYEE_ID],
        application_id: row[ACCESS_REQUEST_COLUMNS.APPLICATION_ID],
      };

      if (data.status && request.status !== data.status) return false;
      if (data.employee_id && request.employee_id != data.employee_id)
        return false;
      if (data.application_id && request.application_id != data.application_id)
        return false;

      return true;
    })
    .map((row) => ({
      id: row[ACCESS_REQUEST_COLUMNS.ID],
      employee_id: row[ACCESS_REQUEST_COLUMNS.EMPLOYEE_ID],
      application_id: row[ACCESS_REQUEST_COLUMNS.APPLICATION_ID],
      type: row[ACCESS_REQUEST_COLUMNS.TYPE] || "new",
      status: row[ACCESS_REQUEST_COLUMNS.STATUS] || "pending",
      request_date: row[ACCESS_REQUEST_COLUMNS.REQUEST_DATE],
      approved_date: row[ACCESS_REQUEST_COLUMNS.APPROVED_DATE],
      approved_by: row[ACCESS_REQUEST_COLUMNS.APPROVED_BY],
      admin_notes: row[ACCESS_REQUEST_COLUMNS.ADMIN_NOTES],
      justification: row[ACCESS_REQUEST_COLUMNS.JUSTIFICATION],
      auto_generated: row[ACCESS_REQUEST_COLUMNS.AUTO_GENERATED] || false,
    }));

  return createResponse(
    true,
    `Found ${requests.length} access requests`,
    requests,
  );
}

function handleCreateAccessRequest(data) {
  let sheet = getSheet(SHEETS.ACCESS_REQUESTS);
  if (!sheet) {
    const spreadsheet = getSpreadsheet();
    spreadsheet.insertSheet(SHEETS.ACCESS_REQUESTS);
    sheet = getSheet(SHEETS.ACCESS_REQUESTS);
    sheet.appendRow([
      "ID",
      "Employee ID",
      "Application ID",
      "Type",
      "Status",
      "Request Date",
      "Approved Date",
      "Approved By",
      "Admin Notes",
      "Justification",
      "Auto Generated",
    ]);
  }

  const existingData = getAllSheetData(SHEETS.ACCESS_REQUESTS);
  const maxId = existingData.reduce((max, row) => {
    const id = parseInt(row[ACCESS_REQUEST_COLUMNS.ID]);
    return !isNaN(id) && id > max ? id : max;
  }, 0);

  const newId = maxId + 1;
  const timestamp = getCurrentTimestamp();

  if (!data.employee_id || !data.application_id || !data.justification) {
    return createResponse(
      false,
      "Missing required fields: employee_id, application_id, justification",
      null,
      400,
    );
  }

  const newRequest = [
    newId,
    data.employee_id,
    data.application_id,
    "new",
    "pending",
    timestamp,
    "",
    "",
    "",
    data.justification,
    false,
  ];

  sheet.appendRow(newRequest);
  return createResponse(true, "Access request created", {
    id: newId,
    employee_id: data.employee_id,
    application_id: data.application_id,
    type: "new",
    status: "pending",
    request_date: timestamp,
    justification: data.justification,
    auto_generated: false,
  });
}

// OPTIMIZED: Batch updates
function handleApproveAccessRequest(data) {
  const requestsSheet = getSheet(SHEETS.ACCESS_REQUESTS);
  const registrySheet = getSheet(SHEETS.ACCESS_REGISTRY);
  const requestData = getAllSheetData(SHEETS.ACCESS_REQUESTS);

  for (let i = 0; i < requestData.length; i++) {
    if (requestData[i][ACCESS_REQUEST_COLUMNS.ID] == data.id) {
      const rowIndex = i + 2;
      const employeeId = requestData[i][ACCESS_REQUEST_COLUMNS.EMPLOYEE_ID];
      const applicationId =
        requestData[i][ACCESS_REQUEST_COLUMNS.APPLICATION_ID];
      const timestamp = getCurrentTimestamp();

      // Batch update request status
      const approvedBy = data.approved_by || "current-user";
      requestsSheet
        .getRange(rowIndex, ACCESS_REQUEST_COLUMNS.STATUS + 1, 1, 3)
        .setValues([["approved", timestamp, approvedBy]]);

      if (data.notes) {
        requestsSheet
          .getRange(rowIndex, ACCESS_REQUEST_COLUMNS.ADMIN_NOTES + 1)
          .setValue(data.notes);
      }

      // Create registry entry
      const registryData = getAllSheetData(SHEETS.ACCESS_REGISTRY);
      const registryId = registryData.reduce((max, row) => {
        const id = parseInt(row[0]);
        return !isNaN(id) && id >= max ? id + 1 : max;
      }, 1);

      registrySheet.appendRow([
        registryId,
        employeeId,
        applicationId,
        timestamp,
        approvedBy,
        "active",
        "",
        "",
      ]);

      return createResponse(
        true,
        "Access request approved and registry entry created",
        {
          request: {
            id: data.id,
            status: "approved",
            approved_date: timestamp,
            approved_by: approvedBy,
            admin_notes: data.notes || "",
          },
          registry: {
            id: registryId,
            employee_id: employeeId,
            application_id: applicationId,
            granted_date: timestamp,
            granted_by: "current-user",
            status: "active",
          },
        },
      );
    }
  }

  return createResponse(false, "Access request not found", null, 404);
}

function handleRejectAccessRequest(data) {
  const sheet = getSheet(SHEETS.ACCESS_REQUESTS);
  const requestData = getAllSheetData(SHEETS.ACCESS_REQUESTS);

  for (let i = 0; i < requestData.length; i++) {
    if (requestData[i][ACCESS_REQUEST_COLUMNS.ID] == data.id) {
      const rowIndex = i + 2;
      const timestamp = getCurrentTimestamp();
      const rejectedBy = data.rejected_by || "current-user";

      // Update status and approved_by (used for both approval and rejection)
      sheet
        .getRange(rowIndex, ACCESS_REQUEST_COLUMNS.STATUS + 1, 1, 3)
        .setValues([["rejected", timestamp, rejectedBy]]);

      if (data.notes) {
        sheet
          .getRange(rowIndex, ACCESS_REQUEST_COLUMNS.ADMIN_NOTES + 1)
          .setValue(data.notes);
      }

      return createResponse(true, "Access request rejected", {
        id: data.id,
        status: "rejected",
        approved_date: timestamp,
        approved_by: rejectedBy,
        admin_notes: data.notes || "",
      });
    }
  }

  return createResponse(false, "Access request not found", null, 404);
}

// Response helper
function createResponse(success, message, data = null, statusCode = 200) {
  const response = {
    success,
    data,
    timestamp: getCurrentTimestamp(),
    request_id: generateId(),
  };

  if (!success) {
    response.error = { code: "ERROR", message: message, details: null };
  } else {
    response.message = message;
  }

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doOptions(e) {
  return HtmlService.createHtmlOutput("")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setTitle("CORS Handler");
}

// Web app handlers
function doPost(e) {
  let data = {};
  try {
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
  } catch (error) {
    // Use query parameters if JSON parsing fails
  }

  if (e.parameter) {
    data = { ...data, ...e.parameter };
  }

  const path = data.path || "auth/login";

  if (path.startsWith("access-requests/")) {
    const [, id, action] = path.split("/");
    if (action === "approve")
      return handleApproveAccessRequest({ ...data, id });
    if (action === "reject") return handleRejectAccessRequest({ ...data, id });
  }

  if (path.startsWith("access-registry/")) {
    const [, id, action] = path.split("/");
    if (action === "revoke") return handleRevokeAccessRegistry({ ...data, id });
  }

  switch (path) {
    case "auth/login":
      return handleLogin(data);
    case "auth/google-login":
      return handleGoogleLogin(data);
    case "applications":
      return handleCreateApplication(data);
    case "applications/update":
      return handleUpdateApplication(data);
    case "applications/delete":
      return handleDeleteApplication(data);
    case "access-requests":
      return handleCreateAccessRequest(data);
    default:
      return createResponse(false, "Endpoint not found", null, 404);
  }
}

function doGet(e) {
  const path = e.parameter.path || "dashboard";

  switch (path) {
    case "dashboard":
      return handleGetDashboard();
    case "users":
      return handleGetUsers();
    case "applications":
      return handleGetApplications();
    case "access-requests":
      return handleGetAccessRequests(e.parameter);
    case "access-registry":
      return handleGetAccessRegistry(e.parameter);
    case "initial-data":
      return handleGetInitialData();
    case "auth/login":
      return handleLogin(e.parameter);
    default:
      return createResponse(false, "Endpoint not found", null, 404);
  }
}
