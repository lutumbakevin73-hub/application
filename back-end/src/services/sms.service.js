import twilio from "twilio";
import { env } from "../config/env.js";

let client = null;

function getClient() {
  if (!env.twilioSid?.startsWith("AC") || !env.twilioAuthToken || env.twilioAuthToken === "xxxxxxxx") {
    throw new Error("Twilio non configuré");
  }
  if (!client) {
    client = twilio(env.twilioSid, env.twilioAuthToken);
  }
  return client;
}

export async function sendSMS(to, message) {
  return getClient().messages.create({
    body: message,
    from: env.twilioPhone,
    to
  });
}
