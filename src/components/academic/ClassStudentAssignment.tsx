import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  user_id: string;
  student_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
  status: string;
  admission_date: string | null;
}

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_status: string;
  enrollment_date: string;
  payment_status: string;
  students: Student;
}

interface ClassData {
  id: string;
  class_name: string;
  section: string | null;
  capacity: number;
}

interface ClassStudentAssignmentProps {
  classData: ClassData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ClassStudentAssignment({ 
  classData, 
  open, 
  onOpenChange, 
  onUpdate 
}: ClassStudentAssignmentProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open, classData.id]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Fetch enrolled students
      const { data: enrolledData, error: enrolledError } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          students!inner(
            id,
            user_id,
            student_id,
            status,
            admission_date
          )
        `)
        .eq('class_id', classData.id)
        .eq('enrollment_status', 'active')
        .eq('tenant_id', profile?.tenant_id);

      if (enrolledError) throw enrolledError;

      // Get student profiles separately
      const studentIds = enrolledData?.map(e => e.students.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds);

      if (profilesError) throw profilesError;

      // Merge profiles with enrollment data
      const enrichedEnrollments = enrolledData?.map(enrollment => ({
        ...enrollment,
        students: {
          ...enrollment.students,
          profiles: profilesData?.find(p => p.id === enrollment.students.user_id) || null
        }
      })) || [];

      setEnrolledStudents(enrichedEnrollments);

      // Fetch available students (not enrolled in this class)
      const enrolledStudentIds = enrichedEnrollments?.map(e => e.student_id) || [];
      
      let availableQuery = supabase
        .from('students')
        .select(`
          id,
          user_id,
          student_id,
          status,
          admission_date
        `)
        .eq('tenant_id', profile?.tenant_id)
        .eq('status', 'active');

      if (enrolledStudentIds.length > 0) {
        availableQuery = availableQuery.not('id', 'in', `(${enrolledStudentIds.join(',')})`);
      }

      const { data: availableData, error: availableError } = await availableQuery;

      if (availableError) throw availableError;

      // Get profiles for available students
      const availableUserIds = availableData?.map(s => s.user_id) || [];
      const { data: availableProfilesData, error: availableProfilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', availableUserIds);

      if (availableProfilesError) throw availableProfilesError;

      // Merge profiles with student data
      const enrichedAvailableStudents = availableData?.map(student => ({
        ...student,
        profiles: availableProfilesData?.find(p => p.id === student.user_id) || null
      })) || [];

      setAvailableStudents(enrichedAvailableStudents);

    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enrollStudent = async (studentId: string) => {
    try {
      // Check if class is at capacity
      if (enrolledStudents.length >= classData.capacity) {
        toast({
          title: "Class Full",
          description: "This class has reached its maximum capacity",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: studentId,
          class_id: classData.id,
          tenant_id: profile?.tenant_id,
          enrollment_status: 'active',
          payment_status: 'pending',
          created_by: profile?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student enrolled successfully",
      });

      fetchStudents();
      onUpdate();
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: "Error",
        description: "Failed to enroll student",
        variant: "destructive",
      });
    }
  };

  const unenrollStudent = async (enrollmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) return;

    try {
      const { error } = await supabase
        .from('student_enrollments')
        .update({ 
          enrollment_status: 'withdrawn',
          updated_by: profile?.id 
        })
        .eq('id', enrollmentId)
        .eq('tenant_id', profile?.tenant_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student removed from class",
      });

      fetchStudents();
      onUpdate();
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student",
        variant: "destructive",
      });
    }
  };

  const getStudentName = (student: Student) => {
    if (student.profiles) {
      return `${student.profiles.first_name} ${student.profiles.last_name}`;
    }
    return 'Unknown Student';
  };

  const filteredEnrolled = enrolledStudents.filter(enrollment => {
    const studentName = getStudentName(enrollment.students);
    return (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.students.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredAvailable = availableStudents.filter(student => {
    const studentName = getStudentName(student);
    return (
      studentName.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(availableSearchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Students - {classData.class_name}</DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Students - {classData.class_name} {classData.section && `(${classData.section})`}
          </DialogTitle>
          <DialogDescription>
            Capacity: {enrolledStudents.length}/{classData.capacity} students
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="enrolled" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enrolled">
              Enrolled Students ({enrolledStudents.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available Students ({availableStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enrolled" className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search enrolled students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {filteredEnrolled.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {enrolledStudents.length === 0 ? 'No students enrolled yet' : 'No students match your search'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrolled.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-mono">
                        {enrollment.students.student_id}
                      </TableCell>
                      <TableCell>{getStudentName(enrollment.students)}</TableCell>
                      <TableCell>
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          enrollment.payment_status === 'paid' ? 'default' : 
                          enrollment.payment_status === 'partial' ? 'secondary' : 'destructive'
                        }>
                          {enrollment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unenrollStudent(enrollment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search available students..."
                value={availableSearchTerm}
                onChange={(e) => setAvailableSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {enrolledStudents.length >= classData.capacity && (
                <Badge variant="destructive">Class Full</Badge>
              )}
            </div>

            {filteredAvailable.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {availableStudents.length === 0 ? 'All eligible students are already enrolled' : 'No students match your search'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailable.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono">
                        {student.student_id}
                      </TableCell>
                      <TableCell>{getStudentName(student)}</TableCell>
                      <TableCell>
                        <Badge variant="default">{student.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {student.admission_date ? 
                          new Date(student.admission_date).toLocaleDateString() : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => enrollStudent(student.id)}
                          disabled={enrolledStudents.length >= classData.capacity}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Enroll
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}