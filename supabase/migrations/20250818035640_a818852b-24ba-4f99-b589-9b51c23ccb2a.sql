-- Create attendance sessions table for cross-device sync
CREATE TABLE public.attendance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE,
  faculty_network_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  device_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is for classroom use)
CREATE POLICY "Allow all operations on attendance_sessions" 
ON public.attendance_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on attendance_records" 
ON public.attendance_records 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_attendance_sessions_updated_at
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER TABLE public.attendance_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_records REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;