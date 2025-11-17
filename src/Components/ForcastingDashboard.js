import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

// Currency Formatter
const currency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return "-";
  const [y, m] = monthKey.split("-");
  try {
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-GB", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return monthKey;
  }
};

/* Beautiful Section Table */
const SectionTable = ({ title, columns = [], rows = [] }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <div
        style={{
          fontSize: "1.2rem",
          fontWeight: 600,
          marginBottom: 14,
          display: "inline-block",
          padding: "6px 16px",
          background: "linear-gradient(90deg, #dbeafe, #eff6ff)",
          borderRadius: 8,
          color: "#1e3a8a",
          boxShadow: "0px 2px 5px rgba(0,0,0,0.08)",
        }}
      >
        {title}
      </div>

      <TableContainer
        component={Paper}
        style={{
          borderRadius: 10,
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
          maxHeight: 300,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell
                  key={idx}
                  style={{
                    backgroundColor: "#f1f5f9",
                    fontWeight: "bold",
                    color: "#334155",
                    fontSize: "0.9rem",
                  }}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, rIdx) => (
              <TableRow
                key={rIdx}
                style={{
                  background: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc",
                  transition: "0.2s",
                }}
              >
                {columns.map((col, cIdx) => {
                  const value =
                    typeof col.render === "function"
                      ? col.render(row)
                      : row[col.field];

                  return (
                    <TableCell
                      key={cIdx}
                      style={{
                        fontSize: "0.85rem",
                        padding: "8px 12px",
                        whiteSpace: "nowrap",
                        color: "#334155",
                      }}
                    >
                      {value ?? "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default function ForcastingDashboard() {
  const [loading, setLoading] = useState(false);
  const [fullData, setFullData] = useState(null);
  const [summary, setSummary] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [monthlyAccBalance, setMonthlyAccBalance] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);

  
  const [fromMonth, setFromMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 7);
  });

  const [toMonth, setToMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 7);
  });

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:7760/forecast");
      const data = res.data || {};
      setFullData(data);

      if (Array.isArray(data.months)) {
        const s = data.months
          .map((m) => ({
            month: m.month,
            actualIncome: Number(m.actualIncomeTotal || 0),
            forecastIncome: Number(m.forecastIncomeTotal || 0),
            actualExpense: Number(m.actualExpenseTotal || 0),
            forecastExpense: Number(m.forecastExpenseTotal || 0),
            monthlyBalance: Number(m.monthlyBalance || 0),
          }))
          .sort((a, b) => (a.month > b.month ? 1 : -1));

        setSummary(s);
        setFiltered(s);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleSearch = async () => {
    if (!fromMonth) {
      alert("Please select From month");
      return;
    }

    try {
      const res = await axios.get("http://localhost:7760/monthly-last-balances", {
        params: { month: fromMonth },
      });

      const lastBalance = res.data.data?.[0]?.updated_balance || 0;
      setMonthlyAccBalance(lastBalance);

      const out = summary.filter(
        (s) => s.month >= fromMonth && s.month <= toMonth
      );
      setFiltered(out);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch balance");
    }
  };
  // Selected month details
  const monthDetails = useMemo(() => {
    if (!fullData || !selectedMonth) return null;
    return fullData.months?.find((m) => m.month === selectedMonth) || null;
  }, [fullData, selectedMonth]);

  // Build merged income (ACTUAL + FORECAST)
  const mergedIncome = useMemo(() => {
    if (!monthDetails) return [];

    const actual = monthDetails.actualIncomeItems || [];
    const forecast = monthDetails.forecastIncomeItems || [];

    return forecast.map((f) => {
      const match = actual.find(
        (a) =>
          a.invoice_number === f.invoice_number ||
          (a.project_id === f.project_id &&
            Number(a.invoice_value) === Number(f.amount))
      );

      return {
        ...f,
        status: match ? "Received" : "Not Received",
        received_date: match?.received_date || null,
      };
    });
  }, [monthDetails]);

  // Build merged EXPENSES (Actual + Forecast)
const mergedExpenses = useMemo(() => {

  if (!monthDetails) return [];
 
  const actual = monthDetails.actualExpenseItems || [];

  const forecast = monthDetails.forecastExpenseItems || [];
 
  return forecast.map((f) => {

    const match = actual.find(

      (a) =>

        (a.expense_type || "").trim().toLowerCase() ===

        (f.type || "").trim().toLowerCase()

    );
 
    return {

      ...f,

      regular: match ? match.regular : (f.regular || "No"),

      paid_amount: match ? match.paid_amount : 0,

      paid_date: match ? match.paid_date : null,

      status: match ? "Paid" : "Not Paid",

      actual_amount: match ? match.amount : 0,

    };

  });

}, [monthDetails]);

 

  // CATEGORY DETECTION (Salary, PF, TDS, PT, Insurance)
  const MAIN = ["Salary", "PF", "Insurance", "PT", "TDS"];

  const getCategory = (type) => {
    if (!type) return "Others";

    let cat = type.split(" - ")[0].trim();

    if (cat.toLowerCase() === "professional tax") return "PT";

    return MAIN.includes(cat) ? cat : type;
  };

  // Build Category Totals
const { categoryTotals, grandTotalExpenses } = useMemo(() => {

  const totals = {};
 
  mergedExpenses.forEach((exp) => {

    const cat = getCategory(exp.type);
 
    if (!totals[cat]) totals[cat] = 0;
 
    // Use actual amount if available, otherwise forecast

    const finalAmount = exp.actual_amount ? exp.actual_amount : exp.amount;
 
    totals[cat] += Number(finalAmount || 0);

  });
 
  return {

    categoryTotals: totals,

    grandTotalExpenses: Object.values(totals).reduce((a, b) => a + b, 0),

  };

}, [mergedExpenses]);

 

  // Acc Balance Calculation
  const safeNumber = (v) => Number(v || 0);

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.month) - new Date(b.month)
  );

  let cumulative = 0;
  const withNet = sorted.map((row) => {
    cumulative += row.monthlyBalance;
    return { ...row, netCashFlow: cumulative };
  });

  const startBalance = safeNumber(monthlyAccBalance);
  let runBal = startBalance;

  const finalTableData = withNet.map((row, i) => {
    if (i === 0) {
      return { ...row, accountBalance: runBal };
    }

    runBal += safeNumber(row.monthlyBalance);

    return { ...row, accountBalance: runBal };
  });

  const summaryCardStyle = {
    backgroundColor: "#ffffff",
    padding: "10px 14px",
    borderRadius: "10px",
    minWidth: "180px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  };

  const summaryValueStyle = {
    fontSize: "1.1rem",
    marginTop: 4,
    fontWeight: 700,
  };

  return (
    <div style={{ padding: 20 }}>
      {/* ================= SUMMARY UI ON TOP ================= */}
      <Typography
        variant="h5"
        align="center"
        style={{ marginBottom: 20, fontWeight: 700, color: "#1e3a8a" }}
      >
        📅 Forecast — Month-wise Summary
      </Typography>

      {/* FILTER */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <TextField
          type="month"
          size="small"
          label="From"
          value={fromMonth}
          onChange={(e) => setFromMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
          style={{ minWidth: 140 }}
        />

        <TextField
          type="month"
          size="small"
          label="To"
          value={toMonth}
          onChange={(e) => setToMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
          style={{ minWidth: 140 }}
        />

        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          style={{
            backgroundColor: "#2563eb",
            textTransform: "none",
            borderRadius: 6,
          }}
        >
          Search
        </Button>
      </div>

      {/* MAIN SUMMARY TABLE */}
      <Paper
        style={{
          borderRadius: 10,
          overflow: "auto",
          maxHeight: "60vh",
          boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                "Month",
                "Actual Income",
                "Forecast Income",
                "Actual Expense",
                "Forecast Expense",
                "Monthly Balance",
                "Account Balance",
                "Action",
              ].map((h, i) => (
                <TableCell
                  key={i}
                  style={{
                    backgroundColor: "#e2e8f0",
                    fontWeight: 700,
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {finalTableData.map((row) => (
              <TableRow key={row.month} hover>
                <TableCell>{formatMonthLabel(row.month)}</TableCell>
                <TableCell>{currency(row.actualIncome)}</TableCell>
                <TableCell>{currency(row.forecastIncome)}</TableCell>
                <TableCell>{currency(row.actualExpense)}</TableCell>
                <TableCell>{currency(row.forecastExpense)}</TableCell>
                <TableCell
                  style={{
                    fontWeight: 600,
                    color: row.monthlyBalance >= 0 ? "green" : "red",
                  }}
                >
                  {currency(row.monthlyBalance)}
                </TableCell>

                <TableCell>{currency(row.accountBalance)}</TableCell>

                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    style={{
                      backgroundColor: "#1e40af",
                      color: "white",
                      borderRadius: 6,
                      textTransform: "none",
                    }}
                    onClick={() => {
                      setSelectedMonth(row.month);
                      setDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ===================== DIALOG BEGINS ===================== */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
            }}
          >
            <span>Details — {formatMonthLabel(selectedMonth)}</span>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent dividers>
          {monthDetails && (
            <>
              {/* =======================
                 INCOME OVERVIEW TABLE
              ======================== */}
              <SectionTable
                title="Income Overview (Actual + Forecast)"
                columns={[
                  { header: "Project", render: (r) => r.projectName || r.project_id },
                  { header: "Invoice No", render: (r) => r.invoice_number },
                  { header: "Value (₹)", render: (r) => currency(r.invoice_value || r.amount) },
                  { header: "GST (₹)", render: (r) => currency(r.gst_amount) },
                  {
                    header: "Date",
                    render: (r) =>
                      r.received_date
                        ? new Date(r.received_date).toLocaleDateString("en-GB")
                        : r.due_date
                        ? new Date(r.due_date).toLocaleDateString("en-GB")
                        : "-",
                  },
                  {
                    header: "Status",
                    render: (r) =>
                      r.status === "Received" ? (
                        <span style={{ color: "green", fontWeight: 700 }}>✔ Received</span>
                      ) : (
                        <span style={{ color: "red", fontWeight: 700 }}>✖ Not Received</span>
                      ),
                  },
                ]}
                rows={mergedIncome}
              />

              {/* =======================
                  EXPENSES OVERVIEW SECTION
              ======================== */}
              <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>

                {/* LEFT — CATEGORY TOTALS */}
                <div style={{ width: "28%" }}>
                  <TableContainer
                    component={Paper}
                    sx={{
                      maxHeight: 430,
                      overflowX: "auto",
                      borderRadius: "12px",
                      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                      border: "1px solid #e1e1e1",
                    }}
                  >
                    <Table stickyHeader>

                      {/* TOTAL */}
                      <TableHead>
                        <TableRow style={{ backgroundColor: "#f0f2ff" }}>
                          <TableCell
                            colSpan={2}
                            style={{
                              fontWeight: 800,
                              fontSize: "15px",
                              color: "#3071a3",
                              padding: "14px",
                              textAlign: "center",
                              fontFamily: "monospace",
                            }}
                          >
                            TOTAL — {currency(grandTotalExpenses)}
                          </TableCell>
                        </TableRow>

                        {/* HEADERS */}
                        <TableRow style={{ backgroundColor: "#f7f7fb" }}>
                          <TableCell style={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell style={{ fontWeight: 700, textAlign: "right" }}>
                            Total
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      {/* CATEGORY LIST */}
                      <TableBody>
                        {Object.keys(categoryTotals).map((cat) => (
                          <TableRow
                            key={cat}
                            hover
                            sx={{
                              cursor: "pointer",
                              backgroundColor:
                                selectedCategory === cat
                                  ? "rgba(99,102,241,0.1)"
                                  : "white",
                              "&:hover": {
                                backgroundColor: "rgba(99,102,241,0.08)",
                              },
                            }}
                            onClick={() => setSelectedCategory(cat)}
                          >
                            <TableCell>
                              <span
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "rgba(99,102,241,0.12)",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  color: "#4f46e5",
                                  fontWeight: 600,
                                }}
                              >
                                {cat}
                              </span>
                            </TableCell>

                            <TableCell style={{ fontWeight: 700, textAlign: "right" }}>
                              {currency(categoryTotals[cat])}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* RESET */}
                        <TableRow
                          hover
                          sx={{
                            cursor: "pointer",
                            backgroundColor: "#eef5ff",
                            "&:hover": { backgroundColor: "#dce8ff" },
                          }}
                          onClick={() => setSelectedCategory("")}
                        >
                          <TableCell colSpan={2} style={{ textAlign: "center", fontWeight: 700 }}>
                            Show All
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>

                {/* RIGHT — EXPENSE DETAILS */}
                <div style={{ width: "72%" }}>
                  <TableContainer
                    component={Paper}
                    sx={{
                      maxHeight: 430,
                      overflowX: "auto",
                      borderRadius: "12px",
                      boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                      border: "1px solid #e3e3e3",
                    }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow style={{ backgroundColor: "#f7f7fb" }}>
                          <TableCell>Regular</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Paid Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Paid Date</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {mergedExpenses
                          .filter((exp) => {
                            if (!selectedCategory) return true;

                            const cat = getCategory(exp.type);

                            if (
                              ["Salary", "PF", "Insurance", "PT", "TDS"].includes(
                                selectedCategory
                              )
                            ) {
                              return cat === selectedCategory;
                            }

                            return exp.type === selectedCategory;
                          })
                          .map((exp, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{exp.regular || "-"}</TableCell>

                              <TableCell>
                                <span
                                  style={{
                                    padding: "4px 10px",
                                    backgroundColor: "rgba(99,102,241,0.12)",
                                    borderRadius: "8px",
                                    color: "#4f46e5",
                                    fontWeight: 600,
                                  }}
                                >
                                  {exp.type}
                                </span>
                              </TableCell>

                              <TableCell>{currency(exp.amount)}</TableCell>

                              <TableCell>{currency(exp.paid_amount)}</TableCell>

                              <TableCell
                                style={{
                                  fontWeight: 700,
                                  color:
                                    exp.status === "Paid" ? "green" : "red",
                                }}
                              >
                                {exp.status}
                              </TableCell>

                              <TableCell>
                                {exp.paid_date
                                  ? new Date(exp.paid_date)
                                      .toLocaleDateString("en-GB")
                                      .replaceAll("/", "-")
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            style={{
              backgroundColor: "#1e3a8a",
              color: "white",
              borderRadius: 6,
              textTransform: "none",
              padding: "6px 20px",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}