import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string | null;
  attendance_date: string;
  status: string;
  time_in: string | null;
  time_out: string | null;
  notes: string | null;
  students: {
    student_id: string;
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  classes: {
    class_name: string;
    section: string | null;
  } | null;
}

interface Student {
  id: string;
  student_id: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Class {
  id: string;
  class_name: string;
  section: string | null;
}

const AttendanceManagement = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  const fetchAttendanceData = async () => {
    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('student_attendance')
        .select(`
          *,
          students!inner (
            student_id,
            user_id,
            profiles!inner (first_name, last_name)
          ),
          classes (class_name, section)
        `)
        .eq('attendance_date', selectedDate)
        .eq('class_id', selectedClass || null)
        .order('created_at', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendanceRecords((attendanceData as any) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          user_id,
          profiles!inner (first_name, last_name)
        `)
        .eq('status', 'active');

      if (error) throw error;
      setStudents((data as any) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name, section')
        .eq('status', 'active');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchClasses()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendanceData();
    }
  }, [selectedClass, selectedDate]);

  const markBulkAttendance = async () => {
    if (!selectedClass || Object.keys(selectedStudents).length === 0) {
      toast({
        title: "Error",
        description: "Please select a class and mark student attendance",
        variant: "destructive",
      });
      return;
    }

    setMarkingAttendance(true);
    
    try {
      const user = await supabase.auth.getUser();
      const userProfile = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.data.user?.id)
        .single();

      const attendanceRecords = Object.entries(selectedStudents).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        attendance_date: selectedDate,
        status,
        time_in: status === 'present' || status === 'late' ? format(new Date(), 'HH:mm:ss') : null,
        marked_by: user.data.user?.id,
        tenant_id: userProfile.data?.tenant_id
      }));

      const { error } = await supabase
        .from('student_attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,attendance_date,class_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });

      setSelectedStudents({});
      fetchAttendanceData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    } finally {
      setMarkingAttendance(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { color: 'bg-green-500', icon: CheckCircle, label: 'Present' },
      absent: { color: 'bg-red-500', icon: XCircle, label: 'Absent' },
      late: { color: 'bg-yellow-500', icon: Clock, label: 'Late' },
      excused: { color: 'bg-blue-500', icon: AlertCircle, label: 'Excused' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.absent;
    const Icon = config.icon;

    return (
      <Badge variant="secondary" className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredStudents = students.filter(student => 
    !attendanceRecords.find(record => record.student_id === student.id)
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-muted-foreground">Mark and track student attendance</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Mark Class Attendance</DialogTitle>
                <DialogDescription>
                  Select a class and date to mark attendance for students
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="class">Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name} {cls.section && `- ${cls.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedClass && (
                <div>
                  <h3 className="font-semibold mb-3">Students</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {student.profiles?.first_name} {student.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                        </div>
                        <Select
                          value={selectedStudents[student.id] || ''}
                          onValueChange={(value) => 
                            setSelectedStudents(prev => ({...prev, [student.id]: value}))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={markBulkAttendance} 
                      disabled={markingAttendance}
                    >
                      {markingAttendance ? 'Marking...' : 'Mark Attendance'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendanceRecords.filter(r => r.status === 'present').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {attendanceRecords.filter(r => r.status === 'absent').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {attendanceRecords.filter(r => r.status === 'late').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {attendanceRecords.length > 0 
                ? Math.round((attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length / attendanceRecords.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>
            Current attendance records for {format(parseISO(selectedDate), 'MMMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No attendance records</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No attendance has been marked for the selected date and class.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">
                        {record.students?.profiles?.first_name} {record.students?.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.students?.student_id} • {record.classes?.class_name} {record.classes?.section}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground">Note: {record.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {record.time_in && (
                      <div className="text-sm text-muted-foreground">
                        In: {record.time_in}
                      </div>
                    )}
                    {record.time_out && (
                      <div className="text-sm text-muted-foreground">
                        Out: {record.time_out}
                      </div>
                    )}
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManagement;