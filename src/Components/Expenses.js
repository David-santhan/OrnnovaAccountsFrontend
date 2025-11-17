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
  Fab,Snackbar,Alert,FormControl, Select,InputLabel,Divider,
  Link
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EditIcon from '@mui/icons-material/Edit';
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
const [monthYear,setMonthYear]=useState("");

  const expenseOptions = [
    "Loan", "TDS On Salaries", "TDS On Consultancies", "Rent", "Marketing Exp",
    "PNB Loan", "ICICI Car Loan", "Bajaj Loan", "PF", "ESI", "PT",
    "Bescom Bill", "BWSSB Bill", "Petty Cash", "Credit Card Charges",
    "GST", "Office Stationary", "Reimbursements", "Incentives", "Mobile", "Expense"
  ];
const [filterStatus, setFilterStatus] = useState("all");


  // Fetch expenses from backend on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

    const formatCurrency = (num) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);

const fetchExpenses = async (selectedMonthYear) => {
  try {
    if (!selectedMonthYear) return [];

    const res = await axios.get("http://localhost:7760/getexpenses", {
      params: { month: selectedMonthYear },
    });

    console.log("API Data:", res.data);

    setExpenses(res.data);

    return res.data;   // 🔥 IMPORTANT: RETURN THE DATA
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return [];
  }
};



  // POST new expense to backend
const handleAddExpense = async () => {
  try {
    const payload = { ...newExpense, paid_date: "00-00-0000" };
    await axios.post("http://localhost:7760/postexpenses", payload);

    // Always refetch latest data
    await fetchExpenses();

    // Reset form + show success
    setNewExpense({
      regular: "",
      type: "",
      description: "",
      amount: "",
      currency: "INR",
      raised_date: today,
      due_date: "",
      status: "",
    });
    setOpenDialog(false);
    setSnackbarMessage("Expense added successfully!");
    setSnackbarOpen(true);
  } catch (err) {
    console.error("Error adding expense:", err);
  }
};


const handleMarkAsPaid = async (expenseId) => {
  if (!paidDate || !paidAmount) {
    alert("⚠️ Please enter both Paid Date and Amount Paid.");
    return;
  }

  // Convert "E7" → 7
  const numericExpenseId = parseInt(expenseId.replace(/\D/g, ""), 10);

  const payload = {
    expense_id: numericExpenseId,
    paid_amount: paidAmount,
    paid_date: paidDate,
  };

  try {
    const response = await axios.put(
      "http://localhost:7760/pay-expense",
      payload
    );

    const data = response.data;

    // ✅ Close modal and clear fields
    setOpenPayDialog(false);
    setPayExpense(null);
    setPaidDate("");
    setPaidAmount("");

    // ✅ Success message
    setSnackbarMessage(data.message || "Payment recorded successfully!");
    setSnackbarOpen(true);

    // ✅ Refetch updated data only (does NOT apply filters)
    await fetchExpenses(selectedMonthYear);

    // ❗ Apply filter manually after updated backend data is loaded
    setTimeout(() => {
      handleApplyFilterWithData(expenses);
    }, 200);

  } catch (err) {
    console.error("❌ Error while paying expense:", err);
    alert(err.response?.data?.message || "Something went wrong. Please try again.");
  }
};


// Updated filter function that accepts data
const handleApplyFilterWithData = (data) => {
  let filtered = data;

  // 🔹 Filter by Regular
  if (filterRegular !== "all") {
    filtered = filtered.filter((exp) => exp.regular === filterRegular);
  }

  // 🔹 Filter by Type
  if (filterType !== "all") {
    filtered = filtered.filter((exp) => exp.type === filterType);
  }

  // 🔹 Filter by Status
  if (filterStatus !== "all") {
    filtered = filtered.filter((exp) => {
      if (filterStatus === "Paid") {
        return exp.paymentstatus === "Paid";
      } else {
        return exp.expensestatus === filterStatus;
      }
    });
  }

  // 🔹 Month-Year Filter (Correct Logic)
  if (selectedMonthYear) {
    const [year, month] = selectedMonthYear.split("-");
    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);

    filtered = filtered.filter((exp) => {
      const raised = new Date(exp.raised_date);
      const raisedMonth = raised.getMonth() + 1;
      const raisedYear = raised.getFullYear();

      const paymentExists =
        exp.actual_to_pay != null && exp.actual_to_pay !== undefined;

      if (paymentExists) return true;

      if (exp.regular === "Yes") {
        return (
          selectedYear > raisedYear ||
          (selectedYear === raisedYear &&
            selectedMonth >= raisedMonth)
        );
      }

      return (
        raisedYear === selectedYear && raisedMonth === selectedMonth
      );
    });
  }

  setFilteredExpenses(filtered);
  setMonthYear(selectedMonthYear);

  const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
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

    // 🔥 Fetch and update UI properly
    const refreshed = await fetchExpenses(selectedMonthYear);
    handleApplyFilterWithData(refreshed);  // 🔥 UI updates

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
    fetchExpenses(); // refresh table
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
};

  
  return (
    <div style={{ padding: "1rem", width: "100%", position: "relative", marginBottom: 300 }}>
      {/* Filter controls */}
   {/* --- FILTER BAR --- */}
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
    {/* Regular filter */}
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

    {/* Expense Type filter */}
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

    {/* Month-Year filter */}
    <TextField
      size="small"
      label="Month-Year"
      type="month"
      InputLabelProps={{ shrink: true }}
      value={selectedMonthYear}
      onChange={(e) => {
  setSelectedMonthYear(e.target.value);
  fetchExpenses(e.target.value);  // fetch backend data
  setFilteredExpenses([]);        // ❗clear UI table
}}

      style={{ minWidth: "150px" }}
    />

    {/* Status filter */}
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Status</InputLabel>
      <Select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        label="Status"
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="Raised">Raised</MenuItem>
        <MenuItem value="Pending">Pending</MenuItem>
        <MenuItem value="Paid">Paid</MenuItem>
        <MenuItem value="Hold">Hold</MenuItem>
        <MenuItem value="Rejected">Rejected</MenuItem>
      </Select>
    </FormControl>

   <Button
  variant="outlined"
  color="warning"
  onClick={() => handleApplyFilterWithData(expenses)}
>
  Search
</Button>


  </div>

  {/* Compute total */}
  {!showTotal ? (
    <Button
      variant="contained"
      color="success"
      onClick={() => setShowTotal(true)}
    >
      Compute Total
    </Button>
  ) : (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontWeight: "bold",
      }}
    >
      <span>
        Total:{" "}
        {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(totalExpense)}
      </span>
      <VisibilityOffIcon
        style={{ cursor: "pointer" }}
        onClick={() => setShowTotal(false)}
      />
    </div>
  )}
</div>

{/* --- TABLE --- */}
<TableContainer
  component={Paper}
  sx={{ maxHeight: 420, overflowX: "auto", marginTop: "250px" }}
>
<Divider style={{padding:"5px",backgroundColor:"rgba(201, 197, 221, 0.8)",fontWeight:"bold",color:"black"}}>
  {new Date(monthYear + "-01").toLocaleString("en-GB", {
    month: "short",
    year: "numeric",
  }).replace(" ", "-")}
</Divider>
  <Table stickyHeader>
    <TableHead>
      <TableRow style={{ backgroundColor: "whitesmoke" }}>
        <TableCell style={{ fontWeight: "bold" }}>Regular</TableCell>
        <TableCell style={{ fontWeight: "bold" }}>Type of Expense</TableCell>
        <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
        <TableCell style={{ fontWeight: "bold" }}>Actual To Pay</TableCell>

        <TableCell
          style={{
            fontWeight: "bold",
            backgroundColor: "#f4d9aaff",
            color: "#634b03ff",
            textAlign: "center",
          }}
        >
          Due Date
        </TableCell>

        <TableCell style={{ fontWeight: "bold" }}>Status</TableCell>
        <TableCell style={{ fontWeight: "bold" }}>Paid Date</TableCell>
        <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
      </TableRow>
    </TableHead>


<TableBody>

  {/* 1️⃣ If NO expenses returned from API */}
  {expenses.length === 0 && selectedMonthYear && filteredexpenses.length === 0 ? (
    <TableRow>
      <TableCell colSpan={8} style={{
        padding: "20px",
        textAlign: "center",
        fontWeight: "bold",
        color: "crimson",
        fontSize: "15px"
      }}>
        No expenses found for this month
      </TableCell>
    </TableRow>
  ) : null}

  {/* 2️⃣ If expenses exist but user has NOT clicked Search yet */}
  {expenses.length > 0 && filteredexpenses.length === 0 && selectedMonthYear ? (
    <TableRow>
      <TableCell colSpan={8} style={{
        padding: "20px",
        textAlign: "center",
        fontWeight: "bold",
        color: "indianred",
        fontSize: "15px"
      }}>
        Click Search to load Expenses for Selected Month
      </TableCell>
    </TableRow>
  ) : null}

  {/* 3️⃣ Show actual filtered rows */}
  {filteredexpenses.map((exp, index) => (
    <TableRow
      key={index}
      hover
      sx={{ cursor: "pointer" }}
      onClick={() => {
        setSelectedExpense(exp);
        setOpenDetailDialog(true);
      }}
    >
      {/* ---- your existing table columns below ---- */}

      <TableCell>{exp.regular}</TableCell>
      <TableCell>{exp.type}</TableCell>
      <TableCell>{formatCurrency(exp.amount)}</TableCell>

      <TableCell style={{ fontWeight: "bold" }}>
  {exp.paymentstatus === "Paid" ? (
    // ----------- PAID -----------
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ color: "green", fontWeight: "bold" }}>
        Paid: {formatCurrency(exp.paid_amount)}
      </span>
      <span style={{ fontSize: "12px", color: "gray" }}>
        Date: {
          exp.paid_date
            ? new Date(exp.paid_date)
                .toLocaleDateString("en-GB")
                .replaceAll("/", "-")
            : "-"
        }
      </span>
    </div>
  ) : exp.actual_to_pay ? (
    // ----------- UPDATED BUT NOT PAID -----------
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span>{formatCurrency(exp.actual_to_pay)}</span>
      <span style={{ fontSize: "12px", color: "gray" }}>
        Due: {
          exp.due_date
            ? new Date(exp.due_date)
                .toLocaleDateString("en-GB")
                .replaceAll("/", "-")
            : "-"
        }
      </span>
    </div>
  ) : (
    // ----------- NOT UPDATED -----------
    <Link
      onClick={(e) => {
        e.stopPropagation();
        setUpdateExpense(exp);
        setOpenUpdateDialog(true);
      }}
      style={{ cursor: "pointer" }}
    >
      Update
    </Link>
  )}
</TableCell>


          {/* Due Date */}
     <TableCell
  style={{
    textAlign: "center",
    fontWeight: "bold",
    ...(() => {
      const due = new Date(exp.due_date);
      let displayedDate = new Date(due);

      if (exp.regular === "Yes" && selectedMonthYear) {
        const selected = new Date(selectedMonthYear + "-01");
        const monthDiff =
          (selected.getFullYear() - due.getFullYear()) * 12 +
          (selected.getMonth() - due.getMonth());
        displayedDate.setMonth(due.getMonth() + monthDiff + 1);
      }

      // compute difference for styling
      const daysDiff = (displayedDate - new Date()) / (1000 * 60 * 60 * 24);

      // dynamic colors based on displayed date
      let backgroundColor, color;
      if (daysDiff < 0) {
        backgroundColor = "#f8d7da"; // past due
        color = "#721c24";
      } else if (daysDiff <= 3) {
        backgroundColor = "#fff3cd"; // due soon
        color = "#856404";
      } else {
        backgroundColor = "#d1ecf1"; // safe
        color = "#0c5460";
      }

      return {
        backgroundColor,
        color,
      };
    })(),
  }}
>
  {(() => {
    const due = new Date(exp.due_date);
    let displayedDate = new Date(due);

    if (exp.regular === "Yes" && selectedMonthYear) {
      const selected = new Date(selectedMonthYear + "-01");
      const monthDiff =
        (selected.getFullYear() - due.getFullYear()) * 12 +
        (selected.getMonth() - due.getMonth());
      displayedDate.setMonth(due.getMonth() + monthDiff + 1);
    }

    return displayedDate.toLocaleDateString("en-GB").replaceAll("/", "-");
  })()}
</TableCell>





          {/* Payment Status */}
        <TableCell
  sx={{
    fontWeight: "bold",
    color:
      exp.paymentstatus === "Paid"
        ? "green"
        : exp.paymentstatus === "Hold"
        ? "gray"
        : exp.paymentstatus === "Rejected"
        ? "red"
        : exp.paymentstatus === "Raised"
        ? "blue"
        : exp.paymentstatus === "Pending" || exp.paymentstatus === "Pending" || !exp.paymentstatus
        ? "orange"
        : "black", // fallback color
  }}
>
  {exp.paymentstatus || "Pending"}
</TableCell>



          {/* Paid Date */}
         <TableCell>
  {exp.paid_date &&
  exp.paid_date !== "00-00-0000" &&
  !isNaN(Date.parse(exp.paid_date)) ? (
    new Date(exp.paid_date).toLocaleDateString("en-GB").replaceAll("/", "-")
  ) : (
    <span style={{ color: "red", fontWeight: 600 }}>Not Paid</span>
  )}
</TableCell>


          {/* Pay Button */}
      <TableCell>
  {exp.paymentstatus === "Paid" ? (
  <VerifiedRoundedIcon 
    style={{ 
      color: "green", 
      fontSize: "32px", 
      transform: "rotate(-10deg)" 
    }} 
  />
)  : !exp.actual_to_pay ? (
    <Button
      variant="contained"
      size="small"
      sx={{ backgroundColor: "gray", fontWeight: "bold" }}
      disabled
      onClick={(e) => e.stopPropagation()}
    >
      Pay
    </Button>
  ) : (
    <Button
      variant="contained"
      size="small"
      sx={{
        backgroundColor: "rgba(7, 186, 126, 0.8)",
        fontWeight: "bold",
      }}
      onClick={(e) => {
        e.stopPropagation();
        setPayExpense(exp);
        setPaidDate(new Date().toISOString().split("T")[0]);
        setPaidAmount(exp.actual_to_pay);
        setOpenPayDialog(true);
      }}
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


{/* Update Actual TO pay Dialog */}
<Dialog
  open={openUpdateDialog}
  onClose={() => setOpenUpdateDialog(false)}
  maxWidth="xs"      // smaller width
  fullWidth={false}  // do NOT stretch full width
>

  <DialogTitle style={{fontWeight:"bold",fontFamily:"monospace"}}>Update Expense</DialogTitle>

  <DialogContent dividers>
    {updateExpense && (
      <>
      <h3 style={{textAlign:"center",fontFamily:"monospace",color:"gray"}}>{updateExpense.type} for Month {selectedMonthYear}</h3> <hr></hr>
        {/* Expense ID */}
        {/* <TextField
          label="Expense ID"
          fullWidth
          margin="normal"
          value={updateExpense.id || updateExpense.expense_id || ""}
          InputProps={{ readOnly: true }}
        /> */}

        {/* Month - Year (always from selectedMonthYear) */}
        <TextField
          label="Month - Year"
          fullWidth
          margin="normal"
          value={selectedMonthYear}
          InputProps={{ readOnly: true }}
        />

        {/* Actual Amount */}
        <TextField
          label="Actual Amount"
          type="text"
          fullWidth
          margin="normal"
          defaultValue={updateExpense.amount}
          onChange={(e) =>
            setUpdateExpense({ ...updateExpense, amount: e.target.value })
          }
        />

        {/* Due Date */}
        <TextField
          label="Due Date"
          type="date"
          fullWidth
          margin="normal"
          value={
            updateExpense.due_date
              ? updateExpense.due_date.split("T")[0]
              : ""
          }
          onChange={(e) =>
            setUpdateExpense({ ...updateExpense, due_date: e.target.value })
          }
          InputLabelProps={{ shrink: true }}
        />
      </>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>

  <Button
  variant="contained"
  onClick={async () => {
    console.log("updateExpense = ", updateExpense);

    const expenseIdRaw =
      updateExpense.expense_id || updateExpense.auto_id || updateExpense.id;

    if (!expenseIdRaw) {
      alert("Expense ID missing");
      return;
    }

    let numericExpenseId = expenseIdRaw;

    // Convert "E5" → "5"
    if (typeof expenseIdRaw === "string" && expenseIdRaw.startsWith("E")) {
      numericExpenseId = expenseIdRaw.replace("E", "");
    }

    numericExpenseId = Number(numericExpenseId);

    const payload = {
      expense_id: numericExpenseId,
      month_year: selectedMonthYear,
      actual_amount: updateExpense.amount,
      due_date: updateExpense.due_date,
    };

    try {
      await axios.post("http://localhost:7760/saveExpensePayment", payload);
      alert("Expense Updated Successfully");
      setOpenUpdateDialog(false);
      fetchExpenses();
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




     <Dialog
  open={openDetailDialog}
  onClose={() => setOpenDetailDialog(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle style={{ fontWeight: "bold" }}>Expense Details</DialogTitle>
  <DialogContent dividers>
    {selectedExpense && (
      <Table size="small">
        <TableBody>
          {/* ID */}
          <TableRow>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell>{selectedExpense.id}</TableCell>
          </TableRow>
<TableRow>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell>{selectedExpense.type}</TableCell>
          </TableRow>
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
                    setSelectedExpense({ ...selectedExpense, regular: e.target.value })
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
                    setSelectedExpense({ ...selectedExpense, amount: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              ) : (
                formatCurrency(selectedExpense.amount)
              )}
            </TableCell>
          </TableRow>
          {/* Raised Date */}
<TableRow>
  <TableCell>
    <strong>
      {selectedExpense.regular === "Yes" ? "Start Date" : "Raised Date"}
    </strong>
  </TableCell>
  <TableCell>
    {isEditing ? (
      <TextField
        type="date"
        value={
          selectedExpense.raised_date
            ? new Date(selectedExpense.raised_date).toISOString().split("T")[0]
            : ""
        }
        onChange={(e) =>
          setSelectedExpense({ ...selectedExpense, raised_date: e.target.value })
        }
        fullWidth
        size="small"
      />
    ) : selectedExpense.raised_date ? (
      new Date(selectedExpense.raised_date)
        .toLocaleDateString("en-GB")
        .replaceAll("/", "-")
    ) : (
      "-"
    )}
  </TableCell>
</TableRow>


          {/* Due Date */}
         {/* Due Date */}
<TableRow>
  <TableCell><strong>Due Date</strong></TableCell>
  <TableCell>
    {isEditing ? (
      <TextField
        type="date"
        value={
          selectedExpense.due_date
            ? new Date(selectedExpense.due_date).toISOString().split("T")[0]
            : ""
        }
        onChange={(e) =>
          setSelectedExpense({ ...selectedExpense, due_date: e.target.value })
        }
        fullWidth
        size="small"
      />
    ) : (
      (() => {
        const due = new Date(selectedExpense.due_date);
        let displayedDate = new Date(due);

        if (selectedExpense.regular === "Yes" && selectedMonthYear) {
          const selected = new Date(selectedMonthYear + "-01");

          const monthDiff =
            (selected.getFullYear() - due.getFullYear()) * 12 +
            (selected.getMonth() - due.getMonth());

          // Only shift forward if regular === "Yes"
          displayedDate.setMonth(due.getMonth() + monthDiff + 1);
        }

        return displayedDate.toLocaleDateString("en-GB").replaceAll("/", "-");
      })()
    )}
  </TableCell>
</TableRow>


          {/* Status */}
          <TableRow>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell>
              {isEditing ? (
                <TextField
                  select
                  value={selectedExpense.status || ""}
                  onChange={(e) =>
                    setSelectedExpense({ ...selectedExpense, status: e.target.value })
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="Raised">Raised</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  {/* <MenuItem value="Paid">Paid</MenuItem> */}
                  <MenuItem value="Hold">Hold</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </TextField>
              ) : (
                <span
                  style={{
                    fontWeight: "bold",
                    color:
                      selectedExpense.status === "Raised"
                        ? "blue"
                        : selectedExpense.status === "Pending"
                        ? "orange"
                        : selectedExpense.status === "Paid"
                        ? "green"
                        : selectedExpense.status === "Hold"
                        ? "gray"
                        : "red",
                  }}
                >
                  {selectedExpense.status}
                </span>
              )}
            </TableCell>
          </TableRow>

          {/* Paid Date (readonly) */}
          <TableRow>
  <TableCell><strong>Paid Amount</strong></TableCell>
  <TableCell>
    {selectedExpense.paid_amount && selectedExpense.paymentstatus === "Paid" ? (
      formatCurrency(selectedExpense.paid_amount)
    ) : (
      <span style={{ color: "red", fontWeight: 600 }}>Not Paid</span>
    )}
  </TableCell>
</TableRow>

<TableRow>
  <TableCell><strong>Paid Date</strong></TableCell>
  <TableCell>
    {selectedExpense.paid_date &&
    selectedExpense.paymentstatus === "Paid" &&
    !isNaN(Date.parse(selectedExpense.paid_date)) ? (
      new Date(selectedExpense.paid_date)
        .toLocaleDateString("en-GB")
        .replaceAll("/", "-")
    ) : (
      <span style={{ color: "red", fontWeight: 600 }}>Not Paid</span>
    )}
  </TableCell>
</TableRow>

        </TableBody>
      </Table>
    )}
  </DialogContent>

  <DialogActions>
    {isEditing ? (
      <>
        <Button variant="contained" color="success" onClick={handleSaveChanges}>
          Save
        </Button>
        <Button variant="outlined" color="error" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </>
    ) : (
      <Button variant="outlined" color="success" onClick={() => setIsEditing(true)}>
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

  <Snackbar
  open={snackbarOpen}
  autoHideDuration={3000} // alert disappears after 3 seconds
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: "top", horizontal: "center" }}
>
  <Alert
    onClose={() => setSnackbarOpen(false)}
    severity="success" // "error" if you want error style
    sx={{ width: "100%" }}
  >
    {snackbarMessage}
  </Alert>
</Snackbar>
{/* Pay Modal */}
<Dialog
  open={openPayDialog}
  onClose={() => setOpenPayDialog(false)}
  maxWidth="sm"
  fullWidth
>


  <DialogTitle sx={{ fontWeight: "bold" }}>Mark as Paid</DialogTitle>
<DialogContent dividers>
  {payExpense && (
    <Box>
      {/* Table for expense info */}
      <Table size="small" sx={{ marginBottom: 2 }}>
        <TableBody>
          <TableRow>
            <TableCell><strong>Id</strong></TableCell>
            <TableCell>{payExpense.id}</TableCell>
          </TableRow>
          <TableRow style={{backgroundColor:"lightgray",borderRadius:"20px"}}>
            <TableCell><strong>Regular</strong></TableCell>
            <TableCell style={{color:"blueviolet",fontWeight:"bold"}}>{payExpense.regular}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell>{payExpense.type}</TableCell>
          </TableRow>
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

      {/* Form for Paid Date and Amount Paid */}
      <Box display="flex" gap={2}>
        <TextField
  label="Paid Date"
  type="date"
  InputLabelProps={{ shrink: true }}
  value={paidDate}
  onChange={(e) => setPaidDate(e.target.value)}
  inputProps={{
    min: payExpense.raised_date, // cannot select before raised date
    // max: new Date().toISOString().split("T")[0], // cannot select future date
  }}
  fullWidth
/>

        <TextField
          label="Amount To Pay"
          type="text"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
          fullWidth
        />
      </Box>
    </Box>
  )}
</DialogContent>


  <DialogActions>
    <Button onClick={() => setOpenPayDialog(false)}>Cancel</Button>
    <Button
      variant="contained"
      sx={{ backgroundColor: "green" }}
      onClick={() => handleMarkAsPaid(payExpense.id)}
    >
      Mark Paid
    </Button>
  </DialogActions>
</Dialog>


      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 30, right: 30 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Add Expense Dialog */}
   <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ fontWeight: "bold" }}>Add New Expense</DialogTitle>
  <DialogContent dividers>
    <Box display="flex" flexWrap="wrap" gap={2}>
      {/* Regular */}
      <Box flex="1 1 48%">
        <TextField
          fullWidth
          select
          label="Regular"
          value={newExpense.regular}
          onChange={(e) => setNewExpense({ ...newExpense, regular: e.target.value })}
        >
          <MenuItem value="Yes">Yes</MenuItem>
          <MenuItem value="No">No</MenuItem>
        </TextField>
      </Box>

      {/* Type */}
      <Box flex="1 1 48%">
        <TextField
          fullWidth
          select
          label="Type of Expense"
          value={newExpense.type}
          onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
        >
          {expenseOptions.map(option => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Raised Date */}
      <Box flex="1 1 48%">
        <TextField
      fullWidth
      type="date"
      label="Raised Date"
      InputLabelProps={{ shrink: true }}
      value={newExpense.raised_date}
      onChange={(e) =>
        setNewExpense({ ...newExpense, raised_date: e.target.value })
      }
      // inputProps={{ min: today, max: today }} // Only today selectable
    />
      </Box>

      {/* Due Date */}
      <Box flex="1 1 48%">
        <TextField
          fullWidth
          type="date"
          label="Due Date"
          InputLabelProps={{ shrink: true }}
          value={newExpense.due_date}
          onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })}
          // inputProps={{ min: newExpense.raised_date || undefined }}
        />
      </Box>

      {/* Amount */}
      <Box flex="1 1 48%">
        <TextField
          fullWidth
          type="text"
          label="Amount"
          value={newExpense.amount}
          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
        />
      </Box>

      {/* Description */}
      <Box flex="1 1 48%">
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          label="Description"
          value={newExpense.description}
          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
        />
      </Box>
    </Box>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
    <Button onClick={()=>{handleAddExpense()}} variant="contained" sx={{ backgroundColor: "#0d3b66" }}>
      Add
    </Button>
  </DialogActions>
</Dialog>



    </div>
  );
};

export default Expenses;