"""Build aggregate Sprint 3 entry counts without publishing chat content."""
import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from datetime import datetime, time, timedelta
from pathlib import Path


def summarize(source, start, through):
    with source.open(encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    timestamps = [datetime.fromisoformat(row["Date"]) for row in rows if row["Date"]]
    if min(timestamps) > start or max(timestamps) < through:
        raise ValueError("CSV does not cover the requested observation period")
    entries, exits = Counter(), Counter()
    events = []
    for row in rows:
        if not row["Date"]:
            continue
        at = datetime.fromisoformat(row["Date"])
        delta = (1 if re.match(r"^.*?님이 들어왔습니다\.", row["Message"])
                 else -1 if re.match(r"^.*?님이 나갔습니다\.", row["Message"]) else 0)
        if delta:
            events.append((at, delta))
        if start <= at <= through:
            if re.match(r"^.*?님이 들어왔습니다\.", row["Message"]):
                entries[at.date()] += 1
            elif re.match(r"^.*?님이 나갔습니다\.", row["Message"]):
                exits[at.date()] += 1
    last_day_partial = through.time() != time(23, 59, 59)
    days = [start.date() + timedelta(days=i)
            for i in range((through.date() - start.date()).days + 1)]
    campaign_start = datetime(2026, 10, 20, 13, 38)
    campaign_end = campaign_start + timedelta(hours=72)
    campaign_events = [delta for at, delta in events if campaign_start <= at < campaign_end]
    members_before = sum(delta for at, delta in events if at < campaign_start)
    members_at_cutoff = sum(delta for at, delta in events if at <= through)
    return {
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "period": {"start": start.isoformat(), "through": through.isoformat(),
                   "timezone": "Asia/Seoul (CSV original dates)"},
        "partialLastDay": last_day_partial,
        "totalEntries": sum(entries.values()),
        "totalExits": sum(exits.values()),
        "membership": {"initial": 0, "atCutoff": members_at_cutoff,
                       "teamAccounts": 5, "excludingTeam": members_at_cutoff - 5},
        "campaign72h": {
            "startInclusive": campaign_start.isoformat(),
            "endExclusive": campaign_end.isoformat(),
            "entries": campaign_events.count(1), "exits": campaign_events.count(-1),
            "netChange": sum(campaign_events), "membersBefore": members_before,
            "membersAfter": members_before + sum(campaign_events),
            "basis": "User confirmed 10/20 date for the 13:38 promotion screenshot; not necessarily the campaign's first post",
        },
        "limitations": "Entry notices include reentries. Team accounts are removed only from cutoff membership. Acquisition attribution and unique people are not identified.",
        "daily": [{"date": day.isoformat(), "entries": entries[day],
                   "exits": exits[day],
                   "partial": last_day_partial and day == through.date()}
                  for day in days],
    }


def chart(summary):
    rows = summary["daily"]
    left, right, top, bottom = 48, 940, 32, 276
    step = (right - left) / len(rows)
    ceiling = (max(row["entries"] for row in rows) // 10 + 1) * 10
    y = lambda value: bottom - value / ceiling * (bottom - top)
    peak = max(row["entries"] for row in rows)
    start = datetime.fromisoformat(summary["period"]["start"])
    end = datetime.fromisoformat(summary["period"]["through"])
    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 350" role="img" aria-labelledby="title desc">',
        f'<title id="title">{start.month}월 {start.day}일부터 {end.month}월 {end.day}일까지 알림방 일별 입장 건수</title>',
        f'<desc id="desc">관측 기간 입장 {summary["totalEntries"]}건. 10월 20일 입장 72건. 10월 28일은 13시 15분까지의 부분 집계다. 재입장을 포함하며 현재 방 인원이나 홍보만의 효과를 뜻하지 않는다.</desc>',
        '<defs><pattern id="partial" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e8efff"/><line x1="0" y1="0" x2="0" y2="7" stroke="#a9c2ff" stroke-width="2"/></pattern></defs>',
        '<rect width="960" height="350" fill="white"/>',
        '<g font-family="Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif" font-size="14" fill="#767b87">',
        '<text x="16" y="19">건</text>',
    ]
    for tick in range(0, ceiling + 1, 10):
        yy = y(tick)
        svg.extend([f'<line x1="{left}" x2="{right}" y1="{yy:.2f}" y2="{yy:.2f}" stroke="#eceef1"/>',
                    f'<text x="32" y="{yy+4:.2f}" text-anchor="end">{tick}</text>'])
    for index, row in enumerate(rows):
        xx = left + (index + .5) * step
        yy = y(row["entries"])
        fill = "url(#partial)" if row["partial"] else "#246bfe"
        svg.append(f'<rect x="{xx-18:.2f}" y="{yy:.2f}" width="36" height="{bottom-yy:.2f}" fill="{fill}"/>')
        marker = "*" if row["partial"] else ""
        size = 18 if row["entries"] == peak else 14
        svg.append(f'<text x="{xx:.2f}" y="{yy-9:.2f}" text-anchor="middle" fill="#273b6b" font-size="{size}" font-weight="600">{row["entries"]}{marker}</text>')
        label = datetime.fromisoformat(row["date"]).strftime("%m/%d") + marker
        svg.append(f'<text x="{xx:.2f}" y="303" text-anchor="middle">{label}</text>')
    svg.extend(['<text x="48" y="334">* 10/28은 13:15까지의 부분 집계</text>', '</g></svg>'])
    return "\n".join(svg) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    result = summarize(args.source, datetime(2026, 10, 19), datetime(2026, 10, 28, 13, 15, 17))
    out = Path(__file__).resolve().parents[1] / "assets" / "s3"
    out.mkdir(parents=True, exist_ok=True)
    stem = out / "openchat-entries-20261028"
    stem.with_suffix(".json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    stem.with_suffix(".svg").write_text(chart(result))
    print(json.dumps({key: result[key] for key in ["totalEntries", "totalExits", "partialLastDay"]}))
