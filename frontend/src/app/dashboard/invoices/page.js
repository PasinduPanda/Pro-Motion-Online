'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { DollarSign, Plus, Check } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    totalAmount: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_URL}/invoices`, { limit: 100 });
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API_URL}/patients`, { limit: 100 });
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/invoices`, {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
      });
      setShowModal(false);
      setFormData({ patientId: '', totalAmount: '' });
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create invoice');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/invoices/${selectedInvoice.id}/payments`, {
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
      });
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: '', paymentMethod: 'cash' });
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process payment');
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({ amount: invoice.totalAmount, paymentMethod: 'cash' });
    setShowPaymentModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">Manage billing and payments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Unpaid</p>
          <p className="text-2xl font-bold text-red-600">
            ${invoices.filter((i) => i.status === 'unpaid').reduce((sum, i) => sum + parseFloat(i.totalAmount), 0).toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            ${invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.totalAmount), 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">No invoices found</div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="card">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${invoice.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <DollarSign className={`w-5 h-5 ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{invoice.patient?.fullName}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${invoice.totalAmount}</p>
                    <p className={`text-sm ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {invoice.status}
                    </p>
                  </div>
                  {invoice.status === 'unpaid' && (
                    <button
                      onClick={() => openPaymentModal(invoice)}
                      className="btn btn-primary flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Pay
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
            <p className="text-gray-500 mb-4">
              Invoice: ${selectedInvoice.totalAmount}
            </p>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}