'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, Eye, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    address: '',
    emergencyContact: '',
    conditions: '',
    allergies: '',
    pastInjuries: '',
    notes: '',
  });

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API_URL}/patients`, {
        params: { search, limit: 100 },
      });
      setPatients(res.data.patients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/patients`, formData);
      setShowModal(false);
      setFormData({
        fullName: '',
        dateOfBirth: '',
        gender: 'male',
        phone: '',
        address: '',
        emergencyContact: '',
        conditions: '',
        allergies: '',
        pastInjuries: '',
        notes: '',
      });
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create patient');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      await axios.delete(`${API_URL}/patients/${id}`);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete patient');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Directory</h1>
          <p className="text-gray-500">Scan QR or search to access medical records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center shadow-lg shadow-primary-100">
          <Plus className="w-5 h-5 mr-2" />
          Add New Patient
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 h-12"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Gender/Age</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">QR Identity</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold mr-3 uppercase">
                      {patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{patient.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-medium">#{patient.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{patient.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                  {patient.gender} • {patient.age}y
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => setQrModal(patient)}
                    className="p-2 bg-gray-100 hover:bg-primary-100 text-gray-500 hover:text-primary-600 rounded-lg transition-all border border-gray-200"
                    title="View QR Code"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link 
                      href={`/dashboard/patients/${patient.id}`}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                      title="View Profile"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button 
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                      title="Edit Records"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(patient.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Archive Patient"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {patients.length === 0 && (
          <div className="text-center py-12 bg-white">
            <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No patient records found matching your search.</p>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-gray-900">Patient QR Badge</h2>
                 <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-6 h-6 rotate-45" />
                 </button>
              </div>
              <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-inner mb-6 inline-block">
                <QRCodeCanvas 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/patients/${qrModal.id}`} 
                  size={220}
                  level="H"
                />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">{qrModal.fullName}</p>
              <p className="text-sm text-gray-500 mb-8 tracking-wide font-medium">ID: {qrModal.id.slice(0, 12)}</p>
              
              <button 
                onClick={() => window.print()}
                className="btn btn-primary w-full py-3 rounded-xl flex items-center justify-center font-bold"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Print QR Badge
              </button>
           </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-gray-900">New Patient Registration</h2>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-6 h-6 rotate-45" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input h-11"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input h-11"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input h-11"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input h-11"
                    placeholder="+94 77 XXX XXXX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Residential Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input p-3"
                  rows={2}
                  placeholder="Street name, City, Province"
                />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-primary-600" />
                  Initial Medical Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Known Conditions</label>
                    <input
                      type="text"
                      value={formData.conditions}
                      onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                      className="input h-10 text-sm"
                      placeholder="e.g. Diabetes, Hypertension"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Allergies</label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className="input h-10 text-sm"
                      placeholder="e.g. Penicillin, Peanuts"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1 py-3 font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 py-3 font-bold shadow-lg shadow-primary-100">
                  Register & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCircle({className}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}