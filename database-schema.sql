-- CollabForge Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Songs table
CREATE TABLE songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policies for songs
CREATE POLICY "Songs are viewable by everyone"
    ON songs FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create songs"
    ON songs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs"
    ON songs FOR UPDATE
    USING (auth.uid() = user_id);

-- Versions table (remixes + originals)
CREATE TABLE versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    song_id UUID REFERENCES songs ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    audio_url TEXT NOT NULL,
    is_original BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Policies for versions
CREATE POLICY "Versions are viewable by everyone"
    ON versions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create versions"
    ON versions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Version likes table
CREATE TABLE version_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    version_id UUID REFERENCES versions ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(version_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE version_likes ENABLE ROW LEVEL SECURITY;

-- Policies for version_likes
CREATE POLICY "Likes are viewable by everyone"
    ON version_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create likes"
    ON version_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON version_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX songs_user_id_idx ON songs(user_id);
CREATE INDEX songs_created_at_idx ON songs(created_at DESC);
CREATE INDEX versions_song_id_idx ON versions(song_id);
CREATE INDEX versions_user_id_idx ON versions(user_id);
CREATE INDEX version_likes_version_id_idx ON version_likes(version_id);
CREATE INDEX version_likes_user_id_idx ON version_likes(user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Note: Username will be added when user completes signup form
    INSERT INTO public.profiles (id, email, username)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test query to verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'songs', 'versions', 'version_likes')
ORDER BY table_name;
