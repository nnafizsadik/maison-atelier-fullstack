import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set up image upload storage — saves to /public/uploads/
const uploadsDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

export const productsRouter = Router();

/**
 * PUBLIC: Get all products
 */
productsRouter.get("/products", async (_req, res) => {
  const { rows } = await query(
    `SELECT id, slug, name, description, price_cents, currency, image_url, category, in_stock
     FROM products ORDER BY created_at ASC`,
  );
  res.json(rows);
});

/**
 * PUBLIC: Get single product
 */
productsRouter.get("/products/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { rows } = await query(
    `SELECT id, slug, name, description, price_cents, currency, image_url, category, in_stock
     FROM products WHERE ${isUuid ? "id" : "slug"} = $1`,
    [idOrSlug],
  );
  if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
  res.json(rows[0]);
});

/**
 * ADMIN: Upload product image
 * POST /admin/upload-image
 */
productsRouter.post("/admin/upload-image", requireAuth, requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  // Return the public URL
  const host = req.protocol + "://" + req.get("host");
  const imageUrl = `${host}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

/**
 * ADMIN: Create Product
 */
productsRouter.post("/products", requireAuth, requireAdmin, async (req, res) => {
  const { slug, name, description, price_cents, image_url, category } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO products (slug, name, description, price_cents, image_url, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [slug, name, description, price_cents, image_url, category]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

/**
 * ADMIN: Update Product
 */
productsRouter.put("/products/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price_cents, image_url, category, in_stock } = req.body;
  try {
    const { rows } = await query(
      `UPDATE products 
       SET name=$1, description=$2, price_cents=$3, image_url=$4, category=$5, in_stock=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, description, price_cents, image_url, category, in_stock, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

/**
 * ADMIN: Delete Product
 */
productsRouter.delete("/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await query("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});
