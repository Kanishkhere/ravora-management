"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  OTHER_COUNTRY,
  PHONE_COUNTRIES,
  joinPhone,
  splitPhone,
} from "@/lib/phone-countries";

type PhoneInputProps = {
  /** Stored value, e.g. "+919876543210" or an older bare Indian number. */
  defaultValue?: string | null;
  invalid?: boolean;
  describedBy?: string;
};

/**
 * Country-code dropdown + number box. Submits one combined `phone` value
 * ("+<code><number>") through a hidden input, so forms can read it as before.
 */
export function PhoneInput({
  defaultValue,
  invalid = false,
  describedBy,
}: PhoneInputProps) {
  const [initial] = useState(() => splitPhone(defaultValue));
  const [country, setCountry] = useState(initial.country);
  const [customCode, setCustomCode] = useState(initial.customCode);
  const [number, setNumber] = useState(initial.number);

  const isOther = country === OTHER_COUNTRY;
  const combined = joinPhone(country, customCode, number);

  return (
    <div>
      <input type="hidden" name="phone" value={combined} />
      <div
        className={`flex items-stretch overflow-hidden rounded-xl border bg-paper transition focus-within:border-gold focus-within:shadow-[0_0_0_3px_rgb(170_129_66/12%)] ${
          invalid ? "border-danger" : "border-line"
        }`}
      >
        <div className="relative w-[6.5rem] shrink-0 border-r border-line bg-cream/60">
          <select
            aria-label="Country code"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="h-full w-full cursor-pointer appearance-none border-0 bg-transparent py-3 pl-3 pr-7 text-sm font-bold text-charcoal outline-none"
          >
            {PHONE_COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                +{item.code} {item.name}
              </option>
            ))}
            <option value={OTHER_COUNTRY}>Other</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gold-deep"
          />
        </div>
        {isOther && (
          <input
            aria-label="Custom country code"
            inputMode="numeric"
            value={customCode}
            onChange={(event) => setCustomCode(event.target.value)}
            placeholder="+code"
            maxLength={5}
            className="w-20 shrink-0 border-0 border-r border-line bg-transparent px-3 py-3 text-sm outline-none"
          />
        )}
        <input
          type="tel"
          autoComplete="tel-national"
          aria-label="Phone number"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="Phone number"
          className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-3 outline-none placeholder:text-[#aaa295]"
        />
      </div>
    </div>
  );
}
