import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  student_id: string;
  tenant_id: string;
  class_id?: string;
  attendance_date: string;
  status: string;
  time_in?: string;
  time_out?: string;
  notes?: string;
  marked_by?: string;
  students?: {
    student_id: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
  classes?: {
    class_name: string;
    section?: string;
  };
}

interface Student {
  id: string;
  student_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface Class {
  id: string;
  class_name: string;
  section?: string;
}

export default function StudentAttendance() {
  const { profile } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('student_attendance')
        .select(`
          *,
          students (
            student_id,
            profiles:user_id (
              first_name,
              last_name
            )
          ),
          classes (
            class_name,
            section
          )
        `);

      if (selectedDate) {
        query = query.eq('attendance_date', selectedDate);
      }

      if (selectedClass) {
        query = query.eq('class_id', selectedClass);
      }

      const { data, error } = await query.order('attendance_date', { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')
        .order('student_id');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name, section')
        .eq('status', 'active')
        .order('class_name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
    fetchStudents();
    fetchClasses();
  }, [selectedDate, selectedClass]);

  const handleSaveAttendance = async (attendanceData: Partial<AttendanceRecord>) => {
    try {
      if (selectedRecord) {
        const { error } = await supabase
          .from('student_attendance')
          .update({
            ...attendanceData,
            marked_by: profile?.id
          })
          .eq('id', selectedRecord.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Attendance record updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('student_attendance')
          .insert({
            ...attendanceData,
            tenant_id: profile?.tenant_id,
            marked_by: profile?.id
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Attendance record created successfully",
        });
      }

      setIsDialogOpen(false);
      setSelectedRecord(null);
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error saving attendance record:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance record",
        variant: "destructive",
      });
    }
  };

  const handleBulkAttendance = async () => {
    try {
      if (!selectedClass || !selectedDate) {
        toast({
          title: "Error",
          description: "Please select a class and date",
          variant: "destructive",
        });
        return;
      }

      // Get students enrolled in the selected class
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('student_id')
        .eq('class_id', selectedClass)
        .eq('enrollment_status', 'active');

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        toast({
          title: "Info",
          description: "No students found in the selected class",
        });
        return;
      }

      // Create attendance records for all students (default: present)
      const attendanceRecords = enrollments.map(enrollment => ({
        student_id: enrollment.student_id,
        tenant_id: profile?.tenant_id,
        class_id: selectedClass,
        attendance_date: selectedDate,
        status: 'present',
        marked_by: profile?.id
      }));

      const { error } = await supabase
        .from('student_attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,attendance_date'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Bulk attendance marked for ${enrollments.length} students`,
      });

      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark bulk attendance",
        variant: "destructive",
      });
    }
  };

  const filteredRecords = attendanceRecords.filter(record =>
    searchTerm === "" ||
    record.students?.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.students?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.students?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageAttendance = profile?.role === 'super_admin' || profile?.role === 'tenant_admin' || profile?.role === 'teacher' || profile?.role === 'staff';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      case 'excused': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 max-w-sm"
              />
            </div>
          </div>
          {canManageAttendance && (
            <div className="flex gap-2">
              <Button onClick={handleBulkAttendance} variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Mark Bulk Attendance
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setSelectedRecord(null);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </DialogTrigger>
                <AttendanceDialog
                  record={selectedRecord}
                  students={students}
                  classes={classes}
                  onSave={handleSaveAttendance}
                  onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedRecord(null);
                  }}
                />
              </Dialog>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class">Class (Optional)</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records ({filteredRecords.length})</CardTitle>
            <CardDescription>
              Monitor and manage student attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.students?.profiles?.first_name} {record.students?.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.students?.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.classes ? 
                        `${record.classes.class_name}${record.classes.section ? ` - ${record.classes.section}` : ''}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(record.attendance_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.time_in || '-'}</TableCell>
                    <TableCell>{record.time_out || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.notes || '-'}
                    </TableCell>
                    <TableCell>
                      {canManageAttendance && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AttendanceDialogProps {
  record: AttendanceRecord | null;
  students: Student[];
  classes: Class[];
  onSave: (data: Partial<AttendanceRecord>) => void;
  onClose: () => void;
}

function AttendanceDialog({ record, students, classes, onSave, onClose }: AttendanceDialogProps) {
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({
    student_id: "",
    class_id: "",
    attendance_date: new Date().toISOString().split('T')[0],
    status: "present",
    time_in: "",
    time_out: "",
    notes: ""
  });

  useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        attendance_date: record.attendance_date.split('T')[0]
      });
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {!record ? "Mark Attendance" : "Edit Attendance"}
        </DialogTitle>
        <DialogDescription>
          {!record ? "Mark attendance for a student" : "Update attendance record"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student *</Label>
            <Select
              value={formData.student_id || ""}
              onValueChange={(value) => setFormData({ ...formData, student_id: value })}
              disabled={!!record}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.profiles?.first_name} {student.profiles?.last_name} ({student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class_id">Class</Label>
            <Select
              value={formData.class_id || ""}
              onValueChange={(value) => setFormData({ ...formData, class_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="attendance_date">Date *</Label>
            <Input
              id="attendance_date"
              type="date"
              value={formData.attendance_date || ""}
              onChange={(e) => setFormData({ ...formData, attendance_date: e.target.value })}
              disabled={!!record}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status || "present"}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="time_in">Time In</Label>
            <Input
              id="time_in"
              type="time"
              value={formData.time_in || ""}
              onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time_out">Time Out</Label>
            <Input
              id="time_out"
              type="time"
              value={formData.time_out || ""}
              onChange={(e) => setFormData({ ...formData, time_out: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes about attendance"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {record ? "Update Attendance" : "Mark Attendance"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}