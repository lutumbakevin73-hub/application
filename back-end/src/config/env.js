import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  groqApiKey: process.env.GROQ_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  dbClient: process.env.DB_CLIENT || "sqlite3",
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  twilioSid: process.env.TWILIO_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhone: process.env.TWILIO_PHONE
};
