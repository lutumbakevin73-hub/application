import twilio from "twilio";
import { env } from "../config/env.js";

let client = null;

const PLACEHOLDER_TOKENS = new Set([
  "xxxxxxxx",
  "your_auth_token",
  "your_twilio_auth_token",
  "placeholder"
]);

function isPlaceholder(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || PLACEHOLDER_TOKENS.has(normalized);
}

function normalizeE164(phone, { defaultCountry = "243" } = {}) {
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

  if (raw.startsWith(defaultCountry)) {
    return `+${raw}`;
  }

  if (raw.startsWith("0")) {
    return `+${defaultCountry}${raw.slice(1)}`;
  }

  return `+${raw}`;
}

export function getTwilioStatus() {
  const issues = [];

  if (!env.twilioSid?.startsWith("AC")) {
    issues.push("TWILIO_SID manquant ou invalide (doit commencer par AC...)");
  }

  if (isPlaceholder(env.twilioAuthToken)) {
    issues.push("TWILIO_AUTH_TOKEN manquant ou placeholder");
  }

  if (!env.twilioPhone?.trim()) {
    issues.push("TWILIO_PHONE manquant");
  } else {
    try {
      const from = normalizeE164(env.twilioPhone);
      if (!/^\+\d{8,15}$/.test(from)) {
        issues.push(`TWILIO_PHONE invalide (${from}) — format E.164 requis, ex: +14155552671`);
      }
    } catch (err) {
      issues.push(err.message);
    }
  }

  return {
    configured: issues.length === 0,
    issues
  };
}

export function isTwilioConfigured() {
  return getTwilioStatus().configured;
}

function getClient() {
  const status = getTwilioStatus();
  if (!status.configured) {
    throw new Error(
      `Twilio non configuré — ${status.issues.join(" ; ")}`
    );
  }

  if (!client) {
    client = twilio(env.twilioSid, env.twilioAuthToken);
  }

  return client;
}

export function normalizePhoneNumber(phone) {
  const normalized = normalizeE164(phone);

  if (!/^\+\d{8,15}$/.test(normalized)) {
    throw new Error(
      `Numéro invalide (${normalized}). Utilisez le format international, ex: +243854721056 ou 0854721056`
    );
  }

  return normalized;
}

function twilioErrorHint(err) {
  const code = err?.code || err?.status;
  const message = String(err?.message || "");

  if (code === 21608 || /not verified/i.test(message)) {
    return " Compte Twilio trial : ajoutez et vérifiez le numéro destinataire dans la console Twilio.";
  }

  if (code === 21211 || /invalid.*to/i.test(message)) {
    return " Numéro destinataire invalide — format E.164 requis (ex: +243854721056).";
  }

  if (code === 21212 || /invalid.*from/i.test(message)) {
    return " TWILIO_PHONE invalide — utilisez votre numéro Twilio au format E.164 (ex: +14155552671).";
  }

  if (code === 20003 || /authenticate/i.test(message)) {
    return " Identifiants Twilio incorrects — vérifiez TWILIO_SID et TWILIO_AUTH_TOKEN.";
  }

  if (code === 21606 || /cannot be a landline/i.test(message)) {
    return " Le numéro destinataire doit être un mobile capable de recevoir des SMS.";
  }

  return "";
}

export async function sendSMS(to, message) {
  const normalizedTo = normalizePhoneNumber(to);
  const from = normalizeE164(env.twilioPhone);

  try {
    const result = await getClient().messages.create({
      body: message,
      from,
      to: normalizedTo
    });

    console.log(`SMS envoyé → ${normalizedTo} (sid: ${result.sid})`);
    return result;
  } catch (err) {
    const code = err?.code || err?.status || "erreur";
    const hint = twilioErrorHint(err);
    const error = new Error(`Twilio [${code}] : ${err?.message || String(err)}${hint}`);
    error.code = code;
    throw error;
  }
}
