import React, { useEffect, useState } from "react";
import {
  Table, TableHead, TableBody, TableCell, TableRow,
  TableContainer, Paper, Fab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, MenuItem,
  Divider, Box, Alert, Snackbar, IconButton, Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from '@mui/icons-material/Search';
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

function Employees() {
  const [employees, setEmployees] = useState([]); // displayed (filtered) list
  const [allEmployees, setAllEmployees] = useState([]); // master list from server
  const [loaded, setLoaded] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [openDialog, setOpenDialog] = useState(false); // Add Employee Dialog
  const [openEmployee, setOpenEmployee] = useState(false); // Employee Details Dialog
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openImageModal, setOpenImageModal] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false); // Snackbar control
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [excelFile, setExcelFile] = useState(null);


  const [newEmployee, setNewEmployee] = useState({
    employee_id: "",
    employee_name: "",
    email: "",
    phone_number: "",
    ctc: "",
    skills: "",
    salary_paid: "No",
    billable: "Yes",
    consultant_regular: "Regular",
    active: "Yes",
    project_ending: "No",
    resume: null,
    photo: null,
    date_of_joining: ""
  });

  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Sync formData with selected employee
  useEffect(() => {
    if (selectedEmp) {
      setFormData(selectedEmp);
      setResumeFile(null);
      setPhotoFile(null);
    } else {
      setFormData({});
    }
  }, [selectedEmp]);

  // --- Updated mount: restore sessionStorage if present, otherwise fetch master list ---
  useEffect(() => {
    // Clear last search result when opening the Employee dashboard
sessionStorage.removeItem("employeesLoaded");
setSearchName("");  // also clear the search box

    const saved = sessionStorage.getItem("employeesLoaded");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEmployees(parsed);
        setLoaded(true);
        // ensure master copy is at least the same as displayed (so searches work)
        setAllEmployees((prev) => (prev && prev.length ? prev : parsed));
        // still fetch fresh master list in background to keep data up to date
        fetchEmployees();
      } catch (e) {
        // if parse fails, just fetch from server
        fetchEmployees();
      }
    } else {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- fetchEmployees now returns the fetched data so callers can await it ---
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:7760/getemployees");
      const data = res.data || [];
      setAllEmployees(data);
      // If previously loaded, refresh displayed list too
      if (loaded) {
        setEmployees(data);
        sessionStorage.setItem("employeesLoaded", JSON.stringify(data));
      }
      return data;
    } catch (err) {
      console.error("Error fetching employees:", err);
      return [];
    }
  };

  const handleLoadEmployees = () => {
  setEmployees(allEmployees);
  setLoaded(true);

  // CLEAR previous selection / form data so modal won't show stale search results
  setSelectedEmp(null);
  setFormData({});
  setIsEditing(false);

  // clear saved search result so refreshes don't restore the old filtered list
  sessionStorage.removeItem("employeesLoaded");

  // (optional) clear the search input so button returns to "Load Employees"
  setSearchName("");
};


  // --- Updated handleSearch: will fetch master list if empty and then filter ---
  const handleSearch = async () => {
    // ensure we have master data
    let master = allEmployees;
    if (!master || master.length === 0) {
      master = await fetchEmployees();
    }

    const query = (searchName || "").trim().toLowerCase();

    if (!query) {
      // If empty query, show full list
      setEmployees(master);
      sessionStorage.setItem("employeesLoaded", JSON.stringify(master));
      setLoaded(true);
      return;
    }

    const filtered = master.filter(emp =>
      (emp.employee_name || "").toLowerCase().includes(query)
    );

    setEmployees(filtered);
    sessionStorage.setItem("employeesLoaded", JSON.stringify(filtered));
    setLoaded(true); // optional but keeps UI consistent (so table shows)
  };
  const handleExcelUpload = async () => {
  if (!excelFile) {
    setAlertMessage("Please select an Excel file");
    setAlertSeverity("error");
    setAlertOpen(true);
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", excelFile);

    await axios.post(
      "http://localhost:7760/upload-employees-excel",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    // refresh data
    const refreshed = await axios.get("http://localhost:7760/getemployees");
    setAllEmployees(refreshed.data || []);
    setEmployees(refreshed.data || []);
    setLoaded(true);

    setExcelFile(null);

    setAlertMessage("Employees imported successfully");
    setAlertSeverity("success");
    setAlertOpen(true);
  } catch (err) {
    console.error(err);
    setAlertMessage("Excel upload failed");
    setAlertSeverity("error");
    setAlertOpen(true);
  }
};


// const handleRowClick = (emp) => {
//   if (loaded) {
//     // MODE: loaded → open modal empty
//     setSelectedEmp(null);   // ensure selectedEmp is cleared
//     setFormData({});        // ensure formData is cleared (prevents stale display)
//     setIsEditing(false);
//     setOpenEmployee(true);
//   } else {
//     // MODE: not-loaded (search-before-load) → open modal with clicked emp details
//     setSelectedEmp(emp);
//     setFormData(emp);       // set immediately so modal shows data
//     setIsEditing(false);
//     setOpenEmployee(true);
//   }
// };
const handleRowClick = (emp) => {
  setSelectedEmp(emp);     // ✅ always set selected employee
  setFormData(emp);        // ✅ always populate form
  setIsEditing(false);
  setOpenEmployee(true);
};
  const handleCloseModal = () => {
    setOpenEmployee(false);
    setSelectedEmp(null);
    setIsEditing(false);
  };

  const handleOpenImage = (img) => {
    setSelectedImage(img);
    setOpenImageModal(true);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
    setOpenImageModal(false);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (field, file) => {
    if (field === "resume") setResumeFile(file);
    if (field === "photo") setPhotoFile(file);
  };

  // Save (update) employee
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Append all fields except files
      Object.keys(formData).forEach((key) => {
        if (key !== "resume" && key !== "photo") {
          formDataToSend.append(key, formData[key] ?? "");
        }
      });

      // Append files if selected
      if (resumeFile) formDataToSend.append("resume", resumeFile);
      if (photoFile) formDataToSend.append("photo", photoFile);

      await fetch(`http://localhost:7760/employees/${formData.id}`, {
        method: "PUT",
        body: formDataToSend,
      });

      // Re-fetch employees to reflect updated data and update counts
      await fetchEmployees();

      setIsEditing(false);
      // update selected employee in UI to newest record
      const updated = (await axios.get("http://localhost:7760/getemployees")).data
        .find(emp => emp.id === formData.id);
      setSelectedEmp(updated || null);

      setAlertMessage("Employee updated");
      setAlertSeverity("success");
      setAlertOpen(true);
    } catch (err) {
      console.error("Error updating employee:", err);
      setAlertMessage("Failed to update employee");
      setAlertSeverity("error");
      setAlertOpen(true);
    }
  };


  // Add employee
  const handleAddEmployee = async () => {
    try {
      const formDataToSend = new FormData();
      Object.keys(newEmployee).forEach((key) =>
        formDataToSend.append(key, newEmployee[key])
      );

      const response = await axios.post(
        "http://localhost:7760/postemployees",
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Re-fetch employees and update displayed/total counts
      const refreshed = await axios.get("http://localhost:7760/getemployees");
      setAllEmployees(refreshed.data || []);
      setEmployees(refreshed.data || []);
      setLoaded(true);

      // Show success
      setAlertMessage("Employee added successfully!");
      setAlertSeverity("success");
      setAlertOpen(true);

      setOpenDialog(false);
      // Reset form
      setNewEmployee({
        employee_id: "",
        employee_name: "",
        email: "",
        phone_number: "",
        skills: "",
        ctc: "",
        salary_paid: "No",
        billable: "Yes",
        consultant_regular: "Regular",
        active: "Yes",
        project_ending: "No",
        resume: null,
        photo: null,
        date_of_joining: "",
      });
    } catch (err) {
      console.error("Error adding employee:", err);
      setAlertMessage("Failed to add employee. Please try again.");
      setAlertSeverity("error");
      setAlertOpen(true);
    }
  };

  // Delete employee (from dialog action)
  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      await axios.delete(`http://localhost:7760/employees/${employeeToDelete.id}`);
      // Remove from both lists (so UI & counts update)
      const newAll = allEmployees.filter(emp => emp.id !== employeeToDelete.id);
      setAllEmployees(newAll);
      const newDisplayed = employees.filter(emp => emp.id !== employeeToDelete.id);
      setEmployees(newDisplayed);
      setOpenDeleteDialog(false);
      setEmployeeToDelete(null);

      setAlertMessage("Employee deleted");
      setAlertSeverity("success");
      setAlertOpen(true);
    } catch (err) {
      console.error("Failed to delete employee:", err);
      setAlertMessage("Failed to delete");
      setAlertSeverity("error");
      setAlertOpen(true);
    }
  };

  

  // small helpers for counts
  const totalCount = allEmployees.length;
  const showingCount = employees.length;

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ height: "80vh", display: "flex", flexDirection: "column", width: "900px" }}>
        {/* Top Controls - sticky */}
        <div
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            zIndex: 10,
            padding: "10px",
            borderBottom: "1px solid #ccc",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "98%",
          }}
        >
        {/* Excel Upload */}
<input
  type="file"
  accept=".xlsx,.xls"
  style={{ display: "none" }}
  id="excel-upload"
  onChange={(e) => setExcelFile(e.target.files[0])}
/>

<label htmlFor="excel-upload">
  <Button variant="outlined" component="span">
    Select Excel
  </Button>
</label>

<Button
  variant="contained"
  color="success"
  onClick={handleExcelUpload}
  disabled={!excelFile}
>
  Upload Excel
</Button>

          <TextField
            label="Search by Name"
            value={searchName}
            style={{ width: "300px" }}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // on Enter run search (if text) or load all
                searchName ? handleSearch() : handleLoadEmployees();
              }
            }}
          />
          <Button
            style={{ fontWeight: "bold", backgroundColor: "rgba(106, 106, 232, 1)" }}
            variant="contained"
            onClick={searchName ? handleSearch : handleLoadEmployees}
          >
            {searchName ? <SearchIcon /> : "Load Employees"}
          </Button>

          {/* COUNTS DISPLAY */}
          <Box sx={{ marginLeft: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing <strong>{showingCount}</strong> of <strong>{totalCount}</strong> employees
            </Typography>
          </Box>
        </div>

        {/* Table container */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", width: "100%" }}>
          <TableContainer component={Paper}>
            <Table stickyHeader aria-label="employees table">
              <TableHead style={{ backgroundColor: "whitesmoke" }}>
                <TableRow>
                  <TableCell style={{ fontWeight: "bold" }}>Emp ID</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Emp Name</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Email</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Phone Number</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Active</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loaded ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Click "Load Employees" to display data
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp, index) => (
                    <TableRow
                      key={emp.id ?? index}
                      hover
                      style={{ cursor: "pointer" }}
                      onClick={() => handleRowClick(emp)}
                    >
                      <TableCell>{emp.employee_id}</TableCell>
                      <TableCell>{emp.employee_name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.phone_number}</TableCell>
                      <TableCell style={{ fontWeight: "bold" }} className={emp.active === "Yes" ? "blink-green" : "blink-red"}>
                        {emp.active}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            setEmployeeToDelete(emp);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ textAlign: "center", fontWeight: "bold", fontFamily: "monospace" }}>Delete Employee</DialogTitle>
        <Divider />
        <DialogContent style={{ textAlign: "center", fontFamily: "monospace" }}>
          Are you sure you want to delete <strong>{employeeToDelete?.employee_name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteEmployee} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Employee Details Modal */}
      <Dialog open={openEmployee} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>Employee Details</DialogTitle>
        <DialogContent dividers>
          {formData && (
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Row 1 */}
              <Box display="flex" gap={2}>
                <Box flex={1}>
                  <TextField
                    label="Emp ID"
                    fullWidth
                    value={formData.employee_id || ""}
                    InputProps={{ readOnly: !isEditing }}
                    onChange={(e) => handleChange("employee_id", e.target.value)}
                  />
                </Box>
                <Box flex={1}>
                  <TextField
                    label="Name"
                    fullWidth
                    value={formData.employee_name || ""}
                    InputProps={{ readOnly: !isEditing }}
                    onChange={(e) => handleChange("employee_name", e.target.value)}
                  />
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <Box flex={1}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={formData.email || ""}
                    InputProps={{ readOnly: !isEditing }}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </Box>
                <Box flex={1}>
                  <TextField
                    label="Phone"
                    fullWidth
                    value={formData.phone_number || ""}
                    InputProps={{ readOnly: !isEditing }}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                  />
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <Box flex={1}>
                  <TextField
                    label="Salary (CTC)"
                    type="number"
                    fullWidth
                    value={formData.ctc || ""}
                    InputProps={{ readOnly: !isEditing }}
                    onChange={(e) => handleChange("ctc", e.target.value)}
                  />
                </Box>
                <Box flex={1}>
                  <TextField
                    label="Skills"
                    fullWidth
                    value={formData.skills || ""}
                    InputProps={{ readOnly: !isEditing }}
                    onChange={(e) => handleChange("skills", e.target.value)}
                  />
                </Box>
              </Box>

              {/* Dropdowns and dates */}
              <Box display="flex" gap={2}>
                <Box flex={1}>
                  <TextField
                    label="Date of Join"
                    type="date"
                    fullWidth
                    value={formData.date_of_joining || ""}
                    onChange={(e) => handleChange("date_of_joining", e.target.value)}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Box flex={1}>
                  <TextField
                    label="Billable"
                    select
                    fullWidth
                    value={formData.billable || "Yes"}
                    onChange={(e) => handleChange("billable", e.target.value)}
                    disabled={!isEditing}
                  >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <Box flex={1}>
                  <TextField
                    label="Consultant / Regular"
                    select
                    fullWidth
                    value={formData.consultant_regular || "Consultant"}
                    onChange={(e) => handleChange("consultant_regular", e.target.value)}
                    disabled={!isEditing}
                  >
                    <MenuItem value="Consultant">Consultant</MenuItem>
                    <MenuItem value="Regular">Regular</MenuItem>
                  </TextField>
                </Box>
                <Box flex={1}>
                  <TextField
                    label="Active"
                    select
                    fullWidth
                    value={formData.active || "Yes"}
                    onChange={(e) => handleChange("active", e.target.value)}
                    disabled={!isEditing}
                  >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <Box flex={1}>
                  <TextField
                    label="Project Ending"
                    type="date"
                    fullWidth
                    value={formData.project_ending || ""}
                    onChange={(e) => handleChange("project_ending", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!isEditing}
                  />
                </Box>

                <Box flex={1}>
                  {isEditing ? (
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange("resume", e.target.files[0])}
                    />
                  ) : formData.resume ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(`http://localhost:7760/${formData.resume}`, "_blank")}
                    >
                      View Resume
                    </Button>
                  ) : (
                    "No Resume"
                  )}
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <Box flex={1}>
                  {isEditing ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          handleFileChange("photo", file);
                          if (file) {
                            setFormData((prev) => ({ ...prev, photoPreview: URL.createObjectURL(file) }));
                          }
                        }}
                      />
                      {formData.photoPreview && (
                        <img src={formData.photoPreview} alt="Preview" style={{ width: "100%", maxWidth: "150px", height: "100px", borderRadius: "8px", objectFit: "cover", marginTop: "8px" }} />
                      )}
                    </>
                  ) : formData.photo ? (
                    <img src={`http://localhost:7760/${formData.photo}`} alt="Employee" style={{ width: "100%", maxWidth: "150px", height: "100px", borderRadius: "8px", objectFit: "cover" }} />
                  ) : (
                    "No Photo"
                  )}
                </Box>

                <Box flex={1}></Box> {/* empty for spacing */}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {isEditing ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={() => { setFormData(selectedEmp); setIsEditing(false); }}>
                Cancel
              </Button>
              <IconButton color="success" onClick={handleSave} aria-label="save">
                <SaveIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton color="primary" onClick={() => setIsEditing(true)} aria-label="edit">
                <EditIcon />
              </IconButton>
              <Button variant="outlined" color="error" onClick={handleCloseModal}>Close</Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={alertOpen} autoHideDuration={2500} onClose={() => setAlertOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setAlertOpen(false)} severity={alertSeverity} variant="filled" sx={{ width: "100%" }}>
          {alertMessage}
        </Alert>
      </Snackbar>

      {/* Add Employee Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontWeight: "bold" }}>Add New Employee</DialogTitle>
        <DialogContent dividers>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {[
              { label: "Employee ID", key: "employee_id" },
              { label: "Employee Name", key: "employee_name" },
              { label: "Email Address", key: "email", type: "email" },
              { label: "Phone Number", key: "phone_number" },
              { label: "Salary (CTC)", key: "ctc" },
              { label: "Skills", key: "skills" },
              { label: "Date of Joining", key: "date_of_joining", type: "date" },
            ].map((field) => (
              <div key={field.key} style={{ flex: "1 1 45%" }}>
                <TextField
                  fullWidth
                  margin="dense"
                  label={field.label}
                  type={field.type || "text"}
                  value={newEmployee[field.key]}
                  onChange={(e) => setNewEmployee({ ...newEmployee, [field.key]: e.target.value })}
                  InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                />
              </div>
            ))}

            {[
              { label: "Billable?", key: "billable", options: ["Yes", "No"] },
              { label: "Consultant / Regular", key: "consultant_regular", options: ["Consultant", "Regular"] },
              { label: "Active", key: "active", options: ["Yes", "No"] },
              { label: "Project Ending", key: "project_ending", options: ["Yes", "No"] },
            ].map((field) => (
              <div key={field.key} style={{ flex: "1 1 45%" }}>
                <TextField select fullWidth margin="dense" label={field.label} value={newEmployee[field.key]} onChange={(e) => setNewEmployee({ ...newEmployee, [field.key]: e.target.value })}>
                  {field.options.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </div>
            ))}

            {/* Resume Upload */}
            <div style={{ flex: "1 1 45%", marginTop: "15px" }}>
              <input type="file" id="resume-upload" style={{ display: "none" }} onChange={(e) => setNewEmployee({ ...newEmployee, resume: e.target.files[0] })} />
              <label htmlFor="resume-upload">
                <Button variant="outlined" component="span" fullWidth>Upload Resume</Button>
              </label>
              {newEmployee.resume && <span style={{ display: "block", marginTop: "8px" }}>{newEmployee.resume.name}</span>}
            </div>

            {/* Photo Upload */}
            <div style={{ flex: "1 1 45%", marginTop: "15px" }}>
              <input type="file" id="photo-upload" accept="image/*" style={{ display: "none" }} onChange={(e) => setNewEmployee({ ...newEmployee, photo: e.target.files[0] })} />
              <label htmlFor="photo-upload">
                <Button variant="outlined" component="span" fullWidth>Upload Photo</Button>
              </label>
              {newEmployee.photo && <img src={URL.createObjectURL(newEmployee.photo)} alt="Preview" style={{ marginTop: "8px", width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddEmployee} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab color="primary" aria-label="add" style={{ position: "fixed", bottom: "20px", right: "20px" }} onClick={() => setOpenDialog(true)}>
        <AddIcon />
      </Fab>

      {/* Image Preview Modal */}
      <Dialog open={openImageModal} onClose={handleCloseImage} maxWidth="sm" fullWidth>
        <DialogContent>
          {selectedImage && <img src={`http://localhost:7760/${selectedImage}`} alt="Full View" style={{ width: "100%", height: "auto", borderRadius: "10px" }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Employees;
