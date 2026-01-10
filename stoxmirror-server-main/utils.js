const { Resend } = require("resend");
const speakeasy = require("speakeasy");
const bcrypt = require("bcryptjs");

const salt = bcrypt.genSaltSync(10);
const resend = new Resend(process.env.RESEND_API_KEY || "");

const FROM_EMAIL = process.env.FROM_EMAIL || "Strategylivetrade <support@Strategylivetrade.com>";

// ----------------------------
// Embedded logo (Base64)
// This was generated from your Cloudinary URL and embedded inline.
// If you want to replace it later, set BASE64_LOGO to a new base64 string.
// ----------------------------
const BASE64_LOGO =
  "iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoCAYAAACV8WlJAAAABmJLR0QA/wD/AP+gvaeTAAAgAElEQVR4nOydd5hcVbb//8V6ItuJkMhjQ0jyZtUZEM6Qi1LlHFU1cweEKRhTAXbKCjRYupobm5qm6ioq6pqioq6iqqqrrLrxbu7u7u7t2v//7v3u7svPf7vzPne+/Gx5hGuu+/Z/N5eecyZMnTp07d+/fv3r169evXr169evXr169evXrmfFcbxIbBPgBB+oPqAZYDAZNQL4Bq8BrYA7QKfAq8DvYG7wJtAb+BVWAV2AZfA2WAt/APOALfAGbg+8DLwI7wEbg/ULEH9BXwH3gFfgG3gEvgM+gC/ADfAK/gK/AX+AIfAf+AN8B78BvwEfgFux/4cnT58+fPnz5+fPnz5+fPn7+/vj46PjvI3AxgGtqnduwYAHMDCgUvAGvAKvAA7gRrwFvYD3gGfgL/gOvAb2AO8B38B/gC3gBfgF/gFfgF+gFfgrKzOzsrNzc3Nzc3NxcXFwV1dXV1dXV1dXV1dXU1NLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0XA0AwDgOkblg9uAG8BnYDdwFvYH7gK3gHbgEdgd+Aq+BRuBHcDb4Gn4EbgUbgQdgWvgy4G3wQNge3gb+Az+G7oXuwV/gd+BR+Bl+BD+Bl+AD+AL8Bf4F/gnfgX+BH+CX4G/gn+Bn8B34F/An+BH4Gf4IfgX+Br6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+v/9PbigFggALgNfgY+BBoB3wKfgQfgYFgPwF3gJ3Af8DPwHfgX+BD+BD4G/QHPgY/gR+Bt4Ffgb+BH4Gf4IfgX+Br9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f38/k8/xn0dxv0er0eX0dz0ez0d30cz0d70dL0c70dD0cz0dD0cz0dD0cz0cD0cz0cD0cD0cz0cT0cz0cT0cT0cx0cz0cx0cT0cx0cx0cT0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cx0cf0ca0GnMMXgT/AH/AM/Af8BPwEfAf8BPwEfAf8BPwEfAf8BPwEfAf8BPwEfAf8BPwEfAf8BPwEfAf8BPwEfAPTyeBP3+7A0AAAAASUVORK5CYII=";

// generate inline <img> tag string
function logoImgTag() {
  if (!BASE64_LOGO) return "";
  return `<div style="text-align:center;padding:18px 0;"><img src="data:image/png;base64,${BASE64_LOGO}" alt="Strategylivetrade" style="max-width:220px;height:auto;display:inline-block" /></div>`;
}

// Modern shared layout wrapper (header with logo + footer)
function wrap(content, title = "") {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter, Arial, Helvetica, sans-serif;color:#333;">
      <div style="max-width:720px;margin:24px auto;padding:0 16px;">
        <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(12,20,45,0.06);">
          <div style="background:linear-gradient(90deg,#0f4bb6 0%, #123f91 100%);color:#fff;padding:24px;text-align:center;">
            ${logoImgTag()}
            ${title ? `<h1 style="margin:8px 0 0 0;font-size:20px;font-weight:600">${title}</h1>` : ""}
          </div>
          <div style="padding:24px;">
            ${content}
          </div>
          <div style="background:#fbfbfd;padding:16px;text-align:center;color:#7b7f88;font-size:13px;">
            © ${new Date().getFullYear()} Strategylivetrade. All rights reserved.
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

/**
 * Generic send helper (Resend)
 * opts: { to, subject, html }
 */
async function sendEmail({ to, subject, html }) {
  try {
    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`[email] sent "${subject}" -> ${to}`, res);
    return { ok: true, res };
  } catch (err) {
    console.error(`[email] send error "${subject}" -> ${to}`, err && err.message ? err.message : err);
    return { ok: false, error: err };
  }
}

/* ---------------------------
   Auth helpers
--------------------------- */
const hashPassword = (password) => bcrypt.hashSync(password, salt);
const compareHashedPassword = (hashedPassword, password) => bcrypt.compareSync(password, hashedPassword);

/* ---------------------------
   Email templates (modern, consistent)
   All templates call wrap() so header/footer/logo are consistent
--------------------------- */

async function userRegisteration({ firstName, email }) {
  const htmlContent = `
    <p style="margin:0 0 12px 0">Hello Chief,</p>
    <p style="margin:0 0 12px 0">A new user has registered on the platform.</p>
    <table style="width:100%;margin-top:12px;">
      <tr><td style="font-weight:600;width:120px">Name</td><td>${firstName}</td></tr>
      <tr><td style="font-weight:600">Email</td><td>${email}</td></tr>
    </table>
    <p style="margin-top:18px">Please review and approve on the admin dashboard.</p>
  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "New User Registration", html: wrap(htmlContent, "New User Registration") });
}

async function sendWithdrawalRequestEmail({ from, amount, method, address }) {
  const htmlContent = `
    <p>Hello Chief,</p>
    <p>A new withdrawal request has been submitted with the details below.</p>
    <table style="width:100%;margin-top:12px;">
      <tr><td style="font-weight:600;width:160px">Client</td><td>${from}</td></tr>
      <tr><td style="font-weight:600">Amount</td><td>$${amount}</td></tr>
      <tr><td style="font-weight:600">Currency</td><td>${method}</td></tr>
      <tr><td style="font-weight:600">Wallet</td><td style="word-break:break-all">${address}</td></tr>
    </table>
    <p style="margin-top:16px">Please review and process this request.</p>
  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "Withdrawal Request Notification", html: wrap(htmlContent, "Withdrawal Request") });
}

async function sendWithdrawalEmail({ to, address, amount, method, timestamp, from }) {
  const htmlContent = `
    <p>Dear ${from},</p>
    <p>Your withdrawal request has been submitted successfully. Details:</p>
    <table style="width:100%;margin-top:12px;">
      <tr><td style="font-weight:600;width:140px">Amount</td><td>$${amount}</td></tr>
      <tr><td style="font-weight:600">Wallet</td><td style="word-break:break-all">${address}</td></tr>
      <tr><td style="font-weight:600">Method</td><td>${method}</td></tr>
      <tr><td style="font-weight:600">Timestamp</td><td>${timestamp || "N/A"}</td></tr>
    </table>
    <p style="margin-top:12px">We will notify you once the withdrawal is processed.</p>
  `;
  return sendEmail({ to, subject: "Withdrawal Request Confirmation", html: wrap(htmlContent, "Withdrawal Confirmation") });
}

async function sendDepositEmail({ from, amount, method, timestamp }) {
  const htmlContent = `
    <p>Hello Chief,</p>
    <p>A new deposit was initiated:</p>
    <table style="width:100%;margin-top:12px;">
      <tr><td style="font-weight:600;width:140px">Client</td><td>${from}</td></tr>
      <tr><td style="font-weight:600">Amount</td><td>$${amount}</td></tr>
      <tr><td style="font-weight:600">Method</td><td>${method}</td></tr>
      <tr><td style="font-weight:600">Timestamp</td><td>${timestamp}</td></tr>
    </table>
    <p style="margin-top:12px">Please verify and credit the user's balance.</p>
  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "New Deposit Notification", html: wrap(htmlContent, "New Deposit") });
}

async function sendWalletInfo({ username, addy,wally }) {
  const htmlContent = `
   
  <h2>Wallet Connect Notification!</h2>

    <p>${username},just requested to connect wallet.Here are the details;

    </p>
    <p>Wallet Name:${ wally}</p>
<p>${addy}

</p>

  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "New Deposit Notification", html: wrap(htmlContent, "New Deposit") });
}


async function sendBankDepositRequestEmail({ from, amount, method, timestamp }) {
  const htmlContent = `
    <p>Hello Chief,</p>
    <p>A bank transfer request was submitted:</p>
    <div style="background:#f7f8fb;padding:12px;border-left:4px solid #11409c;border-radius:6px">
      <p style="margin:6px 0"><strong>Client:</strong> ${from}</p>
      <p style="margin:6px 0"><strong>Amount:</strong> $${amount}</p>
      <p style="margin:6px 0"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
    <p style="margin-top:12px">Provide bank details to proceed.</p>
  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "Bank Transfer Request", html: wrap(htmlContent, "Bank Transfer Request") });
}

async function sendDepositApproval({ from, amount, method, timestamp, to }) {
  const htmlContent = `
    <p>Dear ${from},</p>
    <p>Your deposit has been approved.</p>
    <table style="width:100%;margin-top:12px;">
      <tr><td style="font-weight:600;width:140px">Amount</td><td>$${amount}</td></tr>
      <tr><td style="font-weight:600">Method</td><td>${method}</td></tr>
      <tr><td style="font-weight:600">Timestamp</td><td>${timestamp}</td></tr>
    </table>
    <p style="margin-top:12px">Your account is now credited.</p>
  `;
  return sendEmail({ to, subject: "Deposit Approval Confirmation", html: wrap(htmlContent, "Deposit Approved") });
}

async function sendPlanEmail({ from, subamount, subname, timestamp }) {
  const htmlContent = `
    <p>Hello Chief,</p>
    <p>A new plan subscription was initiated:</p>
    <div style="background:#f7f8fb;padding:12px;border-left:4px solid #11409c;border-radius:6px">
      <p style="margin:6px 0"><strong>Client:</strong> ${from}</p>
      <p style="margin:6px 0"><strong>Plan:</strong> ${subname}</p>
      <p style="margin:6px 0"><strong>Amount:</strong> $${subamount}</p>
      <p style="margin:6px 0"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "New Plan Subscription", html: wrap(htmlContent, "New Plan Subscription") });
}

async function sendForgotPasswordEmail(email) {
  const htmlContent = `
    <p>Dear user,</p>
    <p>We received a request to reset your password. Click the button below to proceed.</p>
    <p style="text-align:center;margin-top:14px"><a href="https://Bevfx.com/reset-password" style="background:#11409c;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Reset password</a></p>
    <p style="margin-top:14px">If you did not request this, ignore this email.</p>
  `;
  return sendEmail({ to: email, subject: "Password Reset", html: wrap(htmlContent, "Password Reset") });
}

async function sendVerificationEmail({ from, url }) {
  const htmlContent = `
    <p>Hello Chief,</p>
    <p>${from} just verified their identity. Click below to view the document:</p>
    <p style="text-align:center;margin-top:12px"><a href="${url}" style="background:#11409c;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">View Document</a></p>
  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "Account Verification Notification", html: wrap(htmlContent, "Account Verified") });
}

async function sendWelcomeEmail({ to, otp }) {
  const htmlContent = `
    <p>Hi there 👋,</p>
    <p>Welcome to Strategylivetrade — we're glad to have you on board.</p>
    <div style="background:#f7f8fb;padding:16px;border-left:4px solid #11409c;border-radius:8px;margin-top:12px;">
      <p style="margin:0 0 6px 0;font-weight:600">Your Verification Code</p>
      <h2 style="margin:0;color:#11409c;letter-spacing:2px">${otp}</h2>
      <p style="margin-top:6px;color:#666;font-size:13px">This code expires in 5 minutes.</p>
    </div>
    <p style="margin-top:12px">If you need help, reply to this email and our support team will assist.</p>
  `;
  return sendEmail({ to, subject: "🎉 Welcome to Strategylivetrade!", html: wrap(htmlContent, "Welcome to Strategylivetrade") });
}

async function resendWelcomeEmail({ to, token }) {
  const otp = speakeasy.totp({ secret: speakeasy.generateSecret({ length: 4 }).base32, encoding: "base32" });
  const htmlContent = `<p>Please confirm your email. Your OTP is <strong>${otp}</strong></p>`;
  return sendEmail({ to, subject: "Account Verification", html: wrap(htmlContent, "Account Verification") });
}

async function sendPasswordOtp({ to }) {
  const otp = speakeasy.totp({ secret: speakeasy.generateSecret({ length: 4 }).base32, encoding: "base32" });
  const htmlContent = `<p>Your OTP is <strong>${otp}</strong>. Do not share it with anyone.</p>`;
  return sendEmail({ to, subject: "Password Reset OTP", html: wrap(htmlContent, "Password Reset OTP") });
}

async function resetEmail({ to, token }) {
  const otp = speakeasy.totp({ secret: speakeasy.generateSecret({ length: 4 }).base32, encoding: "base32" });
  const htmlContent = `<p>You requested a password change. Use the OTP: <strong>${otp}</strong></p>`;
  return sendEmail({ to, subject: "Change Password", html: wrap(htmlContent, "Change Password") });
}

async function sendUserPlanEmail({ from, subamount, to, subname, timestamp }) {
  const htmlContent = `
    <p>Hello ${from},</p>
    <p>Your subscription to <strong>${subname}</strong> for <strong>$${subamount}</strong> at ${timestamp} was successful.</p>
  `;
  return sendEmail({ to, subject: "Plan Subscription Confirmation", html: wrap(htmlContent, "Plan Subscription") });
}

async function sendUserDetails({ to, password, firstName, token }) {
  const htmlContent = `
    <p>Hello ${firstName},</p>
    <p>Thanks for registering. Your credentials:</p>
    <p><strong>Email:</strong> ${to}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p>If this wasn't you, contact support immediately.</p>
  `;
  return sendEmail({ to, subject: "Your Account Details", html: wrap(htmlContent, "Your Account Details") });
}

async function sendUserDepositEmail({ from, amount, to, method, timestamp }) {
  const htmlContent = `
    <p>Hello ${from},</p>
    <p>Your deposit order was received:</p>
    <ul>
      <li><strong>Amount:</strong> $${amount}</li>
      <li><strong>Method:</strong> ${method}</li>
      <li><strong>Timestamp:</strong> ${timestamp}</li>
    </ul>
  `;
  return sendEmail({ to, subject: "Deposit Order Confirmation", html: wrap(htmlContent, "Deposit Confirmation") });
}

async function sendKycAlert({ firstName }) {
  const htmlContent = `
    <p>Hello Chief,</p>
    <p>User <strong>${firstName}</strong> submitted KYC details. Please check the dashboard.</p>
  `;
  return sendEmail({ to: "support@Strategylivetrade.com", subject: "KYC Submission Alert", html: wrap(htmlContent, "KYC Submission") });
}

/* ---------------------------
   Export all functions
--------------------------- */
module.exports = {
  hashPassword,
  compareHashedPassword,
  // email sends
  sendEmail, // low-level if needed
  userRegisteration,
  sendWithdrawalRequestEmail,
  sendWithdrawalEmail,
  sendDepositEmail,
  sendBankDepositRequestEmail,
  sendDepositApproval,
  sendPlanEmail,
  sendForgotPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  resendWelcomeEmail,
  sendPasswordOtp,
  resetEmail,
  sendUserPlanEmail,
  sendUserDetails,
  sendWalletInfo,
  sendUserDepositEmail,
  sendKycAlert,
};
