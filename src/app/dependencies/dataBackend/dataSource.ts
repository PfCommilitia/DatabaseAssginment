import { config } from "dotenv";
import { Pool } from "pg";

config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT || "5432")
});

export async function connect() {
  return pool.connect();
}
