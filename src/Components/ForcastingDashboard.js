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
  const [monthsBack, setMonthsBack] = useState(6);
  const [monthsAhead, setMonthsAhead] = useState(6);
  const [loading, setLoading] = useState(false);

  // 📊 Fetch and process forecast data from backend (includes salaries)
  const fetchForecastData = async (back = monthsBack, ahead = monthsAhead) => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:7760/forecast", {
        params: { monthsBack: back, monthsAhead: ahead },
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
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching forecast:", err);
      setLoading(false);
      setData([]);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, []);

  // 🔁 Refresh chart whenever range changes
  const handleRangeChange = () => {
    fetchForecastData(monthsBack, monthsAhead);
  };

  return (
    <div
      style={{
        background: "#f9fafb",
        padding: "2rem",
        marginLeft: "10px",
        marginTop: "30px",
        width:"1000px"
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

      {/* 🔧 Filters Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          alignItems: "center",
          margin: "1.5rem 0",
          backgroundColor:"lightgray",
          padding:"7px",
          borderRadius:"8px"
        }}
      >
        <div>
          <label style={{ fontWeight: "500" }}>Months Back: </label>
          <input
            type="number"
            min="0"
            max="36"
            value={monthsBack}
            onChange={(e) => setMonthsBack(parseInt(e.target.value))}
            style={{
              padding: "6px",
              width: "80px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label style={{ fontWeight: "500" }}>Months Ahead: </label>
          <input
            type="number"
            min="0"
            max="36"
            value={monthsAhead}
            onChange={(e) => setMonthsAhead(parseInt(e.target.value))}
            style={{
              padding: "6px",
              width: "80px",
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
            height: 450,
            background: "rgba(160, 225, 252, 0.58)",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />

              {/* ✅ Actual Income */}
              <Line
                type="monotone"
                dataKey="actualIncome"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Actual Income"
              />

              {/* ✅ Forecasted Income */}
              <Line
                type="monotone"
                dataKey="expectedIncome"
                stroke="#22c55e"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="Forecasted Income"
              />

              {/* ✅ Actual Expenses + Salaries */}
              <Line
                type="monotone"
                dataKey="actualExpense"
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Actual Expenses + Salaries"
              />

              {/* ✅ Forecasted Expenses + Salaries */}
              <Line
                type="monotone"
                dataKey="expectedExpense"
                stroke="#f87171"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="Forecasted Expenses + Salaries"
              />

              {/* 💰 Net Cash Flow */}
              <Line
                type="monotone"
                dataKey="netCashFlow"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 3 }}
                strokeDasharray="4 4"
                name="Net Cash Flow"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ForcastingDashboard;
