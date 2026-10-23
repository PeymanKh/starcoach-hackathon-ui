import { useCallback, useState } from "react";
import { readSavedLocation, saveLocation, type Location } from "@/lib/location";

/**
 * The user's location for "near me" searches. Saved in the browser: the picker opens by
 * itself only on the first visit, later from the sidebar button.
 */
export function useUserLocation() {
  const [location, setLocation] = useState<Location | null>(readSavedLocation);
  const [pickerOpen, setPickerOpen] = useState(() => readSavedLocation() === null);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const save = useCallback((next: Location) => {
    setLocation(next);
    saveLocation(next);
    setPickerOpen(false);
  }, []);

  return { location, pickerOpen, openPicker, closePicker, save };
}
