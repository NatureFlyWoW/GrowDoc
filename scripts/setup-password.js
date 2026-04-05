#!/usr/bin/env node
// Generates TEAM_PASSWORD_HASH, TEAM_PASSWORD_SALT, and JWT_SECRET for Vercel env vars.
// Usage: node scripts/setup-password.js <your-password>

import crypto from 'crypto';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/setup-password.js <your-password>');
  console.error('');
  console.error('Example: node scripts/setup-password.js \'grow-strong-2026\'');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password should be at least 6 characters.');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 32);
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('');
console.log('Paste these into Vercel → Project Settings → Environment Variables:');
console.log('(Scope them to Production, Preview, and Development)');
console.log('');
console.log('────────────────────────────────────────────────────────────');
console.log('TEAM_PASSWORD_HASH');
console.log(hash.toString('hex'));
console.log('');
console.log('TEAM_PASSWORD_SALT');
console.log(salt.toString('hex'));
console.log('');
console.log('JWT_SECRET');
console.log(jwtSecret);
console.log('────────────────────────────────────────────────────────────');
console.log('');
console.log('Plus these three (values are specific to your GitHub setup):');
console.log('');
console.log('GITHUB_TOKEN          — a GitHub PAT with public_repo scope');
console.log('GITHUB_REPO_OWNER     — NatureFlyWoW');
console.log('GITHUB_REPO_NAME      — GrowDoc');
console.log('');
console.log(`Your team password (give this to friends): ${password}`);
console.log('');
