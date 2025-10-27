import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  MenuItem,
  TableContainer,TableRow,Paper,Table,TableHead,TableBody,TableCell,Fab,
  Divider
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";

function Forecasts() {
  const [forecasts, setForecasts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newForecast, setNewForecast] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [editId, setEditId] = useState(null); // store which card is in edit mode
  const [tempEndDate, setTempEndDate] = useState(""); // temp value for editing
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
const [selectedForecastId, setSelectedForecastId] = useState(null);
const [newTransaction, setNewTransaction] = useState({
  name: "",
  type: "Income",
  amount: "",
  start_date: "",
  end_date: "",
  category: "",
});
const [openViewModal, setOpenViewModal] = React.useState(false);
const [transactions, setTransactions] = React.useState([]);

const handleViewTransactions = async (forecastId) => {
  try {
    const res = await fetch(`http://localhost:7760/transactions/${forecastId}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setOpenViewModal(true);
  } catch (err) {
    console.error("Error fetching transactions:", err);
  }
};

const handleOpenTransaction = (forecastId) => {
  setSelectedForecastId(forecastId);
  setNewTransaction({
    name: "",
    type: "Income",
    amount: "",
    start_date: "",
    end_date: "",
    category: "",
  });
  setOpenTransactionDialog(true);
};

const handleAddTransaction = async () => {
  const payload = {
    ...newTransaction,
    forecast_id: selectedForecastId,
    amount: parseFloat(newTransaction.amount), // convert to number
  };

  const res = await fetch("http://localhost:7760/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.success) {
    setOpenTransactionDialog(false);
    alert("Transaction added successfully!");
  } else {
    console.error(data);
    alert("Error adding transaction: " + (data.error || "Unknown error"));
  }
};

  const fetchForecasts = async () => {
    const res = await fetch("http://localhost:7760/forecasts");
    const data = await res.json();
    setForecasts(data.forecasts || []);
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  const handleAddForecast = async () => {
    const res = await fetch("http://localhost:7760/forecasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForecast),
    });
    const data = await res.json();
    if (data.success) {
      fetchForecasts();
      setOpenDialog(false);
      setNewForecast({ name: "", start_date: "", end_date: "" });
    }
  };

  const handleSaveEndDate = async (id) => {
    await fetch(`http://localhost:7760/forecasts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ end_date: tempEndDate }),
    });
    setEditId(null);
    fetchForecasts();
  };

  return (
    <div style={{ padding: 20 }}>
    {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 20, right: 20 }}
    onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      <Grid container spacing={3} style={{ marginTop: 20 }}>
        {forecasts.map((f) => (
          <Grid item xs={12} sm={6} md={4} key={f.id}>
           <Card sx={{ boxShadow: 3, borderRadius: 2, marginBottom: 2 }}>
  <CardContent>
    <Typography style={{fontWeight:"bold"}} variant="h6" gutterBottom>{f.name}</Typography> 
    <Divider></Divider>
    <Typography style={{textAlign:"start"}} variant="body2" color="textSecondary">
      Start Date: {f.start_date}
    </Typography>

    {editId === f.id ? (
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <TextField
          type="date"
          label="End Date"
          value={tempEndDate}
          onChange={(e) => setTempEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <IconButton color="primary" onClick={() => handleSaveEndDate(f.id)}>
          <SaveIcon />
        </IconButton>
      </div>
    ) : (
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <Typography variant="body2" color="textSecondary">
          End Date: {f.end_date}
        </Typography>
        <IconButton
          color="primary"
          onClick={() => {
            setEditId(f.id);
            setTempEndDate(f.end_date);
          }}
        >
          <EditIcon />
        </IconButton>
      </div>
    )}     <Divider></Divider>


    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => handleOpenTransaction(f.id)}
      >
        Add Transaction
      </Button>

      <Button
        variant="outlined"
        color="primary"
        onClick={() => handleViewTransactions(f.id)}
      >
        View Transactions
      </Button>
    </div>
  </CardContent>
</Card>

          </Grid>
        ))}
      </Grid>

      {/* Add Forecast Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Forecast</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="dense"
            label="Forecast Name"
            value={newForecast.name}
            onChange={(e) => setNewForecast({ ...newForecast, name: e.target.value })}
          />
          <TextField
            type="date"
            fullWidth
            margin="dense"
            label="Start Date"
            value={newForecast.start_date}
            onChange={(e) => setNewForecast({ ...newForecast, start_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            fullWidth
            margin="dense"
            label="End Date"
            value={newForecast.end_date}
            onChange={(e) => setNewForecast({ ...newForecast, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleAddForecast}>
            Add
          </Button>
        </DialogActions>
      </Dialog>



      {/* Add Transaction Modal */}
     <Dialog
  open={openTransactionDialog}
  onClose={() => setOpenTransactionDialog(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Add Transaction</DialogTitle>
  <DialogContent dividers>
    {/* Row 1: Transaction Name */}
    <TextField
      fullWidth
      margin="dense"
      label="Transaction Name"
      value={newTransaction.name}
      onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
    />

    {/* Row 2: Type + Amount */}
    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
      <TextField
        select
        label="Type"
        value={newTransaction.type}
        onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
        fullWidth
      >
        <MenuItem value="Income">Income</MenuItem>
        <MenuItem value="Expense">Expense</MenuItem>
      </TextField>

      <TextField
        label="Amount"
        type="number"
        value={newTransaction.amount}
        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
        fullWidth
      />
    </div>

    {/* Row 3: Start Date + End Date */}
    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
      <TextField
        type="date"
        label="Start Date"
        value={newTransaction.start_date}
        onChange={(e) => setNewTransaction({ ...newTransaction, start_date: e.target.value })}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        type="date"
        label="End Date (optional)"
        value={newTransaction.end_date}
        onChange={(e) => setNewTransaction({ ...newTransaction, end_date: e.target.value })}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
    </div>

    {/* Row 4: Category */}
    <TextField
      fullWidth
      margin="dense"
      label="Category (optional)"
      value={newTransaction.category}
      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
      style={{ marginTop: 10 }}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenTransactionDialog(false)}>Cancel</Button>
    <Button variant="contained" color="primary" onClick={handleAddTransaction}>
      Add Transaction
    </Button>
  </DialogActions>
</Dialog>


{/* View Forcast Modal */}
<Dialog
  open={openViewModal}
  onClose={() => setOpenViewModal(false)}
  fullWidth
  maxWidth="xl"
>
  <DialogTitle>Transactions for Forecast</DialogTitle>
  <DialogContent dividers>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Category</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.type}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(t.amount)}
                </TableCell>
                <TableCell>{t.start_date}</TableCell>
                <TableCell>{t.end_date}</TableCell>
                <TableCell>{t.category || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenViewModal(false)}>Close</Button>
  </DialogActions>
</Dialog>


    </div>
  );
}

export default Forecasts;
