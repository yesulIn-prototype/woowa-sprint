/*
 * 레벨4 전체에 한 번만 적는 정보. 스프린트마다 바뀌는 내용은 sprint-N.js에 적는다.
 * 빈 칸("")은 페이지에 작성 가이드로 보인다.
 */
site({
  team: "예술in",
  tagline: "공연예술 오디션의 모집, 지원, 심사를 연결하는 서비스",

  // 레벨4에서 더 깊게 만들 것 한 문장 (개요 첫 화면). 근거는 sprint-1.js의 focus에 적는다.
  direction: "배우가 공고별 지원서를 쉽게 작성하고, 제출에 필요한 파일을 완성할 수 있도록 돕는 데 집중한다.",

  // 비워 두면 페이지에 보이지 않는다. 코치가 열 수 있는 링크인지 확인한다.
  links: {
    service: "https://yesulin.art",
    github: "https://github.com/woowacourse-teams/2026-yesulin",
    hypothesisDoc: "hypotheses.html", // 가설 검증 기록 문서 (스프린트마다 새로 만들지 않고 한 문서에 쌓는다)
    userReport: "user-report.html", // 유저 데이터 리포트 (한 문서에 쌓는다)
  },

  // 유저 데이터 리포트의 정의 부분. 값은 스프린트마다 sprint-N.js의 userData에 적는다.
  metrics: {
    activeAction: "", // 어떤 행동을 하면 활성으로 보는가, 왜 그 행동인가, DAU·WAU·MAU 중 무엇이 중요한가
    coreName: "", // 핵심 지표 이름
    coreWhy: "", // 왜 그것이 핵심 지표인가
    coreTarget: "", // 얼마가 되면 가치가 증명됐다고 보는가
    coreTargetWhy: "", // 그 수치의 근거
    exclusion: "", // 팀원·테스트 계정을 집계에서 어떻게 뺐는가
  },

  // 스프린트 페이지 모양. "tabs"면 Overview·Product·Backend·Soft Skill·Retro & Coach 탭으로 나눠 보인다.
  // 비우면("") 예전처럼 한 페이지에 모든 섹션이 보인다. 되돌릴 때는 이 값만 비운다.
  layout: "tabs",

  // 페이지에 보일 기술 요구사항 분야. true인 분야만 기술 요구사항에 나온다.
  fields: { backend: true, frontend: false, android: false },

  // 팀원 카드. github는 아이디만 적는다 (GitHub 링크가 자동으로 붙는다).
  // photo에 assets/team/ 아래 사진 경로를 적으면 카드 위에 크게 보인다. 비우면 GitHub 프로필 사진을 쓴다.
  // photoPos로 사진에서 보일 위치를 조정한다 (예: "50% 20%" = 가로 가운데, 위쪽).
  // intro에 한 줄 소개를 적으면 카드에 보인다. 이번 스프린트에 맡은 핵심 작업은 sprint-N.js의 highlights 담당자에서 자동으로 가져온다.
  members: [
    { name: "대길", github: "minzzun99", photo: "assets/team/daegil.jpg", intro: "", leader: true }, // leader: 팀장 (이름 옆 왕관)
    { name: "이프", github: "jihwankim128", photo: "assets/team/if.jpg", intro: "" },
    { name: "무빙", github: "mvg01", photo: "assets/team/moving.jpg", intro: "" },
    { name: "피노", github: "haechanmoon", photo: "assets/team/pino.jpg", intro: "" },
    { name: "맥스", github: "simhokyung", photo: "assets/team/max.jpg", intro: "" },
  ],
});
