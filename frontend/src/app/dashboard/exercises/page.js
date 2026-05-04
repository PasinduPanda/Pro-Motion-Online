'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, Dumbbell, ExternalLink } from 'lucide-react';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    videoUrl: '',
  });

  useEffect(() => {
    fetchExercises();
  }, [search]);

  const fetchExercises = async () => {
    try {
      const res = await axios.get(`${API_URL}/exercises`, {
        params: { search },
      });
      setExercises(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/exercises`, formData);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        videoUrl: '',
      });
      fetchExercises();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create exercise');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    try {
      await axios.delete(`${API_URL}/exercises/${id}`);
      fetchExercises();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete exercise');
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
          <h1 className="text-2xl font-bold text-gray-900">Exercises</h1>
          <p className="text-gray-500">Manage exercise library</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Exercise
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(exercise.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{exercise.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
              {exercise.description || 'No description provided.'}
            </p>
            {exercise.videoUrl && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Watch Tutorial
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            )}
          </div>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-12 card bg-gray-50 border-dashed border-2 border-gray-200">
          <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No exercises found. Add your first exercise to the library.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">Add New Exercise</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Quad Sets"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="Instructions for the patient..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (Optional)</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="input"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
