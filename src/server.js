import "./config/env.js";
import { createApp } from "./app.js";
import { serverPort } from "./config/constants.js";
import { logServerReady } from "./config/startupLog.js";

const app = createApp();
const PORT = serverPort();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`)
  logServerReady(PORT);
});
