import React, { useState, useEffect, useRef } from "react";
import { useApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, ImageIcon } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  category: string;
  in_stock: boolean;
}

const emptyProduct = {
  name: "", slug: "", description: "",
  price_cents: 0, image_url: "", category: "Apparel", in_stock: true
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any>(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const api = useApi();
  const { toast } = useToast();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const data = await api<Product[]>("/api/products");
      setProducts(data);
    } catch { }
  };

  // Auto-generate a slug from the product name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setCurrent((p: any) => ({ ...p, name, slug }));
  };

  // Handle image file selection → upload immediately
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview instantly
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/admin/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setCurrent((p: any) => ({ ...p, image_url: url }));
      toast({ title: "Image uploaded ✅" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setPreview("");
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setCurrent(emptyProduct);
    setPreview("");
    setIsEditing(true);
  };

  const openEdit = (p: Product) => {
    setCurrent(p);
    setPreview(p.image_url || "");
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (current.id) {
        await api(`/api/products/${current.id}`, { method: "PUT", body: JSON.stringify(current) });
        toast({ title: "Product updated ✅" });
      } else {
        await api("/api/products", { method: "POST", body: JSON.stringify(current) });
        toast({ title: "Product created ✅" });
      }
      setIsEditing(false);
      loadProducts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      loadProducts();
      toast({ title: "Product deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Admin Panel</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>Product Manager</h1>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 8, background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Product Form Modal */}
        {isEditing && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{current.id ? "Edit Product" : "New Product"}</h2>
                <button onClick={() => setIsEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Image Upload */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Product Image</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #d1d5db", borderRadius: 12, padding: 24, textAlign: "center", cursor: "pointer",
                      background: preview ? "#f9fafb" : "#fff", transition: "border-color 0.2s",
                      position: "relative", overflow: "hidden", minHeight: 180,
                      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
                    }}
                  >
                    {preview ? (
                      <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }} />
                    ) : (
                      <>
                        <ImageIcon size={40} color="#9ca3af" />
                        <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>Click to upload image</p>
                        <p style={{ color: "#9ca3af", fontSize: 12 }}>PNG, JPG, WebP up to 5MB</p>
                      </>
                    )}
                    {uploading && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 32, height: 32, border: "3px solid #111", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  {preview && !uploading && (
                    <button type="button" onClick={() => { setPreview(""); setCurrent((p: any) => ({ ...p, image_url: "" })); }}
                      style={{ marginTop: 8, fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                      ✕ Remove image
                    </button>
                  )}
                </div>

                {/* Form fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Product Name *</label>
                    <input style={inputStyle} placeholder="e.g. Linen Tote Bag" value={current.name} onChange={e => handleNameChange(e.target.value)} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Slug (auto-generated)</label>
                    <input style={{ ...inputStyle, background: "#f9fafb", color: "#6b7280" }} value={current.slug} onChange={e => setCurrent((p: any) => ({ ...p, slug: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Price (in cents) *</label>
                    <input style={inputStyle} type="number" min={0} placeholder="e.g. 4900 = $49.00" value={current.price_cents} onChange={e => setCurrent((p: any) => ({ ...p, price_cents: parseInt(e.target.value) || 0 }))} required />
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>= ${((current.price_cents || 0) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select style={inputStyle} value={current.category} onChange={e => setCurrent((p: any) => ({ ...p, category: e.target.value }))}>
                      {["Apparel", "Accessories", "Home", "Stationery", "Other"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} placeholder="Product description..." value={current.description} onChange={e => setCurrent((p: any) => ({ ...p, description: e.target.value }))} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                  <input type="checkbox" id="in_stock" checked={current.in_stock} onChange={e => setCurrent((p: any) => ({ ...p, in_stock: e.target.checked }))} />
                  <label htmlFor="in_stock" style={{ fontSize: 14, color: "#374151" }}>In Stock</label>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button type="submit" disabled={uploading} style={{ flex: 1, background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                    {current.id ? "Save Changes" : "Create Product"}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "12px 24px", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", background: "#fff", fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No products yet. Click "Add Product" to get started.</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0 }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon size={20} color="#9ca3af" /></div>
                        }
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: "#111", fontSize: 14 }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af" }}>{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}><span style={{ background: "#f3f4f6", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>{p.category}</span></td>
                  <td style={tdStyle}><span style={{ fontFamily: "monospace", fontSize: 14 }}>${(p.price_cents / 100).toFixed(2)}</span></td>
                  <td style={tdStyle}>
                    <span style={{ background: p.in_stock ? "#dcfce7" : "#fee2e2", color: p.in_stock ? "#16a34a" : "#dc2626", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>
                      {p.in_stock ? "In Stock" : "Sold Out"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button onClick={() => openEdit(p)} style={iconBtnStyle} title="Edit"><Pencil size={16} /></button>
                    <button onClick={() => deleteProduct(p.id)} style={{ ...iconBtnStyle, color: "#ef4444" }} title="Delete"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" };
const thStyle: React.CSSProperties = { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 };
const tdStyle: React.CSSProperties = { padding: "14px 16px", fontSize: 14, color: "#374151" };
const iconBtnStyle: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "#6b7280" };

export default AdminProducts;
