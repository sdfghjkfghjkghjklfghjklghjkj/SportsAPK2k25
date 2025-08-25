const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // Import file system module

const app = express();
const PORT = process.env.PORT || 3001;
const TEAM_DATA_FILE = path.join(__dirname, 'teamData.json');
const TEAM_SCORES_FILE = path.join(__dirname, 'teamScores.json');
const CRICKET_SCORES_FILE = path.join(__dirname, 'cricketScores.json'); // New file for cricket scores
const EVENT_SCHEDULE_FILE = path.join(__dirname, 'eventSchedule.json');

// Function to read data from a JSON file
const readJsonFile = (filePath, defaultData = []) => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  // Initialize with default data if file doesn't exist
  fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  return defaultData;
};

// Function to write data to a JSON file
const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Initialize data from files
let allTeamData = readJsonFile(TEAM_DATA_FILE);
let teamScores = readJsonFile(TEAM_SCORES_FILE, []); // Initialize with empty array, cricket scores will be separate
let cricketScores = readJsonFile(CRICKET_SCORES_FILE, [
  {
    "id": 1,
    "team1": { "name": "Usooludheen", "runs": 0, "wickets": 0, "overs": 0, "status": "Yet to bat" },
    "team2": { "name": "Shareea", "runs": 0, "wickets": 0, "overs": 0, "status": "Yet to bat" },
    "matchStatus": "Upcoming",
    "tossDecision": ""
  },
  {
    "id": 2,
    "team1": { "name": "Luga Wal Halara", "runs": 0, "wickets": 0, "overs": 0, "status": "Yet to bat" },
    "team2": { "name": "Opponent Team", "runs": 0, "wickets": 0, "overs": 0, "status": "Yet to bat" },
    "matchStatus": "Upcoming",
    "tossDecision": ""
  }
]);
let eventSchedule = readJsonFile(EVENT_SCHEDULE_FILE);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Serve static files from the 'dist' directory (where webpack outputs)
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint for login (though actual login is handled client-side for fixed users)
app.post('/api/login', (req, res) => {
  res.status(200).json({ message: 'Login API endpoint reached.' });
});

// API endpoint to get all team data (participants)
app.get('/api/teamdata', (req, res) => {
  res.json(allTeamData);
});

// API endpoint to add new team data (participant)
app.post('/api/teamdata', (req, res) => {
  const newData = { id: allTeamData.length > 0 ? Math.max(...allTeamData.map(d => d.id)) + 1 : 1, ...req.body };
  allTeamData.push(newData);
  writeJsonFile(TEAM_DATA_FILE, allTeamData); // Persist data
  res.status(201).json(newData);
});

// API endpoint to update team data (participant for admin portal editing)
const CATEGORY_B_EVENTS_SERVER = [
  '100 mtr', '200 mtr', '400 mtr', '800 mtr', '1500 mtr', '1000 mtr (Walking)', 'Javelin Throw',
  'Discus Throw', 'Shot Put', 'Long Jump', 'Triple Jump', 'High Jump', 'Push Up', 'Arm Wrestling',
  '3000 mtr', 'Chess'
];

app.put('/api/teamdata/:id', (req, res) => {
  const { id } = req.params;
  const updatedEntry = req.body;

  // Server-side validation for Category B events participation limit
  if (updatedEntry.programs) {
    const categoryBEventsCount = updatedEntry.programs.filter(program => CATEGORY_B_EVENTS_SERVER.includes(program)).length;
    if (categoryBEventsCount > 3) {
      return res.status(400).json({ message: 'Category B participants can register for a maximum of 3 events.' });
    }
  }

  const oldParticipant = allTeamData.find(entry => entry.id === parseInt(id));
  if (!oldParticipant) {
    return res.status(404).json({ message: 'Participant not found' });
  }

  allTeamData = allTeamData.map(entry =>
    entry.id === parseInt(id) ? { ...entry, ...updatedEntry } : entry
  );
  writeJsonFile(TEAM_DATA_FILE, allTeamData); // Persist data

  // If the team name changed, update team scores
  if (oldParticipant.team !== updatedEntry.team) {
    // Recalculate score for the old team
    let oldTeamTotalScore = 0;
    allTeamData.forEach(participant => {
      if (participant.team === oldParticipant.team && participant.scores) {
        for (const prog in participant.scores) {
          if (typeof participant.scores[prog] === 'number') {
            oldTeamTotalScore += participant.scores[prog];
          }
        }
      }
    });
    const oldTeamIndex = teamScores.findIndex(ts => ts.team === oldParticipant.team);
    if (oldTeamIndex !== -1) {
      teamScores[oldTeamIndex].score = oldTeamTotalScore;
    } else {
      // If old team not found, it might have been the last participant of that team
      teamScores = teamScores.filter(ts => ts.team !== oldParticipant.team);
    }

    // Recalculate score for the new team
    let newTeamTotalScore = 0;
    allTeamData.forEach(participant => {
      if (participant.team === updatedEntry.team && participant.scores) {
        for (const prog in participant.scores) {
          if (typeof participant.scores[prog] === 'number') {
            newTeamTotalScore += participant.scores[prog];
          }
        }
      }
    });
    const newTeamIndex = teamScores.findIndex(ts => ts.team === updatedEntry.team);
    if (newTeamIndex !== -1) {
      teamScores[newTeamIndex].score = newTeamTotalScore;
    } else {
      teamScores.push({ team: updatedEntry.team, score: newTeamTotalScore });
    }
    writeJsonFile(TEAM_SCORES_FILE, teamScores); // Persist updated team scores
  }

  res.json(updatedEntry);
});

// API endpoint to delete team data (participant)
app.delete('/api/teamdata/:id', (req, res) => {
  const { id } = req.params;
  const deletedParticipant = allTeamData.find(entry => entry.id === parseInt(id));

  if (!deletedParticipant) {
    return res.status(404).json({ message: 'Participant not found' });
  }

  allTeamData = allTeamData.filter(entry => entry.id !== parseInt(id));
  writeJsonFile(TEAM_DATA_FILE, allTeamData); // Persist data

  // Recalculate team scores for the affected team
  const teamName = deletedParticipant.team;
  let totalTeamScore = 0;
  allTeamData.forEach(participant => {
    if (participant.team === teamName && participant.scores) {
      for (const prog in participant.scores) {
        if (typeof participant.scores[prog] === 'number') {
          totalTeamScore += participant.scores[prog];
        }
      }
    }
  });

  const teamIndex = teamScores.findIndex(ts => ts.team === teamName);
  if (teamIndex !== -1) {
    teamScores[teamIndex].score = totalTeamScore;
  } else {
    // If team not found, it might have been the last participant of that team
    // In a real application, you might want to remove the team or handle this differently
    console.warn(`Team ${teamName} not found in teamScores after participant deletion.`);
  }
  writeJsonFile(TEAM_SCORES_FILE, teamScores); // Persist updated team scores

  res.status(204).send(); // No content to send back
});

// --- New API Endpoints for Team Scores ---
app.get('/api/teamscores', (req, res) => {
  res.json(teamScores);
});

// API endpoint to get cricket scores
app.get('/api/cricketscores', (req, res) => {
  res.json(cricketScores);
});

// API endpoint to add a new cricket match
app.post('/api/cricketscores', (req, res) => {
  const { team1Name, team2Name } = req.body;
  const newMatchId = cricketScores.length > 0 ? Math.max(...cricketScores.map(m => m.id)) + 1 : 1;
  const newMatch = {
    id: newMatchId,
    team1: { name: team1Name, runs: 0, wickets: 0, overs: 0, status: "Yet to bat" },
    team2: { name: team2Name, runs: 0, wickets: 0, overs: 0, status: "Yet to bat" },
    matchStatus: "Upcoming",
    tossDecision: ""
  };
  cricketScores.push(newMatch);
  writeJsonFile(CRICKET_SCORES_FILE, cricketScores);
  res.status(201).json(newMatch);
});

// API endpoint to update cricket scores (including team names)
app.put('/api/cricketscores', (req, res) => {
  const updatedMatches = req.body; // Expecting an array of match objects

  updatedMatches.forEach(updatedMatch => {
    const matchIndex = cricketScores.findIndex(match => match.id === updatedMatch.id);
    if (matchIndex !== -1) {
      cricketScores[matchIndex] = {
        ...cricketScores[matchIndex],
        ...updatedMatch,
        team1: { ...cricketScores[matchIndex].team1, ...updatedMatch.team1 },
        team2: { ...cricketScores[matchIndex].team2, ...updatedMatch.team2 },
      };
    }
  });
  writeJsonFile(CRICKET_SCORES_FILE, cricketScores);
  res.status(200).json(cricketScores);
});

// API endpoint to delete a cricket match
app.delete('/api/cricketscores/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = cricketScores.length;
  cricketScores = cricketScores.filter(match => match.id !== parseInt(id));
  if (cricketScores.length < initialLength) {
    writeJsonFile(CRICKET_SCORES_FILE, cricketScores);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Cricket match not found' });
  }
});


// --- New API Endpoints for Event Schedule ---
app.get('/api/events', (req, res) => {
  res.json(eventSchedule);
});

app.post('/api/events', (req, res) => {
  const newEvent = { id: eventSchedule.length > 0 ? Math.max(...eventSchedule.map(e => e.id)) + 1 : 1, ...req.body };
  eventSchedule.push(newEvent);
  writeJsonFile(EVENT_SCHEDULE_FILE, eventSchedule);
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const updatedEvent = req.body;
  eventSchedule = eventSchedule.map(event =>
    event.id === parseInt(id) ? { ...event, ...updatedEvent } : event
  );
  writeJsonFile(EVENT_SCHEDULE_FILE, eventSchedule);
  res.json(updatedEvent);
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  eventSchedule = eventSchedule.filter(event => event.id !== parseInt(id));
  writeJsonFile(EVENT_SCHEDULE_FILE, eventSchedule);
  res.status(204).send();
});

// --- New API Endpoint for Individual Participant Scores/Marks ---
app.put('/api/participantscores/:id', (req, res) => {
  const { id } = req.params;
  const { program, score, team } = req.body; // Expecting program, score, and team
  let participantUpdated = false;

  console.log(`[SERVER] Received PUT request for /api/participantscores/${id}`);
  console.log('[SERVER] Request body:', { program, score, team });

  allTeamData = allTeamData.map(participant => {
    if (participant.id === parseInt(id)) {
      // Ensure 'scores' object exists
      if (!participant.scores) {
        participant.scores = {};
      }
      const oldScore = participant.scores[program];
      participant.scores[program] = score; // Update or add score for a specific program
      console.log(`[SERVER] Participant ${participant.name} (ID: ${id}) - Program: ${program}, Old Score: ${oldScore}, New Score: ${score}`);
      participantUpdated = true;
      return participant;
    }
    return participant;
  });

  if (participantUpdated) {
    writeJsonFile(TEAM_DATA_FILE, allTeamData);
    console.log('[SERVER] teamData.json updated.');

    // Recalculate team score
    let totalTeamScore = 0;
    allTeamData.forEach(participant => {
      if (participant.team === team && participant.scores) {
        for (const prog in participant.scores) {
          // Ensure score is a number before adding
          if (typeof participant.scores[prog] === 'number') {
            totalTeamScore += participant.scores[prog];
          }
        }
      }
    });
    console.log(`[SERVER] Recalculated total score for ${team}: ${totalTeamScore}`);

    // Update teamScores array
    const teamIndex = teamScores.findIndex(ts => ts.team === team);
    if (teamIndex !== -1) {
      teamScores[teamIndex].score = totalTeamScore;
      console.log(`[SERVER] Updated score for team ${team} in teamScores.`);
    } else {
      // If team not found in teamScores, add it (should not happen if initialized correctly)
      teamScores.push({ team: team, score: totalTeamScore });
      console.log(`[SERVER] Added new team ${team} to teamScores.`);
    }
    writeJsonFile(TEAM_SCORES_FILE, teamScores);
    console.log('[SERVER] teamScores.json updated.');

    res.status(200).json(allTeamData.find(p => p.id === parseInt(id)));
  } else {
    console.log(`[SERVER] Participant with ID ${id} not found.`);
    res.status(404).json({ message: 'Participant not found' });
  }
});


// API endpoint to get top 10 individual participant scores
app.get('/api/top10participants', (req, res) => {
  const participantsWithTotalScores = allTeamData.map(participant => {
    const totalScore = participant.scores ? Object.values(participant.scores).reduce((sum, score) => sum + score, 0) : 0;
    return {
      id: participant.id,
      name: participant.name,
      team: participant.team,
      totalScore: totalScore,
    };
  });

  const sortedParticipants = participantsWithTotalScores.sort((a, b) => b.totalScore - a.totalScore);
  const top10Participants = sortedParticipants.slice(0, 10);
  res.json(top10Participants);
});

// Catch-all to serve the React app for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
