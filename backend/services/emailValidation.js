'use strict';

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const isValidTceStudentEmail = (email) => /^[^@\s]+@student\.tce\.edu$/.test(normalizeEmail(email));

module.exports = { isValidTceStudentEmail, normalizeEmail };
