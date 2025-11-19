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
  Divider,
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
        console.log(data);
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
      console.log(lastBalance);

      const out = summary.filter(
        (s) => s.month >= fromMonth && s.month <= toMonth
      );
      setFiltered(out);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch balance");
    }
  };

  // ---------- DEBUG: quick log to see month details when dialog opens ----------
  useEffect(() => {
    if (selectedMonth && fullData) {
      const md = fullData.months?.find((m) => m.month === selectedMonth);
      console.log("DEBUG monthDetails for", selectedMonth, md);
    }
  }, [selectedMonth, fullData]);

  const monthDetails = useMemo(() => {
    if (!fullData || !Array.isArray(fullData.months) || !selectedMonth) return null;
    return fullData.months.find((m) => m.month === selectedMonth) || null;
  }, [fullData, selectedMonth]);

  // Build merged income (ACTUAL + FORECAST) — now includes robust due_date fallback
  const mergedIncome = useMemo(() => {
    if (!monthDetails) return [];

    const actual = monthDetails.actualIncomeItems || [];
    const forecast = monthDetails.forecastIncomeItems || [];

    // map actuals by invoice_number / id / project for quick matching
    const actualByNumber = new Map();
    const actualById = new Map();
    actual.forEach(a => {
      if (a.invoice_number) actualByNumber.set(String(a.invoice_number), a);
      if (a.invoice_id != null) actualById.set(String(a.invoice_id), a);
    });

    return forecast.map((f) => {
      // try to find corresponding actual received invoice
      let match =
        (f.invoice_id != null && actualById.get(String(f.invoice_id))) ||
        (f.invoice_number && actualByNumber.get(String(f.invoice_number))) ||
        actual.find(
          (a) =>
            a.project_id === f.project_id &&
            Number(a.invoice_value || a.total_with_gst || 0) === Number(f.invoice_value || f.amount || f.total_with_gst || 0)
        );

      // determine status and received_date
      const isReceived = !!(match && match.received_date);
      const received_date = match?.received_date || null;

      // due_date fallback chain:
      const due_date = f.due_date || match?.due_date || match?.display_date || match?.received_date || null;

      return {
        ...f,
        due_date,
        status: isReceived ? "Received" : "Not Received",
        received_date,
      };
    });
  }, [monthDetails]);

  const incomeSummary = useMemo(() => {
    if (!mergedIncome) return null;

    let receivedCount = 0;
    let notReceivedCount = 0;

    let totalValue = 0;
    let totalReceivedValue = 0;
    let totalNotReceivedValue = 0;
    let totalGST = 0;

    mergedIncome.forEach((r) => {
      const value = Number(r.invoice_value || r.amount || 0);
      const gst = Number(r.gst_amount || 0);

      totalValue += value;
      totalGST += gst;

      if (r.status === "Received") {
        receivedCount++;
        totalReceivedValue += value;
      } else {
        notReceivedCount++;
        totalNotReceivedValue += value;
      }
    });

    return {
      receivedCount,
      notReceivedCount,
      totalValue,
      totalReceivedValue,
      totalNotReceivedValue,
      totalGST,
    };
  }, [mergedIncome]);

  // ---------- Build merged EXPENSES (Actual + Forecast) ----------
  // NOTE: changed only to avoid showing paid_amount/paid_date for forecast rows unless truly paid
  const mergedExpenses = useMemo(() => {
    if (!monthDetails) return [];

    const actual = monthDetails.actualExpenseItems || [];      // actual paid rows (from backend)
    const forecast = monthDetails.forecastExpenseItems || [];  // forecast / expected rows (from backend)

    // map actual payments by expense_id for quick lookup
    const actualById = new Map();
    actual.forEach(a => {
      if (a.expense_id != null) actualById.set(String(a.expense_id), a);
    });

    // also index actual rows by type+amount as a fallback (helps when expense_id not present)
    const actualByTypeAmount = {};
    actual.forEach(a => {
      const key = `${String(a.expense_type || a.type || "").trim().toLowerCase()}|${Number(a.amount || a.paid_amount || 0)}`;
      (actualByTypeAmount[key] ||= []).push(a);
    });

    const merged = [];

    // 1) Add ALL forecast rows (no collapsing). If there's a matching actual by id -> merge paid info,
    // but only expose paid_amount/paid_date when the payment is actually paid.
    forecast.forEach(f => {
      const fid = f.expense_id != null ? String(f.expense_id) : null;

      // try expense_id match
      let match = fid ? actualById.get(fid) : undefined;

      // fallback: try by type+amount (some actual rows may lack expense_id)
      if (!match) {
        const key = `${String(f.type || "").trim().toLowerCase()}|${Number(f.amount || f.paid_amount || 0)}`;
        const list = actualByTypeAmount[key] || [];
        match = list.length ? list[0] : undefined;
      }

      // Decide paid_amount and paid_date sensibly: prefer actual values, else keep forecast (if any)
      const candidatePaidAmount = match?.paid_amount ?? match?.amount ?? f.paid_amount ?? 0;
      let candidatePaidDate = match?.paid_date ?? f.paid_date ?? null;
      if (!candidatePaidDate && match?.month_year) {
        candidatePaidDate = `${String(match.month_year).slice(0,7)}-01`;
      }

      // Determine whether this row should be considered paid (strict check)
      const statusFromMatch = match?.status ? String(match.status).trim().toLowerCase() : null;
      const isPaid = (Number(candidatePaidAmount) > 0) || statusFromMatch === "paid" || statusFromMatch === "yes";

      const status = isPaid ? "Paid" : (f.status || "Not Paid");

      merged.push({
        expense_id: f.expense_id,
        type: f.type,
        description: f.description,
        regular: f.regular ?? f.regular ?? "No",
        amount: Number(f.amount ?? f.paid_amount ?? 0),
        // only expose paid_amount/paid_date if isPaid === true
        paid_amount: isPaid ? Number(candidatePaidAmount || 0) : 0,
        paid_date: isPaid ? (candidatePaidDate ?? null) : null,
        status,
        actual_amount: match ? (match.amount ?? match.paid_amount ?? 0) : 0,
        _source: match ? "forecast+actual" : "forecast-only",
        // include due_date from forecast row if present (forecast rows already set due_date in backend)
        due_date: f.due_date ?? null,
      });
    });

    // 2) Append any actual-only rows that were not in forecast (show them too)
    actual.forEach(a => {
      const exists = merged.some(m =>
        m.expense_id != null && a.expense_id != null && String(m.expense_id) === String(a.expense_id)
      );

      if (!exists) {
        // normalize paid_date similarly
        let paidDate = a.paid_date ?? null;
        if (!paidDate && a.month_year) paidDate = `${String(a.month_year).slice(0,7)}-01`;

        merged.push({
          expense_id: a.expense_id,
          type: a.expense_type || a.type || "Other",
          description: a.description,
          regular: a.regular ?? "No",
          amount: Number(a.amount ?? a.paid_amount ?? 0),
          paid_amount: Number(a.paid_amount ?? a.actual_amount ?? 0),
          paid_date: paidDate,
          status: a.status ?? (Number(a.paid_amount ?? a.amount ?? 0) > 0 ? "Paid" : "Not Paid"),
          actual_amount: Number(a.amount ?? a.paid_amount ?? 0),
          _source: "actual-only",
          due_date: a.due_date ?? null,
        });
      }
    });

    // preserve order: keep forecast order first, actual-only appended — this matches your backend grouping
    return merged;
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

    // mergedExpenses may be null/undefined while loading — guard it
    (mergedExpenses || []).forEach((exp) => {
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

  const expenseSummary = useMemo(() => {
    if (!mergedExpenses) return null;

    let paidCount = 0;
    let notPaidCount = 0;

    let totalExpense = 0;
    let totalPaidAmount = 0;
    let totalNotPaidAmount = 0;

    mergedExpenses.forEach((exp) => {
      const amount = Number(exp.amount || 0);

      totalExpense += amount;

      if (exp.status === "Paid") {
        paidCount++;
        totalPaidAmount += amount;
      } else {
        notPaidCount++;
        totalNotPaidAmount += amount;
      }
    });

    return {
      paidCount,
      notPaidCount,
      totalExpense,
      totalPaidAmount,
      totalNotPaidAmount,
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

  // safe date formatting helper
  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-GB").replaceAll("/", "-");
    } catch {
      return d;
    }
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
                      // ensure monthDetails is available before dialog renders content
                      setTimeout(() => setDialogOpen(true), 0);
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
          {/* Summary Top Box */}
          <Box sx={{ width: "50%" }}>
            {incomeSummary && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                {/* Received */}
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 1.5,
                    bgcolor: "#e8f5e9",
                    textAlign: "center",
                  }}
                >
                  <h5 style={{ margin: 0, color: "green", fontSize: "13px", marginBottom: "4px" }}>
                    ✔ Received
                  </h5>

                  <table
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ textAlign: "left", padding: "2px 4px" }}>Count</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {incomeSummary.receivedCount}
                        </td>
                      </tr>

                      <tr>
                        <td style={{ textAlign: "left", padding: "2px 4px" }}>Amount</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {currency(incomeSummary.totalReceivedValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Box>

                {/* Not Received */}
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 1.5,
                    bgcolor: "#ffebee",
                    textAlign: "center",
                  }}
                >
                  <h5 style={{ margin: 0, color: "red", fontSize: "13px", marginBottom: "4px" }}>
                    ✖ Not Received
                  </h5>

                  <table
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ textAlign: "left", padding: "2px 4px" }}>Count</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {incomeSummary.notReceivedCount}
                        </td>
                      </tr>

                      <tr>
                        <td style={{ textAlign: "left", padding: "2px 4px" }}>Amount</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {currency(incomeSummary.totalNotReceivedValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Box>

                {/* Total */}
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 1.5,
                    bgcolor: "#e3f2fd",
                    textAlign: "center",
                  }}
                >
                  <h5 style={{ margin: 0, fontSize: "13px", marginBottom: "4px" }}>Total Value</h5>

                  <table
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      borderCollapse: "collapse",
                      marginTop: "4px",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ textAlign: "left", padding: "2px 4px" }}>Total</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {currency(incomeSummary.totalValue)}
                        </td>
                      </tr>

                      <tr>
                        <td style={{ textAlign: "left", padding: "2px 4px" }}>GST</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          - {currency(incomeSummary.totalGST)}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style={{
                            textAlign: "left",
                            padding: "2px 4px",
                            fontWeight: 700,
                            borderTop: "1px solid #c3d5f5",
                          }}
                        >
                          Final
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            borderTop: "1px solid #c3d5f5",
                          }}
                        >
                          {currency(incomeSummary.totalValue - incomeSummary.totalGST)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}
          </Box>

          {monthDetails && (
            <>
              {/* =======================
                 INCOME OVERVIEW TABLE
              ======================== */}
              <SectionTable
                title={`Income — ${formatMonthLabel(selectedMonth)}`}
                columns={[
                  { header: "Project", render: (r) => r.projectName || r.project_id || "-" },
                  { header: "Invoice No", render: (r) => r.invoice_number || "-" },
                  { header: "Value (₹)", render: (r) => currency(r.invoice_value || r.amount || r.total_with_gst) },
                  { header: "GST (₹)", render: (r) => currency(r.gst_amount || 0) },
                  // NEW: Due Date column pulled from invoice rows (due_date)
                  {
                    header: "Due Date",
                    render: (r) => (r.due_date ? fmtDate(r.due_date) : "-"),
                  },
                  {
                    header: "Received Date",
                    render: (r) =>
                      r.status === "Received"
                        ? r.received_date
                          ? fmtDate(r.received_date)
                          : "-"
                        : r.due_date
                        ? fmtDate(r.due_date)
                        : "-",
                  },
                  {
                    header: "Status",
                    render: (r) =>
                      r.status === "Received" ? (
                        <span style={{ color: "green", fontWeight: 700 }}>✔ Received</span>
                      ) : (
                        <span style={{ color: "orange", fontWeight: 700 }}>⏳ Not Received</span>
                      ),
                  },
                ]}
                rows={mergedIncome}
              />

              <Divider>Expenses</Divider>

              {/* =======================
                  EXPENSES OVERVIEW SECTION
              ======================== */}
              <Box sx={{ width: "50%" }}>
                {expenseSummary && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 1.5,
                      mb: 2,
                      mt: 2,
                    }}
                  >
                    {/* PAID */}
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        bgcolor: "#e8f5e9",
                        textAlign: "center",
                      }}
                    >
                      <h5 style={{ margin: 0, color: "green", fontSize: "13px", marginBottom: "4px" }}>
                        ✔ Paid
                      </h5>

                      <table
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          borderCollapse: "collapse",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Count</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              {expenseSummary.paidCount}
                            </td>
                          </tr>

                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Amount</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              {currency(expenseSummary.totalPaidAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>

                    {/* NOT PAID */}
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        bgcolor: "#ffebee",
                        textAlign: "center",
                      }}
                    >
                      <h5 style={{ margin: 0, color: "red", fontSize: "13px", marginBottom: "4px" }}>
                        ✖ Not Paid
                      </h5>

                      <table
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          borderCollapse: "collapse",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Count</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              {expenseSummary.notPaidCount}
                            </td>
                          </tr>

                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Amount</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              {currency(expenseSummary.totalNotPaidAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>

                    {/* TOTAL EXPENSE */}
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        bgcolor: "#e3f2fd",
                        textAlign: "center",
                      }}
                    >
                      <h5 style={{ margin: 0, fontSize: "13px", marginBottom: "4px" }}>
                        Total Expenses
                      </h5>

                      <table
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          borderCollapse: "collapse",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Total</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              {currency(expenseSummary.totalExpense)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                )}
              </Box>

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
                          <TableCell>Due Date</TableCell>
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

                              {/* Paid Amount (shows payments joined from expense_payments) */}
                              <TableCell>{currency(exp.paid_amount ?? exp.actual_amount ?? 0)}</TableCell>

                              {/* Due date shown as date, not currency */}
                              <TableCell>{fmtDate(exp.due_date)}</TableCell>

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
                                {exp.paid_date ? fmtDate(exp.paid_date) : "-"}
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
