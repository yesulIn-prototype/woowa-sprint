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

  goal: "남극장과 배우·공연사 네트워킹 살롱을 준비하고, 공연사가 지원서 PDF를 한 번에 심사하는 시스템을 만든다", // 개요 페이지 스프린트 목록에 보일 목표 한 줄
  highlights: [
    {
      title: "예술in 네트워킹 살롱 기획 (11.9 월)",
      owner: "무빙, 대길",
      status: "진행 중",
      body: "배우와 연출자·제작자가 한자리에서 만나는 첫 오프라인 행사다. 사전 관계가 없는 공연사 80곳에 전화·콜드메일로 연락해 보니 담당자 연결이 어렵고, 말로만은 서비스를 실제로 어떻게 쓰는지 전달하기 어려웠다. 그래서 공연사에는 심사 기능을 직접 시연하고, 배우에게는 프로필을 등록해 QR 명함으로 서로 열어 보게 하는 자리를 만들었다.\n\n- **일시·장소**: 2026.11.09(월) 17:00~19:00, 남극장(관악구). 남극장 대표님과 장소·대관 조건까지 확정했다\n- **주최**: 예술in·남극장·컴퍼니연결 공동 주최, 예술in 기획·운영\n- **프로그램**: 1부 예술in 소개 · 연출자·제작자 토크 · 아이스브레이킹 / 2부 자유 교류 · 명함 교환 · 이벤트\n- **참가 혜택**: 참가비 무료, 저녁 식사, 희망 배우에게 프로필 QR 명함 50장 무료 제작\n- **현장 운영**: 안내 공간 2명이 배우 프로필 등록·QR 연결과 샘플 PDF 심사 시연을 돕고, 3명이 접수·네트워킹을 진행한다\n\nThreads 사전 설문에는 하루 동안 149명이 참여했고 16명이 참여 희망 댓글을 남겼다(10.28). 설문 참여는 참석 의향과 구분하고, 실제 수요는 모집에서 확인한다.\n\n행사에 맞춰 이벤트 참가 신청서와 신청자 관리, 사전예약 마감일, 명함 자료 내려받기(무빙 #374·#383·#387), 배우 페이지 `/@아이디` 공개, 선착순 모집과 참가자 관리, 배우 PDF로 프로필 채우기(대길 #397·#407·#415)를 만들었다.\n\n행사 당일에는 신규 프로필 등록·QR 연결 인원, 심사 시연 참석과 후속 제안 수락, 5점 만족도를 기록한다. 행사 후 2주 동안 프로필 수정 인원과 QR 유입을 보고, 마지막에 사용 경험과 재참여 의향을 묻는다.",
      figures: [
        { src: "assets/s3/salon-poster.jpg", caption: "행사 포스터 시안 (사전 신청 QR 반영 전, 연락처 가림)", span: 6 },
        { src: "assets/s3/salon-card-sample.jpg", caption: "배우 프로필 명함 앞·뒷면 예시. 실제 명함은 참가자가 공개에 동의한 사진·정보로 만든다", span: 6 },
      ],
      links: [
        { label: "참가 신청서 PR #374", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/374" },
        { label: "선착순 모집 PR #407", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/407" },
        { label: "PDF 프로필 채우기 PR #415", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/415" },
      ],
    },
    {
      title: "남극장 심사를 위한 PDF 지원서 일괄 처리",
      owner: "맥스, 이프",
      status: "진행 중",
      body: "공연사는 지원서를 이메일 첨부 PDF로 받아 하나씩 열어 보며 심사한다. 남극장의 심사 관리를 돕기 위해, 지원서 PDF 여러 개를 한 번에 올리면 지원자별 프로필로 정리해 배역별로 넘겨 보며 합격·불합격을 고르는 심사 화면을 만들었다.\n\n- **업로드**: 서버가 파일마다 업로드 주소를 발급하고, 브라우저가 S3에 바로 올린다. 서버가 파일을 중계하지 않는다\n- **추출**: S3 업로드 이벤트로 Lambda가 PDF의 텍스트와 이미지를 뽑는다. 처리 진행률(대기·완료·일부 완료·실패)을 화면에 보인다\n- **AI 정리**: 추출한 글과 등록한 배역 목록만 모델에 보내 이름·지원 배역·생년월일·키·경력(최대 5개)을 원문 근거와 함께 받는다\n- **검증**: 서버가 근거 문장이 원문에 실제로 있는지, 배역이 이 심사에 등록된 것인지 확인한다. 확정하지 못하면 \"확인 필요\"로 두고 원본 PDF를 함께 보여 준다\n- **사람이 결정**: 합격·불합격과 메모는 담당자만 입력한다. AI는 점수를 매기거나 외모·능력을 판단하지 않는다\n\n개발 서버(Dev)에 배포했고 운영(PROD)에는 아직 반영하지 않았다. 네트워킹 살롱에서 연출자·제작자에게 샘플 PDF로 시연하고, 관심 있는 공연사에 다음 오디션 시범 사용을 제안한다.",
      visuals: [
        {
          kind: "flow",
          title: "지원서 PDF가 심사 화면에 오기까지",
          columns: [
            { label: "공연사", steps: ["심사 제목·배역 등록", "지원서 PDF 여러 개 선택", "브라우저가 S3에 파일별 업로드"] },
            { label: "자동 처리", steps: ["S3 이벤트로 Lambda 실행", "PDF 텍스트·이미지 추출", "AI가 이름·배역·프로필을 근거와 함께 정리", "서버가 근거를 원문과 대조해 저장"] },
            { label: "심사", steps: ["배역별로 지원자 프로필 확인", "\"확인 필요\"는 원본 PDF로 확인", "합격·불합격과 메모는 사람이 입력"] },
          ],
        },
      ],
      links: [
        { label: "PDF 심사 문서", url: "https://github.com/woowacourse-teams/2026-yesulin/blob/dev/backend/docs/pdf-reviews.md" },
        { label: "PR #355", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/355" },
        { label: "PR #358", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/358" },
        { label: "PR #366", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/366" },
        { label: "PR #369", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/369" },
      ],
    },
    {
      title: "PROD 무중단 배포와 롤백",
      owner: "무빙",
      status: "완료",
      body: "PROD를 2대로 늘리고 한 대씩 배포하도록 바꿨다. 배포 중 실패한 요청이 222건(약 2분 44초 끊김)에서 0건이 됐고, 직전 버전으로 되돌리는 롤백도 14:05 ~ 14:11 동안 끊김 없이 해 봤다. 첫 롤백이 컬럼 삭제 마이그레이션 때문에 실패해, DB 변경을 두 번에 나눠 배포하는 규칙과 PR 검사를 만들었다.",
      links: [
        { label: "검증 기록", url: "https://github.com/woowacourse-teams/2026-yesulin/blob/dev/design/zero-downtime-deployment-record.md" },
        { label: "PR #336", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/336" },
        { label: "PR #337", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/337" },
      ],
    },
    {
      title: "운영 DB 자동 백업과 복구 연습",
      owner: "무빙",
      status: "완료",
      body: "하나도 없던 PROD DB 백업을 매일 03:15 S3 논리 백업, 매주 일요일 디스크 스냅샷으로 남기고 90일 뒤 자동 삭제되게 했다. 최신 백업을 임시 MySQL에 복원해 보니 21초 걸렸고, 표 85개의 행 수가 모두 맞았다. 이 기록은 스프린트 4 백엔드 요구사항으로 제출한다.",
      links: [
        { label: "백업 문서", url: "https://github.com/woowacourse-teams/2026-yesulin/blob/dev/backend/docs/operations/backup.md" },
        { label: "PR #341", url: "https://github.com/woowacourse-teams/2026-yesulin/pull/341" },
      ],
    },
  ],
  backlog: [
    // { title: "", owner: "", priority: "P1", due: "", status: "대기", note: "" },
  ],
  recruiting: [
    {
      title: "네트워킹 살롱 참가자 모집",
      category: "행사",
      status: "진행 중",
      now: "10.29부터 연극·뮤지컬 관련 학과·학생회, 공고 알림방(225명)·배우 정보 공유방(38명)·Threads, 공고 게시에 동의한 공연사 54곳 연락망과 남극장 대표님을 통해 알린다",
      next: "11.04 23:59 명함 신청 마감 후 진행 확정 (신청 10명 미만이면 취소), 일반 신청은 11.08까지. 유입 경로별 신청과 실제 참석을 비교한다",
      metric: "목표 선착순 40명 · 사전 설문 149표, 참여 희망 댓글 16명",
    },
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
      topic: "무중단 배포와 롤백",
      brief: "운영 서버(PROD)를 2대로 늘리고 한 대씩 배포하도록 바꾼 뒤, 배포·롤백 중에도 요청이 끊기지 않는지 밖에서 계속 요청을 보내 확인했다. (2026-10-21)",
      criteria: [
        {
          text: "prod에 배포하는 동안 외부에서 요청을 계속 보내, 실패한 요청 수와 끊긴 시간을 기록했다",
          done: true,
          evidence: "[검증 기록](https://github.com/woowacourse-teams/2026-yesulin/blob/dev/design/zero-downtime-deployment-record.md)의 \"결과\" 표 · 바꾸기 전 222건 실패·164.5초 끊김 → 바꾼 뒤 0건·0초",
        },
        {
          text: "직전 버전으로 되돌리는 절차가 문서에 있고, 실제로 한 번 되돌린 기록(시작·완료 시각)이 있다",
          done: true,
          evidence: "절차는 [배포 문서](https://github.com/woowacourse-teams/2026-yesulin/blob/dev/backend/docs/operations/deployment.md)의 \"배포는 성공했지만 동작이 잘못돼 되돌릴 때\" 단락, 실제 롤백은 검증 기록 \"⑤ 롤백\" · 14:05 시작 → 14:11 완료, 실패 0건",
        },
      ],
      why: "PROD는 앱 서버 1대에 한꺼번에(AllAtOnce) 배포했다. 배포할 때마다 하나뿐인 서버가 로드 밸런서에서 빠져, 다시 켜질 때까지 모든 요청이 503이 됐다. 드레이닝이 300초였던 10.20 배포는 7분 30초가 걸렸다. 한 대에서 그 자리에 배포하면 재시작 동안 요청을 받을 서버가 없으므로, 무중단은 최소 두 대부터 가능하다.\n\n10.19에 PROD 앱을 micro로 낮추면서 ASG가 새 서버를 띄우면 마지막 성공 버전이 자동 배포되는 것을 확인했다. 서버를 늘리는 길이 이미 열려 있었다. 문제가 생겼을 때 직전 버전으로 되돌리는 롤백은 실제로 해 본 적이 없어, 장애가 난 뒤 처음 해 보지 않도록 같이 연습했다.",
      applied: "- ASG `yesulin-backend-prod-asg`: 1대(0-1) → 2대(2-2)\n- 배포 그룹 `yesulin-backend-prod`: AllAtOnce → **OneAtATime** (한 대를 빼고 배포·검증 뒤 다시 넣고 다음 대로)\n- 대상 그룹 드레이닝: 300초 → 60초\n- 코드: 두 서버에서 스케줄러가 겹치지 않게 DB 잠금, 비밀번호 재설정 토큰을 메모리에서 DB로(#333), 응답한 서버를 알 수 있는 `X-Served-By` 헤더(#334)\n- 측정 도구: `ops/loadtest/deploy-availability.py`. `https://yesulin.art/api/v1/health`를 0.2초마다 보내고, 200이 아니거나 2초 안에 응답이 없으면 실패로 남긴다",
      choice: "세 가지 안을 비교해 **평소 두 대 + 한 대씩 배포**를 골랐다.\n\n- **A. 평소 두 대 (채택)**: 설정이 가장 단순하고 Pipeline을 바꾸지 않는다. 한 대가 죽어도 서비스가 유지된다. 비용은 micro 한 대, 월 최대 약 8달러.\n- B. 배포할 때만 두 대: 평소 비용은 그대로지만 배포마다 ASG를 손으로 올리고 내려야 한다.\n- C. CodeDeploy Blue/Green: 롤백이 대상 전환만으로 끝나지만, 배포마다 ASG를 복사할 권한이 필요하고 학생 계정 권한으로 될지 불확실했다.\n\n두 대가 동시에 돌면 깨지는 코드 두 가지(스케줄러 중복 실행, 서버 메모리에만 있던 비밀번호 재설정 토큰)를 먼저 고쳤다.\n\n측정은 서버 안이 아니라 **내 PC → 인터넷 → ALB → 서버** 경로로 했다. 사용자가 실제로 겪는 끊김을 재기 위해서다. 응답 헤더로 어느 서버가 답했는지 함께 남겨, 배포 중 한 대가 빠지고 다른 한 대가 받아 주는 것을 그래프로 확인할 수 있게 했다.",
      observed: "배포 중 실패한 요청이 **222건(끊김 약 2분 44초) → 0건(끊김 0초)**이 됐다. 직전 버전으로 되돌리는 롤백(14:05 ~ 14:11)과, 롤백이 실패해 CodeDeploy가 자동 복구한 경우에도 실패한 요청은 0건이었다. 대신 배포 시간은 약 3분에서 약 6분으로 늘었다.",
      learned: "- **코드는 되돌릴 수 있지만 DB는 되돌릴 수 없다.** 첫 롤백이 실패한 이유가 같은 날 나간 컬럼 삭제 마이그레이션이었다. 그래서 DB 변경은 Expand-Contract(넓히고 → 옮기고 → 다음 배포에서 지우기)로 나누기로 했고, 지우는 변경이 한 번에 섞이면 PR CI가 실패하도록 검사를 넣었다(#337).\n- **서버가 한 대일 때가 오히려 위험했다.** 로드 밸런서 연동이 켜진 채 서버가 한 대면, 배포 첫 단계에서 유일한 서버를 빼 버려 재시작보다 더 오래 끊긴다.\n- **롤백도 미리 해 봐야 한다.** 어떤 버튼을 누르고 몇 분 걸리는지, 되돌릴 수 없는 버전이 있다는 것을 장애 전에 알게 됐다. 이 경험이 다음 날 운영 DB 백업·복구 작업으로 이어졌다.",
      doc: "https://github.com/woowacourse-teams/2026-yesulin/blob/dev/design/zero-downtime-deployment-record.md",
      figures: [],
      extras: [
        {
          label: "측정 기록",
          body: "같은 health 요청을 0.2초마다 보내며 다섯 번 배포했다. 시각은 모두 2026-10-21 KST다.",
          visuals: [
            {
              kind: "bars",
              title: "배포 중 실패한 요청",
              subtitle: "바꾸기 전 1대 배포와, 바꾼 뒤 2대에 한 대씩 배포·롤백한 결과",
              unit: "건",
              max: 222,
              rows: [
                { label: "① 바꾸기 전 · 1대, 한꺼번에", detail: "1,144건 중 · 끊김 164.5초", value: 222, display: "222건" },
                { label: "③ 바꾼 뒤 · 2대, 한 대씩", detail: "2,988건 중 · 끊김 0초", value: 0, display: "0건" },
                { label: "④ 롤백 실패 → 자동 복구", detail: "3,289건 중 · 끊김 0초", value: 0, display: "0건" },
                { label: "⑤ 직전 버전으로 롤백", detail: "2,421건 중 · 끊김 0초", value: 0, display: "0건" },
              ],
            },
          ],
          table: {
            head: ["측정", "시간", "요청", "실패", "가장 긴 끊김"],
            rows: [
              ["① 바꾸기 전 · 1대, 한꺼번에", "13:25 ~ 13:28", "1,144", "222 (503)", "164.5초 (주1)"],
              ["② 서버 1 → 2대로 늘리기", "13:33 ~ 13:36", "2,778", "1 (주2)", "0.2초"],
              ["③ 바꾼 뒤 · 2대, 한 대씩", "13:45 ~ 13:51", "2,988", "0", "0초"],
              ["④ 롤백 실패 → 자동 복구", "13:54 ~ 13:58", "3,289", "0", "0초"],
              ["⑤ 직전 버전으로 롤백", "14:05 ~ 14:11", "2,421", "0", "0초"],
            ],
          },
          after: "주1. 13:26:28에 측정 요청 하나가 멈춰 13:28:27까지 요청을 보내지 못했다. 같은 시간 CodeDeploy 기록상 서버가 트래픽 차단 → 재시작 중이었고 멈춘 요청도 503으로 끝나 끊김으로 계산했다. 측정 스크립트를 고쳐 ②부터는 요청이 멈춰도 0.2초 간격을 유지한다.\n주2. 배포 중이 아닌 13:40:56에 요청 하나가 2초를 넘긴 단발 지연이다.\n\n아래 그래프는 한 줄이 서버 한 대, 세로 막대 하나가 요청 하나다. 빈 곳은 그 서버가 배포 중이라 요청을 받지 않은 시간이고, 빨간 줄이 실패한 요청이다.",
          figures: [
            { src: "assets/s3/timeline-baseline.svg", caption: "① 바꾸기 전 · 서버 1대가 빠진 13:25:43 ~ 13:28:27 동안 실패(빨간 줄)와 측정 공백" },
            { src: "assets/s3/timeline-rolling.svg", caption: "③ 바꾼 뒤 · 서버 A가 빠진 동안 B가, B가 빠진 동안 A가 받아 실패 0건" },
            { src: "assets/s3/deploy-baseline-draining.jpg", caption: "① 13:26 대상 그룹 · 하나뿐인 서버가 Draining, 정상 대상 0", span: 6 },
            { src: "assets/s3/deploy-oneatatime-success.jpg", caption: "③ 배포 결과 · OneAtATime, 두 서버가 차례로 성공", span: 6 },
          ],
        },
        {
          label: "롤백 기록",
          body: "**직전 버전으로 되돌리는 절차** ([배포 문서](https://github.com/woowacourse-teams/2026-yesulin/blob/dev/backend/docs/operations/deployment.md))\n\n1. CodeDeploy 배포 그룹 `yesulin-backend-prod`의 배포 내역에서 되돌아갈 직전 성공 배포를 열고 \"배포 복사\"를 누른다.\n2. 개정 위치는 그대로, 배포 설명에 이유를 적고 배포 구성이 `OneAtATime`인지 본다.\n3. 두 서버가 차례로 성공하고 `/api/v1/health`가 200이면 완료. 시작·완료 시각을 남긴다.\n\n**⑤ 실제 롤백**: 지금 DB 구조와 맞는 직전 리비전(13:25 배포본 `d-NZ8KW45HL`)으로 되돌렸다. 14:05:06 생성 → 서버 A 2분 30초 → 서버 B 3분 36초 → 14:11 완료, 2,421건 중 실패 0건.\n\n이 리비전은 현재 버전과 같은 커밋의 다른 빌드라 코드 차이는 없다. 절차와 걸린 시간은 실제와 같다. 코드가 다른 버전으로 되돌리는 연습은 다음 PROD 배포 때 한 번 더 기록한다.",
          figures: [
            { src: "assets/s3/timeline-rollback.svg", caption: "⑤ 롤백 · 서버 A → B 순서로 되돌리는 동안 실패 0건" },
            { src: "assets/s3/deploy-rollback-done.jpg", caption: "⑤ 롤백 완료 · 14:05 시작, 14:11 완료" },
          ],
        },
        {
          label: "트러블슈팅",
          body: "**첫 롤백(④)이 실패했다.** 10.20 버전(#327)으로 되돌리는 배포가 첫 서버의 시작 검사에서 멈췄다. CodeDeploy가 두 번째 서버 배포를 건너뛰고 마지막 성공 버전으로 자동 복구했고, 그동안 다른 서버가 요청을 받아 사용자 요청은 한 건도 실패하지 않았다. 하지만 원하던 롤백은 되지 않았다.",
          table: {
            head: ["단계", "내용"],
            rows: [
              ["증상", "롤백 배포 `d-RFQ4LG4HL`이 서버 A의 ValidateService에서 실패 → 자동 복구 `d-DZ8VWC4HL` 성공"],
              ["원인 찾기", "CodeDeploy 이벤트 로그에서 Spring이 Hibernate SessionFactory를 만들다 종료된 것을 확인. 서버 로그 원문이 잘려 있어 #327 이후 마이그레이션을 git으로 비교"],
              ["원인", "같은 날 나간 #328의 마이그레이션이 `timetables` 컬럼 4개를 삭제했다. #327은 그 컬럼을 쓰는 코드라 시작할 때 테이블 구조 검사(`ddl-auto=validate`)에서 멈췄다"],
              ["조치", "지금 DB 구조와 맞는 직전 리비전으로 다시 롤백해 성공(⑤). #327로는 DB 복원 없이 되돌릴 수 없다고 기록"],
              ["재발 방지", "DB 변경은 Expand-Contract로 나눈다. 새 마이그레이션에 컬럼·테이블 삭제, 이름 변경이 있으면 PR CI가 실패하게 했다(#337). #328 직전 커밋으로 돌려 보면 이 4개 삭제를 잡는다"],
            ],
          },
          figures: [
            { src: "assets/s3/timeline-failed-rollback.svg", caption: "④ 롤백 실패 → 자동 복구 · 서버 A가 켜지지 못한 동안 B가 받아 실패 0건" },
            { src: "assets/s3/deploy-failed-rollback-recovery.jpg", caption: "④ 배포 내역 · `d-RFQ4LG4HL` 실패 → \"CodeDeploy 롤백\" `d-DZ8VWC4HL` 성공" },
          ],
        },
        {
          label: "한계와 남은 일",
          body: "- 요청을 보내는 곳이 PC 한 대이고 health 하나만 부른다. 무거운 API 처리 중 끊김까지 대표하지는 않는다.\n- 두 서버에서 OTR 공고 스케줄러가 한 번만 도는지는 DB 잠금 테이블을 직접 보지 못해 확인하지 못했다. 공고 중복 저장은 `(source, external_id)` 유니크 제약으로 막힌다.\n- DEV는 바꾸지 않아 지금도 배포할 때 1~3분 끊긴다. 개발 서버라 비용을 들이지 않았다.",
        },
      ],
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
