'use client';

import { useEffect, useState, useRef } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { Search, Plus, Upload, FileText, X, Eye, Trash2, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
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
      const res = await axios.get(`${API_URL}/patients`, { params: { search, limit: 100 } });
      setPatients(res.data.patients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (patientId) => {
    try {
      const res = await axios.get(`${API_URL}/uploads/patient/${patientId}`);
      setReports(res.data);
    } catch (err) {
      setReports([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/patients`, formData);
      setShowModal(false);
      setFormData({ fullName: '', dateOfBirth: '', gender: 'male', phone: '', address: '', emergencyContact: '', conditions: '', allergies: '', pastInjuries: '', notes: '' });
      fetchPatients();
      // Optionally show QR code for newly created patient
      if (res.data) setQrModal(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create patient');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedPatient) return;
    setUploading(true);
    const formData2 = new FormData();
    formData2.append('file', file);
    formData2.append('description', file.name);
    try {
      await axios.post(`${API_URL}/uploads/patient/${selectedPatient.id}`, formData2, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchReports(selectedPatient.id);
    } catch (err) {
      alert('Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const openPatientReports = async (patient) => {
    setSelectedPatient(patient);
    await fetchReports(patient.id);
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

  const deleteReport = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await axios.delete(`${API_URL}/uploads/${id}`);
      if (selectedPatient) fetchReports(selectedPatient.id);
    } catch (err) {
      alert('Failed to delete report');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Directory</h1>
          <p className="text-gray-500">Scan QR or search to access medical records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center shadow-lg shadow-primary-100">
          <Plus className="w-5 h-5 mr-2" /> Register & Generate QR
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search patients by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 h-12" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">QR Identity</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reports</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold mr-3 uppercase text-xs">
                      {patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{patient.fullName}</div>
                      <div className="text-[10px] text-gray-400">ID: {patient.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{patient.phone}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setQrModal(patient)}
                    className="p-2 bg-gray-100 hover:bg-primary-100 text-gray-500 hover:text-primary-600 rounded-lg transition-all border border-gray-200"
                    title="View QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => openPatientReports(patient)} className="text-primary-600 hover:text-primary-800 flex items-center text-xs font-bold">
                    <Upload className="w-4 h-4 mr-1" /> Reports
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link href={`/dashboard/patients/${patient.id}`} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="View Profile">
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleDelete(patient.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Patient">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {patients.length === 0 && <div className="text-center py-12 text-gray-500">No patients found</div>}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-gray-900">Patient QR Badge</h2>
                 <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
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
              <button onClick={() => window.print()} className="btn btn-primary w-full py-3 rounded-xl flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5 mr-2" /> Print QR Badge
              </button>
           </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Patient</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="input"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input" rows={2} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label><input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} className="input" /></div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Register & Generate QR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedPatient.fullName}'s Reports</h2>
              <button onClick={() => setSelectedPatient(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500">
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload medical reports (X-ray, MRI, Reports)'}</span>
                </div>
              </label>
            </div>
            <div className="space-y-2">
              {reports.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No reports uploaded</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <a href={`${API_URL.replace('/api', '')}${report.filePath}`} target="_blank" className="flex items-center text-primary-600">
                      <FileText className="w-5 h-5 mr-2" />
                      <span className="text-sm">{report.filename}</span>
                    </a>
                    <button onClick={() => deleteReport(report.id)} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}