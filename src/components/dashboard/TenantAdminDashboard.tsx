import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  UserPlus,
  Settings,
  FileText,
  TrendingUp
} from 'lucide-react';

export default function TenantAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">School Dashboard</h1>
          <p className="text-muted-foreground">Green Valley High School</p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          School Administrator
        </Badge>
      </div>

      {/* School Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">485</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Full-time teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>School Management</CardTitle>
          <CardDescription>
            Manage users, courses, and school settings
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <UserPlus className="h-5 w-5 mb-2" />
              <span className="font-semibold">Manage Users</span>
              <span className="text-sm text-muted-foreground">Add students, teachers, staff</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <BookOpen className="h-5 w-5 mb-2" />
              <span className="font-semibold">Academic Setup</span>
              <span className="text-sm text-muted-foreground">Courses and subjects</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <Settings className="h-5 w-5 mb-2" />
              <span className="font-semibold">School Settings</span>
              <span className="text-sm text-muted-foreground">Configure school details</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <FileText className="h-5 w-5 mb-2" />
              <span className="font-semibold">Reports</span>
              <span className="text-sm text-muted-foreground">School analytics</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <TrendingUp className="h-5 w-5 mb-2" />
              <span className="font-semibold">Performance</span>
              <span className="text-sm text-muted-foreground">Academic performance</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent School Activity</CardTitle>
          <CardDescription>
            Latest actions in your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'New student enrolled', details: 'Sarah Johnson - Grade 10', time: '1 hour ago' },
              { action: 'Teacher assigned to course', details: 'Ms. Smith - Advanced Mathematics', time: '3 hours ago' },
              { action: 'New course created', details: 'Environmental Science', time: '5 hours ago' },
              { action: 'Attendance report generated', details: 'Week 12 report', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}