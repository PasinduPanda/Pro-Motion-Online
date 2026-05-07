'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Activity, Calendar, FileText, Dumbbell, CreditCard, LogOut } from 'lucide-react';
import { API_URL } from '../../lib/api';

export default function PatientPortalPage() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    fetchPatient();
  }, []);

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/patient-portal/login');
        return;
      }
      const res = await axios.get(`${API_URL}/patient/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatient(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/patient-portal/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('patient');
    router.push('/patient-portal/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'treatments', label: 'My Treatments', icon: FileText },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Pro-Motion Patient Portal</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{patient?.fullName}</span>
              <button onClick={logout} className="flex items-center text-sm bg-blue-700 px-3 py-1 rounded">
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto mt-6 px-4">
        <div className="w-64 bg-white rounded-lg shadow p-4 mr-4 h-fit">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full p-3 rounded-lg text-left ${
                  activeTab === item.id ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Welcome, {patient?.fullName}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Active Treatments</p>
                  <p className="text-2xl font-bold">{patient?.treatments?.filter(t => t.status === 'active').length || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Sessions Completed</p>
                  <p className="text-2xl font-bold">{patient?.treatments?.reduce((acc, t) => acc + (t.sessions?.length || 0), 0) || 0}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600">Pending Invoices</p>
                  <p className="text-2xl font-bold">{patient?.invoices?.filter(i => i.status === 'unpaid').length || 0}</p>
                </div>
              </div>

              <h3 className="font-semibold mb-3">Recent Treatments</h3>
              <div className="space-y-3">
                {patient?.treatments?.slice(0, 3).map((t) => (
                  <div key={t.id} className="p-3 bg-gray-50 rounded-lg flex justify-between">
                    <div>
                      <p className="font-medium">{t.diagnosis}</p>
                      <p className="text-sm text-gray-500">Therapist: {t.therapist?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'treatments' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">My Treatments</h2>
              <div className="space-y-4">
                {patient?.treatments?.map((t) => (
                  <div key={t.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{t.diagnosis}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{t.treatmentPlan}</p>
                    <p className="text-sm text-gray-500">Therapist: {t.therapist?.name}</p>
                    <p className="text-sm text-gray-500">Started: {new Date(t.startDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">My Exercises</h2>
              <p className="text-gray-500">No exercises assigned yet.</p>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">My Appointments</h2>
              <div className="space-y-3">
                {patient?.appointments?.map((apt) => (
                  <div key={apt.id} className="p-3 bg-gray-50 rounded-lg flex justify-between">
                    <div>
                      <p className="font-medium">{new Date(apt.dateTime).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Therapist: {apt.therapist?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      apt.status === 'booked' ? 'bg-yellow-100 text-yellow-800' : 
                      apt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Billing & Payments</h2>
              <div className="space-y-3">
                {patient?.invoices?.map((inv) => (
                  <div key={inv.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">${inv.totalAmount}</p>
                      <p className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}