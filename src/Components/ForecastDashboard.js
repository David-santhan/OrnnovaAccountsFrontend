// src/Components/ForecastDashboard.js
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Box, Typography, CircularProgress } from "@mui/material";

function ForecastDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:7760/monthly-summary?months=12`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((item) => ({
          month: item.month,
          credit: Number(item.credit_total || 0),
          debit: Number(item.debit_total || 0),
        }));
        setData(formatted);
        setError("");
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Monthly Credits vs Debits
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : data.length === 0 ? (
        <Typography>No data found</Typography>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: 500, // increase chart height
            backgroundColor: "#fff",
            borderRadius: 3,
            boxShadow: 3,
            p: 2,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 40, left: 20, bottom: 30 }}
              barCategoryGap="25%" // space between groups
              barGap={5} // space between bars
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#ccc" />
              <XAxis dataKey="month" tick={{ fontSize: 14 }} />
              <YAxis tick={{ fontSize: 14 }} />
              <Tooltip
                formatter={(value) =>
                  Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })
                }
                contentStyle={{ fontSize: 14 }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="credit" name="Credit" fill="#4CAF50" barSize={40} radius={[6, 6, 0, 0]} />
              <Bar dataKey="debit" name="Debit" fill="#F44336" barSize={40} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}

export default ForecastDashboard;
