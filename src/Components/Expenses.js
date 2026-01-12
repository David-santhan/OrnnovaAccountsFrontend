// Expenses.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Box,
  Fab,
  Snackbar,
  Alert,
  FormControl,
  Select,
  InputLabel,
  Divider,
  Link,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EditIcon from "@mui/icons-material/Edit";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

const Expenses = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [filterRegular, setFilterRegular] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showTotal, setShowTotal] = useState(false);
  const [totalExpense, setTotalExpense] = useState(0);
  const today = new Date().toISOString().split("T")[0];
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [updateExpense, setUpdateExpense] = useState(null);
  const [holdExpense, setHoldExpense] = useState(null);
  const [openHoldDialog, setOpenHoldDialog] = useState(false);
  const [loading, setLoading] = useState(false);

const [selectedMonthYearInput, setSelectedMonthYearInput] = useState("");
  const [newExpense, setNewExpense] = useState({
    regular: "",
    type: "",
    description: "",
    amount: "",
    currency: "INR",
    raised_date: today,
    // status:"Raised"
  });
  const [expenses, setExpenses] = useState([]);
  const [filteredexpenses, setFilteredExpenses] = useState([]);

  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [payExpense, setPayExpense] = useState(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidAmount, setPaidAmount] = useState("");
  const [monthYear, setMonthYear] = useState("");

  const expenseOptions = [
    "Loan",
    "TDS On Salaries",
    "TDS On Consultancies",
    "Rent",
    "Marketing Exp",
    "PNB Loan",
    "ICICI Car Loan",
    "Bajaj Loan",
    "PF",
    "ESI",
    "PT",
    "Bescom Bill",
    "BWSSB Bill",
    "Petty Cash",
    "Credit Card Charges",
    "GST",
    "Office Stationary",
    "Reimbursements",
    "Incentives",
    "Mobile",
    "Expense",
    "Proarch",
    "GRT Payment",
    "Auditor BS charges",
    "Airtel",
    "Employee Salaries ",
    "Varsha Stationery",
    "Exit Employee Salaries",
    "Consultant for Salaries",
    "Pending Salaries",
    "Insurence",
  ];
  const [filterStatus, setFilterStatus] = useState("all");

  // Format currency helper
  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);

  /*
    fetchExpenses:
    - Accepts optional monthParam
    - Defaults to selectedMonthYear if no param passed
    - Always sets expenses state and RETURNS the fetched array
    - If no month available returns []
  */
 const fetchExpenses = async (monthParam) => {
  try {
    const monthToUse = monthParam || selectedMonthYear;
    if (!monthToUse) return [];

    setLoading(true); // 🔥 START LOADER

    const res = await axios.get("http://localhost:7760/getexpenses", {
      params: { month: monthToUse },
    });

    const data = res.data || [];
    setExpenses(data);
    return data;
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return [];
  } finally {
    setLoading(false); // 🔥 STOP LOADER
  }
};

  // Fetch expenses initially when user picks month — keep mount minimal
  useEffect(() => {
    // do not auto fetch without month selection — preserve your previous behavior
  }, []);

  const handleAddExpense = async () => {
  try {
    // Normalize and validate newExpense client-side
    const payload = {
      ...newExpense
    };

    // Ensure required default values exist
    payload.regular = payload.regular && (payload.regular === "Yes" || payload.regular === "No") ? payload.regular : "No";
    payload.currency = payload.currency || "INR";

    // Normalize raised_date & due_date similarly to server (YYYY-MM or YYYY-MM-DD -> we send YYYY-MM-DD)
    const normDate = (d) => {
      if (!d) return null;
      if (/^\d{4}-\d{2}$/.test(d)) return `${d}-01`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
        const [dd, mm, yyyy] = d.split("-");
        return `${yyyy}-${mm}-${dd}`;
      }
      const parsed = new Date(d);
      if (!isNaN(parsed)) {
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, "0");
        const dd = String(parsed.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
      return null;
    };

    payload.raised_date = normDate(payload.raised_date) || normDate(today) || null;
    payload.due_date = normDate(payload.due_date) || payload.raised_date;

    // set a placeholder for paid_date column as your DB expects "00-00-0000" earlier (but better to keep null)
    payload.paid_date = payload.paid_date || null;

    // POST
    const resp = await axios.post("http://localhost:7760/postexpenses", payload);

    // Use the month the user selected in the Month control if present, else derive from raised_date.
    // Prefer selectedMonthYearInput (YYYY-MM) because that's what your get API expects.
    const monthUsed = selectedMonthYearInput || (payload.raised_date ? payload.raised_date.slice(0, 7) : selectedMonthYear);

    // REFRESH: fetch fresh data for the monthUsed and apply filters using the fresh array and monthUsed
    const refreshed = await fetchExpenses(monthUsed);
    handleApplyFilterWithData(refreshed, monthUsed);

    // Reset form + show success
    setNewExpense({
      regular: "",
      type: "",
      description: "",
      amount: "",
      currency: "INR",
      raised_date: today, // keep this format same as before
      due_date: "",
      status: "",
    });
    setOpenDialog(false);
    setSnackbarMessage("Expense added successfully!");
    setSnackbarOpen(true);
  } catch (err) {
    console.error("Error adding expense:", err);
    setSnackbarMessage("Failed to add expense.");
    setSnackbarOpen(true);
  }
};

 const handleMarkAsPaid = async (expenseId) => {
  if (!paidDate || !paidAmount) {
    alert("⚠️ Please enter both Paid Date and Amount Paid.");
    return;
  }

  const numericExpenseId = parseInt(expenseId.replace(/\D/g, ""), 10);

  const payload = {
    expense_id: numericExpenseId,
    paid_amount: Number(paidAmount),
    paid_date: paidDate,
  };

  try {
    const response = await axios.put(
      "http://localhost:7760/pay-expense",
      payload
    );

    // ✅ 1️⃣ IMMEDIATE UI UPDATE (THIS WAS MISSING)
   setFilteredExpenses((prev) =>
  prev.map((exp) =>
    exp.expense_id === numericExpenseId &&
    exp.month_year === selectedMonthYear
      ? {
          ...exp,
          paymentstatus: "Paid",
          paid_amount: Number(paidAmount),
          paid_date: paidDate,
          expensestatus: "Paid",
        }
      : exp
  )
);
    // Close modal
    setOpenPayDialog(false);
    setPayExpense(null);
    setPaidDate("");
    setPaidAmount("");

    setSnackbarMessage(
      response.data?.message || "Payment recorded successfully!"
    );
    setSnackbarOpen(true);

    // ✅ 2️⃣ BACKEND SYNC (SAFE REFRESH)
    const monthToUse = selectedMonthYear || selectedMonthYearInput;
    const refreshed = await fetchExpenses(monthToUse);
    handleApplyFilterWithData(refreshed);

  } catch (err) {
    console.error("❌ Error while paying expense:", err);
    alert(
      err.response?.data?.message ||
        "Something went wrong. Please try again."
    );
  }
};

// Open Pay modal and ensure amount is chosen from actual_to_pay OR amount
const openPayForExpense = (e, exp) => {
  // prevent table row click
  if (e && e.stopPropagation) e.stopPropagation();

  // Prefer actual_to_pay, then actual_amount (if some naming), then amount
  const amountToPay = Number(exp.actual_to_pay ?? exp.actual_amount ?? exp.amount ?? 0);

  setPayExpense({ ...exp, amount: amountToPay }); // ensure payExpense.amount exists
  setPaidDate(new Date().toISOString().split("T")[0]);
  setPaidAmount(amountToPay);
  setOpenPayDialog(true);
};

  // Updated filter function that accepts data
const handleApplyFilterWithData = (data, monthParam) => {
  let filtered = data || [];

  // ✅ determine month safely
  const monthToUse = monthParam || selectedMonthYear;

  // 🔹 Filter by Regular
  if (filterRegular !== "all") {
    filtered = filtered.filter((exp) => exp.regular === filterRegular);
  }

  // 🔹 Filter by Type
  if (filterType !== "all") {
    filtered = filtered.filter((exp) => exp.type === filterType);
  }
  // 🔹 Status filter
if (filterStatus !== "all") {
  filtered = filtered.filter((exp) => {
    const isPaid =
      exp.paymentstatus === "Paid" ||
      (exp.paid_amount > 0 && exp.paid_date);

    if (filterStatus === "Paid") {
      return isPaid;
    }

    if (filterStatus === "Raised") {
      return !isPaid;
    }

    return true;
  });
}




  // 🔹 Month-Year Filter (carry-forward logic)
  if (monthToUse) {
    filtered = filtered.filter((exp) => {
      const raisedMonth = exp.raised_date?.slice(0, 7);
      const paidMonth = exp.paid_date?.slice(0, 7);

      // 🔹 PAID → show ONLY in paid month
      if (exp.paymentstatus === "Paid") {
        return paidMonth === monthToUse;
      }

      // 🔹 UNPAID → carry forward until paid
      return raisedMonth && raisedMonth <= monthToUse;
    });
  }

  setFilteredExpenses(filtered);
  setMonthYear(monthToUse); // ✅ important
  console.log(filtered);

  const total = filtered.reduce(
    (sum, exp) => sum + (Number(exp.amount) || 0),
    0
  );
  setTotalExpense(total);
};
  const handleSaveChanges = async () => {
    try {
      const numericId = Number(selectedExpense.id.replace("E", ""));

      await axios.put(`http://localhost:7760/updateexpense/${numericId}`, {
        regular: selectedExpense.regular,
        amount: selectedExpense.amount,
        raised_date: selectedExpense.raised_date,
        due_date: selectedExpense.due_date,
        status: selectedExpense.status,
        month_year: selectedMonthYear,
      });

      alert("Expense updated successfully!");
      setIsEditing(false);

      // Fetch fresh data and apply filters
      const refreshed = await fetchExpenses(selectedMonthYear);
      handleApplyFilterWithData(refreshed);
    } catch (err) {
      console.error("Error updating expense:", err);
      alert("Failed to update expense!");
    }
  };

  const handleUpdateExpense = async (updatedExp) => {
    try {
      await axios.put(`/updateExpense/${updatedExp.id}`, updatedExp);
      alert("Updated Successfully");
      setOpenUpdateDialog(false);

      // REFRESH: get fresh data & apply
      const refreshed = await fetchExpenses(selectedMonthYear);
      handleApplyFilterWithData(refreshed);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  function getMainCategory(type) {
    if (!type) return "";
    if (type.includes(" - ")) {
      return type.split(" - ")[0].trim();
    }
    return type.trim();
  }

  const [selectedCategory, setSelectedCategory] = useState(null);
// --------- NEW: compute remaining totals per category (accounts for payments) ----------
const totals = {}; // remaining amounts per category after payments
const originalTotals = {}; // optional: original totals if you need them later

filteredexpenses.forEach((exp) => {
  const category = getMainCategory(exp.type);
  const originalAmount = Number(exp.actual_to_pay ?? exp.amount ?? 0);
  const paidAmount = Number(exp.paid_amount ?? 0);

  // compute remaining:
  // if paymentstatus === "Paid" => remaining should be 0 (or if partially paid use max(0, original - paid))
  // otherwise remaining = max(0, original - paid)
  const remaining = Math.max(0, originalAmount - paidAmount);

  if (!totals[category]) totals[category] = 0;
  totals[category] += remaining;

  if (!originalTotals[category]) originalTotals[category] = 0;
  originalTotals[category] += originalAmount;
});

// filteredRightSide uses the same filtering logic but keep full rows
const filteredRightSide = selectedCategory
  ? filteredexpenses.filter((exp) => getMainCategory(exp.type) === selectedCategory)
  : filteredexpenses;

// grand total is sum of remaining across all categories (reflects payments deducted)
const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        gap: "20px",
        alignItems: "flex-start", // keeps both tables aligned at top
      }}
    >
      {/* Filter controls (top fixed bar) */}
      <div
        style={{
          position: "fixed",
          top: 70,
          left: "17%",
          width: "78%",
          backgroundColor: "#fff",
          zIndex: 1000,
          padding: "10px 20px",
          display: "flex",
          gap: "10px",
          borderBottom: "1px solid #ccc",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          borderRadius: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <TextField
            select
            size="small"
            label="Regular"
            value={filterRegular}
            onChange={(e) => setFilterRegular(e.target.value)}
            style={{ minWidth: "120px" }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Expense Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ minWidth: "180px" }}
          >
            <MenuItem value="all">All</MenuItem>
            {expenseOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

         <TextField
  size="small"
  label="Month-Year"
  type="month"
  InputLabelProps={{ shrink: true }}
  value={selectedMonthYearInput}
  onChange={(e) => {
    setSelectedMonthYearInput(e.target.value); // only updates input value
  }}
  style={{ minWidth: "150px" }}
/>
<Button
  variant="outlined"
  color="warning"
  disabled={loading}
  onClick={async () => {
    const month = selectedMonthYearInput;

    setSelectedMonthYear(month);
    const refreshed = await fetchExpenses(month);
    handleApplyFilterWithData(refreshed, month);
  }}
>
  {loading ? "Loading..." : "Search"}
</Button>



        </div>

        {!showTotal ? (
          <Button variant="contained" color="success" onClick={() => setShowTotal(true)}>
            Compute Total
          </Button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
            <span>
              Total:{" "}
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(totalExpense)}
            </span>
            <VisibilityOffIcon style={{ cursor: "pointer" }} onClick={() => setShowTotal(false)} />
          </div>
        )}
      </div>

      {/* Left CATEGORY totals */}
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
                    fontWeight: "800",
                    fontSize: "15px",
                    color: "#3071a3ff",
                    padding: "14px",
                    textAlign: "center",
                    fontFamily: "monospace",
                  }}
                >
                  TOTAL — {formatCurrency(grandTotal)}
                </TableCell>
              </TableRow>

              <TableRow style={{ backgroundColor: "#f7f7fb" }}>
                <TableCell style={{ fontWeight: "700", fontSize: "16px", color: "#444", padding: "12px" }}>
                  Category
                </TableCell>

                <TableCell
                  style={{
                    fontWeight: "700",
                    fontSize: "16px",
                    color: "#444",
                    padding: "12px",
                    textAlign: "right",
                  }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
  <TableRow>
    <TableCell colSpan={10} align="center" style={{ padding: "30px" }}>
      Loading expenses...
    </TableCell>
  </TableRow>
)}

              {Object.keys(totals).map((cat) => (
                <TableRow
                  key={cat}
                  hover
                  sx={{
                    cursor: "pointer",
                    backgroundColor: selectedCategory === cat ? "rgba(99, 102, 241, 0.1)" : "white",
                    transition: "0.2s",
                    "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <TableCell style={{ fontSize: "15px", padding: "12px", fontWeight: "600" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "rgba(99, 102, 241, 0.12)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: "#4f46e5",
                        fontWeight: "600",
                      }}
                    >
                      {cat}
                    </span>
                  </TableCell>

                  <TableCell style={{ fontWeight: "700", fontSize: "15px", padding: "12px", textAlign: "right", color: "#111827" }}>
                    {formatCurrency(totals[cat])}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow hover sx={{ cursor: "pointer", backgroundColor: "#eef5ff", "&:hover": { backgroundColor: "#dce8ff" } }} onClick={() => setSelectedCategory(null)}>
                <TableCell colSpan={2} style={{ textAlign: "center", color: "#2563eb", fontWeight: "700", padding: "12px" }}>
                  Show All
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Right Table */}
      <div style={{ width: "90%" }}>
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
<Divider
  style={{
    padding: "10px",
    backgroundColor: "rgba(201, 197, 221, 0.8)",
    fontWeight: "700",
    color: "#2b2b2b",
    fontSize: "16px",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  {/* left: Month-Year */}
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span>
      {selectedMonthYear
        ? new Date(selectedMonthYear + "-01")
            .toLocaleString("en-GB", { month: "short", year: "numeric" })
            .replace(" ", "-")
        : "-"}
    </span>

    <span style={{ marginLeft: 6 }}>—</span>

    {/* category + dash + amount */}
    <span style={{ color: "#4f46e5", fontWeight: 800 }}>
      {selectedCategory
        ? `${selectedCategory}-${formatCurrency(originalTotals[selectedCategory] ?? 0)}`
        : `All Expenses-${formatCurrency(
            Object.values(originalTotals).reduce((s, v) => s + v, 0)
          )}`}
    </span>
  </div>

  {/* optional empty div keeps spacing consistent */}
  <div />
</Divider>



          <Table stickyHeader>
            <TableHead>
              <TableRow style={{ backgroundColor: "#f7f7fb" }}>
                <TableCell style={{ fontWeight: "700", fontSize: "14px" }}>Regular</TableCell>
                <TableCell style={{ fontWeight: "700", fontSize: "14px" }}>Type</TableCell>
                 {/* 🔹 GST extra columns */}
    {selectedCategory === "GST" && (
      <>
        <TableCell>Client Name</TableCell>
        <TableCell>Project Name</TableCell>
        <TableCell>Invoice Value</TableCell>
      </>
    )}
                <TableCell style={{ fontWeight: "700", fontSize: "14px" }}>Amount</TableCell>
                <TableCell style={{ fontWeight: "700", fontSize: "14px" }}>Actual To Pay</TableCell>
          <TableCell style={{ fontWeight: "700", fontSize: "14px" }}>
  <Box display="flex" flexDirection="column" gap={0.5}>
    <span>Status</span>

    <FormControl size="small" fullWidth>
      <Select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        sx={{
          fontSize: "13px",
          backgroundColor: "#f7f7fb",
          borderRadius: "6px",
          height: "32px",
        }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="Paid">Paid</MenuItem>
        <MenuItem value="Raised">Raised</MenuItem>
      </Select>
    </FormControl>
  </Box>
</TableCell>


                <TableCell style={{ fontWeight: "700", fontSize: "14px" }}>Paid Date</TableCell>
                <TableCell style={{ fontWeight: "700", fontSize: "14px" }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
  {!loading &&
  filteredRightSide.map((exp, index) => (

    <TableRow
     key={`${exp.expense_id}-${exp.month_year}`}
      hover
      sx={{
        cursor: "pointer",
        transition: "0.2s",
        "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.07)" },
      }}
      onClick={() => {
        setSelectedExpense(exp);
        setOpenDetailDialog(true);
      }}
    >
      {/* Regular */}
      <TableCell style={{ fontSize: "14px" }}>{exp.regular}</TableCell>

      {/* Type */}
      <TableCell style={{ fontSize: "14px", fontWeight: "600" }}>
        <span
          style={{
            padding: "4px 8px",
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#4f46e5",
            fontWeight: "600",
          }}
        >
          {exp.type}
        </span>
      </TableCell>

      {/* 🔹 GST EXTRA COLUMNS */}
      {selectedCategory === "GST" && (
        <>
          <TableCell style={{ fontSize: "14px", fontWeight: "600" }}>
            {exp.client_name || "-"}
          </TableCell>

          <TableCell style={{ fontSize: "14px", fontWeight: "600" }}>
            {exp.project_name || "-"}
          </TableCell>

          <TableCell style={{ fontSize: "14px", fontWeight: "700" }}>
            {exp.invoice_value
              ? formatCurrency(exp.invoice_value)
              : "-"}
          </TableCell>
        </>
      )}

      {/* Amount */}
      <TableCell style={{ fontSize: "14px", fontWeight: "600" }}>
        {formatCurrency(exp.amount)}
      </TableCell>

      {/* Actual To Pay */}
      <TableCell style={{ fontWeight: "600", fontSize: "14px" }}>
        {exp.paymentstatus === "Paid" ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "green", fontWeight: "700" }}>
              Paid: {formatCurrency(exp.paid_amount)}
            </span>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              Date:{" "}
              {exp.paid_date
                ? new Date(exp.paid_date)
                    .toLocaleDateString("en-GB")
                    .replaceAll("/", "-")
                : "-"}
            </span>
          </div>
        ) : exp.actual_to_pay ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>{formatCurrency(exp.actual_to_pay)}</span>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              Due:{" "}
              {exp.due_date
                ? new Date(exp.due_date)
                    .toLocaleDateString("en-GB")
                    .replaceAll("/", "-")
                : "-"}
            </span>
          </div>
        ) : (
          <Link
            onClick={(e) => {
              e.stopPropagation();
              setUpdateExpense(exp);
              setOpenUpdateDialog(true);
            }}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              color: "#2563eb",
              fontWeight: "600",
            }}
          >
            Update
          </Link>
        )}
      </TableCell>

      {/* Status */}
      <TableCell
        style={{
          fontWeight: "700",
          color:
            exp.paymentstatus === "Paid"
              ? "green"
              : exp.paymentstatus === "Hold"
              ? "gray"
              : exp.paymentstatus === "Rejected"
              ? "red"
              : exp.paymentstatus === "Raised"
              ? "#2563eb"
              : "orange",
          fontSize: "14px",
        }}
      >
        {exp.paymentstatus || "Pending"}
      </TableCell>

      {/* Paid Date */}
      <TableCell style={{ fontSize: "14px", fontWeight: "600" }}>
        {exp.paid_date &&
        exp.paid_date !== "00-00-0000" &&
        !isNaN(Date.parse(exp.paid_date)) ? (
          new Date(exp.paid_date)
            .toLocaleDateString("en-GB")
            .replaceAll("/", "-")
        ) : (
          <span style={{ color: "red", fontWeight: "700" }}>
            Not Paid
          </span>
        )}
      </TableCell>

      {/* Action */}
      <TableCell>
        {exp.paymentstatus === "Paid" ? (
          <VerifiedRoundedIcon
            style={{
              color: "green",
              fontSize: "32px",
              transform: "rotate(-10deg)",
            }}
          />
        ) : (
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "rgba(7, 186, 126, 0.85)",
              fontWeight: "700",
              borderRadius: "6px",
            }}
            onClick={(e) => openPayForExpense(e, exp)}
          >
            Pay
          </Button>
        )}
      </TableCell>
    </TableRow>
  ))}
</TableBody>

          </Table>
        </TableContainer>
      </div>

      {/* Update Actual TO pay Dialog */}
      <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)} maxWidth="xs" fullWidth={false}>
        <DialogTitle style={{ fontWeight: "bold", fontFamily: "monospace" }}>Update Expense</DialogTitle>

        <DialogContent dividers>
          {updateExpense && (
            <>
              <h3 style={{ textAlign: "center", fontFamily: "monospace", color: "gray" }}>{updateExpense.type} for Month {selectedMonthYear}</h3>
              <hr />
              <TextField label="Month - Year" fullWidth margin="normal" value={selectedMonthYear} InputProps={{ readOnly: true }} />

              <TextField label="Actual Amount" type="text" fullWidth margin="normal" defaultValue={updateExpense.amount} onChange={(e) => setUpdateExpense({ ...updateExpense, amount: e.target.value })} />

              <TextField label="Due Date" type="date" fullWidth margin="normal" value={updateExpense.due_date ? updateExpense.due_date.split("T")[0] : ""} onChange={(e) => setUpdateExpense({ ...updateExpense, due_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={async () => {
              const expenseIdRaw = updateExpense.expense_id || updateExpense.auto_id || updateExpense.id;
              if (!expenseIdRaw) {
                alert("Expense ID missing");
                return;
              }

              let numericExpenseId = expenseIdRaw;
              if (typeof expenseIdRaw === "string" && expenseIdRaw.startsWith("E")) {
                numericExpenseId = expenseIdRaw.replace("E", "");
              }
              numericExpenseId = Number(numericExpenseId);

             const payload = {
  expense_id: numericExpenseId,
  month_year: selectedMonthYear,
  actual_amount: updateExpense.actual_to_pay ?? updateExpense.amount,
  due_date: updateExpense.due_date,
};
 try {
                await axios.post("http://localhost:7760/saveExpensePayment", payload);
                alert("Expense Updated Successfully");
                setOpenUpdateDialog(false);

                // REFRESH immediately and apply filter so UI reflects changes
                const monthToUse = selectedMonthYear || selectedMonthYearInput;
const refreshed = await fetchExpenses(monthToUse);
handleApplyFilterWithData(refreshed);

              } catch (err) {
                console.error(err);
                alert("Error saving expense");
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
{/* Detail Dialog */}
<Dialog
  open={openDetailDialog}
  onClose={() => setOpenDetailDialog(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle style={{ fontWeight: "bold" }}>
    Expense Details
  </DialogTitle>

  <DialogContent dividers>
    {selectedExpense && (
      <Table size="small">
        <TableBody>

          {/* ID */}
          <TableRow>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell>{selectedExpense.id}</TableCell>
          </TableRow>

          {/* Month (VERY IMPORTANT) */}
          <TableRow>
            <TableCell><strong>Month</strong></TableCell>
            <TableCell>
              {selectedExpense.month_year
                ? new Date(selectedExpense.month_year + "-01")
                    .toLocaleString("en-GB", { month: "long", year: "numeric" })
                : "-"}
            </TableCell>
          </TableRow>

          {/* Type */}
          <TableRow>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell>{selectedExpense.type}</TableCell>
          </TableRow>

          {/* Description */}
          <TableRow>
            <TableCell><strong>Description</strong></TableCell>
            <TableCell>{selectedExpense.description}</TableCell>
          </TableRow>

          {/* Regular */}
          <TableRow>
            <TableCell><strong>Regular</strong></TableCell>
            <TableCell>
              {isEditing ? (
                <TextField
                  select
                  value={selectedExpense.regular || ""}
                  onChange={(e) =>
                    setSelectedExpense({
                      ...selectedExpense,
                      regular: e.target.value,
                    })
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              ) : (
                selectedExpense.regular
              )}
            </TableCell>
          </TableRow>

          {/* Amount */}
          <TableRow>
            <TableCell><strong>Amount</strong></TableCell>
            <TableCell>
              {isEditing ? (
                <TextField
                  type="number"
                  value={selectedExpense.amount || ""}
                  onChange={(e) =>
                    setSelectedExpense({
                      ...selectedExpense,
                      amount: e.target.value,
                    })
                  }
                  fullWidth
                  size="small"
                />
              ) : (
                formatCurrency(selectedExpense.amount)
              )}
            </TableCell>
          </TableRow>

          {/* Original Start Date */}
          <TableRow>
            <TableCell>
              <strong>
                {selectedExpense.regular === "Yes"
                  ? "Original Start Date"
                  : "Raised Date"}
              </strong>
            </TableCell>
            <TableCell>
              {selectedExpense.raised_date
                ? new Date(selectedExpense.raised_date)
                    .toLocaleDateString("en-GB")
                    .replaceAll("/", "-")
                : "-"}
            </TableCell>
          </TableRow>

          {/* Month Due Date */}
          <TableRow>
            <TableCell><strong>Due Date (This Month)</strong></TableCell>
            <TableCell>
              {selectedExpense.due_date
                ? new Date(selectedExpense.due_date)
                    .toLocaleDateString("en-GB")
                    .replaceAll("/", "-")
                : "-"}
            </TableCell>
          </TableRow>

          {/* Payment Status */}
          <TableRow>
            <TableCell><strong>Payment Status</strong></TableCell>
            <TableCell>
              <strong
                style={{
                  color:
                    selectedExpense.paymentstatus === "Paid"
                      ? "green"
                      : "orange",
                }}
              >
                {selectedExpense.paymentstatus || "Pending"}
              </strong>
            </TableCell>
          </TableRow>

          {/* Paid Amount */}
          <TableRow>
            <TableCell><strong>Paid Amount</strong></TableCell>
            <TableCell>
              {selectedExpense.paymentstatus === "Paid"
                ? formatCurrency(selectedExpense.paid_amount)
                : <span style={{ color: "red" }}>Not Paid</span>}
            </TableCell>
          </TableRow>

          {/* Paid Date */}
          <TableRow>
            <TableCell><strong>Paid Date</strong></TableCell>
            <TableCell>
              {selectedExpense.paymentstatus === "Paid" &&
              selectedExpense.paid_date
                ? new Date(selectedExpense.paid_date)
                    .toLocaleDateString("en-GB")
                    .replaceAll("/", "-")
                : <span style={{ color: "red" }}>Not Paid</span>}
            </TableCell>
          </TableRow>

        </TableBody>
      </Table>
    )}
  </DialogContent>

  {/* 🔹 ACTION BUTTONS (SAVE & CANCEL INCLUDED) */}
  <DialogActions>
    {isEditing ? (
      <>
        <Button
          variant="contained"
          color="success"
          onClick={handleSaveChanges}
        >
          Save
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </Button>
      </>
    ) : (
      <Button
        variant="outlined"
        color="success"
        onClick={() => setIsEditing(true)}
      >
        <EditIcon />
      </Button>
    )}

    <Button
      variant="contained"
      color="error"
      onClick={() => setOpenDetailDialog(false)}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Pay Modal */}
      <Dialog open={openPayDialog} onClose={() => setOpenPayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Mark as Paid</DialogTitle>
        <DialogContent dividers>
          {payExpense && (
            <Box>
              <Table size="small" sx={{ marginBottom: 2 }}>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Id</strong></TableCell>
                    <TableCell>{payExpense.id}</TableCell>
                  </TableRow>
                  <TableRow style={{ backgroundColor: "lightgray", borderRadius: "20px" }}>
                    <TableCell><strong>Regular</strong></TableCell>
                    <TableCell style={{ color: "blueviolet", fontWeight: "bold" }}>{payExpense.regular}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell>{payExpense.type}</TableCell>
                  </TableRow>
                  {/* 🔹 GST-specific details */}
{/* 🔹 GST-specific details */}
{payExpense?.type === "GST" && (
  <>
    <TableRow>
      <TableCell><strong>Client Name</strong></TableCell>
      <TableCell>{payExpense.client_name || "-"}</TableCell>
    </TableRow>

    <TableRow>
      <TableCell><strong>Project Name</strong></TableCell>
      <TableCell>{payExpense.project_name || "-"}</TableCell>
    </TableRow>

    <TableRow>
      <TableCell><strong>Invoice Value</strong></TableCell>
      <TableCell>
        {payExpense.invoice_value
          ? formatCurrency(payExpense.invoice_value)
          : "-"}
      </TableCell>
    </TableRow>
  </>
)}
<TableRow>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell>{payExpense.description}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Actual Amount</strong></TableCell>
                    <TableCell>{formatCurrency(payExpense.amount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Box display="flex" gap={2}>
                <TextField label="Paid Date" type="date" InputLabelProps={{ shrink: true }} value={paidDate} onChange={(e) => setPaidDate(e.target.value)} fullWidth />
                <TextField label="Amount To Pay" type="text" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} fullWidth />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenPayDialog(false)}>Cancel</Button>
          <Button variant="contained" sx={{ backgroundColor: "green" }} onClick={() => handleMarkAsPaid(payExpense.id)}>
            Mark Paid
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab color="primary" aria-label="add" sx={{ position: "fixed", bottom: 30, right: 30 }} onClick={() => setOpenDialog(true)}>
        <AddIcon />
      </Fab>

      {/* Add Expense Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Add New Expense</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex="1 1 48%">
              <TextField fullWidth select label="Regular" value={newExpense.regular} onChange={(e) => setNewExpense({ ...newExpense, regular: e.target.value })}>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
            </Box>

            <Box flex="1 1 48%">
              <TextField fullWidth select label="Type of Expense" value={newExpense.type} onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}>
                {expenseOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Box>

            <Box flex="1 1 48%">
              <TextField fullWidth type="date" label="Raised Date" InputLabelProps={{ shrink: true }} value={newExpense.raised_date} onChange={(e) => setNewExpense({ ...newExpense, raised_date: e.target.value })} />
            </Box>

            <Box flex="1 1 48%">
              <TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={newExpense.due_date} onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })} />
            </Box>

            <Box flex="1 1 48%">
              <TextField fullWidth type="text" label="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
            </Box>

            <Box flex="1 1 48%">
              <TextField fullWidth multiline minRows={2} maxRows={6} label="Description" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={() => { handleAddExpense(); }} variant="contained" sx={{ backgroundColor: "#0d3b66" }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Expenses;


