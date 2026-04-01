import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import addressRoutes from "./modules/address/address.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import virtualTryOnRoutes from "./modules/virtualTryOn/virtualTryOn.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(cors());
  app.get('/', (req, res) => {
    res.send('Hello World');
  });

  app.use(virtualTryOnRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/users", addressRoutes);
  app.use("/api/users", cartRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/auth", authRoutes);

  return app;
}
