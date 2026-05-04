'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../lib/api';
import axios from 'axios';
import { Users, Calendar, Activity, DollarSign, FileText, UserCog, Clock, Dumbbell, BarChart } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/dashboard`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: 'bg-blue-500' },
    { title: 'Today Appointments', value: stats?.todayAppointments || 0, icon: Calendar, color: 'bg-green-500' },
    { title: 'Active Treatments', value: stats?.activeTreatments || 0, icon: Activity, color: 'bg-purple-500' },
    { title: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-yellow-500' },
  ];

  const menuItems = [
    { title: 'Patients', href: '/dashboard/patients', icon: Users },
    { title: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { title: 'Treatments', href: '/dashboard/treatments', icon: Activity },
    { title: 'Sessions', href: '/dashboard/sessions', icon: Clock },
    { title: 'Exercises', href: '/dashboard/exercises', icon: Dumbbell },
    { title: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { title: 'Reports', href: '/dashboard/reports', icon: BarChart },
    ...(user?.role === 'admin' ? [{ title: 'Users', href: '/dashboard/users', icon: UserCog }] : []),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinic Overview</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
               <p className="text-gray-400">Activity Chart Placeholder</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-gray-600">New patient registered</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-600">Appointment completed</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-gray-600">Payment received</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}