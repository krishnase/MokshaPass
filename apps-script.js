/**
 * MokshaPass — Google Apps Script
 *
 * HOW TO DEPLOY:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Delete any existing code and paste this entire file
 * 3. Click "Deploy" → "New deployment"
 * 4. Type: Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Click Deploy → copy the Web app URL
 * 8. Paste that URL into .env.local as NEXT_PUBLIC_APPS_SCRIPT_URL
 * 9. Redeploy the Vercel app after updating env vars
 *
 * This script creates two tabs in your sheet:
 *   - "Sales"    → records every MokshaMart purchase
 *   - "CheckIns" → records every guest check-in
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'checkin') {
      let sheet = ss.getSheetByName('CheckIns');
      if (!sheet) {
        sheet = ss.insertSheet('CheckIns');
        sheet.appendRow(['Guest Name', 'Phone', 'Room Number', 'People Count', 'Date', 'Time']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      }
      sheet.appendRow([data.guestName, data.guestPhone, data.roomNumber, data.peopleCount, data.date, data.time]);

    } else if (data.type === 'sale') {
      let sheet = ss.getSheetByName('Sales');
      if (!sheet) {
        sheet = ss.insertSheet('Sales');
        sheet.appendRow(['ID', 'Date', 'Customer', 'Phone', 'Item', 'Qty', 'Price', 'Subtotal', 'Delivery Fee', 'Total', 'Delivery', 'Payment', 'Address', 'Timestamp']);
        sheet.getRange(1, 1, 1, 14).setFontWeight('bold');
      }
      sheet.appendRow([
        data.id,
        data.date,
        data.customerName,
        data.phone,
        data.item,
        data.qty,
        data.price,
        data.subtotal,
        data.deliveryFee,
        data.total,
        data.delivery ? 'Yes' : 'No',
        data.payment,
        data.address || '',
        data.timestamp,
      ]);

    } else if (data.type === 'volunteer_interest') {
      let sheet = ss.getSheetByName('VolunteerRequestForm');
      if (!sheet) {
        sheet = ss.insertSheet('VolunteerRequestForm');
        sheet.appendRow(['Full Name', 'Location', 'Phone', 'Email', 'Interested Roles', 'Date', 'Timestamp']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
      }
      sheet.appendRow([data.fullName, data.location, data.phone, data.email, data.roles, data.date, data.timestamp]);

    } else if (data.type === 'hanuman_healing') {
      let sheet = ss.getSheetByName('HanumanHealing');
      if (!sheet) {
        sheet = ss.insertSheet('HanumanHealing');
        sheet.appendRow(['Full Name', 'Phone', 'Email', 'Challenges', '4P Meditation Days', 'Dreams Count', 'Aware of Concepts', 'Mentor Name', 'Mentor Phone', 'Date', 'Timestamp']);
        sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
      }
      sheet.appendRow([data.fullName, data.phone, data.email, data.challenges, data.meditationDays || '', data.dreamCount || '', data.conceptsAware || '', data.mentorName, data.mentorPhone, data.date, data.timestamp]);

    } else if (data.type === 'pdf') {
      const folder = DriveApp.getFolderById(data.folderId);
      const bytes = Utilities.base64Decode(data.content);
      const blob = Utilities.newBlob(bytes, 'application/pdf', data.filename);
      folder.createFile(blob);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'MokshaPass Apps Script is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
