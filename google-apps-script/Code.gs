// Вставте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID у Project Settings → Script Properties.
// Не публікуйте токен у GitHub чи в коді сайту.
function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    // Honeypot: не надсилаємо спам, але відповідаємо однаково.
    if (p.website) return ContentService.createTextOutput('OK');
    var name = String(p.name || '').trim().slice(0, 100);
    var phone = String(p.phone || '').trim().slice(0, 40);
    if (name.length < 2 || !/^\\+?[0-9\\s()\\-]{9,25}$/.test(phone)) return ContentService.createTextOutput('INVALID');
    var cache = CacheService.getScriptCache();
    var key = 'lead_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, name + '|' + phone)).slice(0, 40);
    if (cache.get(key)) return ContentService.createTextOutput('OK');
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('TELEGRAM_BOT_TOKEN');
    var chat = props.getProperty('TELEGRAM_CHAT_ID');
    if (!token || !chat) throw new Error('Missing Telegram configuration');
    var product = String(p.product || 'Товар').slice(0, 150);
    var price = String(p.price || '').slice(0, 30);
    var method = String(p.contact_method || '').toLowerCase();
    var methodLabel = {viber:'Viber',telegram:'Telegram',sms:'SMS'}[method] || 'Не вказано';
    var username = String(p.telegram_username || '').trim();
    if (method === 'telegram' && !/^@?[a-zA-Z0-9_]{5,32}$/.test(username)) return ContentService.createTextOutput('INVALID');
    if (method === 'telegram' && username.charAt(0) !== '@') username = '@' + username;
    var contactDetails = '\\n💬 Зв’язок: ' + methodLabel + (method === 'telegram' ? '\\n🔗 Telegram: ' + username : '');
    var message = '🛒 НОВЕ ЗАМОВЛЕННЯ\\n\\n👤 Ім’я: ' + name + '\\n📞 Телефон: ' + phone + '\\n📦 Товар: ' + product + '\\n💰 Ціна: ' + price + ' грн' + contactDetails;
    var response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({chat_id: chat, text: message}),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) throw new Error('Telegram API error: ' + response.getContentText().slice(0, 300));
    cache.put(key, '1', 60);
    return ContentService.createTextOutput('OK');
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('ERROR');
  }
}
