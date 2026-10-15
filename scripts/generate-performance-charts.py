from pathlib import Path
import base64, hashlib, json, re, sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
# Requires matplotlib and Pillow; the temporary fallback is for the bundled desktop Python.
if Path('/private/tmp/sprint2-plot-deps').exists():
    sys.path.insert(0, '/private/tmp/sprint2-plot-deps')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager, ticker
import numpy as np

root=Path(__file__).resolve().parents[1]
source_path=root/'assets/s2/load-test-report.html'
out=root/'assets/s2/performance'
source=source_path.read_text()
font_path='/System/Library/Fonts/Supplemental/AppleGothic.ttf'
font_manager.fontManager.addfont(font_path)
plt.rcParams.update({'font.family':font_manager.FontProperties(fname=font_path).get_name(), 'font.size':15, 'axes.unicode_minus':False, 'figure.facecolor':'white','axes.facecolor':'white','text.color':'#182536','axes.labelcolor':'#182536','xtick.color':'#526174','ytick.color':'#526174','axes.edgecolor':'#D9E1EB','savefig.facecolor':'white'})
BLUE='#2467CC'; BLUE2='#7A9BCC'; RED='#B44336'; INK='#182536'; MUTED='#526174'; GRID='#E8EDF3'

before=dict(run_id='20261014T013801Z-r100',target_rps=100,measurement_duration_seconds=60,p95_ms=10001,error_count=3512,started_requests=6001,label='COUNT 통합 전')
after=dict(run_id='20261014T055352Z-r100',target_rps=100,measurement_duration_seconds=60,p95_ms=58,error_count=0,started_requests=6001,label='COUNT 통합 후')
runs=[dict(run_id=rid,target_rps=rps,measurement_duration_seconds=60,p95_ms=p95,p99_ms=p99,error_count=errors,started_requests=total) for rid,rps,p95,p99,errors,total in [
('20261014T195844Z-r250',250,70,76,0,15001),('20261014T200247Z-r300',300,72,138,0,18000),('20261014T202220Z-r350',350,83,142,2,21001),('20261014T205159Z-r400',400,85,189,0,24000),('20261015T005628Z-r500',500,10001,10002,14268,30000)]]
for d in [before,after,*runs]:
    dt=datetime.strptime(d['run_id'].split('-r')[0],'%Y%m%dT%H%M%SZ').replace(tzinfo=timezone.utc)
    d['run_recorded_at_utc']=dt.isoformat()
    d['run_recorded_at_kst']=dt.astimezone(ZoneInfo('Asia/Seoul')).isoformat()
    d['run_time_meaning']='실행 ID에 포함된 시작 기록. 본 측정 구간의 실제 시작 시각으로 단정할 수 없음.'
    d['measurement_start_at_utc']=None
    d['error_rate_percent']=d['error_count']/d['started_requests']*100
assert '10,001ms' in source and '58ms' in source and '3,512 / 6,001건' in source and '0 / 6,001건' in source
for d in runs:
    assert f"{d['p95_ms']:,} / {d['p99_ms']:,}ms" in source
    assert f"{d['started_requests']:,}" in source
assert '같은 배포 29ff4d5' in source

svgs=re.findall(r'<svg\b.*?</svg>',source,re.S)
paths=re.findall(r'<path\s+d="([^"]+)"',svgs[0])
imgs=re.findall(r'<img\b[^>]*src="(data:image/[^\"]+)"',source)
img_info=[]
for value in imgs:
    raw=base64.b64decode(value.split(',',1)[1])
    from PIL import Image
    from io import BytesIO
    with Image.open(BytesIO(raw)) as im:
        img_info.append(dict(declared_mime_type=value.split(';')[0][5:],actual_format=im.format,width=im.width,height=im.height,byte_length=len(raw)))
summary={
 'experiment_intent':{'purpose':'사전 수치 목표 없이 요청량을 높이며 어디까지 버티는지 확인하는 한계 탐색','predefined_rps_target':None,'predefined_response_time_target_ms':None,'rps_400_interpretation':'400 RPS는 60초 본 측정에서 무오류로 관측한 시험 요청량이다. 사전에 정한 목표 달성값이 아니다.','authority':'사용자가 실험 의도를 직접 정정한 최신 설명을 우선하며, 첨부 HTML 원본과 수치는 변경하지 않음.'},
 'source':{'path':'assets/s2/load-test-report.html','sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),'basis':'사용자 첨부 HTML에 명시된 결과 수치만 사용. 다른 프로젝트 부하 테스트 파일 사용 안 함.'},
 'scenario':{'environment':'DEV','tool':'k6','target':'공개 공고 목록 API (HTTPS)','measurement_duration_seconds':60,'request_mix':{'first_page_percent':70,'next_page_percent':20,'include_closed_percent':10},'client_timeout_seconds':10,'public_post_count':2801,'open_post_count_250_to_500_runs':470},
 'count_comparison':{'source_section':'03 · 첫 번째 개선','runs':[before,after], 'interpretation':'동일 100 RPS · 각 60초의 독립 실행 비교. JVM·예열 이력을 완전히 통제한 A/B 결과가 아니며 단일 변경의 개선 배율로 환산하지 않음.'},
 'load_comparison':{'source_section':'05 · 부하 단계별 결과','deployment':'29ff4d5','same_jvm':True,'runs':runs,'comparability_limits':['예열 횟수·이력·점검 간격이 다름. 시간축의 연속 부하처럼 해석하지 않음.','350 RPS 타임아웃 2건의 원인은 미확정.','400 RPS 본 측정 오류 0과 예열 전체 성공은 다름. 예열 초반 타임아웃 1건이 있었고 마지막 90초 안정 확인 후 본 측정을 진행함.','400 RPS 60초 관측은 최대 처리량·지속 가능 용량·PROD 성능·모든 API 동시 처리 용량을 보장하지 않음.']},
 'cpu_source_inventory':{'embedded_svg_count':len(svgs),'series_paths':len(paths),'points_per_series':[len(re.findall(r'[ML]',p)) for p in paths],'svg_aria_label':re.search(r'aria-label="([^"]+)"',svgs[0]).group(1),'reported_app_cpu_average_percent':67.7,'reported_db_cpu_average_percent':71.3,'reported_sampling_interval_seconds':1,'reported_samples_per_host':60,'raw_json_embedded':False,'referenced_raw_filenames':['host-app.json','host-db.json'],'limitations':'SVG는 이미 그려진 좌표이며 원시 CPU JSON은 HTML에 없음. 값을 재역산하면 반올림 손실이 있음. 기존 SVG를 재사용할 수 있으나 새로운 원시 표본으로 취급하면 안 됨.','embedded_images':img_info},
 'generated_figures':[{'path':'assets/s2/performance/count-before-after.png','kind':'independent_run_comparison','y_or_x_axis':'linear','note':'반복 COUNT 통합 전후 각 60초 비교'}, {'path':'assets/s2/performance/rps-outcomes.png','kind':'independent_run_comparison','response_axis':'logarithmic','error_axis':'linear','note':'시험 요청량별 독립 실행의 p95·p99·오류율 비교. 시계열 아님.'}]
}
(out/'source-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')

def polish(ax,grid_axis='x'):
    ax.spines[['top','right']].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.tick_params(length=0,pad=10)
    ax.grid(axis=grid_axis,color=GRID,linewidth=1)
    ax.set_axisbelow(True)

# Figure 1: two metrics, shared independent categories.
fig=plt.figure(figsize=(16,8.8),dpi=160)
fig.text(.055,.925,'COUNT 통합 전후, 같은 100 RPS에서 관측한 변화',fontsize=27,weight='bold')
fig.text(.055,.872,'DEV 공고 목록 API · 각 60초 · 서로 다른 시각에 실행한 두 결과',fontsize=16,color=MUTED)
gs=fig.add_gridspec(1,2,left=.16,right=.95,bottom=.30,top=.76,wspace=.38,width_ratios=[1.1,1])
ax1=fig.add_subplot(gs[0]);ax2=fig.add_subplot(gs[1])
y=np.array([1,0]);colors=[RED,BLUE]
ax1.barh(y,[10001,58],height=.34,color=colors,zorder=3)
ax1.set_yticks(y,['통합 전','통합 후']);ax1.set_xlim(0,12600);ax1.set_ylim(-.6,1.6)
ax1.set_xticks([0,5000,10000],['0','5,000','10,000'])
ax1.set_xlabel('응답시간 (ms)',labelpad=13);ax1.set_title('p95 응답시간',loc='left',fontsize=19,pad=19,weight='bold')
for yy,v,c in zip(y,[10001,58],colors):ax1.text(v+250,yy,f'{v:,} ms',va='center',color=c,fontsize=21,weight='bold')
polish(ax1)
ax2.barh(y,[before['error_rate_percent'],0],height=.34,color=colors,zorder=3)
ax2.scatter([0],[0],s=52,color=BLUE,zorder=5,clip_on=False)
ax2.set_yticks(y,['통합 전','통합 후']);ax2.set_xlim(0,85);ax2.set_ylim(-.6,1.6)
ax2.set_xticks([0,25,50,75],['0','25','50','75']);ax2.set_xlabel('오류율 (%)',labelpad=13)
ax2.set_title('실패 요청 / 시작 요청',loc='left',fontsize=19,pad=19,weight='bold')
for yy,d,c in zip(y,[before,after],colors):
    v=d['error_rate_percent']
    ax2.text(v+2,yy+.10,f'{v:.2f}%',va='center',color=c,fontsize=21,weight='bold')
    ax2.text(v+2,yy-.15,f"{d['error_count']:,} / {d['started_requests']:,}건",va='center',color=MUTED,fontsize=14)
polish(ax2)
fig.text(.055,.185,'해석 범위',fontsize=14,color=BLUE,weight='bold')
fig.text(.055,.138,'같은 RPS·기간의 단계별 관측이다. JVM·예열 이력을 완전히 통제한 A/B 시험은 아니다.',fontsize=15,color=INK)
fig.text(.055,.099,'시간대와 예열 등 조건 차이가 있어, COUNT 통합만의 개선 배율로 환산하지 않았다.',fontsize=15,color=INK)
fig.text(.055,.042,'출처: 사용자 첨부 발표 정리 · 실행 20261014T013801Z-r100 / 20261014T055352Z-r100',fontsize=11.7,color=MUTED)
fig.savefig(out/'count-before-after.png',dpi=160)
plt.close(fig)

# Figure 2: categorical grouped bars, log response axis to retain both ranges.
fig=plt.figure(figsize=(16,11.6),dpi=160)
fig.text(.055,.94,'400 RPS 본 측정 무오류, 500 RPS에서는 실패 증가',fontsize=27,weight='bold')
fig.text(.055,.903,'각 60초의 독립 실행 비교 · 같은 배포·JVM · 실행 시각과 예열 이력은 다름',fontsize=16,color=MUTED)
gs=fig.add_gridspec(2,1,left=.10,right=.95,bottom=.32,top=.835,hspace=.38,height_ratios=[1.3,1])
a=fig.add_subplot(gs[0]);b=fig.add_subplot(gs[1])
x=np.arange(len(runs));w=.27
for ax in (a,b):
    ax.axvspan(2.55,3.45,color='#EDF4FF',zorder=0)
    ax.axvspan(3.55,4.45,color='#FBEEEC',zorder=0)
    ax.set_xlim(-.55,4.55)
    ax.set_xticks(x,[str(d['target_rps']) for d in runs])
    polish(ax,grid_axis='y')
    ax.spines['left'].set_visible(False)
a.bar(x-w/2,[d['p95_ms'] for d in runs],width=w,color=BLUE,label='p95',zorder=3)
a.bar(x+w/2,[d['p99_ms'] for d in runs],width=w,color=BLUE2,label='p99',zorder=3)
a.set_yscale('log');a.set_ylim(40,42000)
a.set_yticks([50,100,1000,10000],['50','100','1,000','10,000']);a.yaxis.set_minor_locator(ticker.NullLocator())
a.set_ylabel('응답시간 (ms) · 로그 눈금',labelpad=16)
a.set_title('응답시간 p95 / p99',loc='left',pad=20,fontsize=18,weight='bold')
a.legend(frameon=False,loc='upper left',bbox_to_anchor=(.0,1.015),ncol=2,fontsize=14)
for i,d in enumerate(runs):
    for offset,key,col in [(-w/2,'p95_ms',BLUE),(w/2,'p99_ms',BLUE2)]:
        value=d[key]
        a.text(i+offset,value*1.17,f'{value:,}',ha='center',va='bottom',fontsize=13.5,color=col,weight='bold')
a.tick_params(axis='x',labelbottom=False)
vals=[d['error_rate_percent'] for d in runs]
b.bar(x,vals,width=.40,color=[MUTED,MUTED,RED,BLUE,RED],zorder=3)
b.scatter(x[:-1],vals[:-1],color=[MUTED,MUTED,RED,BLUE],s=30,zorder=4,clip_on=False)
b.set_ylim(0,65);b.set_yticks([0,20,40,60],['0','20','40','60'])
b.set_ylabel('오류율 (%)',labelpad=20);b.set_xlabel('시험 요청량 (RPS)',labelpad=14)
b.set_title('오류율과 실패 요청 수',loc='left',pad=20,fontsize=18,weight='bold')
for i,d in enumerate(runs):
    v=d['error_rate_percent'];label=f'{v:.3f}%'
    yval=v+3
    b.text(i,yval,label,ha='center',fontsize=16,weight='bold',color=RED if d['error_count'] else BLUE if i==3 else INK)
    b.text(i,yval+7,f"{d['error_count']:,} / {d['started_requests']:,}건",ha='center',fontsize=12,color=MUTED)
fig.text(.055,.197,'350 RPS: 타임아웃 2건의 원인은 미확정. 400 RPS: 본 측정 24,000건 오류 0.',fontsize=15,color=INK)
fig.text(.055,.160,'400 RPS 예열 초반에는 타임아웃 1건이 있었다. 본 측정 무오류와 예열 전체 성공은 구분한다.',fontsize=15,color=INK)
fig.text(.055,.123,'60초 관측 결과이며, 최대 처리량·장시간 운영·PROD 성능을 보장하지 않는다.',fontsize=15,color=INK)
fig.text(.055,.074,'응답시간은 로그 눈금이다. RPS 사이의 간격은 실행 시간 간격을 뜻하지 않는다.',fontsize=12,color=MUTED)
fig.text(.055,.041,'출처: 사용자 첨부 발표 정리 · 20261014T195844Z-r250 ~ 20261015T005628Z-r500',fontsize=11.7,color=MUTED)
fig.savefig(out/'rps-outcomes.png',dpi=160)
plt.close(fig)
print(json.dumps({'generated':[str(out/'count-before-after.png'),str(out/'rps-outcomes.png'),str(out/'source-summary.json')],'cpu_inventory':summary['cpu_source_inventory']},ensure_ascii=False,indent=2))

# Figure 3: copy original SVG geometry; do not infer or manufacture host samples.
import xml.etree.ElementTree as ET
original_svg=svgs[0]
standalone_svg=original_svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
(out/'400rps-cpu-source.svg').write_text(standalone_svg+'\n')
fig=plt.figure(figsize=(16,8.8),dpi=160)
fig.text(.055,.925,'400 RPS 본 측정 · APP / DB CPU',fontsize=27,weight='bold')
fig.text(.055,.875,'60초 · 1초 호스트 표본 · 원본 HTML의 표시 시계열 재배치',fontsize=16,color=MUTED)
fig.text(.10,.777,'67.7%',fontsize=31,color=BLUE,weight='bold')
fig.text(.10,.728,'APP CPU 평균',fontsize=15,color=MUTED)
fig.text(.39,.777,'71.3%',fontsize=31,color=RED,weight='bold')
fig.text(.39,.728,'DB CPU 평균',fontsize=15,color=MUTED)
fig.text(.68,.775,'--  70% 팀 참고선',fontsize=17,color=MUTED)
fig.text(.68,.73,'보장된 안전 상한이 아님',fontsize=14,color=MUTED)
ax=fig.add_axes([.055,.255,.915,.425])
ax.set_xlim(0,940);ax.set_ylim(290,0);ax.set_axis_off()
# Native SVG coordinates are retained exactly, rather than converted back to sampled CPU values.
for el in ET.fromstring(original_svg):
    if el.tag=='line':
        ax.plot([float(el.get('x1')),float(el.get('x2'))],[float(el.get('y1')),float(el.get('y2'))],color=el.get('stroke'),linewidth=1,linestyle=(0,(5,5)) if el.get('stroke-dasharray') else '-',zorder=1)
    elif el.tag=='text':
        anchor={'end':'right','middle':'center','start':'left'}.get(el.get('text-anchor'),'left')
        ax.text(float(el.get('x')),float(el.get('y')),el.text,ha=anchor,va='baseline',fontsize=13.5,color=MUTED)
    elif el.tag=='path':
        points=[tuple(map(float,p)) for p in re.findall(r'[ML]([\d.]+),([\d.]+)',el.get('d'))]
        ax.plot([p[0] for p in points],[p[1] for p in points],color=el.get('stroke'),linewidth=2.5,zorder=3)
fig.text(.055,.183,'APP와 DB 모두 약 70% 수준을 사용했다. 다른 API를 함께 처리할 여유는 혼합 부하로 확인해야 한다.',fontsize=15,color=INK)
fig.text(.055,.137,'표시된 60개 점씩을 원본 SVG 좌표 그대로 옮겼다. 새 측정이나 CPU 원시값 재생성은 하지 않았다.',fontsize=14,color=MUTED)
fig.text(.055,.091,'평균 67.7% / 71.3%와 1초 표본 설명은 첨부 문서 기준. 70%는 팀의 여유 관리 참고선이다.',fontsize=14,color=MUTED)
fig.text(.055,.042,'출처: 사용자 첨부 발표 정리 06 · 작업 기준과 여유 관리 / 400 RPS 본 측정',fontsize=11.7,color=MUTED)
fig.savefig(out/'400rps-cpu.png',dpi=160)
plt.close(fig)
summary['execution_records']=[before,after,*runs]
summary['cpu_source_inventory']['preserved_svg_path']='assets/s2/performance/400rps-cpu-source.svg'
summary['cpu_source_inventory']['png_rendering']='원본 SVG의 좌표와 경로를 그대로 matplotlib에 옮겨 표시. CPU 데이터 값으로 역산하지 않음.'
summary['generated_figures'].append({'path':'assets/s2/performance/400rps-cpu.png','kind':'original_svg_geometry_relayout','preserved_svg':'assets/s2/performance/400rps-cpu-source.svg','note':'원본 HTML 표시 시계열을 재배치. 원시 JSON 표본으로 취급하지 않음.'})
(out/'source-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print('CPU chart generated; original SVG preserved.')
