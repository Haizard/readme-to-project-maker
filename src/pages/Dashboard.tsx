import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import TenantAdminDashboard from '@/components/dashboard/TenantAdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) {
    return <div>Loading...</div>;
  }

  switch (profile.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'tenant_admin':
      return <TenantAdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'staff':
      return <StudentDashboard />; // Staff can use student dashboard for now
    default:
      return <div>Unknown role: {profile.role}</div>;
  }
}