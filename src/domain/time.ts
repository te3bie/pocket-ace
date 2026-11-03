import { parseDate } from "./finance";
// Convert an unambiguous daytime civil time in an IANA zone to a UTC instant.
export function zonedReminder(date: string, zone: string, hour = 9) {
  parseDate(date);
  const [y, m, d] = date.split("-").map(Number);
  const desired = Date.UTC(y, m - 1, d, hour);
  let instant = desired;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
    );
    const observed = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour,
      +parts.minute,
      +parts.second,
    );
    instant += desired - observed;
  }
  return new Date(instant);
}
export function reminderDate(date: string, daysBefore: number, zone: string) {
  const d = parseDate(date);
  d.setDate(d.getDate() - daysBefore);
  return zonedReminder(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    zone,
  );
}
