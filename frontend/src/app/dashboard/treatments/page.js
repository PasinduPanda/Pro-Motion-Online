'use client';

import { useEffect, useState, useRef } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { Plus, Activity, Image, Trash2, Dumbbell } from 'lucide-react';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    treatmentPlan: '',
    startDate: '',
    endDate: '',
    exercises: []
  });

  useEffect(() => {
    fetchTreatments();
    fetchPatients();
    fetchExercises();
  }, []);

  const fetchTreatments = async () => {
    try {
      const res = await axios.get(`${API_URL}/treatments`);
      setTreatments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API_URL}/patients`);
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await axios.get(`${API_URL}/exercises`);
      setExercises(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData2 = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'exercises') {
          if (formData.exercises.length > 0) {
            formData2.append('exercises', JSON.stringify(formData.exercises));
          }
        } else {
          formData2.append(key, formData[key]);
        }
      });
      if (file) {
        formData2.append('diagnosisImage', file);
      }

      await axios.post(`${API_URL}/treatments`, formData2, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      setFormData({ patientId: '', diagnosis: '', treatmentPlan: '', startDate: '', endDate: '', exercises: [] });
      setFile(null);
      setPreview(null);
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
          <p className="text-gray-500">Manage treatment plans with diagnosis images</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          New Treatment
        </button>
      </div>

      <div className="space-y-4">
        {treatments.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">No treatments found</div>
        ) : (
          treatments.map((treatment) => (
            <div key={treatment.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  {treatment.diagnosisImage ? (
                    <img 
                      src={`${API_URL.replace('/api')}${treatment.diagnosisImage}`}
                      alt="Diagnosis" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{treatment.patient?.fullName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{treatment.diagnosis}</p>
                    <p className="text-sm text-gray-500 mt-1">Therapist: {treatment.therapist?.name}</p>
                    {treatment.treatmentExercises?.length > 0 && (
                      <div className="flex items-center mt-2 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full w-fit border border-primary-100">
                        <Dumbbell className="w-3 h-3 mr-1" />
                        {treatment.treatmentExercises.length} Exercises Assigned
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    treatment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {treatment.status}
                  </span>
                  {treatment.status === 'active' && (
                    <button onClick={() => handleStatusChange(treatment.id, 'completed')} className="text-xs text-primary-600 hover:text-primary-800">
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
                <select value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} className="input" required>
                  <option value="">Select patient</option>
                  {patients.map((p) => (<option key={p.id} value={p.id}>{p.fullName}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <textarea value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} className="input" rows={2} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Image (X-ray, MRI, etc.)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="input p-2" />
                {preview && (
                  <img src={preview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
                <textarea value={formData.treatmentPlan} onChange={(e) => setFormData({...formData, treatmentPlan: e.target.value})} className="input" rows={3} required />
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Exercises Assigned</h3>
                  <button type="button" onClick={addExerciseToForm} className="text-sm text-primary-600 hover:text-primary-800 flex items-center font-medium">
                    <Plus className="w-4 h-4 mr-1" /> Add Exercise
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.exercises.map((ex, index) => (
                    <div key={index} className="flex items-end space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Exercise</label>
                        <select value={ex.exerciseId} onChange={(e) => updateExerciseInForm(index, 'exerciseId', e.target.value)} className="input text-sm" required>
                          <option value="">Select exercise</option>
                          {exercises.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Sets</label>
                        <input type="number" value={ex.sets} onChange={(e) => updateExerciseInForm(index, 'sets', parseInt(e.target.value))} className="input text-sm text-center" min="1" />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Reps</label>
                        <input type="number" value={ex.reps} onChange={(e) => updateExerciseInForm(index, 'reps', parseInt(e.target.value))} className="input text-sm text-center" min="1" />
                      </div>
                      <button type="button" onClick={() => removeExerciseFromForm(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {formData.exercises.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No exercises assigned to this plan.</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="input" />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}