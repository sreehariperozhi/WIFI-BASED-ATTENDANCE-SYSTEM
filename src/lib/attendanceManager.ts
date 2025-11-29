import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  studentName: string;
  rollNumber: string;
  timestamp: string;
  deviceId: string;
}

interface SessionState {
  id?: string;
  isActive: boolean;
  startTime: Date | null;
  attendanceRecords: AttendanceRecord[];
  facultyNetworkIP?: string;
  facultyId?: string;
}

class AttendanceManager {
  private static instance: AttendanceManager;
  private sessionState: SessionState = {
    isActive: false,
    startTime: null,
    attendanceRecords: [],
    facultyNetworkIP: undefined
  };
  private listeners: Array<(state: SessionState) => void> = [];
  private realtimeChannel: any = null;

  static getInstance(): AttendanceManager {
    if (!AttendanceManager.instance) {
      AttendanceManager.instance = new AttendanceManager();
      AttendanceManager.instance.initializeRealtimeSubscription();
      AttendanceManager.instance.loadActiveSession();
    }
    return AttendanceManager.instance;
  }

  private async initializeRealtimeSubscription(): Promise<void> {
    this.realtimeChannel = supabase
      .channel('attendance-sessions')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'attendance_sessions' },
        (payload) => this.handleSessionUpdate(payload.new)
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        (payload) => this.handleAttendanceRecordInsert(payload.new)
      )
      .subscribe();
  }

  private async loadActiveSession(): Promise<void> {
    try {
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          attendance_records(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const records = session.attendance_records?.map((record: any) => ({
          id: record.id,
          studentName: record.student_name,
          rollNumber: record.roll_number,
          timestamp: record.timestamp,
          deviceId: record.device_id
        })) || [];

        this.sessionState = {
          id: session.id,
          isActive: session.is_active,
          startTime: session.start_time ? new Date(session.start_time) : null,
          attendanceRecords: records,
          facultyNetworkIP: session.faculty_network_ip,
          facultyId: session.faculty_id
        };
        this.notify();
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  }

  private handleSessionUpdate(sessionData: any): void {
    this.sessionState = {
      ...this.sessionState,
      id: sessionData.id,
      isActive: sessionData.is_active,
      startTime: sessionData.start_time ? new Date(sessionData.start_time) : null,
      facultyNetworkIP: sessionData.faculty_network_ip,
      facultyId: sessionData.faculty_id
    };
    
    if (!sessionData.is_active) {
      this.sessionState.attendanceRecords = [];
    }
    
    this.notify();
  }

  private handleAttendanceRecordInsert(recordData: any): void {
    if (recordData.session_id === this.sessionState.id) {
      const newRecord: AttendanceRecord = {
        id: recordData.id,
        studentName: recordData.student_name,
        rollNumber: recordData.roll_number,
        timestamp: recordData.timestamp,
        deviceId: recordData.device_id
      };

      this.sessionState = {
        ...this.sessionState,
        attendanceRecords: [...this.sessionState.attendanceRecords, newRecord]
      };
      this.notify();
    }
  }

  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.sessionState);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.sessionState));
  }

  async startSession(facultyId: string = 'default-faculty'): Promise<void> {
    try {
      // Stop any existing active sessions
      await supabase
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create new session
      const { data: session, error } = await supabase
        .from('attendance_sessions')
        .insert({
          faculty_id: facultyId,
          is_active: true,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      this.sessionState = {
        id: session.id,
        isActive: true,
        startTime: new Date(),
        attendanceRecords: [],
        facultyId
      };
      this.notify();
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  async stopSession(): Promise<void> {
    try {
      if (this.sessionState.id) {
        const { error } = await supabase
          .from('attendance_sessions')
          .update({ is_active: false })
          .eq('id', this.sessionState.id);

        if (error) throw error;
      }

      this.sessionState = {
        ...this.sessionState,
        isActive: false,
        startTime: null,
        facultyNetworkIP: undefined
      };
      this.notify();
    } catch (error) {
      console.error('Error stopping session:', error);
      throw error;
    }
  }

  async markAttendance(studentName: string, rollNumber: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    if (!this.sessionState.isActive || !this.sessionState.id) {
      return { success: false, message: "No active session" };
    }

    // Check if student is on whitelisted network
    const { isOnWhitelistedNetwork } = await import('./networkUtils');
    const isAuthorized = await isOnWhitelistedNetwork();
    
    if (!isAuthorized) {
      return { success: false, message: "Not connected to authorized network" };
    }

    // Check if student already marked attendance
    const existingRecord = this.sessionState.attendanceRecords.find(
      record => record.deviceId === deviceId
    );

    if (existingRecord) {
      return { success: false, message: "Already marked" };
    }

    try {
      const { data: record, error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: this.sessionState.id,
          student_name: studentName,
          roll_number: rollNumber,
          device_id: deviceId,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // The realtime subscription will handle updating the local state
      return { success: true, message: "Attendance marked successfully" };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return { success: false, message: "Failed to mark attendance" };
    }
  }

  getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  isStudentRegistered(deviceId: string): boolean {
    return this.sessionState.attendanceRecords.some(record => record.deviceId === deviceId);
  }
}

export { AttendanceManager, type AttendanceRecord, type SessionState };