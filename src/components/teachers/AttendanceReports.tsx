import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Download, Users, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
}

interface ClassAttendance {
  class_name: string;
  section: string | null;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

interface StudentAttendance {
  student_name: string;
  student_id: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_days: number;
  attendance_rate: number;
}

interface DailyAttendance {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

const AttendanceReports = () => {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0
  });
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classes, setClasses] = useState<{id: string, class_name: string, section: string | null}[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

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

  const fetchAttendanceStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get today's attendance
      let query = supabase
        .from('student_attendance')
        .select('status, students(id)')
        .eq('attendance_date', today);

      if (selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      }

      const { data: todayAttendance, error } = await query;
      if (error) throw error;

      const presentToday = todayAttendance?.filter(r => r.status === 'present').length || 0;
      const absentToday = todayAttendance?.filter(r => r.status === 'absent').length || 0;
      const lateToday = todayAttendance?.filter(r => r.status === 'late').length || 0;
      const totalToday = todayAttendance?.length || 0;

      // Get total students
      let studentQuery = supabase
        .from('students')
        .select('id')
        .eq('status', 'active');

      if (selectedClass !== 'all') {
        studentQuery = studentQuery.eq('class_id', selectedClass);
      }

      const { data: students, error: studentError } = await studentQuery;
      if (studentError) throw studentError;

      const totalStudents = students?.length || 0;
      const attendanceRate = totalToday > 0 ? Math.round(((presentToday + lateToday) / totalToday) * 100) : 0;

      setStats({
        totalStudents,
        presentToday,
        absentToday,
        lateToday,
        attendanceRate
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance statistics",
        variant: "destructive",
      });
    }
  };

  const fetchClassAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('student_attendance')
        .select(`
          status,
          classes (class_name, section)
        `)
        .gte('attendance_date', dateRange.startDate)
        .lte('attendance_date', dateRange.endDate);

      if (error) throw error;

      // Group by class
      const classStats: { [key: string]: ClassAttendance } = {};
      
      data?.forEach(record => {
        if (record.classes) {
          const key = `${record.classes.class_name}-${record.classes.section || ''}`;
          if (!classStats[key]) {
            classStats[key] = {
              class_name: record.classes.class_name,
              section: record.classes.section,
              present: 0,
              absent: 0,
              late: 0,
              total: 0,
              rate: 0
            };
          }
          
          classStats[key][record.status as keyof Pick<ClassAttendance, 'present' | 'absent' | 'late'>]++;
          classStats[key].total++;
        }
      });

      // Calculate rates
      const classAttendanceData = Object.values(classStats).map(cls => ({
        ...cls,
        rate: Math.round(((cls.present + cls.late) / cls.total) * 100) || 0
      }));

      setClassAttendance(classAttendanceData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch class attendance data",
        variant: "destructive",
      });
    }
  };

  const fetchStudentAttendance = async () => {
    try {
      let query = supabase
        .from('student_attendance')
        .select(`
          status,
          students!inner (
            student_id,
            profiles!inner (first_name, last_name)
          )
        `)
        .gte('attendance_date', dateRange.startDate)
        .lte('attendance_date', dateRange.endDate);

      if (selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by student
      const studentStats: { [key: string]: StudentAttendance } = {};
      
      data?.forEach(record => {
        if (record.students?.profiles && typeof record.students.profiles === 'object' && 'first_name' in record.students.profiles && record.students.profiles.first_name && record.students.profiles.last_name) {
          const key = record.students.student_id;
          if (!studentStats[key]) {
            studentStats[key] = {
              student_name: `${record.students.profiles.first_name} ${record.students.profiles.last_name}`,
              student_id: record.students.student_id,
              present_days: 0,
              absent_days: 0,
              late_days: 0,
              total_days: 0,
              attendance_rate: 0
            };
          }
          
          if (record.status === 'present') studentStats[key].present_days++;
          else if (record.status === 'absent') studentStats[key].absent_days++;
          else if (record.status === 'late') studentStats[key].late_days++;
          
          studentStats[key].total_days++;
        }
      });

      // Calculate rates and sort by lowest attendance
      const studentAttendanceData = Object.values(studentStats)
        .map(student => ({
          ...student,
          attendance_rate: Math.round(((student.present_days + student.late_days) / student.total_days) * 100) || 0
        }))
        .sort((a, b) => a.attendance_rate - b.attendance_rate);

      setStudentAttendance(studentAttendanceData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch student attendance data",
        variant: "destructive",
      });
    }
  };

  const fetchDailyAttendance = async () => {
    try {
      let query = supabase
        .from('student_attendance')
        .select('attendance_date, status')
        .gte('attendance_date', dateRange.startDate)
        .lte('attendance_date', dateRange.endDate);

      if (selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const dailyStats: { [key: string]: DailyAttendance } = {};
      
      // Initialize all dates in range
      const dateInterval = eachDayOfInterval({
        start: new Date(dateRange.startDate),
        end: new Date(dateRange.endDate)
      });

      dateInterval.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        dailyStats[dateStr] = {
          date: format(date, 'MMM dd'),
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      });

      data?.forEach(record => {
        const dateStr = record.attendance_date;
        if (dailyStats[dateStr]) {
          if (record.status === 'present') dailyStats[dateStr].present++;
          else if (record.status === 'absent') dailyStats[dateStr].absent++;
          else if (record.status === 'late') dailyStats[dateStr].late++;
          
          dailyStats[dateStr].total++;
        }
      });

      setDailyAttendance(Object.values(dailyStats));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch daily attendance data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchClasses();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchAttendanceStats();
      fetchClassAttendance();
      fetchStudentAttendance();
      fetchDailyAttendance();
    }
  }, [dateRange, selectedClass, loading]);

  const pieData = [
    { name: 'Present', value: stats.presentToday, color: COLORS[0] },
    { name: 'Absent', value: stats.absentToday, color: COLORS[1] },
    { name: 'Late', value: stats.lateToday, color: COLORS[2] }
  ].filter(item => item.value > 0);

  const exportToCSV = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Reports</h2>
          <p className="text-muted-foreground">Comprehensive attendance analytics and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => exportToCSV(studentAttendance, 'student-attendance-report')}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({...prev, startDate: e.target.value}))}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({...prev, endDate: e.target.value}))}
          />
        </div>
        <div>
          <Label htmlFor="class">Filter by Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.class_name} {cls.section && `- ${cls.section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">By Class</TabsTrigger>
          <TabsTrigger value="students">By Student</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classAttendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill={COLORS[0]} />
                    <Bar dataKey="absent" fill={COLORS[1]} />
                    <Bar dataKey="late" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Attendance Report</CardTitle>
              <CardDescription>
                Attendance statistics for each class in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classAttendance.map((cls, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">
                        {cls.class_name} {cls.section && `- ${cls.section}`}
                      </h3>
                      <Badge variant={cls.rate >= 90 ? "secondary" : cls.rate >= 75 ? "default" : "destructive"}>
                        {cls.rate}% Attendance
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-green-600">Present: {cls.present}</div>
                      <div className="text-red-600">Absent: {cls.absent}</div>
                      <div className="text-yellow-600">Late: {cls.late}</div>
                      <div className="text-blue-600">Total: {cls.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Report</CardTitle>
              <CardDescription>
                Individual student attendance statistics (sorted by lowest attendance)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {studentAttendance.map((student, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{student.student_name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                      </div>
                      <Badge variant={student.attendance_rate >= 90 ? "secondary" : student.attendance_rate >= 75 ? "default" : "destructive"}>
                        {student.attendance_rate}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-green-600">Present: {student.present_days}</div>
                      <div className="text-red-600">Absent: {student.absent_days}</div>
                      <div className="text-yellow-600">Late: {student.late_days}</div>
                      <div className="text-blue-600">Total: {student.total_days}</div>
                    </div>
                    {student.attendance_rate < 75 && (
                      <div className="mt-2 text-sm text-red-600 font-medium">
                        ⚠️ Below 75% attendance threshold
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trends</CardTitle>
              <CardDescription>
                Attendance patterns over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke={COLORS[0]} strokeWidth={2} />
                  <Line type="monotone" dataKey="absent" stroke={COLORS[1]} strokeWidth={2} />
                  <Line type="monotone" dataKey="late" stroke={COLORS[2]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceReports;