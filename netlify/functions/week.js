const BASE_URL = 'https://api.football-data.org/v4';

exports.handler = async () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const from = monday.toISOString().slice(0, 10);
  const to   = sunday.toISOString().slice(0, 10);

  if (!process.env.API_KEY) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API_KEY environment variable is not set' })
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/matches?dateFrom=${from}&dateTo=${to}`, {
      headers: { 'X-Auth-Token': process.env.API_KEY }
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `football-data.org error ${res.status}: ${data.message || JSON.stringify(data)}` })
      };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
