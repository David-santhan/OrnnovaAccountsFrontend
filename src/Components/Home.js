
import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Drawer,
  Modal,
  ListItemIcon,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  MenuItem,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import StorageIcon from "@mui/icons-material/Storage";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import Reports from "./Reports";
import AccountsSection from "./AccountsSection";
import Expenses from "./Expenses";
import Projects from "./Projects";
import Employees from "./Employees";
import Salaries from "./Salaries";
import Invoice from "./Invoice";
import ForcastingDashboard from "./ForcastingDashboard";

import axios from "axios";

const menuItems = [
  { text: "Home", icon: <HomeIcon /> },
  { text: "Accounts", icon: <AccountBalanceIcon /> },
  { text: "Clients", icon: <PeopleIcon /> },
  { text: "Projects", icon: <StorageIcon /> },
  { text: "Employees", icon: <GroupsIcon /> },
  { text: "Invoice", icon: <RequestQuoteIcon /> },
  { text: "Salaries", icon: <AccountBalanceWalletIcon /> },
  { text: "Expenses", icon: <ReceiptIcon /> },
  { text: "Forcasting", icon: <QueryStatsIcon /> },
  { text: "Reports", icon: <BarChartIcon /> },
  { text: "Settings", icon: <SettingsIcon /> },
];

function Home() {
  // Default to Home so the landing page shows right after login
  const [selected, setSelected] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(""); // what user types
  const [searchTerm, setSearchTerm] = useState(""); // applied search term
  const [clients, setClients] = useState([]);
  const [adding, setAdding] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientEditing, setIsClientEditing] = useState(false);
  const [clientFormValues, setClientFormValues] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const filteredClients = clients.filter((client) =>
    client.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [newClient, setNewClient] = useState({});

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box sx={{ width: 220 }}>
      <Typography
        variant="h6"
        align="center"
        sx={{ py: 2, borderBottom: "1px solid #ddd", fontWeight: "bold" }}
      >
        Dashboard
      </Typography>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={selected === item.text}
            onClick={() => {
              setSelected(item.text);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  // Clients Table UI
  const renderClients = () => {
    const handleAddClient = async () => {
      if (adding) return; // prevent double click
      setAdding(true);
      try {
        const response = await axios.post(
          "http://localhost:7760/addclients",
          newClient
        );
        setClients([...clients, { ...newClient, id: response.data.id }]);
        setNewClient({
          clientName: "",
          aboutClient: "",
          paymentTerms: "",
          location: "",
          contactSpoc: "",
          contactEmail: "",
          contactNumber: "",
          gstApplicable: "",
          gstNumber: "",
          gstPercentage: "",
        });
        setAddClientOpen(false);
        alert("Client added successfully!");
      } catch (err) {
        console.error(err.response ? err.response.data : err);
        alert("Something went wrong!");
      } finally {
        setAdding(false);
      }
    };

    const loadClients = async () => {
      try {
        const response = await axios.get("http://localhost:7760/getclients");
        setClients(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    const handleDelete = async () => {
      try {
        await axios.delete(
          `http://localhost:7760/deleteclient/${clientToDelete.id}`
        );
        setOpenDeleteDialog(false);
        setClientToDelete(null);
        loadClients(); // refresh client list
        alert("Client deleted successfully"); // show alert on UI
      } catch (err) {
        console.error(err);
        alert("Failed to delete client");
      }
    };

    const handleRowClick = (client) => {
      setSelectedClient(client);
      setClientFormValues(client); // copy client data to form state
      setIsClientEditing(false); // start in preview mode
    };

    const handleClientChange = (field, value) => {
      setClientFormValues({ ...clientFormValues, [field]: value });
    };

    const handleClientSave = async () => {
      try {
        const res = await axios.put(
          `http://localhost:7760/update-client/${clientFormValues.id}`,
          clientFormValues
        );
        if (res.data.success) {
          // Refresh clients
          const refreshed = await axios.get("http://localhost:7760/getclients");
          setClients(refreshed.data);
          setSelectedClient(null);
          alert("✅ Client updated successfully!");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to update client!");
      }
    };

    const handleClientCancel = () => {
      setClientFormValues(selectedClient); // revert changes
      setIsClientEditing(false);
    };

    return (
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            width: "90%",
            mt: 3,
            mb: 5,
            border: "1px solid lightgray",
            borderRadius: 2,
            boxShadow: 1,
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            height: "80vh", // set the container height
          }}
        >
          {/* Top Controls: Sticky */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "white",
              borderBottom: "1px solid lightgray",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Divider
              variant="h2"
              sx={{ fontWeight: "bold", color: "darkblue" }}
            >
              Clients
            </Divider>

            {/* Search Bar */}
           <Box
  sx={{
    width: "50%",
    margin: "auto",
    display: "flex",
    gap: 1,
    justifyContent: "center",
    alignItems: "center", // important to align vertically
  }}
>
  <TextField
    label="Search by Client Name"
    variant="outlined"
    fullWidth
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
  />

  <Button
    variant="contained"
    color={searchInput ? "success" : "primary"}
    onClick={async () => {
      if (searchInput) {
        setSearchTerm(searchInput);
      } else {
        await loadClients();
        setSearchTerm("");
        setSearchInput("");
      }
    }}
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

  {/* Smaller Total Clients text */}
  <Typography
    variant="body2"        // smaller text
    sx={{ fontWeight: "bold", ml: 1, whiteSpace: "nowrap" }}
  >
    Total Number of Clients: {clients.length}
  </Typography>
</Box>

          </Box>

          {/* Table: Scrollable Body */}
          {clients.length > 0 && (
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
                    {["ID", "Name", "SPOC", "Email", "Number", "Action"].map(
                      (header) => (
                        <TableCell key={header} sx={{ fontWeight: "bold" }}>
                          {header}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      hover
                      onClick={() => handleRowClick(client)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{client.id}</TableCell>
                      <TableCell>{client.clientName}</TableCell>
                      <TableCell>{client.contactSpoc}</TableCell>
                      <TableCell>{client.contactEmail}</TableCell>
                      <TableCell>{client.contactNumber}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent row click
                            setClientToDelete(client);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle
            style={{
              fontWeight: "bold",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            Delete Client
          </DialogTitle>{" "}
          <Divider />
          <DialogContent>
            <DialogContentText
              style={{
                textAlign: "center",
                fontFamily: "monospace",
                color: "black",
              }}
            >
              Are you sure you want to delete{" "}
              <strong>{clientToDelete?.clientName}</strong>?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Client */}
        <Dialog
          open={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Client Preview</DialogTitle>

          <DialogContent dividers>
            {clientFormValues && (
              <Stack spacing={2}>
                {/* Row 1 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Client Name"
                    value={clientFormValues.clientName}
                    onChange={(e) =>
                      handleClientChange("clientName", e.target.value)
                    }
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  />
                  <TextField
                    label="About Client"
                    value={clientFormValues.aboutClient}
                    multiline
                    minRows={2}
                    onChange={(e) => handleClientChange("aboutClient", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  />
                </Stack>

                {/* Row 2 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Location"
                    value={clientFormValues.location}
                    onChange={(e) => handleClientChange("location", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  />
                  <TextField
                    label="Contact SPOC"
                    value={clientFormValues.contactSpoc}
                    onChange={(e) => handleClientChange("contactSpoc", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  />
                </Stack>

                {/* Row 3 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Contact Email"
                    type="email"
                    value={clientFormValues.contactEmail}
                    onChange={(e) => handleClientChange("contactEmail", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  />
                  <TextField
                    label="Contact Number"
                    value={clientFormValues.contactNumber}
                    onChange={(e) => handleClientChange("contactNumber", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  />
                </Stack>

                {/* Row 4 (GST Info) */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    select
                    label="GST Applicable?"
                    value={clientFormValues.gstApplicable}
                    onChange={(e) => handleClientChange("gstApplicable", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </TextField>
                  <TextField
                    label="GST Number"
                    value={clientFormValues.gstNumber}
                    onChange={(e) => handleClientChange("gstNumber", e.target.value)}
                    fullWidth
                    disabled={!isClientEditing || clientFormValues.gstApplicable !== "Yes"}
                  />
                </Stack>

                {/* Row 5 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="GST %"
                    type="number"
                    value={clientFormValues.gstPercentage}
                    onChange={(e) => handleClientChange("gstPercentage", e.target.value)}
                    fullWidth
                    disabled={!isClientEditing || clientFormValues.gstApplicable !== "Yes"}
                  />
                  <TextField
                    label="Payment Terms (Days)"
                    type="number"
                    value={clientFormValues.paymentTerms}
                    onChange={(e) => handleClientChange("paymentTerms", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !isClientEditing }}
                  />
                </Stack>
              </Stack>
            )}
          </DialogContent>

          <DialogActions>
            {isClientEditing ? (
              <>
                <Button onClick={handleClientCancel}>Cancel</Button>
                <IconButton color="success" onClick={handleClientSave} aria-label="save">
                  <SaveIcon />
                </IconButton>
              </>
            ) : (
              <IconButton color="primary" onClick={() => setIsClientEditing(true)} aria-label="edit">
                <EditIcon />
              </IconButton>
            )}
            <Button variant="outlined" color="error" onClick={() => setSelectedClient(null)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Add Button */}
        <Fab color="primary" aria-label="add" sx={{ position: "fixed", bottom: 30, right: 30 }} onClick={() => setAddClientOpen(true)}>
          <AddIcon />
        </Fab>

        {/* Add Client Modal */}
        <Modal open={addClientOpen} onClose={() => setAddClientOpen(false)} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Paper elevation={6} sx={{ p: 4, width: { xs: "95vw", sm: "80vw", md: "60vw" }, maxHeight: "90vh", overflowY: "auto", borderRadius: 3, background: "linear-gradient(135deg, #f9fafb 0%, #eef2f7 100%)" }}>
            <Typography variant="h5" mb={2} fontWeight="bold" color="primary" textAlign="center">Add New Client</Typography>

            {/* Client Details */}
            <Divider sx={{ mb: 3, fontWeight: "bold" }}>Client Details</Divider>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
              <TextField label="Client Name" value={newClient.clientName} onChange={(e) => setNewClient({ ...newClient, clientName: e.target.value })} fullWidth sx={{ flex: 1 }} />
              <TextField label="About Client" multiline minRows={1} maxRows={6} value={newClient.aboutClient} onChange={(e) => setNewClient({ ...newClient, aboutClient: e.target.value })} fullWidth sx={{ flex: 2 }} />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
              <TextField label="Location" value={newClient.location} onChange={(e) => setNewClient({ ...newClient, location: e.target.value })} fullWidth sx={{ flex: 1 }} />
              <TextField label="Contact SPOC" value={newClient.contactSpoc} onChange={(e) => setNewClient({ ...newClient, contactSpoc: e.target.value })} fullWidth sx={{ flex: 1 }} />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
              <TextField label="Contact Email" type="email" value={newClient.contactEmail} onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })} fullWidth />
              <TextField label="Contact Number" type="text" value={newClient.contactNumber} onChange={(e) => setNewClient({ ...newClient, contactNumber: e.target.value })} fullWidth />
            </Stack>

            {/* GST Info */}
            <Divider sx={{ mb: 3, fontWeight: "bold" }}>Business Info</Divider>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3} sx={{ width: "100%" }}>
              <TextField select label="GST Applicable?" value={newClient.gstApplicable} onChange={(e) => setNewClient({ ...newClient, gstApplicable: e.target.value })} fullWidth>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>

              <TextField label="GST Number" value={newClient.gstNumber} onChange={(e) => setNewClient({ ...newClient, gstNumber: e.target.value })} fullWidth disabled={newClient.gstApplicable !== "Yes"} />

              <TextField label="GST %" type="number" value={newClient.gstPercentage} onChange={(e) => setNewClient({ ...newClient, gstPercentage: e.target.value })} fullWidth disabled={newClient.gstApplicable !== "Yes"} />

              <TextField label="Payment Terms (Days)" type="text" value={newClient.paymentTerms} onChange={(e) => setNewClient({ ...newClient, paymentTerms: e.target.value })} fullWidth />
            </Stack>

            {/* Submit + Cancel Buttons */}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button variant="outlined" color="secondary" size="large" sx={{ px: 4, py: 1.2, borderRadius: 3, textTransform: "none", fontWeight: "bold" }} onClick={() => setAddClientOpen(false)}>Cancel</Button>

              <Button variant="contained" color="primary" size="large" sx={{ px: 4, py: 1.2, borderRadius: 3, textTransform: "none", fontWeight: "bold", boxShadow: "0px 4px 14px rgba(0,0,0,0.2)" }} onClick={handleAddClient}>Add</Button>
            </Box>
          </Paper>
        </Modal>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f3f6f9" }}>
      {/* Top Navbar */}
      <AppBar position="fixed" sx={{ bgcolor: "#c7d2ecff", zIndex: 1201 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { sm: "none" } }} onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">
              <img style={{ width: "180px" }} src="./Images/logo.avif" alt="logo" />
            </Typography>
          </Box>
          <IconButton onClick={() => setProfileModalOpen(true)}>
            <Avatar src="" alt="Profile" />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Paper elevation={4} sx={{ width: 220, display: { xs: "none", sm: "block" }, mt: 8, height: "calc(100vh - 64px)" }}>
        {drawer}
      </Paper>

      {/* Drawer for mobile */}
      <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: 220 } }}>
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, mt: 8, p: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {/* LANDING PAGE: shown by default after login */}
        {selected === "Home" && (
          <Box sx={{ width: "100%", maxWidth: 1000 }}>
            <Paper sx={{ p: 6, borderRadius: 3, textAlign: "center", mb: 3 }}>
              <Typography variant="h4" fontWeight="bold">
                Ornnova Technologies Private Limited
              </Typography>
              <Typography variant="h6" color="textSecondary" sx={{ mt: 1 }}>
                Business Forecast
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Button variant="contained" onClick={() => setSelected("Forcasting")}>
                  Open Forecast Dashboard
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Existing pages (render when selected) */}
        {selected === "Accounts" && <AccountsSection />}
        {selected === "Clients" && renderClients()}
        {selected === "Projects" && <Projects />}
        {selected === "Employees" && <Employees />}
        {selected === "Salaries" && <Salaries />}
        {selected === "Invoice" && <Invoice />}
        {selected === "Forcasting" && <ForcastingDashboard />}
        {selected === "Expenses" && <Expenses />}
        {selected === "Reports" && <Reports />}
      </Box>

      {/* Profile Modal */}
      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper sx={{ p: 4, borderRadius: 2, width: 300 }}>
          <Typography style={{ fontWeight: "bold", color: "#0d3b66" }} variant="h6" align="center">
            Profile
          </Typography>
          <hr />
          <Box sx={{ display: "flex", flexDirection: "column", mt: 2 }}>
            <Typography>Name: John Doe</Typography>
            <Typography>Email: john.doe@example.com</Typography>
            <Button variant="contained" sx={{ mt: 2, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }} onClick={() => setProfileModalOpen(false)}>
              Close
            </Button>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
}

export default Home;
