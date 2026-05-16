// ============================================================
//  Datastraw CRM — Google Apps Script Backend
//  Author: Shivangi Pandey
//  Sheet ID: 1lm_7t6HaVloIeE7MEcUD6B4Fp4pND_egKXElRhNf3ec
// ============================================================

var SHEET_ID   = "1lm_7t6HaVloIeE7MEcUD6B4Fp4pND_egKXElRhNf3ec";
var TICKET_TAB = "Tickets";
var ORDER_TAB  = "Orders";

// ------------------------------------------------------------
//  WEB APP ENTRY POINT
//  Google requires a doGet() to serve the HTML page.
// ------------------------------------------------------------
function doGet() {
  return HtmlService
    .createHtmlOutputFromFile("index")
    .setTitle("Datastraw Support CRM")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
//  SECTION 1 — SHEET HELPERS (internal, not called by frontend)
// ============================================================

function getTicketSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(TICKET_TAB);
}

function getOrderSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(ORDER_TAB);
}

// Generates a unique ticket ID like TKT-00042
function generateTicketId() {
  var sheet = getTicketSheet();
  var lastRow = sheet.getLastRow();
  // If only the header row exists, start from 1
  var nextNumber = lastRow < 2 ? 1 : lastRow;
  return "TKT-" + String(nextNumber).padStart(5, "0");
}

// Returns all rows as an array of objects using row 1 as keys
function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var rows    = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      // Convert Date objects to readable strings
      var val = data[i][j];
      if (val instanceof Date) {
        obj[headers[j]] = Utilities.formatDate(val, Session.getScriptTimeZone(), "dd MMM yyyy, hh:mm a");
      } else {
        obj[headers[j]] = val;
      }
    }
    // Skip completely empty rows
    if (obj["TicketID"] !== "") {
      rows.push(obj);
    }
  }
  return rows;
}

// ============================================================
//  SECTION 2 — TICKET CRUD FUNCTIONS (called by frontend)
// ============================================================

// CREATE — adds a new ticket row and returns the new ticket object
function createTicket(data) {
  try {
    var sheet    = getTicketSheet();
    var ticketId = generateTicketId();
    var now      = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy, hh:mm a");

    var newRow = [
      ticketId,
      data.customerName    || "",
      data.email           || "",
      data.phone           || "",
      data.orderId         || "",
      data.channel         || "Emails",
      data.status          || "Pending",
      data.escalationLevel || "None",
      data.queryTheme      || "",
      data.actionTaken     || "",
      data.issueDescription|| "",
      now
    ];

    sheet.appendRow(newRow);

    // Return the new ticket so frontend can show it immediately
    return {
      success  : true,
      ticketId : ticketId,
      ticket   : {
        TicketID         : ticketId,
        CustomerName     : newRow[1],
        Email            : newRow[2],
        Phone            : newRow[3],
        OrderID          : newRow[4],
        Channel          : newRow[5],
        Status           : newRow[6],
        EscalationLevel  : newRow[7],
        QueryTheme       : newRow[8],
        ActionTaken      : newRow[9],
        IssueDescription : newRow[10],
        CreatedAt        : newRow[11]
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// READ ALL — returns all tickets, newest first
function getAllTickets() {
  try {
    var tickets = sheetToObjects(getTicketSheet());
    // Reverse so newest ticket appears at the top
    tickets.reverse();
    return { success: true, tickets: tickets };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// READ ONE — returns a single ticket by its ID
function getTicketById(ticketId) {
  try {
    var tickets = sheetToObjects(getTicketSheet());
    var found   = tickets.filter(function(t) { return t.TicketID === ticketId; });
    if (found.length === 0) {
      return { success: false, error: "Ticket not found" };
    }
    return { success: true, ticket: found[0] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// UPDATE — finds a ticket row by ID and updates specific columns
function updateTicket(ticketId, updates) {
  try {
    var sheet   = getTicketSheet();
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    // Column index map so we don't hard-code numbers
    var colMap = {};
    for (var h = 0; h < headers.length; h++) {
      colMap[headers[h]] = h;
    }

    // Find the row with matching TicketID (column A = index 0)
    for (var r = 1; r < data.length; r++) {
      if (data[r][0] === ticketId) {
        // Only update the fields that were passed in
        var fieldMap = {
          customerName    : "CustomerName",
          email           : "Email",
          phone           : "Phone",
          orderId         : "OrderID",
          channel         : "Channel",
          status          : "Status",
          escalationLevel : "EscalationLevel",
          queryTheme      : "QueryTheme",
          actionTaken     : "ActionTaken",
          issueDescription: "IssueDescription"
        };

        for (var key in fieldMap) {
          if (updates[key] !== undefined) {
            var col = colMap[fieldMap[key]] + 1; // Sheets columns are 1-indexed
            sheet.getRange(r + 1, col).setValue(updates[key]);
          }
        }

        return { success: true, message: "Ticket " + ticketId + " updated." };
      }
    }

    return { success: false, error: "Ticket not found: " + ticketId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
//  SECTION 3 — SEARCH & FILTER
// ============================================================

// SEARCH — searches across TicketID, CustomerName, Email, Phone, OrderID
function searchTickets(query) {
  try {
    if (!query || query.trim() === "") {
      return getAllTickets();
    }

    var q       = query.trim().toLowerCase();
    var tickets = sheetToObjects(getTicketSheet());

    var results = tickets.filter(function(t) {
      return (
        (t.TicketID        || "").toLowerCase().indexOf(q) > -1 ||
        (t.CustomerName    || "").toLowerCase().indexOf(q) > -1 ||
        (t.Email           || "").toLowerCase().indexOf(q) > -1 ||
        (t.Phone           || "").toLowerCase().indexOf(q) > -1 ||
        (t.OrderID         || "").toLowerCase().indexOf(q) > -1
      );
    });

    results.reverse();
    return { success: true, tickets: results };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// FILTER — filter by status, channel, escalation, or date range
// All parameters are optional; pass only the ones you want to apply
function filterTickets(filters) {
  try {
    var tickets = sheetToObjects(getTicketSheet());

    if (filters.status && filters.status !== "All") {
      tickets = tickets.filter(function(t) {
        return t.Status === filters.status;
      });
    }

    if (filters.channel && filters.channel !== "All") {
      tickets = tickets.filter(function(t) {
        return t.Channel === filters.channel;
      });
    }

    if (filters.escalationLevel && filters.escalationLevel !== "All") {
      tickets = tickets.filter(function(t) {
        return t.EscalationLevel === filters.escalationLevel;
      });
    }

    tickets.reverse();
    return { success: true, tickets: tickets };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
//  SECTION 4 — ORDER LOOKUP
// ============================================================

// Returns order details linked to an Order ID (shown in ticket detail panel)
function getOrderById(orderId) {
  try {
    if (!orderId || orderId.trim() === "") {
      return { success: false, error: "No order ID provided" };
    }

    var orders = sheetToObjects(getOrderSheet());
    var found  = orders.filter(function(o) {
      return (o.OrderID || "").toString().toLowerCase() === orderId.trim().toLowerCase();
    });

    if (found.length === 0) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, order: found[0] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
//  SECTION 5 — DASHBOARD STATS
// ============================================================

// Returns ticket counts grouped by status — used for the insights panel
function getDashboardStats() {
  try {
    var tickets = sheetToObjects(getTicketSheet());
    var total   = tickets.length;

    var statusCounts = {
      "Pending"                : 0,
      "In Progress"            : 0,
      "Waiting on Third Party" : 0,
      "Waiting on Customer"    : 0,
      "Resolved"               : 0
    };

    var channelCounts = {
      "WhatsApp"  : 0,
      "Instagram" : 0,
      "Facebook"  : 0,
      "Emails"    : 0,
      "Calls"     : 0
    };

    tickets.forEach(function(t) {
      if (statusCounts[t.Status] !== undefined)   statusCounts[t.Status]++;
      if (channelCounts[t.Channel] !== undefined)  channelCounts[t.Channel]++;
    });

    return {
      success       : true,
      total         : total,
      statusCounts  : statusCounts,
      channelCounts : channelCounts
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
//  SECTION 6 — SAMPLE DATA SEEDER
//  Run this ONCE manually from the Apps Script editor to
//  populate the sheet with realistic sample data for the demo.
// ============================================================

function seedSampleData() {
  var sheet = getTicketSheet();

  // Clear existing data except header
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  var sampleTickets = [
    ["TKT-00001","Priya Sharma","priya.sharma@gmail.com","9876543210","ORD-1021","WhatsApp","Resolved","None","Delivery Issue","Refund processed","Item not delivered after 10 days","01 May 2025, 10:00 AM"],
    ["TKT-00002","Rahul Mehta","rahul.mehta@outlook.com","9123456789","ORD-1034","Emails","In Progress","Manager","Payment Failure","Escalated to finance","Payment deducted but order not confirmed","03 May 2025, 11:30 AM"],
    ["TKT-00003","Ananya Iyer","ananya.iyer@yahoo.com","9988776655","ORD-1045","Instagram","Pending","None","Wrong Item","Awaiting return pickup","Received blue shirt instead of red","05 May 2025, 02:15 PM"],
    ["TKT-00004","Karan Patel","karan.patel@gmail.com","9871234560","ORD-1056","Calls","Waiting on Customer","None","Refund Request","Sent refund form","Customer needs to fill refund form","06 May 2025, 09:00 AM"],
    ["TKT-00005","Sneha Reddy","sneha.reddy@gmail.com","9765432109","ORD-1067","Facebook","Waiting on Third Party","Courier Partner","Delayed Shipment","Raised complaint with courier","Shipment stuck at warehouse for 5 days","07 May 2025, 04:45 PM"],
    ["TKT-00006","Vikram Joshi","vikram.joshi@gmail.com","9654321098","ORD-1078","WhatsApp","Pending","None","Product Damaged","Photos collected","Package arrived with broken seal","08 May 2025, 08:30 AM"],
    ["TKT-00007","Deepa Nair","deepa.nair@hotmail.com","9543210987","ORD-1089","Emails","Resolved","None","Account Issue","Password reset done","Unable to login to account","09 May 2025, 01:00 PM"],
    ["TKT-00008","Arjun Singh","arjun.singh@gmail.com","9432109876","ORD-1090","Calls","In Progress","None","Cancellation Request","Order cancellation initiated","Wants to cancel order placed by mistake","10 May 2025, 03:30 PM"],
    ["TKT-00009","Meena Krishnan","meena.k@gmail.com","9321098765","ORD-1101","Instagram","Pending","Senior Agent","Discount Not Applied","Checking coupon validity","Coupon SAVE20 not applied at checkout","11 May 2025, 10:15 AM"],
    ["TKT-00010","Rohit Gupta","rohit.gupta@gmail.com","9210987654","ORD-1112","Facebook","In Progress","None","Size Exchange","Exchange request raised","Ordered size M but needs size L","12 May 2025, 05:00 PM"]
  ];

  sampleTickets.forEach(function(row) {
    sheet.appendRow(row);
  });

  // Also seed orders sheet
  var orderSheet = getOrderSheet();
  if (orderSheet.getLastRow() > 1) {
    orderSheet.deleteRows(2, orderSheet.getLastRow() - 1);
  }

  var sampleOrders = [
    ["ORD-1021","Priya Sharma","25 Apr 2025","Delivered"],
    ["ORD-1034","Rahul Mehta","28 Apr 2025","Processing"],
    ["ORD-1045","Ananya Iyer","01 May 2025","Shipped"],
    ["ORD-1056","Karan Patel","02 May 2025","Delivered"],
    ["ORD-1067","Sneha Reddy","03 May 2025","In Transit"],
    ["ORD-1078","Vikram Joshi","04 May 2025","Shipped"],
    ["ORD-1089","Deepa Nair","05 May 2025","Delivered"],
    ["ORD-1090","Arjun Singh","06 May 2025","Processing"],
    ["ORD-1101","Meena Krishnan","07 May 2025","Shipped"],
    ["ORD-1112","Rohit Gupta","08 May 2025","In Transit"]
  ];

  sampleOrders.forEach(function(row) {
    orderSheet.appendRow(row);
  });

  Logger.log("Sample data seeded successfully.");
}

function getCSVDownloadUrl() {
  var sheet = getTicketSheet();
  var data  = sheet.getDataRange().getValues();
  
  var csv = data.map(function(row) {
    return row.map(function(cell) {
      return '"' + String(cell).replace(/"/g, '""') + '"';
    }).join(",");
  }).join("\n");

  var file = DriveApp.createFile(
    "datastraw-tickets-" + new Date().toISOString().slice(0,10) + ".csv",
    csv,
    MimeType.CSV
  );
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return { success: true, url: file.getDownloadUrl() };
}

function sendTicketCreatedEmail(ticketId, customerName, issue, channel, status) {
  try {
    var recipient = Session.getActiveUser().getEmail();
    var subject   = "New Support Ticket Created — " + ticketId;
    var body      =
      "Hi,\n\n"
      + "A new support ticket has been created in Datastraw CRM.\n\n"
      + "----------------------------\n"
      + "Ticket ID   : " + ticketId     + "\n"
      + "Customer    : " + customerName + "\n"
      + "Channel     : " + channel      + "\n"
      + "Status      : " + status       + "\n"
      + "Issue       : " + issue        + "\n"
      + "----------------------------\n\n"
      + "Login to the CRM to view and manage this ticket.\n\n"
      + "— Datastraw CRM System";

    MailApp.sendEmail(recipient, subject, body);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}
function deleteTicket(ticketId) {
  try {
    var sheet = getTicketSheet();
    var data  = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === ticketId) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, error: "Ticket not found" };
  } catch(e) {
    return { success: false, error: e.message };
  }
}
