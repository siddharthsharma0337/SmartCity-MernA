// One-off script: run this locally to generate a bcrypt hash for manual
// test user creation, since no /register route exists yet.
// Usage: node scripts/hashPassword.js
import bcrypt from 'bcrypt';

const plainPassword = 'test1234'; // change this if you want a different password
const hash = await bcrypt.hash(plainPassword, 10);
console.log('Password:', plainPassword);
console.log('Hash:', hash);