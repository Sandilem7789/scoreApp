# Score Predictor ⚽

A web app that shows this week's football matches and predicts scorelines using a standings-based model. Data is fetched from the [football-data.org](https://www.football-data.org) API.

**Live site:** [imidlalo.netlify.app](https://imidlalo.netlify.app)

---

## How It Works

- Fetches all matches scheduled for the current week (Monday–Sunday)
- Groups matches by day, then by competition
- For each match, pulls the competition standings and calculates a predicted score using each team's attack/defense rating relative to the league average
- Home advantage factor of 1.25× is applied to the home team's expected goals
- Confidence % is based on the gap in league position between the two teams (range: 50–90%)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML / CSS / Vanilla JS |
| Backend | Netlify Serverless Functions (Node.js) |
| Data | [football-data.org API v4](https://www.football-data.org/documentation/api) |
| Hosting | Netlify |

---

## Project Structure

```
scoreApp/
├── netlify/
│   └── functions/
│       ├── week.js          # Fetches this week's matches
│       └── standings.js     # Fetches standings for a competition
├── public/
│   ├── index.html           # App shell
│   ├── styles.css           # Dark theme styling
│   └── app.js               # Prediction logic + rendering
├── server.js                # Local dev Express server
├── netlify.toml             # Netlify build + redirect config
└── package.json
```

---

## Running Locally

1. Clone the repo:
   ```bash
   git clone https://github.com/Sandilem7789/scoreApp.git
   cd scoreApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root:
   ```
   API_KEY=your_football_data_api_key
   PORT=3000
   ```
   Get a free API key at [football-data.org](https://www.football-data.org)

4. Start the server:
   ```bash
   node server.js
   ```

5. Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Netlify

1. Connect this repo to your Netlify site
2. Set the `API_KEY` environment variable in **Site Settings → Environment Variables**
3. Netlify auto-deploys on every push to `master`

> **Note:** Never commit your `.env` file — it is listed in `.gitignore`
