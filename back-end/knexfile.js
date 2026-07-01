import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isMysql = process.env.DB_CLIENT === "mysql2";

const config = {
  client: isMysql ? "mysql2" : "better-sqlite3",
  connection: isMysql
    ? {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "learning_app"
      }
    : {
        filename:
          process.env.DB_SQLITE_PATH ||
          path.join(__dirname, "data", "udbl.db")
      },
  useNullAsDefault: !isMysql,
  migrations: {
    directory: "./src/db/migrations",
    extension: "js"
  }
};

export default config;
