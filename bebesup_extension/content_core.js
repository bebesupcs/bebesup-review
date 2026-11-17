// ========================================================
// 🌿 베베숲(Bebesup) 스마트스토어 전용 답글 & 실시간 분석 올인원 v9
// - [🚀 전자동 연속 실행]: 버튼 1번으로 0건 될 때까지 끝장 완주
// - [📊 실시간 AI 분석]: 엑셀 다운 없이 스마트스토어 리뷰 실시간 전수 분석 & 리포트 모달 팝업 & CSV 원클릭 저장
// - 정책/멤버십/쿠폰/서비스 불만 전수 차단
// - 스킨케어/성분 민감 키워드(아토피 등) 차단
// - 먼지/오염/위생 불만 차단
// ========================================================

(function initBebesupHelper() {
    if (document.getElementById("bebesup-helper-panel")) {
        document.getElementById("bebesup-helper-panel").remove();
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // 세션 스토리지에서 자동 반복 실행 상태 확인
    const isAutoLooping = sessionStorage.getItem("bebesup_auto_loop") === "true";
    const savedCat = sessionStorage.getItem("bebesup_target_cat") || "WIPES";
    let totalSuccess = Number(sessionStorage.getItem("bebesup_total_success") || 0);

    // 1. 상단 배치 & 우측 정렬 앵커 고정 컨트롤 바 생성
    const panel = document.createElement("div");
    panel.id = "bebesup-helper-panel";
    panel.style.cssText = `
        position: fixed;
        top: 12px;
        right: 220px;
        z-index: 99999999;
        background: #ffffff;
        border: 2px solid ${isAutoLooping ? "#d32f2f" : "#00b050"};
        padding: 5px 12px;
        border-radius: 30px;
        box-shadow: 0 4px 18px ${isAutoLooping ? "rgba(211, 47, 47, 0.4)" : "rgba(0, 176, 80, 0.3)"};
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif;
        cursor: grab;
        user-select: none;
        transition: all 0.2s ease;
    `;

    panel.innerHTML = `
        <div id="bebesup-drag-handle" style="display:flex; align-items:center; gap:5px; cursor:move;">
            <span style="font-size:15px;">${isAutoLooping ? "🔄" : "🌿"}</span>
            <span style="font-weight:bold; color:${isAutoLooping ? "#d32f2f" : "#00b050"}; font-size:12px; white-space:nowrap;">
                ${isAutoLooping ? "자동 진행 중" : "베베숲 AI"}
            </span>
            <span id="bebesup-patch-badge" style="font-size:10px; color:#666; background:#f1f5f9; padding:1px 6px; border-radius:10px; font-weight:normal;" title="GitHub 실시간 핫패치 연결됨">
                v2.7.2 (선택엔진 안정화 & 체크박스 보호)
            </span>
            <button id="bebesup-update-check-btn" title="깃허브에서 최신 패치를 즉시 확인하고 동기화합니다." style="background:none; border:none; cursor:pointer; font-size:11px; padding:0 2px;" onclick="window.__BEBESUP_FORCE_UPDATE__ && window.__BEBESUP_FORCE_UPDATE__()">🔄</button>
        </div>

        <div id="bebesup-controls" style="display:flex; align-items:center; gap:8px;">
            <select id="bebesup-target-cat" style="font-size:11px; padding:3px 7px; border-radius:15px; border:1px solid #ccc; outline:none; font-weight:bold;">
                <option value="WIPES" ${savedCat === "WIPES" ? "selected" : ""}>🌿 전라인 공통 (물티슈 등)</option>
                <option value="SKINCARE" ${savedCat === "SKINCARE" ? "selected" : ""}>💧 스킨케어</option>
                <option value="DETERGENT" ${savedCat === "DETERGENT" ? "selected" : ""}>🫧 세제</option>
            </select>

            <select id="bebesup-run-mode" style="font-size:11px; padding:3px 7px; border-radius:15px; border:1.5px solid #f57c00; color:#e65100; outline:none; font-weight:bold; background:#fff8e1;">
                <option value="AUTO_ALL" selected>🚀 전자동 연속 실행 (50개씩 끝까지 자동)</option>
                <option value="ONCE_REAL">⚡ 1회 5개만 등록 (테스트용 새로고침)</option>
                <option value="TEST">👀 눈으로 확인 모드 (등록 안 누름)</option>
            </select>

            <!-- 실행/중지 버튼 -->
            <button id="bebesup-run-btn" style="background:${isAutoLooping ? "#d32f2f" : "#00b050"}; color:white; border:none; padding:6px 14px; border-radius:20px; font-size:11px; font-weight:bold; cursor:pointer; transition:all 0.2s; white-space:nowrap;">
                ${isAutoLooping ? `⏹ 자동 중지 (총 ${totalSuccess}건 완료)` : "▶ 자동 실행 시작"}
            </button>

            <!-- 📊 실시간 AI 분석 대시보드 버튼 -->
            <button id="bebesup-analyze-btn" title="엑셀 다운 없이 현재 스마트스토어의 리뷰를 실시간으로 전수 분석합니다." style="background:linear-gradient(135deg, #1976d2, #0288d1); color:white; border:none; padding:6px 13px; border-radius:20px; font-size:11px; font-weight:bold; cursor:pointer; transition:all 0.2s; white-space:nowrap; box-shadow:0 2px 8px rgba(25,118,210,0.35);">
                📊 실시간 AI 분석
            </button>
        </div>

        <button id="bebesup-min-btn" style="background:none; border:none; color:#888; font-size:13px; cursor:pointer; padding:0 3px; font-weight:bold;" title="최소화/펼치기">─</button>
    `;

    document.body.appendChild(panel);

    // 2. 우측 기준 유지 드래그 이동 기능
    let isDragging = false;
    let startX, startY, startRight, startTop;

    panel.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "SELECT" || e.target.tagName === "BUTTON") return;
        isDragging = true;
        panel.style.cursor = "grabbing";
        const rect = panel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startRight = window.innerWidth - rect.right;
        startTop = rect.top;
        panel.style.left = "auto";
        panel.style.bottom = "auto";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const currentRight = startRight - (e.clientX - startX);
        const currentTop = startTop + (e.clientY - startY);
        panel.style.right = Math.max(10, currentRight) + "px";
        panel.style.top = Math.max(5, currentTop) + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        panel.style.cursor = "grab";
    });

    // 3. 우측 정렬 유지 최소화/확장 토글
    const minBtn = panel.querySelector("#bebesup-min-btn");
    const controls = panel.querySelector("#bebesup-controls");
    let isMinimized = false;
    minBtn.onclick = () => {
        isMinimized = !isMinimized;
        controls.style.display = isMinimized ? "none" : "flex";
        minBtn.innerText = isMinimized ? "➕" : "─";
    };

    // ========================================================
    // 📊 실시간 AI 리뷰 분석 엔진 (NLP Rule Engine & Dashboard)
    // ========================================================

    // ========================================================
    // 🔍 스마트스토어 리뷰 테이블 & 행(Row) 탐색 듀얼 엔진
    // 1순위: ag-Grid DOM & API
    // 2순위: 스마트스토어 리뷰 전용 HTML Table (상단 검색창 표와 엄격 분리)
    // ========================================================
    function findReviewTableInfo() {
        const docs = [document];
        try {
            const iframes = document.querySelectorAll("iframe, frame");
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const fDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
                    if (fDoc && !docs.includes(fDoc)) docs.push(fDoc);
                } catch(e) {}
            }
        } catch(e) {}

        for (const doc of docs) {
            // 1. ag-grid 탐색
            const agRows = Array.from(doc.querySelectorAll(".ag-center-cols-container .ag-row, .ag-row:not(.ag-header-row)"));
            if (agRows.length > 0) {
                const gridTable = doc.querySelector(".ag-root-wrapper, .ag-root, [role='grid'], .ag-theme-balham");
                return { doc, type: "AG_GRID", table: gridTable, rows: agRows };
            }

            // 2. 스마트스토어 리뷰 전용 HTML Table 탐색
            // (상단 검색창 표와 엄격히 구분: '리뷰내용', '리뷰글번호', '답글여부' 컬럼을 반드시 포함)
            const tables = Array.from(doc.querySelectorAll("table"));
            const reviewTable = tables.find(t => {
                const txt = (t.innerText || "").replace(/\s+/g, " ");
                return txt.includes("리뷰내용") || (txt.includes("리뷰글번호") && txt.includes("답글여부")) || txt.includes("리뷰도움수");
            });

            if (reviewTable) {
                const trs = Array.from(reviewTable.querySelectorAll("tbody tr")).filter(tr => {
                    return tr.querySelector("input[type='checkbox']") && (tr.innerText || "").trim().length > 0;
                });
                if (trs.length > 0) {
                    return { doc, type: "HTML_TABLE", table: reviewTable, rows: trs };
                }
            }
        }

        return { doc: document, type: "NONE", rows: [] };
    }

    function getGridApi() {
        const docs = [document];
        try {
            const iframes = document.querySelectorAll("iframe, frame");
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const fDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
                    if (fDoc && !docs.includes(fDoc)) docs.push(fDoc);
                } catch(e) {}
            }
        } catch(e) {}

        for (const doc of docs) {
            const win = doc.defaultView || window;
            const gridEls = Array.from(doc.querySelectorAll(".ag-root-wrapper, .ag-root, [role='grid'], .ag-theme-balham, div[class*='ag-']"));
            for (const el of gridEls) {
                if (el.__agComponent) {
                    const api = el.__agComponent.gridOptions?.api || el.__agComponent.gridApi;
                    if (api && typeof api.forEachNode === "function") return api;
                }
            }
            if (win.angular) {
                for (const el of [...gridEls, doc.querySelector("#content"), doc.querySelector(".seller-content"), doc.body].filter(Boolean)) {
                    try {
                        const scope = win.angular.element(el).scope();
                        const api = scope?.gridOptions?.api || scope?.gridApi || scope?.vm?.gridOptions?.api || scope?.vm?.gridApi;
                        if (api && typeof api.forEachNode === "function") return api;
                    } catch(e) {}
                }
            }
        }
        return null;
    }

    // ========================================================
    // 🔘 [답글작성] 버튼 탐색기 (테이블 인근 툴바 및 전역/iframe 탐색)
    // ========================================================
    function findBatchReplyButton(preferredDoc, tableEl) {
        const docs = [preferredDoc, document];
        try {
            const iframes = document.querySelectorAll("iframe, frame");
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const fDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
                    if (fDoc && !docs.includes(fDoc)) docs.push(fDoc);
                } catch(e) {}
            }
        } catch(e) {}

        // 1순위: 테이블 주변/부모 툴바 영역에서 답글작성 버튼 우선 탐색
        if (tableEl) {
            let container = tableEl.parentElement;
            for (let depth = 0; depth < 5 && container; depth++) {
                const candidates = Array.from(container.querySelectorAll("button, a, input[type='button'], [role='button'], div[class*='btn'], span[class*='btn'], .btn"));
                const found = candidates.find(b => {
                    if (b.closest("#bebesup-helper-panel, tbody, tr")) return false;
                    const txt = (b.innerText || b.textContent || b.value || "").replace(/\s+/g, "");
                    return txt.includes("답글작성") || (txt.includes("답글") && (txt.includes("작성") || txt.includes("등록")));
                });
                if (found) return found;
                container = container.parentElement;
            }
        }

        // 2순위: 모든 문서(iframe 포함) 전역 탐색
        for (const doc of docs) {
            if (!doc) continue;
            const candidates = Array.from(doc.querySelectorAll("button, a, input[type='button'], input[type='submit'], [role='button'], div[class*='btn'], span[class*='btn'], .btn"));
            const found = candidates.find(b => {
                if (b.closest("#bebesup-helper-panel, tbody, tr")) return false;
                const txt = (b.innerText || b.textContent || b.value || "").replace(/\s+/g, "");
                return txt.includes("답글작성") || (txt.includes("답글") && (txt.includes("작성") || txt.includes("등록")));
            });
            if (found) return found;
        }

        return null;
    }

    // ========================================================
    // 📝 [답글 작성 팝업 모달 & 텍스트 영역] 탐색기
    // - 네이버 스마트스토어 "판매자 일괄 답글 작성" 모달 구조:
    //   1행: [리뷰 글번호] -> 선택된 리뷰 번호 목록 (절대 건드리면 안 됨!)
    //   2행: [답글 내용]   -> 실제 작성할 공식 답변 내용 (여기에 정확히 입력!)
    // ========================================================
    function findReplyModalInfo(preferredDoc) {
        const docs = [preferredDoc, document];
        try {
            const iframes = document.querySelectorAll("iframe, frame");
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const fDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
                    if (fDoc && !docs.includes(fDoc)) docs.push(fDoc);
                } catch(e) {}
            }
        } catch(e) {}

        for (const doc of docs) {
            if (!doc) continue;

            // 1. "판매자 일괄 답글 작성" 모달 컨테이너 탐색
            const modals = Array.from(doc.querySelectorAll(".modal-content, div.modal, [role='dialog'], .n-layer-popup, div[class*='layer_popup'], div[class*='modal'], div[class*='popup']"));
            const targetModal = modals.find(m => {
                const txt = (m.innerText || "").replace(/\s+/g, "");
                return txt.includes("일괄답글") || txt.includes("답글작성") || txt.includes("답글내용");
            }) || modals[0];

            if (targetModal) {
                const tas = Array.from(targetModal.querySelectorAll("textarea, [contenteditable='true']")).filter(t => !t.closest("#bebesup-helper-panel"));
                
                // 모달 내 반드시 2개의 textarea가 존재함:
                // tas[0] -> 1행: [리뷰 글번호] (절대 건드리면 안 됨!)
                // tas[1] -> 2행: [답글 내용]   (여기에만 공식 답글 주입!)
                if (tas.length >= 2) {
                    const replyBox = tas[1] || tas[tas.length - 1];
                    return { modal: targetModal, textarea: replyBox, doc };
                }
                // 아직 2번째 textarea가 DOM에 생성되지 않았다면 렌더링 완료까지 대기 (1번째 창 반환 금지)
                return null;
            }

            // 2. 모달 밖 전역 탐색 시에도 2개 이상의 textarea가 잡힐 때만 2번째 것을 답글창으로 지정
            const allTas = Array.from(doc.querySelectorAll("textarea, [contenteditable='true']")).filter(t => !t.closest("#bebesup-helper-panel"));
            if (allTas.length >= 2) {
                const replyBox = allTas[1] || allTas[allTas.length - 1];
                const modal = replyBox.closest(".modal-content, div.modal, [role='dialog'], .n-layer-popup, div[class*='layer_popup'], div[class*='modal'], div[class*='popup']") || replyBox.parentElement;
                return { modal, textarea: replyBox, doc };
            }
        }
        return null;
    }

    function analyzeReviewData(rawReviews) {
        let redCount = 0;
        let yellowCount = 0;
        let greenCount = 0;
        let totalScore = 0;

        const issueCounts = {
            "캡/뚜껑 헐거움": 0,
            "수분/마름/물기부족": 0,
            "위생/먼지/오염": 0,
            "배송/박스파손": 0,
            "원단/두께/사이즈": 0,
            "피부/성분 민감": 0,
            "정책/쿠폰/가격": 0,
            "기타 불만": 0
        };

        const analyzedList = rawReviews.map((r, i) => {
            const text = String(r.text || "").trim();
            const score = Number(r.score) || 5;
            totalScore += score;

            let grade = "GREEN";
            let issueType = "단순 만족/칭찬";
            let rootCause = "제품 품질 만족 및 지속 재구매";
            let action = "정성 감사 답글 등록";

            // 1. RED 검사 (안전성/위생 중대 클레임)
            const redKeywords = ["발진", "두드러기", "가려", "붉", "빨갛", "알레르기", "트러블", "피부염", "곰팡이", "이물", "벌레", "악취", "썩", "변질", "침전", "소송", "고발", "신고"];
            const matchedRed = redKeywords.filter(k => text.includes(k));

            if (matchedRed.length > 0) {
                grade = "RED";
                redCount++;
                issueType = "안전/품질 중대 클레임";
                rootCause = `🚨 민감 안전 키워드 감지 (${matchedRed.join(", ")})`;
                action = "🚨 유선 CS 전담팀 긴급 연결 & 생산 제조번호/Lot 추적";
            } else {
                // 2. YELLOW 검사 (속성 불만 / 품질 개선 VOC)
                let isYellow = false;

                if (["반품", "새거가 아닌", "새것이 아닌", "새상품이 아닌", "새제품이 아닌", "중고", "누가 쓰던", "쓰던", "개봉", "뜯어진", "포장지", "포장 불량", "포장 상태", "포장 엉망", "포장이 엉망", "변색", "지워지지", "주의부탁", "주의 부탁", "배송 오류", "배송오류", "오배송", "누락", "배송에 이런"].some(k => text.includes(k))) {
                    issueCounts["배송/박스파손"]++;
                    issueType = "배송/포장/반품의심/변색";
                    rootCause = "반품/중고 의심 또는 외관 포장 오염/변색/배송 착오";
                    action = "🚨 물류/검수팀 출고 이력 점검 & 고객 안심 1:1 안내";
                    isYellow = true;
                } else if (["패스 하", "패스하", "패스합", "패스요", "패스 권", "패스하세요", "두꺼운 걸 찾", "두꺼운 거 찾", "사지 마", "사지마", "구매하지 마", "비추", "살 걸", "살걸", "괜히 샀", "교환하고 싶", "교환 원", "환불하고 싶", "제조일"].some(k => text.includes(k))) {
                    issueCounts["기타 불만"]++;
                    issueType = "구매만류/교환희망/후회";
                    rootCause = "고객 불만족으로 인한 타 구매자 만류 또는 교환/환불 희망";
                    action = "🟡 1:1 상담 연결 및 교환/반품 CS 지원";
                    isYellow = true;
                } else if (["재단", "실처럼", "실밥", "올 풀림", "올풀림", "마감 불량", "마감 아쉽", "깔끔하지 않", "너무 얇", "두께 얇", "두께 아쉽", "얇아", "얇네", "비쳐", "비침", "너무 작", "사이즈 작", "크기 작"].some(k => text.includes(k))) {
                    issueCounts["원단/두께/사이즈"]++;
                    issueType = "원단/재단/실밥/두께";
                    rootCause = "원단 재단/마감 품질 불량 또는 두께 기대치 미달";
                    action = "🟡 생산품질팀 원단 컷팅/실밥 공정 점검 VOC 공유";
                    isYellow = true;
                } else if (["헐거", "열려", "안닫", "뚜껑", "캡 헐", "캡이 헐", "캡 부러"].some(k => text.includes(k))) {
                    issueCounts["캡/뚜껑 헐거움"]++;
                    issueType = "캡/뚜껑 헐거움";
                    rootCause = "캡 체결 장력 불량 또는 스티커 밀봉 약함";
                    action = "🟡 캡 체결 공정 VOC 공유 & 공감 사과 답글";
                    isYellow = true;
                } else if (["마름", "말라", "물기 부족", "물기 없", "물기 마", "물기 적", "수분이 좀", "수분 아쉽", "뒤집어서"].some(k => text.includes(k))) {
                    issueCounts["수분/마름/물기부족"]++;
                    issueType = "수분/마름/물기부족";
                    rootCause = "보관 중 수분 증발 또는 원단 함습량 편차";
                    action = "🟡 생산품질팀 수분 함량 점검 VOC 공유";
                    isYellow = true;
                } else if (["먼지", "오염", "더러", "얼룩", "재고", "찝찝"].some(k => text.includes(k))) {
                    issueCounts["위생/먼지/오염"]++;
                    issueType = "위생/먼지/오염";
                    rootCause = "물류 창고 보관/적재 환경 먼지 유입";
                    action = "🟡 물류창고 포장/적재 환경 점검 요청";
                    isYellow = true;
                } else if (["터져", "찌그러", "박스 파손", "찢어", "찢김"].some(k => text.includes(k))) {
                    issueCounts["배송/박스파손"]++;
                    issueType = "배송/박스파손";
                    rootCause = "택배 운송 중 충격으로 외박스 파손";
                    action = "🟡 택배사 파손 클레임 및 완충재 보강";
                    isYellow = true;
                } else if (["아토피", "효과 없", "효과가 없", "간지", "따가", "뒤집", "안맞"].some(k => text.includes(k))) {
                    issueCounts["피부/성분 민감"]++;
                    issueType = "피부/성분 민감";
                    rootCause = "개인 체질/피부 타입별 반응 차이";
                    action = "🟡 정중한 1:1 안내 (화장품법 준수)";
                    isYellow = true;
                } else if (["횡포", "차별", "상술", "배신", "사용불가", "사용삭제", "막아버", "가격 인상", "비싸요", "돈 아깝"].some(k => text.includes(k))) {
                    issueCounts["정책/쿠폰/가격"]++;
                    issueType = "정책/쿠폰/가격";
                    rootCause = "프로모션/쿠폰/멤버십 정책 불만";
                    action = "🟡 마케팅/프로모션팀 정책 VOC 공유";
                    isYellow = true;
                } else if (score <= 3 || ["실망", "별로", "아쉽", "후회", "비추"].some(k => text.includes(k))) {
                    issueCounts["기타 불만"]++;
                    issueType = "기타 아쉬움";
                    rootCause = "일반 기대치 불만족";
                    action = "🟡 공감 답글 검토";
                    isYellow = true;
                }

                if (isYellow) {
                    grade = "YELLOW";
                    yellowCount++;
                } else {
                    grade = "GREEN";
                    greenCount++;
                }
            }

            return {
                no: i + 1,
                id: r.id || "-",
                author: r.author || "-",
                date: r.date || "-",
                prodName: r.prodName || "-",
                score,
                text,
                grade,
                issueType,
                rootCause,
                action
            };
        });

        const avgScore = rawReviews.length > 0 ? (totalScore / rawReviews.length).toFixed(2) : "0.00";
        return {
            total: rawReviews.length,
            avgScore,
            redCount,
            yellowCount,
            greenCount,
            issueCounts,
            analyzedList
        };
    }

    // 📊 대시보드 팝업 UI 생성 및 렌더링
    function showAnalysisDashboardModal(data) {
        if (document.getElementById("bebesup-analysis-modal")) {
            document.getElementById("bebesup-analysis-modal").remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "bebesup-analysis-modal";
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.65);
            z-index: 100000000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif;
            animation: fadeIn 0.2s ease;
        `;

        const greenRate = data.total > 0 ? ((data.greenCount / data.total) * 100).toFixed(1) : 0;
        const yellowRate = data.total > 0 ? ((data.yellowCount / data.total) * 100).toFixed(1) : 0;
        const redRate = data.total > 0 ? ((data.redCount / data.total) * 100).toFixed(1) : 0;

        let issueBarsHtml = "";
        for (const [k, v] of Object.entries(data.issueCounts)) {
            if (v > 0) {
                const pct = data.total > 0 ? ((v / data.total) * 100).toFixed(1) : 0;
                issueBarsHtml += `
                    <div style="margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px;">
                            <span style="font-weight:bold; color:#333;">${k}</span>
                            <span style="color:#666;">${v}건 (${pct}%)</span>
                        </div>
                        <div style="width:100%; height:7px; background:#eee; border-radius:10px; overflow:hidden;">
                            <div style="width:${pct}%; height:100%; background:#f57c00; border-radius:10px;"></div>
                        </div>
                    </div>
                `;
            }
        }
        if (!issueBarsHtml) {
            issueBarsHtml = "<div style='color:#888; font-size:12px; padding:10px 0;'>감지된 품질 불만 이슈가 없습니다. (전체 만족)</div>";
        }

        modalOverlay.innerHTML = `
            <div style="width:1000px; max-width:94vw; height:88vh; background:#ffffff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,0.3); display:flex; flex-direction:column; overflow:hidden;">
                
                <!-- 헤더 -->
                <div style="background:linear-gradient(135deg, #00b050, #00873d); padding:16px 24px; color:white; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:18px; font-weight:bold; display:flex; align-items:center; gap:8px;">
                            <span>🌿 베베숲 스마트스토어 실시간 리뷰 AI 분석 리포트</span>
                            <span style="background:rgba(255,255,255,0.25); font-size:11px; padding:2px 8px; border-radius:12px;">무다운로드 실시간 전수분석</span>
                        </div>
                        <div style="font-size:12px; opacity:0.9; margin-top:4px;">
                            총 분석 건수: <b>${data.total}건</b> | 평균 평점: <b>★ ${data.avgScore} / 5.0</b>
                        </div>
                    </div>
                    <button id="modal-close-btn" style="background:none; border:none; color:white; font-size:22px; cursor:pointer; font-weight:bold; padding:0 8px;">✕</button>
                </div>

                <!-- 상단 KPI 카드 -->
                <div style="padding:16px 24px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:grid; grid-template-columns: repeat(4, 1fr); gap:12px;">
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:10px; padding:12px; text-align:center;">
                        <div style="font-size:11px; color:#64748b; font-weight:bold;">총 수집 리뷰</div>
                        <div style="font-size:22px; font-weight:bold; color:#0f172a; margin-top:2px;">${data.total}<span style="font-size:13px; font-weight:normal;">건</span></div>
                        <div style="font-size:11px; color:#00b050; margin-top:2px;">★ 평점 ${data.avgScore}</div>
                    </div>
                    <div style="background:white; border:1.5px solid #ef4444; border-radius:10px; padding:12px; text-align:center;">
                        <div style="font-size:11px; color:#ef4444; font-weight:bold;">🚨 긴급 클레임 (RED)</div>
                        <div style="font-size:22px; font-weight:bold; color:#ef4444; margin-top:2px;">${data.redCount}<span style="font-size:13px; font-weight:normal;">건</span></div>
                        <div style="font-size:11px; color:#ef4444; margin-top:2px;">${redRate}% (유선 CS 대상)</div>
                    </div>
                    <div style="background:white; border:1.5px solid #f59e0b; border-radius:10px; padding:12px; text-align:center;">
                        <div style="font-size:11px; color:#d97706; font-weight:bold;">🟡 품질/은닉불만 (YELLOW)</div>
                        <div style="font-size:22px; font-weight:bold; color:#d97706; margin-top:2px;">${data.yellowCount}<span style="font-size:13px; font-weight:normal;">건</span></div>
                        <div style="font-size:11px; color:#d97706; margin-top:2px;">${yellowRate}% (품질팀 공유)</div>
                    </div>
                    <div style="background:white; border:1.5px solid #10b981; border-radius:10px; padding:12px; text-align:center;">
                        <div style="font-size:11px; color:#059669; font-weight:bold;">🟢 만족/칭찬 (GREEN)</div>
                        <div style="font-size:22px; font-weight:bold; color:#059669; margin-top:2px;">${data.greenCount}<span style="font-size:13px; font-weight:normal;">건</span></div>
                        <div style="font-size:11px; color:#059669; margin-top:2px;">${greenRate}% (답글 완료)</div>
                    </div>
                </div>

                <!-- 본문 영역 (좌측 이슈 통계 + 우측 상세 테이블) -->
                <div style="flex:1; display:flex; overflow:hidden;">
                    <!-- 좌측: 불만 유형별 발생 빈도 -->
                    <div style="width:280px; border-right:1px solid #e2e8f0; padding:16px; background:#ffffff; overflow-y:auto;">
                        <div style="font-size:13px; font-weight:bold; color:#1e293b; margin-bottom:12px; display:flex; align-items:center; gap:5px;">
                            <span>📈 불만 속성별 발생 빈도</span>
                        </div>
                        ${issueBarsHtml}
                    </div>

                    <!-- 우측: 필터 탭 & 상세 테이블 -->
                    <div style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                        <!-- 탭 바 -->
                        <div style="padding:10px 16px; border-bottom:1px solid #e2e8f0; display:flex; gap:8px; background:#f8fafc;">
                            <button class="tab-btn active" data-filter="ALL" style="background:#00b050; color:white; border:none; padding:5px 12px; border-radius:15px; font-size:12px; font-weight:bold; cursor:pointer;">전체 (${data.total})</button>
                            <button class="tab-btn" data-filter="RED" style="background:#f1f5f9; color:#ef4444; border:none; padding:5px 12px; border-radius:15px; font-size:12px; font-weight:bold; cursor:pointer;">🚨 긴급 RED (${data.redCount})</button>
                            <button class="tab-btn" data-filter="YELLOW" style="background:#f1f5f9; color:#d97706; border:none; padding:5px 12px; border-radius:15px; font-size:12px; font-weight:bold; cursor:pointer;">🟡 품질 VOC (${data.yellowCount})</button>
                            <button class="tab-btn" data-filter="GREEN" style="background:#f1f5f9; color:#059669; border:none; padding:5px 12px; border-radius:15px; font-size:12px; font-weight:bold; cursor:pointer;">🟢 칭찬 GREEN (${data.greenCount})</button>
                        </div>

                        <!-- 테이블 스크롤 컨테이너 -->
                        <div style="flex:1; overflow-y:auto; padding:0;">
                            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
                                <thead style="position:sticky; top:0; background:#f1f5f9; z-index:10; border-bottom:1px solid #cbd5e1;">
                                    <tr>
                                        <th style="padding:8px 12px; width:65px;">등급</th>
                                        <th style="padding:8px 8px; width:45px;">평점</th>
                                        <th style="padding:8px 10px; width:110px;">상품명</th>
                                        <th style="padding:8px 10px;">리뷰 내용</th>
                                        <th style="padding:8px 10px; width:140px;">핵심 원인 요약</th>
                                        <th style="padding:8px 10px; width:140px;">조치 사항</th>
                                    </tr>
                                </thead>
                                <tbody id="analysis-table-body">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 푸터 액션 바 -->
                <div style="padding:12px 24px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:12px; color:#64748b;">
                        💡 팁: 스마트스토어 화면 표 우측 상단에서 <b>[500개씩]</b>을 선택하시면 한 번에 500건씩 초고속 분석됩니다.
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button id="export-csv-btn" style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:bold; cursor:pointer;">
                            📥 분석 결과 엑셀(CSV) 저장
                        </button>
                        <button id="copy-summary-btn" style="background:#0288d1; color:white; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:bold; cursor:pointer;">
                            📋 요약 리포트 복사
                        </button>
                        <button id="modal-footer-close-btn" style="background:#e2e8f0; color:#334155; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:bold; cursor:pointer;">
                            닫기
                        </button>
                    </div>
                </div>

            </div>
        `;

        document.body.appendChild(modalOverlay);

        // 테이블 렌더링 함수
        const tbody = modalOverlay.querySelector("#analysis-table-body");
        function renderRows(filterGrade) {
            tbody.innerHTML = "";
            const filtered = filterGrade === "ALL" ? data.analyzedList : data.analyzedList.filter(item => item.grade === filterGrade);

            filtered.forEach(item => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid #f1f5f9";
                if (item.grade === "RED") tr.style.background = "#fef2f2";
                else if (item.grade === "YELLOW") tr.style.background = "#fffbeb";

                let badgeColor = "#10b981";
                if (item.grade === "RED") badgeColor = "#ef4444";
                if (item.grade === "YELLOW") badgeColor = "#f59e0b";

                tr.innerHTML = `
                    <td style="padding:8px 12px;">
                        <span style="background:${badgeColor}; color:white; font-size:10px; font-weight:bold; padding:2px 7px; border-radius:10px;">${item.grade}</span>
                    </td>
                    <td style="padding:8px 8px; font-weight:bold; color:#f57c00;">★ ${item.score}</td>
                    <td style="padding:8px 10px; color:#475569; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;" title="${item.prodName}">${item.prodName}</td>
                    <td style="padding:8px 10px; line-height:1.4; color:#1e293b;">${item.text}</td>
                    <td style="padding:8px 10px; color:#475569; font-size:11px;">${item.rootCause}</td>
                    <td style="padding:8px 10px; font-size:11px; font-weight:bold; color:${item.grade === "RED" ? "#ef4444" : "#475569"};">${item.action}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        renderRows("ALL");

        // 탭 전환 이벤트
        modalOverlay.querySelectorAll(".tab-btn").forEach(btn => {
            btn.onclick = () => {
                modalOverlay.querySelectorAll(".tab-btn").forEach(b => {
                    b.style.background = "#f1f5f9";
                    b.style.color = b.getAttribute("data-filter") === "RED" ? "#ef4444" : (b.getAttribute("data-filter") === "YELLOW" ? "#d97706" : (b.getAttribute("data-filter") === "GREEN" ? "#059669" : "#333"));
                });
                btn.style.background = "#00b050";
                btn.style.color = "white";
                renderRows(btn.getAttribute("data-filter"));
            };
        });

        // 닫기 이벤트
        const closeModal = () => modalOverlay.remove();
        modalOverlay.querySelector("#modal-close-btn").onclick = closeModal;
        modalOverlay.querySelector("#modal-footer-close-btn").onclick = closeModal;
        modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };

        // CSV 다운로드 이벤트 (UTF-8 BOM 탑재로 엑셀 깨짐 100% 방지)
        modalOverlay.querySelector("#export-csv-btn").onclick = () => {
            const bom = "\uFEFF";
            let csv = "No,리뷰글번호,위험등급,구매자평점,상품명,작성자,작성일,리뷰상세내용,핵심원인,추천조치사항\n";

            data.analyzedList.forEach(item => {
                const safeText = String(item.text).replace(/"/g, '""').replace(/\n/g, ' ');
                const safeProd = String(item.prodName).replace(/"/g, '""');
                csv += `${item.no},"${item.id}","${item.grade}",${item.score},"${safeProd}","${item.author}","${item.date}","${safeText}","${item.rootCause}","${item.action}"\n`;
            });

            const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `베베숲_스마트스토어_실시간_리뷰분석_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        };

        // 클립보드 요약 복사
        modalOverlay.querySelector("#copy-summary-btn").onclick = () => {
            const summaryText = `[🌿 베베숲 스마트스토어 실시간 리뷰 분석 요약]
- 분석 일시: ${new Date().toLocaleString()}
- 총 분석 건수: ${data.total}건 (평균 평점: ★ ${data.avgScore})
- 🚨 RED (안전 긴급 클레임): ${data.redCount}건 (${redRate}%)
- 🟡 YELLOW (품질 이슈 VOC): ${data.yellowCount}건 (${yellowRate}%)
- 🟢 GREEN (만족/칭찬): ${data.greenCount}건 (${greenRate}%)

[주요 품질 이슈 통계]
${Object.entries(data.issueCounts).filter(([k,v]) => v > 0).map(([k,v]) => `• ${k}: ${v}건`).join("\n")}`;

            navigator.clipboard.writeText(summaryText).then(() => {
                alert("📋 요약 리포트가 클립보드에 복사되었습니다! (사내 메신저나 잔디/슬랙에 바로 붙여넣기 하실 수 있습니다.)");
            });
        };
    }

    // ========================================================
    // 🛡️ 스마트스토어 리뷰 정밀 파서 & 엄격 필터링 엔진
    // ========================================================

    // 1. ag-Grid 컬럼 ID 동적 해석
    function resolveAgGridCols(api) {
        let colDefs = [];
        try {
            colDefs = api.getColumnDefs ? api.getColumnDefs() : (api.columnModel?.columnDefs || []);
        } catch(e) {}
        
        let scoreColId = null, prodColId = null, contentColId = null, replyColId = null;
        for (const c of colDefs) {
            const h = (c.headerName || "").replace(/\s+/g, "");
            const f = c.field || c.colId;
            if (!f) continue;
            if (!scoreColId && (h.includes("평점") || h.includes("별점"))) scoreColId = f;
            if (!prodColId && (h.includes("상품명") || h.includes("주문상품"))) prodColId = f;
            if (!contentColId && (h.includes("리뷰내용") || h.includes("내용"))) contentColId = f;
            if (!replyColId && (h.includes("답글") || h.includes("답변"))) replyColId = f;
        }
        return { scoreColId, prodColId, contentColId, replyColId };
    }

    // 2. HTML Table 컬럼 인덱스 동적 해석
    function resolveTableColIndexes(tableEl) {
        let scoreColIdx = -1, prodColIdx = -1, contentColIdx = -1, replyColIdx = -1;
        if (!tableEl) return { scoreColIdx, prodColIdx, contentColIdx, replyColIdx };
        const ths = Array.from(tableEl.querySelectorAll("thead th, thead td"));
        ths.forEach((th, idx) => {
            const h = (th.innerText || th.textContent || "").replace(/\s+/g, "");
            if (scoreColIdx === -1 && (h.includes("평점") || h.includes("별점"))) scoreColIdx = idx;
            if (prodColIdx === -1 && (h.includes("상품명") || h.includes("주문상품"))) prodColIdx = idx;
            if (contentColIdx === -1 && (h.includes("리뷰내용") || h.includes("내용"))) contentColIdx = idx;
            if (replyColIdx === -1 && (h.includes("답글") || h.includes("답변"))) replyColIdx = idx;
        });
        return { scoreColIdx, prodColIdx, contentColIdx, replyColIdx };
    }

    // 3. 평점(1~5점) 100% 정밀 추출기 (ag-Grid API, node.data, DOM 셀 전방위 파싱)
    function extractReviewScore(d, rowElOrTr, scoreColId, scoreColIdx, api, node) {
        // A. ag-Grid API로 직접 셀 값 조회
        if (api && node && scoreColId) {
            try {
                const val = api.getValue(scoreColId, node);
                const n = Number(val);
                if (!isNaN(n) && n >= 1 && n <= 5) return n;
            } catch(e) {}
        }

        // B. ag-Grid node.data 객체 내 알려진 평점 필드 검사
        if (d && typeof d === 'object') {
            const scoreFields = [
                'reviewScorePoint', 'evaluationPoint', 'reviewScore', 'starScore',
                'score', 'point', 'reviewPoint', 'rating', 'starRating', 'reviewStarPoint'
            ];
            for (const f of scoreFields) {
                if (d[f] !== undefined && d[f] !== null && d[f] !== '') {
                    const n = Number(d[f]);
                    if (!isNaN(n) && n >= 1 && n <= 5) return n;
                }
            }
        }

        // C. DOM element (rowEl 또는 tr) 셀 검사
        if (rowElOrTr) {
            let targetEl = rowElOrTr;
            if (scoreColIdx >= 0 && rowElOrTr.querySelectorAll) {
                const cells = Array.from(rowElOrTr.querySelectorAll("td, .ag-cell"));
                if (cells[scoreColIdx]) targetEl = cells[scoreColIdx];
            } else if (scoreColId && rowElOrTr.querySelector) {
                const cell = rowElOrTr.querySelector(`[col-id="${scoreColId}"]`);
                if (cell) targetEl = cell;
            }

            const cellText = (targetEl.innerText || targetEl.textContent || "").trim();

            // 1) "★★★★★ 5" 또는 "★☆☆☆☆ 1" 패턴
            const starNumMatch = cellText.match(/★+☆*\s*([1-5])/);
            if (starNumMatch) return Number(starNumMatch[1]);

            // 2) 채워진 별 '★' 개수 직접 카운트 (스마트스토어는 1점에 ★ 1개, 2점에 ★ 2개 표시)
            const starCount = (cellText.match(/★/g) || []).length;
            if (starCount >= 1 && starCount <= 5) return starCount;

            // 3) "[1-5]점" 또는 "5점 만점에 1점"
            const pointMatch = cellText.match(/([1-5])점/);
            if (pointMatch) return Number(pointMatch[1]);

            // 4) 서브 엘리먼트(.score, .rating, .point, .blind) 내부 숫자 검사
            const subEl = targetEl.querySelector?.(".score, .point, .rating, .blind, [class*='star']");
            if (subEl) {
                const subText = (subEl.innerText || subEl.textContent || "").trim();
                const subMatch = subText.match(/([1-5])/);
                if (subMatch) return Number(subMatch[1]);
            }

            // 5) 셀 내부의 단독 숫자 1~5
            if (targetEl !== rowElOrTr) {
                const digitMatch = cellText.match(/\b([1-5])\b/);
                if (digitMatch) return Number(digitMatch[1]);
            }
        }

        return 5; // 판별 불가 시 기본값
    }

    // 4. 상품명 정밀 추출기 (리뷰 본문 텍스트와 절대 섞이지 않도록 격리)
    function extractProductName(d, rowElOrTr, prodColId, prodColIdx, api, node) {
        if (api && node && prodColId) {
            try {
                const val = api.getValue(prodColId, node);
                if (val && typeof val === 'string' && val.trim()) return val.trim();
            } catch(e) {}
        }

        if (d && typeof d === 'object') {
            const prodFields = [
                'productName', 'channelProductName', 'productTitle', 'channelProductTitle',
                'channelProductDisplaySummary', 'channelItemName', 'itemName', 'itemTitle',
                'productDisplaySummary'
            ];
            for (const f of prodFields) {
                if (d[f] && typeof d[f] === 'string' && d[f].trim()) return d[f].trim();
            }
            if (d.productOrder?.productName) return String(d.productOrder.productName).trim();
            if (d.productOrder?.channelProductName) return String(d.productOrder.channelProductName).trim();
            if (d.originProduct?.productName) return String(d.originProduct.productName).trim();
        }

        if (rowElOrTr) {
            let cell = null;
            if (prodColIdx >= 0 && rowElOrTr.querySelectorAll) {
                const cells = Array.from(rowElOrTr.querySelectorAll("td, .ag-cell"));
                if (cells[prodColIdx]) cell = cells[prodColIdx];
            } else if (prodColId && rowElOrTr.querySelector) {
                cell = rowElOrTr.querySelector(`[col-id="${prodColId}"]`);
            }
            if (cell) {
                const titleAttr = cell.getAttribute("title") || cell.querySelector("[title]")?.getAttribute("title");
                if (titleAttr) return titleAttr.trim();
                const txt = (cell.innerText || cell.textContent || "").trim();
                if (txt) return txt;
            }
        }

        return "";
    }

    // 5. 리뷰 본문(내용) 정밀 추출기 (말줄임표 제거 및 온전한 원문 수집)
    function extractReviewContent(d, rowElOrTr, contentColId, contentColIdx, api, node) {
        // 1) node.data 객체에서 텍스트 수집 (최장 문자열 우선 채택)
        if (d && typeof d === 'object') {
            const candidates = [];
            const contentFields = [
                'reviewContent', 'content', 'reviewBody', 'reviewText',
                'contents', 'comment', 'detailContent', 'productReviewContent'
            ];
            for (const f of contentFields) {
                if (d[f] && typeof d[f] === 'string' && d[f].trim()) candidates.push(d[f].trim());
            }
            if (d.review && typeof d.review === 'object') {
                for (const f of contentFields) {
                    if (d.review[f] && typeof d.review[f] === 'string') candidates.push(d.review[f].trim());
                }
            }
            if (d.productOrderReview && typeof d.productOrderReview === 'object') {
                for (const f of contentFields) {
                    if (d.productOrderReview[f] && typeof d.productOrderReview[f] === 'string') candidates.push(d.productOrderReview[f].trim());
                }
            }
            if (candidates.length > 0) {
                candidates.sort((a, b) => b.length - a.length);
                return candidates[0];
            }
        }

        // 2) ag-Grid API로 셀 값 조회
        if (api && node && contentColId) {
            try {
                const val = api.getValue(contentColId, node);
                if (val && typeof val === 'string' && val.trim()) return val.trim();
            } catch(e) {}
        }

        // 3) DOM 엘리먼트 및 AngularJS Scope 탐색
        if (rowElOrTr) {
            // AngularJS scope에서 원본 row 객체 탐색
            if (window.angular) {
                try {
                    const scope = window.angular.element(rowElOrTr).scope();
                    const rowData = scope?.row || scope?.data || scope?.item || scope?.review;
                    if (rowData && typeof rowData === 'object') {
                        const contentFields = ['reviewContent', 'content', 'reviewBody', 'reviewText', 'contents', 'comment'];
                        for (const f of contentFields) {
                            if (rowData[f] && typeof rowData[f] === 'string' && rowData[f].trim().length > 15) {
                                return rowData[f].trim();
                            }
                        }
                    }
                } catch(e) {}
            }

            let cell = null;
            if (contentColIdx >= 0 && rowElOrTr.querySelectorAll) {
                const cells = Array.from(rowElOrTr.querySelectorAll("td, .ag-cell"));
                if (cells[contentColIdx]) cell = cells[contentColIdx];
            } else if (contentColId && rowElOrTr.querySelector) {
                cell = rowElOrTr.querySelector(`[col-id="${contentColId}"]`);
            }

            if (cell) {
                // DOM 속성 (title, data-content, data-original-title 등)에서 더 긴 원문이 있는지 확인
                for (const el of [cell, ...cell.querySelectorAll("*")]) {
                    for (const attr of ["title", "data-content", "data-original-title", "data-text", "data-tooltip"]) {
                        const v = el.getAttribute?.(attr);
                        if (v && v.length > (cell.innerText || "").length) return v.trim();
                    }
                }
                return (cell.innerText || cell.textContent || "").trim();
            }
            return (rowElOrTr.innerText || "").trim();
        }

        return "";
    }

    // 카테고리 판별 사전
    const skincareKeywords = [
        "로션", "크림", "수딩", "바스", "샴푸", "워시", "스킨", "선크림", "선스틱", "선쿠션", "선팩트",
        "클렌저", "오일", "파우더", "립밤", "스틱밤", "탑투토", "소프트너", "아토에코", "모이스처",
        "바디워시", "헤어워시", "수딩젤", "수딩밤", "아토"
    ];

    const detergentKeywords = [
        "세제", "유연제", "섬유유연제", "세탁세제", "주방세제", "젖병세정제", "세정제", "비누", "캡슐세제",
        "표백제", "얼룩제거제", "과탄산", "베이킹소다", "구연산", "식기세척기", "주방세척", "세탁"
    ];

    const wipesKeywords = [
        "물티슈", "시그니처", "센시티브", "프리미어", "라이트", "제로", "카밍", "에코", "네이처",
        "손입", "손입물티슈", "비데", "비데티슈", "평량", "엠보싱", "플레인", "휴대", "캡형", "리필형",
        "소프트", "클린", "홈", "레이온", "아이캔", "골드", "블루", "그린", "레드", "화이트", "보라"
    ];

    // 강력 부정어 및 컴플레인 사전 (전면 보강)
    const badWords = [
        // 🚨 1. 안전성/위생/피부 중대 이슈 (RED)
        "발진", "두드러기", "가려", "간지", "붉", "빨갛", "알레르기", "트러블", "피부염", "아토피",
        "병원", "피부과", "부작용", "따가", "따끔", "뒤집", "안맞아", "안맞네", "안 맞", "화상", "진물",
        "곰팡이", "이물질", "이물", "벌레", "악취", "냄새 심", "이상한 냄새", "썩", "변질", "침전",
        "더러", "오염", "얼룩", "재고", "먼지", "찝찝", "찜찜", "소송", "고발", "신고",

        // 🟡 2. 중고/반품의심/개봉/포장 불량/변색 (DEFECT & PACKAGING)
        "반품된", "반품된걸", "반품된거", "반품 건", "반품건", "반품 제품", "반품제품",
        "새거가 아닌", "새것이 아닌", "새상품이 아닌", "새제품이 아닌", "새거 아니", "새것 아니",
        "중고", "누가 쓰던", "쓰던 거", "쓰던거", "쓰던 것", "개봉된", "개봉 흔적", "뜯어진", "뜯겨", "재포장",
        "변색", "하얗게 변", "누렇게", "색이 변", "포장지", "포장 불량", "포장상태", "포장 상태", "포장 엉망", "포장이 엉망",
        "지워지지", "안 지워", "안지워", "주의부탁", "주의 부탁", "주의해주", "주의해 주", "배송에 이런",

        // 🟡 3. 제품 하자/캡/원단/재단/실밥/수분/제조일 (DEFECT & QUALITY)
        "헐거", "열려있", "열려서", "열려", "안닫", "안 닫", "뚜껑 헐", "뚜껑 부러", "뚜껑 깨", "뚜껑 안",
        "캡이 헐", "캡 헐", "캡 열", "캡 안", "캡 부러", "캡 깨", "캡 불량", "스티커",
        "마름", "말라있", "말라서", "말라", "마르", "물기 부족", "물기 없", "물기 마", "물기 적", "수분 부족", "수분 없", "수분이 좀", "수분 아쉽", "건조",
        "뒤집어서", "뒤집어 쓰", "뒤집어쓰",
        "터져", "터짐", "찌그러", "박스 파손", "박스파손", "박스 찢", "찢어", "찢김", "구멍", "불량", "파손",
        "새서", "새어", "흘러", "샜", "흘러나",
        "재단", "실처럼", "실밥", "올 풀림", "올풀림", "마감 불량", "마감 아쉽", "마감이 아쉽", "깔끔하지 않",
        "제조일", "제조일자", "생산일자", "제조년월", "오래된", "유통기한 임박", "유통기한",
        "너무 작", "사이즈 작", "사이즈 아쉽", "크기 작", "너무 얇", "두께 아쉽", "두께 얇", "얇아", "얇네", "비쳐", "비침",
        "거칠", "까칠", "끈적", "딸려나",

        // 🟡 4. 구매 만류 / 비추천 / 후회 / 교환·환불 희망 (RECOMMENDATION & CS)
        "패스 하", "패스하", "패스합", "패스요", "패스 권", "패스 추천", "패스하세요", "패스 하세요",
        "두꺼운 걸 찾", "두꺼운 거 찾", "두꺼운거 찾", "두꺼운걸 찾",
        "사지 마", "사지마", "사지마세요", "사지 마세요", "구매하지 마", "구매 비추", "비추", "비추천",
        "살 걸", "살걸", "살 걸 그", "살걸그", "괜히 샀", "괜히 삿", "후회", "실망", "돈 아깝", "돈아깝", "돈 버렸", "돈버렸",
        "교환하고 싶", "교환 원", "교환 요청", "교환 부탁", "환불하고 싶", "환불 원", "환불 요청", "환불 부탁",
        "뜯지만 않았다면", "개봉만 안", "뜯지만 안",

        // 🚚 5. 배송/서비스/교환/환불/극단 부정 (SERVICE & EXTREME)
        "배송 느려", "배송 늦", "배송이 느", "배송이 늦", "배송 지연", "배송지연", "택배 느", "택배 늦", "느려요", "느림", "늦게", "늦음", "늦네",
        "안옴", "안왔", "안 왔", "누락", "오배송", "배송 오류", "배송오류",
        "교환", "환불", "반품", "취소", "불친절", "항의", "어이없", "어이 없", "화나", "황당", "기분 나", "기분나", "불만",
        "최악", "쓰레기", "다시는", "다신", "사기", "사기꾼", "장사 이따위", "다신 안", "다시는 안",
        "횡포", "차별", "상술", "배신", "사악", "창렬", "사용불가", "사용삭제", "막아버", "할인율 변경", "혜택 축소", "가격 인상", "가격 비싸", "너무 비싸", "비싸요",

        // ⚠️ 6. 3점 애매/아쉬움/실망 표현 (AMBIVALENT)
        "별로", "아쉽네", "아쉽습", "아쉬워", "아쉬움", "아쉽", "그냥 그래", "그냥그래", "그닥", "그저 그", "그저그", "보통이에", "애매", "글쎄", "글쎄요",
        "재구매는 안", "재구매 안", "재구매 의사 없", "다시 안", "효과 없", "효과가 없", "효과는 없", "효과 못", "효과가 안"
    ];

    // 분석 버튼 클릭 핸들러
    const analyzeBtn = panel.querySelector("#bebesup-analyze-btn");
    analyzeBtn.onclick = async () => {
        const api = getGridApi();
        const reviewInfo = findReviewTableInfo();
        if (!api && reviewInfo.rows.length === 0) {
            return alert("⚠️ 스마트스토어 리뷰 목록 테이블을 찾지 못했습니다.\n먼저 [리뷰 관리] 화면에서 검색을 진행해 주세요.");
        }

        analyzeBtn.innerText = "⏳ 전수 분석 중...";

        const { scoreColId, prodColId, contentColId } = api ? resolveAgGridCols(api) : {};
        const { scoreColIdx, prodColIdx, contentColIdx } = reviewInfo.table ? resolveTableColIndexes(reviewInfo.table) : {};

        const reviews = [];
        if (api && typeof api.forEachNode === "function") {
            api.forEachNode(node => {
                const d = node.data || {};
                const rowEl = document.querySelector(`.ag-row[row-id="${node.id}"], .ag-row[row-index="${node.rowIndex}"]`);

                const score = extractReviewScore(d, rowEl, scoreColId, -1, api, node);
                const prodName = extractProductName(d, rowEl, prodColId, -1, api, node) || "베베숲 제품";
                const text = extractReviewContent(d, rowEl, contentColId, -1, api, node);

                reviews.push({
                    id: d.reviewId || d.reviewNo || d.id || "-",
                    author: d.writerMemberId || d.writer || d.memberId || "-",
                    date: d.reviewRegisteredDate || d.regDate || "-",
                    prodName: prodName,
                    score: score,
                    text: text
                });
            });
        } else if (reviewInfo.rows.length > 0) {
            reviewInfo.rows.forEach((tr, idx) => {
                const score = extractReviewScore(null, tr, null, scoreColIdx, null, null);
                const prodName = extractProductName(null, tr, null, prodColIdx, null, null) || "베베숲 제품";
                const text = extractReviewContent(null, tr, null, contentColIdx, null, null);

                const idMatch = text.match(/\b\d{9,11}\b/);
                const dateMatch = text.match(/\d{4}\.\d{2}\.\d{2}/);

                reviews.push({
                    id: idMatch ? idMatch[0] : `REV-${idx + 1}`,
                    author: text.match(/[a-zA-Z0-9_*]{3,12}/)?.[0] || "-",
                    date: dateMatch ? dateMatch[0] : "-",
                    prodName: prodName,
                    score: score,
                    text: text
                });
            });
        }

        if (reviews.length === 0) {
            analyzeBtn.innerText = "📊 실시간 AI 분석";
            return alert("⚠️ 현재 화면에 분석할 리뷰가 없습니다. 상단에서 [검색]을 먼저 진행해 주세요!");
        }

        const analysisResult = analyzeReviewData(reviews);
        analyzeBtn.innerText = "📊 실시간 AI 분석";
        showAnalysisDashboardModal(analysisResult);
    };

    // ========================================================
    // 🚀 자동 답글 실행 엔진
    // ========================================================
    const runBtn = panel.querySelector("#bebesup-run-btn");
    const catSelect = panel.querySelector("#bebesup-target-cat");
    const modeSelect = panel.querySelector("#bebesup-run-mode");

    // 모든 프레임 및 상위 도큐먼트 통합 수집
    function getAllDocs() {
        const docs = [];
        try { if (window.top && window.top.document && !docs.includes(window.top.document)) docs.push(window.top.document); } catch(e) {}
        try { if (window.parent && window.parent.document && !docs.includes(window.parent.document)) docs.push(window.parent.document); } catch(e) {}
        if (!docs.includes(document)) docs.push(document);
        try {
            const iframes = Array.from(document.querySelectorAll("iframe"));
            for (const ifr of iframes) {
                try {
                    if (ifr.contentDocument && !docs.includes(ifr.contentDocument)) docs.push(ifr.contentDocument);
                } catch(e) {}
            }
        } catch(e) {}
        return docs;
    }

    // 스마트스토어 상단 [검색] 버튼 탐색 함수 (새로고침 없이 다음 목록을 즉시 불러오기 위함)
    function findSearchButton(targetDoc = document) {
        const docs = getAllDocs();
        if (targetDoc && !docs.includes(targetDoc)) docs.unshift(targetDoc);

        for (const doc of docs) {
            const btns = Array.from(doc.querySelectorAll("button, a.btn, .btn, input[type='button'], input[type='submit']"));
            for (const b of btns) {
                if (b.closest && b.closest("#bebesup-helper-panel")) continue;
                const txt = (b.innerText || b.value || b.textContent || "").trim().replace(/\s+/g, "");
                if (txt === "검색" || (txt.startsWith("검색") && !txt.includes("상세") && !txt.includes("초기화") && !txt.includes("조건") && !txt.includes("결과"))) {
                    return b;
                }
            }
        }
        return null;
    }

    // 네이버 시스템 경고 팝업 탐색 및 자동 확인/닫기 ('이미 작성된 건' & '리뷰 미선택' 등)
    function dismissSystemAlertPopup() {
        for (const d of getAllDocs()) {
            const allElements = Array.from(d.querySelectorAll("div, [role='dialog'], [role='alertdialog'], section, article, p, span"));
            let alertType = null;
            const targetEl = allElements.find(el => {
                if (el.closest && el.closest("#bebesup-helper-panel")) return false;
                const txt = (el.innerText || el.textContent || "").replace(/\s+/g, "");
                if (txt.includes("이미답글을작성한리뷰") || txt.includes("추가로답글을달수없습니다") || txt.includes("다른리뷰를선택해주세요")) {
                    alertType = "ALREADY_ANSWERED";
                    return true;
                }
                if (txt.includes("리뷰를선택해주세요") || txt.includes("선택된리뷰가없습니다") || txt.includes("리뷰를선택해") || txt.includes("대상을선택해")) {
                    alertType = "NO_SELECTION";
                    return true;
                }
                return false;
            });

            if (targetEl) {
                const modal = targetEl.closest(".modal, .modal-dialog, [role='dialog'], [role='alertdialog'], div[class*='layer'], div[class*='popup'], div[class*='modal'], div[class*='alert']") || targetEl.parentElement?.parentElement || targetEl.parentElement;
                const buttons = Array.from((modal || d).querySelectorAll("button, a, input[type='button'], .btn"));
                const okBtn = buttons.find(b => {
                    if (b.closest && b.closest("#bebesup-helper-panel")) return false;
                    const bTxt = (b.innerText || b.value || b.textContent || "").trim().replace(/\s+/g, "");
                    return bTxt === "확인" || bTxt === "닫기" || b.classList.contains("close") || b.getAttribute("aria-label") === "Close";
                });

                if (okBtn) {
                    okBtn.focus();
                    okBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                    okBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
                    okBtn.click();
                } else if (modal && modal !== d.body) {
                    modal.style.display = "none";
                }

                // 배경 딤(backdrop) 제거
                const backdrops = Array.from(d.querySelectorAll(".modal-backdrop, .dimmed, div[class*='backdrop'], div[class*='overlay']"));
                for (const bg of backdrops) {
                    bg.style.display = "none";
                    bg.remove();
                }
                return alertType;
            }
        }
        return null;
    }

    const dismissAlreadyAnsweredPopup = dismissSystemAlertPopup;

    // 상단 검색조건에서 [답글여부: 미등록]이 체크되어 있는지 확인하고 강제 체크
    function ensureUnansweredFilterSelected() {
        let changed = false;
        for (const d of getAllDocs()) {
            const labels = Array.from(d.querySelectorAll("label"));
            const unregLabel = labels.find(l => {
                if (l.closest && l.closest("#bebesup-helper-panel")) return false;
                // 반드시 '답글' 또는 '답변' 관련 영역 내의 미등록 라벨만 한정
                const parentRow = l.closest("tr, .form-group, dl, div[class*='row'], div[class*='search']");
                const rowText = parentRow ? (parentRow.innerText || "") : "";
                if (!rowText.includes("답글") && !rowText.includes("답변")) return false;

                const txt = (l.innerText || l.textContent || "").trim().replace(/\s+/g, "");
                return txt === "미등록" || txt === "답글미등록" || txt === "답변미등록";
            });
            if (unregLabel) {
                const input = unregLabel.querySelector("input") || d.getElementById(unregLabel.getAttribute("for"));
                if (input && !input.checked) {
                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    changed = true;
                }
            }

            const selects = Array.from(d.querySelectorAll("select"));
            for (const sel of selects) {
                if (sel.closest && sel.closest("#bebesup-helper-panel")) continue;
                const parentRow = sel.closest("tr, .form-group, dl, div[class*='row'], div[class*='search']");
                const rowText = parentRow ? (parentRow.innerText || "") : "";
                if (!rowText.includes("답글") && !rowText.includes("답변")) continue;

                const opt = Array.from(sel.options).find(o => (o.text || "").includes("미등록"));
                if (opt && sel.value !== opt.value) {
                    sel.value = opt.value;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    changed = true;
                }
            }
        }
        return changed;
    }

    // 🛡️ 화면상의 리뷰 목록 선택 체크박스만 안전 초기화
    // (상단 검색조건 '구매자평점', '혜택지급', '전시상태' 등은 100% 절대 불변 보호)
    function clearAllSelections(api, reviewInfo) {
        if (api && typeof api.deselectAll === "function") {
            try { api.deselectAll(); } catch(e) {}
        }
        for (const d of getAllDocs()) {
            try {
                // 🛡️ 오직 ag-grid 행 또는 리뷰 테이블 tbody 내부의 체크박스만 선별 수집
                const targetCheckboxes = Array.from(d.querySelectorAll(
                    ".ag-body-viewport input[type='checkbox']:checked, " +
                    ".ag-pinned-left-cols-container input[type='checkbox']:checked, " +
                    ".ag-center-cols-container input[type='checkbox']:checked, " +
                    ".ag-row input[type='checkbox']:checked"
                ));

                if (reviewInfo && reviewInfo.table) {
                    const tbodyChks = Array.from(reviewInfo.table.querySelectorAll("tbody input[type='checkbox']:checked"));
                    targetCheckboxes.push(...tbodyChks);
                }

                for (const chk of targetCheckboxes) {
                    // 🚨 2중 절대 보호: 상단 검색창, 검색조건 폼, 테이블 헤더는 절대 건드리지 않음
                    if (chk.closest("#bebesup-helper-panel, form, .search-area, .condition, .panel-search, .n-search-box, thead, .ag-header")) continue;
                    chk.click();
                    chk.checked = false;
                    chk.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } catch(e) {}
        }
    }

    // ag-Grid DOM 행 체크박스 실시간 동기화 클릭 함수
    function selectAgGridDomRowCheckbox(doc, node) {
        if (!doc || !node) return;
        const selectors = [
            `.ag-pinned-left-cols-container .ag-row[row-id="${node.id}"]`,
            `.ag-pinned-left-cols-container .ag-row[row-index="${node.rowIndex}"]`,
            `.ag-center-cols-container .ag-row[row-id="${node.id}"]`,
            `.ag-center-cols-container .ag-row[row-index="${node.rowIndex}"]`,
            `.ag-row[row-id="${node.id}"]`,
            `.ag-row[row-index="${node.rowIndex}"]`
        ];

        for (const sel of selectors) {
            const rowEl = doc.querySelector(sel);
            if (!rowEl) continue;
            const chk = rowEl.querySelector("input[type='checkbox'], .ag-selection-checkbox, div[class*='ag-checkbox'], [role='checkbox'], span[class*='ag-icon-checkbox']");
            if (chk) {
                if (chk.tagName === "INPUT") {
                    if (!chk.checked) {
                        chk.click();
                        if (!chk.checked) chk.checked = true;
                        chk.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                } else {
                    const isChecked = chk.classList.contains("ag-checked") || chk.querySelector(".ag-icon-checkbox-checked");
                    if (!isChecked) {
                        chk.click();
                    }
                }
                break;
            }
        }
    }

    // 이번 세션에서 이미 답글을 등록했거나 오류가 발생했던 리뷰 서명(ID/지문) 메모리
    const processedSignatures = new Set();

    function getRowSignature(trOrData) {
        if (!trOrData) return "";
        if (typeof trOrData === "object" && !trOrData.tagName) {
            const id = trOrData.reviewNo || trOrData.reviewId || trOrData.id || trOrData.productOrderId || trOrData.orderNo;
            if (id) return String(id);
            return (String(trOrData.reviewContent || trOrData.content || "").slice(0, 30) + "_" + String(trOrData.writerMemberId || trOrData.writerId || ""));
        }
        const tr = trOrData;
        const rowId = tr.getAttribute("data-id") || tr.getAttribute("row-id") || tr.getAttribute("id") || "";
        if (rowId) return rowId;
        const txt = (tr.innerText || "").replace(/\s+/g, " ");
        const idMatch = txt.match(/\b\d{9,11}\b/);
        if (idMatch) return idMatch[0];
        return txt.slice(0, 60);
    }

    // 스마트스토어 화면 목록 새로고침 (in-page AJAX)
    async function refreshReviewList(targetDoc = document) {
        // 이미 작성된 건 팝업이 있다면 먼저 닫기
        dismissAlreadyAnsweredPopup();
        // [답글여부: 미등록] 필터가 풀려있으면 다시 선택
        ensureUnansweredFilterSelected();

        const sBtn = findSearchButton(targetDoc);
        if (sBtn) {
            sBtn.focus();
            sBtn.click();
            await sleep(2200);
            return true;
        }
        return false;
    }

    // 단일 배치(50개) 처리 함수
    async function executeSingleBatch(category, mode) {
        let catLabel = "전라인 공통(물티슈)";
        // 🌿 물티슈/전라인 전용 정성 공식 답글
        let replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n언제나 아기 피부에 닿는 만큼 더욱 순하고 도톰하게 정성을 담겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";

        if (category === "SKINCARE") {
            catLabel = "스킨케어";
            // 💧 스킨케어 전용 정성 공식 답글
            replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n우리 아이 피부를 촉촉하고 순하게 지켜줄 수 있도록 늘 엄선된 성분으로 보답하겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";
        } else if (category === "DETERGENT") {
            catLabel = "세제";
            // 🫧 세제/생활용품 전용 정성 공식 답글
            replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n온 가족 안심 세탁을 위해 깨끗한 세정력과 순한 안심 성분으로 보답하겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";
        }

        const api = getGridApi();
        const reviewInfo = findReviewTableInfo();

        if (!api && reviewInfo.rows.length === 0) {
            return { status: "WAIT" };
        }

        // ag-Grid 컬럼 및 HTML Table 인덱스 동적 해석
        const { scoreColId, prodColId, contentColId, replyColId } = api ? resolveAgGridCols(api) : {};
        const { scoreColIdx, prodColIdx, contentColIdx, replyColIdx } = reviewInfo.table ? resolveTableColIndexes(reviewInfo.table) : {};

        // 이전 잔여 경고 팝업 닫기 및 체크박스 전원 초기화
        dismissAlreadyAnsweredPopup();
        clearAllSelections(api, reviewInfo);

        let selectedCount = 0;
        let skippedBad = 0;
        let skippedAnswered = 0;
        let skippedCategory = 0;
        const currentBatchSigs = [];

        // 전자동 연속 실행 모드는 50개(최대 개수), 테스트용(1회등록/눈으로확인)은 5개로 제한!
        const BATCH_TARGET_LIMIT = (mode === "ONCE_REAL" || mode === "TEST") ? 5 : 50;

        if (api && typeof api.forEachNode === "function") {
            api.forEachNode(node => {
                if (selectedCount >= BATCH_TARGET_LIMIT) return;
                const d = node.data || {};
                const rowEl = document.querySelector(`.ag-row[row-id="${node.id}"], .ag-row[row-index="${node.rowIndex}"]`);

                // 1. 이번 세션에서 이미 처리된 서명이면 무조건 제외
                const sig = getRowSignature(d) || (rowEl ? getRowSignature(rowEl) : "");
                if (sig && processedSignatures.has(sig)) {
                    skippedAnswered++;
                    return;
                }

                // 2. 답글여부 사전 검증 (이미 작성된 리뷰 제외)
                if (replyColId) {
                    const colVal = String(d[replyColId] || "").trim();
                    if (colVal !== "N" && colVal !== "" && (!colVal.startsWith("N") || colVal.includes("Y") || colVal.includes("완료") || colVal.includes("등록"))) {
                        skippedAnswered++;
                        return;
                    }
                }

                if (d.replyStatus === 'Y' || d.replyYn === 'Y' || d.sellerAnswerYn === 'Y' || d.answered === true || d.hasReply === true || Number(d.commentCount) > 0 || d.replyContent) {
                    skippedAnswered++;
                    return;
                }

                const domText = rowEl ? rowEl.innerText : "";
                if (domText.includes("답글보기") || domText.includes("답글완료") || domText.includes("답글수정") || domText.includes("등록완료") || domText.includes("답변완료")) {
                    skippedAnswered++;
                    return;
                }

                // 3. 평점(1~5점) 정밀 추출 및 엄격 차단
                const score = extractReviewScore(d, rowEl, scoreColId, -1, api, node);

                // 🚨 1~2점 저평점 리뷰는 100% 무조건 제외 (절대 자동답글 금지)
                if (score <= 2) {
                    console.log(`[베베숲 1~2점 차단] 평점 ${score}점 감지되어 자동답글 제외`);
                    skippedBad++;
                    return;
                }

                // 4. 리뷰 본문 정밀 추출
                const reviewText = extractReviewContent(d, rowEl, contentColId, -1, api, node);

                // 🚨 은닉 불만 방지: 본문이 말줄임표(...)로 끝나고 잘려있는 3점 리뷰는 뒷부분 불만 위험이 있으므로 안전 제외
                const isTruncated = reviewText.endsWith("...") || reviewText.endsWith("…");
                if (isTruncated && score <= 3) {
                    console.log(`[베베숲 은닉불만 방지] 말줄임표로 잘린 3점 리뷰 안전 제외 (${reviewText})`);
                    skippedBad++;
                    return;
                }

                // 5. 부정어/결함/주의 키워드 정밀 검사
                const matchedBad = badWords.filter(w => reviewText.includes(w));

                // 🚨 3점 리뷰는 엄격 검사: 불만/애매/초단문 표현이 1개라도 있으면 100% 제외!
                if (score === 3) {
                    if (matchedBad.length > 0 || reviewText.length < 5) {
                        console.log(`[베베숲 3점 차단] 불만/애매/초단문 제외 (사유: ${matchedBad.join(', ') || '초단문'})`);
                        skippedBad++;
                        return;
                    }
                } else {
                    // 4~5점 리뷰: 불만 키워드 감지 시 즉시 제외
                    if (matchedBad.length > 0) {
                        console.log(`[베베숲 불만 차단] 키워드 감지 (${matchedBad.join(', ')})`);
                        skippedBad++;
                        return;
                    }
                }

                // 6. 상품명 정밀 추출 및 카테고리 엄격 분리
                const prodName = extractProductName(d, rowEl, prodColId, -1, api, node);
                const isSkincare = skincareKeywords.some(k => prodName.includes(k));
                const isDetergent = detergentKeywords.some(k => prodName.includes(k));

                if (category === "SKINCARE") {
                    if (!isSkincare) {
                        skippedCategory++;
                        return;
                    }
                } else if (category === "DETERGENT") {
                    if (!isDetergent) {
                        skippedCategory++;
                        return;
                    }
                } else if (category === "WIPES") {
                    // 물티슈(전라인): 스킨케어나 세제 상품은 100% 배제!
                    if (isSkincare || isDetergent) {
                        skippedCategory++;
                        return;
                    }
                }

                // 선별 통과!
                node.setSelected(true, false);
                selectAgGridDomRowCheckbox(reviewInfo.doc || document, node);
                if (sig) currentBatchSigs.push(sig);
                selectedCount++;
            });
        } else if (reviewInfo.rows.length > 0) {
            // [엔진 2] 스마트스토어 리뷰 HTML Table 직접 선택
            for (const tr of reviewInfo.rows) {
                if (selectedCount >= BATCH_TARGET_LIMIT) break;
                const sig = getRowSignature(tr);
                if (sig && processedSignatures.has(sig)) {
                    skippedAnswered++;
                    continue;
                }

                // 1. 이미 답글완료 건 제외
                const tds = Array.from(tr.querySelectorAll("td"));
                const hasAnsweredBtn = Array.from(tr.querySelectorAll("button, a")).some(btn => {
                    const bTxt = (btn.innerText || btn.textContent || "").trim();
                    return bTxt.includes("답글보기") || bTxt.includes("답글수정") || bTxt.includes("답변보기");
                });

                let isAlreadyAnswered = hasAnsweredBtn;
                if (!isAlreadyAnswered && replyColIdx >= 0 && tds[replyColIdx]) {
                    const rTxt = (tds[replyColIdx].innerText || "").trim();
                    if (rTxt !== "N" && rTxt !== "" && (!rTxt.startsWith("N") || rTxt.includes("Y") || rTxt.includes("완료"))) {
                        isAlreadyAnswered = true;
                    }
                }
                if (!isAlreadyAnswered) {
                    const rowText = (tr.innerText || "").replace(/\s+/g, " ");
                    isAlreadyAnswered = rowText.includes("답글보기") || rowText.includes("답글수정") || rowText.includes("답글완료") || rowText.includes("등록완료") || rowText.includes("답변완료");
                }

                if (isAlreadyAnswered) {
                    skippedAnswered++;
                    continue;
                }

                // 2. 평점(1~5점) 정밀 추출 및 엄격 차단
                const score = extractReviewScore(null, tr, null, scoreColIdx, null, null);

                // 🚨 1~2점 저평점 리뷰는 100% 무조건 제외 (절대 자동답글 금지)
                if (score <= 2) {
                    console.log(`[베베숲 1~2점 차단] 평점 ${score}점 감지되어 제외`);
                    skippedBad++;
                    continue;
                }

                // 3. 리뷰 본문 정밀 추출
                const reviewText = extractReviewContent(null, tr, null, contentColIdx, null, null);

                // 🚨 은닉 불만 방지: 본문이 말줄임표(...)로 끝나고 잘려있는 3점 리뷰는 뒷부분 불만 위험이 있으므로 안전 제외
                const isTruncated = reviewText.endsWith("...") || reviewText.endsWith("…");
                if (isTruncated && score <= 3) {
                    console.log(`[베베숲 은닉불만 방지] 말줄임표로 잘린 3점 리뷰 안전 제외 (${reviewText})`);
                    skippedBad++;
                    continue;
                }

                // 4. 부정어/결함/주의 키워드 정밀 검사
                const matchedBad = badWords.filter(w => reviewText.includes(w));

                // 🚨 3점 리뷰는 엄격 검사: 불만/애매/초단문 표현이 1개라도 있으면 100% 제외!
                if (score === 3) {
                    if (matchedBad.length > 0 || reviewText.length < 5) {
                        console.log(`[베베숲 3점 차단] 불만/애매/초단문 제외 (사유: ${matchedBad.join(', ') || '초단문'})`);
                        skippedBad++;
                        continue;
                    }
                } else {
                    // 4~5점 리뷰: 불만 키워드 감지 시 즉시 제외
                    if (matchedBad.length > 0) {
                        console.log(`[베베숲 불만 차단] 키워드 감지 (${matchedBad.join(', ')})`);
                        skippedBad++;
                        continue;
                    }
                }

                // 5. 상품명 정밀 추출 및 카테고리 엄격 분리
                const prodName = extractProductName(null, tr, null, prodColIdx, null, null);
                const isSkincare = skincareKeywords.some(k => prodName.includes(k));
                const isDetergent = detergentKeywords.some(k => prodName.includes(k));

                if (category === "SKINCARE") {
                    if (!isSkincare) {
                        skippedCategory++;
                        continue;
                    }
                } else if (category === "DETERGENT") {
                    if (!isDetergent) {
                        skippedCategory++;
                        continue;
                    }
                } else if (category === "WIPES") {
                    // 물티슈(전라인): 스킨케어나 세제 상품은 100% 배제!
                    if (isSkincare || isDetergent) {
                        skippedCategory++;
                        continue;
                    }
                }

                // 6. 체크박스 체크 (다양한 ag-Grid/DOM 체크박스 호환)
                const chk = tr.querySelector("input[type='checkbox'], .ag-selection-checkbox, div[class*='ag-checkbox'], [role='checkbox']");
                if (chk) {
                    if (chk.tagName === "INPUT") {
                        if (!chk.checked) {
                            chk.click();
                            if (!chk.checked) chk.checked = true;
                            chk.dispatchEvent(new Event('input', { bubbles: true }));
                            chk.dispatchEvent(new Event('change', { bubbles: true }));
                            if (sig) currentBatchSigs.push(sig);
                            selectedCount++;
                        }
                    } else {
                        // ag-checkbox wrapper
                        chk.click();
                        if (sig) currentBatchSigs.push(sig);
                        selectedCount++;
                    }
                }
            }
        }

        if (selectedCount === 0) {
            return { status: "EMPTY", skippedAnswered, skippedBad, skippedCategory };
        }

        // AngularJS scope 동기화 (선택 변경을 네이버 컨트롤러에 즉시 전파)
        try {
            const win = (reviewInfo.doc || document).defaultView || window;
            if (win.angular) {
                const rootEl = (reviewInfo.doc || document).querySelector(".ag-root-wrapper, .ag-root, [role='grid'], table, #content");
                if (rootEl) {
                    const scope = win.angular.element(rootEl).scope();
                    if (scope && !scope.$$phase) scope.$apply();
                }
            }
        } catch(e) {}

        // 브라우저 DOM 렌더링 및 체크박스 이벤트 루프 처리 대기 (인식 실패 100% 방지)
        await sleep(400);

        runBtn.innerText = `⏳ [${catLabel}] ${selectedCount}개 작성 중...`;

        // 1. 답글작성 버튼 탐색 (테이블 인근 툴바 및 전역/iframe)
        const replyBtn = findBatchReplyButton(reviewInfo.doc, reviewInfo.table);
        if (!replyBtn) return { status: "NO_BUTTON" };

        replyBtn.focus();
        replyBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        replyBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        replyBtn.click();

        return new Promise((resolve) => {
            let checkAttempts = 0;
            const fillInterval = setInterval(async () => {
                checkAttempts++;

                // 스마트스토어의 시스템 경고 팝업 감지 시 자동 닫기 및 처리
                const alertType = dismissSystemAlertPopup();
                if (alertType === "ALREADY_ANSWERED") {
                    clearInterval(fillInterval);
                    clearAllSelections(api, reviewInfo);
                    for (const s of currentBatchSigs) { if (s) processedSignatures.add(s); }
                    return resolve({ status: "ALREADY_ANSWERED_WARN" });
                } else if (alertType === "NO_SELECTION") {
                    clearInterval(fillInterval);
                    return resolve({ status: "NO_SELECTION_ALERT" });
                }

                const modalInfo = findReplyModalInfo(reviewInfo.doc);
                if (modalInfo && modalInfo.textarea) {
                    clearInterval(fillInterval);
                    const replyBox = modalInfo.textarea;
                    const modal = modalInfo.modal;
                    const targetDoc = modalInfo.doc;

                    replyBox.focus();

                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                    if (nativeSetter) {
                        nativeSetter.call(replyBox, replyMsg);
                    } else {
                        replyBox.value = replyMsg;
                    }
                    try {
                        document.execCommand('selectAll', false, null);
                        document.execCommand('insertText', false, replyMsg);
                    } catch(e) {}
                    if (replyBox.value !== replyMsg) {
                        replyBox.value = replyMsg;
                    }

                    replyBox.dispatchEvent(new Event('input', { bubbles: true }));
                    replyBox.dispatchEvent(new Event('change', { bubbles: true }));
                    replyBox.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ', code: 'Space' }));

                    if (mode === "TEST") {
                        runBtn.innerText = `✅ [${catLabel}] ${selectedCount}개 확인완료`;
                        setTimeout(() => { runBtn.innerText = "▶ 자동 실행 시작"; }, 3000);
                        return resolve({ status: "TEST_DONE", count: selectedCount });
                    }

                    await sleep(800);
                    const submitCandidates = Array.from(modal.querySelectorAll("button, a, input[type='button'], input[type='submit'], [role='button'], .btn"));
                    const submitBtn = submitCandidates.find(b => {
                        const txt = (b.innerText || b.value || b.textContent || "").trim().replace(/\s+/g, "");
                        return txt === "등록" || txt === "저장" || txt === "답글등록" || (txt.includes("등록") && !txt.includes("미등록"));
                    });

                    if (submitBtn) {
                        submitBtn.focus();
                        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                        submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
                        submitBtn.click();

                        // 확인 팝업 자동 승인 (답글 등록 확인창 -> 완료 확인창 등 최대 3단계)
                        for (let step = 0; step < 3; step++) {
                            await sleep(800);
                            for (const d of [targetDoc, document]) {
                                if (!d) continue;
                                const confirmCandidates = Array.from(d.querySelectorAll("div.modal button, [role='dialog'] button, .btn_layer button, button, a.btn, input[type='button']"));
                                const confirmBtn = confirmCandidates.find(b => {
                                    if (b.closest("#bebesup-helper-panel")) return false;
                                    if (b === submitBtn) return false;
                                    const txt = (b.innerText || b.value || b.textContent || "").trim().replace(/\s+/g, "");
                                    return txt === "확인" || txt === "예" || txt === "네" || txt === "승인" || txt === "닫기";
                                });
                                if (confirmBtn) {
                                    confirmBtn.click();
                                    break;
                                }
                            }
                        }

                        await sleep(1000);
                        // 등록 완료된 서명들을 영구 제외 목록에 추가
                        for (const s of currentBatchSigs) { if (s) processedSignatures.add(s); }
                        return resolve({ status: "REGISTERED", count: selectedCount });
                    } else {
                        return resolve({ status: "TEST_DONE", count: selectedCount });
                    }
                } else if (checkAttempts > 30) {
                    clearInterval(fillInterval);
                    return resolve({ status: "TIMEOUT" });
                }
            }, 200);
        });
    }

    // 전자동 연속 실행 루프 (페이지 전체 새로고침 없이 in-page [검색]을 통해 50개씩 논스톱 연속 처리)
    async function runAutoLoop(category) {
        sessionStorage.setItem("bebesup_auto_loop", "true");
        sessionStorage.setItem("bebesup_target_cat", category);

        while (sessionStorage.getItem("bebesup_auto_loop") === "true") {
            panel.style.border = "2px solid #d32f2f";
            runBtn.style.background = "#d32f2f";
            runBtn.innerText = `⏹ 자동실행 중지 (누적 ${totalSuccess}건)`;

            let api = getGridApi();
            let reviewInfo = findReviewTableInfo();
            if (!api && reviewInfo.rows.length === 0) {
                runBtn.innerText = "⏳ 목록 검색 중...";
                await refreshReviewList();
                await sleep(1000);
                api = getGridApi();
                reviewInfo = findReviewTableInfo();
            }

            if (!api && reviewInfo.rows.length === 0) {
                sessionStorage.removeItem("bebesup_auto_loop");
                panel.style.border = "2px solid #00b050";
                runBtn.style.background = "#00b050";
                runBtn.innerText = "▶ 자동 실행 시작";
                alert("⚠️ 스마트스토어 리뷰 목록 테이블을 찾지 못했습니다.\n먼저 상단에서 기간 선택 후 [검색] 버튼을 눌러 목록을 띄워주세요!");
                return;
            }

            const result = await executeSingleBatch(category, "AUTO_ALL");

            if (result.status === "REGISTERED") {
                totalSuccess += result.count;
                sessionStorage.setItem("bebesup_total_success", String(totalSuccess));
                runBtn.innerText = `⏳ ${result.count}건 등록 완료! (총 ${totalSuccess}건) 다음 50개 조회 중...`;
                await sleep(1200);

                // 전체 새로고침 없이 상단 [검색] 버튼을 눌러 다음 미답변 리뷰들을 즉시 갱신
                const refreshed = await refreshReviewList(reviewInfo.doc);
                if (!refreshed) {
                    location.reload();
                    return;
                }
                await sleep(1800);
            } else if (result.status === "ALREADY_ANSWERED_WARN") {
                runBtn.innerText = "⏳ 이미 작성된 건 감지, [미등록] 목록 갱신 중...";
                dismissAlreadyAnsweredPopup();
                clearAllSelections(api, reviewInfo);
                ensureUnansweredFilterSelected();
                await sleep(800);
                await refreshReviewList(reviewInfo.doc);
                await sleep(2200);
            } else if (result.status === "EMPTY") {
                // 막 등록된 직후 DOM/그리드 갱신 딜레이 고려 -> 1회 더 검색 후 재확인
                runBtn.innerText = "⏳ 남은 리뷰 최종 확인 중...";
                await refreshReviewList(reviewInfo.doc);
                await sleep(1500);

                const checkResult = await executeSingleBatch(category, "AUTO_ALL");
                if (checkResult.status === "REGISTERED") {
                    totalSuccess += checkResult.count;
                    sessionStorage.setItem("bebesup_total_success", String(totalSuccess));
                    runBtn.innerText = `⏳ ${checkResult.count}건 등록 완료! (총 ${totalSuccess}건) 다음 50개 조회 중...`;
                    await sleep(1200);
                    await refreshReviewList(reviewInfo.doc);
                    await sleep(1800);
                    continue;
                }

                // 진짜 대상 리뷰가 0개임 -> 완료
                sessionStorage.removeItem("bebesup_auto_loop");
                panel.style.border = "2px solid #00b050";
                runBtn.style.background = "#00b050";
                runBtn.innerText = "▶ 자동 실행 시작";
                alert(`🎉 [베베숲 AI] 모든 미답변 칭찬 리뷰 답글 등록 완료!\n\n총 ${totalSuccess}건의 리뷰에 답글이 성공적으로 등록되었습니다.\n(남은 불만/하자/먼지/아토피 리뷰는 수동 확인을 위해 안전하게 보존되었습니다.)`);
                return;
            } else if (result.status === "NO_BUTTON") {
                sessionStorage.removeItem("bebesup_auto_loop");
                panel.style.border = "2px solid #00b050";
                runBtn.style.background = "#00b050";
                runBtn.innerText = "▶ 자동 실행 시작";
                alert("⚠️ 화면에서 [답글작성] 버튼을 찾지 못했습니다.\n리뷰 관리 화면인지 확인해 주세요.");
                return;
            } else if (result.status === "NO_SELECTION_ALERT") {
                runBtn.innerText = "⚠️ 선택 동기화 대기 중...";
                clearAllSelections(api, reviewInfo);
                await sleep(1000);
                await refreshReviewList(reviewInfo.doc);
                await sleep(1500);
            } else if (result.status === "TIMEOUT") {
                runBtn.innerText = "⚠️ 창 지연 감지, 재시도 중...";
                await sleep(1500);
                await refreshReviewList(reviewInfo.doc);
                await sleep(1500);
            } else {
                sessionStorage.removeItem("bebesup_auto_loop");
                panel.style.border = "2px solid #00b050";
                runBtn.style.background = "#00b050";
                runBtn.innerText = "▶ 자동 실행 시작";
                alert(`⚠️ 처리 상태: ${result.status}`);
                return;
            }
        }
    }

    // 실행 버튼 클릭
    runBtn.onclick = async () => {
        try {
            if (sessionStorage.getItem("bebesup_auto_loop") === "true") {
                sessionStorage.removeItem("bebesup_auto_loop");
                panel.style.border = "2px solid #00b050";
                runBtn.style.background = "#00b050";
                runBtn.innerText = "▶ 자동 실행 시작";
                alert(`⏹ 자동 작업이 중지되었습니다.\n(현재까지 총 ${totalSuccess}건 완료됨)`);
                return;
            }

            const category = catSelect.value;
            const mode = modeSelect.value;

            // 시각적 피드백 즉시 제공!
            const originalBtnText = runBtn.innerText;
            runBtn.innerText = "⏳ 상태 확인 중...";

            let api = getGridApi();
            let reviewInfo = findReviewTableInfo();

            if (!api && reviewInfo.rows.length === 0) {
                // 화면에 검색 버튼이 있다면 자동으로 [검색]을 클릭하여 목록 로딩 시도
                const searchBtn = findSearchButton();
                if (searchBtn) {
                    runBtn.innerText = "⏳ 목록 검색 중...";
                    searchBtn.click();
                    await sleep(1500);
                    api = getGridApi();
                    reviewInfo = findReviewTableInfo();
                }
            }

            if (!api && reviewInfo.rows.length === 0) {
                runBtn.innerText = originalBtnText;
                alert("⚠️ 스마트스토어 리뷰 목록 테이블을 찾지 못했습니다.\n\n먼저 상단에서 기간(1개월 등)을 선택하고 초록색 [검색] 버튼을 눌러 리뷰 목록을 화면에 띄워주신 후 다시 눌러주세요!");
                return;
            }

            if (mode === "AUTO_ALL") {
                totalSuccess = 0;
                sessionStorage.setItem("bebesup_total_success", "0");
                await runAutoLoop(category);
            } else if (mode === "ONCE_REAL") {
                runBtn.innerText = "⏳ 5개 등록 중...";
                const result = await executeSingleBatch(category, "ONCE_REAL");
                runBtn.innerText = "▶ 자동 실행 시작";
                if (result.status === "REGISTERED") {
                    alert(`✅ [등록 완료] 총 ${result.count}건의 칭찬 리뷰에 답글이 성공적으로 등록되었습니다!\n\n화면 목록을 갱신합니다.`);
                    await sleep(500);
                    const ok = await refreshReviewList();
                    if (!ok) location.reload();
                } else if (result.status === "ALREADY_ANSWERED_WARN") {
                    alert("ℹ️ 화면에 이미 답글이 작성된 건이 감지되어 새로고침합니다.");
                    await sleep(500);
                    const ok = await refreshReviewList();
                    if (!ok) location.reload();
                } else if (result.status === "NO_SELECTION_ALERT") {
                    alert("⚠️ 스마트스토어에서 선택된 리뷰를 인식하지 못했습니다.\n체크박스를 수동으로 1개 선택해 보신 뒤 다시 시도해 주세요.");
                } else if (result.status === "EMPTY") {
                    alert("ℹ️ 현재 화면에 답글 대상 칭찬 리뷰가 없습니다.\n상단에서 기간 선택 후 [검색]을 먼저 진행해 주세요!");
                } else if (result.status === "NO_BUTTON") {
                    alert("⚠️ 화면에서 [답글작성] 버튼을 찾지 못했습니다.\n리뷰 관리 화면인지 확인해 주세요.");
                } else if (result.status === "TIMEOUT") {
                    alert("⚠️ 답글 작성 창을 여는 중 시간이 초과되었습니다.\n스마트스토어 화면을 새로고침(Ctrl+F5) 후 다시 시도해 주세요.");
                } else {
                    alert(`⚠️ 상태: ${result.status}`);
                }
            } else {
                // TEST 모드 (눈으로 확인 모드)
                runBtn.innerText = "👀 테스트 검토 중...";
                const res = await executeSingleBatch(category, "TEST");
                runBtn.innerText = "▶ 자동 실행 시작";
                if (res.status === "TEST_DONE") {
                    alert(`✅ [눈으로 확인 완료]\n\n총 ${res.count}개의 미답변 칭찬 리뷰가 선택되었고, 하단 [답글 내용] 칸에 베베숲 공식 문구가 자동 입력되었습니다!\n\n💡 [등록 및 새로고침]까지 실제로 동작하는지 테스트하시려면, 상단 모드를 [⚡ 1회 5개만 등록]으로 변경 후 실행해 보세요😊`);
                } else if (res.status === "NO_SELECTION_ALERT") {
                    alert("⚠️ 스마트스토어에서 선택된 리뷰를 인식하지 못했습니다.\n체크박스를 수동으로 1개 선택해 보신 뒤 다시 시도해 주세요.");
                } else if (res.status === "EMPTY") {
                    if (res.skippedAnswered > 0) {
                        alert(`ℹ️ 현재 화면의 리뷰(${res.skippedAnswered}건)는 모두 이미 답글이 작성된 건입니다.\n\n상단 검색 조건에서 [답글여부: 미등록]으로 변경 후 [검색]을 진행해 주세요.`);
                    } else if (res.skippedBad > 0 || res.skippedCategory > 0) {
                        alert(`🛡️ 안심 차단 및 카테고리 분리 완료:\n\n• 저평점(1~2점) 및 불만 제외: ${res.skippedBad || 0}건\n• 타 카테고리 상품 제외: ${res.skippedCategory || 0}건\n\n선택하신 카테고리의 긍정 칭찬 리뷰만 안전하게 선별됩니다.`);
                    } else {
                        alert("ℹ️ 현재 화면에 답글 대상 칭찬 리뷰가 없습니다.\n상단에서 [검색]을 먼저 진행해 주세요!");
                    }
                } else if (res.status === "NO_BUTTON") {
                    alert("⚠️ 화면에서 [답글작성] 버튼을 찾지 못했습니다.\n리뷰 관리 화면인지 확인해 주세요.");
                } else if (res.status === "TIMEOUT") {
                    alert("⚠️ 답글 작성 창을 여는 중 시간이 초과되었습니다.\n스마트스토어 화면을 새로고침(Ctrl+F5) 후 다시 시도해 주세요.");
                } else {
                    alert(`⚠️ 처리 결과: ${res.status}`);
                }
            }
        } catch(err) {
            runBtn.innerText = "▶ 자동 실행 시작";
            alert(`⚠️ 실행 중 오류가 발생했습니다: ${err.message || err}`);
        }
    };

    // 5. 페이지 새로고침 후 자동 가동 (수동 새로고침이나 재접속 시에도 끊김 없이 이어받아 가동)
    if (isAutoLooping) {
        panel.style.border = "2px solid #d32f2f";
        runBtn.style.background = "#d32f2f";
        runBtn.innerText = `⏹ 자동실행 중지 (누적 ${totalSuccess}건)`;

        let waitCount = 0;
        let searchTriggered = false;
        const autoInterval = setInterval(async () => {
            waitCount++;
            const api = getGridApi();
            const reviewInfo = findReviewTableInfo();
            const isReady = (api && typeof api.forEachNode === "function") || (reviewInfo.rows && reviewInfo.rows.length > 0);

            if (isReady) {
                clearInterval(autoInterval);
                await sleep(1500);
                await runAutoLoop(savedCat);
            } else if (!searchTriggered && waitCount >= 3) {
                searchTriggered = true;
                const sBtn = findSearchButton();
                if (sBtn) {
                    runBtn.innerText = "⏳ 페이지 재접속 감지, 목록 자동 검색 중...";
                    sBtn.click();
                }
            } else if (waitCount > 40) {
                clearInterval(autoInterval);
                sessionStorage.removeItem("bebesup_auto_loop");
                panel.style.border = "2px solid #00b050";
                runBtn.style.background = "#00b050";
                runBtn.innerText = "▶ 자동 실행 시작";
                alert("⚠️ 페이지 새로고침 후 리뷰 목록을 불러오지 못해 자동 실행이 일시 중지되었습니다.\n상단 [검색] 버튼을 눌러 목록을 띄운 뒤 다시 시작해 주세요.");
            }
        }, 500);
    }

    // 6. '이미 답글을 작성한 리뷰' 팝업 발생 시 0.5초 내 자동 즉시 닫기 상시 워처
    setInterval(() => {
        dismissAlreadyAnsweredPopup();
    }, 500);
})();
