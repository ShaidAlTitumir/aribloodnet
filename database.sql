-- BloodLink BD - Database Schema
-- Supabase PostgreSQL

-- DROP EVERYTHING (Order is important because of relationships)
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.sync_donor_profile();
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS token_transactions CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS donors CASCADE;
DROP TABLE IF EXISTS emergency_requests CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Stores basic user information and donor status
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    blood_type TEXT,
    district TEXT,
    thana TEXT,
    is_donor BOOLEAN DEFAULT FALSE,
    date_of_birth DATE,
    height_cm INTEGER,
    weight_kg INTEGER,
    gender TEXT,
    last_donation_date DATE,
    total_donations INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DONORS TABLE
-- Stores detailed donor information (publicly searchable)
CREATE TABLE IF NOT EXISTS donors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    blood_type TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    district TEXT NOT NULL,
    thana TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    weight_kg INTEGER,
    height_cm INTEGER,
    last_donation_date DATE, -- Can be NULL for unknown/never
    medical_conditions TEXT,
    organ_donor BOOLEAN DEFAULT FALSE,
    availability TEXT DEFAULT 'Available',
    verified BOOLEAN DEFAULT FALSE,
    total_donations INTEGER DEFAULT 0,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMERGENCY REQUESTS TABLE
CREATE TABLE IF NOT EXISTS emergency_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    blood_type_needed TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    hospital_name TEXT NOT NULL,
    reason TEXT,
    district TEXT NOT NULL,
    thana TEXT NOT NULL,
    urgency TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    needed_date DATE NOT NULL,
    bags_needed INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'Active',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_name TEXT NOT NULL,
    district TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    token_balance INTEGER DEFAULT 0,
    subscription_plan TEXT DEFAULT 'Starter',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TOKEN TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    action TEXT NOT NULL,
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    district TEXT NOT NULL,
    thana TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    logo_url TEXT,
    facebook_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Member', -- 'Admin', 'Member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Donors Policies
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors are viewable by everyone" 
ON donors FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create donor records" 
ON donors FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Donors can update their own records" 
ON donors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Donors can delete their own records" 
ON donors FOR DELETE 
USING (auth.uid() = user_id);

-- Emergency Requests Policies
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Emergency requests are viewable by everyone" 
ON emergency_requests FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create requests" 
ON emergency_requests FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own requests" 
ON emergency_requests FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can delete expired requests" 
ON emergency_requests FOR DELETE 
USING (needed_date < CURRENT_DATE);

CREATE POLICY "Users can delete their own requests" 
ON emergency_requests FOR DELETE 
USING (auth.uid() = user_id);

-- Hospitals Policies
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospitals are viewable by everyone" 
ON hospitals FOR SELECT 
USING (true);

CREATE POLICY "Hospitals can update their own profile" 
ON hospitals FOR UPDATE 
USING (auth.uid() = user_id);

-- Token Transactions Policies
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
ON token_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Groups Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are viewable by everyone" 
ON groups FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create groups" 
ON groups FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins or creators can update their groups" 
ON groups FOR UPDATE 
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = groups.id 
        AND user_id = auth.uid() 
        AND role = 'Admin'
    )
);

CREATE POLICY "Admins or creators can delete their groups" 
ON groups FOR DELETE 
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = groups.id 
        AND user_id = auth.uid() 
        AND role = 'Admin'
    )
);

-- Group Members Policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members are viewable by everyone" 
ON group_members FOR SELECT 
USING (true);

CREATE POLICY "Users can join groups" 
ON group_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
ON group_members FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage group members" 
ON group_members FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = group_members.group_id 
        AND user_id = auth.uid() 
        AND role = 'Admin'
    )
);

-- FUNCTIONS & TRIGGERS

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, is_donor)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email,
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync donor profile
CREATE OR REPLACE FUNCTION public.sync_donor_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_donor = TRUE THEN
        -- Upsert into donors
        INSERT INTO public.donors (
            user_id, full_name, blood_type, district, thana, phone, email, 
            date_of_birth, height_cm, weight_kg, gender, last_donation_date, total_donations
        )
        VALUES (
            NEW.id, NEW.full_name, COALESCE(NEW.blood_type, 'Unknown'), 
            COALESCE(NEW.district, 'Unknown'), COALESCE(NEW.thana, 'Unknown'), 
            COALESCE(NEW.phone, 'Unknown'), NEW.email, 
            NEW.date_of_birth, NEW.height_cm, NEW.weight_kg, NEW.gender, 
            NEW.last_donation_date, COALESCE(NEW.total_donations, 0)
        )
        ON CONFLICT (user_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            blood_type = EXCLUDED.blood_type,
            district = EXCLUDED.district,
            thana = EXCLUDED.thana,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            date_of_birth = EXCLUDED.date_of_birth,
            height_cm = EXCLUDED.height_cm,
            weight_kg = EXCLUDED.weight_kg,
            gender = EXCLUDED.gender,
            last_donation_date = EXCLUDED.last_donation_date,
            total_donations = EXCLUDED.total_donations;
    ELSE
        -- Delete from donors if is_donor is false
        DELETE FROM public.donors WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for donor sync
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    AFTER INSERT OR UPDATE OF is_donor, full_name, blood_type, district, thana, phone, email, date_of_birth, height_cm, weight_kg, gender, last_donation_date, total_donations
    ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_donor_profile();
