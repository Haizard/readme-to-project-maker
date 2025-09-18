import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  Calendar,
  FileText,
  BarChart3,
  Clock,
  Bell
} from 'lucide-react';

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Ms. Johnson</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Teacher
        </Badge>
      </div>

      {/* Teaching Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Active this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Assignments to grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Classes scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Teaching Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Tools</CardTitle>
          <CardDescription>
            Manage your classes and students
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <BookOpen className="h-5 w-5 mb-2" />
              <span className="font-semibold">My Courses</span>
              <span className="text-sm text-muted-foreground">View and manage courses</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <ClipboardCheck className="h-5 w-5 mb-2" />
              <span className="font-semibold">Gradebook</span>
              <span className="text-sm text-muted-foreground">Grades and assessments</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <Calendar className="h-5 w-5 mb-2" />
              <span className="font-semibold">Attendance</span>
              <span className="text-sm text-muted-foreground">Track student attendance</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <FileText className="h-5 w-5 mb-2" />
              <span className="font-semibold">Lesson Plans</span>
              <span className="text-sm text-muted-foreground">Create and manage lessons</span>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="flex flex-col items-start space-y-1">
              <BarChart3 className="h-5 w-5 mb-2" />
              <span className="font-semibold">Student Reports</span>
              <span className="text-sm text-muted-foreground">View student performance</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>
            Your classes for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: '08:00 - 09:00', class: 'Mathematics - Grade 10A', room: 'Room 201', students: 28 },
              { time: '09:30 - 10:30', class: 'Mathematics - Grade 10B', room: 'Room 201', students: 25 },
              { time: '11:00 - 12:00', class: 'Advanced Calculus - Grade 12', room: 'Room 203', students: 18 },
              { time: '14:00 - 15:00', class: 'Statistics - Grade 11', room: 'Room 201', students: 22 },
            ].map((schedule, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {schedule.time}
                  </div>
                  <div>
                    <p className="font-medium">{schedule.class}</p>
                    <p className="text-sm text-muted-foreground">{schedule.room} • {schedule.students} students</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View Class
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}