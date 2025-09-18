import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_level: string;
  subject_type: string;
}

interface TeacherAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  assigned_at: string;
  teacher: Teacher;
  subject: Subject;
}

interface TeacherAssignmentsProps {
  canManage: boolean;
}

export default function TeacherAssignments({ canManage }: TeacherAssignmentsProps) {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch assignments with teacher and subject info
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('teacher_subjects')
        .select(`
          *,
          teacher:profiles!teacher_subjects_teacher_id_fkey(id, first_name, last_name, email),
          subject:subjects(id, subject_name, subject_level, subject_type)
        `)
        .order('assigned_at', { ascending: false });

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        toast.error('Failed to load teacher assignments');
      } else {
        setAssignments(assignmentData || []);
      }

      // Fetch teachers for dropdown
      const { data: teacherData, error: teacherError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'teacher')
        .eq('status', 'active')
        .order('first_name');

      if (teacherError) {
        console.error('Error fetching teachers:', teacherError);
      } else {
        setTeachers(teacherData || []);
      }

      // Fetch subjects for dropdown
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id, subject_name, subject_level, subject_type')
        .eq('status', 'active')
        .order('subject_name');

      if (subjectError) {
        console.error('Error fetching subjects:', subjectError);
      } else {
        setSubjects(subjectData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject) {
      toast.error('Please select both teacher and subject');
      return;
    }

    if (!profile?.tenant_id) {
      toast.error('No tenant information found');
      return;
    }

    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .insert([{
          tenant_id: profile.tenant_id,
          teacher_id: selectedTeacher,
          subject_id: selectedSubject,
          assigned_by: profile.id,
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('This teacher is already assigned to this subject');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Teacher assigned successfully');
      setIsDialogOpen(false);
      setSelectedTeacher('');
      setSelectedSubject('');
      fetchData();
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      toast.error('Failed to assign teacher');
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this teacher assignment?')) return;

    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      toast.success('Teacher unassigned successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error unassigning teacher:', error);
      toast.error('Failed to unassign teacher');
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Primary': return 'bg-blue-100 text-blue-800';
      case 'O-Level': return 'bg-green-100 text-green-800';
      case 'A-Level': return 'bg-purple-100 text-purple-800';
      case 'University': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Core': return 'bg-red-100 text-red-800';
      case 'Optional': return 'bg-yellow-100 text-yellow-800';
      case 'Combination': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading teacher assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Teacher Assignments</h3>
          <p className="text-sm text-muted-foreground">
            Assign teachers to subjects they will teach
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Teacher to Subject</DialogTitle>
                <DialogDescription>
                  Select a teacher and subject to create a new assignment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teacher</label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name} ({teacher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name} ({subject.subject_level} - {subject.subject_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssign}>
                  Assign Teacher
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teacher assignments found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start by assigning teachers to subjects they will teach.
            </p>
            {canManage && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Assignments ({assignments.length})</CardTitle>
            <CardDescription>
              Current teacher-subject assignments in your school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.teacher.first_name} {assignment.teacher.last_name}
                    </TableCell>
                    <TableCell>{assignment.teacher.email}</TableCell>
                    <TableCell>{assignment.subject.subject_name}</TableCell>
                    <TableCell>
                      <Badge className={getLevelBadgeColor(assignment.subject.subject_level)}>
                        {assignment.subject.subject_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(assignment.subject.subject_type)}>
                        {assignment.subject.subject_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassign(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
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