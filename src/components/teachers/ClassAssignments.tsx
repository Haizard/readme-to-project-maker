import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Users, School } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Class {
  id: string;
  class_name: string;
  class_level: string;
  section: string | null;
  capacity: number;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_level: string;
}

interface ClassAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string | null;
  assignment_type: string;
  assigned_at: string;
  teacher: Teacher;
  class: Class;
  subject: Subject | null;
}

interface ClassAssignmentsProps {
  canManage: boolean;
}

export default function ClassAssignments({ canManage }: ClassAssignmentsProps) {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignmentType, setAssignmentType] = useState<'class_teacher' | 'subject_teacher'>('subject_teacher');
  const [classFormData, setClassFormData] = useState({
    class_name: '',
    class_level: 'O-Level' as 'Primary' | 'O-Level' | 'A-Level' | 'University',
    section: '',
    capacity: 30,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch assignments with related data
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('teacher_classes')
        .select(`
          *,
          teacher:profiles!teacher_classes_teacher_id_fkey(id, first_name, last_name, email),
          class:classes(id, class_name, class_level, section, capacity),
          subject:subjects(id, subject_name, subject_level)
        `)
        .order('assigned_at', { ascending: false });

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        toast.error('Failed to load class assignments');
      } else {
        setAssignments(assignmentData || []);
      }

      // Fetch teachers
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

      // Fetch classes
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('status', 'active')
        .order('class_name');

      if (classError) {
        console.error('Error fetching classes:', classError);
      } else {
        setClasses(classData || []);
      }

      // Fetch subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id, subject_name, subject_level')
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
    if (!selectedTeacher || !selectedClass) {
      toast.error('Please select both teacher and class');
      return;
    }

    if (assignmentType === 'subject_teacher' && !selectedSubject) {
      toast.error('Please select a subject for subject teacher assignment');
      return;
    }

    if (!profile?.tenant_id) {
      toast.error('No tenant information found');
      return;
    }

    try {
      const assignmentData = {
        tenant_id: profile.tenant_id,
        teacher_id: selectedTeacher,
        class_id: selectedClass,
        subject_id: assignmentType === 'subject_teacher' ? selectedSubject : null,
        assignment_type: assignmentType,
        assigned_by: profile.id,
      };

      const { error } = await supabase
        .from('teacher_classes')
        .insert([assignmentData]);

      if (error) {
        if (error.code === '23505') {
          toast.error('This assignment already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Teacher assigned successfully');
      setIsDialogOpen(false);
      resetAssignmentForm();
      fetchData();
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      toast.error('Failed to assign teacher');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.tenant_id) {
      toast.error('No tenant information found');
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .insert([{
          tenant_id: profile.tenant_id,
          ...classFormData,
          created_by: profile.id,
        }]);

      if (error) throw error;
      toast.success('Class created successfully');
      setIsClassDialogOpen(false);
      setClassFormData({
        class_name: '',
        class_level: 'O-Level',
        section: '',
        capacity: 30,
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    }
  };

  const resetAssignmentForm = () => {
    setSelectedTeacher('');
    setSelectedClass('');
    setSelectedSubject('');
    setAssignmentType('subject_teacher');
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      toast.success('Assignment removed successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  const getAssignmentTypeBadge = (type: string) => {
    return type === 'class_teacher' 
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
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

  if (loading) {
    return <div>Loading class assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Class Assignments</h3>
          <p className="text-sm text-muted-foreground">
            Assign teachers to classes as class teachers or subject teachers
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <School className="h-4 w-4 mr-2" />
                  Create Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Add a new class to assign teachers to.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="class_name">Class Name</Label>
                    <Input
                      id="class_name"
                      value={classFormData.class_name}
                      onChange={(e) => setClassFormData({ ...classFormData, class_name: e.target.value })}
                      placeholder="e.g., Form 1, Grade 5"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class_level">Level</Label>
                      <Select
                        value={classFormData.class_level}
                        onValueChange={(value: any) => setClassFormData({ ...classFormData, class_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Primary">Primary</SelectItem>
                          <SelectItem value="O-Level">O-Level</SelectItem>
                          <SelectItem value="A-Level">A-Level</SelectItem>
                          <SelectItem value="University">University</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={classFormData.section}
                        onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                        placeholder="A, B, C"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={classFormData.capacity}
                      onChange={(e) => setClassFormData({ ...classFormData, capacity: parseInt(e.target.value) || 30 })}
                      min="1"
                      max="100"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsClassDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Class</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Assign Teacher to Class</DialogTitle>
                  <DialogDescription>
                    Assign a teacher to a class as either a class teacher or subject teacher.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assignment Type</Label>
                    <Select
                      value={assignmentType}
                      onValueChange={(value: any) => setAssignmentType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class_teacher">Class Teacher</SelectItem>
                        <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.class_name} {cls.section ? `(${cls.section})` : ''} - {cls.class_level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {assignmentType === 'subject_teacher' && (
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.subject_name} ({subject.subject_level})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No class assignments found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start by assigning teachers to classes.
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
            <CardTitle>Class Assignments ({assignments.length})</CardTitle>
            <CardDescription>
              Current teacher-class assignments in your school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Assignment Type</TableHead>
                  <TableHead>Subject</TableHead>
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
                    <TableCell>
                      {assignment.class.class_name}
                      {assignment.class.section && ` (${assignment.class.section})`}
                    </TableCell>
                    <TableCell>
                      <Badge className={getLevelBadgeColor(assignment.class.class_level)}>
                        {assignment.class.class_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAssignmentTypeBadge(assignment.assignment_type)}>
                        {assignment.assignment_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.subject ? assignment.subject.subject_name : 'N/A'}
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