import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Settings,
  ClipboardCheck,
  BarChart3,
  Bell,
  Award,
  Shield
} from 'lucide-react';

const menuItems = {
  super_admin: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Manage Tenants', url: '/tenants', icon: Building2 },
    { title: 'System Users', url: '/system-users', icon: Users },
    { title: 'Security Center', url: '/security', icon: Shield },
    { title: 'System Reports', url: '/system-reports', icon: BarChart3 },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  tenant_admin: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Manage Users', url: '/users', icon: Users },
    { title: 'Academic Setup', url: '/dashboard/academic', icon: BookOpen },
    { title: 'Teacher Management', url: '/dashboard/teachers', icon: GraduationCap },
    { title: 'Reports', url: '/reports', icon: FileText },
    { title: 'School Settings', url: '/school-settings', icon: Settings },
  ],
  teacher: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Classes', url: '/classes', icon: BookOpen },
    { title: 'Gradebook', url: '/gradebook', icon: ClipboardCheck },
    { title: 'Attendance', url: '/attendance', icon: Calendar },
    { title: 'Lesson Plans', url: '/lessons', icon: FileText },
    { title: 'Student Reports', url: '/student-reports', icon: BarChart3 },
  ],
  student: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Courses', url: '/courses', icon: BookOpen },
    { title: 'Assignments', url: '/assignments', icon: FileText },
    { title: 'Grades', url: '/grades', icon: Award },
    { title: 'Schedule', url: '/schedule', icon: Calendar },
    { title: 'Announcements', url: '/announcements', icon: Bell },
  ],
  staff: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Students', url: '/students', icon: GraduationCap },
    { title: 'Reports', url: '/reports', icon: FileText },
    { title: 'Calendar', url: '/calendar', icon: Calendar },
  ],
};

export function AppSidebar() {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  if (!profile) return null;

  const items = menuItems[profile.role] || [];
  const isCollapsed = state === 'collapsed';
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar collapsible="icon" className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>School Management</span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}