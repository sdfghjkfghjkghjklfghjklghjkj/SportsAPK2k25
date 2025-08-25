import React, { useState, useEffect } from 'react';
import moment from 'moment';

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

const AdminEventPanel = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    category: '',
    name: '',
    date: '',
    time: '',
    endTime: '',
  });
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableEventNames, setAvailableEventNames] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name}, Value: ${value}`);
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setNewEvent(prev => ({ ...prev, category: category, name: '' })); // Reset event name when category changes
    setAvailableEventNames(CATEGORIES[category] || []);
  };

  const handleEventNameChange = (e) => {
    const name = e.target.value;
    setNewEvent(prev => ({ ...prev, name: name }));
  };

  const validateTimes = () => {
    if (newEvent.date && newEvent.time && newEvent.endTime) {
      const startDateTime = moment(`${newEvent.date} ${newEvent.time}`);
      const endDateTime = moment(`${newEvent.date} ${newEvent.endTime}`);
      if (endDateTime.isSameOrBefore(startDateTime)) {
        alert('End time must be after start time.');
        return false;
      }
    }
    return true;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.category || !newEvent.name) {
      alert('Please select both category and event name.');
      return;
    }
    if (!validateTimes()) {
      return;
    }
    console.log('Adding event with data:', newEvent);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });
      if (response.ok) {
        setNewEvent({ category: '', name: '', date: '', time: '', endTime: '' });
        fetchEvents();
      } else {
        console.error('Failed to add event');
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleEditClick = (event) => {
    console.log('Editing event:', event);
    setEditingEventId(event.id);
    setSelectedCategory(event.category);
    setAvailableEventNames(CATEGORIES[event.category] || []);
    setNewEvent({
      category: event.category,
      name: event.name,
      date: event.date,
      time: event.time,
      endTime: event.endTime,
    });
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!validateTimes()) {
      return;
    }
    console.log('Updating event with data:', newEvent);
    try {
      const response = await fetch(`/api/events/${editingEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });
      if (response.ok) {
        setEditingEventId(null);
        setNewEvent({ category: '', name: '', date: '', time: '', endTime: '' });
        setSelectedCategory('');
        setAvailableEventNames([]);
        fetchEvents();
      } else {
        console.error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchEvents();
      } else {
        console.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <div className="admin-event-panel p-4 bg-white shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Manage Events</h3>

      <form onSubmit={editingEventId ? handleUpdateEvent : handleAddEvent} className="mb-6 p-4 border rounded-md bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Category:</label>
            <select
              name="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Category</option>
              {Object.keys(CATEGORIES).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Event Name:</label>
            <select
              name="name"
              value={newEvent.name}
              onChange={handleEventNameChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={!selectedCategory}
            >
              <option value="">Select Event</option>
              {availableEventNames.map((eventName) => (
                <option key={eventName} value={eventName}>{eventName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
            <input
              type="date"
              name="date"
              value={newEvent.date}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Start Time:</label>
            <input
              type="time"
              name="time"
              value={newEvent.time}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">End Time:</label>
            <input
              type="time"
              name="endTime"
              value={newEvent.endTime}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {editingEventId ? 'Update Event' : 'Add Event'}
        </button>
        {editingEventId && (
          <button
            type="button"
            onClick={() => {
              setEditingEventId(null);
              setNewEvent({ category: '', name: '', date: '', time: '', endTime: '' });
              setSelectedCategory('');
              setAvailableEventNames([]);
            }}
            className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="event-list mt-6">
        <h4 className="text-lg font-semibold mb-3">Current Events</h4>
        {events.length === 0 ? (
          <p>No events scheduled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full w-full table-auto bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-center">ID</th>
                  <th className="py-2 px-4 border-b text-center">Category</th>
                  <th className="py-2 px-4 border-b text-center">Name</th>
                  <th className="py-2 px-4 border-b text-center">Date</th>
                  <th className="py-2 px-4 border-b text-center">Time</th>
                  <th className="py-2 px-4 border-b text-center">End Time</th>
                  <th className="py-2 px-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{event.id}</td>
                    <td className="py-2 px-4 border-b">{event.category}</td>
                    <td className="py-2 px-4 border-b">{event.name}</td>
                    <td className="py-2 px-4 border-b">{moment(event.date).format('YYYY-MM-DD')}</td>
                    <td className="py-2 px-4 border-b">{event.time}</td>
                    <td className="py-2 px-4 border-b">{event.endTime}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleEditClick(event)}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
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
    </div>
  );
};

export default AdminEventPanel;
