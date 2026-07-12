import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tizvuzrhfjkovhhtxswc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpenZ1enJoZmprb3ZoaHR4c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTkwNTUsImV4cCI6MjA5OTM5NTA1NX0.zppy8hfcT8lgXVc5BHdmvxytPyZwUacA05G0eENAPfU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const VAPID_PUBLIC_KEY = 'BKqgF8f130i6BWWoJuAX6TQkEcgBPt56h424NtzPFyAyEJrD9JocRXPsX2VQhBsjGBf7K9gSQw-O4PwAV6wP2gQ'
