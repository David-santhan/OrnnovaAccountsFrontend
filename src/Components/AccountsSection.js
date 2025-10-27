import React, { useState, useEffect } from "react";
import { Typography,Fab,Stack,Table,Grid, TableHead, TableBody, TableRow, TableCell, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";

const AccountsSection = () => {
  const [accounts, setAccounts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountNumber: "",
    accountName: "",
    type: "",
    amount: "",
    ifsc: "",
    bankName: "",
    location: "",
    statement: ""
  });

  // Fetch accounts from backend
  const loadAccounts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/accounts");
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAddAccount = async () => {
    try {
      await axios.post("http://localhost:5000/accounts", newAccount);
      setOpenDialog(false);
      setNewAccount({
        accountNumber: "",
        accountName: "",
        type: "",
        amount: "",
        ifsc: "",
        bankName: "",
        location: "",
        // statement: ""
      });
      loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* <Typography variant="h4" sx={{ color: "#0d3b66", marginBottom: 2 }}>
        Accounts Section
      </Typography> */}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 30, right: 30 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      <Table>
        <TableHead>
          <TableRow style={{backgroundColor: "whitesmoke"}}>
            <TableCell style={{fontWeight:"bold"}}>Account ID</TableCell>
            <TableCell style={{fontWeight:"bold"}}>Account Number</TableCell>
            <TableCell style={{fontWeight:"bold"}}>Account Name</TableCell>
            <TableCell style={{fontWeight:"bold"}}>Type</TableCell>
            <TableCell style={{fontWeight:"bold"}}>Amount</TableCell>
            <TableCell style={{fontWeight:"bold"}}>IFSC Code</TableCell>
            <TableCell style={{fontWeight:"bold"}}>Bank Name</TableCell>
            <TableCell style={{fontWeight:"bold"}}>Location</TableCell>
            <TableCell style={{fontWeight:"bold"}}>Statement</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((acc) => (
            <TableRow key={acc.id}>
              <TableCell>{acc.id}</TableCell>
              <TableCell>{acc.accountNumber}</TableCell>
              <TableCell>{acc.accountName}</TableCell>
              <TableCell>{acc.type}</TableCell>
              <TableCell>{acc.amount}</TableCell>
              <TableCell>{acc.ifsc}</TableCell>
              <TableCell>{acc.bankName}</TableCell>
              <TableCell>{acc.location}</TableCell>
              <TableCell>{acc.statement}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog to add new account */}
     <Dialog
  open={openDialog}
  onClose={() => setOpenDialog(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.5rem", color: "#0d3b66", textAlign: "center" }}>
    Add New Account
  </DialogTitle>

  <DialogContent dividers>
    <Stack spacing={2} mt={1}>
      {Object.keys(newAccount)
        .filter(field => field !== "statement")
        .map((field) => (
          <TextField
            key={field}
            label={field.replace(/([A-Z])/g, " $1")}
            placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`}
            value={newAccount[field]}
            onChange={(e) =>
              setNewAccount({ ...newAccount, [field]: e.target.value })
            }
            fullWidth
            variant="outlined"
            size="medium"
          />
        ))}
    </Stack>
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
    <Button
      onClick={() => setOpenDialog(false)}
      sx={{
        textTransform: "none",
        color: "#0d3b66",
        border: "1px solid #0d3b66",
        "&:hover": { backgroundColor: "#f0f4f8", borderColor: "#083358" },
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={handleAddAccount}
      variant="contained"
      sx={{
        backgroundColor: "#0d3b66",
        textTransform: "none",
        px: 4,
        "&:hover": { backgroundColor: "#083358" },
      }}
    >
      Add Account
    </Button>
  </DialogActions>
</Dialog>


    </div>
  );
};

export default AccountsSection;
