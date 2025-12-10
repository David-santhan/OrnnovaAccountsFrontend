
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Modal,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

const AccountsSection = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [open, setOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [balance, setBalance] = useState(null);
  const [addAmount, setAddAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [filterType, setFilterType] = useState("last10");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [newAccount, setNewAccount] = useState({
    account_number: "",
    account_name: "",
    account_type: "",
    balance: "",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    axios
      .get("http://localhost:7760/accounts")
      .then((res) => setAccounts(res.data))
      .catch((err) => console.error(err));
  };

  const handleOpen = (acc) => {
    setSelectedAccount(acc);
    setShowBalance(false);
    setShowTransactions(false);
    setShowTransfer(false);
    setBalance(acc.balance);
    setAddAmount("");
    setTransactions([]);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleShowBalance = () => {
    setShowBalance(true);
    setShowTransactions(false);
    setShowTransfer(false);
  };

  const handleShowTransactions = async () => {
    if (!selectedAccount || !selectedAccount.account_number) {
      alert("Please select an account first");
      return;
    }

    setShowTransactions(true);
    setShowBalance(false);
    setShowTransfer(false);
    setLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:7760/transactionsOfBankAccounts?account_number=${selectedAccount.account_number}`
      );

      setTransactions(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleShowTransfer = () => {
    setShowTransfer(true);
    setShowBalance(false);
    setShowTransactions(false);
  };

  const handleAddBalance = async () => {
    if (!addAmount || Number(addAmount) <= 0) {
      return alert("Enter a valid amount!");
    }
    try {
      await axios.patch(
        `http://localhost:7760/accounts/${selectedAccount.account_number}/add-balance`,
        { amount: Number(addAmount) }
      );
      setBalance((prev) => Number(prev) + Number(addAmount));
      setAddAmount("");
      loadAccounts();
      alert("✅ Balance updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update balance");
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const { account_number, account_name, account_type, balance } = newAccount;
    if (!account_number || !account_name || !account_type) {
      return alert("Please fill all fields!");
    }

    try {
      await axios.post("http://localhost:7760/accounts", {
        account_number,
        account_name,
        account_type,
        balance: balance || 0,
      });
      alert("✅ Account created successfully!");
      setOpenCreate(false);
      setNewAccount({ account_number: "", account_name: "", account_type: "", balance: "" });
      loadAccounts();
    } catch (err) {
      console.error(err);
      alert("Failed to create account");
    }
  };

  const handleTransfer = async () => {
    if (!toAccount || !transferAmount) {
      alert("Please fill all fields!");
      return;
    }
    try {
      const res = await axios.post("http://localhost:7760/accounts/transfer", {
        from_account: selectedAccount.account_number,
        to_account: toAccount,
        amount: parseFloat(transferAmount),
        description: transferDesc,
      });
      alert("✅ " + res.data.message);
      setTransferAmount("");
      setToAccount("");
      setTransferDesc("");
      setShowTransfer(false);
      loadAccounts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Transfer failed");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // 🧾 Optional: Add a custom title
    doc.setFontSize(16);
    doc.text("Transaction History", 14, 15);

    // Table columns (headers)
    const tableColumn = ["Transaction ID", "Type", "Description", "Amount (₹)", "Date"];

    // Table rows (data)
    const tableRows = transactions.map((t) => [
      t.transaction_id,
      t.type,
      t.description,
      `₹${t.amount}`,
      new Date(t.created_at).toLocaleString(),
    ]);

    // 🟢 Here's where you use your styled autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25, // space after title
      theme: "grid", // adds borders to cells
      headStyles: { fillColor: [25, 118, 210] }, // MUI blue
      styles: { fontSize: 10, cellPadding: 3 },
      alternateRowStyles: { fillColor: [240, 240, 240] }, // light gray alternate
    });

    // Footer note or signature (optional)
    const date = new Date().toLocaleString();
    doc.text(`Generated on: ${date}`, 14, doc.lastAutoTable.finalY + 10);

    // Save the PDF
    doc.save("Transaction_History.pdf");
  };

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, filterType]);

  const handleApplyCustomFilter = () => {
    applyFilter();
  };

  const applyFilter = () => {
    let filtered = [...transactions];
    const now = new Date();

    if (filterType === "last10") {
      filtered = transactions.slice(-10).reverse(); // latest 10
    } else if (filterType === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      filtered = transactions.filter(
        (t) => new Date(t.created_at) >= weekAgo && new Date(t.created_at) <= now
      );
    } else if (filterType === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = transactions.filter(
        (t) => new Date(t.created_at) >= monthAgo && new Date(t.created_at) <= now
      );
    } else if (filterType === "custom") {
      const fromDate = new Date(customDateRange.from);
      const toDate = new Date(customDateRange.to);
      filtered = transactions.filter(
        (t) => new Date(t.created_at) >= fromDate && new Date(t.created_at) <= toDate
      );
    }

    setFilteredTransactions(filtered);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ mb: 4, color: "#0A1929", textAlign: "center" }}
      >
        Company Accounts
      </Typography>

      {/* Add Account Button */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Button
          variant="contained"
          color="success"
          onClick={() => setOpenCreate(true)}
        >
          + Create New Account
        </Button>
      </Box>

      {/* Account Cards */}
      <Grid container spacing={3} justifyContent="center">
        {accounts.map((acc) => (
          <Grid item xs={12} sm={6} md={4} key={acc.account_id}>
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: 3,
                "&:hover": { boxShadow: 6, transform: "scale(1.02)" },
                transition: "0.3s",
                cursor: "pointer",
                background:
                  acc.account_type === "Current"
                    ? "linear-gradient(135deg, #e3f2fd, #bbdefb)"
                    : "linear-gradient(135deg, #f1f8e9, #dcedc8)",
              }}
              onClick={() => {
                handleOpen(acc);
                setAccountNumber(acc.account_number);
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <AccountBalanceIcon
                  color="primary"
                  sx={{ fontSize: 45, opacity: 0.8 }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {acc.account_name}
                  </Typography>
                  <Typography color="text.secondary">
                    {acc.account_type} A/C
                  </Typography>
                  {/* <-- REPLACED: Show balance instead of account number */}
                  <Typography color="text.secondary">
                    Balance: ₹{Number(acc.balance || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Account Modal */}
      <Modal open={open} onClose={handleClose}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: "80%",
            maxWidth: "1000px",
            margin: "auto",
            borderRadius: 3,
            mt: 5,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {selectedAccount?.account_name} ({selectedAccount?.account_type})
            </Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Left Info Panel */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  height: "100%",
                  borderRadius: 2,
                  backgroundColor: "#f9fafb",
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Account Details
                </Typography>
                <Typography>
                  <strong>Account No:</strong> {selectedAccount?.account_number}
                </Typography>
                <Typography>
                  <strong>Type:</strong> {selectedAccount?.account_type}
                </Typography>
                <Typography>
                  <strong>Created:</strong>{" "}
                  {selectedAccount?.created_at ? new Date(selectedAccount?.created_at).toLocaleDateString() : ""}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Button
                    variant={showBalance ? "contained" : "outlined"}
                    color="secondary"
                    fullWidth
                    onClick={handleShowBalance}
                  >
                    Show Balance
                  </Button>
                  <Button
                    variant={showTransactions ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                    onClick={() => {
                      handleShowTransactions();
                      setOpenTransactionDialog(true);
                    }} // ✅ open dialog here
                  >
                    {loading ? "Loading..." : "View Transactions"}
                  </Button>
                  <Button
                    variant={showTransfer ? "contained" : "outlined"}
                    color="success"
                    fullWidth
                    onClick={handleShowTransfer}
                  >
                    Transfer Money
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Right Dynamic Panel */}
            <Grid item xs={12} md={8}>
              {/* Show Balance */}
              {showBalance && (
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography
                    variant="h6"
                    color={balance >= 0 ? "green" : "red"}
                    fontWeight="bold"
                  >
                    Current Balance: ₹{Number(balance || 0).toFixed(2)}
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    mt={2}
                  >
                    <TextField
                      label="Add Amount"
                      type="number"
                      size="small"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleAddBalance}
                    >
                      Add Balance
                    </Button>
                  </Stack>
                </Paper>
              )}

              {/* Transfer Section */}
              {showTransfer && (
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography
                    variant="h6"
                    mb={2}
                    textAlign="center"
                    color="success.main"
                    fontWeight="bold"
                  >
                    Transfer Money
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="To Account Number"
                      fullWidth
                      value={toAccount}
                      onChange={(e) => setToAccount(e.target.value)}
                    />
                    <TextField
                      label="Amount"
                      type="number"
                      fullWidth
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                    />
                    <TextField
                      label="Description"
                      fullWidth
                      value={transferDesc}
                      onChange={(e) => setTransferDesc(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleTransfer}
                    >
                      Transfer
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Modal>

      {/* 🧾 TRANSACTION HISTORY DIALOG */}
      <Dialog
        open={openTransactionDialog}
        onClose={() => setOpenTransactionDialog(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
          Transaction History
        </DialogTitle>

        <DialogContent>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            {/* 🧩 Filter Controls */}
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter By</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filter By"
                >
                  <MenuItem value="last10">Last 10 Transactions</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="custom">Custom Dates</MenuItem>
                </Select>
              </FormControl>

              {/* 📅 Custom Date Pickers */}
              {filterType === "custom" && (
                <>
                  <TextField
                    type="date"
                    label="From"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={customDateRange.from}
                    onChange={(e) =>
                      setCustomDateRange((prev) => ({ ...prev, from: e.target.value }))
                    }
                  />
                  <TextField
                    type="date"
                    label="To"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={customDateRange.to}
                    onChange={(e) =>
                      setCustomDateRange((prev) => ({ ...prev, to: e.target.value }))
                    }
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleApplyCustomFilter}
                    sx={{ height: 40 }}
                  >
                    Apply
                  </Button>
                </>
              )}
            </Box>

            {/* 🧾 Transactions Table */}
            <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Transaction ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">
                      Previous Balance
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">
                      Updated Balance
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.transaction_id}>
                        <TableCell>{t.transaction_id}</TableCell>
                        <TableCell
                          sx={{
                            color:
                              t.type === "Credit"
                                ? "green"
                                : t.type === "Debit"
                                ? "red"
                                : "inherit",
                            fontWeight: "bold",
                          }}
                        >
                          {t.type}
                        </TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell align="right">₹{Number(t.amount).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₹{Number(t.previous_balance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ₹{Number(t.updated_balance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(t.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setOpenTransactionDialog(false)}
          >
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadPDF}
            disabled={filteredTransactions.length === 0}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Account Modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)}>
        <Paper
          sx={{
            p: 4,
            width: { xs: "90%", sm: "500px" },
            margin: "auto",
            mt: 8,
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            textAlign="center"
            color="primary"
            mb={2}
          >
            Create New Account
          </Typography>
          <form onSubmit={handleCreateAccount}>
            <Stack spacing={2}>
              <TextField
                label="Account Number"
                value={newAccount.account_number}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    account_number: e.target.value,
                  })
                }
                required
              />
              <TextField
                label="Account Name"
                value={newAccount.account_name}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    account_name: e.target.value,
                  })
                }
                required
              />
              <TextField
                select
                label="Account Type"
                value={newAccount.account_type}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    account_type: e.target.value,
                  })
                }
                required
              >
                <MenuItem value="Capital">Capital</MenuItem>
                <MenuItem value="Current">Current</MenuItem>
               
               
              </TextField>
              <TextField
                label="Initial Balance"
                type="number"
                value={newAccount.balance}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, balance: e.target.value })
                }
              />
              <Button type="submit" variant="contained" color="success">
                Create Account
              </Button>
            </Stack>
          </form>
        </Paper>
      </Modal>
    </Box>
  );
};

export default AccountsSection;
