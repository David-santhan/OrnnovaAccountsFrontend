import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const API_BASE = "http://localhost:7760/api/forecast";

const ForecastingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [data, setData] = useState([]);
  const [view, setView] = useState("monthly");
  const [chartType, setChartType] = useState("line");

  // ✅ Date states
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));

  // ✅ Fetch summary
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/summary`);
      const json = await res.json();
      setSummary(json);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  // ✅ Fetch forecast data
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/${view}`;
      if (view === "daily" || view === "weekly" || view === "monthly") {
        url += `?start=${startDate.format("YYYY-MM-DD")}&end=${endDate.format(
          "YYYY-MM-DD"
        )}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchData();
  }, [view, selectedDate, startDate, endDate]);

  // ✅ Chart Rendering
  const renderChart = () => {
    if (loading) return <CircularProgress />;
    if (!data.length)
      return (
        <Typography variant="body1" color="text.secondary">
          No data available.
        </Typography>
      );

    const xKey =
      view === "daily"
        ? "day"
        : view === "weekly"
        ? "week_key"
        : view === "yearly"
        ? "year"
        : "month";

    return (
      <ResponsiveContainer width="100%" height={400}>
        {chartType === "line" ? (
          <LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey={xKey} />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="actual_income" stroke="#2e7d32" name="Actual Income" />
  <Line type="monotone" dataKey="forecasted_income" stroke="#81c784" name="Forecasted Income" />
  <Line type="monotone" dataKey="actual_expense" stroke="#c62828" name="Actual Expense" />
  <Line type="monotone" dataKey="forecasted_expense" stroke="#ef9a9a" name="Forecasted Expense" />
  <Line type="monotone" dataKey="actual_netflow" stroke="#1565c0" name="Netflow" />
</LineChart>

        ) : (
          <BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey={xKey} />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="actual_income" fill="#2e7d32" name="Actual Income" />
  <Bar dataKey="forecasted_income" fill="#81c784" name="Forecasted Income" />
  <Bar dataKey="actual_expense" fill="#c62828" name="Actual Expense" />
  <Bar dataKey="forecasted_expense" fill="#ef9a9a" name="Forecasted Expense" />
  <Bar dataKey="actual_netflow" fill="#1565c0" name="Netflow" />
</BarChart>

        )}
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Forecasting Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#e8f5e9" }}>
            <CardContent>
              <Typography variant="subtitle1">Total Actual Income</Typography>
              <Typography variant="h6" fontWeight="bold">
                ₹{summary.total_actual_income?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#e3f2fd" }}>
            <CardContent>
              <Typography variant="subtitle1">Forecast Income</Typography>
              <Typography variant="h6" fontWeight="bold">
                ₹{summary.total_forecast_income?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#ffebee" }}>
            <CardContent>
              <Typography variant="subtitle1">Total Expense</Typography>
              <Typography variant="h6" fontWeight="bold">
                ₹{summary.total_actual_expense?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#fff8e1" }}>
            <CardContent>
              <Typography variant="subtitle1">Recurring Expense</Typography>
              <Typography variant="h6" fontWeight="bold">
                ₹{summary.recurring_expense?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={view}
            onChange={(e) => setView(e.target.value)}
            label="Period"
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {(view === "daily" || view === "weekly" || view === "monthly") && (
            <>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newVal) => setStartDate(newVal)}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newVal) => setEndDate(newVal)}
              />
            </>
          )}
        </LocalizationProvider>

        <Button variant="contained" onClick={fetchData}>
          Apply
        </Button>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Chart Type</InputLabel>
          <Select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            label="Chart Type"
          >
            <MenuItem value="line">Line Chart</MenuItem>
            <MenuItem value="bar">Bar Chart</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Chart Section */}
      <Card>
        <CardContent>{renderChart()}</CardContent>
      </Card>
    </Box>
  );
};

export default ForecastingDashboard;
