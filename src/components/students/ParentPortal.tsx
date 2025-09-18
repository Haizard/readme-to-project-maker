import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Users, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ParentStudentRelationship {
  id: string;
  parent_id: string;
  student_id: string;
  tenant_id: string;
  relationship_type: string;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  created_at: string;
  students?: {
    student_id: string;
    user_id?: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
  parent_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
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

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export default function ParentPortal() {
  const { profile } = useAuth();
  const [relationships, setRelationships] = useState<ParentStudentRelationship[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<ParentStudentRelationship | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parent_student_relationships')
        .select(`
          *,
          students!inner (
            student_id,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error('Error fetching parent-student relationships:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parent-student relationships",
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
          user_id
        `)
        .eq('status', 'active')
        .order('student_id');

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = data?.map(s => s.user_id).filter(Boolean) || [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
          
        if (!profilesError) {
          const studentsWithProfiles = data?.map(student => ({
            ...student,
            profiles: profiles?.find(p => p.id === student.user_id)
          })) || [];
          setStudents(studentsWithProfiles);
          return;
        }
      }
      
      setStudents(data || []);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchParents = async () => {
    try {
      // Get users with parent role or students' emergency contacts
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .or('role.eq.parent,role.eq.guardian') // Assuming parent/guardian roles exist
        .order('first_name');

      if (error) throw error;
      setParents(data || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  useEffect(() => {
    fetchRelationships();
    fetchStudents();
    fetchParents();
  }, []);

  const handleSaveRelationship = async (relationshipData: Partial<ParentStudentRelationship>) => {
    try {
      if (isEditing && selectedRelationship) {
        const { error } = await supabase
          .from('parent_student_relationships')
          .update(relationshipData)
          .eq('id', selectedRelationship.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Parent-student relationship updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('parent_student_relationships')
          .insert({
            parent_id: relationshipData.parent_id!,
            student_id: relationshipData.student_id!,
            relationship_type: relationshipData.relationship_type!,
            tenant_id: profile?.tenant_id!,
            is_primary_contact: relationshipData.is_primary_contact || false,
            is_emergency_contact: relationshipData.is_emergency_contact || false
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Parent-student relationship created successfully",
        });
      }

      setIsDialogOpen(false);
      setSelectedRelationship(null);
      setIsEditing(false);
      fetchRelationships();
    } catch (error) {
      console.error('Error saving parent-student relationship:', error);
      toast({
        title: "Error",
        description: "Failed to save parent-student relationship",
        variant: "destructive",
      });
    }
  };

  const filteredRelationships = relationships.filter(relationship =>
    searchTerm === "" ||
    relationship.students?.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relationship.students?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relationship.students?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relationship.parent_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relationship.parent_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relationship.parent_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageRelationships = profile?.role === 'super_admin' || profile?.role === 'tenant_admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search relationships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>
        {canManageRelationships && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedRelationship(null);
                setIsEditing(false);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Relationship
              </Button>
            </DialogTrigger>
            <RelationshipDialog
              relationship={selectedRelationship}
              isEditing={isEditing}
              students={students}
              parents={parents}
              onSave={handleSaveRelationship}
              onClose={() => {
                setIsDialogOpen(false);
                setSelectedRelationship(null);
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
            <CardTitle>Parent-Student Relationships ({filteredRelationships.length})</CardTitle>
            <CardDescription>
              Manage parent-student relationships and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Emergency Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {relationship.parent_profiles?.first_name} {relationship.parent_profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {relationship.parent_profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {relationship.students?.profiles?.first_name} {relationship.students?.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {relationship.students?.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {relationship.relationship_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{relationship.parent_profiles?.email}</div>
                        {relationship.parent_profiles?.phone && (
                          <div className="text-muted-foreground">
                            {relationship.parent_profiles.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {relationship.is_primary_contact && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {relationship.is_emergency_contact && (
                        <Badge variant="destructive">Emergency</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {canManageRelationships && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRelationship(relationship);
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

interface RelationshipDialogProps {
  relationship: ParentStudentRelationship | null;
  isEditing: boolean;
  students: Student[];
  parents: Parent[];
  onSave: (data: Partial<ParentStudentRelationship>) => void;
  onClose: () => void;
}

function RelationshipDialog({
  relationship,
  isEditing,
  students,
  parents,
  onSave,
  onClose
}: RelationshipDialogProps) {
  const [formData, setFormData] = useState<Partial<ParentStudentRelationship>>({
    parent_id: "",
    student_id: "",
    relationship_type: "",
    is_primary_contact: false,
    is_emergency_contact: false
  });

  useEffect(() => {
    if (relationship) {
      setFormData(relationship);
    }
  }, [relationship]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const relationshipTypes = [
    "father",
    "mother",
    "guardian",
    "grandfather",
    "grandmother",
    "uncle",
    "aunt",
    "sibling",
    "other"
  ];

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {!relationship ? "Add Parent-Student Relationship" : "Edit Relationship"}
        </DialogTitle>
        <DialogDescription>
          {!relationship ? "Create a new parent-student relationship" : "Update relationship details"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent *</Label>
            <Select
              value={formData.parent_id || ""}
              onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent" />
              </SelectTrigger>
              <SelectContent>
                {parents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.first_name} {parent.last_name} ({parent.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="student_id">Student *</Label>
            <Select
              value={formData.student_id || ""}
              onValueChange={(value) => setFormData({ ...formData, student_id: value })}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship_type">Relationship Type *</Label>
          <Select
            value={formData.relationship_type || ""}
            onValueChange={(value) => setFormData({ ...formData, relationship_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship type" />
            </SelectTrigger>
            <SelectContent>
              {relationshipTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_primary_contact"
              checked={formData.is_primary_contact || false}
              onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_primary_contact">Primary Contact</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_emergency_contact"
              checked={formData.is_emergency_contact || false}
              onChange={(e) => setFormData({ ...formData, is_emergency_contact: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_emergency_contact">Emergency Contact</Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {relationship ? "Update Relationship" : "Create Relationship"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}