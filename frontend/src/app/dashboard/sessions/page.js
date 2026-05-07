'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { Plus, Clock, Search, Trash2, Dumbbell, Calendar, ChevronRight, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    treatmentId: '',
    sessionDate: format(new Date(), 'yyyy-MM-dd'),
    painLevel: 5,
    notes: '',
    nextSessionDate: '',
    exercises: [] // { exerciseId, sets, reps }
  });

  useEffect(() => {
    fetchSessions();
    fetchTreatments();
    fetchExercises();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_URL}/sessions/all`, { params: { limit: 50 } });
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatments = async () => {
    try {
      const res = await axios.get(`${API_URL}/treatments`, { params: { status: 'active' } });
      setTreatments(res.data);
    } catch (err) {
      console.error('Failed to fetch treatments:', err);
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await axios.get(`${API_URL}/exercises`);
      setExercises(res.data);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/sessions`, formData);
      setShowModal(false);
      resetForm();
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create session');
    }
  };

  const resetForm = () => {
    setFormData({
      treatmentId: '',
      sessionDate: format(new Date(), 'yyyy-MM-dd'),
      painLevel: 5,
      notes: '',
      nextSessionDate: '',
      exercises: []
    });
  };

  const addExerciseToForm = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { exerciseId: '', sets: 3, reps: 10 }]
    });
  };

  const removeExerciseFromForm = (index) => {
    const newEx = [...formData.exercises];
    newEx.splice(index, 1);
    setFormData({ ...formData, exercises: newEx });
  };

  const updateExerciseInForm = (index, field, value) => {
    const newEx = [...formData.exercises];
    newEx[index][field] = value;
    setFormData({ ...formData, exercises: newEx });
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
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500">Record and track treatment sessions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Record Session
        </button>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="card text-center py-12 text-gray-500 bg-gray-50 border-dashed border-2">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No sessions recorded yet.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600 h-fit">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900">
                        {session.treatment?.patient?.fullName || 'Unknown Patient'}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        {format(new Date(session.sessionDate), 'PPP')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{session.notes || 'No notes provided.'}</p>
                    <div className="flex items-center mt-3 space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Activity className="w-4 h-4 mr-1 text-red-500" />
                        Pain Level: <span className="font-bold text-gray-900 ml-1">{session.painLevel}/10</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Dumbbell className="w-4 h-4 mr-1 text-primary-600" />
                        Exercises: <span className="font-bold text-gray-900 ml-1">{session.sessionExercises?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-gray-400 block uppercase">Therapist</span>
                  <span className="text-sm font-semibold text-gray-700">{session.therapist?.name}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Record Session</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active Treatment</label>
                  <select
                    value={formData.treatmentId}
                    onChange={(e) => setFormData({ ...formData, treatmentId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select treatment</option>
                    {treatments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.patient?.fullName} - {t.diagnosis}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
                  <input
                    type="date"
                    value={formData.sessionDate}
                    onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pain Level (1-10): <span className="font-bold text-primary-600">{formData.painLevel}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.painLevel}
                  onChange={(e) => setFormData({ ...formData, painLevel: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Progress, patient feedback, etc."
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Exercises Assigned</h3>
                  <button
                    type="button"
                    onClick={addExerciseToForm}
                    className="text-sm text-primary-600 hover:text-primary-800 flex items-center font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Exercise
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.exercises.map((ex, index) => (
                    <div key={index} className="flex items-end space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Exercise</label>
                        <select
                          value={ex.exerciseId}
                          onChange={(e) => updateExerciseInForm(index, 'exerciseId', e.target.value)}
                          className="input text-sm"
                          required
                        >
                          <option value="">Select exercise</option>
                          {exercises.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Sets</label>
                        <input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExerciseInForm(index, 'sets', parseInt(e.target.value))}
                          className="input text-sm text-center"
                          min="1"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Reps</label>
                        <input
                          type="number"
                          value={ex.reps}
                          onChange={(e) => updateExerciseInForm(index, 'reps', parseInt(e.target.value))}
                          className="input text-sm text-center"
                          min="1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExerciseFromForm(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {formData.exercises.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No exercises assigned to this session.</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
