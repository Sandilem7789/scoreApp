require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

app.use(express.static('public'));

async function footballFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

// This week's matches (Monday–Sunday)
app.get('/api/week', async (req, res) => {
  try {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const from = monday.toISOString().slice(0, 10);
    const to   = sunday.toISOString().slice(0, 10);
    const data = await footballFetch(`/matches?dateFrom=${from}&dateTo=${to}`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Standings for a specific competition
app.get('/api/standings/:competitionId', async (req, res) => {
  try {
    const data = await footballFetch(`/competitions/${req.params.competitionId}/standings`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Score Predictor running at http://localhost:${PORT}`);
});
