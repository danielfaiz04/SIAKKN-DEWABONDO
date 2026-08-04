export function getWeeklyRanges() {
  const startDate = new Date(2026, 6, 27); // July 27, 2026 (month is 0-indexed)
  const weeks = [];
  
  for (let i = 0; i < 5; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    weeks.push({
      label: `Minggu ${i + 1}`,
      startDate: weekStart.toISOString().slice(0, 10),
      endDate: weekEnd.toISOString().slice(0, 10),
      displayRange: `${weekStart.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
    });
  }
  
  return weeks;
}

export type WeeklyRange = {
  label: string;
  startDate: string;
  endDate: string;
  displayRange: string;
};
