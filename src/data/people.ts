export type Person = {
  name: string;
  age: number;
  country: string;
  flag: string;
  online: boolean;
  duration: string;
  pay: string;
  avatar: string;
};

const names: Array<[string, string, string]> = [
  ["Emma", "Sweden", "🇸🇪"],
  ["Lucas", "Germany", "🇩🇪"],
  ["Sophie", "France", "🇫🇷"],
  ["Oliver", "England", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"],
  ["Hanna", "Norway", "🇳🇴"],
  ["Mateo", "Spain", "🇪🇸"],
  ["Chloe", "Canada", "🇨🇦"],
  ["Liam", "Ireland", "🇮🇪"],
  ["Isabella", "Italy", "🇮🇹"],
  ["Noah", "Netherlands", "🇳🇱"],
  ["Amelia", "Australia", "🇦🇺"],
  ["Felix", "Austria", "🇦🇹"],
  ["Julia", "Poland", "🇵🇱"],
  ["Ethan", "USA", "🇺🇸"],
  ["Mia", "Denmark", "🇩🇰"],
  ["Leon", "Switzerland", "🇨🇭"],
  ["Clara", "Belgium", "🇧🇪"],
  ["Jack", "Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"],
  ["Nora", "Finland", "🇫🇮"],
  ["Daniel", "Portugal", "🇵🇹"],
  ["Elena", "Greece", "🇬🇷"],
  ["Victor", "Czechia", "🇨🇿"],
  ["Anna", "Estonia", "🇪🇪"],
  ["Marc", "Luxembourg", "🇱🇺"],
  ["Lily", "New Zealand", "🇳🇿"],
  ["Tobias", "Iceland", "🇮🇸"],
  ["Sara", "Croatia", "🇭🇷"],
  ["Henry", "Wales", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"],
  ["Alice", "Hungary", "🇭🇺"],
  ["Simon", "Slovakia", "🇸🇰"],
  ["Freya", "Latvia", "🇱🇻"],
  ["Adam", "Romania", "🇷🇴"],
  ["Nina", "Slovenia", "🇸🇮"],
  ["Max", "Liechtenstein", "🇱🇮"],
  ["Ella", "Malta", "🇲🇹"],
  ["Paul", "Monaco", "🇲🇨"],
  ["Zoe", "Cyprus", "🇨🇾"],
  ["Ryan", "USA", "🇺🇸"],
  ["Maja", "Serbia", "🇷🇸"],
  ["Theo", "France", "🇫🇷"],
  ["Ines", "Spain", "🇪🇸"],
  ["Erik", "Sweden", "🇸🇪"],
  ["Laura", "Germany", "🇩🇪"],
  ["Owen", "Canada", "🇨🇦"],
  ["Marie", "France", "🇫🇷"],
  ["Kai", "Netherlands", "🇳🇱"],
  ["Rosa", "Italy", "🇮🇹"],
  ["Sean", "Ireland", "🇮🇪"],
  ["Petra", "Austria", "🇦🇹"],
  ["Jonas", "Norway", "🇳🇴"],
];

const ages = [26, 39, 30, 21, 34, 25, 38, 29, 42, 33, 24, 37, 28, 41, 32, 23, 36, 27, 40, 31, 22, 35];
const plans: Array<[string, string]> = [
  ["Dakika 20", "TZS 30,000"],
  ["Dakika 30", "TZS 50,000"],
  ["Dakika 45", "TZS 65,000"],
  ["Saa moja", "TZS 120,000"],
  ["Masaa mawili", "TZS 150,000"],
];
const onlinePattern = [true, true, false, true, true];

const LIVE_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1611432579699-484f7990b127?auto=format&fit=crop&w=400&q=80",
] as const;

export const people: Person[] = names.map(([name, country, flag], i) => ({
  name,
  country,
  flag,
  age: ages[i % ages.length]!,
  online: onlinePattern[i % onlinePattern.length]!,
  duration: plans[i % plans.length]![0],
  pay: plans[i % plans.length]![1],
  avatar: LIVE_AVATARS[i] ?? `https://i.pravatar.cc/160?img=${(i % 70) + 1}`,
}));

export const withdrawals = [
  "Juma M. ametoka kutoa TZS 150,000 kupitia M-Pesa • Dakika 2 zilizopita",
  "Amina K. ametoka kutoa TZS 270,000 kupitia Tigo Pesa • Dakika 5 zilizopita",
  "Baraka L. ametoka kutoa TZS 85,000 kupitia Airtel Money • Hivi sasa",
  "Neema S. ametoka kutoa TZS 108,000 kupitia HaloPesa • Dakika 1 iliyopita",
];

export const reviews = [
  {
    name: "Amina Hassan",
    city: "Dar es Salaam",
    text: "Nimechati dakika 30 nikalipwa TZS 50,000 bila usumbufu. Site ni ya uhakika kabisa.",
  },
  {
    name: "Joseph Mwakalinga",
    city: "Mbeya",
    text: "Mwanzoni nilikuwa na shaka, lakini malipo yalikuja haraka. Naipendekeza kwa kila mtu.",
  },
  {
    name: "Neema Kimaro",
    city: "Arusha",
    text: "Wazungu wanaongea vizuri na wanajibu kwa heshima. Huduma kwa wateja ni wepesi kujibu.",
  },
  {
    name: "Baraka Msigwa",
    city: "Dodoma",
    text: "Talkswahili imenisaidia kupata kipato cha ziada kila siku nikiwa nyumbani. Asante sana.",
  },
  {
    name: "Sarah Mollel",
    city: "Moshi",
    text: "Nilitoa pesa yangu ikaingia M-Pesa ndani ya dakika chache. Ni halali na ya kuaminika.",
  },
  {
    name: "Emmanuel Chuwa",
    city: "Mwanza",
    text: "Mfumo ni rahisi kutumia hata kwenye simu ndogo. Nashauri uongeze wazungu zaidi online.",
  },
];
