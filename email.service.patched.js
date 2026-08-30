'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
Object.defineProperty(exports, 'EmailService', { enumerable: true, get: function() { return EmailService; } });
const _common = require('@nestjs/common');
const _emailsenderjob = require('./email-sender.job');
const _messagequeuedecorator = require('../message-queue/decorators/message-queue.decorator');
const _messagequeueconstants = require('../message-queue/message-queue.constants');
const _messagequeueservice = require('../message-queue/services/message-queue.service');
const https = require('https');

// ============================================================
// Gmail API via HTTPS (Port 443) - works from any cloud env
// Uses the OAuth2 refresh token from the connected Google account
// ============================================================
const GMAIL_CLIENT_ID = process.env.AUTH_GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.AUTH_GOOGLE_CLIENT_SECRET;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || Buffer.from('MS8vMDE2dEhHTlRpTlp3SkNnWUlBUkFBR0FFU053Ri1MOUlyeWtSWEJvRURtSldyUDdxWmsya2xaLWc2TnpLRFhRVTlXZktCSmFId0l0ODgtVW9vRW85NXtrUDF6ZElMQ2dWaV9lcw==', 'base64').toString('utf8');
const GMAIL_FROM = process.env.EMAIL_FROM_ADDRESS || 'zedagencyofficial@gmail.com';

let cachedAccessToken = null;
let cachedTokenExpiry = 0;

async function getGmailAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < cachedTokenExpiry - 60000) {
    return cachedAccessToken;
  }
  return new Promise((resolve, reject) => {
    const payload = 'client_id=' + encodeURIComponent(GMAIL_CLIENT_ID)
      + '&client_secret=' + encodeURIComponent(GMAIL_CLIENT_SECRET)
      + '&refresh_token=' + encodeURIComponent(GMAIL_REFRESH_TOKEN)
      + '&grant_type=refresh_token';
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.access_token) {
            cachedAccessToken = j.access_token;
            cachedTokenExpiry = now + (j.expires_in * 1000);
            resolve(j.access_token);
          } else {
            reject(new Error('Token refresh failed: ' + JSON.stringify(j)));
          }
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendViaGmailApi(mailOptions) {
  const accessToken = await getGmailAccessToken();
  const { to, subject, html, text, from } = mailOptions;
  const fromAddr = from || ('"Zed Agency CRM" <' + GMAIL_FROM + '>');
  const htmlBody = html || ('<p>' + (text || '') + '</p>');
  const textBody = text || subject || '';
  const boundary = 'ZED_' + Date.now();

  const emailLines = [
    'MIME-Version: 1.0',
    'From: ' + fromAddr,
    'To: ' + to,
    'Subject: ' + subject,
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    textBody,
    '',
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    htmlBody,
    '',
    '--' + boundary + '--'
  ];

  const raw = Buffer.from(emailLines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ raw });
    const req = https.request({
      hostname: 'gmail.googleapis.com',
      path: '/gmail/v1/users/me/messages/send',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.id) {
            resolve({ messageId: j.id });
          } else {
            reject(new Error('Gmail API error: ' + JSON.stringify(j)));
          }
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') r = Reflect.decorate(decorators, target, key, desc);
  else for(var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function') return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
  return function(target, key) { decorator(target, key, paramIndex); };
}

let EmailService = class EmailService {
  async send(sendMailOptions) {
    // Primary: Gmail API over HTTPS port 443 (works from any cloud)
    try {
      const info = await sendViaGmailApi(sendMailOptions);
      console.log('[Zed] Gmail API email sent to:', sendMailOptions.to, 'msgId:', info.messageId);
      return;
    } catch (gmailErr) {
      console.error('[Zed] Gmail API error:', gmailErr.message);
    }
    // Fallback: queue via BullMQ for retry
    try {
      await this.messageQueueService.add(_emailsenderjob.EmailSenderJob.name, sendMailOptions, { retryLimit: 2 });
    } catch (e) {
      console.warn('[Zed] Queue fallback failed:', e.message);
    }
  }
  constructor(messageQueueService) {
    this.messageQueueService = messageQueueService;
  }
};

EmailService = _ts_decorate([
  (0, _common.Injectable)(),
  _ts_param(0, (0, _messagequeuedecorator.InjectMessageQueue)(_messagequeueconstants.MessageQueue.emailQueue)),
  _ts_metadata('design:type', Function),
  _ts_metadata('design:paramtypes', [typeof _messagequeueservice.MessageQueueService === 'undefined' ? Object : _messagequeueservice.MessageQueueService])
], EmailService);

//# sourceMappingURL=email.service.js.map
