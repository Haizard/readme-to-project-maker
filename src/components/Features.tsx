import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserCheck, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  CreditCard, 
  Home, 
  MessageSquare, 
  BarChart3, 
  Shield 
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Multi-Tenant Architecture",
      description: "Complete data isolation between schools with tenant-aware authentication and authorization.",
      color: "text-education-blue"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Student Management",
      description: "Comprehensive student profiles, enrollment, class assignments, and health records management.",
      color: "text-education-green"
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: "Teacher Management",
      description: "Teacher profiles, qualifications tracking, class assignments, and leave management system.",
      color: "text-education-purple"
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Academic Management",
      description: "Course creation, scheduling, gradebook, and automated report card generation.",
      color: "text-education-orange"
    },
    {
      icon: <UserCheck className="h-8 w-8" />,
      title: "Attendance Tracking",
      description: "Daily attendance with multiple capture methods, real-time updates, and automated notifications.",
      color: "text-education-blue"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Examination & Grading",
      description: "Exam scheduling, mark entry, grade calculations, and promotion management with customizable rules.",
      color: "text-education-green"
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Library Management",
      description: "Comprehensive cataloging, circulation management, and digital resource access control.",
      color: "text-education-purple"
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Finance & Fee Management",
      description: "Fee structure definition, payment tracking, expense management, and financial reporting.",
      color: "text-education-orange"
    },
    {
      icon: <Home className="h-8 w-8" />,
      title: "Dormitory Management",
      description: "Room allocation, visitor management, maintenance requests, and safety compliance tracking.",
      color: "text-education-blue"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Content Management",
      description: "Announcements, event calendar, document sharing, and targeted communication tools.",
      color: "text-education-green"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Admin Dashboard",
      description: "Comprehensive analytics, customizable widgets, reporting tools, and system configuration.",
      color: "text-education-purple"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Audit & Security",
      description: "Complete audit trails, role-based access control, and compliance with privacy regulations.",
      color: "text-education-orange"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gradient">Complete</span> School Management Suite
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Manage every aspect of your educational institution with our comprehensive, 
            secure, and scalable platform designed for modern schools.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="gradient-card border-0 shadow-soft hover:shadow-elevated transition-all duration-300 group"
            >
              <CardHeader className="pb-4">
                <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-lg font-semibold leading-tight">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to transform your school management?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors duration-300 font-semibold">
              Schedule a Demo
            </button>
            <button className="px-8 py-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors duration-300 font-semibold">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;