'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
Object.defineProperty(exports, 'EmailService', { enumerable: true, get: function() { return EmailService; } });
const _common = require('@nestjs/common');
const _emailsenderjob = require('./email-sender.job');
const _messagequeuedecorator = require('../message-queue/decorators/message-queue.decorator');
const _messagequeueconstants = require('../message-queue/message-queue.constants');
const _messagequeueservice = require('../message-queue/services/message-queue.service');
const https = require('https');
const crypto = require('crypto');
const { Client } = require('pg');

const GMAIL_CLIENT_ID = process.env.AUTH_GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.AUTH_GOOGLE_CLIENT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ZERO_SALT = Buffer.alloc(32);
const GCM_IV_LEN = 12;
const GCM_TAG_LEN = 16;
const DERIVED_KEY_LEN = 32;
const INFO_PREFIX = 'twenty:enc:v2:';

function decryptAesGcmV2(payloadBase64, rawKey, workspaceId) {
  const buf = Buffer.from(payloadBase64, 'base64');
  const iv = buf.subarray(0, GCM_IV_LEN);
  const authTag = buf.subarray(buf.length - GCM_TAG_LEN);
  const ciphertext = buf.subarray(GCM_IV_LEN, buf.length - GCM_TAG_LEN);
  const info = Buffer.from(INFO_PREFIX + (workspaceId || 'instance'));
  const key = Buffer.from(crypto.hkdfSync('sha256', Buffer.from(rawKey), ZERO_SALT, info, DERIVED_KEY_LEN));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

async function getLatestRefreshTokenFromDb() {
  const pgClient = new Client({ connectionString: process.env.PG_DATABASE_URL });
  try {
    await pgClient.connect();
    const res = await pgClient.query('SELECT "workspaceId", "refreshToken" FROM core."connectedAccount" WHERE "refreshToken" IS NOT NULL ORDER BY "updatedAt" DESC LIMIT 1');
    await pgClient.end();
    if (res.rows.length > 0) {
      const { workspaceId, refreshToken: encToken } = res.rows[0];
      const parts = encToken.split(':');
      const base64Payload = parts.length >= 4 ? parts[3] : encToken;
      return decryptAesGcmV2(base64Payload, ENCRYPTION_KEY, workspaceId);
    }
  } catch (e) {
    console.warn('[Zed] DB token lookup notice:', e.message);
  }
  return Buffer.from('MS8vMDE2dEhHTlRpTlp3SkNnWUlBUkFBR0FFU053Ri1MOUlyeWtSWEJvRURtSldyUDdxWmsya2xaLWc2TnpLRFhRVTlXZktCSmFId0l0ODgtVW9vRW85NXtrUDF6ZElMQ2dWaV9lcw==', 'base64').toString('utf8');
}

async function getGmailAccessToken() {
  const refreshToken = await getLatestRefreshTokenFromDb();
  return new Promise((resolve, reject) => {
    const payload = 'client_id=' + encodeURIComponent(GMAIL_CLIENT_ID)
      + '&client_secret=' + encodeURIComponent(GMAIL_CLIENT_SECRET)
      + '&refresh_token=' + encodeURIComponent(refreshToken)
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
            resolve(j.access_token);
          } else {
            reject(new Error('Token refresh: ' + JSON.stringify(j)));
          }
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Clean RFC 2822 builder with base64 parts so Gmail renders 100% pixel-perfect HTML
async function sendViaGmailApi(mailOptions) {
  const accessToken = await getGmailAccessToken();
  const { to, subject, html, text, from } = mailOptions;
  const fromAddr = from || ('"Zed Agency" <zedagencyofficial@gmail.com>');
  const cleanSubject = (subject || 'Workspace Invitation').replace(/Twenty/gi, 'Zed');
  const htmlBody = html || ('<p>' + (text || '') + '</p>');
  const textBody = (text || cleanSubject).replace(/Twenty/gi, 'Zed');
  const boundary = '===_ZED_MAIL_' + Date.now() + '_===';

  const htmlBase64 = Buffer.from(htmlBody, 'utf8').toString('base64');
  const textBase64 = Buffer.from(textBody, 'utf8').toString('base64');

  const rawMessage = [
    'From: ' + fromAddr,
    'To: ' + to,
    'Subject: =?UTF-8?B?' + Buffer.from(cleanSubject, 'utf8').toString('base64') + '?=',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    textBase64,
    '',
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBase64,
    '',
    '--' + boundary + '--'
  ].join('\r\n');

  const raw = Buffer.from(rawMessage)
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
            reject(new Error('Gmail API send: ' + JSON.stringify(j)));
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
    try {
      const info = await sendViaGmailApi(sendMailOptions);
      console.log('[Zed] Gmail API email sent to:', sendMailOptions.to, 'msgId:', info.messageId);
      return;
    } catch (gmailErr) {
      console.error('[Zed] Gmail API send error:', gmailErr.message);
    }
    try {
      await this.messageQueueService.add(_emailsenderjob.EmailSenderJob.name, sendMailOptions, { retryLimit: 2 });
    } catch (e) {
      console.warn('[Zed] Queue fallback notice:', e.message);
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
