import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const CATEGORY_A_EVENTS = [
  'Football', 'Cricket', 'Volleyball', 'Badminton', 'Tug of War', '4x200 Relay', '4x100 Relay', 'Shoot Out'
];

const CATEGORY_B_EVENTS = [
  '100 mtr', '200 mtr', '400 mtr', '800 mtr', '1500 mtr', '1000 mtr (Walking)', 'Javelin Throw',
  'Discus Throw', 'Shot Put', 'Long Jump', 'Triple Jump', 'High Jump', 'Push Up', 'Arm Wrestling',
  '3000 mtr', 'Chess'
];

function AdminPortal() {
  const [allTeamData, setAllTeamData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const fetchTeamData = () => {
    fetch('/api/teamdata')
      .then(response => response.json())
      .then(data => {
        // Sort data by team and then by chess number
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
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleRefresh = () => {
    fetchTeamData();
  };

  const handleUpdate = (id) => {
    const entryToUpdate = allTeamData.find(entry => entry.id === id);
    if (!entryToUpdate) return;

    fetch(`/api/teamdata/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryToUpdate),
    })
      .then(response => response.json())
      .then(() => {
        console.log('Team data updated successfully!');
        fetchTeamData(); // Re-fetch data to ensure consistency
      })
      .catch(error => console.error('Error updating team data:', error));
  };

  const handleDelete = (id) => {
    fetch(`/api/teamdata/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        console.log('Team data deleted successfully!');
        fetchTeamData(); // Re-fetch data to update the table
      })
      .catch(error => console.error('Error deleting team data:', error));
  };

  const handleEdit = (id, field, value) => {
    setAllTeamData(prevData =>
      prevData.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
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

  const filteredData = sortedData.filter(entry =>
    Object.values(entry).some(val => {
      if (Array.isArray(val)) {
        return val.some(item => String(item).toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const handleExportToExcel = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const formattedData = filteredData.map(entry => ({
      Team: entry.team,
      'Chess Number': entry.chessNumber,
      Name: entry.name,
      Programs: entry.programs.join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    saveAs(data, 'TeamData_AdminPortal' + fileExtension);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Admin Portal - All Teams Data</h2>

      <div className="flex justify-between items-center mb-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by Chess Number, Name, Program, or Team..."
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
          onClick={handleExportToExcel}
          className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Download Excel
        </button>
      </div>

      {/* Data Table */}
      {filteredData.length === 0 ? (
        <p>No data available or matches your search.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left cursor-pointer" onClick={() => requestSort('team')}>
                  Team {sortConfig.key === 'team' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                </th>
                <th className="py-2 px-4 border-b text-left cursor-pointer" onClick={() => requestSort('chessNumber')}>
                  Chess Number {sortConfig.key === 'chessNumber' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                </th>
                <th className="py-2 px-4 border-b text-left cursor-pointer" onClick={() => requestSort('name')}>
                  Name {sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                </th>
                <th className="py-2 px-4 border-b text-left">Programs</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{entry.team}</td>
                  <td className="py-2 px-4 border-b">
                    <input
                      type="text"
                      value={entry.chessNumber}
                      readOnly
                      className="w-full p-1 border rounded focus:outline-none focus:shadow-outline bg-gray-100"
                    />
                  </td>
                  <td className="py-2 px-4 border-b">
                    <input
                      type="text"
                      value={entry.name}
                      onChange={(e) => handleEdit(entry.id, 'name', e.target.value)}
                      className="w-full p-1 border rounded focus:outline-none focus:shadow-outline"
                    />
                  </td>
                  <td className="py-2 px-4 border-b">
                    <input
                      type="text"
                      value={entry.programs.join(', ')}
                      onChange={(e) => handleEdit(entry.id, 'programs', e.target.value.split(',').map(item => item.trim()))}
                      className="w-full p-1 border rounded focus:outline-none focus:shadow-outline"
                    />
                    <button
                      onClick={() => handleUpdate(entry.id)}
                      className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                      Update
                    </button>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPortal;
