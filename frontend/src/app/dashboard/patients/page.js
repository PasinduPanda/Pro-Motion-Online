'use client';

import { useEffect, useState, useRef } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { Search, Plus, Upload, FileText, X, Trash2, QrCode, Printer, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [qrPatient, setQrPatient] = useState(null);
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
      if (res.data) {
        setQrPatient(res.data);
      }
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

  const generateQrCodeUrl = (patient) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ patientId: patient.patientId, name: patient.fullName }))}`;
  };

  const printPatientCard = (patient) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Patient Card - ${patient.fullName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .card { border: 2px solid #0066cc; border-radius: 10px; padding: 20px; max-width: 400px; }
          .header { text-align: center; color: #0066cc; margin-bottom: 20px; }
          .qr { text-align: center; margin: 20px 0; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .pin { background: #f0f0f0; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; }
          @media print { body { print-area-adjust: none; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Pro-Motion</h1>
            <p>Patient ID Card</p>
          </div>
          <div class="qr">
            <img src="${generateQrCodeUrl(patient)}" alt="QR Code" />
          </div>
          <div class="info"><span class="label">Name:</span> ${patient.fullName}</div>
          <div class="info"><span class="label">Patient ID:</span> ${patient.patientId}</div>
          <div class="info"><span class="label">Phone:</span> ${patient.phone}</div>
          <div class="info"><span class="label">DOB:</span> ${new Date(patient.dateOfBirth).toLocaleDateString()}</div>
          <div class="info" style="margin-top: 20px;"><span class="label">PIN:</span></div>
          <div class="pin">${patient.pin}</div>
          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">Keep this card confidential</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500">Register patients and manage records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" /> Register Patient
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reports</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{patient.patientId || 'N/A'}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{patient.fullName}</td>
                <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                <td className="px-6 py-4">
                  <button onClick={() => openPatientReports(patient)} className="text-primary-600 hover:text-primary-800 flex items-center text-sm">
                    <Upload className="w-4 h-4 mr-1" /> View/Upload
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => setQrPatient(patient)} className="text-primary-600 hover:text-primary-800" title="Show QR Code">
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button onClick={() => printPatientCard(patient)} className="text-blue-600 hover:text-blue-800" title="Print Card">
                      <Printer className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(patient.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {patients.length === 0 && <div className="text-center py-8 text-gray-500">No patients found</div>}
      </div>

      {/* QR Code Modal */}
      {qrPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Patient QR Badge</h2>
              <button onClick={() => setQrPatient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-inner mb-4 inline-block">
              <QRCodeCanvas
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/patients/${qrPatient.id}`}
                size={200}
                level="H"
              />
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">{qrPatient.fullName}</p>
            <p className="text-sm text-gray-500 mb-2">Patient ID: <span className="font-mono font-bold">{qrPatient.patientId || 'Generating...'}</span></p>
            <p className="text-xs text-gray-400 mb-6">Scan to access full clinical history</p>
            <div className="flex space-x-3">
              <button onClick={() => printPatientCard(qrPatient)} className="btn btn-primary flex-1 py-3 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4 mr-2" /> Print Card
              </button>
              <button onClick={() => setQrPatient(null)} className="btn btn-secondary flex-1 py-3 font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Register New Patient</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="input"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input" rows={2} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label><input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} className="input" /></div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Register</button>
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
                  <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload medical reports'}</span>
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