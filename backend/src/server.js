import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { meRouter } from "./routes/me.js";
import { productsRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { authRouter } from "./routes/auth.js";
import { query } from "./db/pool.js";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

// Basic security headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Required to serve images across origins

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin))
        return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(morgan("tiny"));

// Serve uploaded product images statically
app.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Only expose this debug endpoint in development
if (process.env.NODE_ENV !== "production") {
  app.get("/db-test", async (_req, res) => {
    try {
      const result = await query("SELECT NOW() as now, version()");
      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}

app.use("/api/auth", authRouter);
app.use("/api", meRouter);
app.use("/api", productsRouter);
app.use("/api", cartRouter);
app.use("/api", ordersRouter);
app.use("/api", paymentsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`▸ Maison Atelier API listening on :${port}`);
});
