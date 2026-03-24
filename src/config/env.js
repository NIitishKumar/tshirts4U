import path from "node:path";
import { config as loadEnv } from "dotenv";

const root = process.cwd();

loadEnv({ path: path.join(root, "api-server", ".env") });
loadEnv({ path: path.join(root, ".env") });

export { root };
