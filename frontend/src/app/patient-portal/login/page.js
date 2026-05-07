'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '../../../lib/api';

export default function PatientLoginPage() {
  const [patientId, setPatientId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/patient/login`, { 
        patientId: patientId.trim(), 
        phone: phone.trim()
      });
      
      const { token, patient } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('patient', JSON.stringify(patient));
      router.push('/patient-portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your Patient ID and Phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Pro-Motion</h1>
          <p className="text-gray-500 mt-2">Patient Portal</p>
          <p className="text-sm text-gray-400 mt-1">Sign in with your Patient ID and registered phone number</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value.toUpperCase())}
              className="input"
              placeholder="e.g., PTABC1234"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registered Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="e.g., 0712345678"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Get your Patient ID from the clinic</p>
        </div>
      </div>
    </div>
  );
}