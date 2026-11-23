# 🍼 베베숲(Bebesup) 네이버 스마트스토어 리뷰 자동화 & 실시간 AI 분석 시스템

> **CX 운영 효율 90% 개선 & 품질 VOC 실시간 모니터링 올인원 솔루션**  
> *50개 단위 무중단(in-page AJAX) 답글 등록 + GitHub 실시간 핫패치(Hot-Patch) 원격 자동 배포 지원*

---

## 🚀 빠른 시작 (초간단 1분 설치)

1. 이 저장소의 [`bebesup_extension`](./bebesup_extension) 폴더를 컴퓨터에 다운로드합니다.
2. 크롬 브라우저를 열고 주소창에 `chrome://extensions` 입력 후 엔터.
3. 우측 상단 **[개발자 모드]** ON ➔ 좌측 상단 **[압축해제된 확장 프로그램을 로드합니다.]** 클릭 후 `bebesup_extension` 폴더 선택.
4. 네이버 스마트스토어 리뷰 관리(`sell.smartstore.naver.com/#/review`) 접속 시 상단에 초록색 베베숲 패널이 바로 실행됩니다!

---

## ⚡ GitHub 핫패치(Hot-Patch) 자동 배포 시스템
- 확장 프로그램은 **처음에 1번만 설치**해 두면 끝납니다.
- 개발자가 이 저장소(`content_core.js`)에 코드를 수정하여 커밋(`git push origin main`)하면, **모든 작업자/컴퓨터의 브라우저가 화면 접속 시 1초 만에 최신 코드를 자동으로 동기화하여 실행**합니다.

---

## 👥 Antigravity(안티그래비티)로 팀 협업하기

다른 동료 개발자나 AI 에이전트와 함께 안티그래비티에서 작업하려면 아래 순서대로 진행하시면 됩니다.

1. **저장소 복제(Clone)**:
   ```bash
   git clone https://github.com/bebesupcs/bebesup-review.git
   ```
2. **Antigravity에서 폴더 열기**:
   * 복제한 `bebesup-review` 폴더를 Antigravity 작업 공간(Workspace)으로 엽니다.
   * 저장소 루트에 포함된 [`AGENTS.md`](./AGENTS.md) 규칙에 따라 안티그래비티가 프로젝트의 핵심 규칙과 아키텍처를 자동으로 인식합니다.
3. **AI 페어 프로그래밍 & 배포**:
   * 아래의 [실무 프롬프트 모음]을 활용하여 AI와 대화하며 안전하게 기능을 수정/개선합니다.
   * 기능 수정 후 GitHub `main`에 푸시하면, 핫패치를 통해 실시간으로 모든 사용자에게 배포됩니다.
   * 복잡한 작업이나 팀 단위 협업 시 `/plan` 또는 `/teamwork-preview` 명령어를 활용하세요.

---

## 💬 Antigravity(안티그래비티) 복사용 실무 프롬프트 모음

다른 팀원이나 후임자가 Antigravity에서 작업할 때, 아래 프롬프트 중 필요한 것을 **그대로 복사(`Ctrl+C`)해서 Antigravity 채팅창에 붙여넣기만(`Ctrl+V`)**하면 AI가 완벽하게 안전 규칙을 지키며 처리합니다.

---

### 1️⃣ [처음 시작할 때] 프로젝트 상태 점검 및 온보딩
```text
이 프로젝트는 베베숲 네이버 스마트스토어 리뷰 자동화 시스템이야.
저장소의 AGENTS.md와 bebesup_extension/content_core.js를 검토하고,
현재 버전과 핵심 비즈니스 안전 규칙(1~2점 제외, 3~4점 말줄임표 불만 은닉 차단, 부정어 필터링, 카테고리 분리, 핫패치 구조)을 숙지한 뒤 준비 완료 상태를 알려줘.
```

---

### 2️⃣ [오류 발생 시] 에러 디버깅 및 안전 긴급 수정
```text
스마트스토어 리뷰 관리 화면에서 오류가 발생했어:
[여기에 화면 캡처 이미지 또는 F12 콘솔 에러 메시지 붙여넣기]

AGENTS.md의 비즈니스 안전 규칙(1~2점 절대 제외, 3~4점 말줄임표 불만 은닉 차단 등)을 절대 훼손하지 않으면서,
1) 원인을 분석하고
2) bebesup_extension/content_core.js 코드를 수정한 뒤
3) node -c 문법 검사와 버전 태그(vX.X.X) 판올림, 로컬 및 git main 배포까지 원클릭으로 진행해줘.
```

---

### 3️⃣ [불만어/키워드 추가] 안전 필터 사전 보강
```text
고객 VOC 모니터링 결과 다음 불만 키워드를 자동 답글 차단 사전에 추가해야 해:
[추가할 단어들 예: 찌그러짐, 누수, 뜯어짐, 냄새역함 등]

bebesup_extension/content_core.js의 badWords 사전에 중복 없이 안전하게 추가하고,
node -c 문법 검사 후 버전을 올리고 git push origin main으로 배포해줘.
```

---

### 4️⃣ [답글 문구 변경] 카테고리별 공식 멘트 수정
```text
[물티슈 / 스킨케어 / 세제] 카테고리의 공식 답글 문구를 다음과 같이 수정하고 싶어:
"[새로 바꿀 공식 정성 답글 문구 입력]"

카테고리 분리 로직을 해치지 않고 content_core.js 내의 해당 replyMsg를 교체한 뒤,
버전 판올림과 함께 git push origin main으로 배포해줘.
```

---

### 5️⃣ [원클릭 검증 및 배포]
```text
수정한 코드가 정상인지 node -c로 문법 검사를 실행하고,
버전을 한 단계 올려서 manifest.json과 content_core.js 배지에 반영한 뒤,
D:\bebesup_extension 로컬 폴더 동기화 및 git add / commit / push origin main까지 안전하게 배포해줘.
```

---

## 📚 관련 매뉴얼 & 인수인계 문서
- 🤖 [Antigravity AI 에이전트 협업 가이드](./AGENTS.md)
- 🍼 [노션 최신 운영 매뉴얼](./NOTION_매뉴얼_최신본.md)
- 🤖 [ChatGPT / Claude 전용 인수인계 마스터 프롬프트](./GPT_클로드_인수인계_프롬프트.md)
- 🛠️ [개발자 기술 인수인계 및 오류 개선 가이드](./개발자_인수인계_및_오류개선_가이드.md)
