// src/mocks/data.js

export const MOCK_STAFFS = [
  { 
    id: 1, 
    name: "伊藤 正男", 
    role: "介護福祉士", 
    type: "FullTime", 
    avatar: "👨‍🦳", 
    maxHours: 160, 
    licenses: ["介護福祉士", "実務者研修"] 
  },
  { 
    id: 2, 
    name: "佐藤 花子", 
    role: "ヘルパー", 
    type: "PartTime", 
    avatar: "👩‍🦰", 
    maxHours: 80, 
    licenses: ["初任者研修"] 
  },
  { 
    id: 3, 
    name: "鈴木 一郎", 
    role: "ケアマネ", 
    type: "FullTime", 
    avatar: "👨‍🦱", 
    maxHours: 160, 
    licenses: ["ケアマネジャー", "介護福祉士"] 
  },
  { 
    id: 4, 
    name: "田中 美咲", 
    role: "看護師", 
    type: "FullTime", 
    avatar: "👩‍⚕️", 
    maxHours: 140, 
    licenses: ["看護師", "准看護師"] 
  },
];

const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, '0');

export const MOCK_SHIFTS = [
  { id: '1', title: '早番 (伊藤)', start: `${y}-${m}-01`, backgroundColor: '#0F766E' },
  { id: '2', title: '日勤 (鈴木)', start: `${y}-${m}-02`, backgroundColor: '#14B8A6' },
  { id: '3', title: '夜勤 (佐藤)', start: `${y}-${m}-03`, backgroundColor: '#F59E0B' },
  { id: '4', title: '早番 (田中)', start: `${y}-${m}-05`, backgroundColor: '#0F766E' },
];