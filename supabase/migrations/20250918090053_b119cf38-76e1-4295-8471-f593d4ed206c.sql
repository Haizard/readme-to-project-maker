-- Create students table for extended student profiles
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  student_id character varying NOT NULL, -- School-specific student ID
  admission_number character varying,
  date_of_birth date,
  gender character varying,
  nationality character varying,
  address text,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  emergency_contact_relationship character varying,
  medical_conditions text,
  allergies text,
  medications text,
  blood_group character varying,
  previous_school character varying,
  admission_date date,
  graduation_date date,
  status character varying DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE(tenant_id, student_id)
);

-- Create student_enrollments table
CREATE TABLE public.student_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id),
  class_id uuid REFERENCES public.classes(id),
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  enrollment_status character varying DEFAULT 'active',
  fees_paid decimal(10,2) DEFAULT 0,
  fees_total decimal(10,2) DEFAULT 0,
  payment_status character varying DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Create student_academic_records table
CREATE TABLE public.student_academic_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id),
  subject_id uuid REFERENCES public.subjects(id),
  term character varying NOT NULL,
  assignment_scores jsonb DEFAULT '{}',
  exam_scores jsonb DEFAULT '{}',
  total_score decimal(5,2),
  grade character varying,
  remarks text,
  teacher_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create parent_student_relationships table
CREATE TABLE public.parent_student_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  relationship_type character varying NOT NULL, -- father, mother, guardian, etc.
  is_primary_contact boolean DEFAULT false,
  is_emergency_contact boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Create student_attendance table
CREATE TABLE public.student_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id),
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status character varying NOT NULL DEFAULT 'present', -- present, absent, late, excused
  time_in time,
  time_out time,
  notes text,
  marked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Super admins can view all students" ON public.students
  FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage their students" ON public.students
  FOR ALL USING (get_current_user_role() = 'tenant_admin'::app_role AND tenant_id = get_current_user_tenant());

CREATE POLICY "Teachers can view tenant students" ON public.students
  FOR SELECT USING (get_current_user_role() = ANY(ARRAY['teacher'::app_role, 'staff'::app_role]) AND tenant_id = get_current_user_tenant());

CREATE POLICY "Students can view their own profile" ON public.students
  FOR SELECT USING (get_current_user_role() = 'student'::app_role AND user_id = auth.uid());

CREATE POLICY "Students can update their own profile" ON public.students
  FOR UPDATE USING (get_current_user_role() = 'student'::app_role AND user_id = auth.uid());

-- RLS Policies for student_enrollments table
CREATE POLICY "Super admins can view all enrollments" ON public.student_enrollments
  FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage enrollments" ON public.student_enrollments
  FOR ALL USING (get_current_user_role() = 'tenant_admin'::app_role AND tenant_id = get_current_user_tenant());

CREATE POLICY "Teachers can view tenant enrollments" ON public.student_enrollments
  FOR SELECT USING (get_current_user_role() = ANY(ARRAY['teacher'::app_role, 'staff'::app_role]) AND tenant_id = get_current_user_tenant());

-- RLS Policies for student_academic_records table
CREATE POLICY "Super admins can view all academic records" ON public.student_academic_records
  FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage academic records" ON public.student_academic_records
  FOR ALL USING (get_current_user_role() = 'tenant_admin'::app_role AND tenant_id = get_current_user_tenant());

CREATE POLICY "Teachers can manage their subject records" ON public.student_academic_records
  FOR ALL USING (get_current_user_role() = 'teacher'::app_role AND teacher_id = auth.uid() AND tenant_id = get_current_user_tenant());

-- RLS Policies for parent_student_relationships table
CREATE POLICY "Super admins can view all relationships" ON public.parent_student_relationships
  FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage relationships" ON public.parent_student_relationships
  FOR ALL USING (get_current_user_role() = 'tenant_admin'::app_role AND tenant_id = get_current_user_tenant());

CREATE POLICY "Parents can view their children" ON public.parent_student_relationships
  FOR SELECT USING (parent_id = auth.uid());

-- RLS Policies for student_attendance table
CREATE POLICY "Super admins can view all attendance" ON public.student_attendance
  FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage attendance" ON public.student_attendance
  FOR ALL USING (get_current_user_role() = 'tenant_admin'::app_role AND tenant_id = get_current_user_tenant());

CREATE POLICY "Teachers can manage tenant attendance" ON public.student_attendance
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['teacher'::app_role, 'staff'::app_role]) AND tenant_id = get_current_user_tenant());

-- Create indexes for performance
CREATE INDEX idx_students_tenant_id ON public.students(tenant_id);
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_student_enrollments_tenant_id ON public.student_enrollments(tenant_id);
CREATE INDEX idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX idx_student_academic_records_tenant_id ON public.student_academic_records(tenant_id);
CREATE INDEX idx_student_academic_records_student_id ON public.student_academic_records(student_id);
CREATE INDEX idx_parent_student_relationships_tenant_id ON public.parent_student_relationships(tenant_id);
CREATE INDEX idx_parent_student_relationships_parent_id ON public.parent_student_relationships(parent_id);
CREATE INDEX idx_student_attendance_tenant_id ON public.student_attendance(tenant_id);
CREATE INDEX idx_student_attendance_student_id ON public.student_attendance(student_id);
CREATE INDEX idx_student_attendance_date ON public.student_attendance(attendance_date);

-- Add updated_at triggers
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_enrollments_updated_at
  BEFORE UPDATE ON public.student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_academic_records_updated_at
  BEFORE UPDATE ON public.student_academic_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_student_relationships_updated_at
  BEFORE UPDATE ON public.parent_student_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_attendance_updated_at
  BEFORE UPDATE ON public.student_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();