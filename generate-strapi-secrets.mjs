// generate-strapi-secrets.mjs
import crypto from "crypto";

const random = (length = 64) =>
  crypto.randomBytes(length).toString("base64").slice(0, length);

console.log("APP_KEYS=", Array(4).fill(0).map(() => random(32)).join(","));
console.log("API_TOKEN_SALT=", random(32));
console.log("ADMIN_JWT_SECRET=", random(64));
console.log("JWT_SECRET=", random(64));
console.log("TRANSFER_TOKEN_SALT=", random(32));
