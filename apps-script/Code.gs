// ============================================================
// GIP MANAGEMENT SYSTEM — Google Apps Script Backend
// File: Code.gs
// Deploy: Extensions → Apps Script → Deploy → New Deployment
//         Type: Web App | Execute as: Me | Access: Anyone
// ============================================================
//
// This file is the source of truth for the Apps Script backend.
// Paste it into the Apps Script editor, then publish a NEW VERSION
// (Deploy → Manage deployments → Edit → Version: New version → Deploy).
// Editing the code alone does NOT update the live web app.
//
// SCRIPT PROPERTIES (Project Settings → Script Properties):
//   API_SECRET → must match NEXT_PUBLIC_API_SECRET in .env.local
//
// SHEET NAMES (must exist exactly):
//   MASTER, BATCHES, TRANSMITTAL_LOG, USERS
//
// The DOC_* names below must match the MASTER header row exactly.
// ============================================================

var SHEETS = {
  MASTER:      "MASTER",
  BATCHES:     "BATCHES",
  TRANSMITTAL: "TRANSMITTAL_LOG",
  USERS:       "USERS"
};

var DOC_FIELDS = [
  "DOC_RESUME",
  "DOC_BIRTH_CERTIFICATE",
  "DOC_VALID_ID",
  "DOC_CERTIFICATE_OF_INDIGENCY",
  "DOC_TOR",
  "DOC_DIPLOMA",
  "DOC_GIP_FORM"
];

// These strings become the MISSING_DOCUMENTS cell, so they must match the
// shortLabel values in src/lib/constants.ts.
var DOC_SHORT_LABELS = {
  DOC_RESUME:                   "Resume",
  DOC_BIRTH_CERTIFICATE:        "PSA Birth",
  DOC_VALID_ID:                 "Valid ID",
  DOC_CERTIFICATE_OF_INDIGENCY: "Indigency",
  DOC_TOR:                      "TOR",
  DOC_DIPLOMA:                  "Diploma",
  DOC_GIP_FORM:                 "GIP Form"
};

var TOTAL_REQUIRED_DOCS = 7;

// ============================================================
// ENTRY POINTS
// ============================================================

function doGet(e) {
  try {
    if (!verifySecret(e)) return unauthorized();
    var action = (e.parameter && e.parameter.action) ? e.parameter.action : "";
    var body = null;
    if (e.parameter && e.parameter.data) {
      try { body = JSON.parse(e.parameter.data); } catch (_) { body = null; }
    }
    return route(action, e.parameter, body);
  } catch (err) {
    return errorResponse("Server error (GET): " + err.message);
  }
}

function doPost(e) {
  try {
    if (!verifySecret(e)) return unauthorized();
    var body = {};
    var action = "";
    try {
      body   = JSON.parse(e.postData.contents || "{}");
      action = body.action || (e.parameter && e.parameter.action) || "";
    } catch (_) {
      return errorResponse("Invalid JSON body");
    }
    return route(action, e.parameter, body);
  } catch (err) {
    return errorResponse("Server error (POST): " + err.message);
  }
}

// ── Router ────────────────────────────────────────────────────

function route(action, params, body) {
  switch (action) {
    case "register":            return handleRegister(body);
    case "updateDocument":      return handleUpdateDocument(body);
    case "approveApplicant":    return handleApprove(body);
    case "getDashboard":        return handleGetDashboard(params || body);
    case "getApplicants":       return handleGetApplicants(params);
    case "getApplicant":        return handleGetApplicant(params);
    case "getIncomplete":       return handleGetIncomplete();
    case "getBatches":          return handleGetBatches();
    case "createBatch":         return handleCreateBatch(body);
    case "updateBatchStatus":   return handleUpdateBatchStatus(body);
    case "generateTransmittal": return handleGenerateTransmittal(body);
    case "login":               return handleLogin(body);
    default:
      return errorResponse("Unknown action: " + action, "UNKNOWN_ACTION");
  }
}

// ============================================================
// AUTHENTICATION
// ============================================================

function verifySecret(e) {
  var expected = PropertiesService.getScriptProperties().getProperty("API_SECRET");
  if (!expected || expected === "") return true;
  var provided = (e.parameter && e.parameter.apiSecret) ? e.parameter.apiSecret : "";
  if (!provided && e.postData) {
    try { provided = JSON.parse(e.postData.contents || "{}").apiSecret || ""; } catch (_) {}
  }
  return provided === expected;
}

function handleLogin(body) {
  if (!body || !body.username || !body.password) {
    return errorResponse("Username and password required");
  }
  var sheet = getSheet(SHEETS.USERS);
  var rows  = sheetToObjects(sheet);
  var user  = null;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].USERNAME)      === String(body.username) &&
        String(rows[i].PASSWORD_HASH) === String(body.password) &&
        String(rows[i].STATUS)        === "ACTIVE") {
      user = rows[i];
      break;
    }
  }
  if (!user) return errorResponse("Invalid username or password", "AUTH_FAILED");

  var token = Utilities.base64Encode(
    user.USER_ID + ":" + Date.now() + ":" + user.ROLE
  );

  var headers  = getHeaders(sheet);
  var rowIndex = findRowByField(sheet, headers, "USER_ID", user.USER_ID);
  if (rowIndex > 0) {
    var col = headers.indexOf("LAST_LOGIN") + 1;
    if (col > 0) sheet.getRange(rowIndex, col).setValue(nowTimestamp());
  }

  return success({
    user: {
      USER_ID:      user.USER_ID,
      USERNAME:     user.USERNAME,
      FULL_NAME:    user.FULL_NAME,
      ROLE:         user.ROLE,
      MUNICIPALITY: user.MUNICIPALITY
    },
    token: token
  });
}

// ============================================================
// 1. REGISTER APPLICANT
// ============================================================

function handleRegister(body) {
  if (!body) return errorResponse("No data received");

  var sheet   = getSheet(SHEETS.MASTER);
  var headers = getHeaders(sheet);

  // Generate GIP_ID
  var year    = new Date().getFullYear();
  var seq     = 1;
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    var gipCol  = headers.indexOf("GIP_ID") + 1;
    var gipVals = sheet.getRange(2, gipCol, lastRow - 1, 1).getValues();
    var maxSeq  = 0;
    for (var i = 0; i < gipVals.length; i++) {
      var m = String(gipVals[i][0]).match(/^GIP-(\d{4})-(\d{5})$/);
      if (m && parseInt(m[1]) === year && parseInt(m[2]) > maxSeq) {
        maxSeq = parseInt(m[2]);
      }
    }
    seq = maxSeq + 1;
  }
  var gipId = "GIP-" + year + "-" + padLeft(seq, 5);

  // Auto-assign open batch
  var batchInfo = getOpenBatch();

  // Compute document status
  var submittedCount = 0;
  var missingDocs    = [];
  for (var d = 0; d < DOC_FIELDS.length; d++) {
    var f = DOC_FIELDS[d];
    if (boolVal(body[f])) {
      submittedCount++;
    } else {
      missingDocs.push(DOC_SHORT_LABELS[f]);
    }
  }

  var docStatus     = submittedCount === TOTAL_REQUIRED_DOCS ? "COMPLETE" : "INCOMPLETE";
  var dateCompleted = docStatus === "COMPLETE" ? todayDate() : "";

  var row = buildRow(headers, {
    GIP_ID:               gipId,
    TIMESTAMP:            nowTimestamp(),
    DATE_REGISTERED:      todayDate(),
    BATCH_DATE:           batchInfo.BATCH_DATE,
    BATCH_NAME:           batchInfo.BATCH_NAME,
    REGISTRATION_STATUS:  docStatus,
    DOCUMENT_STATUS:      docStatus,
    APPLICATION_STATUS:   "PENDING",
    DATE_COMPLETED:       dateCompleted,
    APPROVED_BY:          "",
    DATE_APPROVED:        "",
    SURNAME:              upper(body.SURNAME),
    FIRST_NAME:           upper(body.FIRST_NAME),
    MIDDLE_NAME:          upper(body.MIDDLE_NAME || ""),
    EXTENSION_NAME:       upper(body.EXTENSION_NAME || ""),
    DATE_OF_BIRTH:        body.DATE_OF_BIRTH || "",
    PLACE_OF_BIRTH:       body.PLACE_OF_BIRTH || "",
    CITIZENSHIP:          body.CITIZENSHIP || "FILIPINO",
    SEX:                  upper(body.SEX || ""),
    CIVIL_STATUS:         upper(body.CIVIL_STATUS || ""),
    CONTACT_NUMBER:       body.CONTACT_NUMBER || "",
    EMAIL:                body.EMAIL || "",
    FACEBOOK_NAME:        body.FACEBOOK_NAME || "",
    PRESENT_ADDRESS:      body.PRESENT_ADDRESS || "",
    PERMANENT_ADDRESS:    body.PERMANENT_ADDRESS || "",
    MUNICIPALITY:         upper(body.MUNICIPALITY || ""),
    BARANGAY:             upper(body.BARANGAY || ""),
    FATHER_NAME:          upper(body.FATHER_NAME || ""),
    FATHER_OCCUPATION:    body.FATHER_OCCUPATION || "",
    FATHER_CONTACT:       body.FATHER_CONTACT || "",
    MOTHER_NAME:          upper(body.MOTHER_NAME || ""),
    MOTHER_OCCUPATION:    body.MOTHER_OCCUPATION || "",
    MOTHER_CONTACT:       body.MOTHER_CONTACT || "",
    EDUCATIONAL_STATUS:   upper(body.EDUCATIONAL_STATUS || ""),
    SCHOOL_NAME:          body.SCHOOL_NAME || "",
    COURSE:               body.COURSE || "",
    YEAR_LEVEL:           body.YEAR_LEVEL || "",
    SHS_TRACK:            body.SHS_TRACK || "",
    WITH_SUMMER_CLASS:    boolVal(body.WITH_SUMMER_CLASS),
    GRADUATING_NEXT_YEAR: boolVal(body.GRADUATING_NEXT_YEAR),
    SECTOR:               upper(body.SECTOR || ""),
    TARGET_GROUP:         upper(body.TARGET_GROUP || ""),
    FIRST_TIME_APPLICANT: boolVal(body.FIRST_TIME_APPLICANT),
    PREVIOUS_GIP_AVAILMENT: body.PREVIOUS_GIP_AVAILMENT || "",
    DOC_RESUME:                   boolVal(body.DOC_RESUME),
    DOC_BIRTH_CERTIFICATE:        boolVal(body.DOC_BIRTH_CERTIFICATE),
    DOC_VALID_ID:                 boolVal(body.DOC_VALID_ID),
    DOC_CERTIFICATE_OF_INDIGENCY: boolVal(body.DOC_CERTIFICATE_OF_INDIGENCY),
    DOC_TOR:                      boolVal(body.DOC_TOR),
    DOC_DIPLOMA:                  boolVal(body.DOC_DIPLOMA),
    DOC_GIP_FORM:                 boolVal(body.DOC_GIP_FORM),
    TOTAL_REQUIRED_DOCS:  TOTAL_REQUIRED_DOCS,
    TOTAL_SUBMITTED_DOCS: submittedCount,
    MISSING_DOCUMENTS:    missingDocs.join(", "),
    AUTHORIZATION_AGREEMENT: boolVal(body.AUTHORIZATION_AGREEMENT),
    REMARKS:              body.REMARKS || ""
  });

  sheet.appendRow(row);
  if (batchInfo.BATCH_ID) incrementBatchCount(batchInfo.BATCH_ID);

  return success({
    GIP_ID:               gipId,
    BATCH_NAME:           batchInfo.BATCH_NAME,
    DATE_REGISTERED:      todayDate(),
    DOCUMENT_STATUS:      docStatus,
    MISSING_DOCUMENTS:    missingDocs.join(", "),
    TOTAL_SUBMITTED_DOCS: submittedCount,
    TOTAL_REQUIRED_DOCS:  TOTAL_REQUIRED_DOCS
  }, "Registration successful");
}

// ============================================================
// 2. UPDATE DOCUMENT CHECKBOX
// ============================================================

function handleUpdateDocument(body) {
  if (!body || !body.GIP_ID || !body.field) {
    return errorResponse("GIP_ID and field are required");
  }
  if (DOC_FIELDS.indexOf(body.field) === -1) {
    return errorResponse("Invalid document field: " + body.field);
  }

  var sheet   = getSheet(SHEETS.MASTER);
  var headers = getHeaders(sheet);
  var rowIdx  = findRowByField(sheet, headers, "GIP_ID", body.GIP_ID);
  if (rowIdx < 0) return errorResponse("Applicant not found: " + body.GIP_ID, "NOT_FOUND");

  var newValue = boolVal(body.value);
  var fieldCol = headers.indexOf(body.field) + 1;
  if (fieldCol <= 0) {
    return errorResponse("Column not found in MASTER sheet: " + body.field);
  }
  sheet.getRange(rowIdx, fieldCol).setValue(newValue);

  // Re-read row to recompute doc status
  var rowData = sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
  var rowObj  = {};
  for (var i = 0; i < headers.length; i++) rowObj[headers[i]] = rowData[i];

  var submittedCount = 0;
  var missingDocs    = [];
  for (var d = 0; d < DOC_FIELDS.length; d++) {
    var fd = DOC_FIELDS[d];
    if (rowObj[fd] === true || rowObj[fd] === "TRUE") {
      submittedCount++;
    } else {
      missingDocs.push(DOC_SHORT_LABELS[fd]);
    }
  }

  var docStatus     = submittedCount === TOTAL_REQUIRED_DOCS ? "COMPLETE" : "INCOMPLETE";
  var dateCompleted = "";
  if (docStatus === "COMPLETE" && (!rowObj.DATE_COMPLETED || rowObj.DATE_COMPLETED === "")) {
    dateCompleted = todayDate();
  } else {
    dateCompleted = toDateStr(rowObj.DATE_COMPLETED) || "";
  }

  batchUpdateRow(sheet, headers, rowIdx, {
    TOTAL_SUBMITTED_DOCS: submittedCount,
    MISSING_DOCUMENTS:    missingDocs.join(", "),
    DOCUMENT_STATUS:      docStatus,
    REGISTRATION_STATUS:  docStatus,
    DATE_COMPLETED:       dateCompleted
  });

  return success({
    GIP_ID:               body.GIP_ID,
    DOCUMENT_STATUS:      docStatus,
    REGISTRATION_STATUS:  docStatus,
    TOTAL_SUBMITTED_DOCS: submittedCount,
    MISSING_DOCUMENTS:    missingDocs.join(", "),
    DATE_COMPLETED:       dateCompleted
  });
}

// ============================================================
// 3. APPROVE / DISAPPROVE APPLICANT
// ============================================================

function handleApprove(body) {
  if (!body || !body.GIP_ID || !body.action) {
    return errorResponse("GIP_ID and action required");
  }

  var sheet   = getSheet(SHEETS.MASTER);
  var headers = getHeaders(sheet);
  var rowIdx  = findRowByField(sheet, headers, "GIP_ID", body.GIP_ID);
  if (rowIdx < 0) return errorResponse("Applicant not found", "NOT_FOUND");

  var newStatus    = body.action === "APPROVE" ? "APPROVED" : "DISAPPROVED";
  var dateApproved = todayDate();
  var approvedBy   = body.approvedBy || "Admin";

  batchUpdateRow(sheet, headers, rowIdx, {
    APPLICATION_STATUS: newStatus,
    APPROVED_BY:        approvedBy,
    DATE_APPROVED:      dateApproved
  });

  // When approved — update slot count in BATCHES sheet
  if (newStatus === "APPROVED") {
    var rowData = sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
    var rowObj  = {};
    for (var i = 0; i < headers.length; i++) rowObj[headers[i]] = rowData[i];
    updateBatchSlotCount(String(rowObj.BATCH_NAME), String(rowObj.MUNICIPALITY));
  }

  return success({
    GIP_ID:             body.GIP_ID,
    APPLICATION_STATUS: newStatus,
    APPROVED_BY:        approvedBy,
    DATE_APPROVED:      dateApproved
  });
}

// ============================================================
// 4. GET DASHBOARD STATS
// ============================================================

function handleGetDashboard(params) {
  var sheet = getSheet(SHEETS.MASTER);
  var data  = sheetToObjects(sheet);

  var now      = new Date();
  var todayStr = todayDate();
  var monthStr = now.getFullYear() + "-" + padLeft(now.getMonth() + 1, 2);
  var yearStr  = String(now.getFullYear());

  var filterFrom = (params && params.from) ? String(params.from).trim() : "";
  var filterTo   = (params && params.to)   ? String(params.to).trim()   : "";

  var stats = {
    total: 0, today: 0, thisMonth: 0, thisYear: 0,
    complete: 0, incomplete: 0, approved: 0, disapproved: 0, pending: 0,
    male: 0, female: 0,
    bySector: {}, byMunicipality: {}, byMonth: []
  };

  var months = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];
  var monthlyCounts = {};
  for (var m = 0; m < 12; m++) monthlyCounts[months[m]] = 0;

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r.GIP_ID || String(r.GIP_ID).trim() === "") continue;

    var regDate = toDateStr(r.DATE_REGISTERED);
    if (!regDate) continue;

    if (filterFrom && regDate < filterFrom) continue;
    if (filterTo   && regDate > filterTo)   continue;

    stats.total++;

    if (regDate.startsWith(todayStr)) stats.today++;
    if (regDate.startsWith(monthStr)) stats.thisMonth++;
    if (regDate.startsWith(yearStr))  stats.thisYear++;

    var ds = String(r.DOCUMENT_STATUS    || "").toUpperCase();
    var as = String(r.APPLICATION_STATUS || "").toUpperCase();

    if (ds === "COMPLETE")         stats.complete++;
    else                           stats.incomplete++;
    if (as === "APPROVED")         stats.approved++;
    else if (as === "DISAPPROVED") stats.disapproved++;
    else                           stats.pending++;

    var sex = String(r.SEX || "").toUpperCase().trim();
    if (sex === "MALE")        stats.male++;
    else if (sex === "FEMALE") stats.female++;

    var sector = String(r.SECTOR      || "OTHERS").toUpperCase();
    stats.bySector[sector] = (stats.bySector[sector] || 0) + 1;

    var mun = String(r.MUNICIPALITY || "UNKNOWN").toUpperCase();
    stats.byMunicipality[mun] = (stats.byMunicipality[mun] || 0) + 1;

    if (regDate.length >= 7) {
      var regYear  = regDate.substring(0, 4);
      var monthNum = parseInt(regDate.substring(5, 7)) - 1;
      var bucketYear = filterFrom ? filterFrom.substring(0, 4) : yearStr;
      if (regYear === bucketYear && monthNum >= 0 && monthNum <= 11) {
        monthlyCounts[months[monthNum]]++;
      }
    }
  }

  for (var mo = 0; mo < months.length; mo++) {
    stats.byMonth.push({ month: months[mo], count: monthlyCounts[months[mo]] });
  }

  return success(stats);
}

// ============================================================
// 5. GET APPLICANTS (paginated + filtered)
// ============================================================

function handleGetApplicants(params) {
  var sheet = getSheet(SHEETS.MASTER);
  var data  = sheetToObjects(sheet);

  var search       = String(params.search            || "").toLowerCase();
  var municipality = String(params.municipality       || "").toUpperCase();
  var sector       = String(params.sector             || "").toUpperCase();
  var docStatus    = String(params.documentStatus     || "").toUpperCase();
  var appStatus    = String(params.applicationStatus  || "").toUpperCase();
  var batchName    = String(params.batchName          || "").toUpperCase();
  var page         = parseInt(params.page     || "1");
  var pageSize     = parseInt(params.pageSize || "25");

  var filtered = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r.GIP_ID || String(r.GIP_ID).trim() === "") continue;

    if (search) {
      var hay = [r.GIP_ID, r.SURNAME, r.FIRST_NAME, r.MUNICIPALITY, r.BARANGAY]
        .join(" ").toLowerCase();
      if (hay.indexOf(search) === -1) continue;
    }
    if (municipality && String(r.MUNICIPALITY       || "").toUpperCase() !== municipality) continue;
    if (sector       && String(r.SECTOR             || "").toUpperCase() !== sector)       continue;
    if (docStatus    && String(r.DOCUMENT_STATUS    || "").toUpperCase() !== docStatus)    continue;
    if (appStatus    && String(r.APPLICATION_STATUS || "").toUpperCase() !== appStatus)    continue;
    if (batchName    && String(r.BATCH_NAME         || "").toUpperCase() !== batchName)    continue;

    filtered.push(rowToApplicantRow(r));
  }

  var total      = filtered.length;
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  page = Math.min(Math.max(1, page), totalPages);

  var start = (page - 1) * pageSize;
  var paged = filtered.slice(start, start + pageSize);
  return success({
    data: paged, total: total, page: page,
    pageSize: pageSize, totalPages: totalPages
  });
}

// ============================================================
// 6. GET SINGLE APPLICANT
// ============================================================

function handleGetApplicant(params) {
  if (!params || !params.gipId) return errorResponse("gipId required");

  var sheet   = getSheet(SHEETS.MASTER);
  var headers = getHeaders(sheet);
  var rowIdx  = findRowByField(sheet, headers, "GIP_ID", params.gipId);
  if (rowIdx < 0) return errorResponse("Applicant not found", "NOT_FOUND");

  var rowData = sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
  var obj     = {};
  for (var i = 0; i < headers.length; i++) obj[headers[i]] = rowData[i];
  return success(obj);
}

// ============================================================
// 7. GET INCOMPLETE APPLICANTS
// ============================================================

function handleGetIncomplete() {
  var sheet  = getSheet(SHEETS.MASTER);
  var data   = sheetToObjects(sheet);
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r.GIP_ID || String(r.GIP_ID).trim() === "") continue;
    if (String(r.DOCUMENT_STATUS || "").toUpperCase() === "INCOMPLETE") {
      result.push(rowToApplicantRow(r));
    }
  }
  return success(result);
}

// ============================================================
// 8. GET BATCHES
// ============================================================

function handleGetBatches() {
  var sheet  = getSheet(SHEETS.BATCHES);
  var data   = sheetToObjects(sheet);
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var b = data[i];
    if (!b.BATCH_ID || String(b.BATCH_ID).trim() === "") continue;
    result.push({
      BATCH_ID:         String(b.BATCH_ID),
      BATCH_NAME:       String(b.BATCH_NAME),
      BATCH_DATE:       toDateStr(b.BATCH_DATE) || String(b.BATCH_DATE || ""),
      MUNICIPALITY:     String(b.MUNICIPALITY   || ""),
      TARGET_SLOTS:     parseInt(b.TARGET_SLOTS     || "0"),
      TOTAL_APPLICANTS: parseInt(b.TOTAL_APPLICANTS || "0"),
      STATUS:           String(b.STATUS   || "OPEN"),
      REMARKS:          String(b.REMARKS  || "")
    });
  }
  return success(result);
}

// ============================================================
// 9. CREATE BATCH — one row per municipality
// ============================================================

function handleCreateBatch(body) {
  if (!body || !body.BATCH_NAME) return errorResponse("BATCH_NAME is required");

  var sheet     = getSheet(SHEETS.BATCHES);
  var headers   = getHeaders(sheet);
  var batchName = String(body.BATCH_NAME);
  var batchDate = String(body.BATCH_DATE || todayDate());
  var remarks   = String(body.REMARKS || "");

  // Check duplicate
  var existing = sheetToObjects(sheet);
  for (var i = 0; i < existing.length; i++) {
    if (String(existing[i].BATCH_NAME) === batchName) {
      return errorResponse("Batch " + batchName + " already exists");
    }
  }

  // SLOTS = [{ municipality, targetSlots }]
  var slots = body.SLOTS || [];
  if (slots.length === 0) {
    return errorResponse("At least one municipality slot is required");
  }

  var created = [];
  for (var s = 0; s < slots.length; s++) {
    var slot   = slots[s];
    var munKey = String(slot.municipality)
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/gi, "");
    var batchId = batchName.replace(/\s+/g, "_") + "-" + munKey;

    var row = buildRow(headers, {
      BATCH_ID:         batchId,
      BATCH_NAME:       batchName,
      BATCH_DATE:       batchDate,
      MUNICIPALITY:     String(slot.municipality),
      TARGET_SLOTS:     parseInt(slot.targetSlots || 0),
      TOTAL_APPLICANTS: 0,
      STATUS:           "OPEN",
      REMARKS:          remarks
    });

    sheet.appendRow(row);
    created.push(slot.municipality);
  }

  return success({
    BATCH_NAME:     batchName,
    MUNICIPALITIES: created,
    TOTAL_ROWS:     created.length
  }, "Batch created with " + created.length + " municipality rows");
}

// ============================================================
// 10. UPDATE BATCH STATUS — updates ALL rows for a batch
// ============================================================

function handleUpdateBatchStatus(body) {
  if (!body || !body.BATCH_ID || !body.STATUS) {
    return errorResponse("BATCH_ID and STATUS required");
  }
  var allowed = ["OPEN", "CLOSED", "CANCELLED"];
  if (allowed.indexOf(body.STATUS) === -1) {
    return errorResponse("STATUS must be OPEN, CLOSED, or CANCELLED");
  }

  var sheet   = getSheet(SHEETS.BATCHES);
  var headers = getHeaders(sheet);
  var data    = sheetToObjects(sheet);

  // Find the BATCH_NAME from the given BATCH_ID
  var batchName = "";
  for (var i = 0; i < data.length; i++) {
    if (String(data[i].BATCH_ID) === String(body.BATCH_ID)) {
      batchName = String(data[i].BATCH_NAME);
      break;
    }
  }

  if (!batchName) {
    // Fallback: update just the single row
    var rowIdx = findRowByField(sheet, headers, "BATCH_ID", body.BATCH_ID);
    if (rowIdx < 0) return errorResponse("Batch not found", "NOT_FOUND");
    batchUpdateRow(sheet, headers, rowIdx, { STATUS: body.STATUS });
    return success({ BATCH_ID: body.BATCH_ID, STATUS: body.STATUS });
  }

  // Update ALL rows that share this BATCH_NAME
  var allRows  = sheet.getDataRange().getValues();
  var nameCol  = headers.indexOf("BATCH_NAME");
  var statCol  = headers.indexOf("STATUS") + 1;
  var updated  = 0;

  for (var r = 1; r < allRows.length; r++) {
    if (String(allRows[r][nameCol]) === batchName) {
      sheet.getRange(r + 1, statCol).setValue(body.STATUS);
      updated++;
    }
  }

  return success({
    BATCH_NAME:   batchName,
    STATUS:       body.STATUS,
    ROWS_UPDATED: updated
  });
}

// ============================================================
// 11. GENERATE TRANSMITTAL
// ============================================================

function handleGenerateTransmittal(body) {
  if (!body || !body.batchName) return errorResponse("batchName is required");

  var sheet  = getSheet(SHEETS.MASTER);
  var data   = sheetToObjects(sheet);

  var batchName    = String(body.batchName).toUpperCase();
  var sector       = String(body.sector            || "ALL").toUpperCase();
  var municipality = String(body.municipality       || "ALL").toUpperCase();
  var appStatus    = String(body.applicationStatus  || "APPROVED").toUpperCase();
  var targetCount  = body.targetCount ? parseInt(body.targetCount) : 0;

  var entries = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r.GIP_ID || String(r.GIP_ID).trim() === "") continue;
    if (String(r.BATCH_NAME || "").toUpperCase() !== batchName) continue;
    if (sector       !== "ALL" && String(r.SECTOR            || "").toUpperCase() !== sector)       continue;
    if (municipality !== "ALL" && String(r.MUNICIPALITY       || "").toUpperCase() !== municipality) continue;
    if (appStatus    !== "ALL" && String(r.APPLICATION_STATUS || "").toUpperCase() !== appStatus)    continue;

    entries.push({
      GIP_ID:             String(r.GIP_ID),
      fullName:           upper(r.SURNAME) + ", " + upper(r.FIRST_NAME) +
                          (r.MIDDLE_NAME ? " " + upper(r.MIDDLE_NAME) : ""),
      SEX:                String(r.SEX            || ""),
      DATE_OF_BIRTH:      toDateStr(r.DATE_OF_BIRTH) || String(r.DATE_OF_BIRTH || ""),
      MUNICIPALITY:       String(r.MUNICIPALITY   || ""),
      BARANGAY:           String(r.BARANGAY       || ""),
      CONTACT_NUMBER:     String(r.CONTACT_NUMBER || ""),
      SECTOR:             String(r.SECTOR         || ""),
      APPLICATION_STATUS: String(r.APPLICATION_STATUS || "PENDING"),
      DOCUMENT_STATUS:    String(r.DOCUMENT_STATUS    || "INCOMPLETE")
    });

    if (targetCount > 0 && entries.length >= targetCount) break;
  }

  // Log to TRANSMITTAL_LOG
  var logSheet   = getSheet(SHEETS.TRANSMITTAL);
  var logHeaders = getHeaders(logSheet);
  var logSeq     = logSheet.getLastRow() > 1 ? logSheet.getLastRow() : 1;
  var txId       = "TXL-" + new Date().getFullYear() + "-" + padLeft(logSeq, 4);

  var logRow = buildRow(logHeaders, {
    TRANSMITTAL_ID: txId,
    DATE_GENERATED: nowTimestamp(),
    BATCH_NAME:     body.batchName,
    SECTOR:         sector,
    MUNICIPALITY:   municipality,
    TOTAL_INCLUDED: entries.length,
    GENERATED_BY:   body.generatedBy || "System",
    REMARKS:        ""
  });
  logSheet.appendRow(logRow);

  return success({
    transmittalId: txId,
    dateGenerated: todayDate(),
    batchName:     body.batchName,
    sector:        sector,
    municipality:  municipality,
    totalIncluded: entries.length,
    entries:       entries
  });
}

// ============================================================
// HELPER — Convert Google Sheets date to yyyy-MM-dd string
// Sheets stores dates as Date objects — this handles both
// ============================================================

function toDateStr(val) {
  if (!val || val === "") return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.substring(0, 10);
  }
  try {
    var d = new Date(val);
    if (isNaN(d.getTime())) return String(val).trim();
    return Utilities.formatDate(d, "Asia/Manila", "yyyy-MM-dd");
  } catch (_) {
    return String(val).trim();
  }
}

// ============================================================
// SHEET UTILITIES
// ============================================================

function getSheet(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("Sheet not found: " + name);
  return sheet;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function(h) { return String(h).trim(); });
}

function sheetToObjects(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var headers = getHeaders(sheet);
  var values  = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function buildRow(headers, obj) {
  return headers.map(function(h) {
    var val = obj.hasOwnProperty(h) ? obj[h] : "";
    return (val === undefined || val === null) ? "" : val;
  });
}

function findRowByField(sheet, headers, fieldName, value) {
  var col     = headers.indexOf(fieldName);
  if (col === -1) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var vals = sheet.getRange(2, col + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === String(value).trim()) return i + 2;
  }
  return -1;
}

function batchUpdateRow(sheet, headers, rowIdx, updates) {
  var keys = Object.keys(updates);
  for (var k = 0; k < keys.length; k++) {
    var col = headers.indexOf(keys[k]) + 1;
    if (col > 0) sheet.getRange(rowIdx, col).setValue(updates[keys[k]]);
  }
}

// Update TOTAL_APPLICANTS for the matching BATCH_NAME + MUNICIPALITY row
function updateBatchSlotCount(batchName, municipality) {
  try {
    var sheet   = getSheet(SHEETS.BATCHES);
    var headers = getHeaders(sheet);
    var data    = sheet.getDataRange().getValues();
    var nameCol = headers.indexOf("BATCH_NAME");
    var munCol  = headers.indexOf("MUNICIPALITY");
    var cntCol  = headers.indexOf("TOTAL_APPLICANTS") + 1;
    if (nameCol < 0 || munCol < 0 || cntCol <= 0) return;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][nameCol]) === batchName &&
          String(data[i][munCol]).toUpperCase() === String(municipality).toUpperCase()) {
        var current = parseInt(data[i][cntCol - 1] || "0");
        sheet.getRange(i + 1, cntCol).setValue(current + 1);
        break;
      }
    }
  } catch (_) {}
}

// Increment TOTAL_APPLICANTS by BATCH_ID (used during registration)
function incrementBatchCount(batchId) {
  try {
    var sheet   = getSheet(SHEETS.BATCHES);
    var headers = getHeaders(sheet);
    var rowIdx  = findRowByField(sheet, headers, "BATCH_ID", batchId);
    if (rowIdx < 0) return;
    var col     = headers.indexOf("TOTAL_APPLICANTS") + 1;
    if (col <= 0) return;
    var current = parseInt(sheet.getRange(rowIdx, col).getValue() || "0");
    sheet.getRange(rowIdx, col).setValue(current + 1);
  } catch (_) {}
}

// Get the first OPEN batch (for auto-assigning during registration)
function getOpenBatch() {
  try {
    var sheet = getSheet(SHEETS.BATCHES);
    var data  = sheetToObjects(sheet);
    for (var i = 0; i < data.length; i++) {
      if (String(data[i].STATUS).toUpperCase() === "OPEN") {
        return {
          BATCH_ID:   String(data[i].BATCH_ID),
          BATCH_NAME: String(data[i].BATCH_NAME),
          BATCH_DATE: toDateStr(data[i].BATCH_DATE) || String(data[i].BATCH_DATE)
        };
      }
    }
  } catch (_) {}
  var y = new Date().getFullYear();
  return { BATCH_ID: "", BATCH_NAME: y + "-GIP-BATCH 1", BATCH_DATE: todayDate() };
}

// Convert MASTER row to slim ApplicantRow shape for frontend
function rowToApplicantRow(r) {
  return {
    GIP_ID:               String(r.GIP_ID              || ""),
    SURNAME:              String(r.SURNAME             || ""),
    FIRST_NAME:           String(r.FIRST_NAME          || ""),
    MIDDLE_NAME:          String(r.MIDDLE_NAME         || ""),
    MUNICIPALITY:         String(r.MUNICIPALITY        || ""),
    BARANGAY:             String(r.BARANGAY            || ""),
    SECTOR:               String(r.SECTOR              || ""),
    SEX:                  String(r.SEX                 || ""),
    CIVIL_STATUS:         String(r.CIVIL_STATUS        || ""),
    DOCUMENT_STATUS:      String(r.DOCUMENT_STATUS     || "INCOMPLETE"),
    APPLICATION_STATUS:   String(r.APPLICATION_STATUS  || "PENDING"),
    REGISTRATION_STATUS:  String(r.REGISTRATION_STATUS || "INCOMPLETE"),
    MISSING_DOCUMENTS:    String(r.MISSING_DOCUMENTS   || ""),
    TOTAL_SUBMITTED_DOCS: parseInt(r.TOTAL_SUBMITTED_DOCS || "0"),
    TOTAL_REQUIRED_DOCS:  parseInt(r.TOTAL_REQUIRED_DOCS  || "7"),
    BATCH_NAME:           String(r.BATCH_NAME          || ""),
    DATE_REGISTERED:      toDateStr(r.DATE_REGISTERED) || "",
    APPROVED_BY:          String(r.APPROVED_BY         || ""),
    DATE_APPROVED:        toDateStr(r.DATE_APPROVED)   || "",
    DOC_RESUME:
      r.DOC_RESUME === true || r.DOC_RESUME === "TRUE",
    DOC_BIRTH_CERTIFICATE:
      r.DOC_BIRTH_CERTIFICATE === true || r.DOC_BIRTH_CERTIFICATE === "TRUE",
    DOC_VALID_ID:
      r.DOC_VALID_ID === true || r.DOC_VALID_ID === "TRUE",
    DOC_CERTIFICATE_OF_INDIGENCY:
      r.DOC_CERTIFICATE_OF_INDIGENCY === true || r.DOC_CERTIFICATE_OF_INDIGENCY === "TRUE",
    DOC_TOR:
      r.DOC_TOR === true || r.DOC_TOR === "TRUE",
    DOC_DIPLOMA:
      r.DOC_DIPLOMA === true || r.DOC_DIPLOMA === "TRUE",
    DOC_GIP_FORM:
      r.DOC_GIP_FORM === true || r.DOC_GIP_FORM === "TRUE"
  };
}

// ============================================================
// STRING / DATE / VALUE HELPERS
// ============================================================

function nowTimestamp() {
  return Utilities.formatDate(new Date(), "Asia/Manila", "yyyy-MM-dd HH:mm:ss");
}

function todayDate() {
  return Utilities.formatDate(new Date(), "Asia/Manila", "yyyy-MM-dd");
}

function upper(val) {
  return val ? String(val).toUpperCase().trim() : "";
}

function padLeft(num, len) {
  var s = String(num);
  while (s.length < len) s = "0" + s;
  return s;
}

function boolVal(val) {
  return val === true || val === "true" || val === "TRUE" ||
         val === 1    || val === "1";
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

function success(data, message) {
  var payload = { success: true, data: data };
  if (message) payload.message = message;
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message, code) {
  var payload = { success: false, error: message };
  if (code) payload.code = code;
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function unauthorized() {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false, error: "Unauthorized", code: "UNAUTHORIZED"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// TEST — run before deploying to verify sheet connections
// ============================================================

function testConnection() {
  try {
    Logger.log("MASTER:   " + getSheet(SHEETS.MASTER).getLastRow()      + " rows");
    Logger.log("BATCHES:  " + getSheet(SHEETS.BATCHES).getLastRow()     + " rows");
    Logger.log("USERS:    " + getSheet(SHEETS.USERS).getLastRow()       + " rows");
    Logger.log("TRANSMITTAL: " + getSheet(SHEETS.TRANSMITTAL).getLastRow() + " rows");
    Logger.log("All sheets found. Ready to deploy.");
  } catch (err) {
    Logger.log("ERROR: " + err.message);
  }
}

// ============================================================
// TEST — verify the DOC_* names match the MASTER header row
// Run this after pasting. It catches a rename mismatch before it
// silently writes blanks into the sheet.
// ============================================================

function testDocColumns() {
  var headers = getHeaders(getSheet(SHEETS.MASTER));
  var missing = [];
  for (var i = 0; i < DOC_FIELDS.length; i++) {
    if (headers.indexOf(DOC_FIELDS[i]) === -1) missing.push(DOC_FIELDS[i]);
  }
  if (missing.length) {
    Logger.log("MISMATCH — these DOC_ columns are not in the MASTER header row:");
    Logger.log(missing.join(", "));
  } else {
    Logger.log("OK — all " + DOC_FIELDS.length + " DOC_ columns found in MASTER.");
  }
}
