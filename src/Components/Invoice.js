import React, { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,Fab,
  Divider,Box,
  IconButton,Typography,Select
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import jsPDF from "jspdf";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import html2canvas from "html2canvas";
import axios from "axios";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Alert } from "@mui/material"; 
import { Tooltip } from "@mui/material";
function Invoice() {
const [invoices, setInvoices] = useState([]);
const [openDialog, setOpenDialog] = useState(false);
const [openPreview, setOpenPreview] = useState(false);
const [clients,setClients] = useState([]);
const [selectedClient, setSelectedClient] = useState(null);
const [projects, setProjects] = useState([]);
const [activeProjects, setActiveProjects] = useState([]);
const [view, setView] = useState(""); // "projects" or "invoices"
const [projectsWithoutInvoice, setProjectsWithoutInvoice] = useState([]);
const [selectedProject,setSelectedProject] = useState([]);
const [showTotal, setShowTotal] = useState(false);
const [totalRaised, setTotalRaised] = useState(0);
const [invoiceFilter, setInvoiceFilter] = useState("All"); // "All", "Yes", "No"
const [receivedMonthInvoices,setRecievedMonthInvoices] = useState([]);
const [openEditDialog, setOpenEditDialog] = useState(false);
const [editingInvoice, setEditingInvoice] = useState(null);
const [saveAlert, setSaveAlert] = useState(false);
const [editingReceivedInvoice, setEditingReceivedInvoice] = useState(null);
const [receivedModalOpen, setReceivedModalOpen] = useState(false);
const [mode, setMode] = useState("Raised"); // "Raised" or "Received"



// State to track if invoice is raised
const [isRaised, setIsRaised] = useState(false);

const handleRaise = () => {
  setIsRaised(true);
  // You can also perform other actions here, like generating invoice number
};
// Assuming filterMonthYear is "2025-09"
const [filterMonthYear, setFilterMonthYear] = useState(() => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
});

// Function to get readable month
const getMonthYearLabel = (monthYear) => {
  if (!monthYear) return "";
  const [year, month] = monthYear.split("-");
  const monthName = new Date(year, month - 1).toLocaleString("default", {
    month: "short",
  }); // "Jan", "Feb", etc.
  return `${monthName} ${year}`;
};
useEffect(() => {
  if (showTotal) {
    // Total from active projects (invoice_value field)
    const total = activeProjects.reduce((acc, proj) => {
      return acc + (proj.invoice_value || 0);
    }, 0);
    setTotalRaised(total);
  }
}, [showTotal, activeProjects]);



  const [actualValue,setActualValue] = useState();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const initialInvoiceState = {
  invoice_number: "",
  invoice_date: new Date().toISOString().split("T")[0],
  client_name: "",
  project_id: "",
  start_date: "",
  end_date: "",
  invoice_cycle: "",
  invoice_value: "",
  gst_amount: "",
  due_date: "",
  billable_days: "",
  received: "No",
  received_date: "",
};

const [newInvoice, setNewInvoice] = useState(initialInvoiceState);
const [month,setMonth] = useState("");
const [openProjectModal, setOpenProjectModal] = useState(false);
const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

const resetForm = () => {
setNewInvoice(initialInvoiceState);
  setSelectedClient(null);
  setSelectedProject(null);
  setProjects([]);
};

  // Fetch invoices
  const fetchInvoices = async () => {
    const res = await fetch("http://localhost:7760/invoices");
    const data = await res.json();
    setInvoices(data.invoices || []);
  };

  useEffect(() => {
    fetchInvoices();

  }, []);

  const fetchClients = ()=>{
    fetch("http://localhost:7760/getclients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error(err));
  }

 // For previewing existing invoice or project invoice
// const handlePreview = (proj) => {
//   setSelectedProject(proj);   // Save project/invoice to preview
//   setNewInvoice(proj);        // If you want to show invoice fields in preview
//   setOpenPreview(true);       // Open preview dialog
// };


// Show preview before saving 
const handleFormPreview = () => { setOpenPreview(true); };


  // Add invoice
const handleAddInvoice = async () => {
  try {
    const invoiceToSend = {
      ...newInvoice,
      invoice_value: Number(newInvoice.invoice_value) || 0,
      gst_amount: Number(newInvoice.gst_amount) || 0,
      total_value:
        (Number(newInvoice.invoice_value) || 0) +
        (Number(newInvoice.gst_amount) || 0),
    };

    if (invoiceToSend.invoice_date && selectedClient?.paymentTerms) {
      const totalDays = Number(selectedClient.paymentTerms) + 2;
      const d = new Date(invoiceToSend.invoice_date);
      d.setDate(d.getDate() + totalDays);
      invoiceToSend.due_date = d.toISOString().split("T")[0];
    }

    const res = await fetch("http://localhost:7760/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceToSend),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      fetchInvoices();
      setOpenDialog(false);
      setOpenPreview(false);

      setNewInvoice({
        invoice_number: "",
        invoice_date: "",
        client_name: "",
        project_id: "",
        start_date: "",
        end_date: "",
        invoice_cycle: "",
        invoice_value: 0,  // ✅ default as number
        gst_amount: 0,     // ✅ default as number
        due_date: "",
        billable_days: 0,  // optional
        received: "No",
        received_date: "",
      });

      fetchActiveProjects();
      fetchProjectsWithoutInvoice();
    } else if (data.message === "Already Raised for this month for this project") {
      alert("Invoice already raised for this project in the selected month.");
    } else {
      alert(data.error || "Error adding invoice");
    }
  } catch (err) {
    console.error("Request failed:", err);
    alert("Error adding invoice");
  }
};


  const handleDownloadPDF = () => {
  const input = document.getElementById("invoice-preview");
  html2canvas(input, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${newInvoice.invoice_number || "Preview"}.pdf`);
  });
};

const calculateInvoiceValue = (cycle, billableDays, project, gstPercentage) => {
  if (!project) return { invoiceValue: 0, gstAmount: 0 };

  // Step 1: Base Invoice (Monthly / Quarterly)
  let baseInvoice = 0;
  if (cycle === "Monthly") {
    baseInvoice = project.monthlyBilling || 0;
  } else if (cycle === "Quarterly") {
    baseInvoice = (project.monthlyBilling || 0) * 3;
  }

  // Step 2: Deduction for non-billable days
  if (billableDays > 0) {
    const dailyRate = (project.monthlyBilling || 0) / 30; // 30 days default
    baseInvoice -= dailyRate * billableDays;
  }

  // Step 3: GST Calculation (using client GST)
  const gstAmount = gstPercentage ? (baseInvoice * gstPercentage) / 100 : 0;

  // Optional: set actual value (if you want to display in the summary)
  if (typeof setActualValue === "function") {
    setActualValue(project.monthlyBilling);
  }

  return {
    invoiceValue: parseFloat(baseInvoice.toFixed(2)),
    gstAmount: parseFloat(gstAmount.toFixed(2)),
  };
};

const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0]; // format YYYY-MM-DD
};

// Reusable functions
const fetchActiveProjects = async () => {
  if (!filterMonthYear) return;
  try {
    const res = await axios.get(
      `http://localhost:7760/getactive-projects?filterMonthYear=${filterMonthYear}`
    );
    setActiveProjects(res.data);
  } catch (err) {
    console.error("Error fetching active projects:", err);
  }
};

const fetchProjectsWithoutInvoice = async () => {
  if (view !== "noInvoiceCurrentMonth") return;
  try {
    const res = await axios.get(
      "http://localhost:7760/getprojects-no-invoice-current-month"
    );
    setProjectsWithoutInvoice(res.data);
  } catch (err) {
    console.error(err);
  }
};

const fetchInvoicesByMonth = async () => {
  if (!filterMonthYear) return;

  try {
    const res = await fetch(`http://localhost:7760/invoices/month/${filterMonthYear}`);
    const data = await res.json();

    if (res.ok) {
      setRecievedMonthInvoices(data); // update state with filtered invoices
    } else {
      console.error("Error fetching invoices:", data.error);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
};

// useEffect hooks
useEffect(() => {
  fetchActiveProjects();
  fetchInvoicesByMonth();
}, [filterMonthYear]);

useEffect(() => {
  fetchProjectsWithoutInvoice();
}, [view]);

const filteredProjects = activeProjects.filter((proj) => {
  // Month-Year filter
  let monthYearMatch = true;
  if (filterMonthYear) {
    const [year, month] = filterMonthYear.split("-").map(Number);
    const filterStart = new Date(year, month - 1, 1);
    const filterEnd = new Date(year, month, 0); // last day of month

    const start = new Date(proj.startDate);
    const end = new Date(proj.endDate);

    monthYearMatch = start <= filterEnd && end >= filterStart;
  }

  // Invoice Raised filter
  let invoiceMatch = true;
  if (invoiceFilter === "Yes") invoiceMatch = Boolean(proj.invoice_date);
  else if (invoiceFilter === "No") invoiceMatch = !proj.invoice_date;

  return monthYearMatch && invoiceMatch;
});

const [receivedFilter, setReceivedFilter] = useState("All");

const filteredInvoices = invoices.filter((inv) => {
  // 1️⃣ Filter by month/year if provided
  let monthYearMatch = true;
  if (filterMonthYear) {
    const [year, month] = filterMonthYear.split("-").map(Number);
    const invoiceDate = new Date(inv.invoice_date);
    monthYearMatch =
      invoiceDate.getMonth() === month - 1 &&
      invoiceDate.getFullYear() === year;
  }

  // 2️⃣ Filter by Received status
  let receivedMatch = true;
  if (receivedFilter && receivedFilter !== "All") {
    receivedMatch = inv.received === receivedFilter;
  }

  // 3️⃣ Return only if both conditions match
  return monthYearMatch && receivedMatch;
});

const filteredReceivedInvoices = receivedMonthInvoices.filter((inv) => {
  if (receivedFilter === "All") return true;
  return inv.received?.toLowerCase() === receivedFilter.toLowerCase();
});

// Calculate received total
// Total of only "Yes" invoices
const totalYesInvoices = receivedMonthInvoices.reduce(
  (sum, inv) =>
    inv.received?.toLowerCase() === "yes"
      ? sum + (Number(inv.invoice_value) || 0)
      : sum,
  0
);
// Total of only "No" invoices
const totalPending = receivedMonthInvoices.reduce(
  (sum, inv) =>
    inv.received?.toLowerCase() === "no"
      ? sum + (Number(inv.invoice_value) || 0)
      : sum,
  0
);

// Utility functions
const getPrevMonthStart = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0];
};

const getPrevMonthEnd = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 0) // 0 = last day of prev month
    .toISOString()
    .split("T")[0];
};

useEffect(() => {
  if (isRaised && selectedProject?.invoiceCycle) {
    const cycle = selectedProject.invoiceCycle;
    const { invoiceValue, gstAmount } = calculateInvoiceValue(
      cycle,
      newInvoice.billable_days,
      selectedProject,
      selectedClient?.gstPercentage
    );

    setNewInvoice((prev) => ({
      ...prev,
      invoice_cycle: cycle,
      invoice_value: invoiceValue,
      gst_amount: gstAmount,
    }));
  }
}, [isRaised, selectedProject, newInvoice.billable_days, selectedClient]);

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Auto-calculate invoice value and GST whenever relevant data changes
useEffect(() => {
  if (!selectedProject || !selectedClient) return;

  const cycle = selectedProject.invoiceCycle || "Monthly";
  const gstPercentage = selectedClient.gstPercentage || 0;

  const { invoiceValue, gstAmount } = calculateInvoiceValue(
    cycle,
    selectedProject.billable_days || 0,
    selectedProject,
    gstPercentage
  );

  setNewInvoice((prev) => ({
    ...prev,
    invoice_cycle: cycle,
    invoice_value: invoiceValue,
    gst_amount: gstAmount,
  }));
}, [selectedClient, selectedProject]);


// Save edited Invoice newInvoice.billable_days,
const handleSaveInvoice = async (updatedInvoice) => {
  try {
    const res = await fetch(`http://localhost:7760/invoices/${updatedInvoice.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedInvoice),
    });

    if (!res.ok) throw new Error("Failed to update invoice");

    const data = await res.json();
    console.log("Invoice updated:", data);

    // Update state
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? data : inv))
    );
    // Show alert instead of immediately closing
    setSaveAlert(true);

    // Hide alert automatically after 2 seconds
    setTimeout(() => setSaveAlert(false), 2000);

    // setOpenEditDialog(false);
  } catch (err) {
    console.error("Error updating invoice:", err);
  }
};
// Updating Recieved Status
// const handleSaveReceived = async () => {
//   if (!editingReceivedInvoice) return;

//   try {
//     const res = await fetch(
//       `http://localhost:7760/updateinvoices/${editingReceivedInvoice.id}`,
//       {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(editingReceivedInvoice),
//       }
//     );

//     if (!res.ok) throw new Error("Failed to update received status");

//     const updatedInvoice = await res.json();

//     // Update local state immediately
//     setRecievedMonthInvoices((prev) =>
//       prev.map((inv) =>
//         inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv
//       )
//     );

//     setReceivedModalOpen(false);
//     setEditingReceivedInvoice(null);

//     // ✅ Show success alert
//     alert("Received status updated successfully!");
//   } catch (err) {
//     console.error("Error updating received status:", err);
//     alert("Failed to update received status.");
//   }
// };

const handleSaveReceived = async () => {
  if (!editingReceivedInvoice) return;

  try {
    const res = await fetch(
      `http://localhost:7760/updateinvoices/${editingReceivedInvoice.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingReceivedInvoice),
      }
    );

    if (!res.ok) throw new Error("Failed to update received status");

    const data = await res.json();             // ✅ full response
    const updatedInvoice = data.invoice;       // ✅ extract actual invoice object

    // ✅ Instantly update UI
    setRecievedMonthInvoices((prev) =>
      prev.map((inv) =>
        inv.id === updatedInvoice.id
          ? {
              ...inv,
              received: updatedInvoice.received,
              received_date: updatedInvoice.received_date,
            }
          : inv
      )
    );

    setReceivedModalOpen(false);
    setEditingReceivedInvoice(null);

    alert("Received status updated successfully!");
  } catch (err) {
    console.error("Error updating received status:", err);
    alert("Failed to update received status.");
  }
};

useEffect(() => {
  if (selectedClient && newInvoice.invoice_value) {
    setNewInvoice(prev => ({
      ...prev,
      gst_amount: (prev.invoice_value * selectedClient.gstPercentage) / 100,
    }));
  }
}, [newInvoice.invoice_value, selectedClient]);

// -------- getRaiseEligibility.js --------
/**
 * Determine whether a project can raise an invoice in the selected month
 * and when the next raise date is.
 * 
 * @param {object} project - The project object.
 * @param {string} selectedMonth - The YYYY-MM string from the filter.
 */
const getRaiseEligibilityForMonth = (project, selectedMonth) => {
  if (!project?.startDate) return { canRaise: false, nextRaiseDate: null };

  const start = new Date(project.startDate);
  const cycle = (project.invoiceCycle || "Monthly").toLowerCase();
  const monthsToAdd = cycle === "quarterly" ? 3 : 1;

  // Convert selected month (YYYY-MM) → Date object at month start
  const [year, month] = selectedMonth.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, 1);

  // Find the first raise date (startDate)
  let nextRaiseDate = new Date(start);

  // Keep adding cycles until we find the next raise date after or equal to the selected month
  while (nextRaiseDate < selectedDate) {
    nextRaiseDate.setMonth(nextRaiseDate.getMonth() + monthsToAdd);
  }

  // Check if the selected month is the same as the raise month
  const canRaise =
    selectedDate.getFullYear() === nextRaiseDate.getFullYear() &&
    selectedDate.getMonth() === nextRaiseDate.getMonth();

  return { canRaise, nextRaiseDate };
};





  return (
    <div style={{ padding: 20 }}>
   <div style={{ marginBottom: "200px" }}>

  {/* Fixed Buttons at Top */}
<div
  style={{
    position: "fixed",
    top: 70,
    left: "17%", // adjust this based on your sidenav width
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
    borderRadius: "10px"
  }}
>
  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <Button
      variant={view === "activeProjects" ? "contained" : "outlined"}
      onClick={() => setView("activeProjects")}
    >
      Active Projects
    </Button>
    <Button
      variant={view === "invoices" ? "contained" : "outlined"}
      onClick={() => setView("invoices")}
    >
      Raised Invoices
    </Button>
    <Button
      variant={view === "receivedInvoices" ? "contained" : "outlined"}
      onClick={() => setView("receivedInvoices")}
    >
      Received Invoices
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
      {mode === "Raised" ? (
        <span style={{ color: "gray", fontSize: "12px" }}>
          Total Raised in <span style={{ color: "black", fontSize: "12px" }}>{getMonthYearLabel(filterMonthYear)}</span>:{" "}
         <span style={{ color: "blue", fontSize: "12px" }}>
           {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(totalRaised)}
         </span>
          
        </span>
      ) : mode === "Received" ? (
        <span style={{ color: "gray", fontSize: "12px" }}>
          Total Received in <span style={{ color: "black", fontSize: "12px" }}>{getMonthYearLabel(filterMonthYear)}</span>:{" "}
          <span style={{ color: "green", fontSize: "12px"}}>
            {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(totalYesInvoices)}
          </span>
        </span>
      ) : (
        <span style={{ color: "gray", fontSize: "12px" }}>
          Total Pending in <span style={{ color: "black", fontSize: "12px" }}>{getMonthYearLabel(filterMonthYear)}</span>:{" "}
           <span style={{ color: "indianred", fontSize: "12px"}}>
 {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(totalPending)}
           </span>
         
        </span>
      )}

      <Select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        size="small"
        style={{ fontSize: "12px", height: "30px", marginTop: "4px" }}
      >
        <MenuItem value="Raised">Raised</MenuItem>
        <MenuItem value="Received">Received</MenuItem>
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

  <Divider style={{marginTop:"250px",fontWeight:"bold",fontFamily:"monospace",fontSize:"16px",marginBottom:"15px"}}>
  {month
    ? new Date(month + "-01").toLocaleString("en-US", { month: "short", year: "numeric" })
    : ""}
</Divider>

  {/* Scrollable Table Container */}
  <div
    style={{
      maxHeight: "400px", // set desired height
      overflowY: "auto",
      marginTop: "20px",
    }}
  >
  
    {/* Active Projects Table */}
{view === "activeProjects" && (
  <TableContainer component={Paper} style={{ maxHeight: 400 }}>
    <Table stickyHeader>
      <TableHead style={{ backgroundColor: "lightgray" }}>
        <TableRow>
          <TableCell style={{ fontWeight: "bold" }}>Project ID</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Project Name</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Client</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Start Date</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>End Date</TableCell>
          <TableCell style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
  <Box display="flex" alignItems="center" gap={1}>
    <TextField
     label="Invoice Raised"
      select
      size="small"
      value={invoiceFilter}
      onChange={(e) => setInvoiceFilter(e.target.value)}
      variant="outlined"
      sx={{ minWidth: 70, "& .MuiInputBase-input": { padding: "4px 8px" },width: 120 }} // smaller height
    >
      <MenuItem value="All">All</MenuItem>
      <MenuItem value="Yes">Yes</MenuItem>
      <MenuItem value="No">No</MenuItem>
    </TextField>
  </Box>
</TableCell>

          <TableCell style={{ fontWeight: "bold" }}>Overall Raised</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Invoice Value</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Raised Date</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredProjects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} align="center">
              No active projects found
            </TableCell>
          </TableRow>
        ) : (
          filteredProjects.map((proj) => {
            const client = clients.find(
              (c) => c.clientID === proj.clientID || c.clientName === proj.clientName
            );

            return (
              <TableRow key={proj.projectID} hover style={{ cursor: "pointer" }}>
<TableCell
  style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
  onClick={() => {
    setSelectedProjectDetails(proj);
    setOpenProjectModal(true);
  }}
>
  {proj.projectID}
</TableCell>
                <TableCell>{proj.projectName}</TableCell>
                <TableCell>{proj.clientName || "-"}</TableCell>
                <TableCell>
                  {proj.startDate
                    ? new Intl.DateTimeFormat("en-GB").format(new Date(proj.startDate))
                    : "-"}
                </TableCell>
                <TableCell>
                  {proj.endDate
                    ? new Intl.DateTimeFormat("en-GB").format(new Date(proj.endDate))
                    : "-"}
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  {proj.invoice_date ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>Yes</span>
                  ) : (
                    <span style={{ color: "red", fontWeight: "bold" }}>No</span>
                  )}
                </TableCell>
<TableCell>
  {new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(proj.total_invoice_amount || 0)}
</TableCell>
                <TableCell>
                  {proj.invoice_value
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(proj.invoice_value)
                    : "-"}
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  {proj.invoice_date
                    ? new Intl.DateTimeFormat("en-GB").format(new Date(proj.invoice_date))
                    : "-"}
                </TableCell>
               <TableCell>
  {proj.invoice_date ? (
    // ✅ Already raised
    <Button
      variant="outlined"
      size="small"
      onClick={() => {
        setSelectedInvoice(proj);
        setOpenPreview(true);
      }}
    >
      View
    </Button>
  ) : (
    (() => {
      // ✅ Use the selected month from your filter
      const { canRaise, nextRaiseDate } = getRaiseEligibilityForMonth(
        proj,
        filterMonthYear || month // fallback to current month if not selected
      );

      if (canRaise) {
        return (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => {
              const client = clients.find(
                (c) =>
                  c.clientID === proj.clientID || c.clientName === proj.clientName
              );
              setSelectedClient(client || null);
              setProjects(client?.projects || []);
              setSelectedProject(proj);

              const now = new Date();
              const m = String(now.getMonth() + 1).padStart(2, "0");
              const y = now.getFullYear();

              const invoiceValue = proj.invoice_value || 0;
              const gstAmount = client?.gstPercentage
                ? (invoiceValue * client.gstPercentage) / 100
                : 0;

              const invoiceData = {
                ...initialInvoiceState,
                client_name: proj.clientName?.trim() || "",
                project_id: String(proj.projectID) || "",
                invoice_number: `${proj.clientName?.trim() || "Client"}-${proj.projectID}-${m}${y}`,
                // start_date: proj.startDate || "",
                // end_date: proj.endDate || "",
                start_date: "",
                end_date: "",
                invoice_value: invoiceValue,
                gst_amount: gstAmount,
                due_date: proj.due_date || "",
                invoice_cycle: proj.invoiceCycle || "",
                billable_days: proj.billable_days || "",
                received: "No",
              };

              setNewInvoice(invoiceData);
              setIsRaised(true);
              setOpenDialog(true);
              handleRaise(invoiceData);
            }}
          >
            Raise
          </Button>
        );
      } else {
        return (
          <Button variant="outlined" size="small" disabled>
            Next:{" "}
            {nextRaiseDate
              ? new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(nextRaiseDate)
              : "-"}
          </Button>
        );
      }
    })()
  )}
</TableCell>

              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </TableContainer>
)}

{/* Dialog for Project Details  */}
<Dialog
  open={openProjectModal}
  onClose={() => setOpenProjectModal(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle style={{fontWeight:"bold",fontFamily:"monospace"}}>Project Details</DialogTitle>
  <DialogContent dividers style={{ maxHeight: "400px", overflowY: "auto" }}>
    {selectedProjectDetails ? (
      <Table size="small">
      <TableBody>
  {Object.entries(selectedProjectDetails)
    .filter(([key]) =>
      [
        "projectID",
        "clientID",
        "startDate",
        "endDate",
        "projectName",
        "projectDescription",
        "skill",
        "projectLocation",
        "spoc",
        "mailID",
        "mobileNo",
        "billingType",
        "billRate",
        "monthlyBilling",
        "employeeID",
        "employeeName",
        "poNumber",
        "purchaseOrder", // file
        "purchaseOrderValue",
        "active",
        "invoiceCycle",
      ].includes(key)
    )
    .map(([key, value]) => (
      <TableRow key={key}>
        <TableCell style={{ fontWeight: "bold", width: "40%" }}>
          {key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())}
        </TableCell>
        <TableCell>
          {key === "purchaseOrder" ? (
            value ? (
              <a
                href={`http://localhost:7760/uploads/${value}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open File
              </a>
            ) : (
              "No File"
            )
          ) : key.toLowerCase().includes("date") && value ? (
            new Date(value).toLocaleDateString("en-GB")
          ) : key.toLowerCase().includes("value") || key.toLowerCase().includes("rate") ? (
            new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value)
          ) : value || "-"}
        </TableCell>
      </TableRow>
    ))}
</TableBody>


      </Table>
    ) : (
      <Typography>No project details available</Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenProjectModal(false)}>Close</Button>
  </DialogActions>
</Dialog>

    {/* Raised Invoices Table */}
    {view === "invoices" && (
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead style={{ backgroundColor: "lightgray" }}>
            <TableRow>
              <TableCell style={{ fontWeight: "bold" }}>Invoice Number</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Client Name</TableCell>
              {/* <TableCell style={{ fontWeight: "bold" }}>Project ID</TableCell> */}
              <TableCell style={{ fontWeight: "bold" }}>Invoice Value</TableCell>
              <TableCell style={{ fontWeight: "bold"}}>GST</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Raised On</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Start Date</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>End Date</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Due Date</TableCell>
<TableCell style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
  <Box display="flex" alignItems="center" gap={1}>
    <TextField
      label="Received"
      select
      size="small"
      value={receivedFilter}
      onChange={(e) => setReceivedFilter(e.target.value)}
      variant="outlined"
      sx={{
        minWidth: 70,
        width: 80,
        "& .MuiInputBase-input": { padding: "4px 8px" },
      }}
    >
      <MenuItem value="All">All</MenuItem>
      <MenuItem value="Yes">Yes</MenuItem>
      <MenuItem value="No">No</MenuItem>
    </TextField>
  </Box>
</TableCell>

              {/* <TableCell style={{ fontWeight: "bold" }}>Received Date</TableCell> */}
              <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
         <TableBody>
  {filteredInvoices
    .filter((inv) => {
      if (receivedFilter === "All") return true;
      return inv.received === receivedFilter;
    })
    .length === 0 ? (
      <TableRow>
        <TableCell colSpan={9} align="center">
          No invoices found
        </TableCell>
      </TableRow>
  ) : (
    filteredInvoices
      .filter((inv) => {
        if (receivedFilter === "All") return true;
        return inv.received === receivedFilter;
      })
      .map((inv) => (
        <TableRow
          onClick={() => {
            setSelectedInvoice(inv);
            setOpenPreview(true);
          }}
          key={inv.id}
          hover
          style={{ cursor: "pointer" }}
        >
<TableCell>
  <Tooltip title={inv.invoice_number}>
    <span
      style={{
        display: "inline-block",
        maxWidth: "120px", // adjust width
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer",
      }}
    >
      {inv.invoice_number}
    </span>
  </Tooltip>
</TableCell>     
     <TableCell>{inv.client_name}</TableCell>
          <TableCell>
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(inv.invoice_value)}
          </TableCell>
                          <TableCell>{new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(inv.gst_amount)}</TableCell>
          <TableCell style={{ whiteSpace: "nowrap" }}>
            {inv.invoice_date
              ? (() => {
                  const d = new Date(inv.invoice_date);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })()
              : "-"}
          </TableCell>
          <TableCell style={{ whiteSpace: "nowrap" }}>
            {inv.start_date
              ? (() => {
                  const d = new Date(inv.start_date);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })()
              : "-"}
          </TableCell>
          <TableCell style={{ whiteSpace: "nowrap" }}>
            {inv.end_date
              ? (() => {
                  const d = new Date(inv.end_date);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })()
              : "-"}
          </TableCell>
          <TableCell style={{ whiteSpace: "nowrap" }}>
            {inv.due_date
              ? (() => {
                  const d = new Date(inv.due_date);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })()
              : "-"}
          </TableCell>
          <TableCell style={{ textAlign: "center" }}>
            {inv.received === "Yes" ? (
              <span
                style={{
                  color: "green",
                  fontWeight: "bold",
                  animation: "radiateGreen 1.5s infinite",
                }}
              >
                Yes
              </span>
            ) : (
              <span
                style={{
                  color: "red",
                  fontWeight: "bold",
                  animation: "radiateRed 1.5s infinite",
                }}
              >
                No
              </span>
            )}
          </TableCell>
          <TableCell>
            <Box display="flex" gap={1}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  setEditingInvoice(inv);
                  setOpenEditDialog(true);
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
              <IconButton>
                <DeleteIcon color="error" />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
      ))
  )}
</TableBody>

        </Table>
      </TableContainer>
    )}

{/* Edit Invoice  */}
<Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Edit Invoice</DialogTitle>
<DialogContent>
  {editingInvoice && (
    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2,padding:"10px" }}>
       {saveAlert && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Invoice saved successfully!
        </Alert>
      )}

      {/* Row 1 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Invoice Number"
          value={editingInvoice.invoice_number}
          InputProps={{ readOnly: true }}
          fullWidth
        />
        <TextField
          label="Client Name"
          value={editingInvoice.client_name}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Box>

      {/* Row 2 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Project ID"
          value={editingInvoice.project_id}
          InputProps={{ readOnly: true }}
          fullWidth
        />
        <TextField
          label="Invoice Value"
          type="number"
          value={editingInvoice.invoice_value}
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, invoice_value: e.target.value })
          }
          fullWidth
        />
      </Box>

      {/* Row 3 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="GST Amount"
          type="number"
          value={editingInvoice.gst_amount}
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, gst_amount: e.target.value })
          }
          fullWidth
        />
        <TextField
          label="Invoice Cycle"
          value={editingInvoice.invoice_cycle}
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, invoice_cycle: e.target.value })
          }
          fullWidth
        />
      </Box>

      {/* Row 4 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Non-Billable Days"
          type="number"
          value={editingInvoice.billable_days}
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, billable_days: e.target.value })
          }
          fullWidth
        />
        <TextField
          label="Start Date"
          type="date"
          value={
            editingInvoice.start_date
              ? new Date(editingInvoice.start_date).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, start_date: e.target.value })
          }
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Row 5 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="End Date"
          type="date"
          value={
            editingInvoice.end_date
              ? new Date(editingInvoice.end_date).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, end_date: e.target.value })
          }
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Due Date"
          type="date"
          value={
            editingInvoice.due_date
              ? new Date(editingInvoice.due_date).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, due_date: e.target.value })
          }
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Row 6 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Received"
          select
          value={editingInvoice.received}
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, received: e.target.value })
          }
          fullWidth
        >
          <MenuItem value="Yes">Yes</MenuItem>
          <MenuItem value="No">No</MenuItem>
        </TextField>
        {/* Empty filler so it aligns */}
        <Box sx={{ flex: 1 }} />
      </Box>
    </Box>
  )}
</DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
    <Button
      variant="contained"
      color="primary"
      onClick={() => handleSaveInvoice(editingInvoice)}
    >
      Save
    </Button>
  </DialogActions>
</Dialog>



{/* Received Invoices Table */}
{view === "receivedInvoices" && (
  <TableContainer component={Paper}>
    <Table stickyHeader>
      <TableHead style={{ backgroundColor: "lightgray" }}>
        <TableRow>
          <TableCell style={{ fontWeight: "bold" }}>Invoice Number</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Client Name</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Invoice Value</TableCell>
          <TableCell style={{ fontWeight: "bold"}}>GST</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Raised On</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Start Date</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>End Date</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>Due Date</TableCell>
          <TableCell style={{ fontWeight: "bold" }}>
<Box display="flex" alignItems="center" gap={1}>
  <TextField
    label="Received"
    select
    size="small"
    value={receivedFilter}
    onChange={(e) => setReceivedFilter(e.target.value)}
    variant="outlined"
    sx={{
      minWidth: 70,
      width: 80,
      "& .MuiInputBase-input": { padding: "4px 8px" },
    }}
  >
    <MenuItem value="All">All</MenuItem>
    <MenuItem value="Yes">Yes</MenuItem>
    <MenuItem value="No">No</MenuItem>
  </TextField>
</Box>
          </TableCell>

          <TableCell style={{ fontWeight: "bold" }}>Received Date</TableCell>
        </TableRow>
      </TableHead>
     <TableBody>
  {filteredReceivedInvoices.length === 0 ? (
    <TableRow>
      <TableCell colSpan={9} align="center">
        No received invoices found
      </TableCell>
    </TableRow>
  ) : (
    filteredReceivedInvoices.map((inv) => (
      <TableRow
        key={inv.id}
        hover
        style={{ cursor: "pointer" }}
        onClick={() => {
          setSelectedInvoice(inv);
          setOpenPreview(true);
        }}
      >
<TableCell>
  <Tooltip title={inv.invoice_number}>
    <span
      style={{
        display: "inline-block",
        maxWidth: "120px", // adjust width
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer",
      }}
    >
      {inv.invoice_number}
    </span>
  </Tooltip>
</TableCell>
        <TableCell>{inv.client_name}</TableCell>
        <TableCell>
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(inv.invoice_value)}
        </TableCell>
         <TableCell>
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(inv.gst_amount)}
        </TableCell>
        <TableCell style={{ whiteSpace: "nowrap" }}>
          {inv.invoice_date
            ? (() => {
                const d = new Date(inv.invoice_date);
                return `${String(d.getDate()).padStart(2, "0")}-${String(
                  d.getMonth() + 1
                ).padStart(2, "0")}-${d.getFullYear()}`;
              })()
            : "-"}
        </TableCell>
        <TableCell  style={{ whiteSpace: "nowrap" }}>
          {inv.start_date
            ? (() => {
                const d = new Date(inv.start_date);
                return `${String(d.getDate()).padStart(2, "0")}-${String(
                  d.getMonth() + 1
                ).padStart(2, "0")}-${d.getFullYear()}`;
              })()
            : "-"}
        </TableCell>
        <TableCell style={{ whiteSpace: "nowrap" }}>
          {inv.end_date
            ? (() => {
                const d = new Date(inv.end_date);
                return `${String(d.getDate()).padStart(2, "0")}-${String(
                  d.getMonth() + 1
                ).padStart(2, "0")}-${d.getFullYear()}`;
              })()
            : "-"}
        </TableCell>
        <TableCell style={{ whiteSpace: "nowrap" }}>
          {inv.due_date
            ? (() => {
                const d = new Date(inv.due_date);
                return `${String(d.getDate()).padStart(2, "0")}-${String(
                  d.getMonth() + 1
                ).padStart(2, "0")}-${d.getFullYear()}`;
              })()
            : "-"}
        </TableCell>
        <TableCell
  style={{ textAlign: "center", cursor: "pointer" }}
  onClick={(e) => {
    e.stopPropagation(); // prevent row click
    setEditingReceivedInvoice({
      id: inv.id,
      received: inv.received,
      received_date: inv.received_date || "",
    });
    setReceivedModalOpen(true);
  }}
>
  {inv.received === "Yes" ? (
    <span
      style={{
        color: "green",
        fontWeight: "bold",
        animation: "radiateGreen 1.5s infinite",
      }}
    >
      Yes
    </span>
  ) : (
    <span
      style={{
        color: "red",
        fontWeight: "bold",
        animation: "radiateRed 1.5s infinite",
      }}
    >
      No
    </span>
  )}
</TableCell>

        <TableCell>
          {inv.received_date
            ? (() => {
                const d = new Date(inv.received_date);
                return `${String(d.getDate()).padStart(2, "0")}-${String(
                  d.getMonth() + 1
                ).padStart(2, "0")}-${d.getFullYear()}`;
              })()
            : "-"}
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>

    </Table>
  </TableContainer>
)}

  </div>

{/* Update Received Status Modal */}
 <Dialog
  open={receivedModalOpen}
  onClose={() => setReceivedModalOpen(false)}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle style={{fontWeight:"bold",fontFamily:"monospace"}}>Received Status</DialogTitle> <Divider/>
  <DialogContent>
    {editingReceivedInvoice && (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          label="Received"
          select
          value={editingReceivedInvoice.received}
          onChange={(e) =>
            setEditingReceivedInvoice({
              ...editingReceivedInvoice,
              received: e.target.value,
            })
          }
          fullWidth
        >
          <MenuItem value="Yes">Yes</MenuItem>
          <MenuItem value="No">No</MenuItem>
        </TextField>

        {editingReceivedInvoice.received === "Yes" && (
          <TextField
            label="Received Date"
            type="date"
            value={
              editingReceivedInvoice.received_date
                ? new Date(editingReceivedInvoice.received_date)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onChange={(e) =>
              setEditingReceivedInvoice({
                ...editingReceivedInvoice,
                received_date: e.target.value,
              })
            }
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        )}
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setReceivedModalOpen(false)}>Cancel</Button>
    <Button variant="contained" color="success" onClick={handleSaveReceived}>
      Save
    </Button>
  </DialogActions>
</Dialog>


</div>

      {/* Add Invoice Button */}
       <Fab
        color="primary"
        aria-label="add"
        style={{ position: "fixed", bottom: "20px", right: "20px" }}
          onClick={() => {setOpenDialog(true);fetchClients()}}
      >
        <AddIcon />
      </Fab>

      {/* Add Invoice Dialog */}
  <Dialog open={openDialog} onClose={() => {setOpenDialog(false);setIsRaised(false)}} fullWidth maxWidth="sm">
  <DialogTitle style={{ fontWeight: "bold" }}>Add Invoice</DialogTitle>
  <DialogContent style={{backgroundColor:"whitesmoke",borderRadius:"5px"}} dividers>
    {/* Row 1: Invoice Number + Client Name */}
    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
     <TextField
  fullWidth
  label="Invoice Number"
  variant="outlined"
  value={newInvoice.invoice_number}
  onChange={(e) =>
    setNewInvoice({ ...newInvoice, invoice_number: e.target.value })
  }
  defaultValue={
    newInvoice.client_name && newInvoice.project_id
      ? `${newInvoice.client_name}-${newInvoice.project_id}-${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}${new Date().getFullYear()}`
      : ""
  }
  sx={{
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      "&:hover fieldset": { borderColor: "black" },
      "&.Mui-focused fieldset": { borderColor: "black" },
    },
  }}
/>



     {isRaised ? (
  <TextField
    fullWidth
    label="Client Name"
    value={newInvoice.client_name}
    InputProps={{ readOnly: true }}
    variant="outlined"
    sx={{
      "& .MuiOutlinedInput-root": {
        "& fieldset": { borderColor: "black" },
        "&:hover fieldset": { borderColor: "black" },
        "&.Mui-focused fieldset": { borderColor: "black" },
      },
    }}
  />
) : (
  <TextField
    select
    fullWidth
    label="Client Name"
    name="client_name"
    value={newInvoice.client_name}
    sx={{
      "& .MuiOutlinedInput-root": {
        "& fieldset": { borderColor: "black" },
        "&:hover fieldset": { borderColor: "black" },
        "&.Mui-focused fieldset": { borderColor: "black" },
      },
    }}
    onChange={async (e) => {
      const selectedClientName = e.target.value;
      setNewInvoice({ ...newInvoice, client_name: selectedClientName });

      const selectedClient = clients.find(
        (c) => c.clientName === selectedClientName
      );

      if (selectedClient) {
        try {
          const response = await fetch(
            `http://localhost:7760/clientsprojects/${selectedClient.id}`
          );
          if (!response.ok) throw new Error("Failed to fetch client & projects");

          const data = await response.json();
          setSelectedClient(data.client);
          setProjects(data.projects);

          // Regenerate invoice number if project already selected
          if (newInvoice.project_id) {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = now.getFullYear();
            const invoiceNumber = `${selectedClientName}|${newInvoice.project_id}-${month}${year}`;
            setNewInvoice({
              ...newInvoice,
              client_name: selectedClientName,
              invoice_number: invoiceNumber,
            });
          }
        } catch (err) {
          console.error("Error fetching projects:", err);
        }
      }
    }}
  >
    {clients.map((c) => (
      <MenuItem key={c.id} value={c.clientName}>
        {c.clientName} - {c.id}
      </MenuItem>
    ))}
  </TextField>
)}

    </div>

    {/* Row 2: Invoice Date + Project */}
    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
   <TextField
  type="date"
  fullWidth
  label="Invoice Date"
  value={newInvoice.invoice_date || ""}
  onChange={(e) => {
    const invoiceDate = e.target.value;

    let dueDate = "";
    if (invoiceDate && selectedClient?.paymentTerms) {
      const totalDays = Number(selectedClient.paymentTerms) + 2;

      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + totalDays);

      dueDate = d.toISOString().split("T")[0]; // ✅ ensures YYYY-MM-DD
      console.log("Calculated due date:", dueDate);
    }

    setNewInvoice((prev) => ({
      ...prev,
      invoice_date: invoiceDate,
      due_date: dueDate,
    }));
  }}
  InputLabelProps={{ shrink: true }}
/>


{/* // Project Field Component */}
{isRaised ? (
  // ✅ Read-only Project field
  <TextField
    fullWidth
    label="Project"
    value={
      selectedProject
        ? `${selectedProject.projectName} - ${newInvoice.project_id}`
        : newInvoice.project_id
    }
    InputProps={{ readOnly: true }}
    variant="outlined"
    sx={{
      "& .MuiOutlinedInput-root": {
        "& fieldset": { borderColor: "black" },
        "&:hover fieldset": { borderColor: "black" },
        "&.Mui-focused fieldset": { borderColor: "black" },
      },
    }}
  />
) : (
  // ✅ Editable Project ID dropdown
  <TextField
  select
  fullWidth
  label="Project ID"
  name="project_id"
  value={newInvoice.project_id}
  sx={{
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      "&:hover fieldset": { borderColor: "black" },
      "&.Mui-focused fieldset": { borderColor: "black" },
    },
  }}
  onChange={async (e) => {
    const projectID = e.target.value;

    // 🔹 Update project_id and generate invoice number
    setNewInvoice((prev) => {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const invoiceNumber = prev.client_name
        ? `${prev.client_name}-${projectID}-${month}${year}`
        : prev.invoice_number;

      return {
        ...prev,
        project_id: projectID,
        invoice_number: invoiceNumber,
      };
    });

    try {
      // 🔹 Fetch project details
      const res = await fetch(`http://localhost:7760/getProject/${projectID}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const projectData = await res.json();

      // 🔹 Store selected project
      setSelectedProject(projectData);

      // 🧮 Immediately calculate GST and invoice value
      const cycle = projectData.invoiceCycle || "Monthly";
      const gstPercentage = selectedClient?.gstPercentage || 0;

      // Assuming your helper function exists
      const { invoiceValue, gstAmount } = calculateInvoiceValue(
        cycle,
        newInvoice.billable_days,
        projectData,
        gstPercentage
      );

      // 🔹 Update invoice values immediately
      setNewInvoice((prev) => ({
        ...prev,
        invoice_cycle: cycle,
        invoice_value: invoiceValue,
        gst_amount: gstAmount,
      }));
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  }}
>
  {projects.length > 0 ? (
    projects.map((p) => (
      <MenuItem key={p.projectID} value={p.projectID}>
        {p.projectName} - {p.projectID}
      </MenuItem>
    ))
  ) : (
    <MenuItem disabled>No projects found</MenuItem>
  )}
</TextField>

)}



    </div>

    {/* Row 3: Start Date + End Date */}
   <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
  <TextField
  type="date"
  fullWidth
  label="Start Date"
  value={newInvoice.start_date || getPrevMonthStart(newInvoice.invoice_date)}
  onChange={(e) =>
    setNewInvoice({ ...newInvoice, start_date: e.target.value })
  }
  InputLabelProps={{ shrink: true }}
  sx={{
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      "&:hover fieldset": { borderColor: "black" },
      "&.Mui-focused fieldset": { borderColor: "black" },
    },
  }}
/>

<TextField
  type="date"
  fullWidth
  label="End Date"
  value={newInvoice.end_date || getPrevMonthEnd(newInvoice.invoice_date)}
  onChange={(e) =>
    setNewInvoice({ ...newInvoice, end_date: e.target.value })
  }
  InputLabelProps={{ shrink: true }}
  sx={{
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      "&:hover fieldset": { borderColor: "black" },
      "&.Mui-focused fieldset": { borderColor: "black" },
    },
  }}
/>
</div>

    {/* Row 4: Invoice Cycle */}
    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
      <TextField
        select
        fullWidth
        label="Invoice Cycle"
        value={newInvoice.invoice_cycle}
        onChange={(e) => {
          const cycle = e.target.value;
          const { invoiceValue, gstAmount } = calculateInvoiceValue(
            cycle,
            newInvoice.billable_days,
            selectedProject,
            selectedClient?.gstPercentage
          );

          setNewInvoice({
            ...newInvoice,
            invoice_cycle: cycle,
            invoice_value: invoiceValue,
            gst_amount: gstAmount,
          });
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "black" },
            "&:hover fieldset": { borderColor: "black" },
            "&.Mui-focused fieldset": { borderColor: "black" },
          },
        }}
      >
        <MenuItem value="Monthly">Monthly</MenuItem>
        <MenuItem value="Quarterly">Quarterly</MenuItem>
      </TextField>
      <TextField
        fullWidth
        label="Non-Billable Days"
        type="text"
        value={newInvoice.billable_days}
        onChange={(e) => {
          const days = parseInt(e.target.value) || 0;
          const { invoiceValue, gstAmount } = calculateInvoiceValue(
            newInvoice.invoice_cycle,
            days,
            selectedProject,
            selectedClient?.gstPercentage
          );

          setNewInvoice({
            ...newInvoice,
            billable_days: days,
            invoice_value: invoiceValue,
            gst_amount: gstAmount,
          });
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "black" },
            "&:hover fieldset": { borderColor: "black" },
            "&.Mui-focused fieldset": { borderColor: "black" },
          },
        }}
      />

      <TextField
        select
        fullWidth
        label="Received"
        value={newInvoice.received}
        onChange={(e) =>
          setNewInvoice({ ...newInvoice, received: e.target.value })
        }
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "black" },
            "&:hover fieldset": { borderColor: "black" },
            "&.Mui-focused fieldset": { borderColor: "black" },
          },
        }}
      >
        <MenuItem value="Yes">Yes</MenuItem>
        <MenuItem value="No">No</MenuItem>
      </TextField>
    </div>


    {/* Conditional Row: Received Date */}
    {newInvoice.received === "Yes" && (
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <TextField
          type="date"
          fullWidth
          label="Received Date"
          value={newInvoice.received_date || ""}
          onChange={(e) =>
            setNewInvoice({ ...newInvoice, received_date: e.target.value })
          }
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "black" },
              "&:hover fieldset": { borderColor: "black" },
              "&.Mui-focused fieldset": { borderColor: "black" },
            },
          }}
        />
      </div>
    )}
  </DialogContent>
   {/* Invoice Summary Table */}
<div style={{ marginBottom: 10 }}>
  <Table size="small">
    <TableBody>
       <TableRow style={{ backgroundColor: "#edd4d4ff" }}> {/* light green */}
  <TableCell style={{ fontWeight: "bold" }}>Actual Monthly Value</TableCell>
  <TableCell>
    {actualValue
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(actualValue)
      : "-"}
  </TableCell>
</TableRow> 
<center><Divider style={{margin:"10px",fontWeight:"bold"}}>Breakdown Table</Divider>
</center>
      <TableRow style={{ backgroundColor: "#d4e0edff" }}>
  <TableCell style={{ fontWeight: "bold" }}>Invoice Value</TableCell>
  <TableCell style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span>
      {newInvoice.invoice_value
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(newInvoice.invoice_value)
        : "₹0"}
    </span>
    {actualValue && newInvoice.invoice_value && (
      <span style={{ fontSize: "0.75rem", color: "#555" }}>
        Diff: {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(actualValue - newInvoice.invoice_value)}
      </span>
    )}
  </TableCell>
</TableRow>

      <TableRow style={{ backgroundColor: "#cacecbff" }}>
        <TableCell style={{ fontWeight: "bold" }}>GST Amount</TableCell>
        <TableCell>
          {newInvoice.gst_amount
            ? new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(newInvoice.gst_amount)
            : "₹0"}
        </TableCell>
      </TableRow>
     

      <TableRow style={{ backgroundColor: "#ddedd4ff" }}>
        <TableCell style={{ fontWeight: "bold" }}>Total</TableCell>
        <TableCell>
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(
            (Number(newInvoice.invoice_value) || 0) +
            (Number(newInvoice.gst_amount) || 0)
          )}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>

  <DialogActions>
    <Button onClick={() => {setOpenDialog(false);resetForm();setIsRaised(false)}}>Cancel</Button>
    <Button variant="outlined" color="success" onClick={()=>{handleAddInvoice()}}>
      Save
    </Button>
  </DialogActions>
</Dialog>


     {/* Preview of Invoice */}
     <Dialog
  open={openPreview}

onClose={() => {
    setOpenPreview(false);
    setSelectedInvoice(null);   // reset invoice data
    setNewInvoice({});          // optional, reset new invoice too
  }}
    fullWidth
  maxWidth="md"
>
  <DialogTitle style={{ fontWeight: "bold" }}>Invoice Preview</DialogTitle>
  <DialogContent dividers>
   {(selectedInvoice || newInvoice) && (
  <div
    id="invoice-preview"
    style={{
      padding: 20,
      border: "1px solid #ccc",
      fontFamily: "Arial, sans-serif",
      color: "#333",
    }}
  >
    {/* Pick invoice object dynamically */}
    {(() => {
      const invoice = selectedInvoice || newInvoice; // use whichever is set

      return (
        <>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <img
              src="./Images/logo.avif"
              alt="Company Logo"
              style={{ height: 50, width: 195 }}
            />
            <div style={{ textAlign: "right" }}>
              <h2 style={{ margin: 0 }}>Ornnova Technologies India Pvt Ltd</h2>
              <p style={{ margin: 0 }}>
                #66, 2nd Floor, 1st Main Road, ST Bed Layout, Koramangala,
                Bangalore-560034
              </p>
              <p style={{ margin: 0 }}>GSTIN/UIN: 29AACCO2254P1ZZ</p>
              <p style={{ margin: 0 }}>CIN: U72900KA2015PTC083796</p>
              <p style={{ margin: 0 }}>State Name: Karnataka, Code: 29</p>
              <p style={{ margin: 0 }}>E-Mail: accounts@ornnova.com</p>
            </div>
          </div>

          {/* Details */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <p>
                <strong>Invoice Number:</strong> {invoice.invoice_number}
              </p>
              <p>
                <strong>Invoice Date:</strong> {invoice.invoice_date}
              </p>
              <p>
                <strong>Client Name:</strong> {invoice.client_name}
              </p>
              <p>
                <strong>Project ID:</strong> {invoice.project_id}
              </p>
            </div>
            <div>
              <p>
                <strong>Start Date:</strong> {invoice.start_date}
              </p>
              <p>
                <strong>End Date:</strong> {invoice.end_date}
              </p>
              <p>
                <strong>Invoice Cycle:</strong> {invoice.invoice_cycle}
              </p>
              <p>


<strong>Due Date:</strong> {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>

          {/* Amounts Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 20,
            }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>
                  Description
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: 8,
                    textAlign: "right",
                  }}
                >
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>
                  Invoice Value
                </td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: 8,
                    textAlign: "right",
                  }}
                >
                  {new Intl.NumberFormat("en-IN").format(
                    invoice.invoice_value || 0
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>GST</td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: 8,
                    textAlign: "right",
                  }}
                >
                  {new Intl.NumberFormat("en-IN").format(
                    invoice.gst_amount || 0
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>
                  <strong>Total</strong>
                </td>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: 8,
                    textAlign: "right",
                  }}
                >
                  <strong>
                    {new Intl.NumberFormat("en-IN").format(
                      (Number(invoice.invoice_value) || 0) +
                        (Number(invoice.gst_amount) || 0)
                    )}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            <strong>Non-Billable Days:</strong> {invoice.billable_days}
          </p>
          <strong>Received:</strong>{" "}
          {invoice.received === "Yes" ? (
            <>
              Yes{" "}
              <CheckCircleIcon
                style={{ color: "green", verticalAlign: "middle" }}
              />{" "}
              <br />
              <br />
              <strong>Received Date:</strong> {invoice.received_date || "-"}
            </>
          ) : (
            <>
              <CancelIcon
                style={{ color: "red", verticalAlign: "middle" }}
              />{" "}
              No
            </>
          )}

          <div style={{ marginTop: 30, textAlign: "center" }}>
            <p>Thank you !</p>
          </div>
        </>
      );
    })()}
  </div>
)}

  </DialogContent>
  <DialogActions>
    <Button onClick={() => {setOpenPreview(false); setSelectedInvoice(null); setNewInvoice({});}}>Close</Button>
    <Button onClick={handleDownloadPDF} color="secondary" variant="outlined">
      Download PDF
    </Button>
     {/* {!selectedInvoice && (
    <Button
      onClick={handleAddInvoice} // your save function
      color="primary"
      variant="contained"
    >
      Save
    </Button>
  )} */}

  </DialogActions>
</Dialog>

    </div>
  );
}

export default Invoice;
