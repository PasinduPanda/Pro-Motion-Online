'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { Plus, Search, Activity, Clock } from 'lucide-react';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    treatmentPlan: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTreatments();
    fetchPatients();
  }, []);

  const fetchTreatments = async () => {
    try {
      const res = await axios.get(`${API_URL}/treatments`, { limit: 100 });
      setTreatments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API_URL}/patients`, { limit: 100 });
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/treatments`, formData);
      setShowModal(false);
      setFormData({
        patientId: '',
        diagnosis: '',
        treatmentPlan: '',
        startDate: '',
        endDate: '',
      });
      fetchTreatments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create treatment');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${API_URL}/treatments/${id}`, { status });
      fetchTreatments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update treatment');
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Treatments</h1>
          <p className="text-gray-500">Manage treatment plans</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          New Treatment
        </button>
      </div>

      <div className="space-y-4">
        {treatments.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">
            No treatments found
          </div>
        ) : (
          treatments.map((treatment) => (
            <div key={treatment.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{treatment.patient?.fullName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{treatment.diagnosis}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Therapist: {treatment.therapist?.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Sessions: {treatment._count?.sessions || 0}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      treatment.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {treatment.status}
                  </span>
                  {treatment.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(treatment.id, 'completed')}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">New Treatment Plan</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="input"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
                <textarea
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className="input"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                  />
                </div>
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