import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, BookOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface AcademicRecord {
  id: string;
  student_id: string;
  tenant_id: string;
  academic_year_id?: string;
  subject_id?: string;
  term: string;
  assignment_scores: any;
  exam_scores: any;
  total_score?: number;
  grade?: string;
  remarks?: string;
  teacher_id?: string;
  students?: {
    student_id: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
  subjects?: {
    subject_name: string;
    subject_code?: string;
  };
  academic_years?: {
    year_name: string;
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

interface Subject {
  id: string;
  subject_name: string;
  subject_code?: string;
}

interface AcademicYear {
  id: string;
  year_name: string;
}

export default function StudentAcademicRecords() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AcademicRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('student_academic_records')
        .select(`
          *,
          students (
            student_id,
            profiles:user_id (
              first_name,
              last_name
            )
          ),
          subjects (
            subject_name,
            subject_code
          ),
          academic_years (
            year_name
          )
        `);

      // Apply role-based filtering
      if (profile?.role === 'teacher') {
        query = query.eq('teacher_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching academic records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch academic records",
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

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name, subject_code')
        .eq('status', 'active')
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('id, year_name')
        .eq('status', 'active')
        .order('year_name', { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchStudents();
    fetchSubjects();
    fetchAcademicYears();
  }, [profile]);

  const handleSaveRecord = async (recordData: Partial<AcademicRecord>) => {
    try {
      if (isEditing && selectedRecord) {
        const { error } = await supabase
          .from('student_academic_records')
          .update(recordData)
          .eq('id', selectedRecord.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Academic record updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('student_academic_records')
          .insert({
            ...recordData,
            tenant_id: profile?.tenant_id,
            teacher_id: profile?.id
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Academic record created successfully",
        });
      }

      setIsDialogOpen(false);
      setSelectedRecord(null);
      setIsEditing(false);
      fetchRecords();
    } catch (error) {
      console.error('Error saving academic record:', error);
      toast({
        title: "Error",
        description: "Failed to save academic record",
        variant: "destructive",
      });
    }
  };

  const calculateGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const filteredRecords = records.filter(record =>
    searchTerm === "" ||
    record.students?.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.students?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.students?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.subjects?.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageRecords = profile?.role === 'super_admin' || profile?.role === 'tenant_admin' || profile?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>
        {canManageRecords && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedRecord(null);
                setIsEditing(false);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <AcademicRecordDialog
              record={selectedRecord}
              isEditing={isEditing}
              students={students}
              subjects={subjects}
              academicYears={academicYears}
              onSave={handleSaveRecord}
              onClose={() => {
                setIsDialogOpen(false);
                setSelectedRecord(null);
                setIsEditing(false);
              }}
            />
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Academic Records ({filteredRecords.length})</CardTitle>
            <CardDescription>
              Track student academic progress and maintain grade records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Grade</TableHead>
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
                      <div>
                        <div className="font-medium">{record.subjects?.subject_name}</div>
                        {record.subjects?.subject_code && (
                          <div className="text-sm text-muted-foreground">
                            {record.subjects.subject_code}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{record.academic_years?.year_name || '-'}</TableCell>
                    <TableCell>{record.term}</TableCell>
                    <TableCell>
                      {record.total_score ? `${record.total_score}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {record.grade && (
                        <Badge variant={
                          record.grade === 'A' ? 'default' :
                          record.grade === 'B' ? 'secondary' :
                          record.grade === 'C' ? 'outline' : 'destructive'
                        }>
                          {record.grade}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {canManageRecords && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsEditing(true);
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

interface AcademicRecordDialogProps {
  record: AcademicRecord | null;
  isEditing: boolean;
  students: Student[];
  subjects: Subject[];
  academicYears: AcademicYear[];
  onSave: (data: Partial<AcademicRecord>) => void;
  onClose: () => void;
}

function AcademicRecordDialog({
  record,
  isEditing,
  students,
  subjects,
  academicYears,
  onSave,
  onClose
}: AcademicRecordDialogProps) {
  const [formData, setFormData] = useState<Partial<AcademicRecord>>({
    student_id: "",
    subject_id: "",
    academic_year_id: "",
    term: "",
    assignment_scores: {},
    exam_scores: {},
    total_score: undefined,
    grade: "",
    remarks: ""
  });

  useEffect(() => {
    if (record) {
      setFormData(record);
    }
  }, [record]);

  const calculateTotalScore = () => {
    const assignments = formData.assignment_scores || {};
    const exams = formData.exam_scores || {};
    
    const assignmentTotal = Object.values(assignments).reduce((sum: number, score: any) => sum + (parseFloat(String(score)) || 0), 0);
    const examTotal = Object.values(exams).reduce((sum: number, score: any) => sum + (parseFloat(String(score)) || 0), 0);
    
    // Weighted calculation (assignments 40%, exams 60%)
    const total = (assignmentTotal * 0.4) + (examTotal * 0.6);
    const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';
    
    setFormData({
      ...formData,
      total_score: parseFloat(total.toFixed(2)),
      grade
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {!record ? "Add Academic Record" : "Edit Academic Record"}
        </DialogTitle>
        <DialogDescription>
          {!record ? "Create a new academic record for a student" : "Update student academic record"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student *</Label>
            <Select
              value={formData.student_id || ""}
              onValueChange={(value) => setFormData({ ...formData, student_id: value })}
              disabled={isEditing}
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
            <Label htmlFor="subject_id">Subject *</Label>
            <Select
              value={formData.subject_id || ""}
              onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subject_name} {subject.subject_code && `(${subject.subject_code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="academic_year_id">Academic Year</Label>
            <Select
              value={formData.academic_year_id || ""}
              onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="term">Term *</Label>
            <Select
              value={formData.term || ""}
              onValueChange={(value) => setFormData({ ...formData, term: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assignment Scores (out of 100)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="assignment1">Assignment 1</Label>
                <Input
                  id="assignment1"
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.assignment_scores?.assignment1 || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    assignment_scores: {
                      ...formData.assignment_scores,
                      assignment1: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="assignment2">Assignment 2</Label>
                <Input
                  id="assignment2"
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.assignment_scores?.assignment2 || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    assignment_scores: {
                      ...formData.assignment_scores,
                      assignment2: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Exam Scores (out of 100)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="midterm">Midterm Exam</Label>
                <Input
                  id="midterm"
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.exam_scores?.midterm || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    exam_scores: {
                      ...formData.exam_scores,
                      midterm: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="final">Final Exam</Label>
                <Input
                  id="final"
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.exam_scores?.final || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    exam_scores: {
                      ...formData.exam_scores,
                      final: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <Button type="button" onClick={calculateTotalScore} variant="outline">
            Calculate Total Score & Grade
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_score">Total Score (%)</Label>
              <Input
                id="total_score"
                type="number"
                step="0.01"
                value={formData.total_score || ""}
                onChange={(e) => setFormData({ ...formData, total_score: parseFloat(e.target.value) || undefined })}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={formData.grade || ""}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks || ""}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {record ? "Update Record" : "Create Record"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}