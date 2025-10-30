import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Fab, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  TextField, Button, Autocomplete,
  Divider, Box,Select,Typography
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
    month: new Date().toISOString().slice(0, 7), // default current month
    paid: "No",
    paid_date: "",

    // Salary Components
    basic_pay: "",
    hra: "",
    conveyance_allowance: "",
    medical_allowance: "",
    lta: "",
    personal_allowance: "",
    gross_salary: "",
    ctc: "",

    // Employee Deductions
    professional_tax: "",
    insurance: "",
    pf: "",
    tds: "",

    // Employer Contributions
    employer_pf: "",
    employer_health_insurance: "",

    // Final
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
  empId: "",            // employee_id from DB
  empName: "",          // employee_name from DB
  paid: "No",           // default
  month: dayjs().format("YYYY-MM"),  // default to current month
  lop: 0,               // editable
  paidAmount: 0,        // editable
  actualToPay: 0,       // read-only, NET TAKEHOME
});
const currentMonth = dayjs().format("YYYY-MM");

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
  const monthlySalaryOpenDialog = (salary) => {
  setMonthlySalarySelected(salary);  // store selected row
  setMonthlySalaryFormData({
    empId: salary.employee_id,
    empName: salary.employee_name,
    paid: "No",  // default to No
    month: dayjs().format("YYYY-MM"),
    lop: 0,
    paidAmount: salary.net_takehome,
    actualToPay: salary.net_takehome, // pre-fill from salary data
  });
  setMonthlySalaryDialogOpen(true);  // open dialog
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
    let updated = { ...prev, [name]: value };

    // Recalculate Paid Amount only if LOP changes and > 0
    if (name === "lop") {
      const lopDays = parseFloat(value) || 0;
      const actualPay = parseFloat(prev.actualToPay) || 0;

      if (lopDays > 0) {
        // Get days in the selected month
        const [year, month] = updated.month.split("-");
        const daysInMonth = new Date(year, month, 0).getDate();

        const perDayRate = actualPay / daysInMonth;

        updated.paidAmount = (actualPay - lopDays * perDayRate).toFixed(2);
      } else {
        // If LOP is 0, keep full actual pay
        updated.paidAmount = actualPay.toFixed(2);
      }
    }

    return updated;
  });
};
 


  // Submit form
const monthlySalaryHandleSubmit = async () => {
  try {
    const response = await axios.post("http://localhost:7760/monthlySalary/save", {
      empId: monthlySalaryFormData.empId,
      empName: monthlySalaryFormData.empName,
      paid: monthlySalaryFormData.paid,
      month: monthlySalaryFormData.month,
      lop: parseFloat(monthlySalaryFormData.lop) || 0,
      paidAmount: parseFloat(monthlySalaryFormData.paidAmount) || 0,
      actualToPay: parseFloat(monthlySalaryFormData.actualToPay) || 0,
    });

    if (response.data.success) {
      alert("Salary saved successfully!");
      monthlySalaryCloseDialog(); // close dialog
      fetchAllMonthlySalaries();
    } else {
      alert("Failed to save salary");
    }
  } catch (error) {
    console.error(error);
    alert("Error saving salary");
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

  // ✅ Fix: Always show *all pending months up to selected month*
  if (view === "pendingSalaries") {
    if (pendingMonths.length === 0) return [];
    return pendingMonths.map((m) => ({
      ...emp,
      month: m,
      paid: "No",
      paid_amount: 0,
      net_takehome: parseFloat(baseSalary.net_takehome || 0),
      ctc: parseFloat(baseSalary.ctc || 0),
    }));
  }

  // ✅ Paid salaries view (same as before)
  if (view === "paidSalaries") {
    const currentPaid = monthlySalaryData.find(
      (m) => m.employee_id === emp.employee_id && m.month === filterMonthYear
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

  if (view === "pendingSalaries") {
    return pendingMonths.map((m) => ({
      ...emp,
      month: m,
      paid: "No",
      paid_amount: 0,
      net_takehome: parseFloat(baseSalary.net_takehome || 0),
      ctc: parseFloat(baseSalary.ctc || 0),
    }));
  }

  const salaryRecord = monthlySalaryData.find(
    (m) => m.employee_id === emp.employee_id && m.month === filterMonthYear
  );

  return [
    {
      ...emp,
      month: filterMonthYear,
      paid: salaryRecord ? "Yes" : "No",
      paid_amount: salaryRecord ? parseFloat(salaryRecord.paid_amount || 0) : 0,
      net_takehome: parseFloat(baseSalary.net_takehome || 0),
      ctc: parseFloat(baseSalary.ctc || 0),
    },
  ];
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
   <TableContainer component={Paper} elevation={3} style={{ width: "100%", height: "500px" }}>
        <Table stickyHeader style={{ minWidth: "100%" }}>
          <TableHead style={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell style={{ fontWeight: "bold" }}>Emp ID</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Emp Name</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Ctc</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Take Home</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Paid</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
       <TableBody>
      

  {filteredSalaries.length > 0 ? (
    filteredSalaries.map((s) => {
      // Check if salary has been paid for the current month
      const salaryRecord = monthlySalaryData.find(
        (m) => m.employee_id === s.employee_id && m.month === month
      );

      const isPaid = salaryRecord ? salaryRecord.paid : "No";

      return (
        <TableRow key={s._id || s.id} hover onClick={() => setSelectedSalary(s)}>
          <TableCell>{s.employee_id}</TableCell>
          <TableCell>{s.employee_name}</TableCell>
          <TableCell>{formatCurrency(s.ctc)}</TableCell>
          <TableCell>{formatCurrency(s.net_takehome)}</TableCell>
         <TableCell style={{ textAlign: "start", fontWeight: "bold" }}>
  <span
    style={{
      color: isPaid === "Yes" ? "green" : "indianred",
      display: "inline-block",
      animation: "heartbeat 1s infinite",
      textShadow: isPaid === "Yes"
        ? "0 0 5px green, 0 0 10px green"
        : "0 0 5px red, 0 0 10px red",
    }}
  >
    {isPaid === "Yes" ? "Yes" : "No"}
  </span>

  <style>
    {`
      @keyframes heartbeat {
        0%, 100% {
          transform: scale(1);
        }
        25%, 75% {
          transform: scale(1.2);
        }
        50% {
          transform: scale(1);
        }
      }
    `}
  </style>
</TableCell>


          <TableCell>
           <Button
  variant={isPaid === "Yes" ? "contained" : "outlined"}
  color={isPaid === "Yes" ? "primary" : "secondary"}
  onClick={(e) => {
    e.stopPropagation(); // Prevent row click
    if (isPaid === "No") {
      monthlySalaryOpenDialog(s);
    } else {
      // Find the salary record from monthlySalaryData
      const record = monthlySalaryData.find(
        (m) => m.employee_id === s.employee_id && m.month === month
      );
      if (record) {
        setSelectedSalaryRecord(record);
        setViewMonthlySalaryModal(true);
      }
    }
  }}
>
  {isPaid === "Yes" ? "View" : "Pay"}
</Button>


          </TableCell>
        </TableRow>
      );
    })
  ) : (
    <TableRow>
      <TableCell colSpan={6} align="center">
        No records found
      </TableCell>
    </TableRow>
  )}
</TableBody>

        </Table>
      </TableContainer>  
  )}

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
        label="Actual to Pay"
        name="actualToPay"
        value={formatCurrency(monthlySalaryFormData.actualToPay)}
        InputProps={{ readOnly: true }}
        fullWidth
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
  disabled={monthlySalaryFormData.paid === "No"} // Disable if Paid is No
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
        value={formatCurrency(monthlySalaryFormData.paidAmount)}
        onChange={monthlySalaryHandleChange}
            InputProps={{ readOnly: true }}
        type="text"
        fullWidth
          disabled={monthlySalaryFormData.paid === "No"} // Disable if Paid is No

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
    <Table stickyHeader style={{ minWidth: "100%" }}>
      <TableHead style={{ backgroundColor: "#f5f5f5" }}>
        <TableRow>
          <TableCell style={{ fontWeight: "bold" }}>Emp ID</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Emp Name</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Month-Year</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>CTC</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Net Take</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Paid</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {filteredSalaries.map((s) => (
          <TableRow key={s.employee_id + s.month} hover onClick={() => setSelectedSalary(s)}>
            <TableCell>{s.employee_id}</TableCell>
            <TableCell>{s.employee_name}</TableCell>
            <TableCell>{dayjs(s.month, "YYYY-MM").format("MMMM YYYY")}</TableCell>
            <TableCell>{formatCurrency(s.ctc)}</TableCell>
            <TableCell>{formatCurrency(s.net_takehome)}</TableCell>
            <TableCell>
              <span style={{ color: "red", fontWeight: "bold" }}>No</span>
            </TableCell>
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
        ))}
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
      setNewSalary(
        calculateSalary({
          ...newSalary,
          employee_id: newValue.employee_id,
          employee_name: newValue.employee_name,
          ctc: ctc_monthly,
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
