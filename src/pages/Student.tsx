import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Clock, 
  Wifi, 
  ArrowLeft,
  User,
  AlertCircle,
  WifiOff,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { AttendanceManager, type SessionState } from "@/lib/attendanceManager";
import { getNetworkInfo, isOnWhitelistedNetwork } from "@/lib/networkUtils";

interface StudentData {
  name: string;
  rollNumber: string;
  deviceId: string;
}

const Student = () => {
  const { toast } = useToast();
  const [isRegistered, setIsRegistered] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<string>("Checking...");
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    startTime: null,
    attendanceRecords: []
  });
  const [studentData, setStudentData] = useState<StudentData>({
    name: "",
    rollNumber: "",
    deviceId: ""
  });

  const attendanceManager = AttendanceManager.getInstance();

  // Subscribe to attendance manager updates
  useEffect(() => {
    const unsubscribe = attendanceManager.subscribe((newState) => {
      setSessionState(newState);
      
      // Check if this student has already marked attendance
      if (studentData.deviceId && newState.attendanceRecords.some(record => record.deviceId === studentData.deviceId)) {
        setAttendanceMarked(true);
      } else {
        setAttendanceMarked(false);
      }
    });

    return unsubscribe;
  }, [studentData.deviceId]);

  // Check for existing registration on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('studentRegistration');
    if (savedData) {
      const data = JSON.parse(savedData);
      setStudentData(data);
      setIsRegistered(true);
    }
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    try {
      const networkInfo = await getNetworkInfo();
      setNetworkStatus(networkInfo.networkRange);
      setIsAuthorized(networkInfo.networkRange === "Authorized Network");
    } catch (error) {
      setNetworkStatus("Network check failed");
      setIsAuthorized(false);
    }
  };

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.name || !studentData.rollNumber) {
      toast({
        title: "Registration Failed",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const registrationData = {
      ...studentData,
      deviceId: `DEV_${Date.now()}` // Generate unique device ID
    };

    localStorage.setItem('studentRegistration', JSON.stringify(registrationData));
    setStudentData(registrationData);
    setIsRegistered(true);
    
    toast({
      title: "Registration Successful",
      description: "Your device has been registered for attendance",
    });
  };

  const markAttendance = async () => {
    if (!sessionState.isActive) {
      toast({
        title: "No Active Session",
        description: "Faculty has not started an attendance session",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await attendanceManager.markAttendance(
        studentData.name,
        studentData.rollNumber,
        studentData.deviceId
      );

      if (result.success) {
        setAttendanceMarked(true);
        toast({
          title: "Attendance Marked",
          description: `Attendance recorded at ${new Date().toLocaleTimeString()}`,
        });
      } else {
        toast({
          title: "Attendance Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Attendance marking error:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Student Registration</CardTitle>
            <CardDescription>
              Register your device for attendance tracking (one-time setup)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={studentData.name}
                  onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="Enter your roll number"
                  value={studentData.rollNumber}
                  onChange={(e) => setStudentData(prev => ({ ...prev, rollNumber: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Register Device
              </Button>
              <div className="text-sm text-muted-foreground text-center">
                This device will be registered for attendance tracking
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
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Student Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isAuthorized ? "default" : "destructive"}>
                {isAuthorized ? <Wifi className="h-4 w-4 mr-1" /> : <WifiOff className="h-4 w-4 mr-1" />}
                {networkStatus}
              </Badge>
              <Badge variant={sessionState.isActive ? "default" : "destructive"}>
                {sessionState.isActive ? "Session Active" : "No Session"}
              </Badge>
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
        {/* Student Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Student Information
            </CardTitle>
            <CardDescription>
              Your registered details for attendance tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-lg font-semibold">{studentData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Roll Number</Label>
                <p className="text-lg font-semibold">{studentData.rollNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Device ID</Label>
                <Badge variant="outline">{studentData.deviceId}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${sessionState.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                {sessionState.isActive ? "ACTIVE" : "INACTIVE"}
              </div>
              <p className="text-xs text-muted-foreground">
                {sessionState.isActive ? "Faculty has started attendance session" : "No active session"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${attendanceMarked ? 'text-success' : 'text-muted-foreground'}`}>
                {attendanceMarked ? "MARKED" : "PENDING"}
              </div>
              <p className="text-xs text-muted-foreground">
                {attendanceMarked ? "Attendance recorded successfully" : "Click button to mark attendance"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Marking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Mark Attendance
            </CardTitle>
            <CardDescription>
              Click the button below to record your attendance for today's session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {attendanceMarked ? (
                <div className="space-y-4">
                  <CheckCircle className="h-16 w-16 text-success mx-auto" />
                  <h3 className="text-2xl font-bold text-success">Attendance Marked!</h3>
                  <p className="text-muted-foreground">
                    Your attendance was recorded at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto" />
                  <h3 className="text-2xl font-bold">Ready to Mark Attendance</h3>
                  
                  {(!sessionState.isActive || !isAuthorized) && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-warning/10 rounded-lg mb-4">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <span className="text-warning">
                        {!sessionState.isActive ? "No active session" : "Not connected to authorized network"}
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    onClick={markAttendance} 
                    size="lg" 
                    className="px-8"
                    disabled={!sessionState.isActive || !isAuthorized || attendanceMarked}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark Attendance
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Student;