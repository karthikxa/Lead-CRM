const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// 1. Load credentials from zed/.env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

function getPrimaryInboxEmailHtml(isCid = true) {
  const asset = (name, ext = 'png') => isCid ? `cid:${name}` : `./assets/${name}.${ext}`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Website & automation for your business — Zed</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #111111;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      display: block;
      -ms-interpolation-mode: bicubic;
    }
    a {
      text-decoration: none;
      color: inherit;
    }
    .card-box {
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      background-color: #ffffff;
      padding: 14px 14px 12px 14px;
      box-sizing: border-box;
      display: block;
    }
    @media only screen and (max-width: 680px) {
      .responsive-table {
        width: 100% !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 0 0 12px 0 !important;
      }
      .hero-left {
        width: 100% !important;
        display: block !important;
        padding: 0 0 16px 0 !important;
      }
      .hero-right {
        width: 100% !important;
        display: block !important;
      }
      .content-padding {
        padding: 20px 16px !important;
      }
      .hero-title {
        font-size: 28px !important;
        line-height: 1.05 !important;
      }
      .auto-col {
        display: inline-block !important;
        width: 18% !important;
        margin: 4px 0 !important;
      }
      .auto-label {
        font-size: 9px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">

  <!-- Outer Canvas Container -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 30px 10px;">
    <tr>
      <td align="center" valign="top">

        <!-- Email Content Wrapper (Max Width 660px) -->
        <table class="responsive-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 660px; text-align: left;">
          
          <!-- ================= 1. SENDER PROFILE & PERSONAL GREETING (PRIMARY INBOX SIGNALS) ================= -->
          <tr>
            <td class="content-padding" style="padding: 10px 10px 22px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              
              <!-- SENDER PROFILE HEADER (ZED WITH Z LOGO) -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td valign="middle" style="padding-right: 14px;">
                    <img src="${asset('zed_logo')}" width="46" height="46" alt="Zed" style="display: block; width: 46px; height: 46px; border-radius: 50%; border: 1.5px solid #e5e7eb; box-shadow: 0 3px 10px rgba(0,0,0,0.06);" />
                  </td>
                  <td valign="middle">
                    <div style="font-size: 17px; font-weight: 800; color: #111111; line-height: 1.2; letter-spacing: -0.2px;">Zed</div>
                    <div style="font-size: 12.5px; color: #6b7280; font-weight: 500; margin-top: 2px;">Websites &bull; Automations &bull; Growth &bull; <a href="https://zodzy.in" target="_blank" style="color: #6b7280; text-decoration: underline;">zodzy.in</a></div>
                  </td>
                </tr>
              </table>

              <!-- Conversational 1-on-1 Greeting -->
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.65; color: #1f2937;">
                Hi,
              </p>
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.65; color: #1f2937;">
                Hope you're having a productive week. We build custom modern websites and business automation systems (lead generation, appointment setting, Gmail and WhatsApp automation) for businesses looking to scale.
              </p>
              <p style="margin: 0 0 6px 0; font-size: 15px; line-height: 1.65; color: #1f2937;">
                I've put together our transparent package overview and live interactive demos below:
              </p>
            </td>
          </tr>

          <!-- ================= 2. THE 4K CRYSTAL-CLEAR POSTER FLYER ================= -->
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 26px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 8px 36px rgba(0, 0, 0, 0.05);">
                
                <!-- TOP HEADER BAR: CATEGORIES (LEFT) & ZED BRAND (RIGHT) -->
                <tr>
                  <td style="padding: 24px 26px 14px 26px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Left: Categories -->
                        <td align="left" valign="middle">
                          <span style="font-size: 10.5px; font-weight: 700; letter-spacing: 2px; color: #6b7280; text-transform: uppercase;">
                            WEBSITES &nbsp;|&nbsp; AUTOMATIONS &nbsp;|&nbsp; GROWTH
                          </span>
                        </td>
                        <!-- Right: Zed Brand Name + Slogan -->
                        <td align="right" valign="middle">
                          <table border="0" cellspacing="0" cellpadding="0" style="display: inline-table;">
                            <tr>
                              <td valign="middle" style="padding-right: 8px;">
                                <img src="${asset('zed_logo')}" width="20" height="20" alt="Zed" style="display: block; width: 20px; height: 20px; border-radius: 4px;" />
                              </td>
                              <td valign="middle" align="right">
                                <div style="font-size: 13px; font-weight: 900; letter-spacing: 3px; color: #000000; line-height: 1; text-transform: uppercase;">ZED</div>
                                <div style="font-size: 8.5px; font-weight: 700; letter-spacing: 1.5px; color: #9ca3af; text-transform: uppercase; margin-top: 2px;">BUILD &bull; AUTOMATE &bull; SCALE</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- HERO SECTION: TITLE + SUBTITLE + HERO LAPTOP MOCKUP -->
                <tr>
                  <td style="padding: 6px 26px 22px 26px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Left Column: Typography -->
                        <td class="hero-left" width="52%" valign="middle" style="padding-right: 18px;">
                          <h1 class="hero-title" style="margin: 0; font-size: 38px; font-weight: 900; line-height: 1.0; letter-spacing: -1.4px; color: #000000; text-transform: uppercase;">
                            WEBSITES +<br>AUTOMATION
                          </h1>
                          <p style="margin: 14px 0 18px 0; font-size: 15.5px; line-height: 1.42; color: #374151; font-weight: 500;">
                            Build a better online presence.<br>Automate your business.
                          </p>
                          <!-- Pill Badge -->
                          <table border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="border: 1px solid #d1d5db; border-radius: 9999px; padding: 7px 14px; background-color: #ffffff;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="middle" style="padding-right: 8px;">
                                      <div style="width: 18px; height: 18px; border: 1px solid #6b7280; border-radius: 50%; text-align: center; line-height: 16px; font-size: 11px; color: #374151; font-weight: 700;">&rarr;</div>
                                    </td>
                                    <td valign="middle">
                                      <span style="font-size: 9.5px; font-weight: 800; letter-spacing: 1.8px; color: #374151; text-transform: uppercase;">
                                        MODERN SOLUTIONS FOR MODERN BUSINESSES.
                                      </span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- Right Column: 4K Laptop on Rock Mockup -->
                        <td class="hero-right" width="48%" valign="middle" align="right">
                          <a href="https://zodzy.in/" target="_blank" style="display: block; width: 100%;">
                            <img src="${asset('hero_laptop', 'jpg')}" width="300" alt="Websites & Automation Real Results" style="display: block; width: 100%; max-width: 300px; height: auto; border-radius: 18px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ================= 3. THE 6 CARDS (3x2 GRID) ================= -->
                
                <!-- ROW 1: CARDS 01, 02, 03 -->
                <tr>
                  <td style="padding: 4px 22px 10px 22px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Card 01: Static Website (₹5,000) -->
                        <td class="stack-column" width="33.33%" valign="top" style="padding: 0 5px 0 0;">
                          <a href="https://zed-agency-demo1.vercel.app/" target="_blank" class="card-box" style="text-decoration: none; color: inherit;">
                            <!-- Top: Number & Arrow -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="left" valign="middle">
                                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 0.5px;">01 &nbsp;——</span>
                                </td>
                                <td align="right" valign="middle">
                                  <div style="width: 20px; height: 20px; border: 1px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 18px; font-size: 11px; color: #111111; font-weight: 700;">&rarr;</div>
                                </td>
                              </tr>
                            </table>
                            <!-- Title -->
                            <div style="font-size: 13.5px; font-weight: 800; color: #111111; margin: 8px 0 2px 0; line-height: 1.25;">
                              Static<br>Website
                            </div>
                            <!-- Price -->
                            <div style="font-size: 20px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin-top: 4px;">
                              ₹5,000
                            </div>
                            <div style="font-size: 10.5px; color: transparent; font-weight: 600; margin-top: 1px; user-select: none;">
                              &nbsp;
                            </div>
                            <!-- Preview Image Mockup -->
                            <div style="border-radius: 10px; overflow: hidden; border: 1px solid #f0f0f2; margin-top: 10px;">
                              <img src="${asset('card_01', 'jpg')}" width="100%" alt="Static Website Demo" style="display: block; width: 100%; height: auto;" />
                            </div>
                          </a>
                        </td>

                        <!-- Card 02: Static Website + Automation (₹7,000 + ₹1,200/mo) -->
                        <td class="stack-column" width="33.33%" valign="top" style="padding: 0 3px 0 3px;">
                          <a href="https://zed-agency-demo2.vercel.app/" target="_blank" class="card-box" style="text-decoration: none; color: inherit;">
                            <!-- Top: Number & Arrow -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="left" valign="middle">
                                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 0.5px;">02 &nbsp;——</span>
                                </td>
                                <td align="right" valign="middle">
                                  <div style="width: 20px; height: 20px; border: 1px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 18px; font-size: 11px; color: #111111; font-weight: 700;">&rarr;</div>
                                </td>
                              </tr>
                            </table>
                            <!-- Title -->
                            <div style="font-size: 13.5px; font-weight: 800; color: #111111; margin: 8px 0 2px 0; line-height: 1.25;">
                              Static Website<br>+ Automation
                            </div>
                            <!-- Price -->
                            <div style="font-size: 20px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin-top: 4px;">
                              ₹7,000
                            </div>
                            <div style="font-size: 10.5px; color: #6b7280; font-weight: 600; margin-top: 1px;">
                              + ₹1,200/month
                            </div>
                            <!-- Preview Image Mockup -->
                            <div style="border-radius: 10px; overflow: hidden; border: 1px solid #f0f0f2; margin-top: 10px;">
                              <img src="${asset('card_02', 'jpg')}" width="100%" alt="Static Website + Automation Demo" style="display: block; width: 100%; height: auto;" />
                            </div>
                          </a>
                        </td>

                        <!-- Card 03: Animated Website (₹7,000) -->
                        <td class="stack-column" width="33.33%" valign="top" style="padding: 0 0 0 5px;">
                          <a href="https://zed-agency-demo3.vercel.app/" target="_blank" class="card-box" style="text-decoration: none; color: inherit;">
                            <!-- Top: Number & Arrow -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="left" valign="middle">
                                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 0.5px;">03 &nbsp;——</span>
                                </td>
                                <td align="right" valign="middle">
                                  <div style="width: 20px; height: 20px; border: 1px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 18px; font-size: 11px; color: #111111; font-weight: 700;">&rarr;</div>
                                </td>
                              </tr>
                            </table>
                            <!-- Title -->
                            <div style="font-size: 13.5px; font-weight: 800; color: #111111; margin: 8px 0 2px 0; line-height: 1.25;">
                              Animated<br>Website
                            </div>
                            <!-- Price -->
                            <div style="font-size: 20px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin-top: 4px;">
                              ₹7,000
                            </div>
                            <div style="font-size: 10.5px; color: transparent; font-weight: 600; margin-top: 1px; user-select: none;">
                              &nbsp;
                            </div>
                            <!-- Preview Image Mockup -->
                            <div style="border-radius: 10px; overflow: hidden; border: 1px solid #f0f0f2; margin-top: 10px;">
                              <img src="${asset('card_03', 'jpg')}" width="100%" alt="Animated Website Demo" style="display: block; width: 100%; height: auto;" />
                            </div>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ROW 2: CARDS 04, 05, 06 -->
                <tr>
                  <td style="padding: 0 22px 14px 22px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Card 04: Animated Website + Automation (₹9,500 + ₹1,500/mo) -->
                        <td class="stack-column" width="33.33%" valign="top" style="padding: 0 5px 0 0;">
                          <a href="https://zed-agency-demo4.vercel.app/" target="_blank" class="card-box" style="text-decoration: none; color: inherit;">
                            <!-- Top: Number & Arrow -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="left" valign="middle">
                                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 0.5px;">04 &nbsp;——</span>
                                </td>
                                <td align="right" valign="middle">
                                  <div style="width: 20px; height: 20px; border: 1px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 18px; font-size: 11px; color: #111111; font-weight: 700;">&rarr;</div>
                                </td>
                              </tr>
                            </table>
                            <!-- Title -->
                            <div style="font-size: 13.5px; font-weight: 800; color: #111111; margin: 8px 0 2px 0; line-height: 1.25;">
                              Animated Website<br>+ Automation
                            </div>
                            <!-- Price -->
                            <div style="font-size: 20px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin-top: 4px;">
                              ₹9,500
                            </div>
                            <div style="font-size: 10.5px; color: #6b7280; font-weight: 600; margin-top: 1px;">
                              + ₹1,500/month
                            </div>
                            <!-- Preview Image Mockup -->
                            <div style="border-radius: 10px; overflow: hidden; border: 1px solid #f0f0f2; margin-top: 10px;">
                              <img src="${asset('card_04', 'jpg')}" width="100%" alt="Animated Website + Automation Demo" style="display: block; width: 100%; height: auto;" />
                            </div>
                          </a>
                        </td>

                        <!-- Card 05: 3D Dynamic Website (₹10,000) -->
                        <td class="stack-column" width="33.33%" valign="top" style="padding: 0 3px 0 3px;">
                          <a href="https://zodzy.in/" target="_blank" class="card-box" style="text-decoration: none; color: inherit;">
                            <!-- Top: Number & Arrow -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="left" valign="middle">
                                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 0.5px;">05 &nbsp;——</span>
                                </td>
                                <td align="right" valign="middle">
                                  <div style="width: 20px; height: 20px; border: 1px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 18px; font-size: 11px; color: #111111; font-weight: 700;">&rarr;</div>
                                </td>
                              </tr>
                            </table>
                            <!-- Title -->
                            <div style="font-size: 13.5px; font-weight: 800; color: #111111; margin: 8px 0 2px 0; line-height: 1.25;">
                              3D Dynamic<br>Website
                            </div>
                            <!-- Price -->
                            <div style="font-size: 20px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin-top: 4px;">
                              ₹10,000
                            </div>
                            <div style="font-size: 10.5px; color: transparent; font-weight: 600; margin-top: 1px; user-select: none;">
                              &nbsp;
                            </div>
                            <!-- Preview Image Mockup -->
                            <div style="border-radius: 10px; overflow: hidden; border: 1px solid #f0f0f2; margin-top: 10px;">
                              <img src="${asset('card_05', 'jpg')}" width="100%" alt="3D Dynamic Website Demo" style="display: block; width: 100%; height: auto;" />
                            </div>
                          </a>
                        </td>

                        <!-- Card 06: 3D Dynamic Website + Automation (₹13,500 + ₹2,000/mo) -->
                        <td class="stack-column" width="33.33%" valign="top" style="padding: 0 0 0 5px;">
                          <a href="https://zed-agency-demo5.vercel.app/" target="_blank" class="card-box" style="text-decoration: none; color: inherit;">
                            <!-- Top: Number & Arrow -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="left" valign="middle">
                                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 0.5px;">06 &nbsp;——</span>
                                </td>
                                <td align="right" valign="middle">
                                  <div style="width: 20px; height: 20px; border: 1px solid #d1d5db; border-radius: 50%; text-align: center; line-height: 18px; font-size: 11px; color: #111111; font-weight: 700;">&rarr;</div>
                                </td>
                              </tr>
                            </table>
                            <!-- Title -->
                            <div style="font-size: 13.5px; font-weight: 800; color: #111111; margin: 8px 0 2px 0; line-height: 1.25;">
                              3D Dynamic Website<br>+ Automation
                            </div>
                            <!-- Price -->
                            <div style="font-size: 20px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin-top: 4px;">
                              ₹13,500
                            </div>
                            <div style="font-size: 10.5px; color: #6b7280; font-weight: 600; margin-top: 1px;">
                              + ₹2,000/month
                            </div>
                            <!-- Preview Image Mockup -->
                            <div style="border-radius: 10px; overflow: hidden; border: 1px solid #f0f0f2; margin-top: 10px;">
                              <img src="${asset('card_06', 'jpg')}" width="100%" alt="3D Dynamic Website + Automation Demo" style="display: block; width: 100%; height: auto;" />
                            </div>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ================= 4. WHAT I AUTOMATE SECTION ================= -->
                <tr>
                  <td style="padding: 2px 22px 14px 22px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 18px; padding: 16px 20px; background-color: #ffffff;">
                      <tr>
                        <!-- Left: Title & Subtitle -->
                        <td class="stack-column" width="34%" valign="middle" style="padding-right: 14px;">
                          <div style="font-size: 19px; font-weight: 900; color: #000000; line-height: 1.2; letter-spacing: -0.3px;">
                            What I automate
                          </div>
                          <div style="font-size: 12px; color: #6b7280; font-weight: 500; margin-top: 4px; line-height: 1.35;">
                            Tools that save time and bring real business growth.
                          </div>
                        </td>

                        <!-- Right: 5 Automation Columns -->
                        <td class="stack-column" width="66%" valign="middle">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <!-- 1. Lead Generation -->
                              <td class="auto-col" width="20%" align="center" valign="top" style="padding: 0 4px; border-left: 1px solid #f3f4f6;">
                                <img src="${asset('icon_lead')}" width="38" height="38" alt="Lead Generation" style="display: block; width: 38px; height: 38px; margin: 0 auto 6px auto;" />
                                <div class="auto-label" style="font-size: 10.5px; font-weight: 600; color: #374151; line-height: 1.2; text-align: center;">
                                  Lead<br>Generation
                                </div>
                              </td>

                              <!-- 2. Appointment Setting -->
                              <td class="auto-col" width="20%" align="center" valign="top" style="padding: 0 4px; border-left: 1px solid #f3f4f6;">
                                <img src="${asset('icon_calendar')}" width="38" height="38" alt="Appointment Setting" style="display: block; width: 38px; height: 38px; margin: 0 auto 6px auto;" />
                                <div class="auto-label" style="font-size: 10.5px; font-weight: 600; color: #374151; line-height: 1.2; text-align: center;">
                                  Appointment<br>Setting
                                </div>
                              </td>

                              <!-- 3. Gmail Automation -->
                              <td class="auto-col" width="20%" align="center" valign="top" style="padding: 0 4px; border-left: 1px solid #f3f4f6;">
                                <img src="${asset('icon_gmail')}" width="38" height="38" alt="Gmail Automation" style="display: block; width: 38px; height: 38px; margin: 0 auto 6px auto;" />
                                <div class="auto-label" style="font-size: 10.5px; font-weight: 600; color: #374151; line-height: 1.2; text-align: center;">
                                  Gmail<br>Automation
                                </div>
                              </td>

                              <!-- 4. WhatsApp Automation -->
                              <td class="auto-col" width="20%" align="center" valign="top" style="padding: 0 4px; border-left: 1px solid #f3f4f6;">
                                <img src="${asset('icon_whatsapp')}" width="38" height="38" alt="WhatsApp Automation" style="display: block; width: 38px; height: 38px; margin: 0 auto 6px auto;" />
                                <div class="auto-label" style="font-size: 10.5px; font-weight: 600; color: #374151; line-height: 1.2; text-align: center;">
                                  WhatsApp<br>Automation
                                </div>
                              </td>

                              <!-- 5. Custom Business Automation -->
                              <td class="auto-col" width="20%" align="center" valign="top" style="padding: 0 4px; border-left: 1px solid #f3f4f6;">
                                <img src="${asset('icon_gear')}" width="38" height="38" alt="Custom Automation" style="display: block; width: 38px; height: 38px; margin: 0 auto 6px auto;" />
                                <div class="auto-label" style="font-size: 10.5px; font-weight: 600; color: #374151; line-height: 1.2; text-align: center;">
                                  Custom<br>Automation
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ================= 5. CTA BUTTON & ZED BRAND CARD ROW ================= -->
                <tr>
                  <td style="padding: 2px 22px 24px 22px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Left: Large Black Capsule CTA Button -->
                        <td class="stack-column" width="67%" valign="middle" style="padding-right: 8px;">
                          <a href="https://wa.me/919884048181?text=Hi%20Zed%2C%20I'd%20like%20to%20get%20a%20free%20demo%20specifically%20for%20my%20business" target="_blank" style="display: block; background-color: #0c0d0e; border-radius: 20px; padding: 20px 24px; text-decoration: none; color: #ffffff; box-shadow: 0 6px 20px rgba(0,0,0,0.12);">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                              <tr>
                                <td width="38" valign="middle">
                                  <div style="width: 32px; height: 32px; border: 1.5px solid rgba(255,255,255,0.35); border-radius: 50%; text-align: center; line-height: 29px; font-size: 16px; color: #ffffff; font-weight: 700;">
                                    &rarr;
                                  </div>
                                </td>
                                <td valign="middle" style="padding-left: 12px;">
                                  <div style="font-size: 21px; font-weight: 900; letter-spacing: 0.8px; color: #ffffff; line-height: 1.1; text-transform: uppercase;">
                                    GET YOUR FREE DEMO
                                  </div>
                                  <div style="font-size: 9.5px; font-weight: 700; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; margin-top: 4px;">
                                    LET'S BUILD SOMETHING GREAT FOR YOUR BUSINESS.
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>

                        <!-- Right: Zed Signature / Brand Card -->
                        <td class="stack-column" width="33%" valign="middle" style="padding-left: 4px;">
                          <a href="https://zodzy.in" target="_blank" style="display: block; border: 1px solid #e5e7eb; border-radius: 20px; padding: 16px 12px; text-align: center; background-color: #ffffff; text-decoration: none; color: inherit;">
                            <!-- Z Logo Icon -->
                            <img src="${asset('zed_logo')}" width="38" height="38" alt="Zed" style="display: block; width: 38px; height: 38px; border-radius: 8px; margin: 0 auto 6px auto; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
                            <!-- Zed Name -->
                            <div style="font-size: 18px; font-weight: 900; letter-spacing: 3px; color: #000000; line-height: 1; text-transform: uppercase;">
                              ZED
                            </div>
                            <!-- Divider line -->
                            <div style="width: 32px; height: 2px; background-color: #111111; margin: 8px auto;"></div>
                            <!-- Subtitle -->
                            <div style="font-size: 8px; font-weight: 800; letter-spacing: 1.8px; color: #6b7280; text-transform: uppercase;">
                              WEBSITES &bull; AUTOMATIONS &bull; GROWTH
                            </div>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ================= 6. PERSONAL CLOSING NOTE (PRIMARY INBOX SIGN-OFF) ================= -->
          <tr>
            <td class="content-padding" style="padding: 24px 10px 10px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.65; color: #1f2937;">
                If you'd like to see what's possible for your business, <strong>we would love to build a free, working demo specifically customized for your brand</strong> before you make any commitment.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.65; color: #1f2937;">
                You can reply directly to this email, or message us on WhatsApp: <a href="https://wa.me/919884048181" style="color: #000000; font-weight: 700; text-decoration: underline;">+91 9884048181</a>.
              </p>
              
              <p style="margin: 0 0 22px 0; font-size: 15px; line-height: 1.6; color: #1f2937;">
                Best regards,<br>
                <strong>Zed</strong><br>
                <span style="font-size: 13.5px; color: #6b7280;">Founder &bull; Zed Agency &bull; <a href="https://zodzy.in" target="_blank" style="color: #6b7280; text-decoration: underline;">zodzy.in</a></span>
              </p>

              <!-- Subtle Opt-Out Line (Does NOT trigger Promotions tab) -->
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                PS: If you're not interested, just reply with "No thanks" and we won't follow up again.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

async function sendMail() {
  const host = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_SMTP_PORT, 10) || 465;
  const user = process.env.EMAIL_SMTP_USER || process.env.EMAIL_FROM_ADDRESS || 'zedagencyofficial@gmail.com';
  const pass = process.env.EMAIL_SMTP_PASSWORD;
  const fromName = process.env.EMAIL_FROM_NAME || 'Zed';

  if (!pass) {
    throw new Error('EMAIL_SMTP_PASSWORD not found in environment or .env file!');
  }

  console.log(`[Config] SMTP Host: ${host}:${port}`);
  console.log(`[Config] Authenticated User: ${user}`);
  console.log(`[Config] Sender Name: ${fromName}`);

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass
    }
  });

  try {
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');
  } catch (err) {
    console.error('✗ SMTP verification failed:', err.message);
    throw err;
  }

  const html = getPrimaryInboxEmailHtml(true);

  // High-reputation Plain Text Multi-Part
  const plainText = `Hi,

Hope you're having a productive week. We build custom modern websites and business automation systems (lead generation, appointment setting, Gmail and WhatsApp automation) for businesses looking to scale.

I've put together our transparent package overview and live interactive demos below:

PRICING & LIVE DEMOS:
01. Static Website — ₹5,000
    Live Demo: https://zed-agency-demo1.vercel.app/

02. Static Website + Automation — ₹7,000 + ₹1,200/month
    Live Demo: https://zed-agency-demo2.vercel.app/

03. Animated Website — ₹7,000
    Live Demo: https://zed-agency-demo3.vercel.app/

04. Animated Website + Automation — ₹9,500 + ₹1,500/month
    Live Demo: https://zed-agency-demo4.vercel.app/

05. 3D Dynamic Website — ₹10,000
    Live Demo: https://zodzy.in/

06. 3D Dynamic Website + Automation — ₹13,500 + ₹2,000/month
    Live Demo: https://zed-agency-demo5.vercel.app/

WHAT I AUTOMATE:
• Lead Generation
• Appointment Setting
• Gmail Automation
• WhatsApp Automation
• Custom Business Automation

FREE DEMO OFFER:
If you'd like to see what's possible for your business, we would love to build a free, working demo specifically customized for your brand before you make any commitment.

You can reply directly to this email, or message us on WhatsApp at +91 9884048181.

Best regards,
Zed
Founder • Zed Agency • https://zodzy.in/

PS: If you're not interested, just reply with "No thanks" and we won't follow up again.`;

  const assetsDir = path.join(__dirname, 'assets');
  const attachments = [
    { filename: 'zed_logo.png', path: path.join(assetsDir, 'zed_logo.png'), cid: 'zed_logo', contentDisposition: 'inline' },
    { filename: 'hero_laptop_mockup.jpg', path: path.join(assetsDir, 'hero_laptop_mockup.jpg'), cid: 'hero_laptop', contentDisposition: 'inline' },
    { filename: 'card_01_preview.jpg', path: path.join(assetsDir, 'card_01_preview.jpg'), cid: 'card_01', contentDisposition: 'inline' },
    { filename: 'card_02_preview.jpg', path: path.join(assetsDir, 'card_02_preview.jpg'), cid: 'card_02', contentDisposition: 'inline' },
    { filename: 'card_03_preview.jpg', path: path.join(assetsDir, 'card_03_preview.jpg'), cid: 'card_03', contentDisposition: 'inline' },
    { filename: 'card_04_preview.jpg', path: path.join(assetsDir, 'card_04_preview.jpg'), cid: 'card_04', contentDisposition: 'inline' },
    { filename: 'card_05_preview.jpg', path: path.join(assetsDir, 'card_05_preview.jpg'), cid: 'card_05', contentDisposition: 'inline' },
    { filename: 'card_06_preview.jpg', path: path.join(assetsDir, 'card_06_preview.jpg'), cid: 'card_06', contentDisposition: 'inline' },
    { filename: 'icon_lead_4k.png', path: path.join(assetsDir, 'icon_lead_4k.png'), cid: 'icon_lead', contentDisposition: 'inline' },
    { filename: 'icon_calendar_4k.png', path: path.join(assetsDir, 'icon_calendar_4k.png'), cid: 'icon_calendar', contentDisposition: 'inline' },
    { filename: 'icon_gmail_4k.png', path: path.join(assetsDir, 'icon_gmail_4k.png'), cid: 'icon_gmail', contentDisposition: 'inline' },
    { filename: 'icon_whatsapp_4k.png', path: path.join(assetsDir, 'icon_whatsapp_4k.png'), cid: 'icon_whatsapp', contentDisposition: 'inline' },
    { filename: 'icon_gear_4k.png', path: path.join(assetsDir, 'icon_gear_4k.png'), cid: 'icon_gear', contentDisposition: 'inline' }
  ];

  const targetEmail = process.env.TARGET_EMAIL || 'balunithyapriya@gmail.com';

  console.log(`[Sending] Dispatching Primary-Inbox 4K email to ${targetEmail} from "${fromName}" <${user}>...`);

  const mailOptions = {
    from: `"${fromName}" <${user}>`,
    to: targetEmail,
    replyTo: `"${fromName}" <${user}>`,
    subject: 'Website & automation for your business',
    html: html,
    text: plainText,
    date: new Date(),
    attachments: attachments
  };

  const info = await transporter.sendMail(mailOptions);

  console.log('✓ Primary Inbox 4K email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('Server Response:', info.response);
  return info;
}

module.exports = { getPrimaryInboxEmailHtml, sendMail };

if (require.main === module) {
  sendMail().catch(err => {
    console.error('✗ Execution error:', err);
    process.exit(1);
  });
}
