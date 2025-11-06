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
  IconButton,Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from '@mui/icons-material/Search';
import { Alert } from "@mui/material";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';




function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
   const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [allProjects,setAllProjects]=useState([]);
  const [employees,setEmployees]=useState([]);
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
  setFormValues({ ...formValues, [field]: value });
  setIsDirty(true); // enable Save button when something changes
};
const handleDeleteClick = (project) => {
  setProjectToDelete(project);
  setOpenDeleteDialog(true);
};


const handleSave = async () => {
  try {
    const formData = new FormData();

    // Append all form fields
    Object.keys(formValues).forEach((key) => {
      if (key === "purchaseOrder" && formValues.purchaseOrder instanceof File) {
        formData.append("purchaseOrder", formValues.purchaseOrder);
      } else {
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
      // Refresh projects from DB
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
    employeeID: "",
    employeeName: "",
    poNumber: "NA",
    purchaseOrder: null,
    purchaseOrderValue: "NA",
    active:"Yes",
    invoiceCycle:"Monthly",
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

 const handleSearch = () => {
  if (!searchInput.trim()) {
    setProjects(allProjects);
    return;
  }

  const filtered = allProjects.filter(
    (p) =>
      p.projectName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      p.employeeName?.toLowerCase().includes(searchInput.toLowerCase())
  );
  setProjects(filtered);
  setSearchTerm(searchInput);
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

  if (name === "purchaseOrder") {
    updatedProject[name] = files[0];
  } else {
    updatedProject[name] = value;
  }

  // Recalculate monthlyBilling when billingType or billRate changes
  if (name === "billingType" || name === "billRate") {
    const billRate = parseFloat(
      name === "billRate" ? value : updatedProject.billRate
    ) || 0;

    let monthlyBilling = 0;
    switch (updatedProject.billingType) {
      case "Hour":
        monthlyBilling = 160 * billRate;
        break;
      case "Day":
        monthlyBilling = 20 * billRate;
        break;
      case "Month":
        monthlyBilling = 1 * billRate;
        break;
      default:
        monthlyBilling = 0;
    }
    updatedProject.monthlyBilling = monthlyBilling;
  }

  setNewProject(updatedProject);
};


  // Handle form submit
// const handleSubmit = async () => {
//     try {
//       const formData = new FormData();
//       Object.keys(newProject).forEach((key) => {
//         formData.append(key, newProject[key]);
//       });

//       const response = await fetch("http://localhost:7760/addproject", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) throw new Error("Failed to add project");

//       const saved = await response.json();
//       setProjects([...projects, saved]);
//       setOpen(false);
//       setSuccessMessage("✅ Project added successfully!");

//       // Auto-hide success message after 3 seconds
//       setTimeout(() => setSuccessMessage(""), 3000);
//     } catch (error) {
//       console.error("Error adding project:", error);
//       setSuccessMessage("❌ Failed to add project");
//     }
//   };

const handleSubmit = async () => {
  try {
    const formData = new FormData();
    Object.keys(newProject).forEach((key) => {
      formData.append(key, newProject[key]);
    });

    const response = await fetch("http://localhost:7760/addproject", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to add project");

    // ✅ Wait for backend confirmation
    await response.json();

    // ✅ Re-fetch latest projects immediately after add
    const refreshed = await fetch("http://localhost:7760/getprojects").then((r) => r.json());
    setAllProjects(refreshed);
    setProjects(refreshed);
    setLoaded(true);

    setOpen(false);
    setSuccessMessage("✅ Project added successfully!");
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
    setProjects(projects.filter(p => p.projectID !== projectID));
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
    width: "900px",              // ✅ 90% of viewport width
    mx: "auto",                 // ✅ centers the box
    mt: 3,
    mb: 5,
    border: "1px solid lightgray",
    borderRadius: 2,
    boxShadow: 1,
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    height: "80vh",             // still controls vertical height
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

          <Divider variant="h2" sx={{fontWeight:"bold",color:"darkblue",marginTop:"10px"}}>Projects</Divider>  

      {/* Top Controls: Sticky */}
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
      label="Search by Project Name \ Employee Name"
      variant="outlined"
      fullWidth
      value={searchInput}
      sx={{ marginTop: 1}}
      onChange={(e) => setSearchInput(e.target.value)}
    />

    {/* Single conditional button */}
    <Button
      variant="contained"
      color={searchInput ? "success" : "primary"}
      onClick={searchInput ? handleSearch : handleLoadProjects} // conditional action
      sx={{
        borderRadius: searchInput ? "50%" : 1, // circular if search, normal if load
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
          : "rgba(106, 106, 232, 1)", // blue for Load Projects
      }}
    >
      {searchInput ? <SearchIcon /> : "Load"} {/* conditional content */}
    </Button>
  </Box>
</Box>


      {/* Table: Scrollable Body */}
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
              {["Project ID", "Project Name", "Client","Employee Name", "Billing Type", "PO File","Active","Action"].map((header) => (
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

                                <TableCell>{p.employeeName}</TableCell>
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
  <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteClick(p); }}>
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
<Dialog
  open={openDeleteDialog}
  onClose={() => setOpenDeleteDialog(false)}
>
  <DialogTitle style={{fontWeight:"bold",fontFamily:"monospace",textAlign:"center"}}>Confirm Delete</DialogTitle> <Divider/>
  <DialogContent style={{fontFamily:"monospace",textAlign:"center"}}>
    Are you sure you want to delete project "<strong>{projectToDelete?.projectName}</strong>"?
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
    <Button
      color="error"
      onClick={() => deleteProject(projectToDelete.projectID)}
    >
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
      {/* Row 1 */}
      <div style={{ display: "flex", gap: "1rem" }}>
        {/* Client (Non-editable) */}
<TextField
  select
  label="Client"
  name="clientID"
  value={formValues.clientID || ""}
  fullWidth
  margin="normal"
  InputProps={{ readOnly: true }} // makes it read-only
>
  {clients.map((c) => (
    <MenuItem key={c.id} value={c.id}>
      {c.clientName} - {c.id}
    </MenuItem>
  ))}
</TextField>

{/* Project Name (Non-editable) */}
<TextField
  label="Project Name"
  name="projectName"
  value={formValues.projectName || ""}
  fullWidth
  margin="normal"
  InputProps={{ readOnly: true }} // makes it read-only
/>

      </div>

    

      {/* Row 3 */}
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
          onChange={(e) => handleEditChange("projectLocation", e.target.value)}
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
  {/* Row 2 */}
      <TextField
        label="Project Description"
        name="projectDescription"
        multiline
        rows={2}
        value={formValues.projectDescription || ""}
        onChange={(e) => handleEditChange("projectDescription", e.target.value)}
        fullWidth
        margin="normal"
      />
      {/* Row 5 */}
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

      {/* Row 6 */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <TextField
          select
          label="Billing Type"
          name="billingType"
          value={formValues.billingType || ""}
          onChange={(e) => handleEditChange("billingType", e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Hour">Hour</MenuItem>
          <MenuItem value="Day">Day</MenuItem>
          <MenuItem value="Month">Month</MenuItem>
        </TextField>

        <TextField
          label="Bill Rate"
          name="billRate"
          type="text"
          value={formValues.billRate || ""}
          onChange={(e) => handleEditChange("billRate", e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Monthly Billing"
          name="monthlyBilling"
          type="number"
          value={formValues.monthlyBilling || ""}
          onChange={(e) => handleEditChange("monthlyBilling", e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{ readOnly: true }}
        />
        <TextField
  select
  label="Invoice Cycle"
  name="invoiceCycle"
  value={formValues.invoiceCycle || ""}
  onChange={(e) => handleEditChange("invoiceCycle", e.target.value)}
  fullWidth
  margin="normal"
>
  <MenuItem value="Monthly">Monthly</MenuItem>
  <MenuItem value="Quarterly">Quarterly</MenuItem>
</TextField>

      </div>

      {/* Row 7 */}
      <div style={{ display: "flex", gap: "1rem" }}>
       <TextField
  select
  label="Employee"
  name="employeeID"
  value={formValues.employeeID || ""}
  onChange={(e) => {
    const selected = employees.find(
      (emp) => emp.employee_id === e.target.value
    );

    if (selected) {
      // update both employeeID and employeeName
      setFormValues((prev) => ({
        ...prev,
        employeeID: selected.employee_id,
        employeeName: selected.employee_name,
      }));
      setIsDirty(true); // make sure Save button shows up
    }
  }}
  fullWidth
  margin="normal"
>
  {employees.map((emp) => (
    <MenuItem key={emp.employee_id} value={emp.employee_id}>
      {emp.employee_id} - {emp.employee_name}
    </MenuItem>
  ))}
</TextField>

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
          onChange={(e) => handleEditChange("purchaseOrderValue", e.target.value)}
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

      {/* Row 8 (File Upload + Preview) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
  {/* Current PO link if it's a string (from backend) */}
  {formValues.purchaseOrder && typeof formValues.purchaseOrder === "string" && (
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

  <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
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
          setIsDirty(true); // so Save button shows up
        }
      }}
    />
  </Button>

  {/* Preview if it's a File object */}
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
          setFormValues(selectedProject); // reset to original
          setIsDirty(false);
        }}
        color="secondary"
        variant="outlined"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        color="primary"
        variant="contained"
      >
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
  <DialogTitle style={{fontWeight:"bold"}}>Add New Project</DialogTitle>
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
      borderBottom: "1px solid #e0e0e0", // line between items
      paddingY: 1, // optional vertical padding
    }}
  >
    <span>{c.clientName} </span>
    <span style={{color:"gray"}}>{c.id}</span>
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

    {/* Row 6 */}
    <div style={{ display: "flex", gap: "1rem" }}>
     
     <TextField
  select
  label="Billing Type"
  name="billingType"
  value={newProject.billingType}
  onChange={handleChange}
  fullWidth
  margin="normal"
>
  <MenuItem value="Hour">Hour</MenuItem>
  <MenuItem value="Day">Day</MenuItem>
  <MenuItem value="Month">Month</MenuItem>
</TextField>

<TextField
  label="Bill Rate"
  name="billRate"
  type="text"
  value={newProject.billRate}
  onChange={handleChange}
  fullWidth
  margin="normal"
/>

<TextField
  label="Monthly Billing"
  name="monthlyBilling"
  type="number"
  value={newProject.monthlyBilling}
  onChange={handleChange}
  fullWidth
  margin="normal"
  InputProps={{ readOnly: true }} // make it auto-calculated
/>
  <TextField
    select
    label="Invoice Cycle"
    name="invoiceCycle"
    value={newProject.invoiceCycle || ""}
    onChange={(e) =>
      setNewProject({ ...newProject, invoiceCycle: e.target.value })
    }
    fullWidth
    margin="normal"
  >
    <MenuItem value="Monthly">Monthly</MenuItem>
    <MenuItem value="Quarterly">Quarterly</MenuItem>
  </TextField>

    </div>

    {/* Row 7 */}
    <div style={{ display: "flex", gap: "1rem" }}>
     <TextField
  select
  label="Employee"
  name="employee"
  value={newProject.employeeID || ""}
  onChange={(e) => {
    const selected = employees.find(emp => emp.employee_id === e.target.value);
    setNewProject({
      ...newProject,
      employeeID: selected.employee_id,
      employeeName: selected.employee_name,
    });
  }}
  fullWidth
  margin="normal"
>
  {employees.map((emp, index) => (
    <MenuItem
      key={emp.employee_id}
      value={emp.employee_id}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: index !== employees.length - 1 ? "1px solid #e0e0e0" : "none",
        paddingY: 1,
      }}
    >
      <span>{emp.employee_name}</span>
      <span style={{ color: "gray" }}>{emp.employee_id}</span>
    </MenuItem>
  ))}
</TextField>



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
  value={newProject.active || "No"}  // default No if empty
  onChange={(e) => setNewProject({ ...newProject, active: e.target.value })}
  fullWidth
  margin="normal"
>
  <MenuItem value="Yes">Yes</MenuItem>
  <MenuItem value="No">No</MenuItem>
</TextField>

    </div>

    {/* Row 8 */}
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      
        {/* Preview */}
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
        handleChange(e); // your existing handler
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
    <Button onClick={() => setOpen(false)}>Cancel</Button>
    <Button onClick={handleSubmit} variant="contained" color="primary">
      Save
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}

export default Projects;
