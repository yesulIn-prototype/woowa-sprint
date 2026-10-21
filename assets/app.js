/* 예술in 스프린트 기록 렌더러. 내용은 data/ 폴더에서만 수정한다. */
(() => {
  "use strict";

  const store = { site: {}, sprints: {}, errors: [] };
  window.site = (data) => { store.site = data; };
  window.sprint = (data) => { store.sprints[data.no] = data; };

  // data/ 파일에 쉼표 누락 같은 문법 오류가 있으면 페이지 위에 알린다.
  window.addEventListener("error", (e) => {
    const file = (e.filename || "").match(/data\/[^/?#]+\.js/);
    if (file) store.errors.push(`${file[0]} ${e.lineno}번째 줄: ${e.message}`);
  });

  const LEVEL4_QUESTION =
    "레벨3에서 확인한 것 중에서, 무엇을 더 깊게 만들어야 사용자에게 실제로 쓰이는 제품이 되는가?";
  const LINK_LABEL = {
    service: "서비스",
    github: "GitHub",
    hypothesisDoc: "가설 검증 기록",
    userReport: "유저 데이터 리포트",
  };
  const FIELD_NAME = { backend: "백엔드", frontend: "웹 프론트엔드", android: "안드로이드" };
  const STATUS_ORDER = ["완료", "진행 중", "대기", "보류", "취소"];
  const PRIORITY_ORDER = ["P1", "P2", "P3", "기타"];
  const TONE = {
    완료: "good", 승인: "good", 검증: "good", 성공: "good", "유입 확인": "good", "운영 중": "good",
    진행: "active", "진행 중": "active", "컨택 중": "active", 제출: "active",
    "보완 요청": "warn",
    기각: "ink",
    대기: "muted", "준비 중": "muted", "판정 불가": "muted", 종료: "muted", "제출 전": "muted",
    예정: "outline", "해당 없음": "outline", 보류: "outline", 취소: "outline",
  };

  /* ---------- 날짜 ---------- */
  const toDate = (s) => {
    const [y, m, d] = s.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  // ?today=2026-10-05 로 날짜를 바꿔 볼 수 있다.
  const TODAY = (() => {
    const forced = new URLSearchParams(location.search).get("today");
    const d = forced ? toDate(forced) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const md = (d) => `${d.getMonth() + 1}.${d.getDate()}`;

  function phase(s) {
    if (TODAY < toDate(s.start)) return "예정";
    if (TODAY > toDate(s.end)) return "종료";
    return "진행 중";
  }

  /* ---------- 텍스트 ---------- */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const filled = (v) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.some(filled);
    if (typeof v === "object") return Object.values(v).some(filled);
    return String(v).trim() !== "";
  };

  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((#[\w-]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\[([^\]]+)\]\((assets\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  }

  // 빈 줄은 문단, "- "로 시작하는 줄은 목록, "1. "로 시작하는 줄은 번호 목록. 배열은 그대로 목록.
  function rich(value) {
    if (Array.isArray(value)) {
      return `<ul>${value.filter(filled).map((v) => `<li>${inline(v)}</li>`).join("")}</ul>`;
    }
    return String(value)
      .trim()
      .split(/\n\s*\n/)
      .map((block) => {
        let html = "";
        let para = [];
        let items = [];
        let listTag = "";
        const flush = () => {
          if (para.length) html += `<p>${para.map(inline).join("<br>")}</p>`;
          if (items.length) html += `<${listTag}>${items.map((i) => `<li>${inline(i)}</li>`).join("")}</${listTag}>`;
          para = [];
          items = [];
        };
        block.split("\n").forEach((raw) => {
          const line = raw.trim();
          const bullet = line.match(/^-\s+(.*)$/);
          const number = line.match(/^\d+[.)]\s+(.*)$/);
          const item = bullet || number;
          if (item) {
            const tag = bullet ? "ul" : "ol";
            if (para.length || (items.length && tag !== listTag)) flush();
            listTag = tag;
            items.push(item[1]);
          } else {
            if (items.length) flush();
            para.push(line);
          }
        });
        flush();
        return html;
      })
      .join("");
  }

  /* ---------- 조각 ---------- */
  const badge = (text) =>
    text ? `<span class="badge" data-tone="${TONE[text] || "muted"}">${esc(text)}</span>` : "";

  const empty = (hint) => `<div class="field-body is-empty">${esc(hint)}</div>`;

  const row = (label, bodyHtml) =>
    `<div class="field"><div class="field-label">${esc(label)}</div>${bodyHtml}</div>`;

  // 섹션 안의 소제목. right에는 오른쪽 끝에 붙일 링크나 배지를 넣는다.
  const subhead = (titleHtml, right = "", cls = "") =>
    `<div class="subhead"><h3${cls ? ` class="${cls}"` : ""}>${titleHtml}</h3>${right}</div>`;

  const field = (label, value, hint) =>
    row(label, filled(value) ? `<div class="field-body prose">${rich(value)}</div>` : empty(hint));

  // 주소가 없는 링크는 아예 보이지 않는다.
  function link(url, label) {
    if (!filled(url)) return "";
    return `<a class="link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}<span aria-hidden="true"> ↗</span></a>`;
  }

  // hint를 주면 주소가 비었을 때 작성 가이드를 보이고, 주지 않으면 줄 자체를 숨긴다.
  const linkField = (label, url, linkLabel, hint = "") => {
    if (filled(url)) return row(label, `<div class="field-body">${link(url, linkLabel)}</div>`);
    return hint ? row(label, empty(hint)) : "";
  };

  // 그림은 본문에 바로 표시한다. src를 비워 두면 "사진 추가 예정" 자리만 잡는다.
  // span은 한 줄 12칸 중 차지할 칸 수다. 비우면 한 줄을 다 쓴다.
  const figureOf = ({ src, caption, span }) => {
    const cap = filled(caption) ? `<figcaption>${inline(caption)}</figcaption>` : "";
    const style = span ? ` style="grid-column: span ${Number(span)}"` : "";
    return filled(src)
      ? `<figure${style}><img src="${esc(src)}" alt="${esc(caption || "")}" loading="lazy">${cap}</figure>`
      : `<figure class="is-placeholder"${style}><div class="placeholder">사진 추가 예정</div>${cap}</figure>`;
  };

  const figure = (src, caption) => (filled(src) ? figureOf({ src, caption }) : "");

  // layout "pair"면 두 장을 나란히 놓는다.
  const figures = (list, layout = "") => {
    const items = (list || []).filter((f) => filled(f.src) || filled(f.caption));
    return items.length ? `<div class="figures${layout ? ` is-${layout}` : ""}">${items.map(figureOf).join("")}</div>` : "";
  };

  // 가로 막대 비교. rows: [{ group, label, value, total, detail, emphasis }]. 값은 value ÷ total 비율로 그린다.
  function barChart(c) {
    const rows = (c.rows || []).filter((r) => filled(r.label));
    if (!rows.length) return "";
    const groups = [...new Map(rows.map((r) => [r.group, !!r.emphasis])).entries()];
    return `<figure class="bc">
      ${filled(c.title) ? `<figcaption class="bc-title">${inline(c.title)}</figcaption>` : ""}
      <div class="bc-legend">${groups.map(([g, emph]) => `<span><i${emph ? ' class="is-emph"' : ""}></i>${esc(g)}</span>`).join("")}</div>
      <div class="bc-rows" role="list">${rows
        .map((r) => {
          const pct = r.total ? Math.round((r.value / r.total) * 100) : 0;
          const text = `${r.group} · ${r.label}: ${r.detail}`;
          return `<div class="bc-row${r.emphasis ? " is-emph" : ""}" role="listitem" tabindex="0" title="${esc(text)}" aria-label="${esc(`${text}, ${pct}%`)}">
            <div class="bc-label">${esc(r.label)}</div>
            <div class="bc-track"><span class="bc-bar" style="width:${pct * 0.8}%"></span><span class="bc-value">${pct}%</span></div>
            <div class="bc-detail">${esc(r.detail)}</div>
          </div>`;
        })
        .join("")}</div>
      ${filled(c.note) ? `<p class="bc-note">${inline(c.note)}</p>` : ""}
    </figure>`;
  }

  const table = (head, rows) =>
    `<div class="table-scroll"><table><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`)
      .join("")}</tbody></table></div>`;

  function metricComparison(items) {
    return `<div class="metric-comparison">${items.map((item) => `<article class="metric-card">
      <h4>${inline(item.label)}</h4>
      <div class="metric-values">
        <dl><dt>통합 전</dt><dd>${inline(item.before)}</dd>${filled(item.beforeDetail) ? `<dd class="metric-detail">${inline(item.beforeDetail)}</dd>` : ""}</dl>
        <span class="metric-arrow" aria-hidden="true">→</span>
        <dl><dt>통합 후</dt><dd>${inline(item.after)}</dd>${filled(item.afterDetail) ? `<dd class="metric-detail">${inline(item.afterDetail)}</dd>` : ""}</dl>
      </div>
    </article>`).join("")}</div>`;
  }

  function reportVisuals(blocks) {
    return (blocks || []).map((v) => {
      let content = "";
      if (v.kind === "bars") {
        const max = v.max || Math.max(1, ...v.rows.map((r) => r.value));
        const reference = v.reference ? `<i class="rv-reference" style="left:${v.reference.value / max * 100}%" aria-hidden="true"></i>` : "";
        content = `<div class="rv-bars" role="list">${v.rows.map((r) => `<div class="rv-bar-row${r.partial ? " is-partial" : ""}" role="listitem">
          <div class="rv-bar-label">${inline(r.label)}${filled(r.detail) ? `<small>${inline(r.detail)}</small>` : ""}</div>
          <div class="rv-track" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, r.value / max * 100))}%"></span>${reference}</div>
          <strong class="rv-value">${esc(r.display || `${r.value}${v.unit || ""}`)}</strong>
        </div>`).join("")}</div>`;
      } else if (v.kind === "flow") {
        content = `<div class="rv-flow">${v.columns.map((c) => `<div class="rv-flow-column">
          <h5>${inline(c.label)}</h5><ul>${c.steps.map((step) => `<li>${inline(step)}</li>`).join("")}</ul>
          ${filled(c.detail) ? `<p>${inline(c.detail)}</p>` : ""}
        </div>`).join("")}</div>`;
      } else if (v.kind === "timeline") {
        content = `<div class="rv-days">${v.days.map((d) => `<div class="rv-day"><h5>${esc(d.date)}</h5>
          <ol>${d.entries.map((e) => `<li><time>${esc(e.time)}</time><span>${inline(e.label)}</span></li>`).join("")}</ol>
        </div>`).join("")}</div>`;
      }
      if (!content) return "";
      return `<section class="report-visual" aria-label="${esc(v.title)}"><h4>${inline(v.title)}</h4>
        ${filled(v.subtitle) ? `<p class="rv-subtitle">${inline(v.subtitle)}</p>` : ""}
        ${v.reference ? `<p class="rv-key"><i aria-hidden="true"></i>${inline(v.reference.label)}</p>` : ""}
        ${content}${filled(v.note) ? `<p class="rv-note">${inline(v.note)}</p>` : ""}
      </section>`;
    }).join("");
  }

  const cell = (v) => (filled(v) ? inline(v) : `<span class="dash">—</span>`);

  const enabledFields = () => Object.keys(FIELD_NAME).filter((k) => store.site.fields?.[k]);

  const worksOf = (s) => (s.highlights || []).filter((h) => filled(h.title));
  const recruitsOf = (s) => (s.recruiting || []).filter((r) => filled(r.title));

  function backlogOf(s) {
    const list = (s.backlog || []).filter((b) => filled(b.title));
    const count = Object.fromEntries(STATUS_ORDER.map((st) => [st, list.filter((b) => b.status === st).length]));
    return { list, count, total: list.length };
  }

  function progressBar(list) {
    if (!list.length) return "";
    const rank = (b) => (STATUS_ORDER.includes(b.status) ? STATUS_ORDER.indexOf(b.status) : STATUS_ORDER.length);
    return `<div class="bar" aria-hidden="true">${[...list]
      .sort((a, b) => rank(a) - rank(b))
      .map((b) => `<span data-tone="${TONE[b.status] || "muted"}"></span>`)
      .join("")}</div>`;
  }

  const sprintList = () => Object.values(store.sprints).sort((a, b) => a.no - b.no);

  /* ---------- 공통 틀 ---------- */
  function topbar(current) {
    const items = [`<a href="index.html"${current === 0 ? ' aria-current="page"' : ""}>개요</a>`].concat(
      sprintList().map(
        (s) =>
          `<a href="sprint.html?n=${s.no}"${current === s.no ? ' aria-current="page"' : ""}>S${s.no}${
            phase(s) === "진행 중" ? '<span class="live" title="진행 중"></span>' : ""
          }</a>`,
      ),
    );
    return `<header class="topbar"><div class="wrap topbar-inner">
      <a class="brand" href="index.html"><img src="assets/logo.png" alt="${esc(store.site.team)}" width="49" height="28"><span class="brand-sub">스프린트 기록</span></a>
      <nav aria-label="스프린트">${items.join("")}</nav>
    </div></header>`;
  }

  const footer = () => `<footer class="footer"><div class="wrap">우아한테크코스 레벨4 · ${esc(store.site.team)}</div></footer>`;

  /* ---------- 개요 페이지 ---------- */
  function renderHome() {
    const S = store.site;
    const sprints = sprintList();
    const first = sprints[0];
    const last = sprints[sprints.length - 1];

    const links = Object.keys(LINK_LABEL).map((k) => link(S.links?.[k], LINK_LABEL[k])).join("");

    const direction = filled(S.direction)
      ? `<p class="direction-a">${inline(S.direction)}</p>`
      : `<p class="direction-a is-empty">레벨3 근거 위에서 고른 고도화 대상을 한 문장으로. 근거는 스프린트 1의 ‘이번 스프린트 초점’에 적습니다.</p>`;

    const rows = sprints
      .map((s) => {
        const p = phase(s);
        const { list, count, total } = backlogOf(s);
        return `<a class="srow${p === "진행 중" ? " is-current" : ""}" href="sprint.html?n=${s.no}">
          <span class="srow-no">S${s.no}</span>
          <span class="srow-main">
            <span class="srow-head"><strong>${md(toDate(s.start))} – ${md(toDate(s.end))}</strong>${badge(p)}</span>
            <span class="srow-goal${filled(s.goal) ? "" : " is-empty"}">${filled(s.goal) ? inline(s.goal) : esc(s.theme || "스프린트 목표 작성 전")}</span>
          </span>
          <span class="srow-progress">${total ? `완료 ${count["완료"]}/${total}${progressBar(list)}` : `<span class="dash">백로그 —</span>`}</span>
        </a>`;
      })
      .join("");

    return `
      <main class="wrap home">
        <header class="hero">
          <p class="eyebrow">우아한테크코스 레벨4 · ${md(toDate(first.start))} – ${md(toDate(last.end))} · 2주 스프린트 ${sprints.length}회</p>
          <h1>${esc(S.team)} 스프린트 기록</h1>
          <p class="lede">${esc(S.tagline)}</p>
          <div class="links">${links}</div>
        </header>

        <section class="block direction" aria-labelledby="h-direction">
          <h2 id="h-direction" class="direction-q">${LEVEL4_QUESTION}</h2>
          ${direction}
        </section>

        <section class="block" aria-labelledby="h-team">
          <h2 id="h-team">팀</h2>
          ${team(S.members)}
        </section>

        <section class="block" aria-labelledby="h-sprints">
          <h2 id="h-sprints">스프린트</h2>
          <div class="srows">${rows}</div>
        </section>

      </main>
      ${footer()}`;
  }

  // 팀원 카드. GitHub로 이어지고, 스프린트마다 맡은 핵심 작업을 한 줄씩 보여 준다.
  function team(list) {
    const members = (list || []).filter((x) => filled(x.name));
    if (!members.length) return empty("data/site.js의 members에 팀원을 적습니다.");
    // 핵심 작업과 사용자 모집 활동 중 담당(owner)에 이름이 있는 것을 모은다. teamTitle이 있으면 그 이름으로 보여 준다.
    const owns = (item, name) => String(item.owner || "").split(/[,·]\s*/).includes(name);
    const worksFor = (name) =>
      sprintList()
        .map((s) => [
          s.no,
          [...worksOf(s), ...recruitsOf(s)].filter((item) => owns(item, name)).map((item) => item.teamTitle || item.title),
        ])
        .filter(([, titles]) => titles.length);
    // 프로필 사진(photo)이 있으면 카드 위에 크게, 없으면 GitHub 프로필 사진을 작게 보여 준다.
    const hasPhotos = members.some((x) => filled(x.photo));
    return `<ul class="members${hasPhotos ? " has-photos" : ""}">${members
      .map((x) => {
        const works = worksFor(x.name);
        const media = filled(x.photo)
          ? `<img class="m-photo" src="${esc(x.photo)}" alt="${esc(x.name)} 프로필 사진" loading="lazy"${
              filled(x.photoPos) ? ` style="object-position: ${esc(x.photoPos)}"` : ""
            }>`
          : filled(x.github)
            ? `<img class="avatar" src="https://github.com/${esc(x.github)}.png?size=${hasPhotos ? 400 : 96}" alt="" loading="lazy">`
            : "";
        const inner = `
          ${media}
          <div class="m-text">
            <span class="m-name"><span class="m-nick">${esc(x.name)}${
              x.leader ? '<span class="m-crown" role="img" aria-label="팀장" title="팀장">👑</span>' : ""
            }</span>${filled(x.github) ? `<span class="m-handle">@${esc(x.github)}</span>` : ""}</span>
            ${filled(x.intro) ? `<span class="m-intro">${inline(x.intro)}</span>` : ""}
            ${works
              .map(
                ([no, titles]) =>
                  `<div class="m-work"><span class="k">S${no}</span><ul>${titles.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`,
              )
              .join("")}
          </div>`;
        return `<li>${
          filled(x.github)
            ? `<a href="https://github.com/${esc(x.github)}" target="_blank" rel="noopener" aria-label="${esc(`${x.name} GitHub`)}">${inner}</a>`
            : `<div>${inner}</div>`
        }</li>`;
      })
      .join("")}</ul>`;
  }

  // 요구사항별 LMS+ 제출·승인 상태
  function submissionStatus(s, key) {
    if (key in FIELD_NAME && !store.site.fields?.[key]) return "해당 없음";
    return s.submission?.status?.[key] || "제출 전";
  }

  /* ---------- 스프린트 페이지 ---------- */
  function renderSprint(n) {
    const s = store.sprints[n];
    if (!s) {
      return `<main class="wrap"><div class="missing"><h1>스프린트 ${esc(n)} 기록이 없습니다</h1><p><a href="index.html">개요로 돌아가기</a></p></div></main>`;
    }
    document.title = `스프린트 ${s.no} · ${store.site.team} 스프린트 기록`;

    const sections = [
      ["overview", "한눈에 보기", secOverview(s)],
      ["work", "핵심 작업", secWork(s)],
      ["focus", s.overview ? "다음으로 이어갈 것" : "이번 스프린트 초점", secFocus(s)],
      ["product", "동작하는 제품", secProduct(s)],
      ["hypothesis", "가설과 결과", secHypothesis(s)],
      ["tech", "기술 요구사항", secTech(s)],
      ["team", "팀으로 일하는 방식", secSoftskill(s)],
      ["retro", "회고와 다음 스프린트", secRetro(s)],
      ["coach", "코치에게", secCoach(s)],
    ].filter(([id]) => !(s.presentation?.hideSections || []).includes(id));

    // site.js의 layout이 "tabs"면 섹션을 상단 탭으로 나눠 보여 준다. 비우면 예전처럼 한 페이지에 모두 보인다.
    const tabs = store.site.layout === "tabs" ? sprintTabs().map((t) => ({ ...t, ids: t.ids.filter((id) => sections.some(([sid]) => sid === id)) })).filter((t) => t.ids.length) : null;
    const tabOf = (id) => (tabs ? tabs.find((t) => t.ids.includes(id))?.key : "");

    const toc = sections
      .map(
        ([id, title], i) =>
          `<li${tabs ? ` data-tab="${tabOf(id)}"` : ""}><a href="#${id}"><span class="toc-no">${i + 1}</span>${title}</a></li>`,
      )
      .join("");
    const secHtml = new Map(
      sections.map(([id, title, html], i) => [
        id,
        `<section class="sec" id="${id}" aria-labelledby="h-${id}"><h2 id="h-${id}"><span class="sec-no">${i + 1}</span>${title}</h2>${html}</section>`,
      ]),
    );
    const body = tabs
      ? tabs
          .map(
            (t, i) =>
              `<div class="tab-panel" id="panel-${t.key}" data-tab="${t.key}" role="tabpanel" aria-labelledby="tab-${t.key}"${
                i === 0 ? "" : " hidden"
              }>${t.ids.map((id) => secHtml.get(id)).join("")}</div>`,
          )
          .join("")
      : [...secHtml.values()].join("");

    const prev = store.sprints[s.no - 1];
    const next = store.sprints[s.no + 1];
    const pager = `<nav class="pager" aria-label="다른 스프린트">${
      prev ? `<a href="sprint.html?n=${prev.no}">← 스프린트 ${prev.no}</a>` : "<span></span>"
    }${next ? `<a href="sprint.html?n=${next.no}">스프린트 ${next.no} →</a>` : "<span></span>"}</nav>`;

    const header = `<header class="sheader">
          <p class="eyebrow">S${s.no} · ${esc(s.weeks || "")}</p>
          <h1>스프린트 ${s.no}</h1>
          <p class="lede${filled(s.theme) ? "" : " is-empty"}">${filled(s.theme) ? esc(s.theme) : "스프린트가 열리면 공식 안내의 초점을 적습니다"}</p>
        </header>`;
    const layout = `<div class="layout">
          <nav class="toc" aria-label="이 페이지 목차"><ol>${toc}</ol></nav>
          <div class="content">${body}${pager}</div>
        </div>`;

    if (tabs) {
      const tabBar = `<div class="tabs-bar"><div class="wrap"><nav class="tabs" role="tablist" aria-label="스프린트 내용">${tabs
        .map(
          (t, i) =>
            `<a class="tab" id="tab-${t.key}" role="tab" href="#${t.ids[0]}" data-tab="${t.key}" aria-controls="panel-${t.key}" aria-selected="${
              i === 0
            }" title="${esc(t.title)}">${esc(t.label)}</a>`,
        )
        .join("")}</nav></div></div>`;
      return `
      <main class="has-tabs">
        <div class="wrap">${header}</div>
        ${tabBar}
        <div class="wrap">${layout}</div>
      </main>
      ${footer()}`;
    }

    return `
      <main class="wrap">
        ${header}
        ${layout}
      </main>
      ${footer()}`;
  }

  // 스프린트 페이지 탭. ids는 그 탭에 들어가는 섹션 id이고, 탭 링크는 첫 섹션으로 간다.
  function sprintTabs() {
    const fields = enabledFields();
    return [
      { key: "overview", label: "Overview", title: "한눈에 보기 · 핵심 작업 · 이번 스프린트 초점 · 동작하는 제품", ids: ["overview", "work", "focus", "product"] },
      { key: "product", label: "Product", title: "제품 요구사항: 가설과 결과 · 유저 데이터", ids: ["hypothesis"] },
      {
        key: "tech",
        label: fields.length === 1 && fields[0] === "backend" ? "Backend" : "Tech",
        title: "기술 요구사항",
        ids: ["tech"],
      },
      { key: "softskill", label: "Soft Skill", title: "소프트스킬: 팀으로 일하는 방식", ids: ["team"] },
      { key: "retro", label: "Retro & Coach", title: "회고와 다음 스프린트 · 코치에게", ids: ["retro", "coach"] },
    ];
  }

  // 주소의 #id가 들어 있는 탭을 연다. 찾지 못하면 null.
  function tabForHash() {
    const id = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
    const el = id ? document.getElementById(id) : null;
    return el?.closest(".tab-panel")?.dataset.tab || null;
  }

  function activateTab(key) {
    document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.dataset.tab !== key));
    document.querySelectorAll(".tabs .tab").forEach((a) => a.setAttribute("aria-selected", String(a.dataset.tab === key)));
    document.querySelectorAll(".toc li[data-tab]").forEach((li) => (li.hidden = li.dataset.tab !== key));
  }

  function setupTabs() {
    if (!document.querySelector(".tab-panel")) return;
    document.documentElement.classList.add("tabbed");
    activateTab(tabForHash() || document.querySelector(".tab-panel").dataset.tab);
    // 탭 링크·본문 안 링크(#tech, #user-data 등)로 주소가 바뀌면 그 섹션이 든 탭을 열고 위치를 맞춘다.
    window.addEventListener("hashchange", () => {
      const key = tabForHash();
      if (!key) return;
      activateTab(key);
      jumpToHash();
    });
  }

  // 작업 제목만 모아 두고, 누르면 자세한 내용으로 이동한다.
  function secOverview(s) {
    if (s.overview) {
      const o = s.overview;
      return `<div class="sprint-summary">
        ${s.review ? `<div class="review-summary"><p>${esc(s.review.date)} · 코치 피드백</p><div><span>백엔드 ${badge(submissionStatus(s,"backend"))}</span><span>소프트스킬 ${badge(submissionStatus(s,"softskill"))}</span><span>제품 ${badge(submissionStatus(s,"product"))}</span></div><p>${esc(s.review.summary)}</p></div>` : ""}
        <h3>${esc(o.title)}</h3><p class="summary-intro">${esc(o.summary)}</p>
        <div class="summary-outcomes">${o.outcomes.map((v) => `<div><p>${esc(v.label)}</p><strong>${esc(v.value)}</strong><span>${esc(v.detail)}</span></div>`).join("")}</div>
        <ol class="summary-flow" aria-label="공고를 배우에게 전달하는 흐름">${o.flow.map((step,i) => `<li><span>0${i+1}</span>${esc(step)}</li>`).join("")}</ol>
        <p class="summary-footnote">10.15까지의 관측 기록 · 비용은 일평균의 월 환산 추정치</p>
      </div>`;
    }
    const works = worksOf(s);
    const recruits = recruitsOf(s);
    const items = [
      ...works.map((h, i) => [`#work-${i + 1}`, inline(h.title), badge(h.status)]),
      ...(recruits.length ? [["#recruit", "사용자 모집 활동", `<span class="mono">${recruits.length}건</span>`]] : []),
    ];
    if (!items.length) return empty("핵심 작업을 적으면 제목이 여기에 모입니다.");
    return `<ol class="glance">${items
      .map(
        ([href, title, right]) =>
          `<li><a href="${href}"><span class="glance-title">${title}</span>${right}<span class="glance-arrow" aria-hidden="true">↓</span></a></li>`,
      )
      .join("")}</ol>`;
  }

  function secWork(s) {
    const works = worksOf(s);
    if (!works.length) return empty("데모데이에 공유할 핵심 작업을 담당·상태와 함께 적습니다.");
    if (s.overview) return `<div class="overview-work">${works.map((h,i) => `<details class="work-record" id="work-${i+1}">
      <summary><span>${esc(h.title)}</span>${badge(h.status)}</summary>
      <div class="work-record-body"><p class="work-owner">${esc(h.owner)}</p><p class="work-summary">${esc(h.summary)}</p>
      <div class="prose">${rich(h.body)}</div>${reportVisuals(h.visuals)}${figures(h.figures)}
      <div class="report-links">${(h.links || []).map((l) => link(l.url,l.label)).join("")}</div></div>
    </details>`).join("")}</div>`;
    return works.map((h, i) => highlight(h, i + 1)).join("");
  }

  function highlight(h, n) {
    const links = (h.links || []).filter((l) => filled(l.url));
    return `<article class="hl" id="work-${n}">
      ${subhead(inline(h.title), badge(h.status))}
      <p class="hl-meta">${esc(h.owner || "담당 —")}${filled(h.note) ? ` · ${inline(h.note)}` : ""}</p>
      ${reportVisuals(h.visuals)}
      ${filled(h.summary) ? `<div class="prose hl-body">${rich(h.summary)}</div>${reportDetails("진행 과정과 상세 근거", rich(h.body))}` : filled(h.body) ? `<div class="prose hl-body">${rich(h.body)}</div>` : `<p class="hl-empty">발표 자료 준비 중</p>`}
      ${figures(h.figures)}
      ${
        links.length || h.more
          ? `<p class="hl-links">${h.more ? `<a class="link" href="#${esc(h.more)}">자세히 보기 ↓</a>` : ""}${links.map((l) => link(l.url, l.label)).join("")}</p>`
          : ""
      }
    </article>`;
  }

  function secFocus(s) {
    if (s.overview) return `<div class="overview-next">${s.overview.next.map((v) => `<div><h3>${esc(v.title)}</h3><p>${esc(v.body)}</p></div>`).join("")}</div>`;
    const blocks = s.focus || [];
    if (!blocks.length) return empty("스프린트가 열리면 공식 안내의 초점과 우리 팀의 답을 적습니다.");
    return blocks
      .map(
        (b) =>
          (b.chart
            ? row(b.label, `<div class="field-body">${filled(b.body) ? `<div class="prose">${rich(b.body)}</div>` : ""}${barChart(b.chart)}</div>`)
            : field(b.label, b.body, b.hint)) + figures(b.figures),
      )
      .join("");
  }

  function secProduct(s) {
    const pr = s.product || {};
    if (s.overview) return `<div class="overview-product">${s.overview.changes.map((c) => `<div><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p></div>`).join("")}<p>${link(pr.demo,"yesulin.art에서 보기")}</p></div>`;
    const changes = (pr.changes || []).filter((c) => filled(c.title));
    // 적은 칸만 보여 준다. 이전·이후를 적으면 나란히 비교한다.
    const change = (c) => {
      const links = (c.links || []).filter((l) => filled(l.url));
      const compare =
        filled(c.before) || filled(c.after)
          ? `<div class="compare">
              <div><div class="field-label">이전</div>${filled(c.before) ? `<div class="prose">${rich(c.before)}</div>` : empty("바뀌기 전")}</div>
              <div><div class="field-label">이후</div>${filled(c.after) ? `<div class="prose">${rich(c.after)}</div>` : empty("바뀐 뒤")}</div>
            </div>`
          : "";
      return `<article class="change">
        ${subhead(inline(c.title))}
        ${filled(c.body) ? `<div class="prose">${rich(c.body)}</div>` : ""}
        ${compare}
        ${filled(c.why) ? field("바꾼 이유", c.why, "") : ""}
        ${figure(c.image, c.caption)}
        ${figures(c.figures)}
        ${!filled(c.body) && !compare ? `<p class="hl-empty">설명 준비 중</p>` : ""}
        ${links.length ? `<p class="hl-links">${links.map((l) => link(l.url, l.label)).join("")}</p>` : ""}
      </article>`;
    };
    const list = changes.length
      ? changes.map(change).join("")
      : empty("이번 스프린트에 사용자가 보는 화면이나 동작이 달라진 부분을 시연 순서대로 적습니다.");
    // demoLabel이 없으면 주소를 그대로 보여 준다.
    const demoLabel = filled(pr.demoLabel) ? pr.demoLabel : filled(pr.demo) ? pr.demo.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
    return `${linkField("시연", pr.demo, demoLabel, "데모데이에 띄울 화면 주소")}${list}`;
  }

  function secHypothesis(s) {
    if (s.hypothesis?.concise) return productReport(s);
    const h = s.hypothesis || {};
    const u = s.userData || {};
    // 정의는 스프린트마다 바뀔 수 있어, sprint-N.js의 userData.metrics가 있으면 site.js 값보다 먼저 쓴다.
    const m = { ...(store.site.metrics || {}), ...(u.metrics || {}) };
    const wau = u.wau || [];
    const recruits = recruitsOf(s);
    // cycles가 있으면 여러 사이클을 접었다 펼 수 있는 목록으로, 없으면 한 사이클의 칸으로 보여 준다.
    const cycles = (h.cycles || []).filter((c) => filled(c.title) || filled(c.hypothesis));
    const hypothesisHtml = hypothesisRecord(h);

    const stat = (label, value, sub) =>
      `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${cell(value)}</div>${
        sub ? `<div class="stat-sub">${sub}</div>` : ""
      }</div>`;

    const recruiting = recruits.length
      ? `<div class="recruit" id="recruit">
          ${subhead("사용자 모집 활동", `<span class="mono">${recruits.length}건</span>`)}
          ${figures(s.recruitingFigures, "pair")}
          ${table(
            ["활동", "상태", "현재 상황", "다음 행동", "성과 지표"],
            recruits.map((r) => [
              `${inline(r.title)}${filled(r.category) ? `<small class="cat">${esc(r.category)}</small>` : ""}`,
              badge(r.status),
              cell(r.now),
              cell(r.next),
              cell(r.metric),
            ]),
          )}
        </div>`
      : "";

    return `
      ${productSubmission(s)}
      ${subhead(
        "가설 사이클",
        [cycles.length ? `<span class="mono">${cycles.length}건</span>` : "", link(store.site.links?.hypothesisDoc, "가설 검증 기록")].join(""),
      )}
      ${hypothesisHtml}

      <div id="user-data">${
        filled(u.unavailable) ? `${subhead("유저 데이터")}<div class="prose">${rich(u.unavailable)}</div>` : userData(u, m, wau, stat)
      }</div>
      ${recruiting}`;
  }

  function hypothesisRecord(h) {
    const cycles = (h.cycles || []).filter((c) => filled(c.title) || filled(c.hypothesis));
    return cycles.length
      ? `${filled(h.intro) ? `<div class="prose hyp-note">${rich(h.intro)}</div>` : ""}
        <div class="cycles">${cycles
          .map(
            (c, i) => `<details class="cycle"${c.featured ? " open" : ""}>
              <summary><span class="cycle-no">${i + 1}/${cycles.length}</span><span class="cycle-title">${inline(c.title)}</span>${
                c.featured ? '<span class="cycle-tag">대표 사례</span>' : ""
              }${badge(c.verdict)}</summary>
              <div class="cycle-body">${reportVisuals(c.visuals)}${cycleFields(c)}${figures(c.figures)}</div>
            </details>`,
          )
          .join("")}</div>
        ${filled(h.outro) ? `<div class="prose hyp-note">${rich(h.outro)}</div>` : ""}`
      : cycleFields(h);

  }

  const reportDetails = (label, html) => filled(html)
    ? `<details class="report-details"><summary>${esc(label)}</summary><div class="report-details-body prose">${html}</div></details>` : "";

  function productSubmission(s) {
    const p = s.productSubmission;
    if (!p) return "";
    return `<div class="submission-summary">${subhead("제출 전 점검 · 제품 요구사항")}
      <div class="prose">${rich(p.note)}</div>
      ${linkField("가설 검증 기록", store.site.links?.hypothesisDoc, "스프린트별 가설 누적 문서")}
      ${linkField("유저 데이터 리포트", store.site.links?.userReport, "스프린트별 데이터 누적 문서")}
      ${linkField("랜딩페이지", p.landing, "yesulin.art")}
      ${criteriaRow(p.criteria)}
      ${field("랜딩페이지 확인", p.landingNote)}
    </div>`;
  }

  // 가설 사이클 한 건의 칸 (가설 · 실험 · 관측 · 결론 · 러닝 · 다음 액션 · 자신감)
  function cycleFields(h) {
    const verdict = filled(h.verdict)
      ? `<div class="field-body prose"><p>${badge(h.verdict)}${
          filled(h.verdictNote) ? ` <span class="verdict-note">${inline(h.verdictNote)}</span>` : ""
        }</p>${filled(h.verdictReason) ? rich(h.verdictReason) : ""}</div>`
      : empty("검증·기각·판정 불가 중 하나와 그 이유");

    const hasScore = h.confidence != null && h.confidence !== "";
    const n = hasScore ? Math.max(0, Math.min(10, Number(h.confidence))) : 0;
    const dots = hasScore
      ? `<span class="dots" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join(
          "",
        )}</span><span class="mono">${n} / 10</span>`
      : "";
    const confidence =
      hasScore || filled(h.confidenceNote)
        ? `<div class="field-body">${dots}${filled(h.confidenceNote) ? `<div class="prose confidence-note">${rich(h.confidenceNote)}</div>` : ""}</div>`
        : empty("“우리 제품으로 유저를 모을 수 있을 것 같다” 0에서 10");

    // plan이 있으면 사이클을 시작하기 전에 정한 것을 가설 위에 보여 준다.
    const p = h.plan;
    const plan = p
      ? `<div class="prose hyp-note"><p><strong>${esc(p.title || "사이클 시작 전에 정한 것")}</strong></p></div>
        ${field("대상", p.target, "누구의 행동을 보는가")}
        ${field("기간", p.period, "언제부터 언제까지 보는가")}
        ${field("행동", p.action, "어떤 행동이 나오면 셀 것인가")}
        ${field("성공 기준", p.criterion, "결과를 보기 전에 정한 숫자 기준")}
        ${field("측정 출처", p.source, "그 숫자를 어디서 가져오는가")}
        ${field("제외할 계정", p.exclusion, "팀원·테스트 계정을 어떻게 빼는가")}`
      : "";

    return `
      ${plan}
      ${field("가설", h.hypothesis, "무엇이 참이라고 보는가. 왜 이 가설을 골랐는가")}
      ${field("실험", h.experiment, "어떻게 확인하는가. 성공 기준을 숫자로 미리")}
      ${field("관측", h.observation, "무엇이 나왔는가. 누구에게서, 몇 명에게서 얻었나")}
      ${row("결론", verdict)}
      ${field("러닝", h.learning, "제품과 유저에 대해 배운 것")}
      ${field("다음 액션", h.nextAction, "다음 스프린트에 할 실험")}
      ${row("자신감", confidence)}`;
  }

  function userData(u, m, wau, stat) {
    if (u.report) return userReport(u, m);
    return `
      ${subhead("유저 데이터", link(store.site.links?.userReport, "유저 데이터 리포트"))}
      <div class="stats">
        ${stat("WAU · 1주차", wau[0])}
        ${stat("WAU · 2주차", wau[1])}
        ${stat("W+4 리텐션", u.w4Retention)}
        ${stat(
          `핵심 지표${filled(m.coreName) ? ` · ${esc(m.coreName)}` : ""}`,
          u.coreValue,
          filled(u.coreSub) ? esc(u.coreSub) : filled(m.coreTarget) ? `목표 ${esc(m.coreTarget)}` : "",
        )}
      </div>
      ${field("활성 유저 정의", m.activeAction, "사용자가 어떤 행동을 하면 활성으로 보는가, 왜 그 행동인가. DAU·WAU·MAU 중 무엇이 중요하고 왜인가")}
      ${reportVisuals(u.visuals)}
      ${field("활성 유저 데이터", u.activeData, "팀이 고른 활성 유저 지표(DAU, WAU 등)와 근거 자료")}
      ${figures(u.figures)}
      ${
        filled(u.retentionChart)
          ? figure(u.retentionChart, u.retentionCaption || "리텐션 그래프")
          : field("리텐션", u.retentionNote, "X축은 시간, Y축은 리텐션 비율 (D7, W4 등). 아직 잴 수 없다면 그 이유")
      }
      ${field("활성 유저 해석", u.activeReading, "활성 유저 지표로 본 핵심 가치와 유저 행동. 숫자가 0이거나 없다면 그 이유")}
      ${field("핵심 지표 정의", m.coreName && [m.coreName, m.coreWhy].filter(filled).join("\n\n"), "핵심 지표 하나와 그것이 핵심 지표인 이유")}
      ${field("핵심 지표 목표", m.coreTarget && [m.coreTarget, m.coreTargetWhy].filter(filled).join("\n\n"), "얼마가 되면 서비스의 가치가 증명됐다고 보는가, 그 수치의 근거")}
      ${field("핵심 지표 해석", u.coreReading, "핵심 지표로 본 핵심 가치와 유저 행동")}
      ${field("집계 제외", m.exclusion, "팀 밖 사용자만 센다. 팀원·테스트 계정을 어떻게 뺐는가")}
      ${filled(u.nextDefinition) ? field("다음 스프린트부터", u.nextDefinition, "") : ""}`;
  }

  // S2 제출은 결론부터 읽고, 측정 조건과 원자료를 필요할 때 확인한다.
  function backendReport(t, status) {
    const r = t.report;
    const nf = (value) => Number(value).toLocaleString("ko-KR");
    return `<article class="coach-report backend-report">
      <div class="report-kicker"><span>${esc(t.topic)}</span>${badge(t.status || status)}</div>
      <section class="report-block">
        <h3>${esc(r.reasonTitle || "목표 수치를 먼저 정하지 않은 이유")}</h3>
        <div class="prose">${rich(r.reason)}</div>
        ${r.approvalNote ? `<p class="report-note">${esc(r.approvalNote)}</p>` : ""}
      </section>
      <section class="report-block">
        <h3>부하 테스트 전후</h3>
        <p class="report-lead">${inline(r.beforeAfter)}</p>
        <figure class="load-results" aria-label="${esc(r.runs.map((run) => `${run.label} ${run.rps}RPS`).join('와 '))} 요청 결과 비교">
          <div class="load-result-grid">${r.runs.map((run, i) => {
            const failRate = run.failed / run.total * 100;
            return `<div class="load-result${i ? " is-after" : ""}">
              <p class="result-eyebrow">${esc(run.label)}</p>
              <p class="result-load"><strong>${nf(run.rps)}</strong><span>RPS</span></p>
              <p class="result-state">${run.failed ? "요청의 절반 이상 실패" : "본 측정 오류 0건"}</p>
              <div class="result-bar" role="img" aria-label="성공 ${(100 - failRate).toFixed(2)}%, 실패 ${failRate.toFixed(2)}%"><span style="width:${100 - failRate}%"></span><i style="width:${failRate}%"></i></div>
              <dl class="result-numbers"><div><dt>오류율</dt><dd>${failRate ? failRate.toFixed(2) : "0"}%</dd></div><div><dt>p95 응답시간</dt><dd>${nf(run.p95)}<small> ms</small></dd></div></dl>
              <p class="result-sample">실패 ${nf(run.failed)} / 전체 ${nf(run.total)}건</p>
            </div>`;
          }).join("")}</div>
          <div class="result-legend"><span><i></i>성공 요청</span><span><i></i>실패 요청</span><span>막대는 각 실행의 요청 결과 비율</span></div>
          <figcaption>${esc(r.comparisonNote)}</figcaption>
        </figure>
        <p class="report-note">${inline(r.boundary)}</p>
      </section>
      ${r.operatingLoad ? `<section class="report-block operating-load"><h3>운영 요청량과 micro의 처리 여유</h3>
        <p class="report-period">${esc(r.operatingLoad.period)}</p>
        <div class="capacity-outcomes">
          ${[{label:"기록 요청의 기간 평균",value:r.operatingLoad.averageRps,note:"PROD small 운영"},{label:"가장 바빴던 1분의 평균",value:r.operatingLoad.peakMinuteRps,note:r.operatingLoad.peakAt || "순간 최대 RPS와 구분"},{label:"부하 테스트에서 확인",value:400,note:"DEV micro · 60초 · 오류 0건"}].map((v) => `<div><p>${esc(v.label)}</p><strong>${v.value == null ? "조회 대기" : Number(v.value).toLocaleString("ko-KR",{maximumFractionDigits:Number(v.value) < 1 ? 3 : 2})}${v.value == null ? "" : "<small>RPS</small>"}</strong><span>${esc(v.note)}</span></div>`).join("")}
        </div>
        <p class="report-note">${esc(r.operatingLoad.sourceNote)}</p>
        ${r.operatingLoad.conclusion ? `<p>${esc(r.operatingLoad.conclusion)}</p>` : ""}
        ${figure(r.operatingLoad.chart,r.operatingLoad.chartCaption)}
        ${reportDetails("추가 근거 · small 운영 당시 CPU", figure(r.operatingLoad.cpuImage,r.operatingLoad.cpuCaption) + `<p>${esc(r.operatingLoad.cpuReading)}</p>`)}
      </section>` : ""}
      <section class="report-block">
        <h3>무엇을 바꿨나</h3>
        <ol class="report-changes">${r.changes.map((c) => `<li><h4>${esc(c.title)}</h4><p>${esc(c.body)}</p></li>`).join("")}</ol>
        ${reportDetails("병목 판단과 같은 100RPS 전후 비교", rich(r.diagnosis) + rich(r.controlledComparison))}
      </section>
      <section class="report-block">
        <h3>동작과 DB 변경 검증</h3>
        <div class="report-proof-grid">${r.verification.map((v) => `<div><h4>${esc(v.title)}</h4><p>${esc(v.body)}</p><div class="report-links">${v.links.map((l) => link(l.url,l.label)).join("")}</div></div>`).join("")}</div>
      </section>
      ${r.sizing ? `<section class="report-block sizing-review"><h3>${esc(r.sizing.title)}</h3><p>${esc(r.sizing.note)}</p>
        ${r.sizing.rules?.length ? table(["확인할 지표","축소 후 유지 조건","보류·복구 판단"],r.sizing.rules.map((v) => [esc(v.metric),esc(v.accept),esc(v.stop)])) : ""}
        ${reportDetails("10.19 후속 조치 · PROD 앱 micro 전환", `<p>${esc(r.sizing.evidence)}</p><p>${esc(r.sizing.followup)}</p><p>${link(r.sizing.url,"사양 변경 작업 기록")}</p>`)}
      </section>` : ""}
      <div class="report-appendix">
        ${reportDetails("측정 조건과 해석 범위", rich(r.conditions) + rich(r.limits))}
        ${reportDetails(`요구사항 확인 · ${criteriaSummary(t.criteria)}`, criteriaRow(t.criteria))}
        <p class="report-source">${link(t.doc, "전체 측정 원자료")}</p>
      </div>
    </article>`;
  }

  function productReport(s) {
    const h = s.hypothesis;
    const u = s.userData;
    const p = s.productSubmission;
    const m = { ...store.site.metrics, ...u.metrics };
    const cycles = h.cycles || [];
    const cards = [
      { value: "54%", unit: "", label: "공고 재게시 허락률", detail: "31 / 57건 · 팀 기준 30% 통과" },
      { value: s.review ? "104" : "103", unit: "명", label: "배우가 모인 알림방", detail: s.review ? "10.15 기준 · 학과 소개 67 → 103명" : "67 → 103명 · 소개 전후 약 12시간" },
    ];
    const recruits = recruitsOf(s);
    return `<article class="coach-report product-report">
      <div class="report-kicker"><span>공고를 확보하고, 배우가 찾아오는 경로를 확인했다</span>${badge(submissionStatus(s,"product"))}</div>
      <div class="product-outcomes">${cards.map((c) => `<div><p>${esc(c.label)}</p><strong>${esc(c.value)}<small>${esc(c.unit)}</small></strong><span>${esc(c.detail)}</span></div>`).join("")}</div>
      <p class="report-note">${esc(h.summary)}</p>
      <section class="report-block"><h3>가설 검증 기록</h3>
        ${cycles.map((c,i) => `<article class="hypothesis-brief"><div class="hypothesis-index">0${i+1}</div><div><h4>${esc(c.title)}</h4><p>${esc(c.summary || c.observation)}</p><p class="hypothesis-verdict">${badge(c.resultLabel || c.verdict)}<span>자신감 ${c.confidence != null ? `${esc(c.confidence)} / 10` : "미입력"}</span></p>${reportDetails("실험 기록과 근거 사진", cycleFields(c) + figures(c.figures))}</div></article>`).join("")}
      </section>
      <div id="user-data">${userReport(u,m)}</div>
      <section class="report-block" id="recruit"><h3>제품 제출 링크</h3>
        <nav class="report-links submission-links" aria-label="제품 제출 문서">${link(store.site.links.hypothesisDoc, "가설 검증 기록")}${link(store.site.links.userReport, "유저 데이터 리포트")}${link(p.landing, "서비스 · yesulin.art")}</nav>
        <p class="report-note">${esc(p.note)}</p>
        ${reportDetails("그 밖의 사용자 모집 활동", table(["활동", "관측", "다음 행동"], recruits.map((r) => [inline(r.title), cell(r.metric), cell(r.next)])))}
      </section>
    </article>`;
  }

  function userReport(u,m) {
    const r = u.report;
    if (r.compact) return compactUserReport(u,m);
    return `<div class="coach-report user-report">
      <section class="report-block"><h3>유저 데이터 · 이번 스프린트</h3>
        <p class="report-period">${esc(r.period)}</p>
        <h4>활성 사용자 정의</h4><p>${esc(r.activeDefinition)}</p>
        <h4 class="observation-label">관측값 · GA4 기본 활성 사용자</h4>
        <div class="period-observations" aria-label="GA4 기본 활성 사용자 참고 수치">${r.periods.map((p) => `<div><p>${esc(p.label)}</p><strong>${p.value}<small>명</small></strong><span>${esc(p.note)}</span></div>`).join("")}</div>
        <p class="report-note">${esc(r.observationNote)}</p>
        <p>${esc(r.interpretation)}</p>
      </section>
      <section class="report-block"><h3>핵심 지표 · ${esc(r.metricTitle)}</h3>
        <p>${esc(r.metricReason)}</p>
        <div class="metric-target"><div><span>팀에서 정한 기준</span><strong>${esc(r.target)}</strong></div><div><span>현재 측정값</span><strong>${esc(r.current)}</strong></div></div>
        <p>${esc(r.targetReason)}</p>
        <p class="metric-formula">${esc(r.formula)}</p>
        <h4>공고를 공유한 시점의 방 인원</h4>
        ${table(["공유 시점", "전체 인원", "10% 단순 환산"], r.audienceHistory.map((a) => [esc(a.period), esc(a.members), esc(a.threshold)]))}
        <p class="report-note">${esc(r.audienceNote)}</p>
        <p class="report-note">${esc(r.measurement)}</p>
        ${reportDetails("공고 조회수와 열람자 수는 어떻게 다른가", rich(r.viewNote))}
      </section>
      <section class="report-block"><h3>4주 뒤에도 공고를 다시 보는가</h3>
        <p>${esc(r.retentionExplanation)}</p>
        <div class="retention-pending"><strong>${esc(r.retentionStatus)}</strong><p>${esc(r.retentionExample)}</p></div>
        ${table(["기준 주", "4주 뒤 확인할 주", "10.15 기준"], r.retentionWindows.map((w) => [esc(w.baseline), esc(w.returnWeek), esc(w.status)]))}
        <p class="report-note">${esc(r.retentionNote)}</p>
        ${reportDetails("이전에 확인한 리텐션 · 참고 기록", rich(r.historicalNote) + (u.retentionChart ? figure(u.retentionChart,u.retentionCaption) : ""))}
      </section>
      <div class="report-appendix">${reportDetails("집계 제외와 이벤트별 원자료", field("집계 제외",m.exclusion) + field("관측 기록",u.activeData))}<p class="report-source">${link("assets/s2/active-users-wau.pdf","GA4 보고서 원문")}</p></div>
    </div>`;
  }

  function compactUserReport(u,m) {
    const r = u.report;
    if (r.resubmission) return resubmissionUserReport(u,m);
    return `<div class="coach-report user-report">
      <section class="report-block"><h3>유저 데이터</h3><p class="report-period">${esc(r.period)}</p>
        <div class="period-observations" aria-label="GA4 기본 활성 사용자 참고 수치">${r.periods.map((p) => `<div><p>${esc(p.label)}</p><strong>${p.value}<small>명</small></strong><span>${esc(p.note)}</span></div>`).join("")}</div>
        <p class="report-note">GA4 기본 활성 사용자다. 둘째 주는 4일 누적이며, 팀원·테스트 제외는 확인되지 않았다.</p>
        <div class="metric-brief"><h4>핵심 지표 · 공고별 당일 열람 도달률</h4>
          <p>알림방 인원의 <strong>10% 이상이 공유 당일 공고를 확인</strong>하는 것을 팀 기준으로 둔다. 공고가 실제 배우에게 전달되는지 보기 위해서다. 이번에는 일반 링크를 공유해 알림방 유입의 달성 여부를 판정하지 않았다.</p>
          <h4>재방문 · W+4</h4><p>4주 전 사용자가 다시 왔는지 보는 지표다. 9월 사용자 집단의 10월 재방문은 확인할 수 있으며, 해당 집계는 추가 확인이 필요하다.</p>
        </div>
        ${reportDetails("활성 사용자 정의와 집계 근거", field("활성 사용자 정의",r.activeDefinition) + field("핵심 지표",r.metricReason) + field("현재 측정",r.measurement) + field("집계 제외",m.exclusion) + field("관측 기록",u.activeData) + table(["기준 주","4주 뒤 확인할 주","10.15 기준"],r.retentionWindows.map((w) => [esc(w.baseline),esc(w.returnWeek),esc(w.status)])) + rich(r.retentionNote) + rich(r.historicalNote) + figure(u.retentionChart,u.retentionCaption))}
      </section>
    </div>`;
  }

  function resubmissionUserReport(u,m) {
    const r = u.report;
    const v = r.resubmission;
    const number = (n) => n == null ? "확인 대기" : Number(n).toLocaleString("ko-KR");
    return `<div class="coach-report user-report resubmission-report">
      <section class="report-block"><h3>유저 데이터 · 재제출 보완</h3>
        <p class="report-period">${esc(v.checkedAt)}</p>
        <p>${esc(r.activeDefinition)}</p>
        <h4 class="observation-label">관측값 · 팀원 제외 확인 전</h4>
        <div class="period-observations" aria-label="공고 상세 주간 고유 열람자">${v.periods.map((p) => `<div><p>${esc(p.label)}</p><strong>${p.users == null ? "집계 대기" : number(p.users)}${p.users == null ? "" : "<small>명</small>"}</strong><span>${esc(p.note)}</span></div>`).join("")}</div>
        <p class="report-note">${esc(v.exclusion)}</p>
      </section>
      <section class="report-block"><h3>핵심 지표 · 공고별 당일 고유 열람자</h3>
        <p>${esc(v.definitionChange)}</p>
        ${table(["공고","공유 시각","당일 고유 열람자","조회수"],v.posts.map((p) => [p.url ? link(p.url,p.title) : esc(p.title),esc(p.date),p.users == null ? "집계 대기" : `${number(p.users)}명`,p.views == null ? "집계 대기" : `${number(p.views)}회`]))}
        <p class="report-note">${esc(v.attributionNote)}</p>
      </section>
      <div class="report-appendix">${reportDetails("집계 조건과 근거",rich(v.method) + rich(v.scopeNote) + field("재방문 · W+4",r.retentionStatus) + rich(v.serverLogNote))}
        ${v.chatFollowup ? reportDetails("스프린트 이후 · 10.21 알림방 입장 추이", `<p>${esc(v.chatFollowup.note)}</p>${figure(v.chatFollowup.src,v.chatFollowup.caption)}`) : ""}
      </div>
    </div>`;
  }

  function secTech(s) {
    const t = s.tech || {};
    const keys = enabledFields();
    if (!keys.length) return empty("data/site.js의 fields에서 팀에 있는 분야를 켭니다.");
    return keys.map((key) => techBlock(key, t[key] || {}, submissionStatus(s, key))).join("");
  }

  // 완료 조건 체크리스트. 항목마다 { text, done, evidence }
  function criteriaSummary(list) {
    const done = list.filter((c) => c.done).length;
    const partial = list.filter((c) => !c.done && c.partial).length;
    return partial ? `충족 ${done} · △ 부분 충족 ${partial}` : `${done} / ${list.length}`;
  }

  function criteriaRow(list) {
    const checks = (list || []).filter((c) => filled(c.text));
    return checks.length
      ? row(
          "완료 조건",
          `<div class="field-body"><p class="mono small">${criteriaSummary(checks)}</p><ul class="checks">${checks
            .map(
              (c) =>
                `<li${c.done ? ' class="is-done"' : c.partial ? ' class="is-partial"' : ""}><span class="check" aria-label="${c.done ? "완료" : c.partial ? "부분 충족" : "미완"}">${!c.done && c.partial ? "△" : ""}</span><span>${inline(c.text)}${
                  filled(c.evidence) ? `<span class="evidence">${inline(c.evidence)}</span>` : ""
                }</span></li>`,
            )
            .join("")}</ul></div>`,
        )
      : "";
  }

  function techBlock(key, t, status) {
    if (t.report) return backendReport(t, status);
    const isFront = key === "frontend";
    const criteria = criteriaRow(t.criteria);
    const i = t.incident;
    const incident = i
      ? `<div class="incident"><h4>장애·성능 문제 1건${filled(i.title) ? ` — ${inline(i.title)}` : ""}</h4>
          ${field("언제", i.when, "발생 일시와 환경(dev·prod)")}
          ${field("무엇이", i.what, "사용자나 팀이 겪은 현상")}
          ${field("원인", i.cause, "로그·지표로 확인한 원인")}
          ${field("조치", i.action, "무엇을 바꿨나")}
          ${field("조치 뒤 지표", i.after, "조치 후 확인한 수치나 화면")}
        </div>`
      : "";
    return `<div class="tech">
      ${subhead(FIELD_NAME[key], badge(status))}
      ${row(
        isFront ? "미션" : "요구사항",
        filled(t.topic)
          ? `<div class="field-body"><p class="topic">${inline(t.topic)}</p>${filled(t.brief) ? `<p class="brief">${inline(t.brief)}</p>` : ""}</div>`
          : empty(isFront ? "완료한 미션 이름" : "수행한 요구사항 이름"),
      )}
      ${criteria}
      ${t.compact ? reportDetails("접근 방식과 배운 점", [
        field("왜 필요했나", t.why), field("무엇을 적용했나", t.applied),
        field("왜 이 방식인가", t.choice), field("적용 전후", t.observed), field("알게 된 점", t.learned),
      ].join("")) : [field("왜 필요했나", t.why), field("무엇을 적용했나", t.applied),
        field("왜 이 방식인가", t.choice), field("적용 전후", t.observed), field("알게 된 점", t.learned)].join("")}
      ${figures(t.figures)}
      ${(t.extras || []).filter((x) => filled(x.body) || filled(x.hint)).map((x) => {
        const dataTable = x.table ? table(x.table.head.map(esc), x.table.rows.map((r) => r.map(cell))) : "";
        const evidence = `<div class="prose">${rich(x.body || "")}</div>${dataTable}${filled(x.after) ? `<div class="prose">${rich(x.after)}</div>` : ""}`;
        return row(x.label, `<div class="field-body">
          ${t.compact && filled(x.summary) ? `<div class="prose">${rich(x.summary)}</div>` : ""}
          ${reportVisuals(x.visuals)}${x.comparison ? metricComparison(x.comparison) : ""}
          ${t.compact && filled(x.summary) ? reportDetails("측정 조건·해석·출처 자세히 보기", evidence) : evidence}
          ${figures(x.figures)}
        </div>`);
      }).join("")}
      ${incident}
      ${linkField(isFront ? "저장소·PR" : "문서", t.doc, isFront ? "저장소·PR 열기" : "문서 열기")}
    </div>`;
  }

  function secSoftskill(s) {
    const ss = s.softskill || {};
    if (!filled(ss)) return empty("작성 전");
    const items = (ss.items || []).filter((x) => filled(x.title) || filled(x.body));
    return `
      <p class="activity"><span class="k">활동</span>${esc(ss.activity || "—")}${badge(submissionStatus(s, "softskill"))}</p>
      ${criteriaRow(ss.criteria)}
      ${figures(ss.figures)}
      ${items
        .map((x) => `${subhead(inline(x.title || ""))}${filled(x.body) ? `<div class="prose">${rich(x.body)}</div>` : empty(x.hint || "작성 전")}`)
        .join("")}`;
  }

  function secRetro(s) {
    const r = s.retro || {};
    const { list, count, total } = backlogOf(s);
    // pendingLabel이 있으면 아직 시작하지 않은 '대기' 작업을 그 이름으로 보여 준다 (예: "스프린트 2 예정")
    const label = (st) => (st === "대기" && filled(s.pendingLabel) ? s.pendingLabel : st);

    const backlog = total
      ? `<div class="progress"><span class="mono">${STATUS_ORDER.filter((st) => st === "완료" || count[st])
          .map((st) => `${label(st)} ${count[st]}`)
          .join(" · ")}</span>${progressBar(list)}</div>
         <details class="backlog"><summary>전체 백로그 ${total}개</summary>${table(
           ["상태", "백로그", "담당", "우선순위", "예정일", "비고"],
           list.map((b) => [
             badge(label(b.status)),
             filled(b.link) ? `<a href="${esc(b.link)}" target="_blank" rel="noopener">${inline(b.title)}</a>` : inline(b.title),
             cell(b.owner),
             cell(b.priority),
             filled(b.due) ? md(toDate(b.due)) : cell(""),
             cell(b.note),
           ]),
         )}</details>`
      : empty("스프린트 백로그를 적으면 진행도가 여기에 표시됩니다.");

    // carryOver가 true면 완료하지 못한 백로그를 우선순위별로 모아 다음 스프린트 할 일로 보여 준다.
    const left = list.filter((b) => !["완료", "보류", "취소"].includes(b.status));
    const priorities = [...new Set([...PRIORITY_ORDER, ...left.map((b) => b.priority || "기타")])];
    const carry = s.carryOver
      ? priorities
          .map((p) => [p, left.filter((b) => (b.priority || "기타") === p)])
          .filter(([, group]) => group.length)
          .map(([p, group]) =>
            row(
              p,
              `<div class="field-body"><ul class="carry">${group
                .map((b) => `<li>${inline(b.title)}<span class="carry-meta">${[b.owner, label(b.status)].filter(filled).map(esc).join(" · ")}</span></li>`)
                .join("")}</ul></div>`,
            ),
          )
          .join("")
      : "";

    return `
      ${subhead("회고")}
      ${field("목표 대비 결과", r.gap, "목표한 것과 실제 결과의 차이, 그 이유")}
      ${field("배운 것", r.learned, "제품·기술·협업에서 배운 것")}
      ${field("바꿀 것", r.change, "다음 스프린트에 바꿔 볼 일하는 방식")}
      ${
        r.priorities?.rows?.length
          ? row(filled(r.priorities.label) ? r.priorities.label : "우선순위", `<div class="field-body">${table(r.priorities.head.map(esc), r.priorities.rows.map((x) => x.map(cell)))}</div>`)
          : ""
      }
      ${subhead("이번 스프린트 백로그")}
      ${backlog}
      ${subhead("다음 스프린트")}
      ${filled(s.next) ? `<div class="prose next">${rich(s.next)}</div>` : carry ? "" : empty("다음 스프린트에 할 것과 우선순위")}
      ${carry}`;
  }

  function secCoach(s) {
    const c = s.coach || {};
    const items = (list) => (list || []).filter((x) => filled(typeof x === "string" ? x : x.topic));
    const render = (list) =>
      `<ol class="asks">${list
        .map((x) =>
          typeof x === "string"
            ? `<li>${inline(x)}</li>`
            : `<li><strong>${inline(x.topic)}</strong>${filled(x.note) ? `<span class="ask-note">${esc(x.note)}</span>` : ""}${
                filled(x.detail) ? `<div class="prose">${rich(x.detail)}</div>` : ""
              }${x.table ? table(x.table.head.map(esc), x.table.rows.map((r) => r.map(cell))) : ""}${figures(x.figures)}</li>`,
        )
        .join("")}</ol>`;
    const help = items(c.help);
    const share = items(c.share);
    return `
      ${subhead("도움이 필요한 점")}
      ${help.length ? render(help) : empty("막힌 지점이나 판단이 필요한 선택. 시도한 것과 고민 중인 선택지를 함께 적으면 피드백이 구체적입니다.")}
      ${subhead("공유하고 싶은 것")}
      ${share.length ? render(share) : empty("예상과 다르게 나온 결과, 다른 팀에도 도움이 될 시행착오")}`;
  }

  /* ---------- 목차 스크롤 추적 ---------- */
  function watchToc() {
    const links = [...document.querySelectorAll(".toc a")];
    if (!links.length || !("IntersectionObserver" in window)) return;
    const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
    const mark = (a) => {
      links.forEach((l) => l.removeAttribute("aria-current"));
      a.setAttribute("aria-current", "true");
    };
    // 목차를 누르면 그 항목을 바로 표시하고, 사용자가 직접 스크롤할 때까지 자동 추적을 멈춘다.
    // 맨 아래 짧은 섹션은 제목이 위까지 올라오지 못해 자동 추적으로는 위 항목이 잡히기 때문이다.
    let pinned = false;
    links.forEach((a) => a.addEventListener("click", () => ((pinned = true), mark(a))));
    ["wheel", "touchmove", "keydown", "mousedown"].forEach((type) => window.addEventListener(type, () => (pinned = false), { passive: true }));
    // 판단 구간의 시작을 페이지 상단 여백(위쪽 바·탭 줄 높이)에 맞춘다. 더 위에서 시작하면 바로 위 섹션의 끝이 걸린다.
    const top = (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80) + 1;
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        if (pinned) return;
        const current = [...byId.keys()].find((id) => visible.has(id));
        if (current) mark(byId.get(current));
      },
      { rootMargin: `-${top}px 0px -60% 0px` },
    );
    byId.forEach((_, id) => io.observe(document.getElementById(id)));
  }

  /* ---------- 해시 링크로 들어왔을 때 위치 맞추기 ---------- */
  // 위쪽 사진이 늦게 로드되면서 목표 섹션을 아래로 밀어내므로, 사진·폰트가 로드될 때마다 다시 맞춘다.
  // 사용자가 직접 스크롤하거나 10초가 지나면 그만둔다.
  function jumpToHash() {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (!target) return;
    let stopped = false;
    const go = () => {
      if (stopped) return;
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto"; // 부드러운 스크롤 없이 바로 이동
      target.scrollIntoView({ block: "start" });
      html.style.scrollBehavior = prev;
    };
    const stop = () => (stopped = true);
    ["wheel", "touchstart", "keydown", "mousedown"].forEach((type) => window.addEventListener(type, stop, { once: true, passive: true }));
    setTimeout(stop, 10000);

    [...document.querySelectorAll("img")]
      .filter((img) => img.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)
      .forEach((img) => {
        img.loading = "eager";
        if (!img.complete) img.addEventListener("load", go, { once: true });
      });
    document.fonts?.ready.then(go);
    window.addEventListener("load", go, { once: true });
    go();
  }

  function renderReport(kind) {
    const isHypothesis = kind === "hypothesis-report";
    const title = isHypothesis ? "가설 검증 기록" : "유저 데이터 리포트";
    document.title = `${title} · ${store.site.team}`;
    const records = Object.values(store.sprints).filter((s) => isHypothesis
      ? filled(s.hypothesis?.cycles) || filled(s.hypothesis?.hypothesis)
      : filled(s.userData?.activeData) || filled(s.userData?.coreValue));
    const stat = (label, value, sub) => `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${cell(value)}</div>${sub ? `<div class="stat-sub">${sub}</div>` : ""}</div>`;
    return `<main class="wrap report-page"><header class="sheader"><p class="eyebrow">예술in · 누적 기록</p><h1>${title}</h1>
      <p class="lede">스프린트별 정의와 관측을 보존한다. 이후에 바꾼 기준으로 과거 결과를 다시 판정하지 않는다.</p>
      <p>${link(isHypothesis ? store.site.links.userReport : store.site.links.hypothesisDoc, isHypothesis ? "유저 데이터 리포트 →" : "가설 검증 기록 →")}</p>
      <nav class="report-jumps" aria-label="스프린트별 기록">${records.map((s) => `<a class="link" href="#sprint-${s.no}">스프린트 ${s.no}</a>`).join("")}</nav></header>
      ${records.map((s) => `<section class="sec" id="sprint-${s.no}"><h2>스프린트 ${s.no} · ${esc(s.start)} ~ ${esc(s.end)}</h2>
        <p>${link(`sprint.html?n=${s.no}#hypothesis`, "스프린트 페이지로 →")}</p>
        ${isHypothesis ? hypothesisRecord(s.hypothesis || {}) : userData(s.userData || {}, { ...store.site.metrics, ...s.userData?.metrics }, s.userData?.wau || [], stat)}
      </section>`).join("")}</main>${footer()}`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const app = document.getElementById("app");
    const page = document.body.dataset.page;
    const errors = store.errors.length
      ? `<div class="wrap"><div class="data-error" role="alert"><strong>데이터 파일을 읽지 못했습니다.</strong><ul>${store.errors
          .map((m) => `<li>${esc(m)}</li>`)
          .join("")}</ul></div></div>`
      : "";
    if (page === "sprint") {
      const n = Number(new URLSearchParams(location.search).get("n")) || 1;
      app.innerHTML = topbar(n) + errors + renderSprint(n);
      setupTabs();
      watchToc();
      jumpToHash();
    } else if (page === "hypothesis-report" || page === "user-report") {
      app.innerHTML = topbar(0) + errors + renderReport(page);
      jumpToHash();
    } else {
      app.innerHTML = topbar(0) + errors + renderHome();
    }
  });
})();
