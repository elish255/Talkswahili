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

export const people: Person[] = names.map(([name, country, flag], i) => ({
  name,
  country,
  flag,
  age: ages[i % ages.length]!,
  online: onlinePattern[i % onlinePattern.length]!,
  duration: plans[i % plans.length]![0],
  pay: plans[i % plans.length]![1],
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
