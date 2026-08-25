-- ============================================
-- FYE HUB - Complete Database Schema
-- University of Mpumalanga
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_number VARCHAR(9) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  faculty VARCHAR(200) NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  orientation_points INTEGER NOT NULL DEFAULT 0,
  orientation_badge VARCHAR(100),
  push_notify_enabled BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. TUTOR PROFILES TABLE
-- ============================================
CREATE TABLE tutor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year_of_study TEXT NOT NULL CHECK (year_of_study IN ('2nd Year', '3rd Year', 'Honours')),
  bio TEXT,
  rating_avg NUMERIC(3,2) DEFAULT 0.00,
  session_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. TUTOR MODULES
-- ============================================
CREATE TABLE tutor_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. TUTOR AVAILABILITY
-- ============================================
CREATE TABLE tutor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. ORIENTATION TASKS
-- ============================================
CREATE TABLE orientation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  badge_level TEXT NOT NULL CHECK (badge_level IN ('urgent', 'important', 'optional')),
  points INTEGER NOT NULL,
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 6. STUDENT TASK PROGRESS
-- ============================================
CREATE TABLE student_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES orientation_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, task_id)
);

-- ============================================
-- 7. CONVERSATIONS (Chat)
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  student_unread INTEGER DEFAULT 0,
  tutor_unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, tutor_id)
);

-- ============================================
-- 8. MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 9. TUTOR SESSIONS
-- ============================================
CREATE TABLE tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,
  session_date DATE NOT NULL,
  duration_hours NUMERIC(3,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 10. REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  session_id UUID REFERENCES tutor_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 11. ANNOUNCEMENTS
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 12. CAMPUS BUILDINGS
-- ============================================
CREATE TABLE campus_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  operating_hours VARCHAR(200),
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 13. PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_student_number ON profiles(student_number);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_tutor_profiles_profile_id ON tutor_profiles(profile_id);
CREATE INDEX idx_tutor_modules_tutor_profile_id ON tutor_modules(tutor_profile_id);
CREATE INDEX idx_tutor_availability_tutor_profile_id ON tutor_availability(tutor_profile_id);
CREATE INDEX idx_conversations_student_id ON conversations(student_id);
CREATE INDEX idx_conversations_tutor_id ON conversations(tutor_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_student_task_progress_student_id ON student_task_progress(student_id);
CREATE INDEX idx_student_task_progress_task_id ON student_task_progress(task_id);
CREATE INDEX idx_announcements_is_published ON announcements(is_published);
CREATE INDEX idx_push_subscriptions_profile_id ON push_subscriptions(profile_id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, student_number, first_name, last_name, email, faculty)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'student_number',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    NEW.raw_user_meta_data->>'faculty'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER: Update tutor rating average
-- ============================================
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tutor_profiles
  SET rating_avg = (
    SELECT AVG(rating)::NUMERIC(3,2)
    FROM reviews
    WHERE tutor_profile_id = NEW.tutor_profile_id
  )
  WHERE id = NEW.tutor_profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_avg
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_tutor_rating();

-- ============================================
-- TRIGGER: Update session count
-- ============================================
CREATE OR REPLACE FUNCTION update_session_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tutor_profiles
  SET session_count = session_count + 1
  WHERE id = NEW.tutor_profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_count
  AFTER INSERT ON tutor_sessions
  FOR EACH ROW EXECUTE FUNCTION update_session_count();

-- ============================================
-- TRIGGER: Update conversation last_message_at
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    tutor_unread = CASE 
      WHEN NEW.sender_id != conversations.tutor_id 
      THEN tutor_unread + 1 
      ELSE tutor_unread 
    END,
    student_unread = CASE 
      WHEN NEW.sender_id != conversations.student_id 
      THEN student_unread + 1 
      ELSE student_unread 
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- TRIGGER: Add orientation points on task completion
-- ============================================
CREATE OR REPLACE FUNCTION add_orientation_points()
RETURNS TRIGGER AS $$
DECLARE
  task_points INTEGER;
BEGIN
  SELECT points INTO task_points
  FROM orientation_tasks
  WHERE id = NEW.task_id;
  
  UPDATE profiles
  SET orientation_points = orientation_points + task_points
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_orientation_points
  AFTER INSERT ON student_task_progress
  FOR EACH ROW EXECUTE FUNCTION add_orientation_points();

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE orientation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: Users can read their own profile, admin can read all
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tutor profiles: All authenticated users can read visible tutors
CREATE POLICY "Anyone can read visible tutors"
  ON tutor_profiles FOR SELECT
  USING (is_visible = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tutor')
  ));

CREATE POLICY "Tutors can update own profile"
  ON tutor_profiles FOR UPDATE
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Conversations: Users can only see their conversations
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  USING (student_id = auth.uid() OR tutor_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (student_id = auth.uid() OR tutor_id = auth.uid());

-- Messages: Users can only read messages from their conversations
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND (student_id = auth.uid() OR tutor_id = auth.uid())
  ));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Orientation tasks: Everyone can read active tasks
CREATE POLICY "Anyone can read active tasks"
  ON orientation_tasks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admin can manage tasks"
  ON orientation_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Student task progress: Students can read/write their own progress
CREATE POLICY "Students can read own progress"
  ON student_task_progress FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can update own progress"
  ON student_task_progress FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Announcements: Anyone can read published announcements
CREATE POLICY "Anyone can read published announcements"
  ON announcements FOR SELECT
  USING (is_published = true);

CREATE POLICY "Only admin can manage announcements"
  ON announcements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Push subscriptions: Users can only manage their own
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (profile_id = auth.uid());

-- ============================================
-- SEED DATA: CAMPUS BUILDINGS
-- ============================================
INSERT INTO campus_buildings (name, description, operating_hours, latitude, longitude) VALUES
('ICT Building', 'Information and Communication Technology building with computer labs and lecture halls.', '07:00 - 22:00 Daily', -25.4625, 30.9850),
('Library', 'Main university library with study areas, computer access, and research support.', '08:00 - 23:00 Weekdays, 09:00 - 17:00 Weekends', -25.4620, 30.9845),
('Admin Block', 'University administration offices including registrars office and student support.', '08:00 - 16:30 Weekdays', -25.4615, 30.9840),
('SRC Building', 'Student Representative Council offices and student meeting spaces.', '09:00 - 17:00 Weekdays', -25.4630, 30.9855),
('Lecture Hall A', 'Main lecture hall for large classes and university events.', '06:00 - 22:00 Daily', -25.4635, 30.9855),
('Lecture Hall B', 'Lecture hall with capacity for 150 students.', '06:00 - 22:00 Daily', -25.4638, 30.9852),
('Lecture Hall C', 'Lecture hall equipped with modern audio-visual equipment.', '06:00 - 22:00 Daily', -25.4640, 30.9848),
('Lecture Hall D', 'Lecture hall for specialized department lectures.', '06:00 - 22:00 Daily', -25.4642, 30.9845),
('Student Finance', 'Student finance office for fees, bursaries, and financial aid.', '08:00 - 16:00 Weekdays', -25.4622, 30.9838),
('IT Help Desk', 'Information technology support and student computer access center.', '07:30 - 21:00 Weekdays, 09:00 - 17:00 Weekends', -25.4628, 30.9842);

-- ============================================
-- SEED DATA: ORIENTATION TASKS
-- ============================================
INSERT INTO orientation_tasks (title, description, category, badge_level, points, due_date, sort_order) VALUES
('Complete Student Registration', 'Ensure your student registration is complete. Visit the Admin Block to verify all documents are processed.', 'Administration', 'urgent', 30, '2026-08-15', 1),
('Get Student ID Card', 'Visit Student Finance to get your official UMP student ID card. Bring your acceptance letter and ID document.', 'Administration', 'urgent', 30, '2026-08-20', 2),
('Activate Student Email', 'Activate your UMP student email account (@ump.ac.za). This is where all official university communications will be sent.', 'Academic Setup', 'urgent', 30, '2026-08-10', 3),
('Set Up LMS Access', 'Log into the UMP Learning Management System and familiarize yourself with your course modules.', 'Academic Setup', 'important', 20, '2026-08-25', 4),
('Tour the Library', 'Visit the library and complete the library orientation. Learn about resources, study spaces, and borrowing policies.', 'Academic Setup', 'important', 20, '2026-08-30', 5),
('Explore Campus Map', 'Take a self-guided tour of the Mbombela campus. Visit all the key buildings and find your lecture halls.', 'Campus Life', 'important', 20, '2026-09-05', 6),
('Connect with SRC', 'Meet your SRC representatives and learn about student governance and representation opportunities.', 'Campus Life', 'optional', 10, '2026-09-10', 7),
('Join a Student Club', 'Explore student clubs and societies. Find a group that interests you and sign up.', 'Campus Life', 'optional', 10, '2026-09-15', 8),
('Set Up Digital Accounts', 'Create passwords and set up all your digital accounts including email, LMS, and library systems.', 'Digital & Online', 'urgent', 30, '2026-08-12', 9),
('Download University Apps', 'Download all recommended university mobile apps for easy access to campus services.', 'Digital & Online', 'optional', 10, '2026-08-28', 10);

-- ============================================
-- SEED DATA: ADMIN ACCOUNT
-- Note: This will be created via Supabase Auth, not direct INSERT
-- The admin user needs to be created through the auth system
-- ============================================
-- After creating the admin user via auth, run:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@ump.ac.za';