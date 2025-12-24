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
  TableContainer,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Checkbox,
  IconButton,
  Divider,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
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
  //const [formValues, setFormValues] = useState(selectedProject || {});
  const [isDirty, setIsDirty] = useState(false); // false until any field changes
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Employee picker modal states
  const [openEmpModal, setOpenEmpModal] = useState(false);
  const [empModalSearch, setEmpModalSearch] = useState("");
  const [empModalSelected, setEmpModalSelected] = useState([]); // local selection in modal (array of {id,name})
  const [empModalContext, setEmpModalContext] = useState("add"); // "add" or "edit"


const recalcMilestone = (m) => {
  const base = Number(m.baseValue) || 0;
  const gstP = Number(m.gstPercent) || 0;
  const tdsP = Number(m.tdsPercent) || 0;

  const gstAmount = (base * gstP) / 100;
  const tdsAmount = (base * tdsP) / 100;

  return {
    ...m,
    gstAmount,
    tdsAmount,
    netPayable: base + gstAmount - tdsAmount,
  };
};
const addMilestone = () => {
  setCurrentProject((prev) => ({
    ...prev,
    milestones: [
      ...(prev.milestones || []),
      recalcMilestone({
        name: `Milestone ${(prev.milestones?.length || 0) + 1}`,
        baseValue: "",
        gstPercent: 18,
        tdsPercent: 10,
        gstAmount: 0,
        tdsAmount: 0,
        netPayable: 0,
        invoiceMonth: "",
      }),
    ],
  }));

  setIsDirty(true);
};

const updateMilestone = (index, field, value) => {
  setCurrentProject((prev) => {
    const updated = [...prev.milestones];
    updated[index] = recalcMilestone({
      ...updated[index],
      [field]: value,
    });
    return { ...prev, milestones: updated };
  });

  setIsDirty(true);
};

// initial new project template
const initialNewProject = {
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
  employees: [],
  employeeDetails: [],
  hoursOrDays: 0,
  poNumber: "NA",
  purchaseOrder: null,
  purchaseOrderPreview: null,
  purchaseOrderValue: "NA",
  active: "Yes",
  invoiceCycle: "Monthly",
  gst: 0,
  tds: 0,
  netPayable: 0,
  isFixed: "No",
  startMonth: "",
  milestones: [],
};

// ✅ newProject MUST come before currentProject
const [newProject, setNewProject] = useState(initialNewProject);

// existing
const [formValues, setFormValues] = useState(null);
// 🔁 Single source for Add & Edit
const currentProject = isEditing ? formValues : newProject;
const setCurrentProject = isEditing ? setFormValues : setNewProject;

  // Sync when project changes
 useEffect(() => {
  if (!selectedProject) return;

  setFormValues({
    ...selectedProject,
    isFixed: selectedProject.isFixed || "No",
    milestones: selectedProject.milestones || [],
    startMonth: selectedProject.startMonth || "",
  });
}, [selectedProject]);

 const handleEditChange = (field, value) => {
  // ✅ FIXED PROJECT: do not recalc billing
  if (formValues.isFixed === "Yes") {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    return;
  }

  let updatedForm = { ...formValues, [field]: value };

  const billRate = parseFloat(updatedForm.billRate) || 0;
  const hoursOrDays = parseFloat(updatedForm.hoursOrDays) || 0;

  if (["billingType", "billRate", "hoursOrDays"].includes(field)) {
    let monthlyBilling = 0;

    switch (updatedForm.billingType) {
      case "Hour":
      case "Day":
        monthlyBilling = billRate * hoursOrDays;
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
  setIsDirty(true);
};


  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setOpenDeleteDialog(true);
  };

  // ➕ Add milestone in EDIT mode
const addEditMilestone = () => {
  setFormValues((prev) => ({
    ...prev,
    milestones: [
      ...(prev.milestones || []),
      {
        name: `Milestone ${(prev.milestones?.length || 0) + 1}`,
        baseValue: "",
        gstPercent: 18,
        tdsPercent: 10,
        gstAmount: 0,
        tdsAmount: 0,
        netPayable: 0,
        invoiceMonth: "",
      },
    ],
  }));
  setIsDirty(true);
};

// 🔹 Update milestone in EDIT mode (Project Preview)
const updateEditMilestone = (index, field, value) => {
  setFormValues((prev) => {
    const updated = [...(prev.milestones || [])];

    const base =
      Number(field === "baseValue" ? value : updated[index].baseValue) || 0;
    const gstP =
      Number(field === "gstPercent" ? value : updated[index].gstPercent) || 0;
    const tdsP =
      Number(field === "tdsPercent" ? value : updated[index].tdsPercent) || 0;

    const gstAmount = (base * gstP) / 100;
    const tdsAmount = (base * tdsP) / 100;

    updated[index] = {
      ...updated[index],
      [field]: value,
      gstAmount,
      tdsAmount,
      netPayable: base + gstAmount - tdsAmount,
    };

    return { ...prev, milestones: updated };
  });

  setIsDirty(true);
};

  const handleSave = async () => {
  try {
    const formData = new FormData();

    // Append all fields safely
    Object.keys(formValues).forEach((key) => {
      if (key === "purchaseOrder" && formValues.purchaseOrder instanceof File) {
        formData.append("purchaseOrder", formValues.purchaseOrder);

      } 
      // ✅ ADD THIS BLOCK (milestones support)
      else if (key === "milestones") {
        formData.append(
          "milestones",
          JSON.stringify(formValues.milestones || [])
        );
      }
      // ✅ existing logic (unchanged)
      else if (key === "employees") {
        formData.append(
          "employees",
          JSON.stringify(formValues.employees || [])
        );
      } 
      else {
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

useEffect(() => {
    fetch("http://localhost:7760/getprojects")
      .then((res) => res.json())
      .then((data) => {
        setAllProjects(Array.isArray(data) ? data : []);
        console.log(data)
      })
      
      .catch((err) => console.error(err));
      

    fetch("http://localhost:7760/getclients")
      .then((res) => res.json())
      .then((data) => setClients(data || []))
      .catch((err) => console.error(err));

    fetch("http://localhost:7760/getAvailableEmployees")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
        else setEmployees([]);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      });
  }, []);

  // -------------------- FILTER + SORT EMPLOYEES FOR ADD PROJECT DIALOG --------------------
  const assignedEmployeeIds = React.useMemo(() => {
    const ids = new Set();
    if (!Array.isArray(allProjects)) return ids;

    for (const p of allProjects) {
      if (!p) continue;
      if (Array.isArray(p.employees)) {
        p.employees.forEach((e) => {
          if (typeof e === "object") ids.add(String(e.id ?? e.employee_id ?? e.employeeID ?? ""));
          else ids.add(String(e));
        });
      } else if (typeof p.employees === "string" && p.employees.trim()) {
        // attempt parse
        try {
          const arr = JSON.parse(p.employees);
          if (Array.isArray(arr)) {
            arr.forEach((e) => {
              if (typeof e === "object") ids.add(String(e.id ?? e.employee_id ?? ""));
              else ids.add(String(e));
            });
          }
        } catch (err) {
          // ignore
        }
      }
    }
    return ids;
  }, [allProjects]);

  const availableEmployees = React.useMemo(() => {
    if (!Array.isArray(employees)) return [];
    return employees
      .filter((emp) => !assignedEmployeeIds.has(String(emp.employee_id ?? emp.id ?? "")))
      .slice()
      .sort((a, b) =>
        (a.employee_name || "").toString().localeCompare((b.employee_name || "").toString())
      );
  }, [employees, assignedEmployeeIds]);

  /**
   * modalEmployees:
   * - For "add": use availableEmployees (unassigned)
   * - For "edit": include the currently selected project's employees (so they don't disappear when unchecking)
   *   and then include the rest of availableEmployees (deduped). This allows unselecting to put the employee
   *   back into the visible list.
   */
  const modalEmployees = React.useMemo(() => {
    if (empModalContext === "add") return availableEmployees;

    const selectedFromState = Array.isArray(empModalSelected) && empModalSelected.length
      ? empModalSelected
      : Array.isArray(formValues.employeeDetails)
      ? formValues.employeeDetails
      : [];

    const selectedIds = new Set(selectedFromState.map((e) => String(e.id)));

    const selectedEmpsNormalized = selectedFromState.map((e) => ({
      employee_id: String(e.id),
      employee_name: e.name,
    }));

    const merged = [
      ...selectedEmpsNormalized,
      ...employees
        .filter((emp) => {
          const idStr = String(emp.employee_id ?? emp.id ?? "");
          const isAssignedToThisProject =
            Array.isArray(formValues.employeeDetails) &&
            formValues.employeeDetails.some((ed) => String(ed.id) === idStr);

          const isAssignedGlobally = assignedEmployeeIds.has(idStr);
          return !selectedIds.has(idStr) && (!isAssignedGlobally || isAssignedToThisProject);
        })
        .map((emp) => ({ employee_id: String(emp.employee_id ?? emp.id ?? ""), employee_name: emp.employee_name })),
    ];

    const seen = new Set();
    const deduped = [];
    for (const e of merged) {
      const idStr = String(e.employee_id);
      if (seen.has(idStr)) continue;
      seen.add(idStr);
      deduped.push(e);
    }

    deduped.sort((a, b) => (a.employee_name || "").toString().localeCompare((b.employee_name || "").toString()));
    return deduped;
  }, [empModalContext, availableEmployees, formValues, empModalSelected, employees, assignedEmployeeIds]);

  // Load projects into visible table (used by 'Load' button).
  const handleLoadProjects = () => {
    // Reset any search input and show all projects
    setSearchInput("");
    setSearchTerm("");
    setProjects(allProjects || []);
    setLoaded(true);
  };

  // -------------------- Enhanced handleSearch: projectName | clientName | employeeName --------------------
  const handleSearch = (maybeQuery) => {
    try {
      let query = maybeQuery;
      if (query && typeof query === "object" && "target" in query) {
        query = query.target.value;
      }
      query = query == null ? "" : String(query);
      const q = query.trim().toLowerCase();

      // if empty search -> if we've loaded already show all, else do nothing (keep table hidden).
      if (!q) {
        setSearchInput("");
        setSearchTerm("");
        if (loaded) {
          setProjects(allProjects);
        }
        return;
      }

      // Always run search against the canonical allProjects list so previous filters don't pollute results.
      const source = Array.isArray(allProjects) ? allProjects : [];

      const filtered = source.filter((p) => {
        if (!p) return false;

        // Project name
        const projectName = (p.projectName || p.project_name || "").toString().toLowerCase();
        if (projectName.includes(q)) return true;

        // Client name: try clients list first, fallback to fields on project
        let clientName = "";
        try {
          const clientObj = clients.find((c) => String(c.id) === String(p.clientID) || String(c.id) === String(p.client_id));
          if (clientObj && clientObj.clientName) clientName = clientObj.clientName.toString().toLowerCase();
          else clientName = (p.clientName || p.client_name || "").toString().toLowerCase();
        } catch (err) {
          clientName = (p.clientName || p.client_name || "").toString().toLowerCase();
        }
        if (clientName && clientName.includes(q)) return true;

        // Employee names - robust to multiple shapes
        let employeeNamesArr = [];

        // 1) p.employeeDetails -> [{id,name}]
        if (Array.isArray(p.employeeDetails) && p.employeeDetails.length > 0) {
          employeeNamesArr = p.employeeDetails.map((e) => (e?.name || e?.employee_name || "").toString().toLowerCase());
        } else if (Array.isArray(p.employees) && p.employees.length > 0) {
          // 2) p.employees could be array of objects or ids
          if (typeof p.employees[0] === "object") {
            // array of objects with name fields
            employeeNamesArr = p.employees.map((e) => (e?.name || e?.employee_name || e?.employeeName || "").toString().toLowerCase());
          } else {
            // array of IDs -> lookup in 'employees' master list
            employeeNamesArr = p.employees
              .map((id) => {
                try {
                  const idStr = String(id);
                  const emp = employees.find((ee) => String(ee.employee_id) === idStr || String(ee.id) === idStr);
                  return emp ? (emp.employee_name || emp.name || "").toString().toLowerCase() : "";
                } catch (err) {
                  return "";
                }
              })
              .filter(Boolean);
          }
        } else if (typeof p.employees === "string" && p.employees.trim()) {
          // maybe a JSON string -> parse
          try {
            const arr = JSON.parse(p.employees);
            if (Array.isArray(arr) && arr.length > 0) {
              if (typeof arr[0] === "object") {
                employeeNamesArr = arr.map((e) => (e?.name || e?.employee_name || "").toString().toLowerCase());
              } else {
                employeeNamesArr = arr
                  .map((id) => {
                    const idStr = String(id);
                    const emp = employees.find((ee) => String(ee.employee_id) === idStr || String(ee.id) === idStr);
                    return emp ? (emp.employee_name || emp.name || "").toString().toLowerCase() : "";
                  })
                  .filter(Boolean);
              }
            }
          } catch (err) {
            // not JSON: try direct string fields
            const s = (p.employeeName || p.employee_name || p.employees || "").toString().toLowerCase();
            if (s) employeeNamesArr = [s];
          }
        } else {
          // fallback single string fields
          const s = (p.employeeName || p.employee_name || "").toString().toLowerCase();
          if (s) employeeNamesArr = [s];
        }

        const employeeNamesJoined = employeeNamesArr.join(" ");
        if (employeeNamesJoined.includes(q)) return true;

        // if none matched
        return false;
      });

      // When user searches, we want the table to appear with results right away.
      setProjects(filtered);
      setSearchInput(query);
      setSearchTerm(query);
      setLoaded(true); // ensure table becomes visible after search
    } catch (err) {
      console.error("handleSearch error:", err);
      setProjects(allProjects);
    }
  };

  const handleRowClick = (project) => {
    // Defensive normalize employees to: employees: [ids], employeeDetails: [{id,name}]
    const normalized = { ...project };

    // If employees field is present
    try {
      if (Array.isArray(project.employees) && project.employees.length > 0) {
        // if it's array of objects with id/name -> map
        if (typeof project.employees[0] === "object") {
          normalized.employees = project.employees.map((e) => String(e.id ?? e.employee_id));
          normalized.employeeDetails = project.employees.map((e) => ({
            id: String(e.id ?? e.employee_id),
            name: e.name ?? e.employee_name ?? "",
          }));
        } else {
          // array of IDs -> try to look up names from employees list
          normalized.employees = project.employees.map((id) => String(id));
          normalized.employeeDetails = project.employees.map((id) => {
            const emp = employees.find((e) => String(e.employee_id) === String(id));
            return { id: String(id), name: emp ? emp.employee_name : String(id) };
          });
        }
      } else if (Array.isArray(project.employeeDetails) && project.employeeDetails.length > 0) {
        // backend gives employeeDetails explicitly
        normalized.employees = project.employeeDetails.map((e) => String(e.id));
        normalized.employeeDetails = project.employeeDetails.map((e) => ({ id: String(e.id), name: e.name ?? e.employee_name ?? "" }));
      } else {
        // fallback empty
        normalized.employees = [];
        normalized.employeeDetails = [];
      }
    } catch (err) {
      normalized.employees = [];
      normalized.employeeDetails = [];
    }

    setSelectedProject(normalized);
    setFormValues(normalized);
    setIsEditing(false);
    setIsDirty(false);
    setOpenPreview(true);
  };
const handleClose = () => {
    setSelectedProject(null);
    setOpenPreview(false);
    setIsEditing(false);
    setIsDirty(false);
  };

  // Employee modal handlers
  const openEmployeeModal = (context = "add") => {
    setEmpModalContext(context);
    setEmpModalSearch("");

    if (context === "add") {
      setEmpModalSelected(Array.isArray(newProject.employeeDetails) ? newProject.employeeDetails.map(e => ({ id: String(e.id), name: e.name })) : []);
    } else {
      // edit context -> use formValues (preview)
      setEmpModalSelected(Array.isArray(formValues.employeeDetails) ? formValues.employeeDetails.map(e => ({ id: String(e.id), name: e.name })) : []);
    }

    setOpenEmpModal(true);
  };

  const closeEmployeeModal = () => {
    setOpenEmpModal(false);
  };

  const toggleEmpSelection = (empObj) => {
    const id = empObj.employee_id ?? empObj.id;
    const exists = empModalSelected.some((e) => String(e.id) === String(id));
    if (exists) {
      setEmpModalSelected((prev) => prev.filter((e) => String(e.id) !== String(id)));
    } else {
      setEmpModalSelected((prev) => [...prev, { id: id, name: empObj.employee_name ?? empObj.name }]);
    }
  };

  const confirmEmpSelection = () => {
    const ids = empModalSelected.map((e) => e.id);

    if (empModalContext === "add") {
      setNewProject((prev) => ({
        ...prev,
        employees: ids,
        employeeDetails: empModalSelected,
      }));
    } else {
      // edit context -> write into formValues (preview editing)
      setFormValues((prev) => ({
        ...prev,
        employees: ids,
        employeeDetails: empModalSelected,
      }));
      setIsDirty(true);
    }

    setOpenEmpModal(false);
  };

  // Handle changes in Add form
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let updatedProject = { ...newProject };

    if (name === "purchaseOrder") {
      updatedProject[name] = files[0];
    } else {
      updatedProject[name] = value;
    }

    const billRate = parseFloat(updatedProject.billRate) || 0;
    const hoursOrDays = parseFloat(updatedProject.hoursOrDays) || 0;

    if (["billingType", "billRate", "hoursOrDays"].includes(name)) {
      let monthlyBilling = 0;
      switch (updatedProject.billingType) {
        case "Hour":
          monthlyBilling = billRate * (hoursOrDays || 240);
          break;
        case "Day":
          monthlyBilling = billRate * (hoursOrDays || 30);
          break;
        case "Month":
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
    formData.append("employees", JSON.stringify(newProject.employees || []));
  } 
  else if (key === "milestones") {
    if (newProject.isFixed === "Yes") {
      formData.append("milestones", JSON.stringify(newProject.milestones || []));
    }
  } 
  else {
    formData.append(key, newProject[key] ?? "");
  }
});
const response = await fetch("http://localhost:7760/addproject", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to add project");

      const saved = await response.json();

      // Optimistic update
      setProjects((prev) => [...(prev || []), saved]);
      setAllProjects((prev) => [...(prev || []), saved]);
      setLoaded(true);

      // Re-fetch all to get canonical object
      try {
        const refreshed = await fetch("http://localhost:7760/getprojects").then((r) => r.json());
        setAllProjects(refreshed);
        setProjects(refreshed);

        const full = Array.isArray(refreshed) ? refreshed.find((p) => p.projectID === saved.projectID) : saved;
        if (full) {
          setSelectedProject(full);
          setFormValues(full);
        } else {
          setSelectedProject(saved);
          setFormValues(saved);
        }
      } catch (err) {
        console.error("Failed to fetch full project after save:", err);
        setSelectedProject(saved);
        setFormValues(saved);
      }

      if (newProject.purchaseOrderPreview && newProject.purchaseOrder instanceof File) {
        URL.revokeObjectURL(newProject.purchaseOrderPreview);
      }
      setNewProject(initialNewProject);
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

    // ✅ remove from visible list
    setProjects((prev) => prev.filter((p) => p.projectID !== projectID));

    // ✅ remove from master list
    setAllProjects((prev) => prev.filter((p) => p.projectID !== projectID));

    setOpenDeleteDialog(false);
    setProjectToDelete(null);
  } catch (error) {
    console.error("Delete failed:", error);
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
          <Alert severity={successMessage.startsWith("✅") ? "success" : "error"} sx={{ mb: 2 }}>
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
              label="Search by Project / Client / Employee"
              variant="outlined"
              fullWidth
              value={searchInput}
              placeholder="Type project, client or employee name..."
              sx={{ marginTop: 1 }}
              onChange={(e) => {
                const value = e.target.value;
                setSearchInput(value);
                handleSearch(value);
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
              onClick={searchInput ? () => handleSearch(searchInput) : handleLoadProjects}
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
                backgroundColor: searchInput ? undefined : "rgba(106, 106, 232, 1)",
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
                  <TableRow key={idx} hover sx={{ cursor: "pointer" }} onClick={() => handleRowClick(p)}>
                    <TableCell>{p.projectID}</TableCell>
                    <TableCell>{p.projectName}</TableCell>

                    <TableCell>
                      {(() => {
                        const client = clients.find((c) => String(c.id) === String(p.clientID) || String(c.id) === String(p.client_id));
                        return client ? `${client.clientName} - ${client.id}` : (p.clientName || p.client_name || p.clientID || "—");
                      })()}
                    </TableCell>

                    {/* Employee Column (robust to objects or ids) */}
                    <TableCell>
                      {(() => {
                        if (!p.employees && !p.employeeDetails && !p.employeeName && !p.employee_name) return "—";

                        // prioritize employeeDetails
                        if (Array.isArray(p.employeeDetails) && p.employeeDetails.length > 0) {
                          return p.employeeDetails.map((e) => e.name || e.employee_name).join(", ");
                        }

                        if (Array.isArray(p.employees) && p.employees.length > 0) {
                          if (typeof p.employees[0] === "object") {
                            return p.employees.map((e) => e.name || e.employee_name).join(", ");
                          } else {
                            // array of ids -> lookup
                            const names = p.employees.map((id) => {
                              const emp = employees.find((e) => String(e.employee_id) === String(id) || String(e.id) === String(id));
                              return emp ? emp.employee_name || emp.name : id;
                            });
                            return names.join(", ");
                          }
                        }

                        if (typeof p.employees === "string" && p.employees.trim()) {
                          try {
                            const arr = JSON.parse(p.employees);
                            if (Array.isArray(arr) && arr.length > 0) {
                              if (typeof arr[0] === "object") return arr.map((e) => e.name || e.employee_name).join(", ");
                              else return arr.map((id) => {
                                const emp = employees.find((e) => String(e.employee_id) === String(id) || String(e.id) === String(id));
                                return emp ? emp.employee_name || emp.name : id;
                              }).join(", ");
                            }
                          } catch (err) {
                            // not JSON
                          }
                        }

                        return p.employeeName || p.employee_name || "—";
                      })()}
                    </TableCell>

                    <TableCell>{p.billingType}</TableCell>

                    <TableCell>
                      {p.purchaseOrder ? (
                        <a href={`http://localhost:7760/uploads/${p.purchaseOrder}`} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      ) : (
                        "No File"
                      )}
                    </TableCell>

                    <TableCell style={{ textAlign: "center" }}>
                      {p.active === "Yes" ? <span className="blink-green">Yes</span> : <span className="blink-red">No</span>}
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
        <DialogTitle style={{ fontWeight: "bold", fontFamily: "monospace", textAlign: "center" }}>
          Confirm Delete
        </DialogTitle>
        <Divider />
        <DialogContent style={{ fontFamily: "monospace", textAlign: "center" }}>
          Are you sure you want to delete project "<strong>{projectToDelete?.projectName}</strong>"?
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
        <DialogTitle sx={{ fontWeight: "bold", fontSize: 18 }}>Project Preview</DialogTitle>
        {successMessage && <Alert severity={successMessage.startsWith("✅") ? "success" : "error"} sx={{ mb: 2 }}>{successMessage}</Alert>}
        <DialogContent dividers>
          {formValues && (
            <>
              {/* Preview content (kept as before) */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <TextField select label="Client" name="clientID" value={formValues.clientID || ""} fullWidth margin="normal" InputProps={{ readOnly: true }}>
                  {clients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.clientName} - {c.id}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Project Name" name="projectName" value={formValues.projectName || ""} fullWidth margin="normal" InputProps={{ readOnly: true }} />
              </div>

              {/* Many fields kept same as earlier */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <TextField label="Skill" name="skill" value={formValues.skill || ""} onChange={(e) => handleEditChange("skill", e.target.value)} fullWidth margin="normal" />
                <TextField label="Project Location" name="projectLocation" value={formValues.projectLocation || ""} onChange={(e) => handleEditChange("projectLocation", e.target.value)} fullWidth margin="normal" />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
               <TextField
  type="date"
  label="Project Start Date"
  name="startDate"
  value={formValues.startDate || ""}

  onChange={(e) => {
    const date = e.target.value;

    setNewProject({
      ...newProject,
      startDate: date,
      // ✅ auto-fill month if Fixed
      startMonth:
        newProject.isFixed === "Yes" && date
          ? date.slice(0, 7)
          : newProject.startMonth,
    });
  }}
  fullWidth
  margin="normal"
  InputLabelProps={{ shrink: true }}
/>

                <TextField label="End Date" type="date" name="endDate" value={formValues.endDate || ""} onChange={(e) => handleEditChange("endDate", e.target.value)} InputLabelProps={{ shrink: true }} fullWidth margin="normal" />
              </div>

              <TextField label="Project Description" name="projectDescription" multiline rows={2} value={formValues.projectDescription || ""} onChange={(e) => handleEditChange("projectDescription", e.target.value)} fullWidth margin="normal" />

              <Divider textAlign="center" sx={{ marginY: 2, "&::before, &::after": { borderColor: "#50a7ffff", borderWidth: "2px", color: "darkblue", fontSize: "20px", fontWeight: "bold" } }}>
                <Box sx={{ backgroundColor: "#1976d2", color: "white", px: 3, py: 0.5, borderRadius: "6px", display: "inline-block", fontWeight: "bold", letterSpacing: "0.5px", boxShadow: "0 2px 6px rgba(25, 118, 210, 0.3)" }}>
                  Contact Details
                </Box>
              </Divider>

              <div style={{ display: "flex", gap: "1rem" }}>
                <TextField label="SPOC" name="spoc" value={formValues.spoc || ""} onChange={(e) => handleEditChange("spoc", e.target.value)} fullWidth margin="normal" />
                <TextField label="Mail ID" name="mailID" type="email" value={formValues.mailID || ""} onChange={(e) => handleEditChange("mailID", e.target.value)} fullWidth margin="normal" />
                <TextField label="Mobile No" name="mobileNo" type="text" value={formValues.mobileNo || ""} onChange={(e) => handleEditChange("mobileNo", e.target.value)} fullWidth margin="normal" />
              </div>
{(
  formValues.isFixed !== "Yes" ||
  (formValues.isFixed === "Yes" && (!formValues.milestones || formValues.milestones.length === 0))
) && (
  <Divider
    textAlign="center"
    sx={{
      marginY: 2,
      "&::before, &::after": {
        borderColor: "#50a7ffff",
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
      Billing Details
    </Box>
  </Divider>
)}

{/* 🔹 MILESTONES SECTION */}
{formValues.isFixed === "Yes" && (
  <>
    <Divider
      textAlign="center"
      sx={{
        my: 3,
        "&::before, &::after": {
          borderColor: "#50a7ffff",
          borderWidth: 2,
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
          fontWeight: "bold",
        }}
      >
        Milestones
      </Box>
    </Divider>

    {formValues.milestones.map((m, index) => (
      <Box
        key={index}
        sx={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
          gap: 1,
          mb: 2,
        }}
      >
        <TextField
          value={m.name}
          onChange={(e) =>
            updateEditMilestone(index, "name", e.target.value)
          }
          InputProps={{ readOnly: !isEditing }}
        />

        <TextField
          value={m.baseValue}
          onChange={(e) =>
            updateEditMilestone(index, "baseValue", e.target.value)
          }
          InputProps={{ readOnly: !isEditing }}
        />

        <TextField
          value={m.gstPercent}
          onChange={(e) =>
            updateEditMilestone(index, "gstPercent", e.target.value)
          }
          InputProps={{ readOnly: !isEditing }}
        />

        <TextField
          value={m.tdsPercent}
          onChange={(e) =>
            updateEditMilestone(index, "tdsPercent", e.target.value)
          }
          InputProps={{ readOnly: !isEditing }}
        />

        <TextField value={m.netPayable} InputProps={{ readOnly: true }} />

        <TextField
          type="month"
          value={m.invoiceMonth}
          onChange={(e) =>
            updateEditMilestone(index, "invoiceMonth", e.target.value)
          }
          InputProps={{ readOnly: !isEditing }}
        />
      </Box>
    ))}

    {isEditing && (
      <Button variant="outlined" onClick={addEditMilestone}>
        + Add Milestone
      </Button>
    )}
  </>
)}

{formValues.isFixed !== "Yes" && (
  <>
    {/* Billing */}
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
        type="number"
        value={formValues.billRate || ""}
        onChange={(e) =>
          handleEditChange("billRate", e.target.value)
        }
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

      {formValues.monthlyBilling > 0 && (
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
        />
      )}

      {formValues.monthlyBilling > 0 && (
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
  </>
)}

              <Divider textAlign="center" sx={{ marginY: 2, "&::before, &::after": { borderColor: "#50a7ffff", borderWidth: "2px", color: "darkblue", fontSize: "20px", fontWeight: "bold" } }}>
                <Box sx={{ backgroundColor: "#1976d2", color: "white", px: 3, py: 0.5, borderRadius: "6px", display: "inline-block", fontWeight: "bold", letterSpacing: "0.5px", boxShadow: "0 2px 6px rgba(25, 118, 210, 0.3)" }}>
                  Employee & PO Details
                </Box>
              </Divider>

              {/* Employee & PO in Preview */}
              <div style={{ display: "flex", gap: "1rem" }}>
                {/* If in editing mode show a clickable TextField (opens modal) to pick employees.
                    Otherwise show a read-only Select with chips (no menu). */}
                {isEditing ? (
                  <TextField
                    label="Employees"
                    value={(formValues.employeeDetails || []).map((e) => e.name).join(", ")}
                    placeholder="Click to choose employees..."
                    onClick={() => openEmployeeModal("edit")}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                ) : (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Employees</InputLabel>
                    <Select
                      multiple
                      displayEmpty
                      // keep Select value as array of ids strings
                      value={
                        Array.isArray(formValues.employees)
                          ? formValues.employees.map(e => String((e && e.id) ? e.id : e))
                          : []
                      }
                      renderValue={(selected) => {
                        if (!selected || selected.length === 0) return <em>—</em>;
                        return (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, p: 0.5 }}>
                            {selected.map((id) => {
                              const idStr = String(id);
                              const emp =
                                employees.find(e => String(e.employee_id) === idStr) ||
                                (formValues.employeeDetails || []).find(ed => String(ed.id) === idStr);
                              const label = emp ? (emp.employee_name ?? emp.name ?? idStr) : idStr;
                              return <Chip key={idStr} label={label} size="small" sx={{ backgroundColor: "#e0f7fa" }} />;
                            })}
                          </Box>
                        );
                      }}
                      sx={{ minHeight: "56px" }}
                      open={false}
                    >
                      {/* no menu items needed for read-only preview */}
                    </Select>
                  </FormControl>
                )}

                <TextField label="PO Number" name="poNumber" value={formValues.poNumber || ""} onChange={(e) => handleEditChange("poNumber", e.target.value)} fullWidth margin="normal" />
                <TextField label="Purchase Order Value" name="purchaseOrderValue" type="text" value={formValues.purchaseOrderValue || ""} onChange={(e) => handleEditChange("purchaseOrderValue", e.target.value)} fullWidth margin="normal" />
                <TextField select label="Active" name="active" value={formValues.active || "No"} onChange={(e) => handleEditChange("active", e.target.value)} fullWidth margin="normal">
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {formValues.purchaseOrder && typeof formValues.purchaseOrder === "string" && (
                  <div style={{ marginTop: "10px" }}>
                    <a href={`http://localhost:7760/uploads/${formValues.purchaseOrder}`} target="_blank" rel="noopener noreferrer">Current PO File</a>
                  </div>
                )}

                <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
                  Upload Purchase Order
                  <input type="file" hidden name="purchaseOrder" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setFormValues((prev) => ({ ...prev, purchaseOrder: file, purchaseOrderPreview: URL.createObjectURL(file) }));
                      setIsDirty(true);
                    }
                  }} />
                </Button>

                {formValues.purchaseOrderPreview && (
                  <div style={{ marginTop: "10px" }}>
                    {formValues.purchaseOrder instanceof File && formValues.purchaseOrder.type.startsWith("image/") ? (
                      <img src={formValues.purchaseOrderPreview} alt="Purchase Order Preview" style={{ maxWidth: "200px", borderRadius: "8px" }} />
                    ) : (
                      <a href={formValues.purchaseOrderPreview} target="_blank" rel="noopener noreferrer">{formValues.purchaseOrder.name || "Uploaded File"}</a>
                    )}
                  </div>
                )}
              </div>
              
            </>
          )}
        </DialogContent>

        <DialogActions>
          {isEditing ? (
            <>
              <Button onClick={() => { setFormValues(selectedProject); setIsDirty(false); setIsEditing(false); }} color="secondary" variant="outlined">Cancel</Button>
              <Button onClick={handleSave} color="primary" variant="contained">Save</Button>
            </>
          ) : (
            <Button onClick={() => { setIsEditing(true); /* now user can click Employees field to open modal */ }} variant="contained">Edit</Button>
          )}
          <Button onClick={handleClose} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab color="primary" aria-label="add" sx={{ position: "fixed", bottom: 20, right: 20 }} onClick={() => { setNewProject(initialNewProject); setOpen(true); }}>
        <AddIcon />
      </Fab>

      {/* Add Project Dialog (unchanged) */}
      <Dialog open={open} onClose={() => {
        setOpen(false);
        if (newProject.purchaseOrderPreview && newProject.purchaseOrder instanceof File) {
          URL.revokeObjectURL(newProject.purchaseOrderPreview);
        }
        setNewProject(initialNewProject);
      }} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontWeight: "bold" }}>Add New Project</DialogTitle>
        <DialogContent dividers>
          {/* --- Add form content unchanged --- */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField select label="Client" name="clientID" value={newProject.clientID} onChange={handleChange} fullWidth margin="normal">
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id} sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", paddingY: 1 }}>
                  <span>{c.clientName} </span>
                  <span style={{ color: "gray" }}>{c.id}</span>
                </MenuItem>
              ))}
            </TextField>

            <TextField label="Project Name" name="projectName" value={newProject.projectName} onChange={handleChange} fullWidth margin="normal" />
          </div>
  
          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField label="Skill" name="skill" value={newProject.skill} onChange={handleChange} fullWidth margin="normal" />
            <TextField label="Project Location" name="projectLocation" value={newProject.projectLocation} onChange={handleChange} fullWidth margin="normal" />
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField label="Start Date" type="date" name="startDate" value={newProject.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth margin="normal" />
            <TextField label="End Date" type="date" name="endDate" value={newProject.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth margin="normal" />
          </div>
          
          {/* 🔹 Project Type + Start Month */}
<div style={{ display: "flex", gap: "1rem" }}>
  <TextField
    select
    label="Project Type"
    name="isFixed"
    value={newProject.isFixed}
    onChange={(e) =>
      setNewProject({
        ...newProject,
        isFixed: e.target.value,
        startMonth: e.target.value === "Yes" ? newProject.startMonth : "",
        milestones: e.target.value === "No" ? [] : newProject.milestones,
      })
    }
    fullWidth
    margin="normal"
  >
    <MenuItem value="Yes">Fixed</MenuItem>
    <MenuItem value="No">Time & Material</MenuItem>
  </TextField>

  {newProject.isFixed === "Yes" && (
    <TextField
      type="month"
      label="Start Month"
      name="startMonth"
      value={newProject.startMonth || ""}
      onChange={handleChange}
      fullWidth
      margin="normal"
      InputLabelProps={{ shrink: true }}
    />
  )}
</div>

{/* 🔹 MILESTONES (Only for Fixed Projects) */}
{newProject.isFixed === "Yes" && (
  <>
    <Divider sx={{ my: 2 }}>Milestones</Divider>

    {newProject.milestones.map((m, index) => (
      <Box
        key={index}
        sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 1, mb: 2 }}
      >
        <TextField
          label="Milestone Name"
          value={m.name}
          onChange={(e) => updateMilestone(index, "name", e.target.value)}
        />

        <TextField
          label="Base Value"
          type="number"
          value={m.baseValue}
          onChange={(e) => updateMilestone(index, "baseValue", e.target.value)}
        />

        <TextField
          label="GST %"
          type="number"
          value={m.gstPercent}
          onChange={(e) => updateMilestone(index, "gstPercent", e.target.value)}
        />

        <TextField
          label="TDS %"
          type="number"
          value={m.tdsPercent}
          onChange={(e) => updateMilestone(index, "tdsPercent", e.target.value)}
        />

        <TextField
          label="Net Payable"
          value={m.netPayable}
          InputProps={{ readOnly: true }}
          sx={{ backgroundColor: "#e8f5e9" }}
        />

        <TextField
          label="Invoice Month"
          type="month"
          value={m.invoiceMonth}
          onChange={(e) => updateMilestone(index, "invoiceMonth", e.target.value)}
        />
      </Box>
    ))}

    <Button variant="outlined" onClick={addMilestone}>
      + Add Milestone
    </Button>
  </>
)}         
{/* Project Type */}


 <div style={{ display: "flex", gap: "1rem" }}>
            <TextField label="Project Description" name="projectDescription" multiline rows={2} value={newProject.projectDescription} onChange={handleChange} fullWidth margin="normal" />
          </div>


          <Divider textAlign="center" sx={{ marginY: 2, "&::before, &::after": { borderColor: "#50a7ffff", borderWidth: "2px", color: "darkblue", fontSize: "20px", fontWeight: "bold" } }}>
            <Box sx={{ backgroundColor: "#1976d2", color: "white", px: 3, py: 0.5, borderRadius: "6px", display: "inline-block", fontWeight: "bold", letterSpacing: "0.5px", boxShadow: "0 2px 6px rgba(25, 118, 210, 0.3)" }}>
              Contact Details
            </Box>
          </Divider>

          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField label="SPOC" name="spoc" value={newProject.spoc} onChange={handleChange} fullWidth margin="normal" />
            <TextField label="Mail ID" name="mailID" type="email" value={newProject.mailID} onChange={handleChange} fullWidth margin="normal" />
            <TextField label="Mobile No" name="mobileNo" type="text" value={newProject.mobileNo} onChange={handleChange} fullWidth margin="normal" />
          </div>

{newProject.isFixed !== "Yes" && (
  <>
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
            newProject.billingType === "Hour"
              ? "Total Hours"
              : "Total Days"
          }
          name="hoursOrDays"
          type="number"
          value={newProject.hoursOrDays || ""}
          onChange={handleChange}
          sx={{ width: 130 }}
          margin="normal"
        />
      )}

      {newProject.monthlyBilling > 0 && (
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
        />
      )}

      {newProject.monthlyBilling > 0 && (
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
  </>
)}


          <Divider textAlign="center" sx={{ marginY: 2, "&::before, &::after": { borderColor: "#50a7ffff", borderWidth: "2px", color: "darkblue", fontSize: "20px", fontWeight: "bold" } }}>
            <Box sx={{ backgroundColor: "#1976d2", color: "white", px: 3, py: 0.5, borderRadius: "6px", display: "inline-block", fontWeight: "bold", letterSpacing: "0.5px", boxShadow: "0 2px 6px rgba(25, 118, 210, 0.3)" }}>
              Employee & PO Details
            </Box>
          </Divider>

          <div style={{ display: "flex", gap: "1rem" }}>
            <TextField
              label="Employees"
              value={(newProject.employeeDetails || []).map((e) => e.name).join(", ")}
              placeholder="Click to choose employees..."
              onClick={() => openEmployeeModal("add")}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
              sx={{ width: 600 }}
            />

            <TextField label="PO Number" name="poNumber" value={newProject.poNumber} onChange={handleChange} fullWidth margin="normal" />
            <TextField label="Purchase Order Value" name="purchaseOrderValue" type="text" value={newProject.purchaseOrderValue} onChange={handleChange} fullWidth margin="normal" />
            <TextField select label="Active" name="active" value={newProject.active || "No"} onChange={(e) => setNewProject({ ...newProject, active: e.target.value })} fullWidth margin="normal">
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {newProject.purchaseOrderPreview && (
              <div style={{ marginTop: "10px" }}>
                {newProject.purchaseOrder?.type?.startsWith("image/") ? (
                  <img src={newProject.purchaseOrderPreview} alt="Purchase Order Preview" style={{ maxWidth: "200px", borderRadius: "8px" }} />
                ) : (
                  <a href={newProject.purchaseOrderPreview} target="_blank" rel="noopener noreferrer">{newProject.purchaseOrder?.name || "Uploaded File"}</a>
                )}
              </div>
            )}

            <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
              Upload Purchase Order
              <input type="file" hidden name="purchaseOrder" onChange={(e) => {
                handleChange(e);
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setNewProject({ ...newProject, purchaseOrder: file, purchaseOrderPreview: URL.createObjectURL(file) });
                }
              }} />
            </Button>
          </div>
        </DialogContent>

        <DialogActions>
          <Button color="warning" onClick={() => {
            setOpen(false);
            if (newProject.purchaseOrderPreview && newProject.purchaseOrder instanceof File) {
              URL.revokeObjectURL(newProject.purchaseOrderPreview);
            }
            setNewProject(initialNewProject);
          }}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} variant="contained" color="success">Save</Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- Employee Picker Modal ---------------- */}
      <Dialog open={openEmpModal} onClose={closeEmployeeModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>Select Employees</DialogTitle>
        <DialogContent dividers>
          <TextField label="Search employees" fullWidth margin="dense" value={empModalSearch} onChange={(e) => setEmpModalSearch(e.target.value)} placeholder="Type name to filter..." />

          <div style={{ maxHeight: "50vh", overflowY: "auto", marginTop: 8 }}>
            {modalEmployees
              .filter((emp) => {
                const q = (empModalSearch || "").trim().toLowerCase();
                if (!q) return true;
                return (emp.employee_name || "").toLowerCase().includes(q) || String(emp.employee_id || "").toLowerCase().includes(q);
              })
              .map((emp) => {
                const id = emp.employee_id ?? emp.id;
                const checked = empModalSelected.some((e) => String(e.id) === String(id));
                return (
                  <div key={id} onClick={() => toggleEmpSelection(emp)} style={{ display: "flex", alignItems: "center", padding: "12px 8px", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}>
                    <Checkbox checked={checked} />
                    <div style={{ display: "flex", flexDirection: "column", marginLeft: 8 }}>
                      <div style={{ fontWeight: 600 }}>{emp.employee_name}</div>
                      <div style={{ color: "gray", fontSize: 12 }}>{id}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEmployeeModal}>Cancel</Button>
          <Button onClick={confirmEmpSelection} variant="contained" color="primary">Confirm ({empModalSelected.length})</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Projects;
