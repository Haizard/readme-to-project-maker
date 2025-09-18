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
import { Plus, Search, Edit, Eye, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Student {
  id: string;
  user_id: string;
  tenant_id: string;
  student_id: string;
  admission_number?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  blood_group?: string;
  previous_school?: string;
  admission_date?: string;
  graduation_date?: string;
  status: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export default function StudentProfiles() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('students')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email,
            phone
          )
        `);

      // Apply role-based filtering
      if (profile?.role === 'teacher' || profile?.role === 'staff') {
        query = query.eq('tenant_id', profile.tenant_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [profile]);

  const handleSaveStudent = async (studentData: Partial<Student>) => {
    try {
      if (isEditing && selectedStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            ...studentData,
            updated_by: profile?.id
          })
          .eq('id', selectedStudent.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Student profile updated successfully",
        });
      } else {
        // For new students, you'd first need to create a user account
        // This is a simplified version - in practice, you'd handle user creation
        toast({
          title: "Info",
          description: "Creating new students requires user account setup",
        });
      }

      setIsDialogOpen(false);
      setSelectedStudent(null);
      setIsEditing(false);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: "Error",
        description: "Failed to save student profile",
        variant: "destructive",
      });
    }
  };

  const filteredStudents = students.filter(student =>
    searchTerm === "" ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageStudents = profile?.role === 'super_admin' || profile?.role === 'tenant_admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>
        {canManageStudents && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedStudent(null);
                setIsEditing(false);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <StudentProfileDialog
              student={selectedStudent}
              isEditing={isEditing}
              onSave={handleSaveStudent}
              onClose={() => {
                setIsDialogOpen(false);
                setSelectedStudent(null);
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
            <CardTitle>Students ({filteredStudents.length})</CardTitle>
            <CardDescription>
              Manage student profiles and personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.student_id}</TableCell>
                    <TableCell>
                      {student.profiles?.first_name} {student.profiles?.last_name}
                    </TableCell>
                    <TableCell>{student.profiles?.email}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsEditing(false);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageStudents && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsEditing(true);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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

interface StudentProfileDialogProps {
  student: Student | null;
  isEditing: boolean;
  onSave: (data: Partial<Student>) => void;
  onClose: () => void;
}

function StudentProfileDialog({ student, isEditing, onSave, onClose }: StudentProfileDialogProps) {
  const [formData, setFormData] = useState<Partial<Student>>({
    student_id: "",
    admission_number: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    medical_conditions: "",
    allergies: "",
    medications: "",
    blood_group: "",
    previous_school: "",
    admission_date: "",
    status: "active"
  });

  useEffect(() => {
    if (student) {
      setFormData(student);
    }
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isViewOnly = !isEditing && student;

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {!student ? "Add New Student" : isEditing ? "Edit Student Profile" : "View Student Profile"}
        </DialogTitle>
        <DialogDescription>
          {!student ? "Create a new student profile" : isEditing ? "Update student information" : "View student details"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID *</Label>
            <Input
              id="student_id"
              value={formData.student_id || ""}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              disabled={isViewOnly}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admission_number">Admission Number</Label>
            <Input
              id="admission_number"
              value={formData.admission_number || ""}
              onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ""}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender || ""}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
              disabled={isViewOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality || ""}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address || ""}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={isViewOnly}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name || ""}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              value={formData.emergency_contact_phone || ""}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
            <Input
              id="emergency_contact_relationship"
              value={formData.emergency_contact_relationship || ""}
              onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="blood_group">Blood Group</Label>
            <Select
              value={formData.blood_group || ""}
              onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
              disabled={isViewOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="previous_school">Previous School</Label>
            <Input
              id="previous_school"
              value={formData.previous_school || ""}
              onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medical_conditions">Medical Conditions</Label>
            <Textarea
              id="medical_conditions"
              value={formData.medical_conditions || ""}
              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
              disabled={isViewOnly}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies || ""}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              disabled={isViewOnly}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medications">Current Medications</Label>
            <Textarea
              id="medications"
              value={formData.medications || ""}
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              disabled={isViewOnly}
              rows={2}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admission_date">Admission Date</Label>
            <Input
              id="admission_date"
              type="date"
              value={formData.admission_date || ""}
              onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
              disabled={isViewOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || "active"}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={isViewOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {isViewOnly ? "Close" : "Cancel"}
          </Button>
          {!isViewOnly && (
            <Button type="submit">
              {student ? "Update Profile" : "Create Profile"}
            </Button>
          )}
        </DialogFooter>
      </form>
    </DialogContent>
  );
}