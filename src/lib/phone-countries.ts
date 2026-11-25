export interface PhoneCountry {
  /** Calling code without the plus sign. */
  code: string;
  name: string;
}

export const DEFAULT_COUNTRY_CODE = "91";

/** Common calling codes offered in the phone dropdown. "Other" lets staff type any code. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "91", name: "India" },
  { code: "971", name: "UAE" },
  { code: "966", name: "Saudi Arabia" },
  { code: "974", name: "Qatar" },
  { code: "965", name: "Kuwait" },
  { code: "968", name: "Oman" },
  { code: "44", name: "UK" },
  { code: "1", name: "USA / Canada" },
  { code: "61", name: "Australia" },
  { code: "64", name: "New Zealand" },
  { code: "65", name: "Singapore" },
  { code: "60", name: "Malaysia" },
  { code: "49", name: "Germany" },
  { code: "33", name: "France" },
];

export const OTHER_COUNTRY = "other";

export interface SplitPhone {
  /** A known calling code, or "other" when it is not in the list. */
  country: string;
  /** Only used when country is "other". */
  customCode: string;
  number: string;
}

/** Splits a stored phone value into the dropdown code and the number. */
export function splitPhone(value: string | null | undefined): SplitPhone {
  const raw = (value ?? "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!raw) {
    return { country: DEFAULT_COUNTRY_CODE, customCode: "", number: "" };
  }

  // Older records: bare Indian numbers with or without 91.
  if (!raw.startsWith("+") && !digits.startsWith("00")) {
    if (digits.length === 12 && digits.startsWith("91")) {
      return { country: "91", customCode: "", number: digits.slice(2) };
    }
    return { country: DEFAULT_COUNTRY_CODE, customCode: "", number: digits };
  }

  const national =
    digits.startsWith("00") && !raw.startsWith("+") ? digits.slice(2) : digits;
  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((country) => national.startsWith(country.code));

  if (match) {
    return {
      country: match.code,
      customCode: "",
      number: national.slice(match.code.length),
    };
  }

  return { country: OTHER_COUNTRY, customCode: "", number: national };
}

/** Builds the single "+<code><number>" value saved with the appointment. */
export function joinPhone(
  country: string,
  customCode: string,
  number: string,
): string {
  const digits = number.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";

  const code =
    country === OTHER_COUNTRY ? customCode.replace(/\D/g, "") : country;

  return `+${code}${digits}`;
}
