export function formatEventDate(date: string | null, time: string | null): string | null {
  if (!date && !time) return null;
  const parts: string[] = [];
  if (date) {
    const d = new Date(`${date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        new Intl.DateTimeFormat("uk-UA", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(d),
      );
    }
  }
  if (time) parts.push(`о ${time}`);
  return parts.join(", ");
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function pluralUk(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
