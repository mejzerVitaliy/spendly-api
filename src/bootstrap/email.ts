import { environmentVariables } from '@/config';
import { Resend } from 'resend';

const resend = new Resend(environmentVariables.RESEND_API_KEY);

const BRAND = {
  primary: '#22D3EE',
  primaryDark: '#0EA5C9',
  background: '#ffffff',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  foreground: '#111111',
  body: '#374151',
  muted: '#6b7280',
  featureBg: '#f0fdff',
  featureBorder: '#a5f3fc',
  appBg: '#080808',
};

const baseEmailWrapper = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#38E8FF,${BRAND.primary},${BRAND.primaryDark});border-radius:12px;padding:9px 13px;">
                    <span style="font-size:18px;font-weight:800;color:#080808;letter-spacing:-1px;">S</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.5px;">Spendly AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;border:1px solid #e5e7eb;overflow:hidden;">
              <!-- Cyan top bar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,#38E8FF,${BRAND.primary},${BRAND.primaryDark});font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
                Need help? <a href="mailto:support@spendly-ai.com" style="color:${BRAND.primary};text-decoration:none;">support@spendly-ai.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">© 2026 Spendly AI. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const featureRow = (emoji: string, title: string, description: string) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;">
    <tr>
      <td bgcolor="#f0fdff" style="background-color:#f0fdff;border:1px solid #a5f3fc;border-radius:12px;padding:14px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-right:12px;vertical-align:middle;">
              <span style="font-size:22px;">${emoji}</span>
            </td>
            <td>
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111111;">${title}</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

const divider = `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;">
    <tr><td style="height:1px;background:#e5e7eb;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;

const welcomeEmailHtml = () =>
  baseEmailWrapper(`
  <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111111;letter-spacing:-0.5px;">Welcome to Spendly AI! 🎉</h1>
  <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.65;">
    Your account is ready. Start tracking your finances with the power of AI.
  </p>

  ${featureRow('🤖', 'AI-Powered Transactions', 'Describe expenses in plain text or voice — AI parses them instantly.')}
  ${featureRow('📊', 'Smart Analytics', 'Beautiful charts and insights to see exactly where your money goes.')}
  ${featureRow('💳', 'Multi-Wallet Support', 'Track cash, cards, credit, and savings — all in one place.')}

  ${divider}

  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
    Questions? We're always here — <a href="mailto:support@spendly-ai.com" style="color:${BRAND.primary};text-decoration:none;">support@spendly-ai.com</a>
  </p>
`);

const resetPasswordEmailHtml = (redirectUrl: string) =>
  baseEmailWrapper(`
  <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111111;letter-spacing:-0.5px;">Reset your password</h1>
  <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.65;">
    We received a request to reset your Spendly AI password. Tap the button below to open the app and choose a new one.
  </p>

  <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
    <tr>
      <td style="border-radius:12px;background:linear-gradient(135deg,#38E8FF,${BRAND.primary},${BRAND.primaryDark});">
        <a href="${redirectUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#080808;text-decoration:none;letter-spacing:-0.2px;">
          Reset Password →
        </a>
      </td>
    </tr>
  </table>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
    <tr>
      <td bgcolor="#fff7ed" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.55;">
          ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, ignore this email.
        </p>
      </td>
    </tr>
  </table>

  ${divider}

  <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
    If the button doesn't work, paste this link into your browser:<br>
    <a href="${redirectUrl}" style="color:${BRAND.primary};text-decoration:none;word-break:break-all;">${redirectUrl}</a>
  </p>
`);

const sendWelcomeEmail = async (to: string) => {
  try {
    return await resend.emails.send({
      from: 'Spendly AI <noreply@spendly-ai.com>',
      to,
      subject: 'Welcome to Spendly AI 🎉',
      html: welcomeEmailHtml(),
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

const sendResetPasswordEmail = async (to: string, redirectUrl: string) => {
  try {
    return await resend.emails.send({
      from: 'Spendly AI <noreply@spendly-ai.com>',
      to,
      subject: 'Reset your Spendly AI password',
      html: resetPasswordEmailHtml(redirectUrl),
    });
  } catch (error) {
    console.error('Failed to send reset password email:', error);
  }
};

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    return await resend.emails.send({
      from: 'Spendly AI <noreply@spendly-ai.com>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

export const emailService = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendEmail,
};
