import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Enrollment {
  id: string;
  student_id: string;
  tenant_id: string;
  academic_year_id?: string;
  class_id?: string;
  enrollment_date: string;
  enrollment_status: string;
  fees_paid: number;
  fees_total: number;
  payment_status: string;
  students?: {
    student_id: string;
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  academic_years?: {
    year_name: string;
  };
  classes?: {
    class_name: string;
    section?: string;
  };
}

interface AcademicYear {
  id: string;
  year_name: string;
  status: string;
}

interface Class {
  id: string;
  class_name: string;
  section?: string;
}

interface Student {
  id: string;
  student_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function StudentEnrollment() {
  const { profile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          students (
            student_id,
            profiles:user_id (
              first_name,
              last_name,
              email
            )
          ),
          academic_years (
            year_name
          ),
          classes (
            class_name,
            section
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch enrollments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('id, year_name, status')
        .eq('status', 'active')
        .order('year_name', { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
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

  useEffect(() => {
    fetchEnrollments();
    fetchAcademicYears();
    fetchClasses();
    fetchStudents();
  }, []);

  const handleSaveEnrollment = async (enrollmentData: Partial<Enrollment>) => {
    try {
      if (isEditing && selectedEnrollment) {
        const { error } = await supabase
          .from('student_enrollments')
          .update({
            ...enrollmentData,
            updated_by: profile?.id
          })
          .eq('id', selectedEnrollment.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Enrollment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('student_enrollments')
          .insert({
            ...enrollmentData,
            tenant_id: profile?.tenant_id,
            created_by: profile?.id
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Student enrolled successfully",
        });
      }

      setIsDialogOpen(false);
      setSelectedEnrollment(null);
      setIsEditing(false);
      fetchEnrollments();
    } catch (error) {
      console.error('Error saving enrollment:', error);
      toast({
        title: "Error",
        description: "Failed to save enrollment",
        variant: "destructive",
      });
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    searchTerm === "" ||
    enrollment.students?.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.students?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.students?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search enrollments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedEnrollment(null);
              setIsEditing(false);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Enroll Student
            </Button>
          </DialogTrigger>
          <EnrollmentDialog
            enrollment={selectedEnrollment}
            isEditing={isEditing}
            students={students}
            academicYears={academicYears}
            classes={classes}
            onSave={handleSaveEnrollment}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedEnrollment(null);
              setIsEditing(false);
            }}
          />
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Student Enrollments ({filteredEnrollments.length})</CardTitle>
            <CardDescription>
              Manage student enrollment and registration processes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {enrollment.students?.profiles?.first_name} {enrollment.students?.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {enrollment.students?.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{enrollment.academic_years?.year_name || '-'}</TableCell>
                    <TableCell>
                      {enrollment.classes ? 
                        `${enrollment.classes.class_name}${enrollment.classes.section ? ` - ${enrollment.classes.section}` : ''}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(enrollment.enrollment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={enrollment.enrollment_status === 'active' ? 'default' : 'secondary'}>
                        {enrollment.enrollment_status}
                      </Badge>
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
                      <div className="text-sm">
                        <div>${enrollment.fees_paid} / ${enrollment.fees_total}</div>
                        <div className="text-muted-foreground">
                          {enrollment.fees_total > 0 ? 
                            `${Math.round((enrollment.fees_paid / enrollment.fees_total) * 100)}%` : 
                            '0%'
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEnrollment(enrollment);
                          setIsEditing(true);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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

interface EnrollmentDialogProps {
  enrollment: Enrollment | null;
  isEditing: boolean;
  students: Student[];
  academicYears: AcademicYear[];
  classes: Class[];
  onSave: (data: Partial<Enrollment>) => void;
  onClose: () => void;
}

function EnrollmentDialog({ 
  enrollment, 
  isEditing, 
  students, 
  academicYears, 
  classes, 
  onSave, 
  onClose 
}: EnrollmentDialogProps) {
  const [formData, setFormData] = useState<Partial<Enrollment>>({
    student_id: "",
    academic_year_id: "",
    class_id: "",
    enrollment_date: new Date().toISOString().split('T')[0],
    enrollment_status: "active",
    fees_paid: 0,
    fees_total: 0,
    payment_status: "pending"
  });

  useEffect(() => {
    if (enrollment) {
      setFormData({
        ...enrollment,
        enrollment_date: enrollment.enrollment_date.split('T')[0]
      });
    }
  }, [enrollment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {!enrollment ? "Enroll Student" : "Edit Enrollment"}
        </DialogTitle>
        <DialogDescription>
          {!enrollment ? "Enroll a student in an academic year and class" : "Update enrollment details"}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="enrollment_date">Enrollment Date</Label>
            <Input
              id="enrollment_date"
              type="date"
              value={formData.enrollment_date || ""}
              onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="enrollment_status">Enrollment Status</Label>
            <Select
              value={formData.enrollment_status || "active"}
              onValueChange={(value) => setFormData({ ...formData, enrollment_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select
              value={formData.payment_status || "pending"}
              onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fees_total">Total Fees</Label>
            <Input
              id="fees_total"
              type="number"
              step="0.01"
              value={formData.fees_total || 0}
              onChange={(e) => setFormData({ ...formData, fees_total: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fees_paid">Fees Paid</Label>
            <Input
              id="fees_paid"
              type="number"
              step="0.01"
              value={formData.fees_paid || 0}
              onChange={(e) => setFormData({ ...formData, fees_paid: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {enrollment ? "Update Enrollment" : "Enroll Student"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}