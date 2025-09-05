import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Square, 
  Download, 
  Users, 
  Clock, 
  Wifi, 
  ArrowLeft,
  Shield,
  CheckCircle,
  User,
  Mail,
  Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { AttendanceManager, type AttendanceRecord, type SessionState } from "@/lib/attendanceManager";
import * as XLSX from 'xlsx';

const Faculty = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user was logged in before (persist until browser closes)
    return sessionStorage.getItem('facultyLoggedIn') === 'true';
  });
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    startTime: null,
    attendanceRecords: []
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [webhookUrl, setWebhookUrl] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const attendanceManager = AttendanceManager.getInstance();

  // Subscribe to attendance manager updates
  useEffect(() => {
    const unsubscribe = attendanceManager.subscribe((newState) => {
      setSessionState(newState);
    });

    return unsubscribe;
  }, []);

  // Update current time every second for live session duration
  useEffect(() => {
    if (sessionState.isActive) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionState.isActive]);

  // Empty attendance records for fresh start
  const attendanceRecords = sessionState.attendanceRecords;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.username === "faculty" && credentials.password === "password") {
      setIsLoggedIn(true);
      sessionStorage.setItem('facultyLoggedIn', 'true');
      toast({
        title: "Login Successful",
        description: "Welcome to the Faculty Dashboard",
      });
    } else {
      toast({
        title: "Login Failed", 
        description: "Invalid credentials. Use faculty/password for demo.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('facultyLoggedIn');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const startSession = async () => {
    try {
      await attendanceManager.startSession('faculty-user');
      
      toast({
        title: "Session Started",
        description: "Students can now mark attendance",
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Session Start Failed",
        description: "Failed to start session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopSession = async () => {
    try {
      await attendanceManager.stopSession();
      toast({
        title: "Session Stopped", 
        description: "Attendance marking is now closed",
      });
    } catch (error) {
      console.error('Error stopping session:', error);
      toast({
        title: "Error",
        description: "Failed to stop session",
        variant: "destructive"
      });
    }
  };

  const exportAttendance = () => {
    if (attendanceRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for Excel
      const worksheetData = attendanceRecords.map((record, index) => ({
        'S.No': index + 1,
        'Student Name': record.studentName,
        'Roll Number': record.rollNumber,
        'Date': new Date(record.timestamp).toLocaleDateString(),
        'Time': new Date(record.timestamp).toLocaleTimeString(),
        'Device ID': record.deviceId
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },  // S.No
        { wch: 20 }, // Student Name
        { wch: 15 }, // Roll Number
        { wch: 12 }, // Date
        { wch: 12 }, // Time
        { wch: 25 }  // Device ID
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

      // Generate filename with current date and time
      const now = new Date();
      const filename = `Attendance_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${filename} with ${attendanceRecords.length} records`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data",
        variant: "destructive",
      });
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl || !facultyEmail) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both webhook URL and email address",
        variant: "destructive",
      });
      return;
    }

    if (attendanceRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to send",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare email data
      const emailData = {
        to: facultyEmail,
        subject: `Attendance Report - ${new Date().toLocaleDateString()}`,
        attendanceData: attendanceRecords.map((record, index) => ({
          sno: index + 1,
          studentName: record.studentName,
          rollNumber: record.rollNumber,
          date: new Date(record.timestamp).toLocaleDateString(),
          time: new Date(record.timestamp).toLocaleTimeString(),
          deviceId: record.deviceId
        })),
        totalStudents: attendanceRecords.length,
        sessionDate: new Date().toLocaleDateString(),
        sessionStartTime: sessionState.startTime?.toLocaleTimeString() || 'N/A'
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(emailData),
      });

      toast({
        title: "Email Sent",
        description: "Attendance report has been sent to your email. Check your Zapier webhook for confirmation.",
      });

      setIsEmailDialogOpen(false);
    } catch (error) {
      console.error("Email sending error:", error);
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please check your webhook URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionDuration = () => {
    if (!sessionState.startTime) return "00:00:00";
    const diff = currentTime.getTime() - sessionState.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Faculty Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the attendance dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <div className="text-sm text-muted-foreground text-center">
                Demo: username: <code>faculty</code>, password: <code>password</code>
              </div>
            </form>
            <div className="mt-6 text-center">
              <Button variant="ghost" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={sessionState.isActive ? "default" : "secondary"}>
                <Wifi className="h-4 w-4 mr-1" />
                {sessionState.isActive ? "Session Active" : "Session Inactive"}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Session Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Control
            </CardTitle>
            <CardDescription>
              Start and stop attendance sessions for your class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="space-y-2">
                {sessionState.isActive && sessionState.startTime && (
                  <div className="text-sm text-muted-foreground">
                    Session started at: {sessionState.startTime.toLocaleTimeString()}
                  </div>
                )}
                {sessionState.isActive && (
                  <div className="text-lg font-semibold">
                    Duration: {getSessionDuration()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!sessionState.isActive ? (
                  <Button onClick={startSession} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Start Session
                  </Button>
                ) : (
                  <Button onClick={stopSession} variant="destructive" className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Stop Session
                  </Button>
                )}
                <Button onClick={exportAttendance} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Email Attendance Report</DialogTitle>
                      <DialogDescription>
                        Send the attendance report to your email using Zapier webhook
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={sendEmail} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhookUrl">Zapier Webhook URL</Label>
                        <Input
                          id="webhookUrl"
                          type="url"
                          placeholder="https://hooks.zapier.com/hooks/catch/..."
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facultyEmail">Faculty Email</Label>
                        <Input
                          id="facultyEmail"
                          type="email"
                          placeholder="faculty@university.edu"
                          value={facultyEmail}
                          onChange={(e) => setFacultyEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          {isLoading ? "Sending..." : "Send Email"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Present</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{attendanceRecords.length}</div>
              <p className="text-xs text-muted-foreground">
                Students marked present
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${sessionState.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                {sessionState.isActive ? "ACTIVE" : "INACTIVE"}
              </div>
              <p className="text-xs text-muted-foreground">
                Current session state
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Entry</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceRecords.length > 0 ? 
                  new Date(attendanceRecords[attendanceRecords.length - 1].timestamp).toLocaleTimeString() : 
                  "No entries"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Last attendance marked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Attendance Records
            </CardTitle>
            <CardDescription>
              Real-time attendance data for the current session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Device ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.rollNumber}</TableCell>
                      <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.deviceId}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records yet. Start a session to begin tracking.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Faculty;