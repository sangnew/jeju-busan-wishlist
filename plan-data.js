// Curated Busan + Jeju stay/itinerary content (not crowd-sourced, so it
// lives here as static bilingual data instead of in Firestore). Prices are
// the best real figures found at research time — flights/Airbnb are dynamic,
// so links are pre-filled with the actual trip dates so the live price shows
// the moment someone opens them.
const PLAN_DATA = {
  en: {
    editNote: "This page is curated by Claude, not crowd-edited like the wishlist tabs — just ask for any change (swap a stay, update a price) and it's updated here for everyone.",

    fixedNote: "Only booked/confirmed items, in the order they happen. Food, routes, and anything else gets slotted in by date as it's locked in.",
    fixedSections: [
      { title: "📅 Dec 22 (Tue)", items: [
        { date: "08:00", icon: "🚄", what: "KTX Pyeongtaek Jije → Busan", detail: "~2h to Busan Station" },
        { date: "Night", icon: "🏨", what: "Stay — Munhyeon Signature Denbasta Hotel (1 night)", detail: "807-9 Munhyeon-dong, Nam-gu, near Munhyeon Station", url: "https://www.yeogi.com/domestic-accommodations/69860", linkText: "Hotel page" },
      ] },
      { title: "📅 Dec 23 (Wed)", items: [
        { date: "Morning", icon: "🧳", what: "Check out — Denbasta Hotel", detail: "" },
        { date: "15:05", icon: "✈️", what: "Flight Busan (Gimhae) → Jeju", detail: "Depart Gimhae 15:05" },
        { date: "16:05", icon: "🛬", what: "Arrive at Jeju Airport", detail: "~40 min drive to Aewol" },
        { date: "Evening", icon: "🏡", what: "Check in — Aewol Ocean View, Every Room (Airbnb, 3 nights)", detail: "Dec 23–26 · Aewol (west)", url: "https://www.airbnb.co.kr/rooms/46684988?check_in=2026-12-23&check_out=2026-12-26&adults=5", linkText: "Airbnb listing" },
      ] },
      { title: "📅 Dec 26 (Sat)", items: [
        { date: "Morning", icon: "🧳", what: "Check out — Aewol Airbnb", detail: "" },
        { date: "14:05", icon: "✈️", what: "Flight Jeju → Cheongju", detail: "Depart Jeju 14:05" },
        { date: "15:15", icon: "🛬", what: "Arrive at Cheongju International Airport", detail: "" },
      ] },
    ],

    calendarTitle: "📅 Trip calendar",
    routeTitle: "🧭 Route at a glance",
    route: [
      { icon: "🛬", label: "Incheon Airport" },
      { icon: "🐷", label: "Anjung-eup (jokbal)" },
      { icon: "🚄", label: "Busan (1 night)" },
      { icon: "✈️", label: "Jeju (3 nights)" },
      { icon: "🛬", label: "Cheongju Airport" },
      { icon: "🇨🇳", label: "China" },
    ],

    arrivalTitle: "🛬 Arrival — Dec 21 (Mon)",
    arrivalDays: [
      {
        label: "Dec 21 (Mon)",
        date: "2026-12-21",
        icon: "🛬🐷",
        theme: "Land at Incheon, drive to Pyeongtaek, jokbal dinner, rest before the early train",
        items: [
          { time: "16:40", place: "Incheon International Airport", desc: "Arrival" },
          { time: "~17:30", place: "Leave the airport", desc: "Pick up the car, drive toward Pyeongtaek" },
          { time: "Evening", place: "Anjung-eup, Pyeongtaek (안중읍)", desc: "Jokbal (족발) dinner" },
          { time: "Night", place: "Rest in Anjung-eup", desc: "Early start tomorrow — KTX leaves Pyeongtaek Jije at 08:00" },
        ],
      },
    ],

    busanTitle: "🚅 Busan Plan — Dec 22 (Tue) – Dec 23 (Wed)",
    busanTransport: [
      { label: "✅ Pyeongtaek Jije → Busan (KTX) — CONFIRMED", detail: "Dec 22 (Tue) 08:00 departure from Pyeongtaek Jije · ~2h to Busan Station" },
      { label: "✅ Busan → Jeju (flight) — CONFIRMED", detail: "Dec 23 (Wed) 15:05 Gimhae (PUS) → 16:05 Jeju (CJU)" },
      { label: "✅ Jeju → Cheongju (flight) — CONFIRMED", detail: "Dec 26 (Sat) 14:05 Jeju (CJU) → 15:15 Cheongju International (CJJ)" },
    ],
    busanStaysIntro: "✅ Booked — the Busan night (Dec 22) is fixed at Denbasta Hotel in Munhyeon.",
    busanStays: [
      {
        name: "✅ Munhyeon Signature Denbasta Hotel [문현 시그니처 덴바스타호텔] — CONFIRMED",
        type: "Hotel",
        area: "807-9 Munhyeon-dong, Nam-gu, Busan — near Munhyeon Station (Line 2)",
        rating: "9.8/10 on Yeogi (2,068 ratings)",
        capacity: "Every room has a bathtub and a clothes styler",
        price: "Booked — see your reservation for the total",
        access: "~15 min drive to Gwangalli Beach",
        url: "https://www.yeogi.com/domestic-accommodations/69860",
        photo: "https://image.withstatic.com/377/458/453/fe92e58998ad4cdf8d3bd106c6d1ce86.jpg",
      },
    ],
    busanDays: [
      {
        label: "Day 1 — Dec 22 (Tue)",
        date: "2026-12-22",
        icon: "🚅🦪",
        theme: "Arrive by KTX, rent a car, Songdo shellfish, Gamjeon-dong, check in, dinner at the fish market",
        items: [
          { time: "08:00", place: "Pyeongtaek Jije Station", desc: "✅ KTX departure (confirmed) → Busan Station in ~2h" },
          { time: "Late morning", place: "Rent a car", desc: "Pick up near Busan Station" },
          { time: "Lunch", place: "🦪 Choijinsadaek (최진사댁), Songdo", desc: "Grilled shellfish (조개구이) — 4.7★, in the Songdo shellfish-restaurant cluster" },
          { time: "Afternoon", place: "Gamjeon-dong (감전동)", desc: "Walk around — cafés and renovated warehouse streets" },
          { time: "~16:00", place: "Check in — Denbasta Hotel, Munhyeon", desc: "✅ Confirmed stay (see above)" },
          { time: "Evening", place: "🐟 Gwangalli Fish Market (광안리회센터)", desc: "~15 min drive from the hotel — fresh sashimi/seafood dinner with the Gwangan Bridge view" },
        ],
      },
      {
        label: "Day 2 — Dec 23 (Wed)",
        date: "2026-12-23",
        icon: "🍚✈️",
        theme: "Gukbap breakfast, early Nampo-dong lunch, 15:05 flight to Jeju, sunset at the Aewol stay",
        items: [
          { time: "Morning", place: "🍚 Gukbap", desc: "Pork/beef soup-rice breakfast, then check out" },
          { time: "~11:00", place: "Nampo-dong (남포동)", desc: "Walk around and have an early lunch" },
          { time: "~13:30", place: "Return the rental car", desc: "At Gimhae Airport — be at the terminal by ~14:00" },
          { time: "15:05", place: "✈️ Flight PUS → CJU", desc: "✅ Confirmed — Gimhae 15:05 → Jeju 16:05" },
          { time: "16:05", place: "Arrive at Jeju Airport", desc: "Pick up the car, ~40 min drive west to Aewol" },
          { time: "~17:00", place: "Check in — Aewol Ocean View stay", desc: "✅ Confirmed stay — catch the sunset from the room" },
          { time: "Evening", place: "Aewol", desc: "Dinner near the stay" },
        ],
      },
    ],

    planStaysTitle: "🏡 Jeju — Where to stay (5 people)",
    stayIntro: "✅ Booked — all 3 Jeju nights (Dec 23–26) are fixed at the Aewol Ocean View Airbnb.",
    stays: [
      {
        name: "✅ Aewol Ocean View, Every Room (애월오션뷰/석양good) — CONFIRMED",
        type: "Airbnb · Pension",
        area: "Aewol (west) — ~40 min from Jeju Airport",
        rating: "4.89★ (239 reviews) · Superhost",
        capacity: "3 bedrooms, 3 queen beds, 2 baths",
        price: "₩889,000 total for Dec 23–26, 5 guests (price when checked)",
        access: "Ocean view from every room, good sunsets, 2 min to the coastal road",
        url: "https://www.airbnb.co.kr/rooms/46684988?check_in=2026-12-23&check_out=2026-12-26&adults=5",
        photo: "https://a0.muscache.com/im/pictures/hosting/Hosting-46684988/original/a1c1ffb4-c976-4e6a-a62b-90ff2a92c2b8.jpeg",
      },
    ],
    daysIntro: "2 full days in Jeju (Dec 24–25) plus the morning of Dec 26 before the 14:05 flight — tangerine-picking and the Dongmun Market meal are still in.",
    days: [
      {
        label: "Day 1 — Dec 24 (Thu)",
        date: "2026-12-24",
        icon: "🌅🍊",
        theme: "East coast: sunrise peak, tangerine picking, coastline",
        items: [
          { time: "Morning", place: "Seongsan Ilchulbong", desc: "Iconic sunrise-crater hike, ~1hr round trip" },
          { time: "Midday", place: "Seopjikoji", desc: "Coastal walk, lighthouse, café views" },
          { time: "Afternoon", place: "🍊 Little Prince Tangerine Farm", desc: "Tangerine-picking experience (as requested!) — pick & eat, photo spots" },
          { time: "Late afternoon", place: "Gwangchigi Beach", desc: "Sunset over the tidal flats, view back to Ilchulbong" },
          { time: "Evening", place: "Seongsan/Pyoseon area", desc: "Dinner — black pork or fresh seafood" },
        ],
      },
      {
        label: "Day 2 — Dec 25 (Fri)",
        date: "2026-12-25",
        icon: "🌺🏔️",
        theme: "South coast & mid-mountain: winter flowers, snow, cliffs",
        items: [
          { time: "Morning", place: "Camellia Hill", desc: "Winter camellias in full bloom in December" },
          { time: "Midday", place: "1100 Altitude Rest Area", desc: "Snow-dusted highland views if weather allows (check conditions)" },
          { time: "Afternoon", place: "Jusangjeolli Cliffs", desc: "Volcanic rock columns on the coast, Jungmun" },
          { time: "Late afternoon", place: "Jungmun Saekdal Beach", desc: "Black-sand beach walk" },
          { time: "Evening", place: "Seogwipo / Lee Jung-seop Street", desc: "Dinner in Seogwipo" },
        ],
      },
      {
        label: "Day 3 — Dec 26 (Sat)",
        date: "2026-12-26",
        icon: "🧺✈️",
        theme: "Aewol morning walk, Dongmun Market lunch, 14:05 flight to Cheongju",
        items: [
          { time: "Morning", place: "Aewol Hamdam Coastal Walk", desc: "Café-lined coastal path right by the stay, then check out" },
          { time: "~11:00", place: "🧺 Dongmun Traditional Market", desc: "Market lunch (as requested!) — street food, ~10 min from the airport" },
          { time: "~12:30", place: "Return the rental car", desc: "Be at Jeju Airport by ~13:00" },
          { time: "14:05", place: "✈️ Flight CJU → CJJ", desc: "✅ Confirmed — Jeju 14:05 → Cheongju 15:15" },
          { time: "15:15", place: "Cheongju International Airport", desc: "Arrival" },
        ],
      },
    ],
    caveat: "KTX, both flights, and both stays are booked — just double-check check-in/check-out times and baggage allowances on each reservation before the trip.",

    departureTitle: "🛫 Departure — Dec 27 (Sun)",
    departureDays: [
      {
        label: "Dec 27 (Sun)",
        date: "2026-12-27",
        icon: "✈️🇨🇳",
        theme: "Fly out from Incheon to China",
        items: [
          { time: "TBD", place: "Incheon International Airport", desc: "Check in for the flight to China" },
        ],
      },
    ],
  },
  ko: {
    editNote: "이 페이지는 위시리스트 탭처럼 실시간으로 다 같이 고치는 게 아니라 제가(Claude) 큐레이션한 내용이에요 — 숙소를 바꾸거나 가격을 업데이트하고 싶으면 언제든 말씀해주시면 바로 반영해드려요.",

    fixedNote: "예약·확정된 것만 일어나는 순서대로 모아둔 칸입니다. 음식, 경로 등도 확정되는 대로 날짜에 맞춰 끼워 넣습니다.",
    fixedSections: [
      { title: "📅 12월 22일 (화)", items: [
        { date: "08:00", icon: "🚄", what: "KTX 평택지제 → 부산", detail: "부산역까지 약 2시간" },
        { date: "밤", icon: "🏨", what: "숙박 — 문현 시그니처 덴바스타호텔 (1박)", detail: "부산 남구 문현동 807-9, 문현역 인근", url: "https://www.yeogi.com/domestic-accommodations/69860", linkText: "호텔 페이지" },
      ] },
      { title: "📅 12월 23일 (수)", items: [
        { date: "오전", icon: "🧳", what: "체크아웃 — 덴바스타호텔", detail: "" },
        { date: "15:05", icon: "✈️", what: "항공 부산(김해) → 제주", detail: "김해 15:05 출발" },
        { date: "16:05", icon: "🛬", what: "제주공항 도착", detail: "애월까지 차로 약 40분" },
        { date: "저녁", icon: "🏡", what: "체크인 — 전객실 애월오션뷰 (에어비앤비, 3박)", detail: "12/23~26 · 애월 (서부)", url: "https://www.airbnb.co.kr/rooms/46684988?check_in=2026-12-23&check_out=2026-12-26&adults=5", linkText: "에어비앤비 페이지" },
      ] },
      { title: "📅 12월 26일 (토)", items: [
        { date: "오전", icon: "🧳", what: "체크아웃 — 애월 에어비앤비", detail: "" },
        { date: "14:05", icon: "✈️", what: "항공 제주 → 청주", detail: "제주 14:05 출발" },
        { date: "15:15", icon: "🛬", what: "청주국제공항 도착", detail: "" },
      ] },
    ],

    calendarTitle: "📅 여행 달력",
    routeTitle: "🧭 한눈에 보는 루트",
    route: [
      { icon: "🛬", label: "인천공항" },
      { icon: "🐷", label: "안중읍 (족발)" },
      { icon: "🚄", label: "부산 (1박)" },
      { icon: "✈️", label: "제주 (3박)" },
      { icon: "🛬", label: "청주공항" },
      { icon: "🇨🇳", label: "중국" },
    ],

    arrivalTitle: "🛬 입국 — 12월 21일(월)",
    arrivalDays: [
      {
        label: "12월 21일 (월)",
        date: "2026-12-21",
        icon: "🛬🐷",
        theme: "인천 도착, 평택 이동, 족발 저녁, 다음날 이른 기차 전 휴식",
        items: [
          { time: "16:40", place: "인천국제공항", desc: "도착" },
          { time: "약 17:30", place: "공항 출발", desc: "차 픽업 후 평택 방향 이동" },
          { time: "저녁", place: "평택 안중읍", desc: "족발 저녁식사" },
          { time: "밤", place: "안중읍에서 휴식", desc: "내일 아침 일찍 출발 — 평택지제역 KTX 08:00 출발" },
        ],
      },
    ],

    busanTitle: "🚅 부산 플랜 — 12월 22일(화) ~ 12월 23일(수)",
    busanTransport: [
      { label: "✅ 평택지제 → 부산 (KTX) — 확정", detail: "12월 22일(화) 평택지제역 08:00 출발 · 부산역까지 약 2시간" },
      { label: "✅ 부산 → 제주 (항공) — 확정", detail: "12월 23일(수) 15:05 김해공항(PUS) 출발 → 16:05 제주(CJU) 도착" },
      { label: "✅ 제주 → 청주 (항공) — 확정", detail: "12월 26일(토) 14:05 제주(CJU) 출발 → 15:15 청주국제공항(CJJ) 도착" },
    ],
    busanStaysIntro: "✅ 예약 확정 — 부산 1박(12/22)은 문현역 덴바스타호텔로 확정했습니다.",
    busanStays: [
      {
        name: "✅ 문현 시그니처 덴바스타호텔 — 확정",
        type: "호텔",
        area: "부산 남구 문현동 807-9 — 지하철 2호선 문현역 인근",
        rating: "여기어때 9.8점 (2,068명 평가)",
        capacity: "전 객실 욕조·스타일러 구비",
        price: "예약 완료 — 총액은 예약 내역 참고",
        access: "광안리해변까지 차로 약 15분",
        url: "https://www.yeogi.com/domestic-accommodations/69860",
        photo: "https://image.withstatic.com/377/458/453/fe92e58998ad4cdf8d3bd106c6d1ce86.jpg",
      },
    ],
    busanDays: [
      {
        label: "Day 1 — 12/22 (화)",
        date: "2026-12-22",
        icon: "🚅🦪",
        theme: "KTX 도착, 렌트카, 송도 조개구이, 감전동, 체크인, 회센터 저녁",
        items: [
          { time: "08:00", place: "평택지제역", desc: "✅ KTX 출발 (확정) → 부산역까지 약 2시간" },
          { time: "오전 늦게", place: "렌트카 픽업", desc: "부산역 인근에서 픽업" },
          { time: "점심", place: "🦪 최진사댁, 송도", desc: "조개구이 — 4.7★, 송도 조개구이거리 내" },
          { time: "오후", place: "감전동", desc: "카페거리와 리모델링된 창고거리 산책" },
          { time: "약 16:00", place: "체크인 — 문현 덴바스타호텔", desc: "✅ 확정 숙소 (위 참고)" },
          { time: "저녁", place: "🐟 광안리회센터", desc: "호텔에서 차로 약 15분 — 광안대교 보며 회/해산물 저녁" },
        ],
      },
      {
        label: "Day 2 — 12/23 (수)",
        date: "2026-12-23",
        icon: "🍚✈️",
        theme: "국밥 아침, 남포동 이른 점심, 15:05 제주행, 애월 숙소에서 노을",
        items: [
          { time: "아침", place: "🍚 국밥", desc: "국밥 아침식사 후 체크아웃" },
          { time: "약 11:00", place: "남포동", desc: "걷다가 이른 점심" },
          { time: "약 13:30", place: "렌트카 반납", desc: "김해공항에서 반납 — 14:00까지 터미널 도착" },
          { time: "15:05", place: "✈️ 부산→제주 항공편", desc: "✅ 확정 — 김해 15:05 출발 → 제주 16:05 도착" },
          { time: "16:05", place: "제주공항 도착", desc: "차량 픽업, 애월까지 차로 약 40분" },
          { time: "약 17:00", place: "체크인 — 전객실 애월오션뷰", desc: "✅ 확정 숙소 — 방에서 노을 감상" },
          { time: "저녁", place: "애월", desc: "숙소 근처에서 저녁식사" },
        ],
      },
    ],

    planStaysTitle: "🏡 제주 — 숙소 추천 (5인 기준)",
    stayIntro: "✅ 예약 확정 — 제주 3박(12/23~26)은 애월 오션뷰 에어비앤비로 확정했습니다.",
    stays: [
      {
        name: "✅ 전객실 애월오션뷰 (석양good) — 확정",
        type: "에어비앤비 · 펜션",
        area: "애월 (서부) — 제주공항에서 차로 약 40분",
        rating: "4.89★ (239개 후기) · 수퍼호스트",
        capacity: "침실 3개, 퀸사이즈 침대 3개, 욕실 2개",
        price: "12/23~26, 5인 기준 총액 889,000원 (확인 당시 가격)",
        access: "모든 방에서 오션뷰, 석양 명당, 해안로 도보 2분",
        url: "https://www.airbnb.co.kr/rooms/46684988?check_in=2026-12-23&check_out=2026-12-26&adults=5",
        photo: "https://a0.muscache.com/im/pictures/hosting/Hosting-46684988/original/a1c1ffb4-c976-4e6a-a62b-90ff2a92c2b8.jpeg",
      },
    ],
    daysIntro: "제주 풀데이 2일(12/24~25) + 26일 오전(14:05 비행기 전) 일정 — 귤 따기 체험과 동문시장 식사는 그대로 넣었습니다.",
    days: [
      {
        label: "Day 1 — 12/24 (목)",
        date: "2026-12-24",
        icon: "🌅🍊",
        theme: "동부 해안: 일출봉, 귤 따기, 해안절경",
        items: [
          { time: "오전", place: "성산일출봉", desc: "유네스코 일출봉 등반, 왕복 약 1시간" },
          { time: "낮", place: "섭지코지", desc: "해안 산책, 등대, 전망 카페" },
          { time: "오후", place: "🍊 어린왕자 감귤체험마을", desc: "귤 따기 체험(요청하신 그거!) — 직접 따서 먹기, 포토존" },
          { time: "늦은 오후", place: "광치기해변", desc: "일몰, 성산일출봉 뷰" },
          { time: "저녁", place: "성산/표선 일대", desc: "흑돼지 or 해산물 저녁식사" },
        ],
      },
      {
        label: "Day 2 — 12/25 (금)",
        date: "2026-12-25",
        icon: "🌺🏔️",
        theme: "남부 & 중산간: 겨울꽃, 눈, 절벽",
        items: [
          { time: "오전", place: "카멜리아힐", desc: "12월 만개한 동백꽃" },
          { time: "낮", place: "1100고지 휴게소", desc: "날씨 좋으면 눈꽃 고지대 전망 (당일 기상 확인)" },
          { time: "오후", place: "주상절리대", desc: "중문 해안 용암 기둥 절경" },
          { time: "늦은 오후", place: "중문색달해변", desc: "검은 모래 해변 산책" },
          { time: "저녁", place: "서귀포 / 이중섭거리", desc: "서귀포 맛집 저녁식사" },
        ],
      },
      {
        label: "Day 3 — 12/26 (토)",
        date: "2026-12-26",
        icon: "🧺✈️",
        theme: "애월 아침 산책, 동문시장 점심, 14:05 청주행",
        items: [
          { time: "오전", place: "애월 한담해안산책로", desc: "숙소 근처 카페거리·해안 산책 후 체크아웃" },
          { time: "약 11:00", place: "🧺 동문재래시장", desc: "시장에서 점심(요청하신 그거!) — 공항에서 약 10분" },
          { time: "약 12:30", place: "렌트카 반납", desc: "13:00까지 제주공항 도착" },
          { time: "14:05", place: "✈️ 제주→청주 항공편", desc: "✅ 확정 — 제주 14:05 출발 → 청주 15:15 도착" },
          { time: "15:15", place: "청주국제공항", desc: "도착" },
        ],
      },
    ],
    caveat: "KTX·항공·숙소 모두 확정되었습니다 — 출발 전 각 예약의 체크인/체크아웃 시간과 수하물 규정만 한 번 더 확인하세요.",

    departureTitle: "🛫 출국 — 12월 27일(일)",
    departureDays: [
      {
        label: "12월 27일 (일)",
        date: "2026-12-27",
        icon: "✈️🇨🇳",
        theme: "인천공항에서 중국행 출국",
        items: [
          { time: "미정", place: "인천국제공항", desc: "중국행 항공편 체크인" },
        ],
      },
    ],
  },
};
