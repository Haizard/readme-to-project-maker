import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Plus } from 'lucide-react';

interface ClassData {
  id: string;
  class_name: string;
  section: string | null;
  capacity: number;
}

interface ClassScheduleManagementProps {
  classData: ClassData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sample schedule data - In a real application, this would come from the database
const sampleSchedule = [
  {
    id: '1',
    day: 'Monday',
    periods: [
      { time: '08:00-09:00', subject: 'Mathematics', teacher: 'John Doe', room: 'Room 101' },
      { time: '09:00-10:00', subject: 'English', teacher: 'Jane Smith', room: 'Room 102' },
      { time: '10:30-11:30', subject: 'Physics', teacher: 'Bob Wilson', room: 'Lab 1' },
      { time: '11:30-12:30', subject: 'Chemistry', teacher: 'Alice Brown', room: 'Lab 2' },
    ]
  },
  {
    id: '2',
    day: 'Tuesday',
    periods: [
      { time: '08:00-09:00', subject: 'Biology', teacher: 'Carol Davis', room: 'Lab 3' },
      { time: '09:00-10:00', subject: 'History', teacher: 'David Lee', room: 'Room 201' },
      { time: '10:30-11:30', subject: 'Geography', teacher: 'Eva Green', room: 'Room 202' },
      { time: '11:30-12:30', subject: 'Mathematics', teacher: 'John Doe', room: 'Room 101' },
    ]
  },
  {
    id: '3',
    day: 'Wednesday',
    periods: [
      { time: '08:00-09:00', subject: 'English', teacher: 'Jane Smith', room: 'Room 102' },
      { time: '09:00-10:00', subject: 'Physics', teacher: 'Bob Wilson', room: 'Lab 1' },
      { time: '10:30-11:30', subject: 'Physical Education', teacher: 'Mike Johnson', room: 'Gymnasium' },
      { time: '11:30-12:30', subject: 'Art', teacher: 'Sarah White', room: 'Art Studio' },
    ]
  },
  {
    id: '4',
    day: 'Thursday',
    periods: [
      { time: '08:00-09:00', subject: 'Chemistry', teacher: 'Alice Brown', room: 'Lab 2' },
      { time: '09:00-10:00', subject: 'Mathematics', teacher: 'John Doe', room: 'Room 101' },
      { time: '10:30-11:30', subject: 'Biology', teacher: 'Carol Davis', room: 'Lab 3' },
      { time: '11:30-12:30', subject: 'Computer Science', teacher: 'Tom Clark', room: 'Computer Lab' },
    ]
  },
  {
    id: '5',
    day: 'Friday',
    periods: [
      { time: '08:00-09:00', subject: 'History', teacher: 'David Lee', room: 'Room 201' },
      { time: '09:00-10:00', subject: 'Geography', teacher: 'Eva Green', room: 'Room 202' },
      { time: '10:30-11:30', subject: 'English', teacher: 'Jane Smith', room: 'Room 102' },
      { time: '11:30-12:30', subject: 'Study Period', teacher: 'Class Teacher', room: 'Homeroom' },
    ]
  },
];

export function ClassScheduleManagement({ 
  classData, 
  open, 
  onOpenChange 
}: ClassScheduleManagementProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const getSubjectColor = (subject: string) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-800 border-blue-200',
      'English': 'bg-green-100 text-green-800 border-green-200',
      'Physics': 'bg-purple-100 text-purple-800 border-purple-200',
      'Chemistry': 'bg-orange-100 text-orange-800 border-orange-200',
      'Biology': 'bg-teal-100 text-teal-800 border-teal-200',
      'History': 'bg-amber-100 text-amber-800 border-amber-200',
      'Geography': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Physical Education': 'bg-red-100 text-red-800 border-red-200',
      'Art': 'bg-pink-100 text-pink-800 border-pink-200',
      'Computer Science': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Study Period': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Class Schedule - {classData.class_name} {classData.section && `(${classData.section})`}
          </DialogTitle>
          <DialogDescription>
            Manage class timetable and period schedules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">20</div>
                <p className="text-xs text-muted-foreground">Per week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9</div>
                <p className="text-xs text-muted-foreground">Active subjects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classroom</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Multiple</div>
                <p className="text-xs text-muted-foreground">Various locations</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Weekly Timetable</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Period
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {sampleSchedule.map((day) => (
                <Card key={day.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {day.day}
                    </CardTitle>
                    <CardDescription>
                      {day.periods.length} periods scheduled
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {day.periods.map((period, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={getSubjectColor(period.subject)}>
                            {period.subject}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {period.time}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{period.teacher}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{period.room}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Schedule Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Statistics</CardTitle>
              <CardDescription>
                Analysis of class schedule distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">5</div>
                  <div className="text-sm text-muted-foreground">Math Periods</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">4</div>
                  <div className="text-sm text-muted-foreground">English Periods</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">6</div>
                  <div className="text-sm text-muted-foreground">Science Periods</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">5</div>
                  <div className="text-sm text-muted-foreground">Other Subjects</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Export Schedule
            </Button>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Print Timetable
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Period
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}