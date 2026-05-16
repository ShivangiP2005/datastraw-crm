# Datastraw Support CRM

A fully functional web-based customer support ticketing system built for the Datastraw Technologies hiring assignment. Handles support tickets, customer data, order information, email notifications, and analytics all without a traditional server or database.

**Live Demo:** https://script.google.com/macros/s/AKfycbxsbCXO62Sehn3Lhbh4R_DC_Y-qgmTauE-iFc_qTcEDVFW6VN9odPFnFekGp9OUxA0Kfg/exec 

**Demo Video:** https://drive.google.com/file/d/1oBLhxWiDQzcARYhOherl6tdZeR3PDlEs/view?usp=sharing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Google Apps Script |
| Database | Google Sheets |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Deployment | Google Apps Script Web App |
| Fonts | Google Fonts-DM Sans + DM Mono |

---

## Features

**Ticket Management**
- Create new support tickets with full customer details
- Auto-generated unique ticket IDs in TKT-00001 format
- View, edit, and delete tickets with real-time sync to Google Sheets
- Color coded status badges for instant visual scanning
- Three panel responsive interface-ticket list, detail view, insights

**Search and Filter**
- Search across ticket ID, customer name, email, phone, and order ID
- Filter by status, communication channel, and escalation level
- Date range filter to view tickets from a specific time period

**Data Integration**
- Automatically links tickets to the order database
- Displays full order details inside the ticket detail view
- Tracks escalation routing, query theme, and action taken

**Analytics Dashboard**
- Resolution rate, open tickets, pending count, and top channel metrics
- Visual bar chart showing ticket volume by status
- Channel breakdown with percentages

**Optional Enhancements**
- CSV export of all ticket data via Google Drive
- Email notifications sent to agent on every new ticket creation

---

## Google Sheets Structure

The system uses two sheets inside a single Google Spreadsheet named CRM_Database.

**Tickets Sheet**

| Column | Field | Description |
|---|---|---|
| A | TicketID | Auto-generated unique ID |
| B | CustomerName | Full name of the customer |
| C | Email | Customer email address |
| D | Phone | Customer phone number |
| E | OrderID | Links to the Orders sheet |
| F | Channel | WhatsApp, Instagram, Facebook, Emails, Calls |
| G | Status | Pending, In Progress, Waiting on Third Party, Waiting on Customer, Resolved |
| H | EscalationLevel | None, Senior Agent, Manager, Courier Partner, Finance Team |
| I | QueryTheme | Short issue category |
| J | ActionTaken | Steps taken so far |
| K | IssueDescription | Full description of the issue |
| L | CreatedAt | Auto-set timestamp on creation |

**Orders Sheet**

| Column | Field |
|---|---|
| A | OrderID |
| B | CustomerName |
| C | OrderDate |
| D | Status |

---

## How to Deploy

**1. Set up Google Sheets**
- Create a new Google Spreadsheet named CRM_Database
- Create two sheet tabs-name them Tickets and Orders
- Add the column headers exactly as shown in the schema above

**2. Set up Apps Script**
- Inside the sheet go to Extensions → Apps Script
- Delete the default code and paste the contents of Code.gs
- Click the + button next to Files → choose HTML → name it index
- Paste the contents of index.html into that file
- Save both files

**3. Seed sample data**
- In the Apps Script editor select seedSampleData from the function dropdown
- Click Run and approve the permissions prompt
- This populates 10 sample tickets and 10 sample orders for the demo

**4. Deploy as a web app**
- Click Deploy → New deployment
- Click the gear icon → select Web app
- Set Execute as to Me and Who has access to Anyone
- Click Deploy and copy the web app URL

---

## Architecture

```
Browser (HTML + CSS + JS)
         |
         |  google.script.run.functionName()
         |  (Google's built-in bridge — no HTTP needed)
         ▼
Google Apps Script  —  Code.gs
         |
         |  SpreadsheetApp.openById()
         ▼
Google Sheets  —  CRM_Database
         ├── Tickets sheet
         └── Orders sheet
```

The frontend calls backend functions using google.script.run which is Google's built-in communication bridge. This replaces traditional REST API calls — no server setup, no hosting costs, and no npm required.

---

## Backend Functions

| Function | Description |
|---|---|
| createTicket(data) | Creates a new ticket row and returns the ticket object |
| getAllTickets() | Returns all tickets sorted newest first |
| updateTicket(id, updates) | Updates specific fields in an existing ticket |
| deleteTicket(id) | Deletes a ticket row by ID |
| getTicketById(id) | Returns a single ticket by ID |
| searchTickets(query) | Searches across ID, name, email, phone, order ID |
| filterTickets(filters) | Filters by status, channel, and escalation level |
| getOrderById(orderId) | Returns linked order details from Orders sheet |
| getDashboardStats() | Returns aggregated counts for the analytics panel |
| sendTicketCreatedEmail(...) | Sends email notification via Google MailApp |
| getCSVDownloadUrl() | Creates CSV file in Drive and returns download link |

---

## Known Limitations and What I Would Improve

The current system works well for a small support team but has some limitations worth noting.

There are no real-time updates between agents. If two people have the CRM open at the same time they will not see each other's changes without refreshing the page. In a production system I would add a polling mechanism that checks for updates every 30 seconds.

There is no authentication. The deployed URL is publicly accessible. In production I would add Google OAuth using ScriptApp so only team members with the company email domain can access it.

Email notifications currently go to the script owner only because Session.getActiveUser() is restricted in deployed web apps. The fix would be to maintain an Agents sheet with each team member's email and loop through it when sending notifications.

Apps Script has a 6 minute execution time limit per function. For large datasets I would implement server-side pagination passing a page number to getAllTickets and returning 50 tickets at a time instead of loading everything at once.

With more time I would also add Google Drive file attachments for screenshots and call recordings, SLA tracking with automated escalation triggers, and role-based access control distinguishing between admin and agent permissions.

---

## Project Structure

```
datastraw-crm/
├── Code.gs      — Google Apps Script backend (all API functions)
├── index.html   — Complete frontend (HTML structure, CSS styles, JS logic)
└── README.md    — Setup guide and documentation
```

---

Built by Shivangi Pandey for the Datastraw Technologies Hiring Assignment.
