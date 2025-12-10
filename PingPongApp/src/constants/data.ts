import { COLORS } from "./theme";

export interface User {
  name: string;
  rank: number;
  elo: number;
  winRate?: string;
  streak?: number;
  matches?: number;
  avatar: string;
}

export interface Match {
  id: string | number;
  opponent: string;
  date: string;     // e.g. "12/25/2025"
  time: string;     // e.g. "06:30 PM"
  avatar: string;
  elo?: number;
  name?: string; 
}

export interface HistoryItem {
  id: number;
  opponent: string;
  score: string;
  result: 'W' | 'L';
  date: string;
}

export interface Location {
  id: number;
  name: string;
  dist: string;
  traffic: string;
  color: string;
}

export interface DateItem {
  id: number;
  day: string;
  date: number;
}

export const MY_STATS: User = { 
  name: "Julian C.", 
  rank: 14, 
  elo: 1540, 
  winRate: '68%', 
  streak: 5, 
  matches: 42, 
  avatar: "https://i.pravatar.cc/150?u=julian" 
};

// export const MOCK_OPPONENT: Match = { 
//   id: 2, 
//   name: "David W.", 
//   opponent: "David W.",
//   elo: 1510, 
//   avatar: "https://i.pravatar.cc/150?u=david" 
// };

// export const PENDING_MATCHES_LIST: Match[] = [
//   { id: 'm1', opponent: 'David W.', date: 'Today, 10:00 AM', avatar: "https://i.pravatar.cc/150?u=david" },
//   { id: 'm2', opponent: 'Chris P.', date: 'Yesterday', avatar: "https://i.pravatar.cc/150?u=chris" },
// ];

export const HISTORY: HistoryItem[] = [
  { id: 1, opponent: "Sarah L.", score: "11-9, 11-7", result: "W", date: "Yesterday" },
  { id: 2, opponent: "Mike T.", score: "9-11, 8-11", result: "L", date: "3 days ago" },
  { id: 3, opponent: "Alex Z.", score: "11-5, 11-2", result: "W", date: "1 week ago" },
];

// Generate next 7 days
export const DATES: DateItem[] = Array.from({length: 7}, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return { 
    id: i, 
    day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
    date: d.getDate() 
  };
});

// Generate Time Slots
export const TIME_SLOTS: string[] = [];
let startHour = 6; 
for (let i = 0; i < 32; i++) { 
  const totalMin = startHour * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const dispH = h > 12 ? h - 12 : (h === 0 || h === 24 ? 12 : h);
  const dispM = m === 0 ? '00' : '30';
  TIME_SLOTS.push(`${dispH}:${dispM} ${period}`);
}

export interface MatchItem {
  id: string;
  opponent: string;
  avatar?: string;
  time: string;      
  location: string;  
  date: string;
  score?: string;
  result?: 'W' | 'L';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar:  "pic1" | "pic2" | "pic3" | "pic4";
  elo: number;
  creditScore: number;
  rank: number;
  winRate: string;
  streak: number;
  matches: number;
  history: MatchItem[];
  pendingMatches: MatchItem[];
}

export const DEFAULT_USER: UserProfile = {
  id: "",
  name: "Loading...",
  email: "",
  avatar:  "pic1",
  elo: 1000,
  creditScore: 100,
  rank: 0,
  winRate: "0%",
  streak: 0,
  matches: 0,
  history: [],
  pendingMatches: []
};

export const calculateMatchTimes = (dayIndex: number, startTimeStr: string, endTimeStr: string) => {
  // 1. Calculate base date (Today + index)
  // Note: DATES[dayIndex].date is just the day number, so we recalculate from today
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

export const courts = [
  { id: 1, name: 'Gosman', dist: '5 Tables', col: COLORS.success },
  { id: 2, name: 'Sharpiro',   dist: '2 Tables', col: COLORS.ballEnd },
  { id: 3, name: 'IBS',    dist: '1 Table', col: COLORS.danger },
];

export const images = {
  pic1: require('../../resources/image1.png'),
  pic2: require('../../resources/image2.png'),
  pic3: require('../../resources/image3.png'),
  pic4: require('../../resources/image4.png'),

}

export type AvatarType = "pic1" | "pic2" | "pic3" | "pic4";

export interface RedisMatchRequest {
  matchRequestId: string;
  location: "Gosman" | "Shapiro" | "IBS";
  startTimeMs: number;
  endTimeMs: number;
  elo: number;
  creditScore: number;
  profileImage: AvatarType;  // "pic2"
  username: string;

  // If backend adds avatar = profileImage, this becomes required
  avatar?: AvatarType;
}