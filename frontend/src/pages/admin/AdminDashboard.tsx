import React from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, ArrowRight } from "lucide-react";

const AdminDashboard = () => {
  const cards = [
    {
      title: "Products",
      desc: "Add, edit, delete products and upload images",
      icon: <Package size={28} color="#6366f1" />,
      bg: "#eef2ff",
      link: "/admin/products",
      action: "Manage Products",
    },
    {
      title: "Orders",
      desc: "View all customer orders and update their status",
      icon: <ShoppingBag size={28} color="#0ea5e9" />,
      bg: "#e0f2fe",
      link: "/admin/orders",
      action: "View Orders",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "24px 32px" }}>
        <p style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Admin Panel</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>Welcome back 👑</h1>
        <p style={{ color: "#6b7280", marginTop: 4, fontSize: 14 }}>You are the only one who can see this page.</p>
      </div>

      <div style={{ padding: "32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {cards.map((card) => (
          <Link key={card.title} to={card.link} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
              padding: 28, transition: "all 0.2s", cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 16
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{ width: 56, height: 56, background: card.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {card.icon}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 6 }}>{card.title}</h2>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>{card.desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#111", fontSize: 14, fontWeight: 600, marginTop: "auto" }}>
                {card.action} <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
