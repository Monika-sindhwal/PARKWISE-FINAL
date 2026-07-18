// One-off script to create an admin account. Admins are intentionally NOT
// allowed to self-register through /api/auth/register, so use this instead.
//
// Usage:
//   node src/utils/seedAdmin.js "Admin Name" admin@example.com yourpassword
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.log('Usage: node src/utils/seedAdmin.js "Admin Name" admin@example.com yourpassword');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with email ${email} already exists (role: ${existing.role}).`);
    process.exit(0);
  }

  await User.create({ name, email, password, role: "admin" });
  console.log(`Admin created: ${email}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
