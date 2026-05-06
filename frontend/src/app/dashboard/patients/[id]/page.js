'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_URL } from '../../../../lib/api';
import axios from 'axios';
import { 
  User, 
  Calendar, 
  Activity, 
  FileText, 
  Clock, 
  ChevronLeft, 
  Download,
  Phone,
  MapPin,
  AlertCircle,
  Dumbbell
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function PatientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      const res = await axios.get(`${API_URL}/patients/${id}`);
      setPatient(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!patient) return <div>Patient not found</div>;

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/patients/${id}` : '';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Patients
        </button>
        <div className="flex space-x-3">
          <button className="btn btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="card text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-primary-600"></div>
             <div className="mt-4 mb-6 inline-flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full text-primary-700 text-3xl font-bold uppercase shadow-inner">
               {patient.fullName.charAt(0)}
             </div>
             <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
             <p className="text-gray-500 text-sm mt-1">ID: {patient.id.slice(0, 8)}</p>
             
             <div className="mt-8 pt-8 border-t border-gray-100 space-y-4 text-left">
               <div className="flex items-center text-sm">
                 <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                 <span className="text-gray-600">Age: {patient.age} years ({patient.gender})</span>
               </div>
               <div className="flex items-center text-sm">
                 <Phone className="w-4 h-4 text-gray-400 mr-3" />
                 <span className="text-gray-600">{patient.phone}</span>
               </div>
               <div className="flex items-center text-sm">
                 <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                 <span className="text-gray-600 truncate">{patient.address || 'No address provided'}</span>
               </div>
             </div>

             <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Patient QR Identity</p>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <QRCodeCanvas 
                    value={profileUrl} 
                    size={150}
                    level={"H"}
                    includeMargin={false}
                    imageSettings={{
                      src: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
                      x: undefined,
                      y: undefined,
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-4 leading-relaxed">Scan to access full clinical history and appointment records.</p>
             </div>
          </div>

          <div className="card">
             <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">Medical Alerts</h2>
             </div>
             <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg">
                   <p className="text-xs font-bold text-red-700 uppercase mb-1">Allergies</p>
                   <p className="text-sm text-red-900">{patient.medicalHistory?.allergies || 'None reported'}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                   <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Active Conditions</p>
                   <p className="text-sm text-yellow-900">{patient.medicalHistory?.conditions || 'None'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex space-x-1 p-1 bg-gray-100 rounded-xl">
              {['Overview', 'Treatments', 'Sessions', 'Appointments', 'Invoices'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.toLowerCase()
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
           </div>

           {/* Tab Content */}
           <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                   <div className="card">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes</h3>
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {patient.medicalHistory?.notes || 'No notes available for this patient.'}
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card border-l-4 border-primary-500">
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase">Recent Treatment</p>
                               <p className="text-sm font-bold text-gray-900 mt-1">
                                 {patient.treatments?.[0]?.diagnosis || 'No active treatment'}
                               </p>
                            </div>
                            <Activity className="w-8 h-8 text-primary-100" />
                         </div>
                      </div>
                      <div className="card border-l-4 border-green-500">
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase">Next Appointment</p>
                               <p className="text-sm font-bold text-gray-900 mt-1">
                                 {patient.appointments?.[0]?.dateTime 
                                   ? new Date(patient.appointments[0].dateTime).toLocaleDateString() 
                                   : 'Not scheduled'}
                               </p>
                            </div>
                            <Calendar className="w-8 h-8 text-green-100" />
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'treatments' && (
                <div className="space-y-4">
                  {patient.treatments?.map((t) => (
                    <div key={t.id} className="card hover:border-primary-200 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div className="flex space-x-4">
                           <div className="p-3 bg-purple-50 rounded-xl">
                              <Activity className="w-6 h-6 text-purple-600" />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">{t.diagnosis}</h4>
                              <p className="text-sm text-gray-500 mt-1">Therapist: {t.therapist?.name}</p>
                              <div className="flex items-center mt-3 text-xs text-gray-400 space-x-4">
                                 <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(t.startDate).toLocaleDateString()}</span>
                                 <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {t.sessions?.length || 0} Sessions</span>
                              </div>
                           </div>
                        </div>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                          t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!patient.treatments?.length && <div className="text-center py-12 text-gray-400">No treatments found</div>}
                </div>
              )}

              {activeTab === 'sessions' && (
                 <div className="space-y-4">
                    {patient.treatments?.flatMap(t => t.sessions.map(s => ({...s, treatment: t.diagnosis}))).sort((a,b) => new Date(b.sessionDate) - new Date(a.sessionDate)).map((s) => (
                      <div key={s.id} className="card">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                               <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                               <h4 className="font-bold text-gray-900">{new Date(s.sessionDate).toLocaleDateString()}</h4>
                               <span className="text-xs text-gray-400">for {s.treatment}</span>
                            </div>
                            <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                               <span className="text-xs font-bold text-gray-400 mr-2">PAIN LEVEL</span>
                               <span className={`text-sm font-bold ${s.painLevel > 7 ? 'text-red-500' : 'text-primary-600'}`}>{s.painLevel}/10</span>
                            </div>
                         </div>
                         <p className="text-sm text-gray-600 mb-4">{s.notes}</p>
                         <div className="flex flex-wrap gap-2">
                            {s.sessionExercises?.map((se, i) => (
                               <div key={i} className="flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-100">
                                  <Dumbbell className="w-3 h-3 mr-2 text-primary-400" />
                                  {se.exercise?.name} • {se.sets}x{se.reps}
                               </div>
                            ))}
                         </div>
                      </div>
                    ))}
                    {!patient.treatments?.some(t => t.sessions?.length) && <div className="text-center py-12 text-gray-400">No sessions recorded</div>}
                 </div>
              )}

              {activeTab === 'appointments' && (
                 <div className="space-y-4">
                    {patient.appointments?.map((a) => (
                      <div key={a.id} className="card flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                           <div className="p-3 bg-green-50 rounded-xl">
                              <Calendar className="w-6 h-6 text-green-600" />
                           </div>
                           <div>
                              <p className="font-bold text-gray-900">{new Date(a.dateTime).toLocaleDateString()} at {new Date(a.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-sm text-gray-500">Therapist: {a.therapist?.name}</p>
                           </div>
                        </div>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                          a.status === 'booked' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                    {!patient.appointments?.length && <div className="text-center py-12 text-gray-400">No appointments scheduled</div>}
                 </div>
              )}

              {activeTab === 'invoices' && (
                 <div className="space-y-4">
                    {patient.invoices?.map((i) => (
                      <div key={i.id} className="card flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                           <div className="p-3 bg-yellow-50 rounded-xl">
                              <DollarSign className="w-6 h-6 text-yellow-600" />
                           </div>
                           <div>
                              <p className="font-bold text-gray-900">Invoice #{i.id.slice(0,6)}</p>
                              <p className="text-sm text-gray-500">{new Date(i.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-gray-900">${i.totalAmount.toFixed(2)}</p>
                           <p className={`text-xs font-bold uppercase ${i.status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>{i.status}</p>
                        </div>
                      </div>
                    ))}
                    {!patient.invoices?.length && <div className="text-center py-12 text-gray-400">No billing records</div>}
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function DollarSign({className}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
