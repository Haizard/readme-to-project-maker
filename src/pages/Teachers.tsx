import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Users, GraduationCap, Calendar, FileText, Award } from 'lucide-react';
import TeacherProfiles from '@/components/teachers/TeacherProfiles';
import TeacherQualifications from '@/components/teachers/TeacherQualifications';
import ClassAssignments from '@/components/teachers/ClassAssignments';
import LeaveManagement from '@/components/teachers/LeaveManagement';
import PerformanceEvaluations from '@/components/teachers/PerformanceEvaluations';

export default function Teachers() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profiles');

  if (!profile) {
    return <div>Loading...</div>;
  }

  // Check if user has permission to access teacher management
  const canManage = profile.role === 'tenant_admin' || profile.role === 'super_admin';
  const canView = ['tenant_admin', 'teacher', 'staff', 'super_admin'].includes(profile.role);

  if (!canView) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access teacher management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Management</h1>
          <p className="text-muted-foreground">
            Manage teacher profiles, qualifications, and assignments
          </p>
        </div>
      </div>

      {/* Teacher Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">With degrees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluations Due</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Management System</CardTitle>
          <CardDescription>
            Comprehensive teacher management including profiles, qualifications, and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
              <TabsTrigger value="assignments">Class Assignments</TabsTrigger>
              <TabsTrigger value="leaves">Leave Management</TabsTrigger>
              <TabsTrigger value="evaluations">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="profiles" className="mt-6">
              <TeacherProfiles canManage={canManage} />
            </TabsContent>

            <TabsContent value="qualifications" className="mt-6">
              <TeacherQualifications canManage={canManage} />
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <ClassAssignments canManage={canManage} />
            </TabsContent>

            <TabsContent value="leaves" className="mt-6">
              <LeaveManagement canManage={canManage} />
            </TabsContent>

            <TabsContent value="evaluations" className="mt-6">
              <PerformanceEvaluations canManage={canManage} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}