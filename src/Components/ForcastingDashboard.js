import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ForcastingDashboard() {
  const [data, setData] = useState([]);
  const [fromMonth, setFromMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 7); // YYYY-MM
  });
  const [toMonth, setToMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 7); // YYYY-MM
  });
  const [loading, setLoading] = useState(false);

  // 📊 Fetch and process forecast data
  const fetchForecastData = async (monthsBack, monthsAhead) => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:7760/forecast", {
        params: { monthsBack, monthsAhead },
      });

      const {
        pastIncome = [],
        futureIncome = [],
        pastExpenses = [],
        futureExpenses = [],
      } = res.data || {};

      const merged = {};

      pastIncome.forEach((i) => {
        if (!i.month) return;
        if (!merged[i.month]) merged[i.month] = { month: i.month };
        merged[i.month].actualIncome = i.total_income || 0;
      });

      futureIncome.forEach((i) => {
        if (!i.month) return;
        if (!merged[i.month]) merged[i.month] = { month: i.month };
        merged[i.month].expectedIncome = i.expected_income || 0;
      });

      pastExpenses.forEach((e) => {
        if (!e.month) return;
        if (!merged[e.month]) merged[e.month] = { month: e.month };
        merged[e.month].actualExpense =
          (merged[e.month].actualExpense || 0) +
          (e.total_expense || 0) +
          (e.total_salaries || 0);
      });

      futureExpenses.forEach((e) => {
        if (!e.month) return;
        if (!merged[e.month]) merged[e.month] = { month: e.month };
        merged[e.month].expectedExpense =
          (merged[e.month].expectedExpense || 0) + (e.expected_expense || 0);
      });

      const result = Object.values(merged)
        .filter((d) => d.month)
        .map((d) => ({
          month: d.month,
          income: (d.actualIncome || 0) + (d.expectedIncome || 0),
          expense: (d.actualExpense || 0) + (d.expectedExpense || 0),
          actualIncome: d.actualIncome || 0,
          expectedIncome: d.expectedIncome || 0,
          actualExpense: d.actualExpense || 0,
          expectedExpense: d.expectedExpense || 0,
          netCashFlow:
            (d.actualIncome || d.expectedIncome || 0) -
            (d.actualExpense || d.expectedExpense || 0),
        }))
        .sort((a, b) => (a.month || "").localeCompare(b.month || ""));

      setData(result);
      console.log(result)
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching forecast:", err);
      setLoading(false);
      setData([]);
    }
  };

  // 🧮 Calculate difference in months
  const calculateMonthRange = (start, end) => {
    const now = new Date();
    const startDate = new Date(`${start}-01`);
    const endDate = new Date(`${end}-01`);

    const monthsBack = Math.max(
      0,
      (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth())
    );
    const monthsAhead = Math.max(
      0,
      (endDate.getFullYear() - now.getFullYear()) * 12 +
        (endDate.getMonth() - now.getMonth())
    );

    return { monthsBack, monthsAhead };
  };

  const handleRangeChange = () => {
    const { monthsBack, monthsAhead } = calculateMonthRange(fromMonth, toMonth);
    fetchForecastData(monthsBack, monthsAhead);
  };

  useEffect(() => {
    handleRangeChange();
  }, []);

  return (
    <div
      style={{
        background: "#f9fafb",
        padding: "1rem",
        marginLeft: "10px",
        marginTop: "10px",
        width: "100%",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "1.5rem",
          color: "#1f2937",
        }}
      >
        📈 Monthly Income vs Outgoings (Expenses + Salaries)
      </h2>

      {/* 📅 Month-Year Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1.5rem",
          alignItems: "center",
          margin: "1.5rem 0",
          backgroundColor: "lightgray",
          padding: "12px",
          borderRadius: "8px",
        }}
      >
        <div>
          <label style={{ fontWeight: "500", marginRight: "6px" }}>
            From (Month-Year):
          </label>
          <input
            type="month"
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value)}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label style={{ fontWeight: "500", marginRight: "6px" }}>
            To (Month-Year):
          </label>
          <input
            type="month"
            value={toMonth}
            onChange={(e) => setToMonth(e.target.value)}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          onClick={handleRangeChange}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* 📊 Chart Display */}
     {loading ? (
  <p style={{ textAlign: "center", color: "#6b7280" }}>
    ⏳ Loading forecast data...
  </p>
) : data.length === 0 ? (
  <p style={{ textAlign: "center", color: "#9ca3af" }}>
    No data available for the selected period.
  </p>
) : (
  <div
    style={{
      width: "95%",
      height: 490,
      background: "linear-gradient(180deg, #f9fafb 0%, #eef2ff 100%)",
      borderRadius: "20px",
      padding: "2rem",
      boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      transition: "all 0.4s ease",
    }}
  >
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 30, right: 30, left: 0, bottom: 10 }}>
        {/* 🎨 Beautiful Grid */}
        <CartesianGrid strokeDasharray="3 5" stroke="#e5e7eb" />

        {/* 🧭 Modern Axes */}
        <XAxis
          dataKey="month"
          tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />

        {/* 💬 Elegant Tooltip */}
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
            border: "none",
            padding: "10px 15px",
          }}
          labelStyle={{ color: "#111827", fontWeight: "bold" }}
        />

        {/* 🧾 Refined Legend */}
        <Legend
          verticalAlign="top"
          align="center"
          iconType="circle"
          wrapperStyle={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#1f2937",
            marginBottom: "10px",
          }}
        />

        {/* 🌈 Gradient Definitions for Line Glows */}
        <defs>
          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1} />
          </linearGradient>

          <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
          </linearGradient>

          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {/* 💚 Actual Income */}
        <Line
          type="monotone"
          dataKey="actualIncome"
          stroke="url(#greenGradient)"
          strokeWidth={4}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: "#16a34a", fill: "#22c55e" }}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Actual Income"
          style={{
            filter: "drop-shadow(0px 4px 8px rgba(22, 163, 74, 0.25))",
          }}
        />

        {/* 💚 Forecasted Income (Dashed) */}
        <Line
          type="monotone"
          dataKey="expectedIncome"
          stroke="#16a34a"
          strokeWidth={3}
          strokeDasharray="6 6"
          dot={false}
          animationDuration={1000}
          name="Forecasted Income"
          style={{
            opacity: 0.8,
          }}
        />

        {/* ❤️ Actual Expenses */}
        <Line
          type="monotone"
          dataKey="actualExpense"
          stroke="url(#redGradient)"
          strokeWidth={4}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: "#ef4444", fill: "#dc2626" }}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Actual Expenses + Salaries"
          style={{
            filter: "drop-shadow(0px 4px 8px rgba(239, 68, 68, 0.25))",
          }}
        />

        {/* ❤️ Forecasted Expenses (Dashed) */}
        <Line
          type="monotone"
          dataKey="expectedExpense"
          stroke="#ef4444"
          strokeWidth={3}
          strokeDasharray="6 6"
          dot={false}
          animationDuration={1000}
          name="Forecasted Expenses + Salaries"
          style={{
            opacity: 0.8,
          }}
        />

        {/* 💜 Net Cash Flow */}
        <Line
          type="monotone"
          dataKey="netCashFlow"
          stroke="url(#purpleGradient)"
          strokeWidth={3.5}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: "#8b5cf6", fill: "#a78bfa" }}
          strokeDasharray="4 4"
          animationDuration={1300}
          animationEasing="ease-in-out"
          name="Net Cash Flow"
          style={{
            filter: "drop-shadow(0px 3px 8px rgba(139, 92, 246, 0.35))",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}

    </div>
  );
}

export default ForcastingDashboard;
