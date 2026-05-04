'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { Search, Plus, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formData, setFormData] = useState({
    patientId: '',
    therapistId: '',
    dateTime: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes, therapistsRes] = await Promise.all([
        axios.get(`${API_URL}/appointments`, { params: { date: selectedDate } }),
        axios.get(`${API_URL}/patients`, { limit: 100 }),
        axios.get(`${API_URL}/users`).catch(() => ({ data: [] })),
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data.patients || []);
      setTherapists(therapistsRes.data.filter((u) => u.role === 'therapist') || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dateTime: new Date(formData.dateTime).toISOString(),
      };
      await axios.post(`${API_URL}/appointments`, payload);
      setShowModal(false);
      setFormData({
        patientId: '',
        therapistId: '',
        dateTime: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create appointment');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${API_URL}/appointments/${id}`, { status });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update appointment');
    }
  };

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500">Manage patient appointments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          New Appointment
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg ${
                  isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-xs">{format(date, 'EEE')}</div>
                <div className="font-semibold">{format(date, 'd')}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">
            No appointments for this date
          </div>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{apt.patient?.fullName}</h3>
                    <p className="text-sm text-gray-500">{apt.therapist?.name}</p>
                    <p className="text-sm text-gray-500">{format(new Date(apt.dateTime), 'h:mm a')}</p>
                    {apt.notes && <p className="text-sm text-gray-600 mt-2">{apt.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={apt.status}
                    onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                    className={`text-sm rounded-full px-3 py-1 ${
                      apt.status === 'booked'
                        ? 'bg-yellow-100 text-yellow-800'
                        : apt.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">New Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Therapist</label>
                <select
                  value={formData.therapistId}
                  onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select therapist</option>
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}