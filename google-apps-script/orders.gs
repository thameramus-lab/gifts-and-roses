/**
 * Gifts & Roses: order inbox (optional).
 *
 * Adds every paid order (and cash-on-delivery deposit) from the website to a
 * Google Sheet and emails the shop. Every payment is also in the Moyasar
 * dashboard; this just puts the orders in one list with an email per order.
 *
 * Setup (about 5 minutes, in the shop's Google account):
 *  1. Create a Google Sheet, e.g. "Gifts & Roses orders".
 *  2. Extensions → Apps Script. Replace the code with this file. Save.
 *  3. Set NOTIFY_EMAIL below (or leave empty to email the account owner).
 *  4. Deploy → New deployment → type "Web app".
 *     Execute as: Me. Who has access: Anyone. Deploy and allow access.
 *  5. Copy the Web app URL into assets/js/config.js → ordering.orderEndpoint.
 *
 * Before preparing an order, check its payment ID in the Moyasar dashboard:
 * anyone can send data to this inbox, but only Moyasar shows real payments.
 */

const SHEET_NAME = "Orders";
const NOTIFY_EMAIL = ""; // e.g. "orders@example.com"

const COLUMNS = [
  ["Received", (o) => new Date()],
  ["Order", (o) => o.id],
  ["Payment", (o) => (o.pay === "cash" ? "Deposit online, rest cash" : "Paid in full online")],
  ["Moyasar payment ID", (o) => o.paymentId],
  ["Status", (o) => o.paymentStatus],
  ["Total (SAR)", (o) => o.total],
  ["Paid now (SAR)", (o) => o.charge],
  ["Cash due (SAR)", (o) => o.rest],
  ["Name", (o) => o.name],
  ["Phone", (o) => o.phone],
  ["Delivery / pickup", (o) => o.fulfil],
  ["Date", (o) => o.date],
  ["Time", (o) => o.time],
  ["District", (o) => o.district],
  ["Design", (o) => o.design],
  ["Gifts & Roses packaging", (o) => (o.branded ? "Yes" : "No")],
  ["Card message", (o) => o.card],
  ["Notes", (o) => o.notes],
  ["Language", (o) => o.lang],
];

function doPost(e) {
  const order = JSON.parse(e.postData.contents);
  const sheet = getSheet_();
  sheet.appendRow(COLUMNS.map(([, get]) => safe_(get(order))));

  const lines = COLUMNS.slice(1).map(([label, get]) => `${label}: ${get(order) ?? ""}`);
  MailApp.sendEmail({
    to: NOTIFY_EMAIL || Session.getEffectiveUser().getEmail(),
    subject: `New order ${order.id}: ${order.total} SAR (${order.name})`,
    body: lines.join("\n") + "\n\nCheck the payment ID in the Moyasar dashboard before preparing the order.",
  });

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS.map(([label]) => label));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Text starting with = + - @ would run as a formula in Sheets; store it as plain text.
function safe_(value) {
  if (value == null) return "";
  if (typeof value === "string" && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}
