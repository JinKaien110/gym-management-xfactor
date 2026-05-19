
import crypto from "crypto";

export function generateRandomPassword(length = 16) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  
  const randomBytes = crypto.randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}