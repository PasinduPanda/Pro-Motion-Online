'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../lib/api';

export default function PatientLoginPage() {
  const [patientId, setPatientId] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
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
        phone: phone.trim(), 
        pin: pin.trim() 
      });
      
      const { token, patient } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('patient', JSON.stringify(patient));
      router.push('/patient-portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your Patient ID, Phone number, and PIN.');
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
          <p className="text-sm text-gray-400 mt-1">Use your Patient ID, Phone number & PIN</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="e.g., 0712345678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN (4 digits)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input"
              placeholder="Enter your 4-digit PIN"
              maxLength={4}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Get your Patient ID & PIN from the clinic</p>
        </div>
      </div>
    </div>
  );
}