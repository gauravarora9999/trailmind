// ── Gradient palette for placeholders ──
export const PALETTE = ['#1B4D31','#0F4C81','#B45309','#7C2D12','#155E75','#6D28D9','#9D174D','#065F46','#1E3A8A','#92400E','#3F6212','#831843'];

// ── Hash function for seeding ──
export function hash(s) { let h=0; for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;} return h; }

// ── Curated image map ──
const CURATED = {
  // Cities
  'dubai,skyline': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=640&h=800&q=80',
  'tokyo,shibuya': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=640&h=800&q=80',
  'london,bigben': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=640&h=800&q=80',
  'paris,eiffel': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=640&h=800&q=80',
  'newyork,manhattan': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=640&h=800&q=80',
  'bali,temple': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=640&h=800&q=80',
  'rome,colosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=640&h=800&q=80',
  'singapore,marina': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=640&h=800&q=80',
  'bangkok,temple': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=640&h=800&q=80',
  'barcelona,sagrada': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=640&h=800&q=80',
  'istanbul,mosque': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=640&h=800&q=80',
  'capetown,mountain': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=640&h=800&q=80',
  // Adventure styles
  'mountain,trek,hiking': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=640&h=800&q=80',
  'beach,island,tropical': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=640&h=800&q=80',
  'city,culture,museum': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=640&h=800&q=80',
  'desert,safari,wildlife': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=640&h=800&q=80',
  'food,wine,market': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=640&h=800&q=80',
  'snow,ski,winter': 'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=640&h=800&q=80',
  'roadtrip,driving,scenic': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=640&h=800&q=80',
  'wellness,yoga,spa': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=640&h=800&q=80',
};

// ── Image URL generator — curated Unsplash with picsum fallback ──
export function img(q) {
  if (CURATED[q]) return CURATED[q];
  // Deterministic fallback using picsum with seeded hash
  const seed = Math.abs(hash(q));
  return `https://picsum.photos/seed/${seed}/640/800`;
}

// ── Placeholder gradient background ──
export function placeholderBg(seed) {
  const c = PALETTE[Math.abs(hash(seed)) % PALETTE.length];
  const c2 = PALETTE[Math.abs(hash(seed + 'x')) % PALETTE.length];
  return `linear-gradient(135deg,${c},${c2})`;
}

// ── Money formatter ──
export function money(n) { return '$' + (n ?? 0).toLocaleString('en-US'); }

// CITIES — 12 cities, 5 activities each
export const CITIES = [
  {name:'Dubai',country:'United Arab Emirates',region:'Middle East',q:'dubai,skyline',minDays:3,maxDays:5,groupTags:['Couple','Friends','Family'],acts:[
    {t:'Burj Khalifa — At the Top',d:'Ride to the 148th floor of the world\'s tallest building for 360° desert-and-sea views.',type:'Landmark',time:'2 hrs',rating:'4.7'},
    {t:'Desert Safari & Dune Bashing',d:'4x4 over red dunes, camel ride, sandboarding and a Bedouin-camp BBQ at sunset.',type:'Adventure',time:'6 hrs',rating:'4.8'},
    {t:'Dubai Marina & Skydive',d:'Tandem skydive over the Palm, or a calmer dhow cruise along the Marina.',type:'Adrenaline',time:'3 hrs',rating:'4.9'},
    {t:'Old Dubai & Gold Souk',d:'Abra boat across the Creek, spice and gold souks, Al Fahidi heritage quarter.',type:'Culture',time:'3 hrs',rating:'4.5'},
    {t:'The Dubai Fountain & Mall',d:'World\'s largest choreographed fountain show beneath the Burj Khalifa.',type:'Free',time:'1 hr',rating:'4.6'},
  ]},
  {name:'Tokyo',country:'Japan',region:'Asia',q:'tokyo,shibuya',minDays:5,maxDays:10,groupTags:['Solo','Couple','Friends'],acts:[
    {t:'Senso-ji Temple & Asakusa',d:'Tokyo\'s oldest temple, incense smoke, Nakamise shopping street and traditional snacks.',type:'Culture',time:'2 hrs',rating:'4.7'},
    {t:'Shibuya Crossing & Sky',d:'Stand in the world\'s busiest intersection then ride up to the Shibuya Sky observation deck.',type:'Landmark',time:'2 hrs',rating:'4.6'},
    {t:'Tsukiji Outer Market food tour',d:'Graze through stalls of tamagoyaki, fresh sushi, wagyu skewers and matcha treats.',type:'Food',time:'3 hrs',rating:'4.9'},
    {t:'teamLab Planets',d:'Walk barefoot through immersive digital-art rooms of water, flowers and light.',type:'Art',time:'2 hrs',rating:'4.8'},
    {t:'Day trip to Mt. Fuji',d:'Bullet train to Kawaguchiko for lake-and-volcano views, ropeway ride and hot springs.',type:'Adventure',time:'Full day',rating:'4.7'},
  ]},
  {name:'London',country:'United Kingdom',region:'Europe',q:'london,bigben',minDays:3,maxDays:6,groupTags:['Solo','Couple','Friends','Family'],acts:[
    {t:'Tower of London & Crown Jewels',d:'Walk the 1,000-year-old fortress, see the Crown Jewels and meet the Beefeaters.',type:'Landmark',time:'3 hrs',rating:'4.6'},
    {t:'British Museum',d:'Free entry to the Rosetta Stone, Egyptian mummies and 8 million artefacts.',type:'Free',time:'3 hrs',rating:'4.8'},
    {t:'Westminster & London Eye',d:'Big Ben, Parliament, Westminster Abbey, then a 30-minute spin on the Eye.',type:'Landmark',time:'2 hrs',rating:'4.5'},
    {t:'West End theatre night',d:'World-class musicals and plays in Theatreland — pre-book for the best seats.',type:'Nightlife',time:'3 hrs',rating:'4.8'},
    {t:'Camden Market & canal walk',d:'Street food from 40 cuisines, vintage shops and a stroll along Regent\'s Canal.',type:'Food',time:'2 hrs',rating:'4.4'},
  ]},
  {name:'Paris',country:'France',region:'Europe',q:'paris,eiffel',minDays:3,maxDays:5,groupTags:['Couple','Solo','Friends'],acts:[
    {t:'Eiffel Tower summit',d:'Elevator to the top for panoramic views across Paris, best at golden hour.',type:'Landmark',time:'2 hrs',rating:'4.7'},
    {t:'Louvre Museum',d:'Mona Lisa, Venus de Milo and 35,000 works in the world\'s largest art museum.',type:'Art',time:'3 hrs',rating:'4.8'},
    {t:'Seine river cruise',d:'Glide past Notre-Dame, Musée d\'Orsay and the Pont des Arts on a Bateaux Mouches.',type:'Relax',time:'1 hr',rating:'4.6'},
    {t:'Montmartre & Sacré-Cœur',d:'Artists\' quarter, vineyard lane, hilltop basilica with sweeping city views.',type:'Culture',time:'2 hrs',rating:'4.6'},
    {t:'Versailles day trip',d:'RER train to the palace, Hall of Mirrors, Marie-Antoinette\'s estate and gardens.',type:'Adventure',time:'Full day',rating:'4.7'},
  ]},
  {name:'New York',country:'United States',region:'Americas',q:'newyork,manhattan',minDays:4,maxDays:7,groupTags:['Solo','Couple','Friends','Family'],acts:[
    {t:'Statue of Liberty & Ellis Island',d:'Ferry to Liberty Island, climb the pedestal, then explore the immigration museum.',type:'Landmark',time:'4 hrs',rating:'4.6'},
    {t:'Top of the Rock',d:'70th-floor observation deck with unobstructed views of the Empire State and Central Park.',type:'Landmark',time:'2 hrs',rating:'4.7'},
    {t:'Central Park & Met Museum',d:'Stroll the Ramble, row on the Lake, then explore galleries at the Met.',type:'Culture',time:'4 hrs',rating:'4.8'},
    {t:'Broadway show',d:'Catch a Tony-winning musical in the Theatre District — book ahead for Hamilton or Wicked.',type:'Nightlife',time:'3 hrs',rating:'4.9'},
    {t:'High Line & Chelsea Market',d:'Elevated park walk above the Meatpacking District, ending at Chelsea Market food hall.',type:'Food',time:'2 hrs',rating:'4.5'},
  ]},
  {name:'Bali',country:'Indonesia',region:'Asia',q:'bali,temple',minDays:5,maxDays:14,groupTags:['Solo','Couple','Friends'],acts:[
    {t:'Mount Batur sunrise trek',d:'Pre-dawn hike to the volcanic rim for a sunrise above the clouds and a trailside breakfast.',type:'Adventure',time:'7 hrs',rating:'4.8'},
    {t:'Tegallalang rice terraces',d:'Walk the cascading emerald paddies, try the jungle swing and sip coffee at a local farm.',type:'Nature',time:'3 hrs',rating:'4.6'},
    {t:'Uluwatu Temple & Kecak',d:'Clifftop temple at sunset followed by a firelit Kecak dance performance.',type:'Culture',time:'3 hrs',rating:'4.7'},
    {t:'Nusa Penida island day',d:'Speedboat to Kelingking Beach, Angel\'s Billabong and Crystal Bay snorkelling.',type:'Adventure',time:'Full day',rating:'4.8'},
    {t:'Ubud waterfall & yoga',d:'Chase Tegenungan and Tibumana falls then join a drop-in yoga class in Ubud.',type:'Relax',time:'4 hrs',rating:'4.5'},
  ]},
  {name:'Rome',country:'Italy',region:'Europe',q:'rome,colosseum',minDays:3,maxDays:5,groupTags:['Couple','Solo','Family','Friends'],acts:[
    {t:'Colosseum & Roman Forum',d:'Skip-the-line entry to the arena floor, then walk the ancient civic heart of Rome.',type:'Landmark',time:'3 hrs',rating:'4.8'},
    {t:'Vatican & Sistine Chapel',d:'St. Peter\'s Basilica, the Vatican Museums and Michelangelo\'s ceiling — arrive early.',type:'Art',time:'4 hrs',rating:'4.8'},
    {t:'Trevi Fountain & Pantheon',d:'Toss a coin at the Baroque fountain, then stand under the Pantheon\'s open oculus.',type:'Free',time:'2 hrs',rating:'4.6'},
    {t:'Trastevere food crawl',d:'Cobblestone lanes, supplì, cacio e pepe, artichokes and gelato — the real Roman table.',type:'Food',time:'3 hrs',rating:'4.9'},
    {t:'Borghese Gallery',d:'Bernini\'s sculptures and Caravaggio\'s paintings in a villa-museum surrounded by gardens.',type:'Culture',time:'2 hrs',rating:'4.7'},
  ]},
  {name:'Singapore',country:'Singapore',region:'Asia',q:'singapore,marina',minDays:3,maxDays:5,groupTags:['Family','Friends','Couple'],acts:[
    {t:'Gardens by the Bay',d:'Supertree Grove light show, Cloud Forest dome and the Flower Dome under futuristic canopies.',type:'Landmark',time:'3 hrs',rating:'4.8'},
    {t:'Marina Bay Sands SkyPark',d:'Rooftop infinity pool views (for guests) or observation deck for everyone.',type:'Landmark',time:'2 hrs',rating:'4.6'},
    {t:'Sentosa & Universal Studios',d:'Theme-park thrills, S.E.A. Aquarium and Siloso beach on Singapore\'s resort island.',type:'Adventure',time:'Full day',rating:'4.7'},
    {t:'Hawker food tour',d:'Michelin-starred chicken rice, laksa, char kway teow — eat where the locals eat.',type:'Food',time:'3 hrs',rating:'4.9'},
    {t:'Singapore Zoo & Night Safari',d:'Open-concept zoo by day, tram-ride through nocturnal habitats after dark.',type:'Nature',time:'4 hrs',rating:'4.7'},
  ]},
  {name:'Bangkok',country:'Thailand',region:'Asia',q:'bangkok,temple',minDays:4,maxDays:7,groupTags:['Solo','Friends','Couple'],acts:[
    {t:'Grand Palace & Wat Phra Kaew',d:'Glittering spires, the Emerald Buddha and centuries of Thai royal grandeur.',type:'Culture',time:'3 hrs',rating:'4.6'},
    {t:'Floating market tour',d:'Long-tail boat through Damnoen Saduak — bargain for fruit, noodles and souvenirs on water.',type:'Adventure',time:'5 hrs',rating:'4.5'},
    {t:'Chatuchak Weekend Market',d:'15,000 stalls of street food, fashion, antiques and crafts under one sprawling roof.',type:'Food',time:'3 hrs',rating:'4.6'},
    {t:'Wat Arun at sunset',d:'Climb the porcelain-tiled spire of the Temple of Dawn for river views at golden hour.',type:'Landmark',time:'2 hrs',rating:'4.7'},
    {t:'Rooftop sky bar',d:'Cocktails 60 floors up at a Lebua or Banyan Tree rooftop — dress code applies.',type:'Nightlife',time:'2 hrs',rating:'4.6'},
  ]},
  {name:'Barcelona',country:'Spain',region:'Europe',q:'barcelona,sagrada',minDays:4,maxDays:7,groupTags:['Couple','Friends','Solo'],acts:[
    {t:'Sagrada Família',d:'Gaudí\'s unfinished basilica — forest-like columns, stained-glass rainbows, tower views.',type:'Landmark',time:'2 hrs',rating:'4.8'},
    {t:'Park Güell',d:'Mosaic-tiled terraces, the dragon fountain and panoramic city views from Gaudí\'s park.',type:'Art',time:'2 hrs',rating:'4.6'},
    {t:'La Boqueria & Gothic Quarter',d:'Graze through the famous market then wind through medieval lanes to the Cathedral.',type:'Food',time:'3 hrs',rating:'4.7'},
    {t:'Barceloneta beach & paella',d:'Sandy Mediterranean beach followed by seafood paella at a chiringuito.',type:'Relax',time:'4 hrs',rating:'4.5'},
    {t:'Montjuïc cable car',d:'Aerial gondola over the harbour to the castle, gardens and Joan Miró museum.',type:'Adventure',time:'3 hrs',rating:'4.6'},
  ]},
  {name:'Istanbul',country:'Türkiye',region:'Europe',q:'istanbul,mosque',minDays:4,maxDays:6,groupTags:['Couple','Solo','Friends'],acts:[
    {t:'Hagia Sophia & Blue Mosque',d:'Byzantine dome turned Ottoman mosque facing the six-minaret Sultan Ahmed — two icons, one square.',type:'Landmark',time:'3 hrs',rating:'4.8'},
    {t:'Grand Bazaar',d:'4,000 shops of ceramics, lamps, leather and Turkish delight in a 560-year-old covered market.',type:'Food',time:'2 hrs',rating:'4.5'},
    {t:'Bosphorus cruise',d:'Sail between Europe and Asia past palaces, fortresses and waterfront mansions.',type:'Relax',time:'2 hrs',rating:'4.7'},
    {t:'Topkapi Palace',d:'Ottoman sultans\' residence — jeweled daggers, the Harem and Golden Horn views.',type:'Culture',time:'3 hrs',rating:'4.6'},
    {t:'Turkish hammam',d:'Traditional steam bath with marble slab scrub, foam massage and tea afterward.',type:'Relax',time:'2 hrs',rating:'4.6'},
  ]},
  {name:'Cape Town',country:'South Africa',region:'Africa',q:'capetown,mountain',minDays:5,maxDays:10,groupTags:['Solo','Couple','Friends','Family'],acts:[
    {t:'Table Mountain cableway',d:'Revolving cable car to the flat summit for 360° views of the city, ocean and Cape.',type:'Adventure',time:'3 hrs',rating:'4.8'},
    {t:'Cape of Good Hope',d:'Drive the Chapman\'s Peak coast road to the dramatic cliffs where two oceans meet.',type:'Nature',time:'Full day',rating:'4.7'},
    {t:'Boulders Beach penguins',d:'Boardwalk among a colony of African penguins nesting on a sheltered beach.',type:'Nature',time:'2 hrs',rating:'4.6'},
    {t:'Robben Island',d:'Ferry to Mandela\'s cell, guided by a former political prisoner — moving and essential.',type:'Culture',time:'4 hrs',rating:'4.5'},
    {t:'Winelands tasting',d:'Stellenbosch and Franschhoek estates — award-winning Pinotage, Chenin Blanc and cheese.',type:'Food',time:'Full day',rating:'4.8'},
  ]},
];

// ADVENTURE STYLES
export const STYLES = [
  {t:'Mountain & Trek',ic:'⛰️',d:'High-altitude trails and summit chases',q:'mountain,trek,hiking'},
  {t:'Beach & Island',ic:'🏖️',d:'Tropical shores, reef snorkelling, hammock time',q:'beach,island,tropical'},
  {t:'City & Culture',ic:'🏛️',d:'Museums, street art, local neighbourhoods',q:'city,culture,museum'},
  {t:'Desert & Safari',ic:'🐪',d:'Dunes, wildlife drives and starlit camps',q:'desert,safari,wildlife'},
  {t:'Food & Wine',ic:'🍷',d:'Markets, tastings and Michelin lanes',q:'food,wine,market'},
  {t:'Snow & Ski',ic:'⛷️',d:'Powder runs, chalets, après-ski',q:'snow,ski,winter'},
  {t:'Road Trip',ic:'🚗',d:'Open roads, scenic routes, freedom',q:'roadtrip,driving,scenic'},
  {t:'Wellness & Retreat',ic:'🧘',d:'Yoga, hot springs, digital detox',q:'wellness,yoga,spa'},
];

// VOICE QUESTIONS
export const VQ = [
  {q:'What kind of trip are you dreaming of?', chips:['Beach getaway','Mountain trek','City adventure','Safari & wildlife','Food & culture']},
  {q:'How long do you want to travel?', chips:['Weekend (2-3 days)','One week','Two weeks','Open-ended']},
  {q:'What\'s your budget range?', chips:['Budget-friendly','Mid-range comfort','Luxury all the way']},
  {q:'Who\'s coming with you?', chips:['Solo','Couple','Family','Friends group']},
  {q:'Any must-haves?', chips:['Great food scene','Adventure sports','Historical sites','Nightlife','Nature & wildlife']},
];

// COST ENGINE
export const ACT_COST = {Landmark:35,Adventure:75,Adrenaline:120,Culture:25,Food:45,Free:0,Art:30,Nature:40,Relax:35,Nightlife:60};

export const CITY_INDEX = {
  'Dubai':1.2,'Tokyo':1.15,'London':1.3,'Paris':1.25,
  'New York':1.4,'Bali':0.7,'Rome':1.1,'Singapore':1.2,
  'Bangkok':0.6,'Barcelona':1.0,'Istanbul':0.75,'Cape Town':0.8
};

export const TIERS = {
  Budget:     {mult:0.85, stayBase:48,  foodDay:25,  transDay:12, stays:[['Hostel — private room','Central, shared lounge'],['★ guesthouse','Breakfast included'],['Budget chain hotel','Reliable & clean']]},
  'Mid-range':{mult:1.0,  stayBase:135, foodDay:55,  transDay:22, stays:[['★★★★ central hotel','Walk to the sights'],['Boutique stay','Design-led, great reviews'],['Serviced apartment','Kitchen + space']]},
  Luxury:     {mult:1.35, stayBase:340, foodDay:120, transDay:55, stays:[['★★★★★ landmark hotel','Iconic views & spa'],['Luxury resort','Pool, butler service'],['Private suite','Top-floor, club access']]},
};

export const TIER_NAMES = ['Budget','Mid-range','Luxury'];

// Cost utility functions
export function cityIdx(name) { return CITY_INDEX[name] || 1.0; }

export function actCost(type, tier, cidx) {
  return Math.round((ACT_COST[type] || 30) * TIERS[tier].mult * cidx);
}

export function computeTrip(city, actList, tier) {
  const cidx = cityIdx(city.name);
  const t = TIERS[tier];
  const n = actList.length;
  const days = Math.max(1, Math.ceil(n / 3));
  const nights = Math.max(1, days - 1);
  const activities = actList.reduce((s, a) => s + actCost(a.type, tier, cidx), 0);
  const stay = Math.round(nights * t.stayBase * cidx);
  const food = Math.round(days * t.foodDay * cidx);
  const transport = Math.round(days * t.transDay * cidx);
  const subtotal = activities + stay + food + transport;
  const buffer = Math.round(subtotal * 0.10);
  const total = subtotal + buffer;
  return { days, nights, activities, stay, food, transport, buffer, total, cidx, stays: t.stays };
}

// REGION MAP — voice routing
export const REGION_MAP = [
  ['beach','Asia'],['island','Asia'],['trek','Asia'],['mountain','Asia'],
  ['desert','Middle East'],['safari','Africa'],['wildlife','Africa'],
  ['city','Europe'],['culture','Europe'],['food','Asia']
];

export function pickRegionFrom(txt) {
  const lower = txt.toLowerCase();
  for (const [kw, region] of REGION_MAP) {
    if (lower.includes(kw)) return region;
  }
  return null;
}

export function mapBudgetTier(text) {
  const t = text.toLowerCase();
  if (t.includes('budget') || t.includes('cheap') || t.includes('backpack')) return 'Budget';
  if (t.includes('luxury') || t.includes('premium') || t.includes('splurge') || t.includes('high-end')) return 'Luxury';
  return 'Mid-range';
}

// Map voice duration answer to filter label
export function mapDuration(text) {
  const t = text.toLowerCase();
  if (t.includes('weekend') || t.includes('2') || t.includes('3') || t.includes('two') || t.includes('three')) return 'Weekend';
  if (t.includes('one week') || t.includes('1 week') || t.includes('7') || t.includes('five') || t.includes('six') || t.includes('4') || t.includes('5') || t.includes('6')) return 'One Week';
  if (t.includes('two week') || t.includes('2 week') || t.includes('fortnight') || t.includes('14')) return 'Two Weeks';
  if (t.includes('open') || t.includes('long') || t.includes('month')) return 'Extended';
  return null;
}

// Map voice group answer to filter label
export function mapGroup(text) {
  const t = text.toLowerCase();
  if (t.includes('solo') || t.includes('alone') || t.includes('myself') || t.includes('just me')) return 'Solo';
  if (t.includes('couple') || t.includes('partner') || t.includes('wife') || t.includes('husband') || t.includes('girlfriend') || t.includes('boyfriend') || t.includes('romantic')) return 'Couple';
  if (t.includes('family') || t.includes('kids') || t.includes('children') || t.includes('parents')) return 'Family';
  if (t.includes('friend') || t.includes('group') || t.includes('crew') || t.includes('squad') || t.includes('mates')) return 'Friends';
  return null;
}

// Duration filter ranges
export const DURATION_RANGES = {
  'Weekend':  { min: 1, max: 3 },
  'One Week': { min: 4, max: 8 },
  'Two Weeks':{ min: 9, max: 14 },
  'Extended': { min: 14, max: 999 },
};

// EXPERIENCE CENTER SCENES
export const XC = {
  Dubai: [
    {t:'Climb the Burj Khalifa',s:'on the spire of the world\'s tallest tower',q:'burj+khalifa,sky'},
    {t:'Desert dune ride',s:'cresting a red dune at sunset',q:'dubai,desert,dunes'},
  ],
  London: [
    {t:'Ride the London Eye',s:'in a glass capsule over the Thames',q:'london+eye,thames'},
    {t:'Walk Tower Bridge',s:'on the glass walkway above the river',q:'tower+bridge,london'},
  ],
  Tokyo: [
    {t:'Shibuya Sky deck',s:'on the rooftop above the world\'s busiest crossing',q:'shibuya,skyline'},
    {t:'Mt. Fuji viewpoint',s:'at the lake with Fuji behind you',q:'mount+fuji,lake'},
  ],
  Paris: [
    {t:'Eiffel Tower summit',s:'at the top rail with Paris below',q:'eiffel+tower,paris'},
    {t:'Seine river cruise',s:'on deck gliding past Notre-Dame',q:'seine,paris,boat'},
  ],
};

// PLANNER GENERATION STAGES
export const PL_STAGES = [
  'Reading your preferences…',
  'Picking the best activities…',
  'Sequencing your days…',
  'Pricing every line item…',
  'Matching hotels to your budget…',
];

export const GEN_STAGES = [
  'Reading your photo…',
  'Mapping facial features…',
  'Placing you in the scene…',
  'Rendering light & motion…',
  'Finishing your preview…',
];

// DAY THEMES AND TIMES
export const DAY_THEMES = ['Arrival & highlights','Adventure day','Culture & food','Explore & relax','Final day'];
export const DAY_TIMES = ['09:00','12:30','16:00'];
