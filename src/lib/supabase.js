import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://vzcwporahatctqddphto.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y3dwb3JhaGF0Y3RxZGRwaHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODU2ODAsImV4cCI6MjEwMDU2MTY4MH0.2eUVt9PvHooLM10Qd45UIQG3howKupfm9T3SlUZgT0Q'

export const supabase = createClient(url, key)
