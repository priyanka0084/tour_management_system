const bcrypt = require("bcrypt");


async function hashPasswords() {
  const admins = [
    { email: "Ilakiyaa@journeyhub.com", password: "ilakiyaa@123" },
    { email: "Priyanka@journeyhub.com", password: "priyanka@123" },
    { email: "Padmapriya@journeyhub.com", password: "padma@123" }
  ];


  for (const admin of admins) {
    const hashed = await bcrypt.hash(admin.password, 10);
    console.log(
      `UPDATE users SET role='admin', password='${hashed}' WHERE email='${admin.email}';`
    );
  }
}
hashPasswords();
