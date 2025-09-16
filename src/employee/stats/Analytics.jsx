import React, { useState, useEffect } from "react";
import { useGetUserLeadsStatsQuery } from "../../features/api/apiSlice";
import {
  FiUsers,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiBarChart2,
  FiDollarSign,
  FiCheckCircle
} from "react-icons/fi";
import { motion } from "framer-motion";

// ====== Light Theme Palette ======
const COLORS = {
  primary: "#2563eb",
  success: "#16a34a",
  warning: "#f59e0b",
  danger:  "#dc2626",
  purple: "#7c3aed",
  cyan:   "#0891b2",

  // Light backgrounds
  bgPrimary:  "#ffffff",
  bgSecondary:"#f8fafc",
  bgCard:     "#ffffff",

  textPrimary:   "#1e293b",
  textSecondary: "#475569",
  border:        "#e2e8f0",

  gradientPrimary: "linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)",
  gradientSuccess: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
  gradientWarning: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
  gradientPurple:  "linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)",
};

// Safe CSS var getter
const getColorVar = (varName, fallback) => {
  if (typeof window !== "undefined") {
    const computed = getComputedStyle(document.documentElement).getPropertyValue(varName);
    return computed || fallback;
  }
  return fallback;
};

const LeadStatsCard = () => {
  const [lastUpdated, setLastUpdated] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: statsData, isLoading, isError, error, refetch } =
    useGetUserLeadsStatsQuery();

  useEffect(() => {
    if (statsData) setLastUpdated(new Date().toLocaleTimeString());
  }, [statsData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const stats = statsData?.data;
  const loading = isLoading || isRefreshing;

  const statusColors = {
    "Document Upload Pending": getColorVar("--ld-warning", COLORS.warning),
    "In Process": getColorVar("--ld-primary", COLORS.primary),
    "Follow-up Needed": getColorVar("--ld-cyan", COLORS.cyan),
    "Closed": getColorVar("--ld-success", COLORS.success),
    default: getColorVar("--ld-primary", COLORS.primary),
  };

  if (loading && !stats) return <LoadingSkeleton />;

  if (isError)
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: COLORS.bgCard,
          padding: 24,
          borderRadius: 16,
          color: COLORS.danger,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <FiAlertCircle size={24} />
          <h3 style={{ margin: 0, fontSize: 18 }}>Error Loading Data</h3>
        </div>
        <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          {error?.data?.message || "Failed to fetch stats"}
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          style={{
            background: COLORS.danger,
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          <FiRefreshCw size={16} />
          Retry
        </motion.button>
      </motion.div>
    );

  if (!stats) return null;

  const conversionRate =
    stats.total_leads > 0
      ? Math.round(((stats.status_counts?.Closed || 0) / stats.total_leads) * 100)
      : 0;

  const statusDistribution = stats.status_counts
    ? Object.entries(stats.status_counts)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        color: COLORS.textPrimary,
      }}
    >
      {/* ===== Header ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Lead Analytics Dashboard
          </h3>
          <p style={{ margin: "4px 0 0", color: COLORS.textSecondary }}>
            Overview of your lead performance
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 13,
              background: COLORS.bgSecondary,
              padding: "6px 12px",
              borderRadius: 20,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
            }}
          >
            • Last updated: {lastUpdated}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              background: "none",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FiRefreshCw size={16} />
          </motion.button>
        </div>
      </div>

      {/* ===== Key Stats ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          gap: 20,
        }}
      >
        <StatCard
          icon={<FiUsers size={24} />}
          value={stats.total_leads ?? 0}
          label="Total Leads"
          color={COLORS.primary}
          background={COLORS.gradientPrimary}
        />
        <StatCard
          icon={<FiTrendingUp size={24} />}
          value={`${conversionRate}%`}
          label="Conversion Rate"
          color={COLORS.success}
          background={COLORS.gradientSuccess}
        />
        <StatCard
          icon={<FiCalendar size={24} />}
          value={stats.leads_today ?? 0}
          label="Leads Today"
          color={COLORS.warning}
          background={COLORS.gradientWarning}
        />
        <StatCard
          icon={<FiDollarSign size={24} />}
          value={stats.revenue ? `$${stats.revenue.toLocaleString()}` : "N/A"}
          label="Estimated Revenue"
          color={COLORS.purple}
          background={COLORS.gradientPurple}
        />
      </div>

      {/* ===== Status Distribution ===== */}
      <div
        style={{
          background: COLORS.bgCard,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <h4 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
          Lead Status Distribution
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 16,
          }}
        >
          {statusDistribution.map(([status, count]) => (
            <StatusItem
              key={status}
              status={status}
              count={count}
              total={stats.total_leads}
              color={statusColors[status] || statusColors.default}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ---------- Smaller components (unchanged logic, lighter styling) ---------- */

const StatCard = ({ icon, value, label, color, background }) => (
  <motion.div
    whileHover={{ y: -3 }}
    style={{
      background: background,
      borderRadius: 16,
      padding: 24,
      color: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
    </div>
    <p style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>{label}</p>
    <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{value}</h2>
  </motion.div>
);

const StatusItem = ({ status, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
      >
        <span style={{ color: COLORS.textSecondary, fontSize: 14 }}>{status}</span>
        <span style={{ color, fontWeight: 600 }}>{percentage}%</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{count}</div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
      gap: 20,
    }}
  >
    {[1, 2, 3, 4].map((key) => (
      <div
        key={key}
        style={{
          height: 160,
          background: "#f1f5f9",
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
        }}
      />
    ))}
  </div>
);

export default LeadStatsCard;
