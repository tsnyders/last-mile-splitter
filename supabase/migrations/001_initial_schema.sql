-- Create Tables
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 4,
  available_seats INTEGER NOT NULL DEFAULT 3,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'completed', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.ride_participants (
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (ride_id, user_id)
);

--  Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Anyone can read, only the user can update their own profile
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Rides: Anyone can read, only authenticated users can create, creator can update
CREATE POLICY "Rides are viewable by everyone." ON public.rides FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rides." ON public.rides FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their rides." ON public.rides FOR UPDATE USING (auth.uid() = creator_id);

-- Participants: Anyone can read, authenticated users can join, users can leave
CREATE POLICY "Participants are viewable by everyone." ON public.ride_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join rides." ON public.ride_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rides." ON public.ride_participants FOR DELETE USING (auth.uid() = user_id);

--  Realtime for the Rides table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
