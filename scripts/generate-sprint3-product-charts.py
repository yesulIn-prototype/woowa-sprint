"""Render Sprint 3 charts from aggregate GA4 observations, without user records."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 's3'
DATA = json.loads((OUT / 'product-metrics-20261029.json').read_text())
FONT = 'Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif'


def canvas(title, description):
    return [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 340" role="img" aria-labelledby="title desc">',
        f'<title id="title">{title}</title><desc id="desc">{description}</desc>',
        '<rect width="960" height="340" fill="white"/>',
        f'<g font-family="{FONT}" fill="#657082" font-size="16">',
    ]


def wau():
    rows = DATA['weeklyPostingViewers']['rows']
    left, right, top, bottom = 64, 920, 46, 250
    y = lambda n: bottom - (bottom-top)*n/250
    parts = canvas('스프린트 3 공고 상세 고유 열람자', '1주차 10월 19일부터 25일까지 236명. 2주차는 10월 26일부터 28일까지 3일간 142명으로 부분 집계다. 두 값을 주간 증감률로 비교하지 않는다.')
    parts += ['<defs><pattern id="partial" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#dce7ff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#8aafff" stroke-width="3"/></pattern></defs>', '<text x="10" y="22">사용자</text>']
    for value in range(0, 251, 50):
        parts += [f'<line x1="{left}" x2="{right}" y1="{y(value)}" y2="{y(value)}" stroke="#e9edf2"/>', f'<text x="50" y="{y(value)+5}" text-anchor="end">{value}</text>']
    for row, xx in zip(rows, [290, 690]):
        n = row['totalUsers']
        fill = 'url(#partial)' if row['partial'] else '#246bfe'
        label = '10.26~10.28' if row['partial'] else '10.19~10.25'
        duration = '2주차, 3일 관측 중' if row['partial'] else '1주차, 7일'
        parts += [f'<rect x="{xx-75}" y="{y(n)}" width="150" height="{bottom-y(n)}" fill="{fill}"/>', f'<text x="{xx}" y="{y(n)-12}" text-anchor="middle" fill="#173a85" font-size="26" font-weight="650">{n}명</text>', f'<text x="{xx}" y="282" text-anchor="middle" fill="#252d3a">{label}</text>', f'<text x="{xx}" y="312" text-anchor="middle">{duration}</text>']
    return '\n'.join(parts + ['</g></svg>']) + '\n'


def retention():
    source = DATA['siteFirstTouchCohorts']
    cohorts = [c for c in source['cohorts'] if c['start'] in source['completedWeek4CohortStarts']]
    base = sum(c['size'] for c in cohorts)
    retained = [base] + [sum(c['returns'][i] for c in cohorts) for i in range(4)]
    left, right, top, bottom = 78, 900, 46, 250
    x = lambda week: left + (right-left)*week/4
    y = lambda n: bottom - (bottom-top)*n/base
    parts = canvas('사이트 첫 방문 코호트의 4주 리텐션, 참고 지표', f'8월 25일부터 9월 26일까지 첫 방문한 동일한 {base}명을 추적한다. W0 {base}명, W1 {retained[1]}명, W2 {retained[2]}명, W3 {retained[3]}명, W4 {retained[4]}명. 공고 열람 사용자 기준 리텐션과 다르다.')
    parts += ['<text x="8" y="20">복귀율</text>']
    for percent in [0, 25, 50, 75, 100]:
        yy = bottom - (bottom-top)*percent/100
        parts += [f'<line x1="{left}" x2="{right}" y1="{yy}" y2="{yy}" stroke="#e9edf2"/>', f'<text x="64" y="{yy+5}" text-anchor="end">{percent}%</text>']
    points = ' '.join(f'{x(i)},{y(n)}' for i,n in enumerate(retained))
    parts += [f'<polyline points="{points}" fill="none" stroke="#246bfe" stroke-width="3"/>']
    for i,n in enumerate(retained):
        percent = 100*n/base
        label_x = x(i) + 14 if i == 0 else x(i)
        anchor = 'start' if i == 0 else 'middle'
        parts += [f'<circle cx="{x(i)}" cy="{y(n)}" r="5" fill="#246bfe"/>', f'<text x="{label_x}" y="{y(n)-12}" text-anchor="{anchor}" fill="#173a85" font-size="18" font-weight="600">{percent:g}%</text>', f'<text x="{x(i)}" y="282" text-anchor="middle" fill="#252d3a">W{i}</text>', f'<text x="{x(i)}" y="312" text-anchor="middle">{n}/{base}명</text>']
    return '\n'.join(parts + ['</g></svg>']) + '\n'


(OUT / 'posting-wau-20261029.svg').write_text(wau())
(OUT / 'site-retention-20261029.svg').write_text(retention())
