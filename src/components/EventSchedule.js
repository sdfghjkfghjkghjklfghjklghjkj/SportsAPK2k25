import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './EventSchedule.css'; // We'll create this CSS file next

const EventSchedule = () => {
  const [events, setEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    // Fetch events from the server
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events'); // Assuming an API endpoint for events
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();

    // Set up real-time auto-refresh
    const interval = setInterval(() => {
      setCurrentTime(moment());
      fetchEvents(); // Refresh events periodically
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const getEventState = (event) => {
    const eventStart = moment(`${event.date} ${event.time}`);
    const eventEnd = moment(`${event.date} ${event.endTime}`);

    if (currentTime.isBefore(eventStart)) {
      return 'upcoming';
    } else if (currentTime.isBetween(eventStart, eventEnd)) {
      return 'live';
    } else {
      return 'expired';
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const dateTimeA = moment(`${a.date} ${a.time}`);
    const dateTimeB = moment(`${b.date} ${b.time}`);
    return dateTimeA.diff(dateTimeB);
  });

  return (
    <div className="event-schedule-container">
      <h2>Event Schedule</h2>
      <div className="event-list">
        {sortedEvents.map((event) => {
          const state = getEventState(event);
          return (
            <div key={event.id} className={`event-card ${state}`}>
              <div className="event-header">
                <h3>{event.name}</h3>
                {state === 'live' && <span className="live-indicator">LIVE</span>}
              </div>
              <p><strong>Category:</strong> {event.category}</p>
              <p><strong>Date:</strong> {moment(event.date).format('MMMM Do YYYY')}</p>
              <p><strong>Time:</strong> {moment(event.time, 'HH:mm').format('h:mm A')} - {moment(event.endTime, 'HH:mm').format('h:mm A')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventSchedule;
