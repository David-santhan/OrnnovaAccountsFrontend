import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Grow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setShow(true); // Trigger animation on mount
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password, remember });
    navigate('/home');
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e6f0faff', // Light pastel background
      }}
    >
      <Grow in={show} timeout={700}>
        <Paper elevation={10} sx={{ padding: 4, borderRadius: 3, width: 350 }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ color: '#0d3b66',fontWeight: 'bold' }}>
            Accounts Login
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            //   required
            />
            <TextField
              label="Password"
              variant="outlined"
              fullWidth
              margin="normal"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            //   required
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  color="primary"
                />
              }
              label="Remember Me"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' },
              }}
            >
              Login
            </Button>
            <Typography variant="body2" align="center" sx={{ mt: 2, cursor: 'pointer', color: '#2563eb' }}>
              Forgot Password?
            </Typography>
          </form>
        </Paper>
      </Grow>
    </Box>
  );
}

export default Login;
