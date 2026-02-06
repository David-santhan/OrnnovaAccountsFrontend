import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Box,
  Button,
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
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import "dayjs/locale/en-gb";

// Date Pickers (must be at top)
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// DayJS
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);

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
            {(!rows || rows.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    fontWeight: 600,
                    color: "#6b7280",
                    fontSize: "0.9rem",
                  }}
                >
                  No data available
                </TableCell>
              </TableRow>
            )}

            {rows &&
              rows.length > 0 &&
              rows.map((row, rIdx) => (
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
  const [monthlyAccBalance, setMonthlyAccBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);
  const [appliedStart, setAppliedStart] = useState(null);
  const [appliedEnd, setAppliedEnd] = useState(null);
  const [incomeStatusFilter, setIncomeStatusFilter] = useState("All");
  const [expenseStatusFilter, setExpenseStatusFilter] = useState("All");
  const [loadingDialog, setLoadingDialog] = useState(false);

  // Date range state for dialog filter (two DatePickers)
  const [rangeStart, setRangeStart] = useState(null); // dayjs
  const [rangeEnd, setRangeEnd] = useState(null); // dayjs

  // Start with empty months so UI is empty until user selects and clicks Search
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

 const fetchForecast = async () => {
  try {
    setLoading(true);
    const res = await axios.get("http://localhost:7760/forecast");
    const data = res.data || {};
    setFullData(data);     // keep state for later
    return data;           // 🔑 RETURN DATA
  } catch (err) {
    console.error("fetchForecast error", err);
    setError("Failed to load forecast from server");
    return null;
  } finally {
    setLoading(false);
  }
};

const getExpenseFinalAmount = (exp) => {
  if (exp.status === "Paid") {
    return Number(exp.paid_amount || 0);
  }
  return Number(exp.amount || 0);
};


  // NOTE: intentionally do NOT auto-fetch on mount. User must pick range + click Search.
  // If you'd like to prefetch in background uncomment next line:
  // useEffect(() => { fetchForecast(); }, []);

  const handleSearch = async () => {
    // validation
    if (!fromMonth) {
      alert("Please select From month");
      return;
    }
    if (!toMonth) {
      alert("Please select To month");
      return;
    }
    if (fromMonth > toMonth) {
      alert("From month must be before or equal to To month");
      return;
    }

    try {
      setLoading(true);
let data = fullData;

if (!data) {
  data = await fetchForecast(); // ✅ get fresh data
}

const months = data?.months || [];

if (!Array.isArray(months) || months.length === 0) {
  alert("No forecast data available from server.");
  setSummary([]);
  setFiltered([]);
  return;
}

      if (!Array.isArray(months) || months.length === 0) {
        alert("No forecast data available from server.");
        setSummary([]);
        setFiltered([]);
        return;
      }

      const s = months
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

      const out = s.filter((row) => row.month >= fromMonth && row.month <= toMonth);
      setFiltered(out);

      // fetch monthly last balances
      try {
        const res = await axios.get("http://localhost:7760/monthly-last-balances", {
          params: { month: fromMonth },
        });
        const lastBalance = res.data.data?.[0]?.updated_balance || 0;
        setMonthlyAccBalance(lastBalance);
      } catch (e) {
        console.warn("Failed to fetch monthly-last-balances", e);
        setMonthlyAccBalance(0);
      }

      // clear previous selected month & dialog
      setSelectedMonth(null);
      setDialogOpen(false);
    } catch (err) {
      console.error("handleSearch error", err);
      alert("Failed to fetch forecast or balance");
    } finally {
      setLoading(false);
    }

  };

  // When dialog opens for a month, default the date range to that month's first->last day
  useEffect(() => {
    if (dialogOpen && selectedMonth) {
      const start = dayjs(selectedMonth + "-01").startOf("day");
      const end = start.endOf("month").endOf("day");
      setRangeStart(start);
      setRangeEnd(end);
      setSelectedCategory(null);
    } else {
      setRangeStart(null);
      setRangeEnd(null);
    }
    
  }, [dialogOpen, selectedMonth]);

  // ---------- DEBUG: quick log to see month details when dialog opens ----------
  useEffect(() => {
    if (selectedMonth && fullData) {
      const md = fullData.months?.find((m) => m.month === selectedMonth);
      // console.log("DEBUG monthDetails for", selectedMonth, md);
    }
  }, [selectedMonth, fullData]);

  const monthDetails = useMemo(() => {
    if (!fullData || !Array.isArray(fullData.months) || !selectedMonth) return null;
    return fullData.months.find((m) => m.month === selectedMonth) || null;
  }, [fullData, selectedMonth]);

  // Build merged income (ACTUAL + FORECAST)
  const mergedIncome = useMemo(() => {
    if (!monthDetails) return [];

    const actual = monthDetails.actualIncomeItems || [];
    const forecast = monthDetails.forecastIncomeItems || [];

    return forecast.map((f) => {
      let match =
        actual.find((a) => a.invoice_number === f.invoice_number) ||
        actual.find(
          (a) =>
            a.project_id === f.project_id &&
            Number(a.invoice_value || 0) === Number(f.invoice_value || f.amount || 0)
        );

      const isReceived = !!match;

      const finalReceivedDate = match?.received_date || null;
      const finalDueDate = f.due_date || null;

      // IMPORTANT FIX → fallback date for filtering
      const finalFilterDate =
        finalReceivedDate ||
        finalDueDate ||
        f.invoice_date ||
        `${selectedMonth}-01`; // always safe

      return {
        ...f,
        status: isReceived ? "Received" : "Not Received",
        received_date: finalReceivedDate,
        due_date: finalDueDate,
        filter_date: finalFilterDate,
        invoice_value: Number(
          f.invoice_value || f.amount || f.total_with_gst || 0
        ),
      };
    });
  }, [monthDetails, selectedMonth]);

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

  const addedExpenseIds = new Set();

  // ---------- Build merged EXPENSES (Actual + Forecast) ----------
//   const mergedExpenses = useMemo(() => {
//     if (!monthDetails) return [];

//     const actual = monthDetails.actualExpenseItems || []; // actual paid rows (from backend)
//     const forecast = monthDetails.forecastExpenseItems || []; // forecast / expected rows (from backend)

//     // map actual payments by expense_id for quick lookup
//     const actualById = new Map();
//     actual.forEach((a) => {
//       if (a.expense_id != null) actualById.set(String(a.expense_id), a);
//     });

//     // also index actual rows by type+amount as a fallback (helps when expense_id not present)
//     const actualByTypeAmount = {};
//     actual.forEach((a) => {
//       const key = `${String(a.expense_type || a.type || "").trim().toLowerCase()}|${Number(
//         a.amount || a.paid_amount || 0
//       )}`;
//       (actualByTypeAmount[key] ||= []).push(a);
//     });

//     const merged = [];
// const isInsurance = (type) => getCategory(type) === "Insurance";

//     // CATEGORY DETECTION (Salary, PF, TDS, PT, Insurance)
// const MAIN = ["Salary", "PF", "Insurance", "PT", "TDS"];

// const getCategory = (type) => {
//   if (!type) return "Others";

//   let cat = type.split(" - ")[0].trim();

//   if (cat.toLowerCase() === "professional tax") return "PT";

//   return MAIN.includes(cat) ? cat : type;
// };

//     // 1) Add ALL forecast rows (no collapsing). If there's a matching actual by id -> merge paid info,
//     // but only expose paid_amount/paid_date when the payment is actually paid.
//     // forecast.forEach((f) => {
//     //   const fid = f.expense_id != null ? String(f.expense_id) : null;

//     //   // try expense_id match
//     //   let match = fid ? actualById.get(fid) : undefined;

//     //   // fallback: try by type+amount (some actual rows may lack expense_id)
//     //   if (!match) {
//     //     const key = `${String(f.type || "").trim().toLowerCase()}|${Number(f.amount || f.paid_amount || 0)}`;
//     //     const list = actualByTypeAmount[key] || [];
//     //     match = list.length ? list[0] : undefined;
//     //   }

//     //   // determine candidate paid amount/date from match (use sensible fallbacks)
//     //   const candidatePaidAmount =
//     //     match?.paid_amount != null
//     //       ? Number(match.paid_amount)
//     //       : match?.actual_amount != null
//     //       ? Number(match.actual_amount)
//     //       : f.paid_amount != null
//     //       ? Number(f.paid_amount)
//     //       : 0;

//     //   let candidatePaidDate = match?.paid_date ?? f.paid_date ?? null;
//     //   if (!candidatePaidDate && match?.month_year) {
//     //     candidatePaidDate = `${String(match.month_year).slice(0, 7)}-01`;
//     //   }

//     //   const statusFromMatch = match?.status ? String(match.status).trim().toLowerCase() : null;

//     //   // STRICT isPaid: require (paid_amount > 0 AND paid_date exists) OR explicit status === 'paid'
//     //   const isPaid = (candidatePaidAmount > 0 && candidatePaidDate) || statusFromMatch === "paid";

//     //   // status shown in UI: prefer explicit paid marker, otherwise use forecast status or Not Paid
//     //   const status = isPaid ? "Paid" : f.status || (statusFromMatch ? (statusFromMatch === "paid" ? "Paid" : "Unpaid") : "Not Paid");

//     //   merged.push({
//     //     expense_id: f.expense_id,
//     //     type: f.type,
//     //     description: f.description,
//     //     regular: f.regular ?? "No",
//     //     amount: Number(f.amount ?? f.paid_amount ?? 0),
//     //     paid_amount: isPaid ? Number(candidatePaidAmount || 0) : 0,
//     //     paid_date: isPaid ? (candidatePaidDate ?? null) : null,
//     //     status,
//     //     actual_amount: match ? (match.amount ?? match.paid_amount ?? match.actual_amount ?? 0) : 0,
//     //     _source: match ? "forecast+actual" : "forecast-only",
//     //     due_date: f.due_date ?? null,
//     //   });
//     // });

// //  forecast.forEach((f) => {
// //   const fid = f.expense_id != null ? String(f.expense_id) : null;
// //   const match = fid ? actualById.get(fid) : null;

// //   // ✅ FIXED CONDITION
// //   if (f.regular === "Yes" && match) {
// //     return; // skip forecast row if already paid
// //   }

// //   merged.push({
// //     expense_id: f.expense_id,
// //     type: f.type,
// //     description: f.description,
// //     regular: f.regular ?? "No",
// //     amount: Number(f.amount ?? 0),
// //     paid_amount: 0,
// //     paid_date: null,
// //     status: "Not Paid",
// //     actual_amount: 0,
// //     _source: "forecast-only",
// //     due_date: f.due_date ?? null,
// //   });
// // });

// // forecast.forEach((f) => {
// //   // ❌ Skip Insurance forecast (Insurance comes only from actual)
// //   if (getCategory(f.type) === "Insurance") return;

// //   const fid = f.expense_id != null ? String(f.expense_id) : null;
// //   const match = fid ? actualById.get(fid) : null;

// //   // ✅ Determine paid info from actual if exists
// //   const paidAmount =
// //     match?.paid_amount != null
// //       ? Number(match.paid_amount)
// //       : match?.actual_amount != null
// //       ? Number(match.actual_amount)
// //       : 0;

// //   let paidDate = match?.paid_date ?? null;
// //   if (!paidDate && match?.month_year) {
// //     paidDate = `${String(match.month_year).slice(0, 7)}-01`;
// //   }

// //   // const isPaid = paidAmount > 0 && paidDate;
// // const isPaid =
// //   match &&
// //   match.payment_month === selectedMonth &&
// //   paidAmount > 0;

// //   merged.push({
// //     expense_id: f.expense_id,
// //     type: f.type,
// //     description: f.description,
// //     regular: f.regular ?? "No",
// //     amount: Number(f.amount ?? 0),

// //     // ✅ PAID fields correctly populated
// //     paid_amount: isPaid ? paidAmount : 0,
// //     paid_date: isPaid ? paidDate : null,
// //     status: isPaid ? "Paid" : "Not Paid",

// //     actual_amount: isPaid ? paidAmount : 0,
// //     _source: match ? "forecast+actual" : "forecast-only",
// //     due_date: f.due_date ?? null,
// //   });
// // });
// forecast.forEach((f) => {
//   // ❌ Skip Insurance forecast (Insurance comes only from actual)
//   if (getCategory(f.type) === "Insurance") return;

//   const fid = f.expense_id != null ? String(f.expense_id) : null;
//   const match = fid ? actualById.get(fid) : null;

//   // ✅ Month-aware payment check (CRITICAL FIX)
//   const isPaid =
//     match &&
//     match.payment_month === selectedMonth &&
//     Number(match.paid_amount || match.actual_amount || 0) > 0;

//   // ✅ Paid values ONLY if paid in this month
//   const paidAmount = isPaid
//     ? Number(match.paid_amount || match.actual_amount || 0)
//     : 0;

//   const paidDate = isPaid
//     ? match.paid_date ||
//       (match.month_year
//         ? `${String(match.month_year).slice(0, 7)}-01`
//         : null)
//     : null;

//   merged.push({
//     expense_id: f.expense_id,
//     type: f.type,
//     description: f.description,
//     regular: f.regular ?? "No",
//     amount: Number(f.amount ?? 0),

//     // ✅ CORRECT & SAFE
//     paid_amount: paidAmount,
//     paid_date: paidDate,
//     status: isPaid ? "Paid" : "Not Paid",

//     actual_amount: isPaid ? paidAmount : 0,
//     _source: match ? "forecast+actual" : "forecast-only",
//     due_date: f.due_date ?? null,
//   });
// });

  
// // 2) Append any actual-only rows that were not in forecast (show them too)
//     // actual.forEach((a) => {
//     //   const exists = merged.some(
//     //     (m) =>
//     //       m.expense_id != null &&
//     //       a.expense_id != null &&
//     //       String(m.expense_id) === String(a.expense_id)
//     //   );

//     //   if (!exists) {
//     //     // normalize paid_date similarly
//     //     let paidDate = a.paid_date ?? null;
//     //     if (!paidDate && a.month_year) paidDate = `${String(a.month_year).slice(0, 7)}-01`;

//     //     const paidAmt =
//     //       a.paid_amount != null
//     //         ? Number(a.paid_amount)
//     //         : a.actual_amount != null
//     //         ? Number(a.actual_amount)
//     //         : Number(a.amount ?? 0);
//     //     const statusFromA = a.status ? String(a.status).trim().toLowerCase() : null;
//     //     const isPaidA = (paidAmt > 0 && paidDate) || statusFromA === "paid";

//     //     merged.push({
//     //       expense_id: a.expense_id,
//     //       type: a.expense_type || a.type || "Other",
//     //       description: a.description,
//     //       regular: a.regular ?? "No",
//     //       amount: Number(a.amount ?? a.paid_amount ?? 0),
//     //       paid_amount: isPaidA ? paidAmt : 0,
//     //       paid_date: isPaidA ? paidDate : null,
//     //       status: isPaidA ? "Paid" : a.status ?? "Not Paid",
//     //       actual_amount: Number(a.amount ?? a.paid_amount ?? a.actual_amount ?? 0),
//     //       _source: "actual-only",
//     //       due_date: a.due_date ?? null,
//     //     });
//     //   }
//     // });
// actual.forEach((a) => {
//   if (isInsurance(a.expense_type || a.type)) return;

//   const exists =
//     a.expense_id != null &&
//     addedExpenseIds.has(String(a.expense_id));

//   if (!exists) {
//     merged.push({
//       expense_id: a.expense_id,
//       type: a.expense_type || a.type || "Other",
//       description: a.description,
//       regular: a.regular ?? "No",
//       amount: Number(a.amount ?? a.paid_amount ?? 0),
//       paid_amount: Number(a.paid_amount ?? 0),
//       paid_date: a.paid_date ?? null,
//       status: "Paid",
//       actual_amount: Number(a.amount ?? a.paid_amount ?? 0),
//       _source: "actual-only",
//       due_date: a.due_date ?? null,
//     });
//   }
// });


//     return merged;
//   }, [monthDetails]);

const mergedExpenses = useMemo(() => {
  if (!monthDetails) return [];

  const actual = monthDetails.actualExpenseItems || [];
  const forecast = monthDetails.forecastExpenseItems || [];

  // ✅ Just combine — backend already filtered by month
  return [...actual, ...forecast];
}, [monthDetails]);


  // CATEGORY DETECTION (Salary, PF, TDS, PT, Insurance)
  const MAIN = ["Salary", "PF", "Insurance", "PT", "TDS"];

  const getCategory = (type) => {
    if (!type) return "Others";

    let cat = type.split(" - ")[0].trim();

    if (cat.toLowerCase() === "professional tax") return "PT";

    return MAIN.includes(cat) ? cat : type;
  };

  // Build Category Totals (monthly)
  // const { categoryTotals, grandTotalExpenses } = useMemo(() => {
  //   const totals = {};
  //   (mergedExpenses || []).forEach((exp) => {
  //     const cat = getCategory(exp.type);
  //     if (!totals[cat]) totals[cat] = 0;
  //     const finalAmount = exp.actual_amount ? exp.actual_amount : exp.amount;
  //     totals[cat] += Number(finalAmount || 0);
  //   });

  //   return {
  //     categoryTotals: totals,
  //     grandTotalExpenses: Object.values(totals).reduce((a, b) => a + b, 0),
  //   };
  // }, [mergedExpenses]);
const { categoryTotals, grandTotalExpenses } = useMemo(() => {
  const totals = {};
  (mergedExpenses || []).forEach((exp) => {
    const cat = getCategory(exp.type);
    if (!totals[cat]) totals[cat] = 0;

    totals[cat] += getExpenseFinalAmount(exp);
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

  // ---------- DATE RANGE filtering helpers ----------
  const parseToDay = (d) => {
    if (!d) return null;
    if (dayjs.isDayjs(d)) return d.startOf("day");
    try {
      const s = String(d);
      if (/^\d{4}-\d{2}$/.test(s)) {
        return dayjs(s + "-01").startOf("day");
      }
      const parsed = dayjs(s);
      return parsed.isValid() ? parsed.startOf("day") : null;
    } catch {
      return null;
    }
  };

  const inRangeInclusive = (candidateStr, startDayjs, endDayjs) => {
    const candidate = parseToDay(candidateStr);
    if (!candidate) return false;
    if (!startDayjs && !endDayjs) return true;
    if (startDayjs && endDayjs) {
      return !candidate.isBefore(startDayjs.startOf("day")) && !candidate.isAfter(endDayjs.endOf("day"));
    }
    if (startDayjs) return !candidate.isBefore(startDayjs.startOf("day"));
    if (endDayjs) return !candidate.isAfter(endDayjs.endOf("day"));
    return true;
  };

  const filteredIncome = useMemo(() => {
    if (!mergedIncome) return [];

    return mergedIncome.filter((item) => {
      const dateStr = item.filter_date;
      if (!dateStr) return false;

      const d = dayjs(dateStr);
      if (!d.isValid()) return false;

      const afterStart = !appliedStart || !d.isBefore(appliedStart, "day");
      const beforeEnd = !appliedEnd || !d.isAfter(appliedEnd, "day");
      if (!(afterStart && beforeEnd)) return false;

      if (incomeStatusFilter === "All") return true;
      if (incomeStatusFilter === "Received") return item.status === "Received";
      if (incomeStatusFilter === "Not Received") return item.status !== "Received";

      return true;
    });
  }, [mergedIncome, appliedStart, appliedEnd, incomeStatusFilter]);

  // const filteredExpenses = useMemo(() => {
  //   if (!mergedExpenses) return [];

  //   return mergedExpenses.filter((exp) => {
  //     // const dateStr = exp.status === "Paid" ? exp.paid_date : exp.due_date;
  //     const dateStr =
  // exp.status === "Paid"
  //   ? exp.paid_date || exp.due_date   // ✅ fallback added
  //   : exp.due_date;

  //     if (!dateStr) return false;

  //     const d = dayjs(dateStr);
  //     if (!d.isValid()) return false;

  //     const afterStart = !appliedStart || !d.isBefore(appliedStart, "day");
  //     const beforeEnd = !appliedEnd || !d.isAfter(appliedEnd, "day");

  //     if (!(afterStart && beforeEnd)) return false;

  //     if (expenseStatusFilter === "All") return true;
  //     if (expenseStatusFilter === "Paid") return exp.status === "Paid";
  //     if (expenseStatusFilter === "Not Paid") return exp.status !== "Paid";

  //     return true;
  //   });
  // }, [mergedExpenses, appliedStart, appliedEnd, expenseStatusFilter]);

  // Summaries computed from filtered lists
  
  const filteredExpenses = useMemo(() => {
  if (!mergedExpenses) return [];

  return mergedExpenses.filter((exp) => {
    // const dateStr =
    //   exp.status === "Paid"
    //     ? exp.paid_date || exp.due_date
    //     : exp.due_date;
const dateStr =
  exp.status === "Paid"
    ? exp.paid_date || exp.due_date
    : exp.due_date || `${selectedMonth}-01`;

    if (!dateStr) return false;

    const d = dayjs(dateStr);
    if (!d.isValid()) return false;

    const afterStart = !appliedStart || !d.isBefore(appliedStart, "day");
    const beforeEnd  = !appliedEnd   || !d.isAfter(appliedEnd, "day");

    if (!(afterStart && beforeEnd)) return false;

    if (expenseStatusFilter === "All") return true;
    if (expenseStatusFilter === "Paid") return exp.status === "Paid";
    if (expenseStatusFilter === "Not Paid") return exp.status !== "Paid";

    return true;
  });
}, [mergedExpenses, appliedStart, appliedEnd, expenseStatusFilter]);

  const dateRangeIncomeSummary = useMemo(() => {
    const records = filteredIncome || [];
    let receivedCount = 0;
    let notReceivedCount = 0;
    let totalValue = 0;
    let totalReceivedValue = 0;
    let totalNotReceivedValue = 0;
    let totalGST = 0;

    records.forEach((r) => {
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
  }, [filteredIncome]);

  // const dateRangeExpenseSummary = useMemo(() => {
  //   const records = filteredExpenses || [];
  //   let paidCount = 0;
  //   let notPaidCount = 0;
  //   let totalExpense = 0;
  //   let totalPaidAmount = 0;
  //   let totalNotPaidAmount = 0;

  //   records.forEach((exp) => {
  //     const amount = Number(exp.amount || 0);
  //     totalExpense += amount;
  //     if (exp.status === "Paid") {
  //       paidCount++;
  //       totalPaidAmount += amount;
  //     } else {
  //       notPaidCount++;
  //       totalNotPaidAmount += amount;
  //     }
  //   });

  //   return {
  //     paidCount,
  //     notPaidCount,
  //     totalExpense,
  //     totalPaidAmount,
  //     totalNotPaidAmount,
  //   };
  // }, [filteredExpenses]);

  // Category totals from filtered expenses
  // const { dateCategoryTotals, dateGrandTotalExpenses } = useMemo(() => {
  //   const totals = {};
  //   (filteredExpenses || []).forEach((exp) => {
  //     const cat = getCategory(exp.type);
  //     if (!totals[cat]) totals[cat] = 0;
  //     const finalAmount = exp.actual_amount ? exp.actual_amount : exp.amount;
  //     totals[cat] += Number(finalAmount || 0);
  //   });

  //   return {
  //     dateCategoryTotals: totals,
  //     dateGrandTotalExpenses: Object.values(totals).reduce((a, b) => a + b, 0),
  //   };
  // }, [filteredExpenses]);

const dateRangeExpenseSummary = useMemo(() => {
  let paidCount = 0;
  let notPaidCount = 0;
  let totalExpense = 0;
  let totalPaidAmount = 0;
  let totalNotPaidAmount = 0;

  (filteredExpenses || []).forEach((exp) => {
    const finalAmount = getExpenseFinalAmount(exp);

    totalExpense += finalAmount;

    if (exp.status === "Paid") {
      paidCount++;
      totalPaidAmount += finalAmount;
    } else {
      notPaidCount++;
      totalNotPaidAmount += finalAmount;
    }
  });

  return {
    paidCount,
    notPaidCount,
    totalExpense,
    totalPaidAmount,
    totalNotPaidAmount,
  };
}, [filteredExpenses]);

  const { dateCategoryTotals, dateGrandTotalExpenses } = useMemo(() => {
  const totals = {};
  (filteredExpenses || []).forEach((exp) => {
    const cat = getCategory(exp.type);
    if (!totals[cat]) totals[cat] = 0;

    totals[cat] += getExpenseFinalAmount(exp);
  });

  return {
    dateCategoryTotals: totals,
    dateGrandTotalExpenses: Object.values(totals).reduce((a, b) => a + b, 0),
  };
}, [filteredExpenses]);

  // Acc Balance Calculation (unchanged main view)
  const safeNumber = (v) => Number(v || 0);

  const sorted = [...filtered].sort((a, b) => new Date(a.month) - new Date(b.month));

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
      <Typography variant="h5" align="center" style={{ marginBottom: 20, fontWeight: 700, color: "#1e3a8a" }}>
        📅 Forecast — Month-wise Summary
      </Typography>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
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

      {/* If filtered is empty show helpful message */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "#667085" }}>
          <Typography variant="body1">No data — select a From and To month and click Search.</Typography>
        </Box>
      ) : (
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
                  <TableCell key={i} style={{ backgroundColor: "#e2e8f0", fontWeight: 700 }}>
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
                  <TableCell style={{ fontWeight: 600, color: row.monthlyBalance >= 0 ? "green" : "red" }}>
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
                      onClick={async () => {
                        setLoadingDialog(true);

                        // set selected month first so dialog content can find it
                        setSelectedMonth(row.month);
                        setDialogOpen(true);

                        // ensure forecast loaded (rare case)
                        if (!fullData) {
                          await fetchForecast();
                        }

                        // brief pause for UX
                        await new Promise((res) => setTimeout(res, 200));
                        setLoadingDialog(false);
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
      )}

      {/* DIALOG */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xl">
        <DialogTitle>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Details — {formatMonthLabel(selectedMonth)}</span>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent dividers sx={{ position: "relative", minHeight: "520px" }}>
          {loadingDialog && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(3px)",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress size={60} thickness={4} />
              <Typography sx={{ mt: 2, fontWeight: 600, color: "#1e40af" }}>Processing data…</Typography>
            </Box>
          )}

          {!loadingDialog && (
            <>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, #eef2ff, #f5f3ff)",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: "#3730a3" }}>Filter By Date:</Typography>

                  <DatePicker
                    label="From"
                    value={rangeStart}
                    minDate={dayjs(selectedMonth + "-01").startOf("month")}
                    maxDate={dayjs(selectedMonth + "-01").endOf("month")}
                    onChange={(newValue) => setRangeStart(newValue ? dayjs(newValue).startOf("day") : null)}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: { minWidth: 170 },
                      },
                    }}
                  />

                  <DatePicker
                    label="To"
                    value={rangeEnd}
                    minDate={dayjs(selectedMonth + "-01").startOf("month")}
                    maxDate={dayjs(selectedMonth + "-01").endOf("month")}
                    onChange={(newValue) => setRangeEnd(newValue ? dayjs(newValue).endOf("day") : null)}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: { minWidth: 170 },
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#4338ca",
                      textTransform: "none",
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 700,
                      ":hover": { bgcolor: "#3730a3" },
                    }}
                    onClick={() => {
                      setAppliedStart(rangeStart);
                      setAppliedEnd(rangeEnd);
                    }}
                  >
                    Search
                  </Button>
                </Box>
              </LocalizationProvider>

              {/* INCOME SUMMARY */}
              <Box sx={{ width: "50%" }}>
                {dateRangeIncomeSummary && (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 2 }}>
                    <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: "#e8f5e9", textAlign: "center" }}>
                      <h5 style={{ margin: 0, color: "green", fontSize: "13px" }}>✔ Received</h5>
                      <table style={{ width: "100%", fontSize: "12px" }}>
                        <tbody>
                          <tr>
                            <td>Count</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{dateRangeIncomeSummary.receivedCount}</td>
                          </tr>
                          <tr>
                            <td>Amount</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{currency(dateRangeIncomeSummary.totalReceivedValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>

                    <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: "#ffebee", textAlign: "center" }}>
                      <h5 style={{ margin: 0, color: "red", fontSize: "13px" }}>✖ Not Received</h5>
                      <table style={{ width: "100%", fontSize: "12px" }}>
                        <tbody>
                          <tr>
                            <td>Count</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{dateRangeIncomeSummary.notReceivedCount}</td>
                          </tr>
                          <tr>
                            <td>Amount</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{currency(dateRangeIncomeSummary.totalNotReceivedValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>

                    <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: "#e3f2fd", textAlign: "center" }}>
                      <h5 style={{ margin: 0, fontSize: "13px" }}>Total</h5>
                      <table style={{ width: "100%", fontSize: "12px" }}>
                        <tbody>
                          <tr>
                            <td>Total</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{currency(dateRangeIncomeSummary.totalValue)}</td>
                          </tr>
                          <tr>
                            <td>GST</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>- {currency(dateRangeIncomeSummary.totalGST)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, borderTop: "1px solid #c3d5f5" }}>Final</td>
                            <td style={{ textAlign: "right", fontWeight: 700, borderTop: "1px solid #c3d5f5" }}>
                              {currency(dateRangeIncomeSummary.totalValue - dateRangeIncomeSummary.totalGST)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* INCOME TABLE */}
              {monthDetails && (
                <SectionTable
                  title="Income Overview (Actual + Forecast)"
                  columns={[
                    { header: "Project", render: (r) => r.projectName || r.project_id },
                    { header: "Invoice No", render: (r) => r.invoice_number },
                    { header: "Value (₹)", render: (r) => currency(r.invoice_value || r.amount) },
                    { header: "GST (₹)", render: (r) => currency(r.gst_amount) },
                    {
                      header: "Date",
                      render: (r) => (r.received_date ? new Date(r.received_date).toLocaleDateString("en-GB") : r.due_date ? new Date(r.due_date).toLocaleDateString("en-GB") : "-"),
                    },
                    {
                      header: "Status",
                      render: (r) => (r.status === "Received" ? <span style={{ color: "green", fontWeight: 700 }}>✔ Received</span> : <span style={{ color: "red", fontWeight: 700 }}>✖ Not Received</span>),
                    },
                  ]}
                  rows={mergedIncome}
                />
              )}

              {/* EXPENSES SUMMARY + TABLE */}
              <Box sx={{ width: "50%" }}>
                {dateRangeExpenseSummary && (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 2, mt: 2 }}>
                    <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: "#e8f5e9", textAlign: "center" }}>
                      <h5 style={{ margin: 0, color: "green", fontSize: "13px", marginBottom: "4px" }}>✔ Paid</h5>
                      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Count</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{dateRangeExpenseSummary.paidCount}</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Amount</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{currency(dateRangeExpenseSummary.totalPaidAmount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>

                    <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: "#ffebee", textAlign: "center" }}>
                      <h5 style={{ margin: 0, color: "red", fontSize: "13px", marginBottom: "4px" }}>✖ Not Paid</h5>
                      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Count</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{dateRangeExpenseSummary.notPaidCount}</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Amount</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{currency(dateRangeExpenseSummary.totalNotPaidAmount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>

                    <Box sx={{ p: 1.2, borderRadius: 1.5, bgcolor: "#e3f2fd", textAlign: "center" }}>
                      <h5 style={{ margin: 0, fontSize: "13px", marginBottom: "4px" }}>Total Expenses</h5>
                      <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: "left", padding: "2px 4px" }}>Total</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{currency(dateRangeExpenseSummary.totalExpense)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                )}
              </Box>

              <div style={{ display: "inline-block", padding: "8px 18px", background: "linear-gradient(90deg, #dbeafe, #eff6ff)", borderRadius: "10px", fontWeight: 700, color: "#1e3a8a", fontSize: "1.1rem", boxShadow: "0 3px 6px rgba(0,0,0,0.08)" }}>
                {`Expenses — ${formatMonthLabel(selectedMonth)}`}
              </div>

              <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
                <div style={{ width: "28%" }}>
                  <TableContainer component={Paper} sx={{ maxHeight: 430, overflowX: "auto", borderRadius: "12px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", border: "1px solid #e1e1e1" }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow style={{ backgroundColor: "#f0f2ff" }}>
                          <TableCell colSpan={2} style={{ fontWeight: 800, fontSize: "15px", color: "#3071a3", padding: "14px", textAlign: "center", fontFamily: "monospace" }}>
                           TOTAL — {currency(grandTotalExpenses)}

                          </TableCell>
                        </TableRow>

                        <TableRow style={{ backgroundColor: "#f7f7fb" }}>
                          <TableCell style={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell style={{ fontWeight: 700, textAlign: "right" }}>Total</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {Object.keys(dateCategoryTotals).map((cat) => (
                          <TableRow key={cat} hover sx={{ cursor: "pointer", backgroundColor: selectedCategory === cat ? "rgba(99,102,241,0.1)" : "white", "&:hover": { backgroundColor: "rgba(99,102,241,0.08)" } }} onClick={() => setSelectedCategory(cat)}>
                            <TableCell>
                              <span style={{ padding: "4px 8px", backgroundColor: "rgba(99,102,241,0.12)", borderRadius: "8px", fontSize: "13px", color: "#4f46e5", fontWeight: 600 }}>{cat}</span>
                            </TableCell>

                            <TableCell style={{ fontWeight: 700, textAlign: "right" }}>{currency(dateCategoryTotals[cat])}</TableCell>
                          </TableRow>
                        ))}

                        <TableRow hover sx={{ cursor: "pointer", backgroundColor: "#eef5ff", "&:hover": { backgroundColor: "#dce8ff" } }} onClick={() => setSelectedCategory("")}>
                          <TableCell colSpan={2} style={{ textAlign: "center", fontWeight: 700 }}>Show All</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>

                <div style={{ width: "72%" }}>
                  <TableContainer component={Paper} sx={{ maxHeight: 430, overflowX: "auto", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.1)", border: "1px solid #e3e3e3" }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow style={{ backgroundColor: "#f7f7fb" }}>
                          <TableCell>Regular</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Paid Amount</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                              <span>Status</span>

                              <select value={expenseStatusFilter} onChange={(e) => setExpenseStatusFilter(e.target.value)} style={{ marginTop: 4, padding: "2px 6px", fontSize: "0.75rem", borderRadius: 6, border: "1px solid #ccc" }}>
                                <option value="All">All</option>
                                <option value="Paid">Paid</option>
                                <option value="Not Paid">Not Paid</option>
                              </select>
                            </Box>
                          </TableCell>

                          <TableCell>Paid Date</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {filteredExpenses
                          .filter((exp) => {
                            if (!selectedCategory) return true;

                            const cat = getCategory(exp.type);

                            if (["Salary", "PF", "Insurance", "PT", "TDS"].includes(selectedCategory)) {
                              return cat === selectedCategory;
                            }

                            return exp.type === selectedCategory;
                          })
                          .map((exp, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{exp.regular || "-"}</TableCell>

                              <TableCell>
                                <span style={{ padding: "4px 10px", backgroundColor: "rgba(99,102,241,0.12)", borderRadius: "8px", color: "#4f46e5", fontWeight: 600 }}>{exp.type}</span>
                              </TableCell>

                              <TableCell>{currency(exp.amount)}</TableCell>

                              <TableCell>{currency(exp.paid_amount ?? exp.actual_amount ?? 0)}</TableCell>

                              <TableCell>{fmtDate(exp.due_date)}</TableCell>

                              <TableCell style={{ fontWeight: 700, color: exp.status === "Paid" ? "green" : "red" }}>{exp.status}</TableCell>

                              <TableCell>{exp.paid_date ? fmtDate(exp.paid_date) : "-"}</TableCell>
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
          <Button onClick={() => setDialogOpen(false)} style={{ backgroundColor: "#1e3a8a", color: "white", borderRadius: 6, textTransform: "none", padding: "6px 20px" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

