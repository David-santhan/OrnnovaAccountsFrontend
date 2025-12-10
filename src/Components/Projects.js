import React, { useEffect, useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Fab,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  darkScrollbar,
  TableContainer,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Checkbox,
  IconButton,
  Divider,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { Alert } from "@mui/material";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState(selectedProject || {});
  const [isDirty, setIsDirty] = useState(false); // false until any field changes
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Sync when project changes
  React.useEffect(() => {
    if (selectedProject) setFormValues(selectedProject);
  }, [selectedProject]);

  const handleEditChange = (field, value) => {
    let updatedForm = { ...formValues, [field]: value };

    // Parse values safely
    const billRate = parseFloat(updatedForm.billRate) || 0;
    const hoursOrDays = parseFloat(updatedForm.hoursOrDays) || 0;

    // 🧮 Recalculate Monthly Billing when relevant fields change
    if (["billingType", "billRate", "hoursOrDays"].includes(field)) {
      let monthlyBilling = 0;

      switch (updatedForm.billingType) {
        case "Hour":
          monthlyBilling = billRate * (hoursOrDays || 0);
          break;
        case "Day":
          monthlyBilling = billRate * (hoursOrDays || 0);
          break;
        case "Month":
          monthlyBilling = billRate;
          break;
        default:
          monthlyBilling = 0;
      }

      updatedForm.monthlyBilling = monthlyBilling;
    }

    setFormValues(updatedForm);
    setIsDirty(true); // ✅ enable Save button when something changes
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setOpenDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();

      // Append all fields safely
      Object.keys(formValues).forEach((key) => {
        if (key === "purchaseOrder" && formValues.purchaseOrder instanceof File) {
          // ✅ Attach file
          formData.append("purchaseOrder", formValues.purchaseOrder);
        } else if (key === "employees") {
          // ✅ Convert employees array/object to JSON string
          formData.append("employees", JSON.stringify(formValues.employees || []));
        } else {
          // ✅ Default string value for other fields
          formData.append(key, formValues[key] ?? "");
        }
      });

      const res = await axios.put(
        `http://localhost:7760/update-project/${formValues.projectID}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.success) {
        const refreshed = await fetch("http://localhost:7760/getprojects").then((r) =>
          r.json()
        );
        setAllProjects(refreshed);
        setProjects(refreshed);
        setIsDirty(false);
        setSuccessMessage("✅ Project updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project!");
    }
  };

  const [newProject, setNewProject] = useState({
    clientID: "",
    startDate: "",
    endDate: "",
    projectName: "",
    projectDescription: "",
    skill: "",
    projectLocation: "",
    spoc: "",
    mailID: "",
    mobileNo: "",
    billingType: "",
    billRate: "",
    monthlyBilling: "",
    employeeID: [],
    employeeName: [],
    employees: [], // ✅ used by employee selector
    employeeDetails: [], // ✅ for backend clarity if needed
    hoursOrDays: 0,
    poNumber: "NA",
    purchaseOrder: null,
    purchaseOrderPreview: null,
    purchaseOrderValue: "NA",
    active: "Yes",
    invoiceCycle: "Monthly",
  });

  // Fetch existing projects
  useEffect(() => {
    fetch("http://localhost:7760/getprojects")
      .then((res) => res.json())
      .then((data) => {
        console.log("Projects API response:", data); // 👀 check here
        setAllProjects(Array.isArray(data) ? data : []); // only set if array
      })
      .catch((err) => console.error(err));
    // Fetch clients for dropdown
    fetch("http://localhost:7760/getclients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error(err));

    fetch("http://localhost:7760/getAvailableEmployees")
      .then((res) => res.json())
      .then((data) => {
        console.log("Employees API response:", data);
        if (Array.isArray(data)) {
          setEmployees(data);
          console.log(employees);
        } else {
          setEmployees([]); // fallback if response is not array
        }
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      });
  }, []);

  const handleLoadProjects = () => {
    setProjects(allProjects);
    setLoaded(true);
  };
const handleSearch = (maybeQuery) => {
  try {
    // If caller passed an event, extract value
    let query = maybeQuery;
    if (query && typeof query === "object" && "target" in query) {
      query = query.target.value;
    }

    // Ensure we have a string
    query = query == null ? "" : String(query);

    const q = query.trim().toLowerCase();

    // Defensive: allProjects must be an array
    if (!Array.isArray(allProjects)) {
      console.warn("handleSearch: allProjects is not an array:", allProjects);
      setProjects([]);
      setSearchTerm(query);
      return;
    }

    if (!q) {
      setProjects(allProjects);
      setSearchTerm("");
      return;
    }

    const filtered = allProjects.filter((p) => {
      if (!p) return false;

      const projectName = (p.projectName || "").toString().toLowerCase();
      const clientName = (p.clientName || p.client_name || "").toString().toLowerCase();

      // Build employee names string safely
      let employeeNames = "";

      // Case A: employees is an array
      if (Array.isArray(p.employees) && p.employees.length > 0) {
        employeeNames = p.employees
          .map((e) => (e?.name || e?.employee_name || e || "").toString().toLowerCase())
          .join(" ");
      } else if (typeof p.employees === "string" && p.employees.trim()) {
        // Case B: employees is a JSON string or plain string
        try {
          const arr = JSON.parse(p.employees);
          if (Array.isArray(arr)) {
            employeeNames = arr
              .map((e) => (e?.name || e?.employee_name || e || "").toString().toLowerCase())
              .join(" ");
          } else {
            employeeNames = p.employees.toLowerCase();
          }
        } catch (parseErr) {
          // not JSON => use raw string
          employeeNames = p.employees.toLowerCase();
        }
      } else {
        // Case C: fallback single-field names
        employeeNames = (p.employeeName || p.employee_name || "").toString().toLowerCase();
      }

      // Check if query matches any field
      return (
        projectName.includes(q) ||
        clientName.includes(q) ||
        employeeNames.includes(q)
      );
    });

    setProjects(filtered);
    setSearchTerm(query);
  } catch (err) {
    console.error("handleSearch error:", err);
    // fallback: reset
    setProjects(allProjects);
  }
};



  const handleRowClick = (project) => {
    setSelectedProject(project);
    setOpenPreview(true);
  };

  const handleClose = () => {
    setSelectedProject(null);
    setOpenPreview(false);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let updatedProject = { ...newProject };

    // Handle file upload separately
    if (name === "purchaseOrder") {
      updatedProject[name] = files[0];
    } else {
      updatedProject[name] = value;
    }

    // Get values safely
    const billRate = parseFloat(updatedProject.billRate) || 0;
    const hoursOrDays = parseFloat(updatedProject.hoursOrDays) || 0;

    // 🔄 Recalculate monthlyBilling whenever any related field changes
    if (["billingType", "billRate", "hoursOrDays"].includes(name)) {
      let monthlyBilling = 0;

      switch (updatedProject.billingType) {
        case "Hour":
          // Multiply bill rate × total hours (default 240 if empty)
          monthlyBilling = billRate * (hoursOrDays || 240);
          break;
        case "Day":
          // Multiply bill rate × total days (default 30 if empty)
          monthlyBilling = billRate * (hoursOrDays || 30);
          break;
        case "Month":
          // Monthly billing equals bill rate directly
          monthlyBilling = billRate;
          break;
        default:
          monthlyBilling = 0;
      }

      updatedProject.monthlyBilling = monthlyBilling;
    }

    setNewProject(updatedProject);
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      Object.keys(newProject).forEach((key) => {
        if (key === "employees") {
          // ✅ Convert array/object to JSON before appending
          formData.append("employees", JSON.stringify(newProject.employees || []));
        } else {
          formData.append(key, newProject[key]);
        }
      });

      const response = await fetch("http://localhost:7760/addproject", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to add project");

      const saved = await response.json();
      setProjects([...projects, saved]);
      setOpen(false);
      setSuccessMessage("✅ Project added successfully!");

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error adding project:", error);
      setSuccessMessage("❌ Failed to add project");
    }
  };

  const deleteProject = async (projectID) => {
    try {
      await axios.delete(`http://localhost:7760/deleteproject/${projectID}`);
      // remove deleted project from local state
      setProjects(projects.filter((p) => p.projectID !== projectID));
      setOpenDeleteDialog(false);
      setProjectToDelete(null);
    } catch (error) {
      console.log(error);
      alert("Failed to delete project");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          width: "900px",
          mx: "auto",
          mt: 3,
          mb: 5,
          border: "1px solid lightgray",
          borderRadius: 2,
          boxShadow: 1,
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          height: "80vh",
        }}
      >
        {successMessage && (
          <Alert
            severity={successMessage.startsWith("✅") ? "success" : "error"}
            sx={{ mb: 2 }}
          >
            {successMessage}
          </Alert>
        )}

        <Divider variant="h2" sx={{ fontWeight: "bold", color: "darkblue", mt: "10px" }}>
          Projects
        </Divider>

        {/* Top Controls */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Box
            sx={{
              width: "50%",
              margin: "auto",
              display: "flex",
              gap: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
   <TextField
  label="Search by Project Name"
  variant="outlined"
  fullWidth
  value={searchInput}
  sx={{ marginTop: 1 }}
  onChange={(e) => {
    const value = e.target.value;
    setSearchInput(value);
    handleSearch(value); // pass string directly
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleSearch(searchInput);
    }
  }}
/>


            <Button
              variant="contained"
              color={searchInput ? "success" : "primary"}
              onClick={searchInput ? handleSearch : handleLoadProjects}
              sx={{
                borderRadius: searchInput ? "50%" : 1,
                minWidth: 0,
                width: searchInput ? 52 : "auto",
                height: searchInput ? 47 : "auto",
                px: searchInput ? 0 : 4,
                py: searchInput ? 0 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: searchInput ? "normal" : "bold",
                backgroundColor: searchInput
                  ? undefined
                  : "rgba(106, 106, 232, 1)",
              }}
            >
              {searchInput ? <SearchIcon /> : "Load"}
            </Button>
          </Box>
        </Box>

        {/* Table */}
        {loaded && projects.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{
              flex: 1,
              overflowY: "auto",
              border: "0.25px solid lightgray",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: "whitesmoke" }}>
                  {[
                    "Project ID",
                    "Project Name",
                    "Client",
                    "Employee Name",
                    "Billing Type",
                    "PO File",
                    "Active",
                    "Action",
                  ].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: "bold" }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {projects.map((p, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(p)}
                  >
                    <TableCell>{p.projectID}</TableCell>
                    <TableCell>{p.projectName}</TableCell>

                    <TableCell>
                      {(() => {
                        const client = clients.find((c) => c.id === p.clientID);
                        return client ? `${client.clientName} - ${client.id}` : p.clientID;
                      })()}
                    </TableCell>

                    {/* ✅ Employee Column */}
                    <TableCell>
                      {Array.isArray(p.employees) && p.employees.length > 0
                        ? p.employees.map((emp) => emp.name).join(", ")
                        : "—"}
                    </TableCell>

                    <TableCell>{p.billingType}</TableCell>

                    <TableCell>
                      {p.purchaseOrder ? (
                        <a
                          href={`http://localhost:7760/uploads/${p.purchaseOrder}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "No File"
                      )}
                    </TableCell>

                    <TableCell style={{ textAlign: "center" }}>
                      {p.active === "Yes" ? (
                        <span className="blink-green">Yes</span>
                      ) : (
                        <span className="blink-red">No</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(p);
                        }}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle
          style={{ fontWeight: "bold", fontFamily: "monospace", textAlign: "center" }}
        >
          Confirm Delete
        </DialogTitle>
        <Divider />
        <DialogContent style={{ fontFamily: "monospace", textAlign: "center" }}>
          Are you sure you want to delete project "
          <strong>{projectToDelete?.projectName}</strong>"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" onClick={() => deleteProject(projectToDelete.projectID)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Preview */}
      <Dialog open={openPreview} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: "bold", fontSize: 18 }}>
          Project Preview
        </DialogTitle>
        {successMessage && (
          <Alert
            severity={successMessage.startsWith("✅") ? "success" : "error"}
            sx={{ mb: 2 }}
          >
            {successMessage}
          </Alert>
        )}
        <DialogContent dividers>
          {formValues && (
            <>
              {/* Row 1 — Client & Project */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <TextField
                  select
                  label="Client"
                  name="clientID"
                  value={formValues.clientID || ""}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                >
                  {clients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.clientName} - {c.id}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Project Name"
                  name="projectName"
                  value={formValues.projectName || ""}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </div>

              {/* Row 3 — Skill & Location */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <TextField
                  label="Skill"
                  name="skill"
                  value={formValues.skill || ""}
                  onChange={(e) => handleEditChange("skill", e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Project Location"
                  name="projectLocation"
                  value={formValues.projectLocation || ""}
                  onChange={(e) =>
                    handleEditChange("projectLocation", e.target.value)
                  }
                  fullWidth
                  margin="normal"
                />
              </div>

              {/* Row 4 — Dates */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <TextField
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={formValues.startDate || ""}
                  onChange={(e) => handleEditChange("startDate", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="End Date"
                  type="date"
                  name="endDate"
                  value={formValues.endDate || ""}
                  onChange={(e) => handleEditChange("endDate", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  margin="normal"
                />
              </div>

              {/* Row 2 — Description */}
              <TextField
                label="Project Description"
                name="projectDescription"
                multiline
                rows={2}
                value={formValues.projectDescription || ""}
                onChange={(e) =>
                  handleEditChange("projectDescription", e.target.value)
                }
                fullWidth
                margin="normal"
              />

              <Divider
                textAlign="center"
                sx={{
                  marginY: 2,
                  "&::before, &::after": {
                    borderColor: "#50a7ffff",
                    borderWidth: "2px",
                    color: "darkblue",
                    fontSize: "20px",
                    fontWeight: "bold",
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
                  Contact Details
                </Box>
              </Divider>

              {/* Row 5 — SPOC, Mail, Mobile */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <TextField
                  label="SPOC"
                  name="spoc"
                  value={formValues.spoc || ""}
                  onChange={(e) => handleEditChange("spoc", e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Mail ID"
                  name="mailID"
                  type="email"
                  value={formValues.mailID || ""}
                  onChange={(e) => handleEditChange("mailID", e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Mobile No"
                  name="mobileNo"
                  type="text"
                  value={formValues.mobileNo || ""}
                  onChange={(e) => handleEditChange("mobileNo", e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </div>

              <Divider
                textAlign="center"
                sx={{
                  marginY: 2,
                  "&::before, &::after": {
                    borderColor: "#50a7ffff",
                    borderWidth: "2px",
                    color: "darkblue",
                    fontSize: "20px",
                    fontWeight: "bold",
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
                  Billing Details
                </Box>
              </Divider>

              {/* Billing Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "nowrap",
                  width: "100%",
                  overflowX: "auto",
                  borderBottom: "1px solid #ddd",
                  paddingBottom: "10px",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ minWidth: 120, fontWeight: 600, color: "#1976d2" }}
                >
                  Billing Info:
                </Typography>

                <TextField
                  select
                  label="Billing Type"
                  name="billingType"
                  value={formValues.billingType || ""}
                  onChange={(e) =>
                    handleEditChange("billingType", e.target.value)
                  }
                  sx={{ minWidth: 160 }}
                  margin="normal"
                >
                  <MenuItem value="Hour">Hour</MenuItem>
                  <MenuItem value="Day">Day</MenuItem>
                  <MenuItem value="Month">Month</MenuItem>
                </TextField>

                <TextField
                  label="Bill Rate"
                  name="billRate"
                  type="number"
                  value={formValues.billRate || ""}
                  onChange={(e) => handleEditChange("billRate", e.target.value)}
                  sx={{ minWidth: 160 }}
                  margin="normal"
                />

                <TextField
                  label="Monthly Billing"
                  name="monthlyBilling"
                  type="number"
                  value={formValues.monthlyBilling || ""}
                  InputProps={{ readOnly: true }}
                  sx={{ minWidth: 160 }}
                  margin="normal"
                />

                <TextField
                  select
                  label="Invoice Cycle"
                  name="invoiceCycle"
                  value={formValues.invoiceCycle || ""}
                  onChange={(e) =>
                    handleEditChange("invoiceCycle", e.target.value)
                  }
                  sx={{ minWidth: 160 }}
                  margin="normal"
                >
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Quarterly">Quarterly</MenuItem>
                </TextField>
              </div>

              {/* Tax & Time */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                  width: "100%",
                  overflowX: "auto",
                  marginTop: "1rem",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ minWidth: 120, fontWeight: 600, color: "#1976d2" }}
                >
                  Tax & Time Info:
                </Typography>

                {(formValues.billingType === "Hour" ||
                  formValues.billingType === "Day") && (
                  <TextField
                    label={
                      formValues.billingType === "Hour"
                        ? "Total Hours"
                        : "Total Days"
                    }
                    name="hoursOrDays"
                    type="number"
                    value={formValues.hoursOrDays || ""}
                    onChange={(e) =>
                      handleEditChange("hoursOrDays", e.target.value)
                    }
                    sx={{ width: 100 }}
                    margin="normal"
                  />
                )}

                {(formValues.monthlyBilling > 0) && (
                  <TextField
                    label="GST (%)"
                    name="gst"
                    type="number"
                    value={formValues.gst || ""}
                    onChange={(e) => {
                      const gst = parseFloat(e.target.value) || 0;
                      const gstAmount =
                        (formValues.monthlyBilling * gst) / 100;
                      const tdsAmount =
                        (formValues.monthlyBilling *
                          (formValues.tds || 0)) /
                        100;

                      setFormValues({
                        ...formValues,
                        gst,
                        gstAmount,
                        netPayable:
                          formValues.monthlyBilling +
                          gstAmount -
                          tdsAmount,
                      });
                      setIsDirty(true);
                    }}
                    sx={{ width: 130 }}
                    margin="normal"
                    disabled={
                      (formValues.billingType === "Hour" &&
                        !formValues.hoursOrDays) ||
                      (formValues.billingType === "Day" &&
                        !formValues.hoursOrDays)
                    }
                  />
                )}

                {(formValues.monthlyBilling > 0) && (
                  <TextField
                    label="TDS (%)"
                    name="tds"
                    type="number"
                    value={formValues.tds || ""}
                    onChange={(e) => {
                      const tds = parseFloat(e.target.value) || 0;
                      const gstAmount =
                        (formValues.monthlyBilling *
                          (formValues.gst || 0)) /
                        100;
                      const tdsAmount =
                        (formValues.monthlyBilling * tds) / 100;

                      setFormValues({
                        ...formValues,
                        tds,
                        tdsAmount,
                        netPayable:
                          formValues.monthlyBilling +
                          gstAmount -
                          tdsAmount,
                      });
                      setIsDirty(true);
                    }}
                    sx={{ width: 130 }}
                    margin="normal"
                    disabled={
                      (formValues.billingType === "Hour" &&
                        !formValues.hoursOrDays) ||
                      (formValues.billingType === "Day" &&
                        !formValues.hoursOrDays)
                    }
                  />
                )}

                {(formValues.gst || formValues.tds) && (
                  <TextField
                    label="Net Payable"
                    name="netPayable"
                    type="number"
                    value={formValues.netPayable || ""}
                    InputProps={{ readOnly: true }}
                    sx={{
                      minWidth: 200,
                      backgroundColor: "#f1f8e9",
                      fontWeight: "bold",
                    }}
                    margin="normal"
                  />
                )}
              </div>

              <Divider
                textAlign="center"
                sx={{
                  marginY: 2,
                  "&::before, &::after": {
                    borderColor: "#50a7ffff",
                    borderWidth: "2px",
                    color: "darkblue",
                    fontSize: "20px",
                    fontWeight: "bold",
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
                  Employee & PO Details
                </Box>
              </Divider>

              {/* Employee & PO in Preview */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Employees</InputLabel>
                  <Select
                    multiple
                    displayEmpty
                    value={
                      Array.isArray(formValues.employees)
                        ? formValues.employees.map((emp) => emp.id)
                        : []
                    }
                    onChange={(e) => {
                      const selectedIDs = e.target.value;

                      const selectedEmployees = employees
                        .filter((emp) => selectedIDs.includes(emp.employee_id))
                        .map((emp) => ({
                          id: emp.employee_id,
                          name: emp.employee_name,
                        }));

                      setFormValues((prev) => ({
                        ...prev,
                        employees: selectedEmployees,
                      }));

                      setIsDirty(true);
                    }}
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0) {
                        return <em>Select employees</em>;
                      }
                      return (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((id) => {
                            const emp = employees.find(
                              (e) => e.employee_id === id
                            );
                            const empName = emp ? emp.employee_name : id;
                            return (
                              <Chip
                                key={id}
                                label={empName}
                                size="small"
                                onMouseDown={(e) => e.stopPropagation()}
                                onDelete={() => {
                                  setFormValues((prev) => {
                                    const updated = prev.employees.filter(
                                      (e) => e.id !== id
                                    );
                                    return { ...prev, employees: updated };
                                  });
                                  setIsDirty(true);
                                }}
                                sx={{
                                  backgroundColor: "#e0f7fa",
                                  "& .MuiChip-deleteIcon": {
                                    color: "gray",
                                    "&:hover": { color: "black" },
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>
                      );
                    }}
                    sx={{ minHeight: "56px" }}
                  >
                    {employees.map((emp, index) => (
                      <MenuItem
                        key={emp.employee_id}
                        value={emp.employee_id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderBottom:
                            index !== employees.length - 1
                              ? "1px solid #e0e0e0"
                              : "none",
                          py: 1,
                        }}
                      >
                        <Checkbox
                          checked={
                            Array.isArray(formValues.employees)
                              ? formValues.employees.some(
                                  (e) => e.id === emp.employee_id
                                )
                              : false
                          }
                        />
                        <span>{emp.employee_name}</span>
                        <span style={{ color: "gray" }}>
                          {emp.employee_id}
                        </span>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="PO Number"
                  name="poNumber"
                  value={formValues.poNumber || ""}
                  onChange={(e) => handleEditChange("poNumber", e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Purchase Order Value"
                  name="purchaseOrderValue"
                  type="text"
                  value={formValues.purchaseOrderValue || ""}
                  onChange={(e) =>
                    handleEditChange("purchaseOrderValue", e.target.value)
                  }
                  fullWidth
                  margin="normal"
                />
                <TextField
                  select
                  label="Active"
                  name="active"
                  value={formValues.active || "No"}
                  onChange={(e) => handleEditChange("active", e.target.value)}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </div>

              {/* File upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {formValues.purchaseOrder &&
                  typeof formValues.purchaseOrder === "string" && (
                    <div style={{ marginTop: "10px" }}>
                      <a
                        href={`http://localhost:7760/uploads/${formValues.purchaseOrder}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Current PO File
                      </a>
                    </div>
                  )}

                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Upload Purchase Order
                  <input
                    type="file"
                    hidden
                    name="purchaseOrder"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setFormValues((prev) => ({
                          ...prev,
                          purchaseOrder: file,
                          purchaseOrderPreview: URL.createObjectURL(file),
                        }));
                        setIsDirty(true);
                      }
                    }}
                  />
                </Button>

                {formValues.purchaseOrderPreview && (
                  <div style={{ marginTop: "10px" }}>
                    {formValues.purchaseOrder instanceof File &&
                    formValues.purchaseOrder.type.startsWith("image/") ? (
                      <img
                        src={formValues.purchaseOrderPreview}
                        alt="Purchase Order Preview"
                        style={{ maxWidth: "200px", borderRadius: "8px" }}
                      />
                    ) : (
                      <a
                        href={formValues.purchaseOrderPreview}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formValues.purchaseOrder.name || "Uploaded File"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {isDirty ? (
            <>
              <Button
                onClick={() => {
                  setFormValues(selectedProject);
                  setIsDirty(false);
                }}
                color="secondary"
                variant="outlined"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} color="primary" variant="contained">
                Save
              </Button>
            </>
          ) : (
            <Button disabled variant="contained">
              Edit
            </Button>
          )}
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 20, right: 20 }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Add Project Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontWeight: "bold" }}>Add New Project</DialogTitle>
        <DialogContent dividers>
          {/* Row 1 */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField
              select
              label="Client"
              name="clientID"
              value={newProject.clientID}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              {clients.map((c) => (
                <MenuItem
                  key={c.id}
                  value={c.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e0e0e0",
                    paddingY: 1,
                  }}
                >
                  <span>{c.clientName} </span>
                  <span style={{ color: "gray" }}>{c.id}</span>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Project Name"
              name="projectName"
              value={newProject.projectName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </div>

          {/* Row 3 */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField
              label="Skill"
              name="skill"
              value={newProject.skill}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Project Location"
              name="projectLocation"
              value={newProject.projectLocation}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </div>

          {/* Row 4 */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={newProject.startDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              margin="normal"
            />
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={newProject.endDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              margin="normal"
            />
          </div>

          {/* Row 2 */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField
              label="Project Description"
              name="projectDescription"
              multiline
              rows={2}
              value={newProject.projectDescription}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </div>

          <Divider
            textAlign="center"
            sx={{
              marginY: 2,
              "&::before, &::after": {
                borderColor: "#50a7ffff",
                borderWidth: "2px",
                color: "darkblue",
                fontSize: "20px",
                fontWeight: "bold",
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
              Contact Details
            </Box>
          </Divider>

          {/* Row 5 */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField
              label="SPOC"
              name="spoc"
              value={newProject.spoc}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Mail ID"
              name="mailID"
              type="email"
              value={newProject.mailID}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Mobile No"
              name="mobileNo"
              type="text"
              value={newProject.mobileNo}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </div>

          <Divider
            textAlign="center"
            sx={{
              marginY: 2,
              "&::before, &::after": {
                borderColor: "#50a7ffff",
                borderWidth: "2px",
                color: "darkblue",
                fontSize: "20px",
                fontWeight: "bold",
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
              Billing Details
            </Box>
          </Divider>

          {/* Billing Details */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 2,
              mt: 2,
              pb: 1,
              borderBottom: "1px solid #ddd",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ minWidth: 120, fontWeight: 600, color: "#1976d2" }}
            >
              Billing Details:
            </Typography>

            <TextField
              select
              label="Billing Type"
              name="billingType"
              value={newProject.billingType}
              onChange={handleChange}
              sx={{ minWidth: 180 }}
              margin="normal"
            >
              <MenuItem value="Hour">Hourly</MenuItem>
              <MenuItem value="Day">Day</MenuItem>
              <MenuItem value="Month">Monthly</MenuItem>
            </TextField>

            <TextField
              label="Bill Rate"
              name="billRate"
              type="number"
              value={newProject.billRate}
              onChange={handleChange}
              sx={{ minWidth: 120 }}
              margin="normal"
            />

            <TextField
              label="Monthly Billing"
              name="monthlyBilling"
              type="number"
              value={newProject.monthlyBilling || ""}
              onChange={handleChange}
              sx={{ minWidth: 180 }}
              margin="normal"
            />

            <TextField
              select
              label="Invoice Cycle"
              name="invoiceCycle"
              value={newProject.invoiceCycle || ""}
              onChange={(e) =>
                setNewProject({ ...newProject, invoiceCycle: e.target.value })
              }
              sx={{ minWidth: 180 }}
              margin="normal"
            >
              <MenuItem value="Monthly">Monthly</MenuItem>
              <MenuItem value="Quarterly">Quarterly</MenuItem>
            </TextField>
          </Box>

          {/* Tax & Time */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ minWidth: 120, fontWeight: 600, color: "#1976d2" }}
            >
              Tax & Time Info:
            </Typography>

            {(newProject.billingType === "Hour" ||
              newProject.billingType === "Day") && (
              <TextField
                label={
                  newProject.billingType === "Hour" ? "Total Hours" : "Total Days"
                }
                name="hoursOrDays"
                type="number"
                value={newProject.hoursOrDays || ""}
                onChange={handleChange}
                sx={{ width: 130 }}
                margin="normal"
              />
            )}

            {(newProject.monthlyBilling > 0) && (
              <TextField
                label="GST (%)"
                name="gst"
                type="number"
                value={newProject.gst || ""}
                onChange={(e) => {
                  const gst = parseFloat(e.target.value) || 0;
                  const gstAmount =
                    (newProject.monthlyBilling * gst) / 100;
                  const tdsAmount =
                    (newProject.monthlyBilling *
                      (newProject.tds || 0)) /
                    100;

                  setNewProject({
                    ...newProject,
                    gst,
                    gstAmount,
                    netPayable:
                      newProject.monthlyBilling +
                      gstAmount -
                      tdsAmount,
                  });
                }}
                sx={{ width: 130 }}
                margin="normal"
                disabled={
                  (newProject.billingType === "Hour" &&
                    !newProject.hoursOrDays) ||
                  (newProject.billingType === "Day" &&
                    !newProject.hoursOrDays)
                }
              />
            )}

            {(newProject.monthlyBilling > 0) && (
              <TextField
                label="TDS (%)"
                name="tds"
                type="number"
                value={newProject.tds || ""}
                onChange={(e) => {
                  const tds = parseFloat(e.target.value) || 0;
                  const gstAmount =
                    (newProject.monthlyBilling *
                      (newProject.gst || 0)) /
                    100;
                  const tdsAmount =
                    (newProject.monthlyBilling * tds) / 100;

                  setNewProject({
                    ...newProject,
                    tds,
                    tdsAmount,
                    netPayable:
                      newProject.monthlyBilling +
                      gstAmount -
                      tdsAmount,
                  });
                }}
                sx={{ width: 130 }}
                margin="normal"
                disabled={
                  (newProject.billingType === "Hour" &&
                    !newProject.hoursOrDays) ||
                  (newProject.billingType === "Day" &&
                    !newProject.hoursOrDays)
                }
              />
            )}

            {(newProject.gst || newProject.tds) && (
              <TextField
                label="Net Payable"
                name="netPayable"
                type="number"
                value={newProject.netPayable || ""}
                InputProps={{ readOnly: true }}
                sx={{
                  minWidth: 200,
                  backgroundColor: "#f1f8e9",
                  fontWeight: "bold",
                }}
                margin="normal"
              />
            )}
          </Box>

          <Divider
            textAlign="center"
            sx={{
              marginY: 2,
              "&::before, &::after": {
                borderColor: "#50a7ffff",
                borderWidth: "2px",
                color: "darkblue",
                fontSize: "20px",
                fontWeight: "bold",
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
              Employee & PO Details
            </Box>
          </Divider>

          {/* Row 8 — 🔍 Searchable Employee Selector + PO fields */}
          <div style={{ display: "flex", gap: "1rem" }}>
            {/* 🔍 Searchable Employees with checkbox */}
            <Autocomplete
              multiple
              options={employees}
              disableCloseOnSelect
              getOptionLabel={(option) => option.employee_name}
              value={employees.filter((emp) =>
                (newProject.employees || []).includes(emp.employee_id)
              )}
              onChange={(event, value) => {
                const selectedIDs = value.map((v) => v.employee_id);
                const employeeDetails = value.map((v) => ({
                  id: v.employee_id,
                  name: v.employee_name,
                }));

                setNewProject({
                  ...newProject,
                  employees: selectedIDs,
                  employeeDetails,
                });
              }}
              renderOption={(props, option, { selected }) => (
                <li
                  {...props}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <Checkbox checked={selected} sx={{ mr: 1 }} />
                  <span>{option.employee_name}</span>
                  <span style={{ marginLeft: "auto", color: "gray" }}>
                    {option.employee_id}
                  </span>
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    label={option.employee_name}
                    sx={{ backgroundColor: "#e0f7fa" }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Employees"
                  placeholder="Search employees..."
                  fullWidth
                  margin="normal"
                />
              )}
             sx={{ width: 400 }} 
            />

            <TextField
              label="PO Number"
              name="poNumber"
              value={newProject.poNumber}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Purchase Order Value"
              name="purchaseOrderValue"
              type="text"
              value={newProject.purchaseOrderValue}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Active"
              name="active"
              value={newProject.active || "No"}
              onChange={(e) =>
                setNewProject({ ...newProject, active: e.target.value })
              }
              fullWidth
              margin="normal"
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </div>

          {/* File upload + preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {newProject.purchaseOrderPreview && (
              <div style={{ marginTop: "10px" }}>
                {newProject.purchaseOrder.type?.startsWith("image/") ? (
                  <img
                    src={newProject.purchaseOrderPreview}
                    alt="Purchase Order Preview"
                    style={{ maxWidth: "200px", borderRadius: "8px" }}
                  />
                ) : (
                  <a
                    href={newProject.purchaseOrderPreview}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {newProject.purchaseOrder.name}
                  </a>
                )}
              </div>
            )}

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2 }}
            >
              Upload Purchase Order
              <input
                type="file"
                hidden
                name="purchaseOrder"
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setNewProject({
                      ...newProject,
                      purchaseOrder: file,
                      purchaseOrderPreview: URL.createObjectURL(file),
                    });
                  }
                }}
              />
            </Button>
          </div>
        </DialogContent>

        <DialogActions>
          <Button color="warning" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="success">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Projects;
