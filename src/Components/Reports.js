import React, { useState } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const menuItems = [
  { text: "Accounts", icon: <AccountBalanceIcon /> },
  { text: "Clients", icon: <PeopleIcon /> },
  { text: "Expenses", icon: <ReceiptIcon /> },
  { text: "Reports", icon: <BarChartIcon /> },
  { text: "Settings", icon: <SettingsIcon /> },
];

// Dummy Data
const dataMonthly = [
  { name: "Jan", income: 4000, expense: 2400 },
  { name: "Feb", income: 3000, expense: 13398 },
  { name: "Mar", income: 2000, expense: 9800 },
  { name: "Apr", income: 2780, expense: 3908 },
  { name: "May", income: 1890, expense: 4800 },
  { name: "Jun", income: 2390, expense: 3800 },
];

const dataWeekly = [
  { name: "Week 1", income: 1200, expense: 8300 },
  { name: "Week 2", income: 1800, expense: 13500 },
  { name: "Week 3", income: 2200, expense: 23000 },
  { name: "Week 4", income: 1600, expense: 13000 },
];

const dataYearly = [
  { name: "2020", income: 40000, expense: 234000 },
  { name: "2021", income: 50000, expense: 353000 },
  { name: "2022", income: 70000, expense: 40000 },
  { name: "2023", income: 65000, expense: 42000 },
    { name: "2024", income: 165000, expense: 142000 },
  { name: "2025", income: 615000, expense: 342000 },

];

const COLORS = ["#0088FE", "#FF8042"];

function Reports() {
  const [graphType, setGraphType] = useState("line");
  const [range, setRange] = useState("monthly");

  const getData = () => {
    switch (range) {
      case "weekly":
        return dataWeekly;
      case "yearly":
        return dataYearly;
      default:
        return dataMonthly;
    }
  };

  const renderGraph = () => {
    const data = getData();

    if (graphType === "line") {
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#10b981" />
          <Line type="monotone" dataKey="expense" stroke="#ef4444" />
        </LineChart>
      );
    }

    if (graphType === "bar") {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#10b981" />
          <Bar dataKey="expense" fill="#ef4444" />
        </BarChart>
      );
    }

    if (graphType === "pie") {
      // aggregate income & expense
      const totals = [
        {
          name: "Income",
          value: data.reduce((acc, d) => acc + d.income, 0),
        },
        {
          name: "Expense",
          value: data.reduce((acc, d) => acc + d.expense, 0),
        },
      ];

      return (
        <PieChart>
          <Pie
            data={totals}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {totals.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }
  };

  return (
    <Box sx={{ width: "100%", height: 400 }}>
      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <FormControl>
          <InputLabel>Graph Type</InputLabel>
          <Select
            value={graphType}
            onChange={(e) => setGraphType(e.target.value)}
            label="Graph Type"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="line">Line</MenuItem>
            <MenuItem value="bar">Bar (Cylinder)</MenuItem>
            <MenuItem value="pie">Pie</MenuItem>
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Range</InputLabel>
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            label="Range"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Graph */}
      <ResponsiveContainer width="100%" height="100%">
        {renderGraph()}
      </ResponsiveContainer>
    </Box>
  );
}

export default Reports;
