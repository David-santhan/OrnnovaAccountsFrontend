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
      {/* Title */}
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

      {/* Table */}
      <TableContainer
        component={Paper}
        style={{
          borderRadius: 10,
          overflow: "hidden",
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e0f2fe")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    rIdx % 2 === 0 ? "#ffffff" : "#f8fafc")
                }
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
            netCashFlow: Number(m.netCashFlow || 0),
          }))
          .sort((a, b) => (a.month > b.month ? 1 : -1));

        setSummary(s);
        setFiltered(s);
        setFromMonth(s[0]?.month);
        setToMonth(s[s.length - 1]?.month);
      }
    } catch (err) {
      setError(err.message || "Error fetching forecast");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleSearch = () => {
    const out = summary.filter((s) => s.month >= fromMonth && s.month <= toMonth);
    setFiltered(out);
  };

  const monthDetails = useMemo(() => {
    if (!fullData || !selectedMonth) return null;
    return fullData.months?.find((m) => m.month === selectedMonth) || null;
  }, [fullData, selectedMonth]);

  return (
    <div style={{ padding: 20 }}>
      <Typography
        variant="h5"
        align="center"
        style={{ marginBottom: 20, fontWeight: 700, color: "#1e3a8a" }}
      >
        📅 Forecast — Month-wise Summary
      </Typography>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          alignItems: "center",
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

      {/* Summary Table */}
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
                "Forecasted Income",
                "Actual Expense",
                "Forecasted Expense",
                "Net Cash Flow",
                "Action",
              ].map((head, idx) => (
                <TableCell
                  key={idx}
                  style={{
                    backgroundColor: "#e2e8f0",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.month} hover>
                <TableCell>{formatMonthLabel(row.month)}</TableCell>
                <TableCell>{currency(row.actualIncome)}</TableCell>
                <TableCell>{currency(row.forecastIncome)}</TableCell>
                <TableCell>{currency(row.actualExpense)}</TableCell>
                <TableCell>{currency(row.forecastExpense)}</TableCell>
                <TableCell
                  style={{
                    fontWeight: 600,
                    color: row.netCashFlow >= 0 ? "green" : "red",
                  }}
                >
                  {currency(row.netCashFlow)}
                </TableCell>

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

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="lg">
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
              {/* Summary Top Box */}
            <div
  style={{
    background: "linear-gradient(90deg, #e0f2fe, #dbeafe)",
    padding: "18px",
    borderRadius: "12px",
    marginBottom: "20px",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "space-between",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
  }}
>
  {/* Actual Income */}
  <div
    style={{
      backgroundColor: "#ffffff",
      padding: "10px 14px",
      borderRadius: "10px",
      minWidth: "180px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      border: "1px solid #e5e7eb",
    }}
  >
    <span style={{ color: "#1e3a8a", fontWeight: 700 }}>Actual Income</span>
    <div style={{ fontSize: "1.1rem", marginTop: 4, fontWeight: 700 }}>
      {currency(monthDetails.actualIncomeTotal)}
    </div>
  </div>

  {/* Forecast Income */}
  <div
    style={{
      backgroundColor: "#ffffff",
      padding: "10px 14px",
      borderRadius: "10px",
      minWidth: "180px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      border: "1px solid #e5e7eb",
    }}
  >
    <span style={{ color: "#0f766e", fontWeight: 700 }}>Forecast Income</span>
    <div style={{ fontSize: "1.1rem", marginTop: 4, fontWeight: 700 }}>
      {currency(monthDetails.forecastIncomeTotal)}
    </div>
  </div>

  {/* Actual Expense */}
  <div
    style={{
      backgroundColor: "#ffffff",
      padding: "10px 14px",
      borderRadius: "10px",
      minWidth: "180px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      border: "1px solid #e5e7eb",
    }}
  >
    <span style={{ color: "#b91c1c", fontWeight: 700 }}>Actual Expense</span>
    <div style={{ fontSize: "1.1rem", marginTop: 4, fontWeight: 700 }}>
      {currency(monthDetails.actualExpenseTotal)}
    </div>
  </div>

  {/* Forecast Expense */}
  <div
    style={{
      backgroundColor: "#ffffff",
      padding: "10px 14px",
      borderRadius: "10px",
      minWidth: "180px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      border: "1px solid #e5e7eb",
    }}
  >
    <span style={{ color: "#7c3aed", fontWeight: 700 }}>Forecast Expense</span>
    <div style={{ fontSize: "1.1rem", marginTop: 4, fontWeight: 700 }}>
      {currency(monthDetails.forecastExpenseTotal)}
    </div>
  </div>

  {/* Net Cash Flow */}
  <div
    style={{
      backgroundColor: "#ffffff",
      padding: "10px 14px",
      borderRadius: "10px",
      minWidth: "180px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      border: "1px solid #e5e7eb",
    }}
  >
    <span style={{ color: monthDetails.netCashFlow >= 0 ? "#065f46" : "#b91c1c", fontWeight: 700 }}>
      Net Cash Flow
    </span>
    <div
      style={{
        fontSize: "1.1rem",
        marginTop: 4,
        fontWeight: 700,
        color: monthDetails.netCashFlow >= 0 ? "green" : "red",
      }}
    >
      {currency(monthDetails.netCashFlow)}
    </div>
  </div>
</div>


              {/* === 1st Row: Income Tables === */}
<div
  style={{
    display: "flex",
    gap: "20px",
    marginTop: "10px",
    marginBottom: "20px",
  }}
>
  {/* Actual Income */}
  <div style={{ flex: 1, maxHeight: 300, overflow: "auto" }}>
    <SectionTable
      title="Actual Income (Received Invoices)"
      columns={[
        { header: "Project", render: (r) => r.project_id },
        { header: "Invoice No", render: (r) => r.invoice_number },
        { header: "Value (₹)", render: (r) => currency(r.invoice_value) },
        { header: "GST (₹)", render: (r) => currency(r.gst_amount) },
        {
          header: "Received Date",
          render: (r) =>
            r.received_date
              ? new Date(r.received_date).toLocaleDateString("en-GB")
              : "-",
        },
      ]}
      rows={monthDetails.actualIncomeItems}
    />
  </div>

  {/* Forecast Income */}
  <div style={{ flex: 1, maxHeight: 300, overflow: "auto" }}>
    <SectionTable
      title="Forecasted Income (Due + Project)"
      columns={[
        { header: "Project", render: (r) => r.projectName || r.project_id },
        { header: "Invoice No", render: (r) => r.invoice_number },
        {
          header: "Value (₹)",
          render: (r) => currency(r.invoice_value || r.amount),
        },
        { header: "GST (₹)", render: (r) => currency(r.gst_amount) },
        {
          header: "Due Date",
          render: (r) =>
            r.due_date
              ? new Date(r.due_date).toLocaleDateString("en-GB")
              : "-",
        },
      ]}
      rows={monthDetails.forecastIncomeItems}
    />
  </div>
</div>


{/* === 2nd Row: Expense Tables === */}
<div
  style={{
    display: "flex",
    gap: "20px",
    marginTop: "20px",
  }}
>
  {/* Actual Expenses */}
  <div style={{ flex: 1, maxHeight: 300, overflow: "auto" }}>
    <SectionTable
      title="Actual Expenses (Paid)"
      columns={[
        { header: "Expense", render: (r) => r.expense_type },
        {
          header: "Paid Amount (₹)",
          render: (r) => currency(r.amount || r.paid_amount),
        },
        {
          header: "Paid Date",
          render: (r) =>
            r.paid_date
              ? new Date(r.paid_date).toLocaleDateString("en-GB")
              : "-",
        },
      ]}
      rows={monthDetails.actualExpenseItems}
    />
  </div>

  {/* Forecasted Expenses */}
  <div style={{ flex: 1, maxHeight: 300, overflow: "auto" }}>
    <SectionTable
      title="Forecasted Expenses"
      columns={[
        { header: "Expense", render: (r) => r.type },
        { header: "Amount (₹)", render: (r) => currency(r.amount) },
        { header: "Regular", render: (r) => r.regular || "-" },
        {
          header: "Due Date",
          render: (r) =>
            r.due_date
              ? new Date(r.due_date).toLocaleDateString("en-GB")
              : "-",
        },
      ]}
      rows={monthDetails.forecastExpenseItems}
    />
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