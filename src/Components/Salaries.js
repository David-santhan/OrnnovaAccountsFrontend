import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Fab, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  TextField, Button, Autocomplete,
  Divider, Box,Select,Typography,
  Link
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import dayjs from "dayjs";
import axios from "axios";
function Salaries() {
  
  const [salaries, setSalaries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedSalary, setSelectedSalary] = useState(null);
  
  const [newSalary, setNewSalary] = useState({
  employee_id: "",
  employee_name: "",
  month: "",  // ← FIXED
  paid: "No",
  paid_date: "",

  basic_pay: "",
  hra: "",
  conveyance_allowance: "",
  medical_allowance: "",
  lta: "",
  personal_allowance: "",
  gross_salary: "",
  ctc: "",

  professional_tax: "",
  insurance: "",
  pf: "",
  tds: "",

  employer_pf: "",
  employer_health_insurance: "",

  net_takehome: "",
});

  const [view, setView] = useState(""); // allSalaries | paidSalaries | pendingSalaries
  const [showTotal, setShowTotal] = useState(false);
  const [mode, setMode] = useState("All");
  const [month, setMonth] = useState("");
  const [filterMonthYear, setFilterMonthYear] = useState("");
  const [monthlySalarySelected, setMonthlySalarySelected] = useState(null);
  const [monthlySalaryData,setMonthlySalaryData] = useState([]);
  const [monthlySalaryDialogOpen, setMonthlySalaryDialogOpen] = useState(false);
  const [allEmployees,setAllEmployees] = useState([]);
  const [viewMonthlySalaryModal, setViewMonthlySalaryModal] = useState(false);
const [selectedSalaryRecord, setSelectedSalaryRecord] = useState(null);
const [pendingSummary, setPendingSummary] = useState([]);
 const [monthlySalaryFormData, setMonthlySalaryFormData] = useState({
  empId: "",
  empName: "",
  paid: "No",
  month: "",        // ❗ FIXED: do NOT set current month here
  lop: 0,
  paidAmount: 0,
  actualToPay: 0,
});

const currentMonth = dayjs().format("YYYY-MM");
const [openUpdateModal, setOpenUpdateModal] = useState(false);
const [selectedEmployee, setSelectedEmployee] = useState(null);
const [updateForm, setUpdateForm] = useState({
  month: "",
  actual_to_pay: "",
  due_date: "",
});


// get monthly Salaries by Month
const fetchAllMonthlySalaries = async () => {
  try {
    const res = await axios.get("http://localhost:7760/monthlySalary"); // No month param
    if (res.data.success) {
      setMonthlySalaryData(res.data.data); // Set all records
      console.log(res.data.data)
    } else {
      setMonthlySalaryData([]);
    }
  } catch (error) {
    console.error("Error fetching all salaries:", error);
    setMonthlySalaryData([]);
  }
};

// Call this once on component mount
useEffect(() => {
  fetchAllMonthlySalaries();
  fetchAllEmployees();
}, []);


  // Open dialog
// Open dialog
const monthlySalaryOpenDialog = (emp) => {
  const dojMonth = dayjs(emp.date_of_joining).format("YYYY-MM");

  const pending = pendingSummary.find(
    (p) =>
      p.employee_id === emp.employee_id &&
      p.pending_months === dojMonth
  );

  const selectedMonth = pending?.pending_months || dojMonth;

  setMonthlySalaryFormData({
    empId: emp.employee_id,
    empName: emp.employee_name,
    month: selectedMonth,   // ← Now correctly set here
    actualToPay: pending?.actual_to_pay || emp.net_takehome || 0,
    paid: "Yes",
    lop: 0,
    paidAmount: pending?.actual_to_pay || emp.net_takehome || 0,
  });

  setMonthlySalaryDialogOpen(true);
};



  // Close dialog
  const monthlySalaryCloseDialog = () => {
    setMonthlySalaryDialogOpen(false);
    setMonthlySalarySelected(null);
  };

  // Handle form input changes
const monthlySalaryHandleChange = (e) => {
  const { name, value } = e.target;

  setMonthlySalaryFormData((prev) => {
    let updated = { ...prev };

    if (name === "lop") {
      const lopDays = parseFloat(value) || 0;
      const actualPay = parseFloat(prev.actual_to_pay) || 0;

      updated.lop = value;

      // Correct month parsing
      const [year, monthStr] = prev.month.split("-");
      const month = parseInt(monthStr);
      const daysInMonth = new Date(year, month, 0).getDate();

      const perDayRate = actualPay / daysInMonth;

      // Recalculate paidAmount ONLY when LOP changes
      if (lopDays > 0) {
        updated.paidAmount = Math.max(actualPay - lopDays * perDayRate, 0);
      } else {
        updated.paidAmount = actualPay; // full amount
      }
    } 
    else if (name === "paidAmount") {
      // Allow manual override
      const numericValue = Number(value.replace(/[^0-9.]/g, "")) || 0;
      updated.paidAmount = numericValue;
    } 
    else {
      updated[name] = value;
    }

    return updated;
  });
};


 


  // Submit form
const monthlySalaryHandleSubmit = async () => {
  try {
    const payload = {
      paid: monthlySalaryFormData.paid,
      lop: parseFloat(monthlySalaryFormData.lop) || 0,
      paidAmount: parseFloat(monthlySalaryFormData.paidAmount) || 0,
      actualToPay: parseFloat(monthlySalaryFormData.actualToPay) || 0,
    };

    const response = await axios.put(
      `http://localhost:7760/monthlySalary/update/${monthlySalaryFormData.empId}/${monthlySalaryFormData.month}`,
      payload
    );

    if (response.data.success) {
      alert("Salary updated successfully!");
      monthlySalaryCloseDialog();
      fetchAllMonthlySalaries();
    } else {
      alert(response.data.message || "Failed to update salary");
    }
  } catch (error) {
    console.error("❌ Error updating salary:", error);
    alert("Server error while updating salary");
  }
};



 const getMonthYearLabel = (value) => {
    if (!value) return "All Months";
    const date = new Date(value + "-01");
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);

  const fetchAllEmployees = async () => {
    const res = await fetch("http://localhost:7760/getemployees");
    const data = await res.json();
    console.log(data)
    setAllEmployees(Array.isArray(data) ? data : []);
  };

// Filtered salaries inline


// Utility: get all months between two dates (format: "YYYY-MM")


const getMonthRange = (start, end) => {
  const months = [];
  let current = dayjs(start);
  const endDate = dayjs(end);
  while (current.isBefore(endDate) || current.isSame(endDate, "month")) {
    months.push(current.format("YYYY-MM"));
    current = current.add(1, "month");
  }
  return months;
};

// =========================
// 💰 Generate Filtered Salaries
// =========================
const filteredSalaries = allEmployees.flatMap((emp) => {
  if (!emp.date_of_joining) return [];

  const [joinYear, joinMonth] = emp.date_of_joining.split("-").map(Number);
  const joinDate = dayjs(`${joinYear}-${String(joinMonth).padStart(2, "0")}-01`);
  const selectedDate = dayjs(`${filterMonthYear}-01`);

  if (joinDate.isAfter(selectedDate)) return [];

  const monthsBetween = getMonthRange(joinDate, selectedDate);
  const paidMonths = monthlySalaryData
    .filter((m) => m.employee_id === emp.employee_id)
    .map((m) => m.month);

  const baseSalary =
    salaries.find((s) => s.employee_id === emp.employee_id) || {};

  const salaryRecord = monthlySalaryData.find(
    (m) => m.employee_id === emp.employee_id && m.month === filterMonthYear
  );

  if (view === "paidSalaries") {
    const currentPaid = monthlySalaryData.find(
      (m) => m.employee_id === emp.employee_id && m.month === filterMonthYear && m.paid === "Yes"
    );
    if (!currentPaid) return [];

    return [
      {
        ...emp,
        month: filterMonthYear,
        paid: "Yes",
        paid_amount: parseFloat(currentPaid.paid_amount || 0),
        net_takehome: parseFloat(
          currentPaid.net_takehome || baseSalary.net_takehome || 0
        ),
        ctc: parseFloat(baseSalary.ctc || 0),
        paid_date: currentPaid.paid_date || "",
      },
    ];
  }

  // For pending salaries (default)
  const pendingMonths = monthsBetween.filter((m) => !paidMonths.includes(m));
  return pendingMonths.map((month) => ({
    ...emp,
    month,
    paid: "No",
    paid_amount: 0,
    net_takehome: parseFloat(baseSalary.net_takehome || 0),
    ctc: parseFloat(baseSalary.ctc || 0),
  }));
});


// Totals
const totalPaid = filteredSalaries
  .filter((s) => s.paid === "Yes")
  .reduce((sum, s) => sum + parseFloat(s.paid_amount || 0), 0);

const totalPending = filteredSalaries
  .filter((s) => s.paid === "No")
  .reduce((sum, s) => sum + parseFloat(s.net_takehome || 0), 0);

const totalAll = filteredSalaries.reduce(
  (sum, s) =>
    sum +
    (s.paid === "Yes"
      ? parseFloat(s.paid_amount || 0)
      : parseFloat(s.net_takehome || 0)),
  0
);

  // ✅ Fetch salaries
  const fetchSalaries = async () => {
    const res = await fetch("http://localhost:7760/getallsalaries");
    const data = await res.json();
    setSalaries(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

const fetchPendingSummary = async () => {
  try {
    const res = await axios.get("http://localhost:7760/api/pending-salaries");
    if (res.data.success) {
      setPendingSummary(res.data.data);
      console.log(res.data.data)
    } else {
      setPendingSummary([]);
    }
  } catch (err) {
    console.error("Error fetching pending summary:", err);
    setPendingSummary([]);
  }
};

useEffect(() => {
  fetchPendingSummary();
}, []);


  const fetchEmployees = async () => {
    fetch("http://localhost:7760/getAvailableEmployeesForSalaries")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
        else if (Array.isArray(data.employees)) setEmployees(data.employees);
        else setEmployees([]);
      })
      .catch(() => setEmployees([]));
  };

  // ✅ Add salary
  const handleAddSalary = async () => {
    await fetch("http://localhost:7760/addsalaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSalary),
    });
    setOpenDialog(false);
    fetchSalaries();
  };

const handleSalaryChange = (key, value) => {
  let updatedSalary = { ...newSalary };

  // Convert monthly to yearly if user edited monthly field
  if (key.endsWith("_monthly")) {
    const yearlyKey = key.replace("_monthly", "");
    updatedSalary[yearlyKey] = (parseFloat(value || 0) * 12).toFixed(2);
    updatedSalary[key] = value;
  } else {
    updatedSalary[key] = value;
  }

  setNewSalary(calculateSalary(updatedSalary));
};

const calculateSalary = (salary) => {
  const ctc_yearly = parseFloat(salary.ctc || 0);
  const tds = parseFloat(salary.tds || 0);
  
  // Apply TDS deduction
  const effective_ctc = Math.max(ctc_yearly - tds, 0);


  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num || 0);

  // Yearly components
  const basic_pay_yearly = effective_ctc * 0.4;
  const hra_yearly = effective_ctc * 0.2;
  const conveyance_allowance_yearly = 19200;
  const medical_allowance_yearly = 15000;
  const lta_yearly = 12000;
  const insurance_yearly = 6000;
  const employer_health_insurance_yearly = 6000;

  // PF Calculations
  const basic_monthly = basic_pay_yearly / 12;
  const pf_yearly = (basic_monthly < 15000 ? basic_monthly * 0.12 : 1800) * 12;
  const employer_pf_yearly = pf_yearly;

  // Personal Allowance
  const personal_allowance_yearly =
    effective_ctc -
    (basic_pay_yearly +
      hra_yearly +
      conveyance_allowance_yearly +
      medical_allowance_yearly +
      lta_yearly +
      employer_pf_yearly +
      employer_health_insurance_yearly);

  // Gross and Net Salary
  const gross_salary_yearly =
    basic_pay_yearly +
    hra_yearly +
    conveyance_allowance_yearly +
    medical_allowance_yearly +
    lta_yearly +
    personal_allowance_yearly;

  const professional_tax_yearly =
    (gross_salary_yearly / 12 > 25000 ? 200 : 0) * 12;

  const net_takehome_yearly =
    gross_salary_yearly - pf_yearly - insurance_yearly - professional_tax_yearly;

  // Monthly values
  const monthly = (val) => (val / 12).toFixed(2);

  return {
    ...salary,
    ctc: ctc_yearly.toFixed(2),
    tds: tds,

    // Yearly
    basic_pay_yearly,
    hra_yearly,
    conveyance_allowance_yearly,
    medical_allowance_yearly,
    lta_yearly,
    personal_allowance_yearly,
    gross_salary_yearly,
    professional_tax_yearly,
    insurance_yearly,
    pf_yearly,
    employer_pf_yearly,
    employer_health_insurance_yearly,
    net_takehome_yearly,

    // Monthly
    basic_pay: monthly(basic_pay_yearly),
    hra: monthly(hra_yearly),
    conveyance_allowance: monthly(conveyance_allowance_yearly),
    medical_allowance: monthly(medical_allowance_yearly),
    lta: monthly(lta_yearly),
    personal_allowance: monthly(personal_allowance_yearly),
    gross_salary: monthly(gross_salary_yearly),
    professional_tax: monthly(professional_tax_yearly),
    insurance: monthly(insurance_yearly),
    pf: monthly(pf_yearly),
    employer_pf: monthly(employer_pf_yearly),
    employer_health_insurance: monthly(employer_health_insurance_yearly),
    net_takehome: monthly(net_takehome_yearly),
  };
};
const getPaidStatus = (empId) => {
  // const currentMonth = dayjs().format("YYYY-MM");
  const record = monthlySalaryData.find(
    (m) => m.employee_id === empId && m.month === month
  );
  return record ? record.paid : "No"; // Default No if not found
};

const handleSalaryUpdate = async () => {
  if (!updateForm.due_date) {
    alert("Please select a due date before saving.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:7760/update-salary/${selectedEmployee.employee_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateForm),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Salary updated successfully!");
      setOpenUpdateModal(false);
      // optionally refetch salary data
      // fetchMonthlySalaryData();
    } else {
      alert(data.error || "Failed to update salary");
    }
  } catch (err) {
    console.error("❌ Error updating salary:", err);
    alert("Server error while updating salary");
  }
};


  return (
    <div style={{ padding: "20px" }}>
     <div style={{ paddingTop: "120px" }}>
      {/* Sticky Header Bar */}
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
        {/* Left Controls */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Button
            variant={view === "allSalaries" ? "contained" : "outlined"}
            onClick={() => setView("allSalaries")}
          >
            All Salaries
          </Button>
          <Button
            variant={view === "paidSalaries" ? "contained" : "outlined"}
            onClick={() => setView("paidSalaries")}
          >
            Paid Salaries
          </Button>
          <Button
            variant={view === "pendingSalaries" ? "contained" : "outlined"}
            onClick={() => setView("pendingSalaries")}
          >
            Pending Salaries
          </Button>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: "6px", marginLeft: "10px" }}
          />
          <Button
            variant="outlined"
            color="error"
            onClick={() => setFilterMonthYear(month)}
          >
            Search
          </Button>
        </div>

        {/* Right - Total Computation */}
        {!showTotal ? (
          <Button
            variant="contained"
            color="success"
            startIcon={<VisibilityIcon />}
            onClick={() => setShowTotal(true)}
            style={{ margin: "10px" }}
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
              fontSize: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              {mode === "All" ? (
                <span style={{ color: "gray", fontSize: "12px" }}>
                  Total Salary in{" "}
                  <span style={{ color: "black" }}>
                    {getMonthYearLabel(filterMonthYear)}
                  </span>
                  :{" "}
                  <span style={{ color: "blue" }}>
                    {formatCurrency(totalAll)}
                  </span>
                </span>
              ) : mode === "Paid" ? (
                <span style={{ color: "gray", fontSize: "12px" }}>
                  Total Paid in{" "}
                  <span style={{ color: "black" }}>
                    {getMonthYearLabel(filterMonthYear)}
                  </span>
                  :{" "}
                  <span style={{ color: "green" }}>
                    {formatCurrency(totalPaid)}
                  </span>
                </span>
              ) : (
                <span style={{ color: "gray", fontSize: "12px" }}>
                  Total Pending in{" "}
                  <span style={{ color: "black" }}>
                    {getMonthYearLabel(filterMonthYear)}
                  </span>
                  :{" "}
                  <span style={{ color: "indianred" }}>
                    {formatCurrency(totalPending)}
                  </span>
                </span>
              )}

              <Select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                size="small"
                style={{ fontSize: "12px", height: "30px", marginTop: "4px" }}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </div>

            <VisibilityOffIcon
              style={{ cursor: "pointer" }}
              onClick={() => setShowTotal(false)}
            />
          </div>
        )}
      </div>



      
    </div>
<div
  style={{
    position: "absolute",   // position relative to the page
    top: "150px",           // below your sticky header
    left: 250,
    right: 0,
    bottom: 0,              // occupy full remaining height
    overflowY: "auto",      // scrollable
    border: "1px solid #ccc",
    borderRadius: "10px",
    width: "80%"
  }}
>
{/* All Salaries */}
{view === "allSalaries" && (
  <TableContainer
    component={Paper}
    elevation={3}
    style={{ width: "100%", height: "500px" }}
  >
    {/* Styled Divider for Month & Year */}
    <Divider
      textAlign="center"
      sx={{
        marginY: 2,
        "&::before, &::after": {
          borderColor: "#1976d2",
          borderWidth: "2px",
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: "#1976d2",
          color: "white",
          px: 3,
          py: 0.5,
          borderRadius: "6px",
          display: "inline-block",
          fontWeight: "bold",
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(25, 118, 210, 0.3)",
        }}
      >
        {dayjs(month, "YYYY-MM").format("MMMM YYYY")}
      </Box>
    </Divider>

    <Table stickyHeader style={{ minWidth: "100%" }}>
      <TableHead style={{ backgroundColor: "#f5f5f5" }}>
        <TableRow>
          <TableCell style={{ fontWeight: "bold" }}>Emp ID</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Emp Name</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>CTC</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Take Home</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Actual to Pay</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Paid</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
        </TableRow>
      </TableHead>
<TableBody>
  {[...new Map(filteredSalaries.map((e) => [e.employee_id, e])).values()].map(
    (emp) => {
      // ✅ Find salary record for this employee & month
      const salaryRecord = monthlySalaryData.find(
        (m) =>
          m.employee_id === emp.employee_id &&
          dayjs(m.month, "YYYY-MM").isSame(dayjs(month, "YYYY-MM"), "month") &&
          dayjs(m.month, "YYYY-MM").isSame(dayjs(month, "YYYY-MM"), "year")
      );

      const paidStatus = salaryRecord ? salaryRecord.paid : "No";
      const hasRecord = !!salaryRecord;
      const isUnpaidRecord = hasRecord && paidStatus === "No";
      const canPay = isUnpaidRecord && salaryRecord.actual_to_pay > 0;

      return (
        <TableRow
          key={emp.employee_id}
          hover
          onClick={() =>
            setSelectedSalary({
              ...emp,
              ...(salaryRecord || {}),
            })
          }
        >
          <TableCell>{emp.employee_id}</TableCell>
          <TableCell>{emp.employee_name}</TableCell>
          <TableCell>{formatCurrency(emp.ctc)}</TableCell>
          <TableCell>{formatCurrency(emp.net_takehome)}</TableCell>

          {/* ✅ Actual To Pay / Update Column */}
          <TableCell>
  {hasRecord ? (
    paidStatus === "No" ? (
      // 🔴 Case 1: Record exists but NOT paid
      <>
        <Typography
          variant="body1"
          sx={{ fontWeight: "bold", color: "#374151" }}
        >
          {formatCurrency(salaryRecord.actual_to_pay || 0)}
        </Typography>

        <Typography
          variant="caption"
          color={
            salaryRecord.due_date &&
            dayjs(salaryRecord.due_date).isBefore(dayjs())
              ? "error"
              : "textSecondary"
          }
          sx={{ display: "block", mt: 0.5 }}
        >
          Due:{" "}
          {salaryRecord.due_date
            ? dayjs(salaryRecord.due_date).format("DD-MMM-YYYY")
            : "-"}
        </Typography>
      </>
    ) : (
      // 🟢 Case 2: Record exists AND already paid
      <>
        <Typography
          variant="body1"
          sx={{ fontWeight: "bold", color: "green" }}
        >
          Paid: {formatCurrency(salaryRecord.paid_amount || 0)}
        </Typography>

        <Typography
          variant="caption"
          sx={{ color: "green", display: "block", mt: 0.5 }}
        >
          Paid On:{" "}
          {salaryRecord.paid_date
            ? dayjs(salaryRecord.paid_date).format("DD-MMM-YYYY")
            : "-"}
        </Typography>
      </>
    )
  ) : (
    // 🔵 Case 3: No record → show Update
    <Link
      component="button"
      underline="hover"
      color="primary"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEmployee(emp);
        setUpdateForm({
          month: dayjs(month).format("YYYY-MM"),
          actual_to_pay: emp.net_takehome || "",
          due_date: "",
        });
        setOpenUpdateModal(true);
      }}
    >
      Update
    </Link>
  )}
</TableCell>

          {/* ✅ Paid / Not Paid Indicator */}
          <TableCell style={{ textAlign: "start", fontWeight: "bold" }}>
            <span
              style={{
                color: paidStatus === "Yes" ? "green" : "red",
                display: "inline-block",
                animation: paidStatus === "Yes" ? "heartbeat 1s infinite" : "none",
                textShadow:
                  paidStatus === "Yes"
                    ? "0 0 5px green, 0 0 10px green"
                    : "0 0 5px red, 0 0 10px red",
              }}
            >
              {paidStatus}
            </span>
            <style>
              {`
                @keyframes heartbeat {
                  0%, 100% { transform: scale(1); }
                  25%, 75% { transform: scale(1.2); }
                  50% { transform: scale(1); }
                }
              `}
            </style>
          </TableCell>

          {/* ✅ Pay / View Button */}
          <TableCell>
            <Button
              variant="outlined"
              color={paidStatus === "Yes" ? "primary" : "success"}
              disabled={!canPay && paidStatus !== "Yes"} // 🚫 Disable if unpaid and no actual_to_pay
              onClick={(e) => {
                e.stopPropagation();
                if (paidStatus === "Yes") {
                  setSelectedSalaryRecord({
                    ...emp,
                    ...(salaryRecord || {}),
                  });
                  setViewMonthlySalaryModal(true);
                } else if (canPay) {
                  monthlySalaryOpenDialog({
                    ...emp,
                    ...(salaryRecord || {}),
                  });
                }
              }}
            >
              {paidStatus === "Yes" ? "View" : "Pay"}
            </Button>
          </TableCell>
        </TableRow>
      );
    }
  )}

  {/* ❌ No employee fallback */}
  {filteredSalaries.length === 0 && (
    <TableRow>
      <TableCell colSpan={6} align="center">
        <Typography color="textSecondary" sx={{ py: 2 }}>
          No employee records found for{" "}
          {dayjs(month, "YYYY-MM").format("MMMM YYYY")}
        </Typography>
      </TableCell>
    </TableRow>
  )}
</TableBody>






    </Table>
  </TableContainer>
)}


{/* Months Actual to pay update Dialog */}
<Dialog
  open={openUpdateModal}
  onClose={() => setOpenUpdateModal(false)}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle
    sx={{
      fontWeight: "bold",
      textAlign: "center",
      backgroundColor: "#f3f4f6",
      borderBottom: "1px solid #e5e7eb",
    }}
  >
    Update Salary Payment
  </DialogTitle>

  <DialogContent sx={{ p: 3, backgroundColor: "#fafafa" }}>
    {selectedEmployee ? (
      <>
        {/* Employee Info */}
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "bold", mb: 1, color: "#374151",textAlign:"center" }}
        >
          Employee: {selectedEmployee.employee_name} ({selectedEmployee.employee_id})
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Month */}
        <TextField
  fullWidth
  label="Month"
  value={
    updateForm.month
      ? dayjs(updateForm.month, "YYYY-MM").format("MMM-YYYY") // 👉 Converts "2025-11" → "Nov-2025"
      : ""
  }
  InputProps={{ readOnly: true }}
  margin="normal"
  sx={{
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      "&:hover fieldset": { borderColor: "black" },
      "&.Mui-focused fieldset": { borderColor: "black" },
    },
  }}
/>


        {/* Actual to Pay */}
        <TextField
          fullWidth
          label="Actual To Pay (₹)"
          type="text"
          value={updateForm.actual_to_pay}
          onChange={(e) =>
            setUpdateForm((prev) => ({
              ...prev,
              actual_to_pay: e.target.value,
            }))
          }
          margin="normal"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "black" },
              "&:hover fieldset": { borderColor: "black" },
              "&.Mui-focused fieldset": { borderColor: "black" },
            },
          }}
        />

        {/* Due Date */}
        <TextField
          fullWidth
          type="date"
          label="Due Date"
          value={updateForm.due_date}
          onChange={(e) =>
            setUpdateForm((prev) => ({
              ...prev,
              due_date: e.target.value,
            }))
          }
          margin="normal"
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "black" },
              "&:hover fieldset": { borderColor: "black" },
              "&.Mui-focused fieldset": { borderColor: "black" },
            },
          }}
        />
      </>
    ) : (
      <Typography align="center" color="textSecondary">
        No employee selected
      </Typography>
    )}
  </DialogContent>

  <DialogActions sx={{ justifyContent: "center", p: 2 }}>
    <Button
      variant="contained"
      onClick={() => setOpenUpdateModal(false)}
      sx={{
        backgroundColor: "#6b7280",
        "&:hover": { backgroundColor: "#4b5563" },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      color="success"
      onClick={() => handleSalaryUpdate()}
    >
      Save
    </Button>
  </DialogActions>
</Dialog>



  {/* Dialog to View Monthly Salaries */}
  <Dialog
  open={viewMonthlySalaryModal}
  onClose={() => setViewMonthlySalaryModal(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle
    style={{
      fontWeight: "bold",
      background: "#f5f5f5",
      borderBottom: "1px solid #ddd",
    }}
  >
    Monthly Salary Details
  </DialogTitle>

  <DialogContent dividers>
  {selectedSalaryRecord ? (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: "#fafafa",
        boxShadow: "0 0 8px rgba(0,0,0,0.1)",
      }}
    >
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell><b>Employee ID</b></TableCell>
              <TableCell>{selectedSalaryRecord.employee_id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><b>Employee Name</b></TableCell>
              <TableCell>{selectedSalaryRecord.employee_name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><b>Month</b></TableCell>
              <TableCell>{selectedSalaryRecord.month}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><b>Paid</b></TableCell>
              <TableCell>
                <span
                  style={{
                    color: selectedSalaryRecord.paid === "Yes" ? "green" : "red",
                    fontWeight: "bold",
                  }}
                >
                  {selectedSalaryRecord.paid}
                </span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell><b>Actual to Pay</b></TableCell>
              <TableCell>₹{selectedSalaryRecord.actual_to_pay?.toLocaleString() || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><b>Loss of Pay (LOP)</b></TableCell>
              <TableCell style={{fontWeight:'bold',color:"indianred"}} >{selectedSalaryRecord.lop || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><b>Paid Amount</b></TableCell>
              <TableCell style={{fontWeight:'bold',color:"blue"}}>₹{selectedSalaryRecord.paid_amount?.toLocaleString() || 0}</TableCell>
            </TableRow>
            
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  ) : (
    <p>No details available</p>
  )}
</DialogContent>


  <DialogActions>
    <Button
      onClick={() => setViewMonthlySalaryModal(false)}
      color="error"
      variant="outlined"

    >
      Close
    </Button>
  </DialogActions>
</Dialog>



  {/* Dialog to Add Monthly Salaries */}
   <Dialog open={monthlySalaryDialogOpen} onClose={monthlySalaryCloseDialog} fullWidth maxWidth="sm">
   <DialogTitle style={{fontWeight:"bold"}}>Pay Salary</DialogTitle>
   <DialogContent style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px",padding:"20px",backgroundColor:"whitesmoke",borderRadius:"5px",border:"1px solid #ccc" }}>
    
    {/* Top Row: Read-only fields */}
    <Box display="flex" gap={2}>
      <TextField
        label="Emp ID"
        name="empId"
        value={monthlySalaryFormData.empId}
        InputProps={{ readOnly: true }}
        fullWidth
      />
      <TextField
        label="Emp Name"
        name="empName"
        value={monthlySalaryFormData.empName}
        InputProps={{ readOnly: true }}
        fullWidth
      />
    

     <TextField
  label="Actual To Pay"
  name="actualToPay"
  value={formatCurrency(
    monthlySalaryFormData.actual_to_pay ??
    monthlySalaryFormData.actualToPay ??
    0
  )}
  InputProps={{ readOnly: true }}
  fullWidth
  sx={{
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#f9fafb",
      "& fieldset": { borderColor: "black" },
    },
  }}
/>

      </Box>
    <Divider></Divider>
          
    {/* Bottom Row: Editable Fields */}
    <Box display="flex" gap={2} mt={2}>
     
      <TextField
  select
  label="Paid"
  name="paid"
  value={monthlySalaryFormData.paid}
  onChange={monthlySalaryHandleChange}
  fullWidth
>
  <MenuItem value="Yes">Yes</MenuItem>
  <MenuItem value="No">No</MenuItem>
</TextField>

<TextField
  type="month"
  label="Month"
  name="month"
  value={monthlySalaryFormData.month}
  onChange={monthlySalaryHandleChange}
  InputLabelProps={{ shrink: true }}
  fullWidth
  disabled={monthlySalaryFormData.paid === "No"}
/>


    </Box>
    <Box display="flex" gap={2}>
 <TextField
        type="text"
        label="LOP"
        name="lop"
        value={monthlySalaryFormData.lop}
        onChange={monthlySalaryHandleChange}
        fullWidth
          disabled={monthlySalaryFormData.paid === "No"} // Disable if Paid is No
      />
     <TextField
  label="Paid Amount"
  name="paidAmount"
  value={formatCurrency(monthlySalaryFormData.paidAmount || 0)}
  onChange={monthlySalaryHandleChange}
  type="text"
  fullWidth
  disabled={monthlySalaryFormData.paid === "No"}
  sx={{
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      backgroundColor: "#fdfdfd",
    },
  }}
/>

    </Box>
  </DialogContent>

  <DialogActions>
    <Button onClick={monthlySalaryCloseDialog}>Cancel</Button>
    <Button disabled={monthlySalaryFormData.paid === "No"} variant="contained" color="primary" onClick={monthlySalaryHandleSubmit}>
      Submit
    </Button>
  </DialogActions>
</Dialog>

 {/* Paid Salaries */}
{/* Paid Salaries */}
{view === "paidSalaries" && (
  <TableContainer component={Paper} elevation={3} style={{ width: "100%", height: "100%" }}>
    <Divider
  textAlign="center"
  sx={{
    marginY: 2,
    "&::before, &::after": {
      borderColor: "block",
    },
  }}
>
  <Typography
    variant="h6"
    sx={{
      color: "block",
      fontWeight: "bold",
      letterSpacing: "0.5px",
    }}
  >
    {dayjs(month, "YYYY-MM").format("MMMM YYYY")}
  </Typography>
</Divider>

    <Table stickyHeader style={{ minWidth: "100%" }}>
      <TableHead style={{ backgroundColor: "#f5f5f5" }}>
        <TableRow>
          <TableCell style={{ fontWeight: "bold" }}>Emp ID</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Emp Name</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>CTC</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Net Take</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Actual Paid</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Difference</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Paid Date</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Paid</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {filteredSalaries.map((s) => {
          const difference = s.net_takehome - s.paid_amount;
          return (
            <TableRow
              key={s.employee_id}
              hover
              onClick={() => setSelectedSalary(s)}  // ✅ Added same as allSalaries
              style={{ cursor: "pointer" }}         // ✅ Visual cue
            >
              <TableCell>{s.employee_id}</TableCell>
              <TableCell>{s.employee_name}</TableCell>
              <TableCell>{s.ctc}</TableCell>
              <TableCell>{s.net_takehome}</TableCell>
              <TableCell>{s.paid_amount}</TableCell>
              <TableCell>{difference}</TableCell>
              <TableCell>
                {s.paid_date
                  ? new Date(s.paid_date).toLocaleDateString()
                  : "-"}
              </TableCell>

              {/* ✅ Paid status color */}
              <TableCell
                sx={{
                  color: s.paid === "Yes" ? "green" : "red",
                  fontWeight: 600,
                  textShadow:
                    s.paid === "Yes"
                      ? "0 0 5px limegreen, 0 0 10px green"
                      : "0 0 5px red, 0 0 10px red",
                }}
              >
                {s.paid}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
)}

{/* Pending Salaries */}
{view === "pendingSalaries" && (
  
  <TableContainer component={Paper} elevation={3} style={{ width: "100%", height: "100%" }}>
    <Divider
  textAlign="center"
  sx={{
    marginY: 2,
    "&::before, &::after": {
      borderColor: "block",
    },
  }}
>
  <Typography
    variant="h6"
    sx={{
      color: "block",
      fontWeight: "bold",
      letterSpacing: "0.5px",
    }}
  >
    {dayjs(month, "YYYY-MM").format("MMMM YYYY")}
  </Typography>
</Divider>

    <Table stickyHeader style={{ minWidth: "100%" }}>
      <TableHead style={{ backgroundColor: "#f5f5f5" }}>
        <TableRow>
          <TableCell style={{ fontWeight: "bold" }}>Emp ID</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Emp Name</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Month-Year</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>CTC</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Net Take</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Actual To Pay</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Paid</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
        </TableRow>
      </TableHead>

  <TableBody>
  {filteredSalaries.map((s) => {

    // 1️⃣ Convert "2025 09" --> "2025-09"
    const formattedMonth = s.month.replace(" ", "-");

    // 2️⃣ Find matching record in monthlySalaryData
    const salaryRecord = monthlySalaryData.find(
      (m) =>
        m.employee_id === s.employee_id &&
        m.month === formattedMonth
    );

    // 3️⃣ If found, use actual_to_pay & due_date from monthlySalaryData
    const actualToPayValue = salaryRecord?.actual_to_pay ?? s.actual_to_pay;
    const dueDateValue = salaryRecord?.due_date ?? "-";

    return (
      <TableRow
        key={s.employee_id + formattedMonth}
        hover
        onClick={() => setSelectedSalary(s)}
      >
        <TableCell>{s.employee_id}</TableCell>
        <TableCell>{s.employee_name}</TableCell>

        {/* Show original month */}
        <TableCell>{s.month}</TableCell>

        <TableCell>{formatCurrency(s.ctc)}</TableCell>
        <TableCell>{formatCurrency(s.net_takehome)}</TableCell>

        {/* ⭐ actual_to_pay coming from salaryRecord if exists */}
        <TableCell>{formatCurrency(actualToPayValue)}</TableCell>

        {/* ⭐ due_date coming from salaryRecord if exists */}
        <TableCell>{dueDateValue}</TableCell>

        <TableCell>
          <Button
            variant="outlined"
            color="secondary"
            onClick={(e) => {
              e.stopPropagation();
              monthlySalaryOpenDialog(s);
            }}
          >
            Pay
          </Button>
        </TableCell>
      </TableRow>
    );
  })}
</TableBody>


    </Table>
  </TableContainer>
)}

</div>



      {/* Salary Details Dialog */}
      <Dialog open={!!selectedSalary} onClose={() => setSelectedSalary(null)} maxWidth="sm" fullWidth>
        <DialogTitle style={{fontWeight:"bold"}}>Salary Structure</DialogTitle>
     <DialogContent dividers>
  {selectedSalary && (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {/* Employee Details */}
        <tr>
          <td colSpan={2} style={{ backgroundColor: "#f0f0f0", padding: 8, fontWeight: "bold", textAlign: "center" }}>
            EMPLOYEE DETAILS
          </td>
        </tr>
        {/* {["employee_id", "employee_name", "month", "paid", "paid_date"] */}
         {["employee_id", "employee_name"]
          .filter((key) => key in selectedSalary)
          .map((key) => (
            <tr key={key}>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: "bold" }}>
                {key.replace(/_/g, " ").toUpperCase()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {typeof selectedSalary[key] === "number"
                  ? formatCurrency(selectedSalary[key])
                  : selectedSalary[key]}
              </td>
            </tr>
          ))}

        {/* Salary Components */}
        <tr>
          <td colSpan={2} style={{ backgroundColor: "#f0f0f0", padding: 8, fontWeight: "bold", textAlign: "center" }}>
            SALARY COMPONENTS
          </td>
        </tr>
        {["basic_pay","hra","conveyance_allowance","medical_allowance","lta","personal_allowance","gross_salary","ctc"]
          .filter((key) => key in selectedSalary)
          .map((key) => (
            <tr key={key}>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: "bold" }}>
                {key.replace(/_/g, " ").toUpperCase()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {typeof selectedSalary[key] === "number"
                  ? formatCurrency(selectedSalary[key])
                  : selectedSalary[key]}
              </td>
            </tr>
          ))}

        {/* Deductions */}
        <tr>
          <td colSpan={2} style={{ backgroundColor: "#f0f0f0", padding: 8, fontWeight: "bold", textAlign: "center" }}>
            DEDUCTIONS
          </td>
        </tr>
        {["professional_tax","insurance","pf","tds"]
          .filter((key) => key in selectedSalary)
          .map((key) => (
            <tr key={key}>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: "bold" }}>
                {key.replace(/_/g, " ").toUpperCase()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {typeof selectedSalary[key] === "number"
                  ? formatCurrency(selectedSalary[key])
                  : selectedSalary[key]}
              </td>
            </tr>
          ))}

        {/* Employer Contributions */}
        <tr>
          <td colSpan={2} style={{ backgroundColor: "#f0f0f0", padding: 8, fontWeight: "bold", textAlign: "center" }}>
            EMPLOYER CONTRIBUTIONS
          </td>
        </tr>
        {["employer_pf","employer_health_insurance"]
          .filter((key) => key in selectedSalary)
          .map((key) => (
            <tr key={key}>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: "bold" }}>
                {key.replace(/_/g, " ").toUpperCase()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {typeof selectedSalary[key] === "number"
                  ? formatCurrency(selectedSalary[key])
                  : selectedSalary[key]}
              </td>
            </tr>
          ))}

        {/* Net Take Home */}
        <tr>
          <td colSpan={2} style={{ backgroundColor: "#f0f0f0", padding: 8, fontWeight: "bold", textAlign: "center" }}>
            NET TAKE HOME
          </td>
        </tr>
        {["net_takehome"]
          .filter((key) => key in selectedSalary)
          .map((key) => (
            <tr key={key}>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: "bold" }}>
                {key.replace(/_/g, " ").toUpperCase()}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {typeof selectedSalary[key] === "number"
                  ? formatCurrency(selectedSalary[key])
                  : selectedSalary[key]}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )}
</DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedSalary(null)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Floating Button */}
      <Fab
        color="primary"
        aria-label="add"
        style={{ position: "fixed", bottom: "20px", right: "20px" }}
        onClick={() => {
          setOpenDialog(true);
          fetchEmployees();
        }}
      >
        <AddIcon />
      </Fab>

      {/* Add Salary Dialog */}
<Dialog open={openDialog} onClose={() => {setOpenDialog(false);setNewSalary({});}} fullWidth maxWidth="sm">
  <DialogTitle style={{ fontWeight: "bold" }}>Add Salary Details</DialogTitle>
  <DialogContent style={{ backgroundColor: "whitesmoke", margin: "20px", borderRadius: "10px" }} dividers>

    {/* Employee & Month Selection */}
    <Box display="flex" gap={2} mb={2}>
      <Autocomplete
  style={{ flex: 1 }}
  options={employees}
  getOptionLabel={(option) => `${option.employee_id} - ${option.employee_name}`}
  value={
    employees.find(
      (emp) => emp.employee_id === newSalary.employee_id
    ) || null
  }
onChange={(event, newValue) => {
  if (newValue) {
    const ctc_monthly = parseFloat(newValue.ctc || 0);

    // ⭐ 1. Compute month from DOJ
    let dojMonth = "";
    if (newValue.date_of_joining) {
      dojMonth = newValue.date_of_joining.slice(0, 7); 
      // Example: "2024-03"
    }

    // ⭐ 2. If backend has pending month for this employee, use that instead
    const pending = pendingSummary?.find(
      (p) => p.employee_id === newValue.employee_id
    );

    const finalMonth = pending?.pending_months || dojMonth || "";

    // ⭐ 3. Set salary details
    setNewSalary(
      calculateSalary({
        ...newSalary,
        employee_id: newValue.employee_id,
        employee_name: newValue.employee_name,
        ctc: ctc_monthly,
        month: finalMonth,   // ← Correct month
      })
    );
  } else {
    setNewSalary({});
  }
}}

  renderInput={(params) => (
    <TextField {...params} label="Employee" margin="dense" />
  )}
  ListboxProps={{
    style: {
      maxHeight: 48 * 3.5, // 👈 ~3 visible options (each ~48px height)
      overflowY: "auto",
    },
  }}
/>

      <TextField
  style={{ flex: 1 }}
  margin="dense"
  label="Month"
  type="month"
  value={newSalary.month}
  onChange={(e) => setNewSalary({ ...newSalary, month: e.target.value })}
  InputLabelProps={{ shrink: true }}
/>


    </Box>

    {/* Editable CTC */}
    {/* Editable CTC and TDS */}
<Box mb={2} display="flex" gap={2} flexDirection="column">
  <Box display="flex" gap={2}>
    <TextField
      label="CTC (₹)"
      type="text"
      fullWidth
      value={newSalary.ctc || ""}
      onChange={(e) => {
        const ctcValue = parseFloat(e.target.value || 0);
        setNewSalary(
          calculateSalary({ ...newSalary, ctc: ctcValue })
        );
      }}
    />

    <TextField
      label="TDS (₹)"
      type="text"
      fullWidth
      value={newSalary.tds || ""}
      onChange={(e) => {
        const tdsValue = parseFloat(e.target.value || 0);
        setNewSalary(
          calculateSalary({ ...newSalary, tds: tdsValue })
        );
      }}
    />
  </Box>

  {/* Small helper text below TDS */}
  <Typography variant="caption" color="textSecondary">
    CTC after TDS Deduction: ₹{" "}
    {newSalary.ctc && newSalary.tds
      ? (newSalary.ctc - newSalary.tds).toLocaleString("en-IN")
      : ""}
  </Typography>
</Box>



    {/* Salary Components */}
    <Divider style={{ margin: "20px 0", fontWeight: "bold" }}>Salary Components</Divider>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Component</TableCell>
          <TableCell>Yearly (₹)</TableCell>
          <TableCell>Monthly (₹)</TableCell>
        </TableRow>
      </TableHead>
     <TableBody>
  {[
    { label: "Basic Pay", monthly: "basic_pay", yearly: "basic_pay_yearly" },
    { label: "HRA", monthly: "hra", yearly: "hra_yearly" },
    { label: "Conveyance", monthly: "conveyance_allowance", yearly: "conveyance_allowance_yearly" },
    { label: "Medical Allowance", monthly: "medical_allowance", yearly: "medical_allowance_yearly" },
    { label: "LTA", monthly: "lta", yearly: "lta_yearly" },
    { label: "Personal Allowance", monthly: "personal_allowance", yearly: "personal_allowance_yearly" },
  ].map(row => (
    <TableRow key={row.label}>
      <TableCell>{row.label}</TableCell>

      {/* Yearly Field - Editable */}
      <TableCell>
        <TextField
          value={newSalary[row.yearly] || ""}
          onChange={(e) => handleSalaryChange(row.yearly, e.target.value)}
        />
      </TableCell>

      {/* Monthly Field - Editable */}
      <TableCell>
        <TextField
          value={newSalary[row.monthly] || ""}
          onChange={(e) => handleSalaryChange(row.monthly, e.target.value)}
        />
      </TableCell>
    </TableRow>
  ))}
</TableBody>

    </Table>

    {/* Deductions */}
    <Divider style={{ margin: "20px 0", fontWeight: "bold" }}>Deductions</Divider>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Component</TableCell>
          <TableCell>Yearly (₹)</TableCell>
          <TableCell>Monthly (₹)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[
          { label: "Employee PF", monthly: "pf", yearly: "pf_yearly" },
          { label: "Employer PF", monthly: "employer_pf", yearly: "employer_pf_yearly" },
          { label: "Insurance", monthly: "insurance", yearly: "insurance_yearly" },
          { label: "Employer Insurance", monthly: "employer_health_insurance", yearly: "employer_health_insurance_yearly" },
          { label: "Professional Tax", monthly: "professional_tax", yearly: "professional_tax_yearly" },
        ].map(row => (
          <TableRow key={row.label}>
            <TableCell>{row.label}</TableCell>
            <TableCell>
              <TextField
                value={newSalary[row.yearly] || ""}
                InputProps={{ readOnly: true }}
              />
            </TableCell>
            <TableCell>
              <TextField
                value={newSalary[row.monthly] || ""}
                onChange={(e) => handleSalaryChange(row.monthly, e.target.value)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Gross & Net Take Home */}
    <Divider style={{ margin: "20px 0", fontWeight: "bold" }}>Gross & Net Take Home</Divider>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Component</TableCell>
          <TableCell>Yearly (₹)</TableCell>
          <TableCell>Monthly (₹)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[
          { label: "Gross Salary", monthly: "gross_salary", yearly: "gross_salary_yearly" },
          { label: "Net Take Home", monthly: "net_takehome", yearly: "net_takehome_yearly" },
        ].map(row => (
          <TableRow key={row.label}>
            <TableCell>{row.label}</TableCell>
            <TableCell>
              <TextField
                value={newSalary[row.yearly] || ""}
                InputProps={{ readOnly: true }}
              />
            </TableCell>
            <TableCell>
              <TextField
                value={newSalary[row.monthly] || ""}
                onChange={(e) => handleSalaryChange(row.monthly, e.target.value)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

  </DialogContent>

  <DialogActions>
    <Button onClick={() => {setOpenDialog(false);setNewSalary({});}}>Cancel</Button>
    <Button variant="contained" color="primary" onClick={handleAddSalary}>Save</Button>
  </DialogActions>
</Dialog>

    </div>
  );

  
}

export default Salaries;