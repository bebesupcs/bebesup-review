import asyncio
import json
import os
import re
import sys
import pandas as pd
from dotenv import load_dotenv

if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr:
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# .env 로드
load_dotenv()

# 1. 파일 경로 및 컬럼 설정
INPUT_FILE = "smartstore_reviews.xlsx"
OUTPUT_FILE = "smartstore_analyzed_result.xlsx"
RED_OUTPUT_FILE = "smartstore_emergency_red_96.xlsx"

if not os.path.exists(INPUT_FILE):
    print(f"❌ '{INPUT_FILE}' 파일이 존재하지 않습니다. 경로를 확인해주세요.")
    sys.exit(1)

print(f"📂 '{INPUT_FILE}' 로딩 중...")
df = pd.read_excel(INPUT_FILE)
TEXT_COL = "리뷰상세내용" if "리뷰상세내용" in df.columns else "내용"
RATING_COL = "구매자평점" if "구매자평점" in df.columns else ("평점" if "평점" in df.columns else "별점")

print(f"총 {len(df)}건의 리뷰 로드 완료 (텍스트 컬럼: {TEXT_COL}, 평점 컬럼: {RATING_COL})")

# 2. Gate 2 Red Line 키워드
RED_KEYWORDS = [
    "발진", "두드러기", "가려", "붉", "빨갛", "알레르기", "트러블", "피부염",
    "곰팡이", "이물", "벌레", "냄새", "악취", "썩", "변질", "침전", "소송", "고발", "신고"
]
RED_PATTERN = re.compile("|".join(RED_KEYWORDS))

# 불만 징후 트리거 키워드 (경량 필터링용)
COMPLAINT_SIGNALS = ["근데", "하지만", "아쉽", "불편", "헐거", "안 닫", "딸려", "얇", "찢", "마르", "박스", "터짐", "새네요", "개선", "줄었", "작아"]
COMPLAINT_PATTERN = re.compile("|".join(COMPLAINT_SIGNALS))

# 3. 1차 Rule-based 필터링
red_list = []
llm_queue = []
green_auto_list = []

for idx, row in df.iterrows():
    text = str(row[TEXT_COL]).strip() if pd.notnull(row[TEXT_COL]) else ""
    rating = int(row[RATING_COL]) if pd.notnull(row[RATING_COL]) else 5
    
    # Gate 1: 초단문 (5자 미만)
    if len(text) < 5:
        green_auto_list.append({
            "idx": idx, "risk_grade": "GREEN", "is_hidden_complaint": False,
            "issue_category": "해당없음", "root_cause_keyword": "단순 만족",
            "actionable_insight": None,
            "reply_draft": "고객님, 소중한 리뷰 감사합니다! 늘 만족을 드릴 수 있도록 최선을 다하겠습니다."
        })
        continue

    # Gate 2: 절대적 안전성 위반 (RED)
    if RED_PATTERN.search(text):
        red_list.append({
            "idx": idx, "risk_grade": "RED", "is_hidden_complaint": True,
            "issue_category": "안전/품질 클레임", "root_cause_keyword": "안전성 키워드 감지",
            "actionable_insight": "제조번호/Lot 즉시 추적 및 유선 CS 전담팀 긴급 연결",
            "reply_draft": None
        })
        continue

    # 경량화 필터: 5점 만점 + 불만 시그널 전무 + 30자 이하 ➔ 단순 Green
    if rating == 5 and not COMPLAINT_PATTERN.search(text) and len(text) <= 30:
        green_auto_list.append({
            "idx": idx, "risk_grade": "GREEN", "is_hidden_complaint": False,
            "issue_category": "해당없음", "root_cause_keyword": "일반 만족",
            "actionable_insight": None,
            "reply_draft": "고객님, 믿고 찾아주셔서 감사드립니다. 앞으로도 좋은 제품으로 보답하겠습니다!"
        })
        continue

    # 나머지 정밀 분석 대상 (4점 이하 전체 + 5점 중 장문 또는 불만 시그널 포함 건)
    llm_queue.append({"idx": idx, "rating": rating, "text": text})

print(f"\n📊 1차 전처리 결과:")
print(f"- 🚨 RED (긴급 클레임): {len(red_list)}건")
print(f"- 🌿 GREEN (자동 완료): {len(green_auto_list)}건")
print(f"- 🔍 LLM 정밀 분석 대상: {len(llm_queue)}건 (약 {((len(green_auto_list)+len(red_list))/len(df))*100:.1f}% 비용 절감)")

# RED 건 긴급 파일 저장
pd.DataFrame(red_list).to_excel(RED_OUTPUT_FILE, index=False)
print(f"🚨 RED 긴급 대응 건은 '{RED_OUTPUT_FILE}'로 즉시 추출되었습니다.\n")

# 4. LLM 비동기 분석 설정
SYSTEM_INSTRUCTION = """당신은 네이버 스마트스토어 전문 CX 분석 및 리뷰 응대 AI입니다.
입력된 고객 리뷰(평점, 본문)를 분석하여 반드시 아래 JSON 규격으로만 응답하십시오.

[핵심 판별 규칙]
1. 평점이 4~5점이어도 아래 [속성 불만]이 본문에 1개라도 포함되면 무조건 "YELLOW" (is_hidden_complaint: true)로 분류하십시오.
   - 패키징: 캡 헐거움, 스티커 들뜸, 2장 이상 딸려나옴, 캡 경첩 파손
   - 원단/물성: 너무 얇음, 수분감 부족/마름, 쉽게 찢어짐, 거품 발생
   - 배송/물류: 택배 박스 파손, 테이핑 불량, 찌그러짐
2. 단순 개인 취향("향이 제 취향은 아니에요", "개인적으론 핑크색 캡이 더 좋아요")은 제품 결함이 아니므로 "GREEN" (is_hidden_complaint: false)으로 분류하십시오.
3. 답변 톤앤매너:
   - YELLOW: 칭찬에 감사 ➔ 불편 사항에 대한 정중하고 구체적인 공감 ➔ 패키징/생산팀 공유 약속
   - GREEN: 따뜻하고 공감 넘치는 스마트스토어 판매자 감사 인사

[출력 JSON 규격]
{
  "risk_grade": "YELLOW" | "GREEN",
  "is_hidden_complaint": true | false,
  "issue_category": "패키징/용기" | "원단/물성" | "배송/물류" | "단순취향" | "해당없음",
  "root_cause_keyword": "핵심 키워드 1~2개",
  "actionable_insight": "생산/품질팀에 전달할 구체적 개선점 (GREEN은 null)",
  "reply_draft": "네이버 스마트스토어 등록용 답변 본문"
}"""

async def analyze_single_review(client, types, sem, item, total_count, progress_counter, checkpoint_data, checkpoint_file):
    idx = item["idx"]
    if str(idx) in checkpoint_data:
        progress_counter[0] += 1
        return checkpoint_data[str(idx)]

    async with sem:
        prompt = f"고객 평점: {item['rating']}점\n리뷰 내용: {item['text']}"
        for attempt in range(5):
            try:
                response = await client.aio.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                data = json.loads(raw_text.strip())
                
                res_obj = {
                    "idx": idx,
                    "risk_grade": data.get("risk_grade", "GREEN"),
                    "is_hidden_complaint": data.get("is_hidden_complaint", False),
                    "issue_category": data.get("issue_category", "해당없음"),
                    "root_cause_keyword": data.get("root_cause_keyword", ""),
                    "actionable_insight": data.get("actionable_insight"),
                    "reply_draft": data.get("reply_draft", "")
                }
                checkpoint_data[str(idx)] = res_obj
                progress_counter[0] += 1
                
                if progress_counter[0] % 50 == 0 or progress_counter[0] == total_count:
                    print(f"진행 상황: [{progress_counter[0]}/{total_count}] 완료 ({(progress_counter[0]/total_count)*100:.1f}%)")
                    with open(checkpoint_file, "w", encoding="utf-8") as f:
                        json.dump(checkpoint_data, f, ensure_ascii=False)
                
                return res_obj
            except Exception as e:
                err_str = str(e)
                wait_sec = 2 ** attempt
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    wait_sec = max(5, wait_sec * 3)
                    print(f"⏳ Rate Limit 감지 (대기 {wait_sec}초 후 재시도)...")
                elif attempt == 4:
                    print(f"⚠️ 분석 실패 (idx: {idx}): {e}")
                    return {
                        "idx": idx, "risk_grade": "ERROR", "is_hidden_complaint": False,
                        "issue_category": "분석실패", "root_cause_keyword": "오류",
                        "actionable_insight": str(e), "reply_draft": None
                    }
                await asyncio.sleep(wait_sec)

async def run_pipeline():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ [오류] GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        print("💡 해결 방법:")
        print("1) 프로젝트 디렉터리에 .env 파일을 만들고 다음을 입력하세요:")
        print("   GEMINI_API_KEY=your_gemini_api_key")
        print("2) 또는 PowerShell 터미널에서 다음 명령어를 실행 후 스크립트를 재실행하세요:")
        print("   $env:GEMINI_API_KEY=\"your_gemini_api_key\"")
        print("\n현재 단계에서는 RED 96건 긴급 추출 파일('smartstore_emergency_red_96.xlsx')이 이미 안전하게 저장되었습니다.")
        return

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    SEMAPHORE_LIMIT = 15  # 동시 요청 수
    sem = asyncio.Semaphore(SEMAPHORE_LIMIT)
    progress_counter = [0]
    total_count = len(llm_queue)
    
    CHECKPOINT_FILE = "smartstore_checkpoint.json"
    checkpoint_data = {}
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                checkpoint_data = json.load(f)
            print(f"🔄 기존 체크포인트 발견: {len(checkpoint_data)}건의 분석 결과를 불러왔습니다.")
        except Exception:
            checkpoint_data = {}

    print(f"🚀 LLM 비동기 분석 시작 (총 {total_count}건, 동시 요청 제한: {SEMAPHORE_LIMIT})...")
    
    tasks = [analyze_single_review(client, types, sem, item, total_count, progress_counter, checkpoint_data, CHECKPOINT_FILE) for item in llm_queue]
    llm_results = await asyncio.gather(*tasks)
    
    # 체크포인트 최종 저장
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(checkpoint_data, f, ensure_ascii=False)
    
    # 5. 전체 데이터 통합 (원본 DataFrame에 병합)
    all_classified = red_list + green_auto_list + llm_results
    analysis_df = pd.DataFrame(all_classified).set_index("idx")
    
    final_df = df.copy()
    for col in ["risk_grade", "is_hidden_complaint", "issue_category", "root_cause_keyword", "actionable_insight", "reply_draft"]:
        final_df[col] = analysis_df[col]
        
    final_df.to_excel(OUTPUT_FILE, index=False)
    print(f"\n🎉 분석 완료! 최종 결과가 '{OUTPUT_FILE}'에 저장되었습니다.")
    print(f"\n[등급별 최종 건수 요약]\n{final_df['risk_grade'].value_counts()}")

if __name__ == "__main__":
    asyncio.run(run_pipeline())
