import { DateTime } from "luxon";

export function localDateTimeToUtc(value: string, timezone: string) {
  const dateTime = DateTime.fromISO(value, { zone: timezone, setZone: true });
  if (!dateTime.isValid) throw new Error("Date and time are invalid");
  return dateTime.toUTC().toJSDate();
}

export function localDateToDatabaseDate(value: string) {
  const date = DateTime.fromISO(value, { zone: "UTC" });
  if (!date.isValid || value.length !== 10) throw new Error("Date is invalid");
  return date.startOf("day").toJSDate();
}

export function formatInTimezone(value: Date, timezone: string, format = "dd LLL yyyy, h:mm a") {
  return DateTime.fromJSDate(value, { zone: "UTC" }).setZone(timezone).toFormat(format);
}

export function toDateTimeLocalValue(value: Date, timezone: string) {
  return DateTime.fromJSDate(value, { zone: "UTC" }).setZone(timezone).toFormat("yyyy-LL-dd'T'HH:mm");
}

export function minutesToTime(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Time is invalid");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("Time is invalid");
  return hours * 60 + minutes;
}
