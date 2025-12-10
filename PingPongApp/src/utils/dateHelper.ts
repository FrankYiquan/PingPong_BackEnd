import { DATES } from '../constants/data';

export const calculateMatchTimes = (dayIndex: number, startTimeStr: string, endTimeStr: string) => {
  // 1. Calculate base date (Today + index)
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + dayIndex);

  // 2. Helper to parse "6:00 PM" into a Date object
  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours);
    
    if (hours === '12') h = 0;
    if (modifier === 'PM') h += 12;
    
    const d = new Date(baseDate);
    d.setHours(h, parseInt(minutes), 0, 0);
    return d;
  };

  return {
    start: parseTime(startTimeStr),
    end: parseTime(endTimeStr)
  };
};

export const generateLetterCreditScore = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}