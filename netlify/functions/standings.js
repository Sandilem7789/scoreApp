const BASE_URL = 'https://api.football-data.org/v4';

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing competition id' }) };
  }

  try {
    const res = await fetch(`${BASE_URL}/competitions/${id}/standings`, {
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
