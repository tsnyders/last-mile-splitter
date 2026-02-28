

CREATE OR REPLACE FUNCTION public.update_ride_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rides
    SET available_seats = GREATEST(0, available_seats - 1)
    WHERE id = NEW.ride_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.rides
    SET available_seats = LEAST(total_seats, available_seats + 1)
    WHERE id = OLD.ride_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ride_participants_update_seats ON public.ride_participants;
CREATE TRIGGER ride_participants_update_seats
  AFTER INSERT OR DELETE ON public.ride_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_ride_available_seats();
