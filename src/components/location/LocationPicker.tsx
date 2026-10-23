import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { LocationMap } from "./LocationMap";
import { isLatitude, isLongitude, type Location } from "@/lib/location";

type LocationPickerProps = {
  open: boolean;
  /** Where the map starts: the saved location, or the default one */
  initial: Location;
  onClose: () => void;
  onSave: (location: Location) => void;
};

/** "Where are you?" popup: move the map or type the coordinates, both stay in sync. */
export function LocationPicker({ open, initial, onClose, onSave }: LocationPickerProps) {
  const [draft, setDraft] = useState(initial);

  // Every time it opens, start from the current saved location
  useEffect(() => {
    if (open) setDraft(initial);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open={open} onClose={onClose} title="لطفا موقعیت جغرافیایی خود را انتخاب کنید">
      <p>
        این موقعیت جغرافیایی با هر پیام به ایجینت ارسال میشود، اما ایجینت آن را نمیبیند و فقط
        برنامه برای پیشنهادها از آن استفاده میکند. این پاپ‌آپ برای تست در نظر گرفته شده اما در دنیای
        واقعی میتوان بصورت اتوماتیک از موقعیت کاربر استفاده کرد.
      </p>

      <LocationMap value={draft} onChange={setDraft} className="h-64 sm:h-72" />

      <div className="grid grid-cols-2 gap-3">
        <CoordinateInput
          label="عرض جغرافیایی (lat)"
          value={draft.lat}
          isValid={isLatitude}
          onChange={(lat) => setDraft((d) => ({ ...d, lat }))}
        />
        <CoordinateInput
          label="طول جغرافیایی (lon)"
          value={draft.lon}
          isValid={isLongitude}
          onChange={(lon) => setDraft((d) => ({ ...d, lon }))}
        />
      </div>

      <button
        type="button"
        onClick={() => onSave(draft)}
        className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-brand text-[14px] font-semibold text-white transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98]"
      >
        ذخیره‌ی موقعیت
      </button>
    </Modal>
  );
}

/**
 * A number box that lets the user type freely ("35.", "-") and only reports valid numbers.
 * While it's not focused, it follows the map.
 */
function CoordinateInput({
  label,
  value,
  isValid,
  onChange,
}: {
  label: string;
  value: number;
  isValid: (n: number) => boolean;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const invalid = text.trim() === "" || !isValid(Number(text));

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-dust">{label}</span>
      <input
        dir="ltr"
        inputMode="decimal"
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value.trim() !== "" && isValid(n)) onChange(n);
        }}
        aria-invalid={invalid}
        className="h-10 rounded-xl border border-white/8 bg-soot px-3 text-[14px] tabular-nums text-bone outline-none transition-colors focus:border-brand/50 aria-[invalid=true]:border-brand"
      />
    </label>
  );
}
