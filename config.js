// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://jegndqysipcssteoosdx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ25kcXlzaXBjc3N0ZW9vc2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTMyNzIsImV4cCI6MjA4NjY2OTI3Mn0.CqXAA_IiTt2X7PHqYn6a1LJXWlyXMnMbl8jrPfNMijE'
};

// Initialize Supabase client (only once)
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
