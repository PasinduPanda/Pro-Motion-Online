'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../../../lib/api';
import axios from 'axios';
import { BarChart, TrendingUp, Calendar, Users, DollarSign, FileText, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({ payments: [], total: 0 });
  const [appointmentReport, setAppointmentReport] = useState([]);
  const [patientReport, setPatientReport] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'revenue') {
        const res = await axios.get(`${API_URL}/reports/revenue`, {
          params: { startDate: dateRange.start, endDate: dateRange.end }
        });
        setRevenueData(res.data);
      } else if (activeTab === 'appointments') {
        const res = await axios.get(`${API_URL}/reports/appointments`, {
          params: { date: dateRange.start } // Daily view for now
        });
        setAppointmentReport(res.data);
      } else if (activeTab === 'patients') {
        const res = await axios.get(`${API_URL}/reports/patients`, {
          params: { month: dateRange.start.substring(0, 7) }
        });
        setPatientReport(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'revenue', title: 'Revenue Report', icon: DollarSign },
    { id: 'appointments', title: 'Daily Appointments', icon: Calendar },
    { id: 'patients', title: 'Patient Growth', icon: Users }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Track clinic performance and growth</p>
        </div>
        <button className="btn btn-secondary flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.title}
          </button>
        ))}
      </div>

      <div className="card mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input text-sm"
            />
          </div>
          {activeTab === 'revenue' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="input text-sm"
              />
            </div>
          )}
          <button onClick={fetchData} className="btn btn-primary px-6 h-10">Generate Report</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 card">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'revenue' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-primary-600 text-white">
                  <p className="text-primary-100 text-sm">Total Revenue Collected</p>
                  <p className="text-3xl font-bold mt-1">${revenueData.total.toFixed(2)}</p>
                  <div className="mt-4 flex items-center text-xs text-primary-100">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% from previous period
                  </div>
                </div>
                <div className="card">
                  <p className="text-gray-500 text-sm">Total Transactions</p>
                  <p className="text-3xl font-bold mt-1">{revenueData.payments.length}</p>
                </div>
                <div className="card">
                  <p className="text-gray-500 text-sm">Average Transaction</p>
                  <p className="text-3xl font-bold mt-1">
                    ${revenueData.payments.length ? (revenueData.total / revenueData.payments.length).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>

              <div className="card overflow-hidden">
                <h3 className="font-bold text-gray-900 mb-4">Payment Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {revenueData.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {format(new Date(p.paymentDate), 'PPP')}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {p.invoice?.patient?.fullName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.paymentMethod}</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                            ${p.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {revenueData.payments.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            No transactions found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appointments' && (
            <div className="card overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-4">Appointments for {format(new Date(dateRange.start), 'PPP')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Therapist</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointmentReport.map((a) => (
                      <tr key={a.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {format(new Date(a.dateTime), 'hh:mm a')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {a.patient?.fullName}
                          <span className="block text-xs text-gray-400">{a.patient?.phone}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{a.therapist?.name}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            a.status === 'booked' ? 'bg-blue-100 text-blue-600' : 
                            a.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {appointmentReport.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No appointments found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="card overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-4">New Patients in {dateRange.start.substring(0, 7)}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {patientReport.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(p.createdAt), 'PPP')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.fullName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.phone}</td>
                      </tr>
                    ))}
                    {patientReport.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                          No new patients registered this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
