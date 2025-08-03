const SPREADSHEET_ID = '1Sl2Km7ooLXD2rpe3L7sO0xDLwGwbvcgp_hvSymu6wZ8';
const DRIVE_FOLDER_ID = '1WFSF2kDTB6D_W7ZTbEnKbe-ETEYUK91G';
const paypalLinks = [
  'https://paypal.me/samuelorlando1',
  'https://paypal.me/Sirada777',
  'https://paypal.me/eurodeche',
  'https://paypal.me/sotiraki96',
  'https://paypal.me/Apeluso254',
  'https://paypal.me/azzarret',
  'https://paypal.me/Errico391',
  'https://paypal.me/pierpaolosabato',
  'https://paypal.me/GGraps',
  'https://paypal.me/MartiMarangio',
];

function doGet(e) {
  const page = e.parameter.page;
  if (page == 'thankyou') {
    return HtmlService.createHtmlOutputFromFile('thankyou');
  }
  return HtmlService.createHtmlOutputFromFile('index'); // default
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function generateIDs(numGuests) {
  const groupId = 'G-' + Utilities.getUuid().slice(0, 6).toUpperCase();
  const guests = [];
  const suffixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 0; i < numGuests; i++) {
    const personId = `P-${groupId.slice(2)}-${suffixes[i]}`;
    guests.push({ groupId, personId });
  }

  return guests;
}

function saveToSheet(guests, paymentMethod, paypalUrl) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Registrations');
  if (!sheet) throw new Error("Foglio 'Registrations' non trovato");

  guests.forEach(g => {
    sheet.appendRow([
      new Date(),
      g.groupId,
      g.personId,
      g.name,
      g.surname,
      g.email,
      g.phone,
      g.paidBy,
      'PENDING_PAYMENT',
      '', // receipt url
      '', // drive file id
      paymentMethod,
      paymentMethod === 'paypal' ? paypalUrl : ''
    ]);
  });
}

function handleFormSubmission(formData) {
  const form = JSON.parse(formData.guests);
  const paymentMethod = formData.paymentMethod;
  if (form.length > 5) throw new Error('Limite massimo di 5 persone');

  const guestIDs = generateIDs(form.length);
  const enrichedGuests = form.map((g, i) => ({
    ...g,
    ...guestIDs[i],
    paidBy: form[0].name + ' ' + form[0].surname
  }));

  let paypalUrl = '';
  if (paymentMethod === 'paypal') {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Registrations');
    const rowCount = sheet.getLastRow();
    const amount = form.length * 30;
    const index = rowCount % paypalLinks.length;
    paypalUrl = `${paypalLinks[index]}/${amount}`;
  }

  saveToSheet(enrichedGuests, paymentMethod, paypalUrl);

  return {
    groupId: guestIDs[0].groupId,
    paypalUrl: paypalUrl
  };
}

function uploadFile(base64Data, fileName, groupId) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const contentType = 'image/png';
  const data = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(data, contentType, fileName);

  const file = folder.createFile(blob);
  const fileUrl = file.getUrl();

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Registrations');
  const dataRange = sheet.getDataRange().getValues();

  dataRange.forEach((row, i) => {
    if (row[1] === groupId) {
      sheet.getRange(i + 1, 10).setValue(fileUrl);
      sheet.getRange(i + 1, 11).setValue(file.getId());
      sheet.getRange(i + 1, 8).setValue('UNDER_REVIEW');
    }
  });

  // Invia webhook a Make
  const webhookUrl = 'YOUR_MAKE_WEBHOOK_URL';
  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      groupId,
      imageUrl: fileUrl,
      driveFileId: file.getId()
    })
  });

  return 'OK';
}
