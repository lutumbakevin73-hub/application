import twilio from "twilio";

let client = null;

function getClient() {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid?.startsWith("AC") || !token || token === "xxxxxxxx") {
    throw new Error("Twilio non configuré");
  }

  if (!client) {
    client = twilio(sid, token);
  }

  return client;
}

export async function sendSMS(to, message) {
  return await getClient().messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to
  });
}
