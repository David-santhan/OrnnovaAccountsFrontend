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
const [calculatedValues,setCalculatedValues]= useState([]);
const [billableError, setBillableError] = useState("");



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
  non_billable_days: "",
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
    // 🔹 Required fields validation
    const requiredFields = [
      { key: "invoice_date", label: "Invoice Date" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
      { key: "client_name", label: "Client Name" },
      { key: "project_id", label: "Project" },
    ];

    const missing = requiredFields.filter(
      (field) => !newInvoice[field.key] || newInvoice[field.key].toString().trim() === ""
    );

    if (missing.length > 0) {
      const missingFields = missing.map((f) => f.label).join(", ");
      alert(`⚠️ Please fill all mandatory fields:\n${missingFields}`);
      return; // Stop execution
    }

    // 🔹 Prepare invoice data
    const invoiceToSend = {
      ...newInvoice,
      invoice_value: Number(calculatedValues.invoice_value) || 0,
      gst_amount: Number(calculatedValues.gst_amount) || 0,
      tds_amount: Number(calculatedValues.tds_amount) || 0,
    };

    // 🔹 Auto-calculate due_date based on payment terms
    if (invoiceToSend.invoice_date && selectedClient?.paymentTerms) {
      const totalDays = Number(selectedClient.paymentTerms) + 2;
      const d = new Date(invoiceToSend.invoice_date);
      d.setDate(d.getDate() + totalDays);
      invoiceToSend.due_date = d.toISOString().split("T")[0];
    }

    // 🔹 POST request to save invoice
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
      setCalculatedValues("");
      setNewInvoice({
        invoice_number: "",
        invoice_date: "",
        client_name: "",
        project_id: "",
        start_date: "",
        end_date: "",
        invoice_cycle: "",
        invoice_value: 0,
        gst_amount: 0,
        tds_amount: 0,
        due_date: "",
        non_billable_days: 0,
        received: "No",
        received_date: "",
      });

      fetchActiveProjects();
      fetchProjectsWithoutInvoice();
    } else if (
      data.message === "Already Raised for this month for this project"
    ) {
      alert("⚠️ Invoice already raised for this project in the selected month.");
    } else {
      alert(data.error || "Error adding invoice");
    }
  } catch (err) {
    console.error("❌ Request failed:", err);
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

// // Utility functions
// const getPrevMonthStart = (dateStr) => {
//   const date = dateStr ? new Date(dateStr) : new Date();
//   return new Date(date.getFullYear(), date.getMonth() - 1, 1)
//     .toISOString()
//     .split("T")[0];
// };

// const getPrevMonthEnd = (dateStr) => {
//   const date = dateStr ? new Date(dateStr) : new Date();
//   return new Date(date.getFullYear(), date.getMonth(), 0) // 0 = last day of prev month
//     .toISOString()
//     .split("T")[0];
// };

useEffect(() => {
  if (isRaised && selectedProject?.invoiceCycle) {
    const cycle = selectedProject.invoiceCycle;
    const { invoiceValue, gstAmount } = calculateInvoiceValue(
      cycle,
      newInvoice.non_billable_days,
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
}, [isRaised, selectedProject, newInvoice.non_billable_days, selectedClient]);

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
    selectedProject.non_billable_days || 0,
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


// Save edited Invoice newInvoice.non_billable_days,
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

const calculateInvoiceValue = (cycle, billableDays, project) => {
  try {
    if (!project || Object.keys(project).length === 0) {
      return {
        base_value: 0,
        gst_amount: 0,
        tds_amount: 0,
        invoice_value: 0,
        non_billable_days: 0,
      };
    }

    // Extract safely
    const billingType = project.billingType || "Month";
    const totalUnits = Number(project.hoursOrDays) || 0;
    const totalBilling = Number(project.monthlyBilling) || 0;
    const gst_percentage = parseFloat(project.gst) || 0;
    const tds_percentage = parseFloat(project.tds) || 0;
    const billable = Number(billableDays) || 0;

    // 🧮 Step 1: Per-unit rate
    let perUnitRate = 0;
    if (billingType === "Day" || billingType === "Hour") {
      perUnitRate = totalUnits > 0 ? totalBilling / totalUnits : 0;
    } else {
      perUnitRate = totalBilling;
    }

    // 💵 Step 2: Base value = rate * billable days (or full for Monthly)
    const base_value =
      billingType === "Month" ? perUnitRate : perUnitRate * billable;

    // 📅 Step 3: Non-billable
    const non_billable_days =
      billingType === "Month" ? 0 : Math.max(0, totalUnits - billable);

    // 💰 Step 4: Tax calculation — strictly on base value only
    const gst_amount = (base_value * gst_percentage) / 100;
    const tds_amount = (base_value * tds_percentage) / 100;

    // 🧾 Step 5: Final Total (Base + GST − TDS)
    const invoice_value = base_value + gst_amount - tds_amount;
console.log(`Base=${base_value}, GST=${gst_amount}, TDS=${tds_amount}, Total=${invoice_value}`);

    return {
      base_value: Math.round(base_value),
      gst_amount: Math.round(gst_amount),
      tds_amount: Math.round(tds_amount),
      invoice_value: Math.round(invoice_value),
      non_billable_days,
    };
    
  } catch (err) {
    console.error("❌ Error calculating invoice:", err);
    return {
      base_value: 0,
      gst_amount: 0,
      tds_amount: 0,
      invoice_value: 0,
      non_billable_days: 0,
    };
  }
};



const handleBillableChange = (e) => {
  const billable = Number(e.target.value) || 0;

  if (!selectedProject || Object.keys(selectedProject).length === 0) {
    console.warn("⚠️ selectedProject not loaded yet");
    return;
  }

  const totalUnits = Number(selectedProject.hoursOrDays) || 0;

  // ❌ Validation: Prevent exceeding the limit
  if (billable > totalUnits) {
    setBillableError(
      `Billable ${selectedProject.billingType === "Hour" ? "hours" : "days"} cannot exceed ${totalUnits}.`
    );
    return;
  } else {
    setBillableError(""); // clear error
  }

  // ✅ Continue normal calculation
  const calc = calculateInvoiceValue(
    newInvoice.invoice_cycle,
    billable,
    selectedProject
  );

  setNewInvoice((prev) => ({
    ...prev,
    billable_days: billable,
    non_billable_days: calc.non_billable_days,
    base_value: calc.base_value,
    gst_amount: calc.gst_amount,
    tds_amount: calc.tds_amount,
    invoice_value: calc.invoice_value,
  }));

  setCalculatedValues(calc);
};


useEffect(() => {
  if (selectedProject && selectedProject.billingType === "Month") {
    // Automatically calculate monthly invoice
    const calc = calculateInvoiceValue(
      selectedProject.invoiceCycle || "Monthly",
      0, // billable days not relevant for Monthly type
      selectedProject
    );

    setNewInvoice((prev) => ({
      ...prev,
      billable_days: 0,
      non_billable_days: 0,
      base_value: calc.base_value,
      gst_amount: calc.gst_amount,
      tds_amount: calc.tds_amount,
      invoice_value: calc.invoice_value,
    }));

    setCalculatedValues(calc);
  }
}, [selectedProject]);






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
                non_billable_days: proj.non_billable_days || "",
                received: "No",
              };

              setNewInvoice(invoiceData);
              setIsRaised(true);
              setOpenDialog(true);
              handleRaise(invoiceData);
              console.log(invoiceData)
              console.log(selectedProject)
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
  {/* 🧾 Title */}
  <DialogTitle
    style={{
      fontWeight: "bold",
      fontFamily: "monospace",
      textAlign: "center",
      backgroundColor: "#f3f4f6",
      borderBottom: "1px solid #e5e7eb",
      fontSize: "1.25rem",
      letterSpacing: "0.5px",
    }}
  >
    Project Details
  </DialogTitle>

  {/* 🧩 Main Content */}
  <DialogContent
    dividers
    style={{
      maxHeight: "450px",
      overflowY: "auto",
      backgroundColor: "#fafafa",
      padding: "1.5rem",
    }}
  >
    {selectedProjectDetails ? (
      <>
        {/* === 1️⃣ Project Information === */}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            marginBottom: "8px",
            color: "#1f2937",
            borderBottom: "2px solid #e5e7eb",
          }}
        >
          🏗️ Project Information
        </Typography>
        <Table size="small">
          <TableBody>
            {[
              ["Project ID", selectedProjectDetails.projectID],
              ["Project Name", selectedProjectDetails.projectName],
              ["Project Description", selectedProjectDetails.projectDescription],
              ["Skill", selectedProjectDetails.skill],
              ["Location", selectedProjectDetails.projectLocation],
              [
                "Start Date",
                selectedProjectDetails.startDate
                  ? new Date(selectedProjectDetails.startDate).toLocaleDateString("en-GB")
                  : "-",
              ],
              [
                "End Date",
                selectedProjectDetails.endDate
                  ? new Date(selectedProjectDetails.endDate).toLocaleDateString("en-GB")
                  : "-",
              ],
              ["Active", selectedProjectDetails.active || "-"],
            ].map(([label, value]) => (
              <TableRow key={label}>
                <TableCell style={{ fontWeight: "bold", width: "45%", color: "#374151" }}>
                  {label}
                </TableCell>
                <TableCell style={{ color: "#111827" }}>{value || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* === 2️⃣ Billing Details === */}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            margin: "16px 0 8px",
            color: "#1f2937",
            borderBottom: "2px solid #e5e7eb",
          }}
        >
          💰 Billing Details
        </Typography>
        <Table size="small">
          <TableBody>
            {[
              ["Billing Type", selectedProjectDetails.billingType],
              [
                "Bill Rate",
                new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(selectedProjectDetails.billRate || 0),
              ],
              [
                "Monthly Billing",
                new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(selectedProjectDetails.monthlyBilling || 0),
              ],
              ["Invoice Cycle", selectedProjectDetails.invoiceCycle || "-"],
              [`GST`, `${parseFloat(selectedProjectDetails.gst || 0)}%`],
              [`TDS`, `${parseFloat(selectedProjectDetails.tds || 0)}%`],
              [
                "Net Payable",
                new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(selectedProjectDetails.netPayable || 0),
              ],
              [
                "PO Number",
                selectedProjectDetails.poNumber || "-",
              ],
              [
                "Purchase Order Value",
                new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(selectedProjectDetails.purchaseOrderValue || 0),
              ],
              [
                "Purchase Order File",
                selectedProjectDetails.purchaseOrder ? (
                  <a
                    href={`http://localhost:7760/uploads/${selectedProjectDetails.purchaseOrder}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open File
                  </a>
                ) : (
                  "No File"
                ),
              ],
            ].map(([label, value]) => (
              <TableRow key={label}>
                <TableCell style={{ fontWeight: "bold", width: "45%", color: "#374151" }}>
                  {label}
                </TableCell>
                <TableCell style={{ color: "#111827" }}>{value || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* === 3️⃣ SPOC & Contact Information === */}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            margin: "16px 0 8px",
            color: "#1f2937",
            borderBottom: "2px solid #e5e7eb",
          }}
        >
          📞 SPOC / Contact Information
        </Typography>
        <Table size="small">
          <TableBody>
            {[
              ["SPOC", selectedProjectDetails.spoc],
              ["Email", selectedProjectDetails.mailID],
              ["Mobile No", selectedProjectDetails.mobileNo],
              ["Employee ID", selectedProjectDetails.employeeID],
              ["Employee Name", selectedProjectDetails.employeeName],
            ].map(([label, value]) => (
              <TableRow key={label}>
                <TableCell style={{ fontWeight: "bold", width: "45%", color: "#374151" }}>
                  {label}
                </TableCell>
                <TableCell style={{ color: "#111827" }}>{value || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    ) : (
      <Typography
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontStyle: "italic",
          padding: "1rem 0",
        }}
      >
        No project details available
      </Typography>
    )}
  </DialogContent>

  <DialogActions style={{ justifyContent: "center", padding: "1rem" }}>
    <Button
      variant="contained"
      onClick={() => setOpenProjectModal(false)}
      style={{
        backgroundColor: "#2563eb",
        color: "white",
        textTransform: "none",
        fontWeight: "bold",
        borderRadius: "8px",
        padding: "6px 16px",
      }}
    >
      Close
    </Button>
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
          value={editingInvoice.non_billable_days}
          onChange={(e) =>
            setEditingInvoice({ ...editingInvoice, non_billable_days: e.target.value })
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


    

    </div>

    {/* Row 2: Invoice Date + Project */}
    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
  
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
          console.log(data.projects);

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
        newInvoice.non_billable_days,
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
  value={newInvoice.start_date }
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
  value={newInvoice.end_date }
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

<div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
  <div style={{ display: "flex", gap: 10 }}>
    {/* Billable Days / Hours */}
    <TextField
  fullWidth
  type="number"
  label={selectedProject?.billingType === "Hour" ? "Billable Hours" : "Billable Days"}
  value={newInvoice.billable_days || ""}
  onChange={handleBillableChange}
  disabled={selectedProject?.billingType === "Month"}
  error={!!billableError}
  helperText={
    selectedProject?.billingType === "Month"
      ? "Monthly billing is fixed — manual entry not required."
      : billableError || ""
  }
  sx={{
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      "&:hover fieldset": { borderColor: "black" },
      "&.Mui-focused fieldset": { borderColor: "black" },
      backgroundColor:
        selectedProject?.billingType === "Month" ? "#f3f4f6" : "white", // light grey for disabled
    },
    "& .Mui-disabled": {
      WebkitTextFillColor: "#4b5563", // darker grey text color
    },
    "& .MuiFormHelperText-root": {
      fontStyle:
        selectedProject?.billingType === "Month" ? "italic" : "normal",
      color:
        selectedProject?.billingType === "Month"
          ? "#6b7280"
          : billableError
          ? "#dc2626"
          : "#6b7280",
    },
  }}
/>


    {/* Non-Billable Days / Hours */}
    <TextField
      fullWidth
      type="number"
      label={selectedProject?.billingType === "Hour" ? "Non-Billable Hours" : "Non-Billable Days"}
      value={newInvoice.non_billable_days || ""}
      InputProps={{ readOnly: true }}
      disabled={selectedProject?.billingType === "Month"}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "black" },
          "&:hover fieldset": { borderColor: "black" },
          "&.Mui-focused fieldset": { borderColor: "black" },
        },
      }}
    />
  

  </div>
</div>
 <div
  style={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}
>
  <label
    style={{
      fontWeight: "bold",
      color: "#374151",
      fontSize: "0.9rem",
      marginBottom: "4px",
    }}
  >
    Invoice Cycle
  </label>
  <div
    style={{
      border: "1px solid black",
      borderRadius: "6px",
      padding: "10px 12px",
      backgroundColor: "#f9fafb",
      fontSize: "0.95rem",
      color: "#111827",
      fontFamily: "Arial, sans-serif",
    }}
  >
    {newInvoice.invoice_cycle || "—"}
  </div>
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
<div
  style={{
    marginTop: "1rem",
    background: "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    padding: "1rem 1.5rem",
  }}
>
  
  <Table
    size="small"
    style={{
      borderCollapse: "separate",
      borderSpacing: "0 10px",
      width: "100%",
    }}
  >
    <TableBody>
      {/* Base Value */}
      <TableRow
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <TableCell style={{ fontWeight: "bold", color: "#374151", width: "60%" }}>
          Base Value (Before Tax)
        </TableCell>
        <TableCell>
          <TextField
            variant="outlined"
            type="number"
            size="small"
            value={newInvoice.base_value ?? calculatedValues.base_value ?? 0}
            onChange={(e) => {
              const base = Number(e.target.value) || 0;
              const gst = newInvoice.gst_amount ?? calculatedValues.gst_amount ?? 0;
              const tds = newInvoice.tds_amount ?? calculatedValues.tds_amount ?? 0;
              const total = base + gst - tds;

              setNewInvoice((prev) => ({
                ...prev,
                base_value: base,
                invoice_value: total,
              }));
              setCalculatedValues((prev) => ({
                ...prev,
                base_value: base,
                invoice_value: total,
              }));
            }}
            InputProps={{
              startAdornment: (
                <span style={{ marginRight: "5px", color: "#6b7280" }}>₹</span>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 35,
                fontSize: "0.9rem",
              },
            }}
          />
        </TableCell>
      </TableRow>

      {/* GST Amount */}
      <TableRow
        style={{
          backgroundColor: "#f0fdf4",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <TableCell style={{ fontWeight: "bold", color: "#15803d" }}>
          GST Amount (+)
        </TableCell>
        <TableCell>
          <TextField
            variant="outlined"
            type="number"
            size="small"
            value={newInvoice.gst_amount ?? calculatedValues.gst_amount ?? 0}
            onChange={(e) => {
              const gst = Number(e.target.value) || 0;
              const base = newInvoice.base_value ?? calculatedValues.base_value ?? 0;
              const tds = newInvoice.tds_amount ?? calculatedValues.tds_amount ?? 0;
              const total = base + gst - tds;

              setNewInvoice((prev) => ({
                ...prev,
                gst_amount: gst,
                invoice_value: total,
              }));
              setCalculatedValues((prev) => ({
                ...prev,
                gst_amount: gst,
                invoice_value: total,
              }));
            }}
            InputProps={{
              startAdornment: (
                <span style={{ marginRight: "5px", color: "#16a34a" }}>₹</span>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 35,
                fontSize: "0.9rem",
              },
            }}
          />
        </TableCell>
      </TableRow>

      {/* TDS Amount */}
      <TableRow
        style={{
          backgroundColor: "#fef2f2",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <TableCell style={{ fontWeight: "bold", color: "#b91c1c" }}>
          TDS Deduction (−)
        </TableCell>
        <TableCell>
          <TextField
            variant="outlined"
            type="number"
            size="small"
            value={newInvoice.tds_amount ?? calculatedValues.tds_amount ?? 0}
            onChange={(e) => {
              const tds = Number(e.target.value) || 0;
              const base = newInvoice.base_value ?? calculatedValues.base_value ?? 0;
              const gst = newInvoice.gst_amount ?? calculatedValues.gst_amount ?? 0;
              const total = base + gst - tds;

              setNewInvoice((prev) => ({
                ...prev,
                tds_amount: tds,
                invoice_value: total,
              }));
              setCalculatedValues((prev) => ({
                ...prev,
                tds_amount: tds,
                invoice_value: total,
              }));
            }}
            InputProps={{
              startAdornment: (
                <span style={{ marginRight: "5px", color: "#dc2626" }}>₹</span>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 35,
                fontSize: "0.9rem",
              },
            }}
          />
        </TableCell>
      </TableRow>

      {/* Total */}
      <TableRow
        style={{
          backgroundColor: "#ecfdf5",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(16,185,129,0.2)",
        }}
      >
        <TableCell style={{ fontWeight: "bold", color: "#065f46" }}>
          Total (Base + GST − TDS)
        </TableCell>
        <TableCell style={{ fontWeight: "bold", color: "#047857", fontSize: "1rem" }}>
          ₹
          {(newInvoice.invoice_value ?? calculatedValues.invoice_value ?? 0).toLocaleString(
            "en-IN"
          )}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>





  <DialogActions>
    <Button onClick={() => {setOpenDialog(false);resetForm();setIsRaised(false);setCalculatedValues("")}}>Cancel</Button>
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
                      (Number(invoice.invoice_value) || 0) -
                        (Number(invoice.gst_amount) || 0)
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
                      (Number(invoice.invoice_value) || 0) 
                    )}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            <strong>Non-Billable Days:</strong> {invoice.non_billable_days}
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