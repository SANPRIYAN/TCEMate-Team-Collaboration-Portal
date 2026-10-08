'use strict';

const nodemailer = require('nodemailer');

const mailSettings = () => ({
  host: process.env.SMTP_HOST || process.env.MAIL_HOST,
  port: Number(process.env.SMTP_PORT || process.env.MAIL_PORT),
  user: process.env.SMTP_USER || process.env.MAIL_USER,
  password: process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD,
  from: process.env.EMAIL_FROM || process.env.MAIL_FROM
});

const createTransporter = async () => {
  const settings = mailSettings();
  if (!settings.host || !settings.port || !settings.user || !settings.password || !settings.from
    || !Number.isInteger(settings.port) || settings.port < 1 || settings.port > 65535) {
    const error = new Error('Email delivery is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.password }
  });
  await transporter.verify();
  return { transporter, from: settings.from };
};

const appBaseUrl = () => {
  const value = process.env.APP_BASE_URL;
  if (!value) {
    const error = new Error('APP_BASE_URL is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }
  const url = new URL(value);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    const error = new Error('APP_BASE_URL must use HTTPS in production.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }
  return url.toString().replace(/\/+$/, '');
};

const sendPasswordResetEmail = async (email, token) => {
  const [{ transporter, from }, baseUrl] = await Promise.all([createTransporter(), appBaseUrl()]);
  const resetUrl = `${baseUrl}/reset-password.html?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset your TCEMate password',
    text: `Use this link within 15 minutes to reset your TCEMate password: ${resetUrl}`
  });
};

const emailConfigurationPresent = () => {
  const settings = mailSettings();
  return Boolean(settings.host && settings.port && settings.user && settings.password && settings.from);
};

module.exports = {
  emailConfigurationPresent,
  sendPasswordResetEmail
};
