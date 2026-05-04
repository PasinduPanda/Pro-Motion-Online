'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Calendar, 
  Activity, 
  DollarSign, 
  FileText, 
  UserCog, 
  Clock, 
  Dumbbell, 
  BarChart,
  Home,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const menuItems = [
    { title: 'Dashboard', href: '/dashboard', icon: Home },
    { title: 'Patients', href: '/dashboard/patients', icon: Users },
    { title: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { title: 'Treatments', href: '/dashboard/treatments', icon: Activity },
    { title: 'Sessions', href: '/dashboard/sessions', icon: Clock },
    { title: 'Exercises', href: '/dashboard/exercises', icon: Dumbbell },
    { title: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { title: 'Reports', href: '/dashboard/reports', icon: BarChart },
    ...(user?.role === 'admin' ? [{ title: 'Staff Management', href: '/dashboard/users', icon: UserCog }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">PhysioCare</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Management</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {item.title}
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
            >
              <LogOut className="w-3 h-3 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-primary-600 transition-colors">Portal</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium capitalize">
              {pathname.split('/').pop().replace('-', ' ') || 'Dashboard'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </div>
             <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>
             <p className="text-sm font-medium text-gray-600">
               {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
             </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}