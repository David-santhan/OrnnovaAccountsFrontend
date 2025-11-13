import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Modal } from "@mui/material"; // ✅ Add MUI for dialog

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import axios from "axios";

const API_BASE = "http://localhost:7760/api/forecast";

const ForecastingDashboard = () => {
  const [loading, setLoading] = useState(true);
  // const [summary, setSummary] = useState({});
  const [data, setData] = useState([]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });
  // const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // ✅ For modal
  const [modalOpen, setModalOpen] = useState(false); // ✅ Modal toggle
const [details, setDetails] = useState(null);



  // 📊 Fetch forecast data
  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:7760/forecast", {
        params: { fromDate, toDate },
      });

      const {
        pastIncome = [],
        futureIncome = [],
        pastExpenses = [],
        futureExpenses = [],
      } = res.data || {};

      const merged = {};

      // 🟢 Actual Income
      pastIncome.forEach((i) => {
        if (!i.date) return;
        if (!merged[i.date]) merged[i.date] = { date: i.date };
        merged[i.date].actualIncome = Number(i.total_income || 0);
      });

      // 🔵 Forecasted Income
      futureIncome.forEach((i) => {
        if (!i.date) return;
        if (!merged[i.date]) merged[i.date] = { date: i.date };
        merged[i.date].expectedIncome = Number(i.expected_income || 0);
      });

      // 🔴 Actual Expenses
      pastExpenses.forEach((e) => {
        if (!e.date) return;
        if (!merged[e.date]) merged[e.date] = { date: e.date };
        merged[e.date].actualExpense = Number(e.amount || 0);
      });

      // 🟣 Forecasted Expenses
    // 🟣 Forecasted Expenses (fix accumulation for regular recurring expenses)
futureExpenses.forEach((e) => {
  if (!e.date) return;
  if (!merged[e.date]) merged[e.date] = { date: e.date };
  
  // accumulate multiple forecasted expenses if same date occurs more than once
  merged[e.date].expectedExpense =
    (merged[e.date].expectedExpense || 0) + Number(e.expected_expense || 0);
});


      // Combine & sort
      const result = Object.values(merged)
        .map((d) => ({
          date: d.date,
          actualIncome: d.actualIncome || 0,
          expectedIncome: d.expectedIncome || 0,
          actualExpense: d.actualExpense || 0,
          expectedExpense: d.expectedExpense || 0,
          totalIncome: (d.actualIncome || 0) + (d.expectedIncome || 0),
          totalExpense: (d.actualExpense || 0) + (d.expectedExpense || 0),
          netCashFlow:
            ((d.actualIncome || d.expectedIncome || 0) -
              (d.actualExpense || d.expectedExpense || 0)) || 0,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setData(result);
      setLoading(false);
      console.log(data)
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, []);

const fetchDetailsForDate = async (date) => {
  try {
    const res = await axios.get("http://localhost:7760/forecast/details", {
      params: { date },
    });
    setDetails(res.data); // 👈 Important: Store full object
  } catch (err) {
    console.error("Error fetching details:", err);
    setDetails(null);
  }
};


const handleChartClick = (state) => {
  if (state && state.activeLabel) {
    const clickedDate = state.activeLabel;
    const dateData = data.find((d) => d.date === clickedDate);
    if (dateData) {
      setSelectedDate(dateData);
      fetchDetailsForDate(clickedDate); // 🔍 Fetch extra info
      setModalOpen(true);
    }
  }
};
// 🧮 Compute Summary Totals for selected range
const computeSummary = (data) => {
  if (!data || data.length === 0) return null;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  let actualIncome = 0,
    forecastedIncome = 0,
    actualExpense = 0,
    forecastedExpense = 0,
    cashFlowBefore = 0,
    cashFlowAfter = 0;

  data.forEach((d) => {
    const date = new Date(d.date);
    if (date >= start && date <= end) {
      actualIncome += d.actualIncome || 0;
      forecastedIncome += d.expectedIncome || 0;
      actualExpense += d.actualExpense || 0;
      forecastedExpense += d.expectedExpense || 0;
    } else if (date < start) {
      // Cash flow before
      cashFlowBefore = d.netCashFlow;
    } else if (date > end) {
      // Cash flow after
      cashFlowAfter = d.netCashFlow;
    }
  });

  return {
    actualIncome,
    forecastedIncome,
    actualExpense,
    forecastedExpense,
    cashFlowBefore,
    cashFlowAfter,
  };
};
const summary = computeSummary(data);


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
        📅 Date-wise Income vs Outgoings (Actual + Forecast)
      </h2>

      {/* 📅 Date Filters */}
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
            From (Date):
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label style={{ fontWeight: "500", marginRight: "6px" }}>
            To (Date):
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          onClick={fetchForecastData}
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

      {/* 📊 Chart */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#6b7280" }}>
          ⏳ Loading forecast data...
        </p>
      ) : data.length === 0 ? (
        <p style={{ textAlign: "center", color: "#9ca3af" }}>
          No data available for the selected range.
        </p>
      ) : (
        <div
  style={{
    position: "relative", // 👈 Add this
    width: "95%",
    height: 500,
    background: "linear-gradient(180deg, #f9fafb 0%, #eef2ff 100%)",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  }}
>
          {summary && (
  <div
    style={{
      position: "absolute",
      top: "20px",
      right: "40px",
      background: "rgba(255, 255, 255, 0.95)",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      padding: "1rem 1.5rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      fontSize: "0.9rem",
      width: "240px",
      lineHeight: "1.5",
    }}
  >
    <h4 style={{ marginBottom: "0.5rem", textAlign: "center" }}>
      📊 Summary ({new Date(fromDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} →{" "}
      {new Date(toDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })})
    </h4>
    <hr style={{ marginBottom: "0.5rem" }} />
    <div><strong style={{ color: "#16a34a" }}>Actual Income:</strong> ₹{summary.actualIncome.toLocaleString()}</div>
    <div><strong style={{ color: "#65a30d" }}>Forecasted Income:</strong> ₹{summary.forecastedIncome.toLocaleString()}</div>
    <div><strong style={{ color: "#dc2626" }}>Actual Expense:</strong> ₹{summary.actualExpense.toLocaleString()}</div>
    <div><strong style={{ color: "#f97316" }}>Forecasted Expense:</strong> ₹{summary.forecastedExpense.toLocaleString()}</div>
    {/* <hr style={{ margin: "0.5rem 0" }} />
    <div><strong>💰 Cash Flow Before:</strong> ₹{summary.cashFlowBefore.toLocaleString()}</div>
    <div><strong>💰 Cash Flow After:</strong> ₹{summary.cashFlowAfter.toLocaleString()}</div> */}
  </div>
)}

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 5" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })
                }
                tick={{ fontSize: 11 }}
                minTickGap={20}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                }
              />
              <Legend />

              <Line type="monotone" dataKey="actualIncome" stroke="#16a34a" name="Actual Income" />
              <Line type="monotone" dataKey="expectedIncome" stroke="#86efac" strokeDasharray="6 6" name="Forecasted Income" />
              <Line type="monotone" dataKey="actualExpense" stroke="#dc2626" name="Actual Expenses" />
              <Line type="monotone" dataKey="expectedExpense" stroke="#fca5a5" strokeDasharray="6 6" name="Forecasted Expenses" />
              <Line type="monotone" dataKey="netCashFlow" stroke="#8b5cf6" strokeDasharray="4 4" name="Net Cash Flow" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

  <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#fff",
      padding: "1.5rem 2rem",
      borderRadius: "10px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      width: "800px",
      maxHeight: "85vh",
      overflowY: "auto",
    }}
  >
    {selectedDate && (
      <>
        <h2 style={{ textAlign: "center", color: "#1f2937", marginBottom: "10px" }}>
          📅 {new Date(selectedDate.date).toLocaleDateString("en-GB")}
        </h2>
        <hr />

        {!details ? (
          <p style={{ textAlign: "center" }}>⏳ Loading details...</p>
        ) : (
          <>
            {/* === Section Helper Function === */}
            {[
              {
                key: "actualIncome",
                title: "✅ Actual Income",
                color: "#16a34a",
                columns: ["Client", "Invoice No", "Project ID", "Value (₹)", "GST (₹)", "Received Date"],
                data: details.details?.actualIncome || [],
                rowRender: (i) => [
                  i.client_name,
                  i.invoice_number,
                  i.project_id,
                  i.invoice_value?.toLocaleString(),
                  i.gst_amount?.toLocaleString(),
                  i.received_date,
                ],
              },
              {
                key: "forecastedIncome",
                title: "📈 Forecasted Income",
                color: "#65a30d",
                columns: ["Client", "Invoice No", "Project ID", "Value (₹)", "GST (₹)", "Due Date"],
                data: details.details?.forecastedIncome || [],
                rowRender: (i) => [
                  i.client_name,
                  i.invoice_number,
                  i.project_id,
                  i.invoice_value?.toLocaleString(),
                  i.gst_amount?.toLocaleString(),
                  i.due_date,
                ],
              },
              {
                key: "actualExpenses",
                title: "💸 Actual Expenses",
                color: "#dc2626",
                columns: ["Type", "Description", "Paid Amount (₹)", "Paid Date"],
                data: details.details?.actualExpenses || [],
                rowRender: (e) => [
                  e.expense_type,
                  e.description,
                  e.paid_amount?.toLocaleString(),
                  e.paid_date,
                ],
              },
              {
                key: "forecastedExpenses",
                title: "🧾 Forecasted Expenses",
                color: "#f97316",
                columns: ["Type", "Description", "Amount (₹)", "Regular", "Due Date"],
                data: details.details?.forecastedExpenses || [],
                rowRender: (e) => [
                  e.expense_type,
                  e.description,
                  e.amount?.toLocaleString(),
                  e.regular === "Yes" ? "Yes ✅" : "No",
                  e.due_date,
                ],
              },
              {
                key: "salaries",
                title: "👤 Salaries",
                color: "#8b5cf6",
                columns: ["Employee", "Employee ID", "Paid Amount (₹)", "Paid Date", "Month"],
                data: details.details?.salaries || [],
                rowRender: (s) => [
                  s.employee_name,
                  s.employee_id,
                  s.paid_amount?.toLocaleString(),
                  s.paid_date,
                  s.month,
                ],
              },
            ].map(
              (section) =>
                section.data.length > 0 && (
                  <div key={section.key} style={{ marginTop: "1.5rem" }}>
                    <h4 style={{ color: section.color }}>{section.title}</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginTop: "6px",
                        }}
                      >
                        <thead>
                          <tr style={{ background: "#f3f4f6" }}>
                            {section.columns.map((col, idx) => (
                              <th
                                key={idx}
                                style={{
                                  textAlign: "left",
                                  padding: "8px",
                                  borderBottom: "2px solid #e5e7eb",
                                }}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.data.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                              {section.rowRender(row).map((cell, cidx) => (
                                <td
                                  key={cidx}
                                  style={{
                                    padding: "6px 8px",
                                    fontSize: "0.9rem",
                                    color: "#374151",
                                  }}
                                >
                                  {cell || "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
            )}

            {/* === Summary Section === */}
            <div
              style={{
                backgroundColor: "#f9fafb",
                marginTop: "1.5rem",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h4 style={{ textAlign: "center", color: "#1f2937" }}>🧮 Summary</h4>
              <table style={{ width: "100%", marginTop: "6px", borderCollapse: "collapse" }}>
             <tbody>
  <tr>
    <td>🏦 Current Account Balance</td>
    <td style={{ textAlign: "right" }}>
      ₹{details.summary?.currentAccountBalance?.toLocaleString() || 0}
    </td>
  </tr>
  <tr>
    <td>📈 Forecasted Income</td>
    <td style={{ textAlign: "right" }}>
      ₹{details.summary?.forecastedIncomeTotal?.toLocaleString() || 0}
    </td>
  </tr>
  <tr>
    <td>🧾 Forecasted Expenses</td>
    <td style={{ textAlign: "right" }}>
      ₹{details.summary?.forecastedExpensesTotal?.toLocaleString() || 0}
    </td>
  </tr>
  <tr>
    <td>👤 Forecasted Salaries</td>
    <td style={{ textAlign: "right" }}>
      ₹{details.summary?.forecastedSalariesTotal?.toLocaleString() || 0}
    </td>
  </tr>
  <tr style={{ borderTop: "2px solid #ddd" }}>
    <td>
      <strong>Projected Account Balance (Net Cash Flow)</strong>
    </td>
    <td
      style={{
        textAlign: "right",
        fontWeight: "bold",
        color:
          (details.summary?.netCashFlow || 0) >= 0
            ? "#16a34a"
            : "#dc2626",
      }}
    >
      ₹{details.summary?.netCashFlow?.toLocaleString() || 0}
    </td>
  </tr>
</tbody>

              </table>
            </div>
          </>
        )}

        <button
          onClick={() => setModalOpen(false)}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            marginTop: "1.5rem",
            cursor: "pointer",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Close
        </button>
      </>
    )}
  </div>
</Modal>



    </div>
  );
};

export default ForecastingDashboard;
