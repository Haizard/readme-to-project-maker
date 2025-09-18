import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, GraduationCap, Users } from 'lucide-react';
import CourseManagement from '@/components/academic/CourseManagement';
import SubjectManagement from '@/components/academic/SubjectManagement';
import TeacherAssignments from '@/components/academic/TeacherAssignments';
import ClassManagement from '@/components/academic/ClassManagement';

export default function Academic() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');

  if (!profile) {
    return <div>Loading...</div>;
  }

  // Check if user has permission to access academic management
  const canManage = profile.role === 'tenant_admin' || profile.role === 'super_admin';
  const canView = ['tenant_admin', 'teacher', 'staff', 'super_admin'].includes(profile.role);

  if (!canView) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access academic management.
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
          <h1 className="text-3xl font-bold">Academic Management</h1>
          <p className="text-muted-foreground">
            Manage courses, subjects, classes, and teacher assignments
          </p>
        </div>
      </div>

      {/* Academic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Across all levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">NECTA compliant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Across all levels</p>
          </CardContent>
        </Card>
      </div>

      {/* Academic Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Structure</CardTitle>
          <CardDescription>
            Configure courses, subjects, and teacher assignments for your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="assignments">Teacher Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              <CourseManagement canManage={canManage} />
            </TabsContent>

            <TabsContent value="subjects" className="mt-6">
              <SubjectManagement canManage={canManage} />
            </TabsContent>

            <TabsContent value="classes" className="mt-6">
              <ClassManagement canManage={canManage} />
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <TeacherAssignments canManage={canManage} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}