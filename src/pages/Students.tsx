import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, GraduationCap, FileText, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import StudentProfiles from "@/components/students/StudentProfiles";
import StudentEnrollment from "@/components/students/StudentEnrollment";
import StudentAcademicRecords from "@/components/students/StudentAcademicRecords";
import StudentAttendance from "@/components/students/StudentAttendance";
import ParentPortal from "@/components/students/ParentPortal";

export default function Students() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profiles");

  // Role-based tab filtering
  const availableTabs = [
    {
      id: "profiles",
      label: "Student Profiles",
      icon: Users,
      component: StudentProfiles,
      roles: ["super_admin", "tenant_admin", "teacher", "staff"]
    },
    {
      id: "enrollment",
      label: "Enrollment",
      icon: UserPlus,
      component: StudentEnrollment,
      roles: ["super_admin", "tenant_admin"]
    },
    {
      id: "academic",
      label: "Academic Records",
      icon: GraduationCap,
      component: StudentAcademicRecords,
      roles: ["super_admin", "tenant_admin", "teacher"]
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: Calendar,
      component: StudentAttendance,
      roles: ["super_admin", "tenant_admin", "teacher", "staff"]
    },
    {
      id: "parent",
      label: "Parent Portal",
      icon: FileText,
      component: ParentPortal,
      roles: ["super_admin", "tenant_admin"]
    }
  ].filter(tab => tab.roles.includes(profile?.role || ""));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          Manage student profiles, enrollment, and academic records
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {availableTabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>
                    {tab.id === "profiles" && "Manage student personal information and profiles"}
                    {tab.id === "enrollment" && "Handle student enrollment and registration processes"}
                    {tab.id === "academic" && "Track academic progress and maintain student records"}
                    {tab.id === "attendance" && "Monitor student attendance and manage records"}
                    {tab.id === "parent" && "Parent access to student information and communication"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Component />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}