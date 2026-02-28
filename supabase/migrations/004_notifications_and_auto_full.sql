-- Notifications table + trigger for "someone joined your ride"

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'rider_joined',
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications."
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications."
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime so the bell updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: when someone joins a ride, notify the creator
CREATE OR REPLACE FUNCTION public.notify_ride_creator_on_join()
RETURNS TRIGGER AS $$
DECLARE
  v_ride RECORD;
  v_joiner_name TEXT;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = NEW.ride_id;
  IF v_ride.creator_id = NEW.user_id THEN
    RETURN NEW; -- don't notify yourself
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_joiner_name
    FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, ride_id, type, message)
  VALUES (
    v_ride.creator_id,
    NEW.ride_id,
    'rider_joined',
    v_joiner_name || ' joined your ride to ' || v_ride.destination
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_participant_joined ON public.ride_participants;
CREATE TRIGGER on_participant_joined
  AFTER INSERT ON public.ride_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_ride_creator_on_join();

-- Update the seat trigger to also set status='full' when available_seats reaches 0
CREATE OR REPLACE FUNCTION public.update_ride_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rides
    SET
      available_seats = GREATEST(0, available_seats - 1),
      status = CASE WHEN GREATEST(0, available_seats - 1) = 0 THEN 'full' ELSE status END
    WHERE id = NEW.ride_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.rides
    SET
      available_seats = LEAST(total_seats, available_seats + 1),
      status = CASE WHEN status = 'full' THEN 'open' ELSE status END
    WHERE id = OLD.ride_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
