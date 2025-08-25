import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AdminEventPanel from './AdminEventPanel'; // Import the new AdminEventPanel

const CATEGORY_A_EVENTS = [
  'Football', 'Cricket', 'Volleyball', 'Badminton', 'Tug of War', '4x200 Relay', '4x100 Relay', 'Shoot Out'
];

const CATEGORY_B_EVENTS = [
  '100 mtr', '200 mtr', '400 mtr', '800 mtr', '1500 mtr', '1000 mtr (Walking)', 'Javelin Throw',
  'Discus Throw', 'Shot Put', 'Long Jump', 'Triple Jump', 'High Jump', 'Push Up', 'Arm Wrestling',
  '3000 mtr', 'Chess'
];

const CATEGORIES = {
  'Category A': CATEGORY_A_EVENTS,
  'Category B': CATEGORY_B_EVENTS,
};

const RANK_SCORES = {
  'Category A': {
    '1st': 20,
    '2nd': 13,
    '3rd': 6,
  },
  'Category B': {
    '1st': 10,
    '2nd': 6,
    '3rd': 3,
  },
};

const getProgramCategory = (programName) => {
  if (CATEGORY_A_EVENTS.includes(programName)) {
    return 'Category A';
  }
  if (CATEGORY_B_EVENTS.includes(programName)) {
    return 'Category B';
  }
  return null;
};

function AdminPortal() {
  const [allTeamData, setAllTeamData] = useState([]);
  const [teamScores, setTeamScores] = useState([]);
  const [eventSchedule, setEventSchedule] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [lastCricketUpdateTime, setLastCricketUpdateTime] = useState(null); // New state for last update time

  // State for new event form
  const [selectedEventCategoryFilter, setSelectedEventCategoryFilter] = useState('All'); // New state for event category filter
  // State for updating team scores
  // State for cricket match input
const [cricketMatchesInput, setCricketMatchesInput] = useState([]);
  const [newCricketMatch, setNewCricketMatch] = useState({
    team1Name: '',
    team2Name: '',
  });

  // State for updating individual participant scores (now for bulk entry)
  const [selectedProgramForScore, setSelectedProgramForScore] = useState('');
  const [participantsInSelectedProgram, setParticipantsInSelectedProgram] = useState([]);
  const [participantRanks, setParticipantRanks] = useState({}); // { participantId: '1st' | '2nd' | '3rd' | '' }

  // State for inline participant data update/delete
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [editedChessNumber, setEditedChessNumber] = useState(''); // Kept for display, not edit
  const [editedPrograms, setEditedPrograms] = useState([]);
  const [availableProgramsForAssignment, setAvailableProgramsForAssignment] = useState([]);

  // Fetch all necessary data
  const fetchData = () => {
    // Fetch all team data (participants)
    fetch('/api/teamdata')
      .then(response => response.json())
      .then(data => {
        const sortedData = data.sort((a, b) => {
          if (a.team < b.team) return -1;
          if (a.team > b.team) return 1;
          const chessNumA = parseInt(a.chessNumber, 10);
          const chessNumB = parseInt(b.chessNumber, 10);
          return chessNumA - chessNumB;
        });
        setAllTeamData(sortedData);
      })
      .catch(error => console.error('Error fetching all team data:', error));

    // Fetch team scores
    fetch('/api/teamscores')
      .then(response => response.json())
      .then(data => setTeamScores(data))
      .catch(error => console.error('Error fetching team scores:', error));

    // Fetch event schedule
    fetch('/api/events')
      .then(response => response.json())
      .then(data => setEventSchedule(data))
      .catch(error => console.error('Error fetching event schedule:', error));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch cricket matches on component mount
  useEffect(() => {
    fetch('/api/cricketscores')
      .then(response => response.json())
      .then(data => {
        setCricketMatchesInput(data);
      })
      .catch(error => console.error('Error fetching cricket matches:', error));

    // Load last update time from localStorage
    const storedTime = localStorage.getItem('lastCricketUpdateTime');
    if (storedTime) {
      setLastCricketUpdateTime(storedTime);
    }
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleDelete = (id) => {
    fetch(`/api/teamdata/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        console.log('Team data deleted successfully!');
        fetchData(); // Re-fetch all data to update the table
      })
      .catch(error => console.error('Error deleting team data:', error));
  };

  // Handle deleting an event
  const handleDeleteEvent = (id) => {
    fetch(`/api/events/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        alert('Event deleted successfully!');
        fetchData(); // Refresh data
      })
      .catch(error => console.error('Error deleting event:', error));
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...allTeamData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [allTeamData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const flattenedParticipantScores = React.useMemo(() => {
    let flattened = [];
    allTeamData.forEach(participant => {
      if (participant.programs && participant.scores) {
        participant.programs.forEach(program => {
          flattened.push({
            id: `${participant.id}-${program}`, // Unique ID for each program entry
            participantId: participant.id,
            team: participant.team,
            chessNumber: participant.chessNumber,
            name: participant.name,
            program: program,
            score: participant.scores[program] !== undefined ? participant.scores[program] : 'N/A',
          });
        });
      }
    });

    // Filter based on search term
    const filtered = flattened.filter(entry =>
      Object.values(entry).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Sort based on sortConfig
    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [allTeamData, searchTerm, sortConfig]);

  const handleExportToExcel = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const formattedData = flattenedParticipantScores.map(entry => ({
      Team: entry.team,
      'Chess Number': entry.chessNumber,
      Name: entry.name,
      Program: entry.program,
      Score: entry.score,
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    saveAs(data, 'IndividualParticipantScores_AdminPortal' + fileExtension);
  };

  const handleExportAllParticipantDataToExcel = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const formattedData = allTeamData.map(participant => ({
      ID: participant.id,
      Name: participant.name,
      Team: participant.team,
      'Chess Number': participant.chessNumber,
      Programs: participant.programs.join(', '),
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    saveAs(data, 'AllParticipantData_AdminPortal' + fileExtension);
  };


  // Handle updating cricket matches
  const handleAddCricketMatch = async (e) => {
    e.preventDefault();
    if (!newCricketMatch.team1Name || !newCricketMatch.team2Name) {
      alert('Please enter both team names for the new match.');
      return;
    }

    try {
      const response = await fetch('/api/cricketscores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team1Name: newCricketMatch.team1Name,
          team2Name: newCricketMatch.team2Name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add new cricket match');
      }

      alert('New cricket match added successfully!');
      setNewCricketMatch({ team1Name: '', team2Name: '' });
      fetch('/api/cricketscores') // Re-fetch cricket matches to update the list
        .then(response => response.json())
        .then(data => setCricketMatchesInput(data))
        .catch(error => console.error('Error fetching cricket matches:', error));
    } catch (error) {
      console.error('Error adding cricket match:', error);
      alert(`Error adding cricket match: ${error.message}`);
    }
  };

  const handleDeleteCricketMatch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cricket match?')) {
      return;
    }
    try {
      const response = await fetch(`/api/cricketscores/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete cricket match');
      }

      alert('Cricket match deleted successfully!');
      fetch('/api/cricketscores') // Re-fetch cricket matches to update the list
        .then(response => response.json())
        .then(data => setCricketMatchesInput(data))
        .catch(error => console.error('Error fetching cricket matches:', error));
    } catch (error) {
      console.error('Error deleting cricket match:', error);
      alert(`Error deleting cricket match: ${error.message}`);
    }
  };

  // Handle updating cricket matches
  const handleUpdateCricketMatches = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/cricketscores', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cricketMatchesInput.map(match => ({
          ...match,
          team1: {
            ...match.team1,
            runs: parseInt(match.team1.runs, 10),
            wickets: parseInt(match.team1.wickets, 10),
            overs: parseFloat(match.team1.overs),
          },
          team2: {
            ...match.team2,
            runs: parseInt(match.team2.runs, 10),
            wickets: parseInt(match.team2.wickets, 10),
            overs: parseFloat(match.team2.overs),
          },
        }))),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update cricket matches');
      }

      alert('Cricket matches updated successfully!');
      const now = new Date().toLocaleString();
      setLastCricketUpdateTime(now);
      localStorage.setItem('lastCricketUpdateTime', now); // Store in localStorage
      fetchData(); // Refresh general data
      // Re-fetch cricket matches specifically to update the form
      fetch('/api/cricketscores')
        .then(response => response.json())
        .then(data => setCricketMatchesInput(data))
        .catch(error => console.error('Error fetching cricket matches:', error));
    } catch (error) {
      console.error('Error updating cricket matches:', error);
      alert(`Error updating cricket matches: ${error.message}`);
    }
  };

  // Handle updating individual participant scores
  // Effect to update participants in selected program when selectedProgramForScore changes
  useEffect(() => {
    if (selectedProgramForScore) {
      const filteredParticipants = allTeamData.filter(p =>
        p.programs.includes(selectedProgramForScore)
      );
      setParticipantsInSelectedProgram(filteredParticipants);
      // Initialize participantRanks for the new program, ensuring no duplicate ranks are pre-filled
      const initialRanks = {};
      const assignedRanksDuringInit = new Set();

      filteredParticipants.forEach(p => {
        const existingScore = p.scores?.[selectedProgramForScore];
        let existingRank = '';

        if (existingScore !== undefined) {
          const programCategory = getProgramCategory(selectedProgramForScore);
          if (programCategory) {
            for (const rank in RANK_SCORES[programCategory]) {
              if (RANK_SCORES[programCategory][rank] === existingScore) {
                // Only assign if this rank hasn't been assigned to another participant yet
                if (!assignedRanksDuringInit.has(rank)) {
                  existingRank = rank;
                  assignedRanksDuringInit.add(rank);
                }
                break;
              }
            }
          }
        }
        initialRanks[p.id] = existingRank;
      });
      setParticipantRanks(initialRanks);
    } else {
      setParticipantsInSelectedProgram([]);
      setParticipantRanks({});
    }
  }, [selectedProgramForScore, allTeamData]);

  const handleRankChange = (participantId, rank) => {
    setParticipantRanks(prevRanks => {
      const newRanks = { ...prevRanks };

      // If a rank is being assigned, check for duplicates
      if (rank) {
        // Find if any other participant already has this rank for the current program
        const existingParticipantWithRankId = Object.keys(newRanks).find(
          (id) => id !== String(participantId) && newRanks[id] === rank
        );

        if (existingParticipantWithRankId) {
          // Clear the rank of the previously assigned participant
          newRanks[existingParticipantWithRankId] = '';
        }
      }

      newRanks[participantId] = rank;
      return newRanks;
    });
  };

  // Handle updating individual participant scores (now for bulk entry)
  const handleUpdateIndividualScores = async (e) => {
    e.preventDefault();
    if (!selectedProgramForScore) {
      alert('Please select a program.');
      return;
    }

    const updates = [];
    const assignedRanks = new Set();
    for (const participantId in participantRanks) {
      const rank = participantRanks[participantId];
      if (rank) { // Only process if a rank is selected
        // Frontend validation: Check for duplicate ranks
        if (assignedRanks.has(rank)) {
          alert(`Error: Rank ${rank} is assigned to multiple participants. Please ensure each rank (1st, 2nd, 3rd) is assigned to only one participant.`);
          return; // Stop the update process
        }
        assignedRanks.add(rank);

        const selectedParticipant = allTeamData.find(p => p.id === parseInt(participantId));
        if (!selectedParticipant) {
          console.warn(`Participant with ID ${participantId} not found.`);
          continue;
        }

        const programCategory = getProgramCategory(selectedProgramForScore);
        if (!programCategory) {
          console.warn(`Invalid program selected for participant ${participantId}. Cannot determine category.`);
          continue;
        }

        const scoreToAssign = RANK_SCORES[programCategory]?.[rank];
        if (scoreToAssign === undefined) {
          console.warn(`Score not defined for ${programCategory} - ${rank} for participant ${participantId}.`);
          continue;
        }

        updates.push({
          participantId: parseInt(participantId),
          program: selectedProgramForScore,
          score: scoreToAssign,
          team: selectedParticipant.team,
        });
      }
    }

    if (updates.length === 0) {
      alert('No ranks selected to update.');
      return;
    }

    try {
      const results = await Promise.all(updates.map(async (update) => {
        const response = await fetch(`/api/participantscores/${update.participantId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            program: update.program,
            score: update.score,
            team: update.team,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update score for participant ${update.participantId}`);
        }
        return response.json();
      }));

      alert('All selected individual participant scores updated successfully!');
      setSelectedProgramForScore('');
      setParticipantRanks({});
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating individual scores:', error);
      alert(`Error updating individual scores: ${error.message}`);
    }
  };

  const handleUpdateParticipantData = async (participantId) => {
    if (!editedPrograms || editedPrograms.length === 0) {
      alert('Please select at least one program for the participant.');
      return;
    }

    // Frontend validation for Category B events participation limit
    const categoryBEventsCount = editedPrograms.filter(program => CATEGORY_B_EVENTS.includes(program)).length;
    if (categoryBEventsCount > 3) {
      alert('Category B participants can register for a maximum of 3 events.');
      return;
    }

    const originalParticipant = allTeamData.find(p => p.id === participantId);
    if (!originalParticipant) {
      alert('Original participant data not found.');
      return;
    }

    const updatedParticipant = {
      ...originalParticipant, // Keep existing data
      team: allTeamData.find(p => p.id === participantId).team, // Get the updated team name from state
      programs: editedPrograms,
    };

    try {
      const response = await fetch(`/api/teamdata/${participantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedParticipant),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update participant data');
      }

      alert('Participant data updated successfully!');
      setEditingParticipantId(null); // Exit editing mode
      setEditedPrograms([]);
      setAvailableProgramsForAssignment([]);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating participant data:', error);
      alert(`Error updating participant data: ${error.message}`);
    }
  };

  const handleEditClick = (participant) => {
    setEditingParticipantId(participant.id);
    setEditedChessNumber(participant.chessNumber);
    setEditedPrograms(participant.programs);

    // Set available programs to all programs for direct selection
    setAvailableProgramsForAssignment([...CATEGORY_A_EVENTS, ...CATEGORY_B_EVENTS]);
  };

  const handleCancelEdit = () => {
    setEditingParticipantId(null);
    setEditedChessNumber('');
    setEditedPrograms([]);
    setAvailableProgramsForAssignment([]);
  };

  const filteredEventSchedule = React.useMemo(() => {
    if (selectedEventCategoryFilter === 'All') {
      return eventSchedule;
    }
    return eventSchedule.filter(event => event.category === selectedEventCategoryFilter);
  }, [eventSchedule, selectedEventCategoryFilter]);


  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Admin Portal</h2>

      {/* Management Options Section */}
      <section className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
        <h3 className="text-2xl font-semibold mb-4 text-blue-600">Management Options</h3>

        {/* Admin Event Panel */}
        <AdminEventPanel />

        {/* Update Cricket Matches Option */}
        <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
          <h4 className="text-xl font-bold mb-3 text-gray-800">Update Cricket Matches</h4>
          <form onSubmit={handleUpdateCricketMatches} className="grid grid-cols-1 gap-4">
            {cricketMatchesInput.map(match => (
              <div key={match.id} className="p-4 border rounded-lg bg-gray-100">
                <div className="mb-3 flex justify-between items-center">
                  <label htmlFor={`match-${match.id}-id`} className="block text-gray-700 text-sm font-medium mb-1">Match ID:</label>
                  <input
                    type="number"
                    id={`match-${match.id}-id`}
                    className="shadow appearance-none border rounded w-20 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                    value={match.id}
                    onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, id: parseInt(e.target.value, 10) } : m))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCricketMatch(match.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                  >
                    Delete Match
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Team 1 Inputs */}
                  <div className="p-3 border rounded-lg bg-white">
                    <div className="mb-2">
                      <label htmlFor={`match-${match.id}-team1-name`} className="block text-gray-700 text-sm font-medium mb-1">Team 1 Name:</label>
                      <input
                        type="text"
                        id={`match-${match.id}-team1-name`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team1.name}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team1: { ...m.team1, name: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`match-${match.id}-team1-runs`} className="block text-gray-700 text-sm font-medium mb-1">Runs:</label>
                      <input
                        type="number"
                        id={`match-${match.id}-team1-runs`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team1.runs}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team1: { ...m.team1, runs: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`match-${match.id}-team1-wickets`} className="block text-gray-700 text-sm font-medium mb-1">Wickets:</label>
                      <input
                        type="number"
                        id={`match-${match.id}-team1-wickets`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team1.wickets}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team1: { ...m.team1, wickets: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`match-${match.id}-team1-overs`} className="block text-gray-700 text-sm font-medium mb-1">Overs:</label>
                      <input
                        type="number"
                        step="0.1"
                        id={`match-${match.id}-team1-overs`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team1.overs}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team1: { ...m.team1, overs: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`match-${match.id}-team1-status`} className="block text-gray-700 text-sm font-medium mb-1">Status:</label>
                      <select
                        id={`match-${match.id}-team1-status`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team1.status}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team1: { ...m.team1, status: e.target.value } } : m))}
                      >
                        <option value="Yet to bat">Yet to bat</option>
                        <option value="Batting">Batting</option>
                        <option value="All Out">All Out</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Team 2 Inputs */}
                  <div className="p-3 border rounded-lg bg-white">
                    <div className="mb-2">
                      <label htmlFor={`match-${match.id}-team2-name`} className="block text-gray-700 text-sm font-medium mb-1">Team 2 Name:</label>
                      <input
                        type="text"
                        id={`match-${match.id}-team2-name`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team2.name}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team2: { ...m.team2, name: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`match-${match.id}-team2-runs`} className="block text-gray-700 text-sm font-medium mb-1">Runs:</label>
                      <input
                        type="number"
                        id={`match-${match.id}-team2-runs`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team2.runs}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team2: { ...m.team2, runs: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`match-${match.id}-team2-wickets`} className="block text-gray-700 text-sm font-medium mb-1">Wickets:</label>
                      <input
                        type="number"
                        id={`match-${match.id}-team2-wickets`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team2.wickets}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team2: { ...m.team2, wickets: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`match-${match.id}-team2-overs`} className="block text-gray-700 text-sm font-medium mb-1">Overs:</label>
                      <input
                        type="number"
                        step="0.1"
                        id={`match-${match.id}-team2-overs`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team2.overs}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team2: { ...m.team2, overs: e.target.value } } : m))}
                        required
                      />
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`match-${match.id}-team2-status`} className="block text-gray-700 text-sm font-medium mb-1">Status:</label>
                      <select
                        id={`match-${match.id}-team2-status`}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        value={match.team2.status}
                        onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, team2: { ...m.team2, status: e.target.value } } : m))}
                      >
                        <option value="Yet to bat">Yet to bat</option>
                        <option value="Batting">Batting</option>
                        <option value="All Out">All Out</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Match Status and Toss Decision */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`match-${match.id}-matchStatus`} className="block text-gray-700 text-sm font-medium mb-1">Match Status:</label>
                    <select
                      id={`match-${match.id}-matchStatus`}
                      className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      value={match.matchStatus}
                      onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, matchStatus: e.target.value } : m))}
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Live">Live</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`match-${match.id}-tossDecision`} className="block text-gray-700 text-sm font-medium mb-1">Toss Decision:</label>
                    <input
                      type="text"
                      id={`match-${match.id}-tossDecision`}
                      className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      value={match.tossDecision}
                      onChange={(e) => setCricketMatchesInput(prev => prev.map(m => m.id === match.id ? { ...m, tossDecision: e.target.value } : m))}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="md:col-span-1 flex justify-end mt-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Update Cricket Matches
              </button>
            </div>
          </form>
          {lastCricketUpdateTime && (
            <p className="text-sm text-gray-600 mt-2 text-right">
              Last updated: {lastCricketUpdateTime}
            </p>
          )}

          {/* Add New Cricket Match */}
          <div className="mt-8 p-4 border rounded-lg bg-gray-100 shadow-sm">
            <h5 className="text-xl font-bold mb-3 text-gray-800">Add New Cricket Match</h5>
            <form onSubmit={handleAddCricketMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-match-team1-name" className="block text-gray-700 text-sm font-medium mb-1">Team 1 Name:</label>
                <input
                  type="text"
                  id="new-match-team1-name"
                  className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  value={newCricketMatch.team1Name}
                  onChange={(e) => setNewCricketMatch(prev => ({ ...prev, team1Name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="new-match-team2-name" className="block text-gray-700 text-sm font-medium mb-1">Team 2 Name:</label>
                <input
                  type="text"
                  id="new-match-team2-name"
                  className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  value={newCricketMatch.team2Name}
                  onChange={(e) => setNewCricketMatch(prev => ({ ...prev, team2Name: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2 flex justify-end mt-4">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Add Match
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Individual Score Adding Option (Bulk Entry) */}
        <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
          <h4 className="text-xl font-bold mb-3 text-gray-800">Update Program Scores (Bulk Entry)</h4>
          <form onSubmit={handleUpdateIndividualScores} className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="selectProgramForScore" className="block text-gray-700 text-sm font-medium mb-2">Select Program:</label>
              <select
                id="selectProgramForScore"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={selectedProgramForScore}
                onChange={(e) => setSelectedProgramForScore(e.target.value)}
                required
              >
                <option value="">Select Program</option>
                {Object.keys(CATEGORIES).map(category => (
                  <optgroup key={category} label={category}>
                    {CATEGORIES[category].map(eventName => (
                      <option key={eventName} value={eventName}>{eventName}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {selectedProgramForScore && participantsInSelectedProgram.length > 0 && (
              <div className="md:col-span-2 mt-4">
                <h5 className="text-lg font-semibold mb-2 text-gray-700">Participants in {selectedProgramForScore}:</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Name</th>
                        <th className="py-2 px-4 border-b text-left">Team</th>
                        <th className="py-2 px-4 border-b text-left">Chess No.</th>
                        <th className="py-2 px-4 border-b text-left">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantsInSelectedProgram.map(participant => (
                        <tr key={participant.id}>
                          <td className="py-2 px-4 border-b">{participant.name}</td>
                          <td className="py-2 px-4 border-b">{participant.team}</td>
                          <td className="py-2 px-4 border-b">{participant.chessNumber}</td>
                          <td className="py-2 px-4 border-b">
                            <select
                              className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                              value={participantRanks[participant.id] || ''}
                              onChange={(e) => handleRankChange(participant.id, e.target.value)}
                            >
                              <option value="">Select Rank</option>
                              <option value="1st">1st Place</option>
                              <option value="2nd">2nd Place</option>
                              <option value="3rd">3rd Place</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedProgramForScore && participantsInSelectedProgram.length === 0 && (
              <p className="md:col-span-2 text-gray-600">No participants registered for this program.</p>
            )}

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={!selectedProgramForScore || participantsInSelectedProgram.length === 0}
              >
                Update All Scores
              </button>
            </div>
          </form>
        </div>

        {/* All Participants Data Table */}
        <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
          <h4 className="text-xl font-bold mb-3 text-gray-800">All Participant Data</h4>
          <div className="flex justify-between items-center mb-4">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by Program, Name, Team, or Chess Number..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
            >
              Refresh Data
            </button>
            <button
              onClick={handleExportAllParticipantDataToExcel}
              className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Download All Participant Data (Excel)
            </button>
          </div>
          {allTeamData.length === 0 ? (
            <p>No participant data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Team</th>
                    <th className="py-2 px-4 border-b text-left">Chess Number</th>
                    <th className="py-2 px-4 border-b text-left">Programs</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTeamData.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{participant.id}</td>
                      <td className="py-2 px-4 border-b">
                        {participant.name}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {editingParticipantId === participant.id ? (
                          <div>
                            <label htmlFor={`team-${participant.id}`} className="block text-gray-700 text-xs font-medium mb-1">Team:</label>
                            <input
                              type="text"
                              id={`team-${participant.id}`}
                              className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-xs"
                              value={participant.team}
                              onChange={(e) => setAllTeamData(prev => prev.map(p => p.id === participant.id ? { ...p, team: e.target.value } : p))}
                            />
                          </div>
                        ) : (
                          participant.team
                        )}
                      </td>
                      <td className="py-2 px-4 border-b">{participant.chessNumber}</td>
                      <td className="py-2 px-4 border-b">
                        {editingParticipantId === participant.id ? (
                          <div>
                            <label htmlFor={`programs-${participant.id}`} className="block text-gray-700 text-xs font-medium mb-1">Programs:</label>
                            <textarea
                              id={`programs-${participant.id}`}
                              className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-20 text-xs"
                              value={editedPrograms.join(', ')}
                              onChange={(e) => setEditedPrograms(e.target.value.split(',').map(p => p.trim()))}
                            ></textarea>
                          </div>
                        ) : (
                          participant.programs.join(', ')
                        )}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {editingParticipantId === participant.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateParticipantData(participant.id)}
                              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditClick(participant)}
                              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(participant.id)}
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Team Scores Display (Admin View) */}
      <section className="mt-8 p-4 border rounded-lg shadow-sm bg-gray-50">
        <h3 className="text-2xl font-semibold mb-4 text-blue-600">Current Team Scores</h3>
        {teamScores.length === 0 ? (
          <p className="text-gray-600">No team scores available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-3 px-4 border-b text-left text-blue-800">Team</th>
                  <th className="py-3 px-4 border-b text-left text-blue-800">Score</th>
                </tr>
              </thead>
              <tbody>
                {teamScores.map((team) => (
                  <tr key={team.team} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{team.team}</td>
                    <td className="py-2 px-4 border-b">{team.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
    </>
  );
}

export default AdminPortal;
