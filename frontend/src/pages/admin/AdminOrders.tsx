import React, { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Package, ChevronDown } from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "#fef3c7", color: "#92400e" },
  paid:      { bg: "#dcfce7", color: "#166534" },
  shipped:   { bg: "#dbeafe", color: "#1e40af" },
  delivered: { bg: "#f3e8ff", color: "#6b21a8" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const { toast } = useToast();

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api<any[]>("/api/admin/orders");
      setOrders(data);
    } catch (err: any) {
      toast({ title: "Error loading orders", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api(`/api/admin/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast({ title: "Status updated ✅", description: `Order set to ${status.toUpperCase()}` });
      loadOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 32px" }}>
        <p style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Admin Panel</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>Customer Orders</h1>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading orders...</div>
        )}

        {!loading && orders.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <Package size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
            <p style={{ color: "#6b7280", fontSize: 16 }}>No orders yet.</p>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Orders will appear here once customers start buying.</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => {
              const statusStyle = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
              return (
                <div key={o.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    {/* Left: Customer info */}
                    <div>
                      <p style={{ fontWeight: 700, color: "#111", fontSize: 15 }}>{o.full_name || "Customer"}</p>
                      <p style={{ color: "#6b7280", fontSize: 13 }}>{o.email}</p>
                      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                        #{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>

                    {/* Right: Status + amount */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#111" }}>
                        ${((o.total_cents || 0) / 100).toFixed(2)}
                      </span>
                      
                      {/* Status dropdown */}
                      <div style={{ position: "relative" }}>
                        <select
                          value={o.status}
                          onChange={e => updateStatus(o.id, e.target.value)}
                          style={{
                            appearance: "none", padding: "6px 28px 6px 12px",
                            borderRadius: 8, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 700,
                            background: statusStyle.bg, color: statusStyle.color,
                            outline: "none"
                          }}
                        >
                          <option value="pending">PENDING</option>
                          <option value="paid">PAID</option>
                          <option value="shipped">SHIPPED</option>
                          <option value="delivered">DELIVERED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                        <ChevronDown size={14} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: statusStyle.color }} />
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Items</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {o.items.map((item: any, idx: number) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "#374151" }}>{item.name} <span style={{ color: "#9ca3af" }}>× {item.quantity}</span></span>
                            <span style={{ fontFamily: "monospace", color: "#6b7280" }}>${((item.price_cents * item.quantity) / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
