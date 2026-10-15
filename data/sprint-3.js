/*
 * 스프린트 3 기록. 작성 규칙은 sprint-1.js 맨 위 주석과 같다.
 * 스프린트가 열리면 theme, focus, tech.*.topic·brief·criteria, softskill.activity·blocks를 공식 안내에 맞춰 채운다.
 */
sprint({
  no: 3,
  weeks: "레벨4 6~7주차",
  start: "2026-10-19",
  end: "2026-10-30",
  deadline: "2026-10-29T18:00",
  demoday: "2026-10-30",
  theme: "",

  goal: "", // 개요 페이지 스프린트 목록에 보일 목표 한 줄
  highlights: [
    // { title: "", owner: "", status: "진행 중", body: "", links: [{ label: "", url: "" }] },
  ],
  backlog: [
    // { title: "", owner: "", priority: "P1", due: "", status: "대기", note: "" },
  ],
  recruiting: [
    // { title: "", category: "", status: "진행 중", now: "", next: "", metric: "" },
  ],

  focus: [
    // { label: "", hint: "", body: "" },
  ],

  product: {
    demo: "",
    changes: [
      // { title: "", before: "", after: "", why: "", image: "", caption: "", link: "" },
    ],
  },

  hypothesis: {
    hypothesis: "",
    experiment: "",
    observation: "",
    verdict: "",
    verdictReason: "",
    learning: "",
    nextAction: "",
    confidence: null,
  },
  userData: { wau: ["", ""], w4Retention: "", coreValue: "", retentionChart: "", activeReading: "", coreReading: "" },

  tech: {
    backend: {
      topic: "",
      brief: "",
      criteria: [
        // { text: "", done: false, evidence: "" },
      ],
      why: "",
      applied: "",
      choice: "",
      observed: "",
      learned: "",
      doc: "",
    },
  },

  softskill: {}, // { activity: "", items: [{ title: "", body: "" }] }

  retro: { gap: "", learned: "", change: "" },
  next: "",
  carryOver: false,

  coach: {
    help: [
      // { topic: "", detail: "" },
    ],
    share: [],
  },

  submission: {
    status: { backend: "제출 전", product: "제출 전", softskill: "제출 전" },
  },
});
