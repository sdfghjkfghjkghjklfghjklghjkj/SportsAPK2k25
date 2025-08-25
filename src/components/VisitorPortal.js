import React, { useState, useEffect } from 'react';
import moment from 'moment'; // Import moment for date/time handling

function VisitorPortal() {
  const [teamScores, setTeamScores] = useState([]); // For general team scores
  const [cricketScores, setCricketScores] = useState([]); // For cricket specific scores
  const [top10Participants, setTop10Participants] = useState([]);
  const [eventSchedule, setEventSchedule] = useState([]);
  const [categorizedEvents, setCategorizedEvents] = useState({
    live: [],
    upcoming: [],
    expired: [],
  });

  const fetchAllData = () => {
    // Fetch General Team Scores
    fetch('/api/teamscores')
      .then(response => response.json())
      .then(data => setTeamScores(data))
      .catch(error => console.error('Error fetching general team scores:', error));

    // Fetch Cricket Scores
    fetch('/api/cricketscores')
      .then(response => response.json())
      .then(data => setCricketScores(data))
      .catch(error => console.error('Error fetching cricket scores:', error));

    // Fetch Top 10 Individual Participant Scores
    fetch('/api/top10participants')
      .then(response => response.json())
      .then(data => setTop10Participants(data))
      .catch(error => console.error('Error fetching top 10 participants:', error));

    // Fetch Event Schedule
    fetch('/api/events')
      .then(response => response.json())
      .then(data => setEventSchedule(data))
      .catch(error => console.error('Error fetching event schedule:', error));
  };

  useEffect(() => {
    fetchAllData();
    // Refresh data every minute to update live/upcoming/expired status
    const intervalId = setInterval(fetchAllData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const now = moment();
    const live = [];
    const upcoming = [];
    const expired = [];

    eventSchedule.forEach(event => {
      const eventStart = moment(`${event.date} ${event.time}`);
      const eventEnd = moment(`${event.date} ${event.endTime}`);

      if (now.isBetween(eventStart, eventEnd)) {
        live.push(event);
      } else if (now.isBefore(eventStart)) {
        upcoming.push(event);
      } else {
        expired.push(event);
      }
    });

    setCategorizedEvents({ live, upcoming, expired });
  }, [eventSchedule]);

  const renderEventTable = (events, title, statusClass) => (
    <div className="mb-6">
      <h4 className={`text-xl font-semibold mb-3 ${statusClass}`}>{title}</h4>
      {events.length === 0 ? (
        <p className="text-gray-600">No {title.toLowerCase()} events.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-blue-100">
                <th className="py-3 px-4 border-b text-left text-blue-800">Category</th>
                <th className="py-3 px-4 border-b text-left text-blue-800">Event Name</th>
                <th className="py-3 px-4 border-b text-left text-blue-800">Date</th>
                <th className="py-3 px-4 border-b text-left text-blue-800">Time</th>
                <th className="py-3 px-4 border-b text-left text-blue-800">End Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{event.category}</td>
                  <td className="py-2 px-4 border-b">{event.name}</td>
                  <td className="py-2 px-4 border-b">{moment(event.date).format('YYYY-MM-DD')}</td>
                  <td className="py-2 px-4 border-b">{event.time}</td>
                  <td className="py-2 px-4 border-b">{event.endTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Live Sports Updates</h2>

      {/* Cricket Match Scores Section */}
      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-blue-600">Cricket Match Scores</h3>
        {cricketScores.length === 0 ? (
          <p className="text-gray-600">No cricket matches available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cricketScores.map((match) => (
              <div key={match.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-bold text-gray-800">Match ID: {match.id}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    match.matchStatus === 'Live' ? 'bg-green-200 text-green-800' :
                    match.matchStatus === 'Upcoming' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {match.matchStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  {/* Team 1 Display */}
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <p className="text-xl font-bold text-blue-700 mb-1">{match.team1.name}</p>
                    <p className="text-2xl font-extrabold text-gray-800">{match.team1.runs}/{match.team1.wickets} <span className="text-sm text-gray-600">(Overs: {match.team1.overs})</span></p>
                    <p className="text-sm text-gray-600 mt-1">Status: {match.team1.status}</p>
                  </div>
                  {/* Team 2 Display */}
                  <div className="p-3 border rounded-lg bg-green-50">
                    <p className="text-xl font-bold text-green-700 mb-1">{match.team2.name}</p>
                    <p className="text-2xl font-extrabold text-gray-800">{match.team2.runs}/{match.team2.wickets} <span className="text-sm text-gray-600">(Overs: {match.team2.overs})</span></p>
                    <p className="text-sm text-gray-600 mt-1">Status: {match.team2.status}</p>
                  </div>
                </div>
                {match.tossDecision && (
                  <p className="text-center text-sm text-gray-700 mt-3">Toss: {match.tossDecision}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Other Team Scores Section (This section is now for general team scores, not cricket) */}
      {teamScores.length > 0 && (
        <section className="mb-8 mt-8">
          <h3 className="text-2xl font-semibold mb-4 text-blue-600">General Team Scores</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-3 px-4 border-b text-left text-blue-800">Team</th>
                  <th className="py-3 px-4 border-b text-left text-blue-800">Score</th>
                </tr>
              </thead>
              <tbody>
                {teamScores.map((team, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{team.team}</td>
                    <td className="py-2 px-4 border-b font-bold">{team.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Other Team Scores Section (if any other teams exist) */}
      {teamScores.filter(team => !['Usooludheen', 'Shareea', 'Luga Wal Halara'].includes(team.team)).length > 0 && (
        <section className="mb-8 mt-8">
          <h3 className="text-2xl font-semibold mb-4 text-blue-600">Other Team Scores</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-3 px-4 border-b text-left text-blue-800">Team</th>
                  <th className="py-3 px-4 border-b text-left text-blue-800">Score</th>
                </tr>
              </thead>
              <tbody>
                {teamScores.filter(team => !['Usooludheen', 'Shareea', 'Luga Wal Halara'].includes(team.team)).map((team, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{team.team}</td>
                    <td className="py-2 px-4 border-b font-bold">{team.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top 10 Individual Participant Marks Section */}
      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-blue-600">Top 10 Individual Participant Marks</h3>
        {top10Participants.length === 0 ? (
          <p className="text-gray-600">No individual participant scores available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-3 px-4 border-b text-left text-blue-800">Rank</th>
                  <th className="py-3 px-4 border-b text-left text-blue-800">Name</th>
                  <th className="py-3 px-4 border-b text-left text-blue-800">Team</th>
                  <th className="py-3 px-4 border-b text-left text-blue-800">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {top10Participants.map((participant, index) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{participant.name}</td>
                    <td className="py-2 px-4 border-b">{participant.team}</td>
                    <td className="py-2 px-4 border-b font-bold">{participant.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Event Schedule Section */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-blue-600">Event Schedule</h3>
        {renderEventTable(categorizedEvents.live, 'Live Events', 'text-green-600 animate-pulse')}
        {renderEventTable(categorizedEvents.upcoming, 'Upcoming Events', 'text-yellow-600')}
        {renderEventTable(categorizedEvents.expired, 'Expired Events', 'text-red-600')}
      </section>
    </div>
  );
}

export default VisitorPortal;
