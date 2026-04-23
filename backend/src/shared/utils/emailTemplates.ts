export const getVerifyEmailTemplate = (url: string) => ({
  subject: "Verify Your Email Address",
  text: `Welcome! Please verify your email address by clicking the link below:\n\n${url}\n\n.`,
  html: `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Email Address</title>
  <style>
    @media screen and (max-width: 600px) {
      .content-table { width: 100% !important; padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f3f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f3f8; padding: 40px 0;">
    <tr>
      <td align="center">
        <table class="content-table" width="600" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 8px; padding: 40px; border: 1px solid #e1e4e8; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="text-align: center;">
              <h2 style="margin: 0 0 20px; color: #1e1e2d; font-size: 24px; font-weight: 700;">
                Verify Your Email
              </h2>

              <p style="font-size: 15px; line-height: 24px; color: #455056; margin: 0 0 20px;">
                Thanks for signing up! To get started, please confirm your email address by clicking the button below.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold; background-color: #2f89ff; color: #ffffff;">
                  Verify Email Address
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 15px; color: #1e1e2d; border-top: 1px solid #eee; padding-top: 20px;">
                Thanks,<br />
                <strong>The Company Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
});

export const getSecurityAlertTemplate = ({
  email,
  title,
  action,
  ip,
  userAgent,
  resetPasswordUrl,
}: {
  email: string;
  title: string;
  action: string;
  ip?: string;
  userAgent?: string;
  resetPasswordUrl?: string;
}) => ({
  subject: title || "Security Alert",

  text: `
Security Alert: ${title}

We're verifying a recent activity for your account: ${email}

Activity Details:
- Action: ${action}
- Device: ${userAgent || "Unknown Device"}
- IP Address: ${ip || "Unavailable"}

If you believe this activity is suspicious, please reset your password immediately:
${resetPasswordUrl ? resetPasswordUrl : ""}

If this was you, please disregard this notice. This can happen when using incognito mode or clearing cookies.

Thanks,
The Company Team
`,

  html: `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @media screen and (max-width: 600px) {
      .content-table { width: 100% !important; padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f3f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f3f8; padding: 40px 0;">
    <tr>
      <td align="center">
        <table class="content-table" width="600" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 8px; padding: 40px; border: 1px solid #e1e4e8; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <h2 style="margin: 0 0 20px; color: #1e1e2d; font-size: 24px; font-weight: 700;">
                ${title}
              </h2>

              <p style="font-size: 15px; line-height: 24px; color: #455056; margin: 0 0 20px;">
                We're verifying a recent activity for your account: 
                <strong style="color: #1e1e2d;">${email}</strong>
              </p>

              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <p style="font-size: 14px; color: #455056; margin: 0 0 10px;">
                  <strong style="color: #1e1e2d;">Activity:</strong> ${action}
                </p>
                <p style="font-size: 14px; color: #455056; margin: 0 0 10px;">
                  <strong style="color: #1e1e2d;">Device:</strong> ${userAgent || "Unknown Device"}
                </p>
                <p style="font-size: 14px; color: #455056; margin: 0;">
                  <strong style="color: #1e1e2d;">IP Address:</strong> ${ip || "Unavailable"}
                </p>
              </div>

              <p style="font-size: 15px; line-height: 24px; color: #455056; margin-bottom: 20px;">
                If you don't recognize this activity, please secure your account immediately.
              </p>

              ${
                resetPasswordUrl
                  ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetPasswordUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold; background-color: #2f89ff; color: #ffffff;">
                  Reset Your Password
                </a>
              </div>
              `
                  : ""
              }

              <p style="font-size: 14px; line-height: 22px; color: #718096; margin-top: 20px; font-style: italic;">
                If this was you, you can safely disregard this notice. This often happens when using Incognito mode or clearing cookies.
              </p>

              <p style="margin-top: 30px; font-size: 15px; color: #1e1e2d; border-top: 1px solid #eee; padding-top: 20px;">
                Thanks,<br />
                <strong>The Company Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
});
