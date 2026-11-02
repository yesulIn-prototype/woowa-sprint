/*
 * 스프린트 4 기록. 작성 규칙은 sprint-1.js 맨 위 주석과 같다.
 * 스프린트가 열리면 theme, focus, tech.*.topic·brief·criteria, softskill.activity·blocks를 공식 안내에 맞춰 채운다.
 */
sprint({
  no: 4,
  weeks: "레벨4 8~9주차",
  start: "2026-11-02",
  end: "2026-11-13",
  deadline: "2026-11-12T18:00",
  demoday: "2026-11-13",
  // 우형 전시회가 11.13(금)으로 정해지면 데모데이는 11.12(목)로 옮긴다
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
    flat: true,
    intro: "스프린트 3에 준비한 네트워킹 살롱을 이번 스프린트의 가설로 이어 간다. 가설과 판정 기준은 행사 전에 적어 두고, 결과를 본 뒤에 바꾸지 않는다.",
    cycles: [
      {
        title: "공연사가 살롱에서 배우를 만나고 심사 화면을 보면, 다음 모집에 예술in을 써 보려 할 것이다",
        plan: {
          title: "사이클 시작 전에 정한 것",
          target: "11.9 살롱에 참석한 공연사 관계자 (연출자·제작자·극단 운영자)",
          period: "2026.11.9 살롱 당일 ~ 11.12 제출 전",
          action: "공고 등록, 또는 다음 모집에 PDF 심사를 써 보겠다며 연락처를 남기는 것",
          criterion: "위 행동이 나온 공연사 4곳 이상이면 성공으로 본다. 살롱 전(11.2)에 정했고, 비율이 아니라 공연사 수로 센다.",
          source: "살롱 신청자 관리(소속), 현장 기록, 관리자 공고 목록, 명함 QR 경유 방문 기록",
          exclusion: "공연사 단위로 센다. 공동 주최인 남극장은 따로 적고 기준에 넣지 않는다",
        },
        hypothesis:
          "공연사 80곳에 전화와 콜드메일로 연락했을 때는 담당자에게 닿기도, 제품을 설명하기도 어려웠다. 공연사 관계자가 배우를 직접 만나는 자리에서 PDF 심사를 시연으로 보면, 설명 없이도 쓸모를 느끼고 다음 모집에 예술in을 써 보려 할 것이라고 본다.",
        experiment:
          "11.9 17:00~19:00 남극장에서 배우와 공연사가 만나는 네트워킹 살롱을 연다. 샘플 PDF로 심사 화면을 시연하고, 관심을 보인 공연사에 다음 오디션 시범 사용을 제안한다. 참석 공연사 수와 위 행동이 나온 공연사 수를 센다.",
        observation: "",
        verdict: "",
        verdictReason: "",
        learning: "",
        nextAction: "",
        confidence: null,
      },
    ],
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
