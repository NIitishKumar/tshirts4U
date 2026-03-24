import "./config/env.js";
import { createApp } from "./app.js";
import { serverPort } from "./config/constants.js";
import { logServerReady } from "./config/startupLog.js";
import { connectDatabase } from "./config/database.js";

const app = createApp();
const PORT = serverPort();

try {
  await connectDatabase();
  console.log("MongoDB connected");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
  logServerReady(PORT);
});
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
}
