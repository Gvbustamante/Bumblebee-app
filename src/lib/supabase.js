import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://ytxhdqonncsvzpszzqub.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eGhkcW9ubmNzdnpwc3p6cXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjY5NzQsImV4cCI6MjEwMzk0Mjk3NH0.JdL6_Sz-8_Sm5YgTfRbU3DP-DCWAllgSnR4tbFp9mao'

export const supabase = createClient(url, key)
