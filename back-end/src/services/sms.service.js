import twilio from "twilio";
import { env } from "../config/env.js";

let client = null;

export function isTwilioConfigured() {
  return Boolean(
    env.twilioSid?.startsWith("AC") &&
      env.twilioAuthToken &&
      env.twilioAuthToken !== "xxxxxxxx" &&
      env.twilioPhone
  );
}

function getClient() {
  if (!isTwilioConfigured()) {
    throw new Error("Twilio non configuré");
  }
  if (!client) {
    client = twilio(env.twilioSid, env.twilioAuthToken);
  }
  return client;
}

export function normalizePhoneNumber(phone) {
  const raw = String(phone || "")
    .trim()
    .replace(/[\s().-]/g, "");

  if (!raw) {
    throw new Error("Numéro de téléphone invalide");
  }

  if (raw.startsWith("+")) {
    return raw;
  }

  if (raw.startsWith("00")) {
    return `+${raw.slice(2)}`;
  }

  if (raw.startsWith("243")) {
    return `+${raw}`;
  }

  if (raw.startsWith("0")) {
    return `+243${raw.slice(1)}`;
  }

  return `+${raw}`;
}

export async function sendSMS(to, message) {
  const normalizedTo = normalizePhoneNumber(to);

  return getClient().messages.create({
    body: message,
    from: env.twilioPhone,
    to: normalizedTo
  });
}
