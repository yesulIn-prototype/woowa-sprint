"""Aggregate entry notices without publishing nicknames or chat messages."""
import argparse
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, time, timedelta
from html import escape
from pathlib import Path


def summarize(source, through):
    with source.open(encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    end = datetime.combine(through, time.max)
    if datetime.fromisoformat(rows[-1]["Date"]) < end:
        raise ValueError("Source does not cover the full requested end date")

    notices = []
    for row in rows:
        match = re.match(r"^(.*?)님이 들어왔습니다\.", row["Message"])
        if match:
            notices.append((datetime.fromisoformat(row["Date"]), match.group(1)))
    if not notices or "예술" not in notices[0][1]:
        raise ValueError("Check the first operator entry before excluding it")

    # The supplied reference explicitly excludes only the operator's first entry.
    selected = [(at, name) for at, name in notices[1:] if at <= end]
    known = [(at, name) for at, name in selected if name not in ("", "알 수 없음", "(알 수 없음)")]
    daily_counts = Counter(at.date() for at, _ in selected)
    daily_names = defaultdict(set)
    for at, name in known:
        daily_names[at.date()].add(name)

    first = datetime.fromisoformat(rows[0]["Date"])
    days = [first.date() + timedelta(days=i) for i in range((through - first.date()).days + 1)]
    daily = [{"date": day.isoformat(), "entries": daily_counts[day],
              "distinctNicknames": len(daily_names[day])} for day in days]
    peak = max(daily, key=lambda day: day["entries"])
    return {
        "source": "User-provided open-chat CSV",
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "start": first.isoformat(), "endInclusive": end.replace(microsecond=0).isoformat(),
        "timezone": "CSV original dates, interpreted as Asia/Seoul",
        "operatorFirstEntryExcluded": 1,
        "unknownNicknameEntries": len(selected) - len(known),
        "totalEntries": len(selected), "distinctNicknames": len({name for _, name in known}),
        "peakDay": {"date": peak["date"], "entries": peak["entries"]},
        "limits": ["First day is a partial record.",
                   "Entries include re-entries and are not current membership.",
                   "Exact nickname text is not a stable person identifier.",
                   "Unknown nickname entries count only toward entry totals.",
                   "Entries do not measure post readership."],
        "daily": daily,
    }


def chart(summary):
    rows = summary["daily"]
    width, height = 960, 350
    left, right, top, bottom = 48, 20, 64, 306
    plot_width = width - left - right
    step = plot_width / len(rows)
    ceiling = ((max(row["entries"] for row in rows) // 10) + 1) * 10
    x = lambda i: left + (i + .5) * step
    y = lambda value: bottom - value / ceiling * (bottom - top)
    start_date = datetime.fromisoformat(summary["start"])
    peak_date = datetime.fromisoformat(summary["peakDay"]["date"])
    end_label = datetime.fromisoformat(summary["endInclusive"]).strftime("%m/%d")
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
           f'<title id="title">{start_date.month}월 {start_date.day}일부터 {end_label}까지 알림방 일별 입장 추이</title>',
           f'<desc id="desc">입장 기록 {summary["totalEntries"]}건, 구분 가능한 닉네임 {summary["distinctNicknames"]}종. 하루 최다 입장은 {peak_date.month}월 {peak_date.day}일 {summary["peakDay"]["entries"]}건이다. 닉네임 수는 고유 인원이 아니다.</desc>',
           f'<rect width="{width}" height="{height}" fill="white"/>',
           '<g font-family="Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif" font-size="14" fill="#767b87">',
           '<rect x="422" y="17" width="12" height="12" fill="#246bfe"/>',
           '<text x="442" y="28" fill="#373b44">입장 건수</text>',
           '<line x1="554" x2="578" y1="23" y2="23" stroke="#b45309" stroke-width="2"/>',
           '<text x="586" y="28" fill="#373b44">당일 구분 가능한 닉네임 수</text>',
           '<text x="10" y="49">건 / 종</text>']
    for tick in range(0, ceiling + 1, 10):
        yy = y(tick)
        svg.extend([f'<line x1="{left}" x2="{width-right}" y1="{yy}" y2="{yy}" stroke="#eceef1"/>',
                    f'<text x="32" y="{yy+4}" text-anchor="end">{tick}</text>'])
    for i, row in enumerate(rows):
        xx, yy = x(i), y(row["entries"])
        svg.append(f'<rect x="{xx-9:.2f}" y="{yy:.2f}" width="18" height="{bottom-yy:.2f}" fill="#246bfe"/>')
        if row["entries"]:
            svg.append(f'<text x="{xx:.2f}" y="{yy-9:.2f}" text-anchor="middle" fill="#273b6b" font-weight="600">{row["entries"]}</text>')
        if (i % 3 == 0 and i < len(rows) - 2) or i == len(rows) - 1:
            label = datetime.fromisoformat(row["date"]).strftime("%m/%d")
            svg.append(f'<text x="{xx:.2f}" y="333" text-anchor="middle">{escape(label)}</text>')
    points = " ".join(f'{x(i):.2f},{y(row["distinctNicknames"]):.2f}' for i, row in enumerate(rows))
    svg.append(f'<polyline points="{points}" fill="none" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/>')
    for i, row in enumerate(rows):
        svg.append(f'<circle cx="{x(i):.2f}" cy="{y(row["distinctNicknames"]):.2f}" r="2.5" fill="#b45309"/>')
    svg.append('</g></svg>')
    return "\n".join(svg) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--through", default="2026-10-18")
    args = parser.parse_args()
    result = summarize(args.source, datetime.fromisoformat(args.through).date())
    out = Path(__file__).resolve().parents[1] / "assets" / "s2"
    stem = f'openchat-entry-trend-{args.through.replace("-", "")}'
    (out / f"{stem}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    (out / f"{stem}.svg").write_text(chart(result))
    print(json.dumps({key: result[key] for key in ["totalEntries", "distinctNicknames", "peakDay", "unknownNicknameEntries"]}))
