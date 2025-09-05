import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, Users, GraduationCap, Download, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">WiFi Attendance</h1>
            </div>
            <nav className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link to="/student">Student Access</Link>
              </Button>
              <Button asChild>
                <Link to="/faculty">Faculty Login</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Offline WiFi Attendance System
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Secure, reliable attendance tracking that works without internet. 
            Perfect for classrooms, labs, and training sessions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/faculty" className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Faculty Dashboard
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/student" className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Portal
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Wifi className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Offline Operation</CardTitle>
              <CardDescription>
                Works completely offline using local WiFi hotspot. No internet required.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-success mb-4" />
              <CardTitle>Secure Registration</CardTitle>
              <CardDescription>
                One-time device registration prevents proxy attendance and ensures security.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-12 w-12 text-info mb-4" />
              <CardTitle>Real-time Tracking</CardTitle>
              <CardDescription>
                Instant attendance marking with session management and time tracking.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Download className="h-12 w-12 text-warning mb-4" />
              <CardTitle>Easy Export</CardTitle>
              <CardDescription>
                Export attendance data to Excel or CSV for record keeping and analysis.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Bulk Management</CardTitle>
              <CardDescription>
                Handle large classes efficiently with automated student identification.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <GraduationCap className="h-12 w-12 text-success mb-4" />
              <CardTitle>Faculty Control</CardTitle>
              <CardDescription>
                Complete session control with start/stop functionality and attendance overview.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">1</span>
            </div>
            <h4 className="text-xl font-semibold mb-2">Setup WiFi Hotspot</h4>
            <p className="text-muted-foreground">
              Faculty creates a local WiFi hotspot and starts the attendance session.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">2</span>
            </div>
            <h4 className="text-xl font-semibold mb-2">Students Connect</h4>
            <p className="text-muted-foreground">
              Students connect to the WiFi network and register their devices once.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">3</span>
            </div>
            <h4 className="text-xl font-semibold mb-2">Mark Attendance</h4>
            <p className="text-muted-foreground">
              Students mark attendance with one click. Faculty can export data anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 WiFi Attendance System. Built for educational institutions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;