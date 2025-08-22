const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // Import file system module

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'teamData.json');

// Function to read data from the JSON file
const readTeamData = () => {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  }
  return [];
};

// Function to write data to the JSON file
const writeTeamData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Initialize data from file
let allTeamData = readTeamData();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Serve static files from the 'dist' directory (where webpack outputs)
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint for login (though actual login is handled client-side for fixed users)
app.post('/api/login', (req, res) => {
  res.status(200).json({ message: 'Login API endpoint reached.' });
});

// API endpoint to get all team data
app.get('/api/teamdata', (req, res) => {
  res.json(allTeamData);
});

// API endpoint to add new team data
app.post('/api/teamdata', (req, res) => {
  const newData = { id: allTeamData.length > 0 ? Math.max(...allTeamData.map(d => d.id)) + 1 : 1, ...req.body };
  allTeamData.push(newData);
  writeTeamData(allTeamData); // Persist data
  res.status(201).json(newData);
});

// API endpoint to update team data (for admin portal editing)
app.put('/api/teamdata/:id', (req, res) => {
  const { id } = req.params;
  const updatedEntry = req.body;
  allTeamData = allTeamData.map(entry =>
    entry.id === parseInt(id) ? { ...entry, ...updatedEntry } : entry
  );
  writeTeamData(allTeamData); // Persist data
  res.json(updatedEntry);
});

// API endpoint to delete team data
app.delete('/api/teamdata/:id', (req, res) => {
  const { id } = req.params;
  allTeamData = allTeamData.filter(entry => entry.id !== parseInt(id));
  writeTeamData(allTeamData); // Persist data
  res.status(204).send(); // No content to send back
});

// Catch-all to serve the React app for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
