import React, { useState, useEffect } from 'react';

const CATEGORY_A_EVENTS = [
  'Football', 'Cricket', 'Volleyball', 'Badminton', 'Tug of War', '4x200 Relay', '4x100 Relay', 'Shoot Out'
];

const CATEGORY_B_EVENTS = [
  '100 mtr', '200 mtr', '400 mtr', '800 mtr', '1500 mtr', '1000 mtr (Walking)', 'Javelin Throw',
  'Discus Throw', 'Shot Put', 'Long Jump', 'Triple Jump', 'High Jump', 'Push Up', 'Arm Wrestling',
  '3000 mtr', 'Chess'
];

function TeamLeaderPortal({ teamName }) {
  const [chessNumber, setChessNumber] = useState('');
  const [name, setName] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    // Fetch data from the server
    fetch('/api/teamdata')
      .then(response => response.json())
      .then(data => {
        // Filter data for the specific team
        const teamSpecificData = data.filter(entry => entry.team === teamName);
        setTeamData(teamSpecificData);
      })
      .catch(error => console.error('Error fetching team data:', error));
  }, [teamName]);

  const handleProgramChange = (event) => {
    const { value, checked } = event.target;
    let newSelectedPrograms;

    if (checked) {
      // Check if it's a B category event and if the limit is reached
      if (CATEGORY_B_EVENTS.includes(value)) {
        const bCategorySelections = selectedPrograms.filter(p => CATEGORY_B_EVENTS.includes(p));
        if (bCategorySelections.length >= 3) {
          alert('Maximum 3 items allowed for B Category events.');
          return;
        }
      }
      newSelectedPrograms = [...selectedPrograms, value];
    } else {
      newSelectedPrograms = selectedPrograms.filter((program) => program !== value);
    }
    setSelectedPrograms(newSelectedPrograms);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chessNumber || !name || selectedPrograms.length === 0) {
      alert('Please fill in all fields and select at least one program.');
      return;
    }

    const chessNum = parseInt(chessNumber, 10);
    if (isNaN(chessNum)) {
      alert('Chess Number must be a valid number.');
      return;
    }

    // Check if chess number already exists for this team
    if (teamData.some(entry => entry.chessNumber === chessNumber)) {
      alert('This chess number already exists for your team. Please use a unique chess number.');
      return;
    }

    // Chess number validation based on teamName
    if (teamName === 'Usooludheen') {
      if (chessNum < 100 || chessNum > 199) {
        alert('For Usooludheen, Chess Number must be between 100 and 199.');
        return;
      }
    } else if (teamName === 'Shareea') {
      if (chessNum < 200 || chessNum > 299) {
        alert('For Shareea, Chess Number must be between 200 and 299.');
        return;
      }
    } else if (teamName === 'Luga Wal Halara') {
      if (chessNum < 300 || chessNum > 399) {
        alert('For Luga Wal Halara, Chess Number must be between 300 and 399.');
        return;
      }
    }

    const newData = {
      id: teamData.length > 0 ? Math.max(...teamData.map(d => d.id)) + 1 : 1, // Unique ID for each entry
      team: teamName,
      chessNumber,
      name,
      programs: selectedPrograms,
    };

    // Send data to the server
    fetch('/api/teamdata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newData),
    })
      .then(response => response.json())
      .then(addedEntry => {
        setTeamData([...teamData, addedEntry]);
        setChessNumber('');
        setName('');
        setSelectedPrograms([]);
      })
      .catch(error => console.error('Error adding team data:', error));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold mb-4">{teamName} Portal</h2>

      {/* Data Entry Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label htmlFor="chessNumber" className="block text-gray-700 text-sm font-bold mb-2">
            Chess Number:
          </label>
          <input
            type="text"
            id="chessNumber"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={chessNumber}
            onChange={(e) => setChessNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Name:
          </label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Programs:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🅰 CATEGORY</h4>
              {CATEGORY_A_EVENTS.map((event) => (
                <div key={event} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={event}
                    value={event}
                    checked={selectedPrograms.includes(event)}
                    onChange={handleProgramChange}
                    className="mr-2"
                  />
                  <label htmlFor={event}>{event}</label>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-2">🅱 CATEGORY (Max 3 items)</h4>
              {CATEGORY_B_EVENTS.map((event) => (
                <div key={event} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={event}
                    value={event}
                    checked={selectedPrograms.includes(event)}
                    onChange={handleProgramChange}
                    className="mr-2"
                  />
                  <label htmlFor={event}>{event}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Entry
          </button>
        </div>
      </form>

      {/* Data Table */}
      <h3 className="text-xl font-bold mb-3">Team Data</h3>
      {teamData.length === 0 ? (
        <p>No data entered for {teamName} yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Chess Number</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Programs</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{entry.chessNumber}</td>
                  <td className="py-2 px-4 border-b">{entry.name}</td>
                  <td className="py-2 px-4 border-b">{entry.programs.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TeamLeaderPortal;
