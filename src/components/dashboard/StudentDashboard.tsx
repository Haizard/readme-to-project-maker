import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Calendar, 
  Award, 
  Clock,
  FileText,
  BarChart3,
  Bell,
  CheckCircle
} from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Alex Thompson</p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Grade 11 Student
        </Badge>
      </div>

      {/* Academic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall GPA</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.8</div>
            <p className="text-xs text-muted-foreground">+0.2 from last semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96%</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Assignments due</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Courses Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
          <CardDescription>
            Your progress in current courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { course: 'Advanced Mathematics', grade: 'A-', progress: 85, teacher: 'Ms. Johnson' },
              { course: 'English Literature', grade: 'B+', progress: 78, teacher: 'Mr. Smith' },
              { course: 'Chemistry', grade: 'A', progress: 92, teacher: 'Dr. Wilson' },
              { course: 'History', grade: 'B', progress: 75, teacher: 'Ms. Davis' },
              { course: 'Physics', grade: 'A-', progress: 88, teacher: 'Mr. Brown' },
              { course: 'Computer Science', grade: 'A+', progress: 95, teacher: 'Ms. Garcia' },
            ].map((course, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{course.course}</p>
                    <p className="text-sm text-muted-foreground">{course.teacher}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{course.grade}</Badge>
                  </div>
                </div>
                <Progress value={course.progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{course.progress}% complete</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access your student tools
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start space-y-1">
                <FileText className="h-5 w-5 mb-2" />
                <span className="font-semibold">Assignments</span>
                <span className="text-xs text-muted-foreground">View and submit</span>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start space-y-1">
                <BarChart3 className="h-5 w-5 mb-2" />
                <span className="font-semibold">Grades</span>
                <span className="text-xs text-muted-foreground">View grades</span>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start space-y-1">
                <Calendar className="h-5 w-5 mb-2" />
                <span className="font-semibold">Schedule</span>
                <span className="text-xs text-muted-foreground">Class timetable</span>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start space-y-1">
                <Bell className="h-5 w-5 mb-2" />
                <span className="font-semibold">Announcements</span>
                <span className="text-xs text-muted-foreground">School updates</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>
              Assignments and tests due soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: 'Chemistry Lab Report', course: 'Chemistry', due: 'Tomorrow', status: 'pending' },
                { task: 'Shakespeare Essay', course: 'English Literature', due: 'Dec 20', status: 'in-progress' },
                { task: 'Calculus Problem Set', course: 'Mathematics', due: 'Dec 22', status: 'not-started' },
                { task: 'History Research Paper', course: 'History', due: 'Dec 25', status: 'completed' },
              ].map((assignment, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center space-x-3">
                    {assignment.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-orange-500" />
                    )}
                    <div>
                      <p className="font-medium">{assignment.task}</p>
                      <p className="text-sm text-muted-foreground">{assignment.course}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{assignment.due}</p>
                    <Badge 
                      variant={assignment.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {assignment.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}