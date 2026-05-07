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
  const [exercises, setExercises] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchPatient();
    fetchExercises();
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
      console.error('Profile fetch failed:', err);
      localStorage.removeItem('token');
      router.push('/patient-portal/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/patient/exercises`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExercises(res.data);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
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
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight">Pro-Motion Patient Portal</h1>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{patient?.fullName}</p>
                <p className="text-[10px] text-blue-200 uppercase mt-1">Patient ID: {patient?.patientId}</p>
              </div>
              <button onClick={logout} className="flex items-center text-sm bg-blue-700 hover:bg-blue-800 transition-colors px-4 py-2 rounded-lg font-medium">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto mt-6 px-4 pb-12">
        <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 md:mb-0 md:mr-6 h-fit sticky top-6">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full p-3 rounded-xl text-left transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {patient?.fullName?.split(' ')[0]}!</h2>
                  <p className="text-gray-500 mb-8">Here's an overview of your recovery progress.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active Treatments</p>
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{patient?.treatments?.filter(t => t.status === 'active').length || 0}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Total Sessions</p>
                        <Activity className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{patient?.treatments?.reduce((acc, t) => acc + (t.sessions?.length || 0), 0) || 0}</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Unpaid Invoices</p>
                        <CreditCard className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{patient?.invoices?.filter(i => i.status === 'unpaid').length || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                        Upcoming Appointments
                      </h3>
                      <div className="space-y-3">
                        {patient?.appointments?.filter(a => a.status === 'booked').slice(0, 2).map((apt) => (
                          <div key={apt.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                            <p className="font-bold text-gray-900">{new Date(apt.dateTime).toLocaleDateString()} at {new Date(apt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            <p className="text-sm text-gray-500">Therapist: {apt.therapist?.name}</p>
                          </div>
                        ))}
                        {patient?.appointments?.filter(a => a.status === 'booked').length === 0 && (
                          <p className="text-sm text-gray-400 italic">No upcoming appointments.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Dumbbell className="w-5 h-5 mr-2 text-blue-600" />
                        Recommended Exercises
                      </h3>
                      <div className="space-y-3">
                        {exercises.slice(0, 2).map((ex, i) => (
                          <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-900">{ex.name}</p>
                              <p className="text-xs text-gray-500">{ex.sets} sets of {ex.reps} reps</p>
                            </div>
                            <Dumbbell className="w-5 h-5 text-gray-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'treatments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">My Treatments</h2>
              <div className="grid grid-cols-1 gap-6">
                {patient?.treatments?.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className={`p-1 h-2 ${t.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="p-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{t.diagnosis}</h3>
                          <p className="text-sm text-gray-500">Under care of {t.therapist?.name}</p>
                        </div>
                        <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {t.status}
                        </span>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-6 mb-6">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Professional Treatment Plan</h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{t.treatmentPlan}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          Started: {new Date(t.startDate).toLocaleDateString()}
                        </div>
                        {t.endDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            Estimated Completion: {new Date(t.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!patient?.treatments || patient.treatments.length === 0) && (
                  <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No treatment records found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Assigned Exercises</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {exercises.map((ex, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                          <Dumbbell className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase">Target</span>
                          <p className="text-lg font-bold text-gray-900">{ex.sets}x{ex.reps}</p>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{ex.name}</h3>
                      <p className="text-sm text-gray-600 mb-6 line-clamp-3">{ex.description}</p>
                      
                      {ex.videoUrl && (
                        <a 
                          href={ex.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full btn btn-primary flex items-center justify-center py-3 bg-red-600 hover:bg-red-700 border-none"
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Watch Video Tutorial
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {exercises.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your therapist hasn't assigned specific exercises yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {patient?.appointments?.map((apt) => (
                    <div key={apt.id} className="p-6 flex flex-col sm:flex-row justify-between items-center hover:bg-gray-50 transition-colors">
                      <div className="flex items-center mb-4 sm:mb-0">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 mr-4">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{new Date(apt.dateTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
                          <p className="text-sm text-gray-500">Therapist: {apt.therapist?.name}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        apt.status === 'booked' ? 'bg-blue-100 text-blue-700' : 
                        apt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                  {(!patient?.appointments || patient.appointments.length === 0) && (
                    <div className="text-center py-20">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No appointment records found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
              <div className="grid grid-cols-1 gap-4">
                {patient?.invoices?.map((inv) => (
                  <div key={inv.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className={`p-3 rounded-xl mr-4 ${inv.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">${inv.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Invoice Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
                {(!patient?.invoices || patient.invoices.length === 0) && (
                  <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No billing records found.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}