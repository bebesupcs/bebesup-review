// ========================================================
// 🌿 베베숲(Bebesup) 스마트스토어 전용 답글 & 실시간 분석 올인원 v9
// - 상품군별 미답글 칭찬 리뷰를 골라 일괄 답글 작성창을 엽니다.
// - [📊 실시간 AI 분석]: 엑셀 다운 없이 스마트스토어 리뷰 실시간 전수 분석 & 리포트 모달 팝업 & CSV 원클릭 저장
// - 정책/멤버십/쿠폰/서비스 불만 전수 차단
// - 스킨케어/성분 민감 키워드(아토피 등) 차단
// - 먼지/오염/위생 불만 차단
// ========================================================

// ========================================================
(function initBebesupHelper() {
    if (document.getElementById("bebesup-helper-panel")) {
        document.getElementById("bebesup-helper-panel").remove();
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // 1. 상단 배치 & 우측 정렬 앵커 고정 컨트롤 바 생성
    const panel = document.createElement("div");
    panel.id = "bebesup-helper-panel";
    panel.style.cssText = `
        position: fixed;
        top: 12px;
        right: 220px;
        z-index: 99999999;
        background: #ffffff;
        border: 2px solid #00b050;
        padding: 5px 12px;
        border-radius: 30px;
        box-shadow: 0 4px 18px rgba(0, 176, 80, 0.3);
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
            <span style="font-size:15px;">🌿</span>
            <span style="font-weight:bold; color:#00b050; font-size:12px; white-space:nowrap;">
                베베숲 AI
            </span>
            <span id="bebesup-patch-badge" style="font-size:10px; color:#666; background:#f1f5f9; padding:1px 6px; border-radius:10px; font-weight:normal;" title="GitHub 실시간 핫패치 연결됨">
                v2.8.15 (답글 후보가 있는 다음 페이지 탐색)
            </span>
            <button id="bebesup-update-check-btn" title="깃허브에서 최신 패치를 즉시 확인하고 동기화합니다." style="background:none; border:none; cursor:pointer; font-size:11px; padding:0 2px;" onclick="window.__BEBESUP_FORCE_UPDATE__ && window.__BEBESUP_FORCE_UPDATE__()">🔄</button>
        </div>

        <div id="bebesup-controls" style="display:flex; align-items:center; gap:8px;">
            <select id="bebesup-target-cat" style="font-size:11px; padding:3px 7px; border-radius:15px; border:1px solid #ccc; outline:none; font-weight:bold;">
                <option value="WIPES">🌿 전라인 공통 (물티슈)</option>
                <option value="SKINCARE">💧 스킨케어</option>
                <option value="DETERGENT">🫧 세제</option>
            </select>

            <button id="bebesup-test-btn" type="button" style="background:#fff8e1; color:#9a3700; border:1px solid #f0a447; padding:6px 12px; border-radius:20px; font-size:11px; font-weight:bold; cursor:pointer; white-space:nowrap;">
                선별 테스트
            </button>
            <button id="bebesup-run-btn" style="background:#00b050; color:white; border:none; padding:6px 14px; border-radius:20px; font-size:11px; font-weight:bold; cursor:pointer; transition:all 0.2s; white-space:nowrap;">
                ▶ 답글 작성 테스트
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
            for (const grid of doc.querySelectorAll(".ag-root-wrapper")) {
                const columns = new Map();
                for (const header of grid.querySelectorAll(".ag-header-cell[col-id], [role='columnheader'][col-id]")) {
                    const label = (header.querySelector(".ag-header-cell-text")?.textContent || header.innerText || "").replace(/\s+/g, "");
                    columns.set(label, header.getAttribute("col-id"));
                }
                if (!["상품명", "리뷰내용", "리뷰글번호", "답글여부"].every(label => columns.has(label)) ||
                    !["구매자평점", "평점", "별점"].some(label => columns.has(label))) continue;

                const partsByRow = getRenderedGridRows(grid);
                if (partsByRow.size > 0) {
                    return { doc, type: "AG_GRID", table: grid, rows: [...partsByRow.keys()], columns, partsByRow };
                }
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

    function getRenderedGridRows(grid) {
        const rowParts = new Map();
        for (const row of grid.querySelectorAll(".ag-row[row-id], .ag-row[row-index]")) {
            const key = row.getAttribute("row-id") || row.getAttribute("row-index");
            if (!rowParts.has(key)) rowParts.set(key, []);
            rowParts.get(key).push(row);
        }
        const partsByRow = new Map();
        for (const parts of rowParts.values()) {
            const row = parts.find(part => part.querySelector("input[type='checkbox']")) || parts[0];
            partsByRow.set(row, parts);
        }
        return partsByRow;
    }

    async function visitReviewPage(info, visit) {
        const isGrid = info.type === "AG_GRID";
        const seen = new Set();
        const globalList = isGrid ? [] : getGlobalReviewList(info.doc);
        const tableColumns = isGrid ? null : resolveTableColIndexes(info.table);
        const readRows = () => {
            if (!info.table?.isConnected) throw new Error("리뷰 목록이 바뀌었습니다. 검색 결과가 표시되면 다시 실행해 주세요.");
            const partsByRow = isGrid ? getRenderedGridRows(info.table) : null;
            const rows = partsByRow ? [...partsByRow.keys()] : info.rows;
            for (const [index, row] of rows.entries()) {
                const key = isGrid ? row.getAttribute("row-id") || row.getAttribute("row-index") : index;
                if (seen.has(key)) continue;
                const data = isGrid ? extractRenderedGridReview({ ...info, partsByRow }, row) :
                    extractSmartStoreRowData(row, tableColumns, globalList);
                seen.add(key);
                visit(data, row.querySelector("input[type='checkbox']"));
            }
        };
        const viewport = isGrid && [...info.table.querySelectorAll(".ag-body-viewport, .ag-body-vertical-scroll-viewport")]
            .find(el => el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1);
        if (!viewport) {
            readRows();
            return seen.size;
        }

        const originalTop = viewport.scrollTop;
        const render = () => new Promise(resolve => {
            info.doc.defaultView.requestAnimationFrame(() => info.doc.defaultView.requestAnimationFrame(resolve));
        });
        try {
            viewport.scrollTop = 0;
            await render();
            const step = Math.max(1, Math.floor(viewport.clientHeight * 0.8));
            while (true) {
                readRows();
                const top = viewport.scrollTop;
                const bottom = viewport.scrollHeight - viewport.clientHeight;
                if (top >= bottom - 1) break;
                viewport.scrollTop = Math.min(top + step, bottom);
                await render();
                if (viewport.scrollTop <= top) throw new Error("리뷰 페이지 끝까지 읽지 못했습니다.");
            }
        } finally {
            viewport.scrollTop = originalTop;
        }
        return seen.size;
    }

    function extractRenderedGridReview(grid, row) {
        const cells = new Map();
        for (const part of grid.partsByRow.get(row)) {
            for (const cell of part.querySelectorAll(".ag-cell[col-id]")) {
                cells.set(cell.getAttribute("col-id"), cell);
            }
        }
        const cell = (...labels) => cells.get(labels.map(label => grid.columns.get(label)).find(id => id && cells.has(id)));
        const read = element => (element?.innerText || element?.textContent || "").trim();
        const reviewNo = read(cell("리뷰글번호"));
        const productCell = cell("상품명");
        const contentCell = cell("리뷰내용");
        const scoreCell = cell("구매자평점", "평점", "별점");
        const score = extractReviewScore(null, null, null, -1, null, null, scoreCell);
        const productLink = productCell?.querySelector("a");
        const reviewButton = contentCell?.querySelector("button");
        const prodName = productLink?.getAttribute("title") || read(productLink) || read(productCell);
        const reviewText = reviewButton?.getAttribute("title") ||
            reviewButton?.getAttribute("aria-label") || read(reviewButton) || read(contentCell);
        const replyStatus = read(cell("답글여부")).replace(/\s+/g, "");
        return {
            reviewNo: /^\d+$/.test(reviewNo) ? reviewNo : "",
            score, prodName, reviewText,
            author: read(cell("등록자")),
            date: read(cell("리뷰등록일")),
            optionInfo: read(cell("옵션", "옵션명")),
            isAnswered: /^(?:Y|답글(?:등록|완료)|답변완료|등록(?:완료)?)$/i.test(replyStatus),
            replyStatusKnown: /^(?:N|Y|(?:답글)?미등록|답글(?:등록|완료)|답변완료|등록(?:완료)?)$/i.test(replyStatus)
        };
    }

    function getReviewPager(info) {
        const pagers = [...info.doc.querySelectorAll("nav, [role='navigation']")].filter(nav =>
            Boolean(info.table.compareDocumentPosition(nav) & 4) && isVisible(nav) &&
            [...nav.querySelectorAll("button, a")].some(control => /^\d+$/.test(control.textContent.trim())));
        if (pagers.length !== 1) return null;

        const controls = [...pagers[0].querySelectorAll("button, a")].filter(isVisible);
        const numbered = controls.filter(control => /^\d+$/.test(control.textContent.trim()));
        if (!numbered.length) return null;
        const enabled = control => control && !control.disabled && control.getAttribute("aria-disabled") !== "true";
        const active = numbered.find(control => control.getAttribute("aria-current") === "page" ||
            control.getAttribute("aria-selected") === "true" || control.getAttribute("aria-pressed") === "true" ||
            /(?:^|[\s_-])(?:is[-_]?)?(?:active|selected|current|on)(?:$|[\s_-])/i.test(control.className + " " + control.parentElement.className));
        const currentControl = active || numbered.find(control => !enabled(control)) || (numbered.length === 1 ? numbered[0] : null);
        const current = currentControl ? Number(currentControl.textContent.trim()) : null;
        const nextNumber = current === null ? null : numbered.find(control => Number(control.textContent.trim()) === current + 1);
        if (enabled(nextNumber)) return { next: nextNumber };
        const afterNumbers = controls.slice(controls.indexOf(numbered.at(-1)) + 1);
        const onLastNumber = current === Number(numbered.at(-1).textContent.trim());
        const nextArrow = afterNumbers.find(control =>
            /^(?:다음\s*페이지|next\s*page)$/i.test((control.getAttribute("aria-label") || control.title || control.textContent).trim())) ||
            (onLastNumber && afterNumbers.length === 1 ? afterNumbers[0] : null);
        if (nextArrow) return { next: enabled(nextArrow) ? nextArrow : null };
        return onLastNumber && afterNumbers.length === 0 ? { next: null } : null;
    }

    function getVisibleReviewPageKey(info) {
        if (info.type !== "AG_GRID") return info.rows.slice(0, 3).map(row => row.innerText).join("|");
        const partsByRow = getRenderedGridRows(info.table);
        return [...partsByRow.keys()].slice(0, 4)
            .map(row => extractRenderedGridReview({ ...info, partsByRow }, row).reviewNo).filter(Boolean).join("|");
    }

    async function advanceReviewPage(info, pager) {
        const previous = getVisibleReviewPageKey(info);
        if (!previous) return false;
        pager.next.click();
        let changedKey = "";
        for (let attempt = 0; attempt < 50; attempt++) {
            await sleep(200);
            const nextInfo = findReviewTableInfo();
            if (!nextInfo.rows.length || nextInfo.doc !== info.doc) continue;
            const currentKey = getVisibleReviewPageKey(nextInfo);
            if (!currentKey || currentKey === previous) continue;
            if (currentKey === changedKey) return true;
            changedKey = currentKey;
        }
        return false;
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
    function findBatchReplyButton(doc) {
        return Array.from(doc.querySelectorAll("button, input[type='button'], [role='button']")).find(button => {
            if (button.disabled || !isVisible(button) ||
                button.closest("#bebesup-helper-panel, .ag-row, tbody, tr, [role='dialog'], .modal-content, .n-layer-popup")) return false;
            const label = (button.innerText || button.value || button.textContent || "").replace(/\s+/g, "");
            return label === "답글작성" || label === "일괄답글작성";
        });
    }

    // ========================================================
    // 📝 [답글 작성 팝업 모달 & 텍스트 영역] 탐색기
    // - 네이버 스마트스토어 "판매자 일괄 답글 작성" 모달 구조:
    //   1행: [리뷰 글번호] -> 선택된 리뷰 번호 목록 (절대 건드리면 안 됨!)
    //   2행: [답글 내용]   -> 실제 작성할 공식 답변 내용 (여기에 정확히 입력!)
    // ========================================================
    function isVisible(element) {
        return element.getClientRects().length > 0 &&
            element.ownerDocument.defaultView?.getComputedStyle(element).visibility === "visible";
    }

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

            // 1. "판매자 일괄 답글 작성" 모달 컨테이너 탐색 (실제 화면에 표시된 모달만 검사)
            const modals = Array.from(doc.querySelectorAll(".modal-content, div.modal, [role='dialog'], .n-layer-popup, div[class*='layer_popup'], div[class*='modal'], div[class*='popup'], div[class*='layer']"));
            for (const modal of modals.reverse()) {
                if (modal.closest("#bebesup-helper-panel") || !isVisible(modal)) continue;
                const text = (modal.innerText || "").replace(/\s+/g, "");
                if (!/리뷰(?:글)?번호/.test(text) || !text.includes("답글내용")) continue;

                const tas = modal.querySelectorAll("textarea");
                const replyBox = tas[1];
                if (tas.length === 2 && isVisible(replyBox) && !replyBox.disabled && !replyBox.readOnly) {
                    return { modal, reviewNumbers: tas[0], textarea: replyBox, doc };
                }
            }
        }
        return null;
    }

    function analyzeReviewData(rawReviews) {
        let redCount = 0;
        let yellowCount = 0;
        let greenCount = 0;
        let totalScore = 0;
        let ratedCount = 0;

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
            const score = r.score ?? 0;
            if (score > 0) {
                totalScore += score;
                ratedCount++;
            }

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

        const avgScore = ratedCount > 0 ? (totalScore / ratedCount).toFixed(2) : "—";
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
                            <span style="background:rgba(255,255,255,0.25); font-size:11px; padding:2px 8px; border-radius:12px;">현재 검색 페이지</span>
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
                        <div style="font-size:11px; color:#059669; margin-top:2px;">${greenRate}% (분석 분류)</div>
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
                        현재 검색 페이지에서 읽은 리뷰입니다. 다음 페이지는 이동해서 분석해 주세요.
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
        
        let scoreColId = null, prodColId = null, optionColId = null, contentColId = null, replyColId = null;
        for (const c of colDefs) {
            const h = (c.headerName || "").replace(/\s+/g, "");
            const f = c.field || c.colId;
            if (!f) continue;
            const fLower = String(f).toLowerCase();
            if (!scoreColId && (h.includes("평점") || h.includes("별점") || fLower.includes("score") || fLower.includes("point"))) scoreColId = f;
            if (!prodColId && (h.includes("상품명") || h.includes("주문상품") || h.includes("상품정보") || h.includes("구매상품") || h === "상품" || fLower.includes("productname") || fLower.includes("producttitle"))) prodColId = f;
            if (!optionColId && (h.includes("옵션") || h.includes("단품") || h.includes("선택사항") || h.includes("주문선택") || fLower.includes("option"))) optionColId = f;
            if (!contentColId && !/답글|답변|reply|answer/i.test(h + fLower) &&
                (h.includes("리뷰내용") || h === "내용" || /^(?:reviewContent|reviewText|reviewBody|content)$/i.test(f))) contentColId = f;
            if (!replyColId && (h.includes("답글") || h.includes("답변") || fLower.includes("reply") || fLower.includes("answer"))) replyColId = f;
        }
        return { scoreColId, prodColId, optionColId, contentColId, replyColId };
    }

    // 2. HTML Table 컬럼 인덱스 동적 해석
    function resolveTableColIndexes(tableEl) {
        let scoreColIdx = -1, prodColIdx = -1, optionColIdx = -1, contentColIdx = -1, replyColIdx = -1, reviewNoColIdx = -1;
        if (!tableEl) return { scoreColIdx, prodColIdx, optionColIdx, contentColIdx, replyColIdx, reviewNoColIdx };
        const ths = Array.from(tableEl.querySelectorAll("thead th, thead td"));
        ths.forEach((th, idx) => {
            const h = (th.innerText || th.textContent || "").replace(/\s+/g, "");
            if (scoreColIdx === -1 && (h.includes("평점") || h.includes("별점"))) scoreColIdx = idx;
            if (prodColIdx === -1 && (h.includes("상품명") || h.includes("주문상품") || h.includes("상품정보") || h.includes("구매상품") || h === "상품")) prodColIdx = idx;
            if (optionColIdx === -1 && (h.includes("옵션") || h.includes("단품") || h.includes("선택사항") || h.includes("옵션정보"))) optionColIdx = idx;
            if (contentColIdx === -1 && (h.includes("리뷰내용") || h === "내용")) contentColIdx = idx;
            if (replyColIdx === -1 && (h.includes("답글") || h.includes("답변"))) replyColIdx = idx;
            if (reviewNoColIdx === -1 && (h.includes("리뷰글번호") || h.includes("글번호") || h.includes("리뷰번호") || h.includes("번호"))) reviewNoColIdx = idx;
        });
        return { scoreColIdx, prodColIdx, optionColIdx, contentColIdx, replyColIdx, reviewNoColIdx };
    }

    // AngularJS Scope에서 단일 리뷰 데이터 객체 탐색
    function findReviewObjectFromScope(scope, targetReviewNo = null) {
        if (!scope) return null;

        // 1) scope 자체의 직접 속성 검사
        const propNames = ['item', 'row', 'review', 'data', 'r', 'article', 'reviewItem', 'record', 'orderReview'];
        for (const p of propNames) {
            const obj = scope[p];
            if (obj && typeof obj === 'object') {
                if (obj.reviewContent || obj.productName || obj.channelProductName || obj.reviewScore || obj.reviewNo || obj.reviewScorePoint) {
                    if (!targetReviewNo || String(obj.reviewNo || obj.id || obj.reviewId || "") === String(targetReviewNo)) {
                        return obj;
                    }
                }
            }
        }

        // 2) scope의 모든 사용자 정의 속성 검사
        for (const key of Object.keys(scope)) {
            if (key.startsWith('$')) continue;
            const val = scope[key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                if (val.reviewContent || val.productName || val.channelProductName || val.reviewScore || val.reviewNo || val.reviewScorePoint) {
                    if (!targetReviewNo || String(val.reviewNo || val.id || val.reviewId || "") === String(targetReviewNo)) {
                        return val;
                    }
                }
            }
        }

        // 3) 상위 계층 scope 배열(vm.reviewList 등)에서 매칭
        const scopesToCheck = [scope, scope.vm, scope.$parent, scope.$parent?.vm, scope.$parent?.$parent, scope.$parent?.$parent?.vm].filter(Boolean);
        const listNames = ['reviewList', 'items', 'list', 'reviews', 'rows', 'data', 'content', 'reviewDataList'];

        for (const s of scopesToCheck) {
            for (const ln of listNames) {
                const arr = s[ln];
                if (Array.isArray(arr) && arr.length > 0) {
                    if (targetReviewNo) {
                        const found = arr.find(x => x && String(x.reviewNo || x.id || x.reviewId || x.productOrderReviewNo || "") === String(targetReviewNo));
                        if (found) return found;
                    }
                }
            }
        }

        return null;
    }

    // 스마트스토어 화면 전역의 AngularJS Controller에서 로드된 리뷰 원본 배열 수집
    function getGlobalReviewList(preferredDoc = document) {
        if (!window.angular) return [];
        try {
            const docs = [preferredDoc, document];
            try {
                const iframes = document.querySelectorAll("iframe, frame");
                for (let i = 0; i < iframes.length; i++) {
                    const fDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
                    if (fDoc && !docs.includes(fDoc)) docs.push(fDoc);
                }
            } catch(e) {}

            const listNames = ['reviewList', 'items', 'list', 'reviews', 'rows', 'data', 'content', 'reviewDataList'];

            for (const doc of docs) {
                const candidateEls = [
                    doc.querySelector(".seller-content"),
                    doc.querySelector("#content"),
                    doc.querySelector("div[ui-view]"),
                    doc.querySelector("div[ng-controller]"),
                    doc.querySelector("table"),
                    doc.body
                ].filter(Boolean);

                for (const el of candidateEls) {
                    const scope = window.angular.element(el).scope();
                    if (!scope) continue;

                    const targets = [scope, scope.vm, scope.$parent, scope.$parent?.vm].filter(Boolean);
                    for (const t of targets) {
                        for (const ln of listNames) {
                            const arr = t[ln];
                            if (Array.isArray(arr) && arr.length > 0) {
                                const first = arr[0];
                                if (first && typeof first === 'object' && (first.reviewNo || first.reviewId || first.reviewContent || first.productName || first.channelProductName)) {
                                    return arr;
                                }
                            }
                        }
                        for (const key of Object.keys(t)) {
                            if (key.startsWith('$')) continue;
                            const val = t[key];
                            if (Array.isArray(val) && val.length > 0) {
                                const first = val[0];
                                if (first && typeof first === 'object' && (first.reviewNo || first.reviewId || first.reviewContent || first.productName || first.channelProductName)) {
                                    return val;
                                }
                            }
                        }
                    }
                }
            }
        } catch(e) {}
        return [];
    }

    // React Fiber 트리에서 컴포넌트 Props/State 데이터 탐색기
    function findReviewFromReactFiber(el) {
        if (!el) return null;
        const elementsToTry = [el, ...Array.from(el.querySelectorAll ? el.querySelectorAll("td, a, span, button") : [])];
        for (const targetEl of elementsToTry) {
            const fiberKey = Object.keys(targetEl).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
            if (!fiberKey) continue;
            let curr = targetEl[fiberKey];
            for (let depth = 0; depth < 15 && curr; depth++) {
                const props = curr.memoizedProps;
                if (props && typeof props === 'object') {
                    for (const key of ['data', 'row', 'item', 'review', 'record', 'rowData', 'original', 'value']) {
                        const obj = props[key];
                        if (obj && typeof obj === 'object') {
                            if (obj.productName || obj.channelProductName || obj.reviewContent || obj.reviewScore || obj.reviewNo) {
                                return obj;
                            }
                        }
                    }
                    if (props.productName || props.channelProductName || props.reviewContent) {
                        return props;
                    }
                }
                const state = curr.memoizedState;
                if (state && typeof state === 'object') {
                    for (const key of ['data', 'row', 'item', 'review', 'record', 'rowData', 'reviews', 'reviewList']) {
                        const obj = state[key];
                        if (obj && typeof obj === 'object') {
                            if (obj.productName || obj.channelProductName || obj.reviewContent || obj.reviewScore) {
                                return obj;
                            }
                        }
                    }
                }
                curr = curr.return;
            }
        }
        return null;
    }

    // 스마트스토어 상단 검색창에 판매자가 직접 입력/선택한 검색 조건 감지
    // 스마트스토어 HTML Table의 1개 행(tr)에 대한 전방위 정밀 데이터 추출기
    function extractSmartStoreRowData(tr, colIndexes, globalList = []) {
        const { scoreColIdx = -1, prodColIdx = -1, optionColIdx = -1, contentColIdx = -1, replyColIdx = -1, reviewNoColIdx = -1 } = colIndexes || {};
        const tds = Array.from(tr.querySelectorAll("td"));
        const rowText = (tr.innerText || "").replace(/\s+/g, " ");

        // 1. 리뷰글번호(reviewNo) 정밀 추출
        let reviewNo = "";
        if (reviewNoColIdx >= 0 && tds[reviewNoColIdx]) {
            reviewNo = (tds[reviewNoColIdx].innerText || "").trim().replace(/\D/g, "");
        }
        if (!reviewNo) {
            reviewNo = tr.getAttribute("data-review-id") || tr.getAttribute("data-review-no") || "";
        }

        // 2. 데이터 소스 전방위 탐색 (네트워크 스니퍼, React Fiber, AngularJS, 전역 목록)
        let rawItem = null;

        // React Fiber 탐색 (스마트스토어가 React 기반일 경우 memoizedProps에서 추출)
        if (!rawItem) {
            rawItem = findReviewFromReactFiber(tr);
            const rawReviewNo = rawItem?.reviewNo || rawItem?.reviewId || rawItem?.productOrderReviewNo;
            if (reviewNo && String(rawReviewNo || "") !== String(reviewNo)) rawItem = null;
        }

        // 2-C. AngularJS Scope 탐색
        if (!rawItem) {
            const win = tr.ownerDocument?.defaultView || window;
            const ng = win.angular || window.angular;
            if (ng) {
                try {
                    const elsToTry = [tr, ...tr.querySelectorAll("a, td, span, button, input")];
                    for (const el of elsToTry) {
                        const s = ng.element(el).scope();
                        if (s) {
                            rawItem = findReviewObjectFromScope(s, reviewNo);
                            if (rawItem) break;
                        }
                    }
                } catch(e) {}
            }
        }

        // 2-D. globalList 탐색
        if (!rawItem && Array.isArray(globalList) && globalList.length > 0) {
            if (reviewNo) {
                rawItem = globalList.find(x => x && String(x.reviewNo || x.id || x.reviewId || x.productOrderReviewNo || "") === String(reviewNo));
            }
        }

        const prodName = extractProductName(rawItem, tr, null, prodColIdx);
        const optionInfo = extractOptionInfo(rawItem, tr, null, optionColIdx);
        const reviewText = extractReviewContent(rawItem, tr, null, contentColIdx);
        const score = extractReviewScore(rawItem, tr, null, scoreColIdx);

        // 6. 이미 답글완료 여부(isAnswered) 판별
        let isAnswered = false;
        if (rawItem) {
            if (rawItem.answered === true || rawItem.isAnswered === true || rawItem.hasReply === true || rawItem.replyRegistrationDate) {
                isAnswered = true;
            }
        }
        if (!isAnswered) {
            const hasAnsweredBtn = Array.from(tr.querySelectorAll("button, a")).some(btn => {
                const bTxt = (btn.innerText || btn.textContent || "").trim();
                return bTxt.includes("답글보기") || bTxt.includes("답글수정") || bTxt.includes("답변보기");
            });
            if (hasAnsweredBtn) isAnswered = true;
        }
        if (!isAnswered && replyColIdx >= 0 && tds[replyColIdx]) {
            const rTxt = (tds[replyColIdx].innerText || "").trim();
            if (/^(?:Y|답글?완료|답변완료|등록완료|등록)$/i.test(rTxt.replace(/\s+/g, ""))) {
                isAnswered = true;
            }
        }
        if (!isAnswered) {
            isAnswered = rowText.includes("답글보기") || rowText.includes("답글수정") || rowText.includes("답글완료") || rowText.includes("등록완료") || rowText.includes("답변완료");
        }

        return {
            reviewNo,
            prodName,
            optionInfo,
            reviewText,
            score,
            isAnswered,
            rawItem,
            rowText
        };
    }

    function parseReviewScore(value) {
        if (typeof value !== "string" && typeof value !== "number") return null;
        const text = String(value).trim();
        const fraction = text.match(/^(?:총\s*)?5\s*점\s*만점(?:에|\s*중)?\s*([1-5])\s*점?$/) ||
                         text.match(/^([1-5])\s*(?:점\s*)?\/\s*5\s*점?$/);
        if (fraction) return Number(fraction[1]);
        const points = text.match(/^(?:(?:평점|별점)\s*[:：]?\s*)?([1-5])(?:\.0+)?\s*점?$/);
        if (points) return Number(points[1]);
        const stars = text.match(/^(★{1,5})(☆{0,4})(?:\s*([1-5])\s*점?)?$/);
        if (!stars || stars[1].length + stars[2].length > 5) return null;
        return !stars[3] || Number(stars[3]) === stars[1].length ? stars[1].length : null;
    }

    function extractReviewScore(d, rowElOrTr, scoreColId, scoreColIdx, api, node, renderedCell) {
        const scores = [];
        if (api && node && scoreColId) {
            try { scores.push(parseReviewScore(api.getValue(scoreColId, node))); } catch(e) {}
        }

        const fields = [
            "reviewScorePoint", "evaluationPoint", "reviewScore", "starScore", "score",
            "point", "reviewPoint", "rating", "starRating", "reviewStarPoint"
        ];
        for (const source of [d, d?.review, d?.productOrderReview]) {
            if (!source) continue;
            for (const field of fields) scores.push(parseReviewScore(source[field]));
        }

        let cell = renderedCell;
        if (!cell && scoreColIdx >= 0) {
            cell = rowElOrTr?.querySelectorAll("td, .ag-cell")[scoreColIdx];
        } else if (!cell && scoreColId) {
            cell = rowElOrTr?.querySelector('[col-id="' + scoreColId + '"]');
        }
        if (cell) {
            scores.push(parseReviewScore(cell.innerText || cell.textContent));
            for (const label of cell.querySelectorAll(".score, .point, .rating, .blind, [class*='star'], span, strong")) {
                scores.push(parseReviewScore(label.innerText || label.textContent));
            }
            scores.push(parseReviewScore(cell.querySelector("input[type='radio']:checked")?.value));
        }

        const knownScores = new Set(scores.filter(score => score !== null));
        return knownScores.size === 1 ? knownScores.values().next().value : null;
    }

    // 4. 상품명 및 옵션명 정밀 추출기 (리뷰 본문 텍스트와 절대 섞이지 않도록 격리)
    function extractProductName(d, rowElOrTr, prodColId, prodColIdx, api, node) {
        if (api && node && prodColId) {
            try {
                const val = api.getValue(prodColId, node);
                if (val && typeof val === 'string' && val.trim()) return val.trim();
                if (val && typeof val === 'object') {
                    const p = val.productName || val.channelProductName || val.name || val.title;
                    if (p && typeof p === 'string' && p.trim()) return p.trim();
                }
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
            if (d.productOrderReview?.productName) return String(d.productOrderReview.productName).trim();
            if (d.productOrderReview?.channelProductName) return String(d.productOrderReview.channelProductName).trim();
            if (d.productOrderReview?.productTitle) return String(d.productOrderReview.productTitle).trim();
            if (d.productOrder?.productName) return String(d.productOrder.productName).trim();
            if (d.productOrder?.channelProductName) return String(d.productOrder.channelProductName).trim();
            if (d.originProduct?.productName) return String(d.originProduct.productName).trim();
            if (d.review?.productName) return String(d.review.productName).trim();
            if (d.channelProduct?.name) return String(d.channelProduct.name).trim();
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

    function extractOptionInfo(d, rowElOrTr, optionColId, optionColIdx, api, node) {
        if (api && node && optionColId) {
            try {
                const val = api.getValue(optionColId, node);
                if (val && typeof val === 'string' && val.trim()) return val.trim();
            } catch(e) {}
        }

        if (d && typeof d === 'object') {
            const optFields = [
                'channelProductOption', 'productOption', 'optionInfo',
                'channelProductDisplaySummary', 'productDisplaySummary',
                'itemOption', 'optionName'
            ];
            for (const f of optFields) {
                if (d[f] && typeof d[f] === 'string' && d[f].trim()) return d[f].trim();
            }
            if (d.productOrderReview) {
                for (const f of optFields) {
                    if (d.productOrderReview[f] && typeof d.productOrderReview[f] === 'string' && d.productOrderReview[f].trim()) {
                        return d.productOrderReview[f].trim();
                    }
                }
            }
            if (d.productOrder) {
                for (const f of optFields) {
                    if (d.productOrder[f] && typeof d.productOrder[f] === 'string' && d.productOrder[f].trim()) {
                        return d.productOrder[f].trim();
                    }
                }
            }
        }

        if (rowElOrTr) {
            let cell = null;
            if (optionColIdx >= 0 && rowElOrTr.querySelectorAll) {
                const cells = Array.from(rowElOrTr.querySelectorAll("td, .ag-cell"));
                if (cells[optionColIdx]) cell = cells[optionColIdx];
            } else if (optionColId && rowElOrTr.querySelector) {
                cell = rowElOrTr.querySelector(`[col-id="${optionColId}"]`);
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
            if (!d && window.angular) {
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
        }

        return "";
    }

    // 카테고리 판별 사전 (스킨케어, 세제, 물티슈)
    const skincareKeywords = [
        "로션", "크림", "수딩젤", "수딩밤", "수딩", "바스앤샴푸", "바스&샴푸", "바스", "샴푸", "워시",
        "스킨", "선크림", "선스틱", "선쿠션", "선팩트", "선케어", "클렌저", "클렌징", "오일",
        "베이비오일", "마사지오일", "파우더로션", "수딩파우더", "파우더", "립밤", "스틱밤", "탑투토",
        "탑투토워시", "소프트너", "아토에코", "모이스처", "바디워시", "헤어워시", "인텐시브", "포밍워시",
        "버블워시", "너리싱", "엠플", "세럼", "자외선차단", "베이비로션", "베이비크림", "보습크림"
    ];

    const detergentKeywords = [
        "세탁세제", "섬유유연제", "유연제", "젖병세정제", "젖병세정", "젖병세제", "주방세제", "식기세척기",
        "식기세척", "식기세정", "캡슐세제", "얼룩제거제", "얼룩제거", "표백제", "산소계표백제", "산소계",
        "과탄산소다", "과탄산", "베이킹소다", "구연산", "세탁비누", "아기비누", "유아비누", "비누",
        "토이클리너", "살균소독", "소독스프레이", "소독수", "소독제", "베베숲홈", "베베숲 홈", "세제"
    ];

    const wipesKeywords = [
        "물티슈", "비데티슈", "손입티슈"
    ];

    function classifyProductCategory(prodName, optionInfo = "") {
        const name = prodName.toLowerCase().replace(/\s+/g, "");
        const option = optionInfo.toLowerCase().replace(/\s+/g, "");
        const matches = (value, keywords) => keywords.some(keyword => value.includes(keyword.replace(/\s+/g, "")));
        const skincare = matches(name, skincareKeywords);
        const detergent = matches(name, detergentKeywords);
        const wipes = matches(name, wipesKeywords);
        const skincareOption = matches(option, skincareKeywords);
        const detergentOption = matches(option, detergentKeywords);

        if (skincare && !detergent && !wipes && !detergentOption) return "SKINCARE";
        if (detergent && !skincare && !wipes && !skincareOption) return "DETERGENT";
        if (wipes && !skincare && !detergent && !skincareOption && !detergentOption) return "WIPES";
        return null;
    }

    // 강력 부정어 및 컴플레인 사전 (전면 보강)
    const badWords = [
        // 🚨 1. 안전성/위생/피부 중대 이슈 (RED)
        "발진", "두드러기", "가려", "간지", "붉", "빨갛", "알레르기", "트러블", "피부염", "아토피",
        "병원", "피부과", "부작용", "따가", "따끔", "뒤집", "안맞아", "안맞네", "안 맞", "화상", "진물",
        "곰팡이", "이물질", "이물", "벌레", "악취", "냄새 심", "이상한 냄새", "썩", "변질", "침전",
        "더러", "오염", "얼룩", "재고", "먼지", "찝찝", "찜찜", "소송", "고발", "신고",

        // 🟡 2. 중고/반품의심/개봉/포장 불량/변색/박스 파손 (DEFECT & PACKAGING)
        "반품된", "반품된걸", "반품된거", "반품 건", "반품건", "반품 제품", "반품제품", "반품",
        "새거가 아닌", "새것이 아닌", "새상품이 아닌", "새제품이 아닌", "새거 아니", "새것 아니",
        "중고", "누가 쓰던", "쓰던 거", "쓰던거", "쓰던 것", "개봉된", "개봉 흔적", "뜯어진", "뜯겨", "재포장",
        "변색", "하얗게 변", "누렇게", "색이 변", "포장지", "포장 불량", "포장상태", "포장 상태", "포장 엉망", "포장이 엉망",
        "깨끗하지 못", "깨끗하지 않", "지워지지", "안 지워", "안지워", "주의부탁", "주의 부탁", "주의해주", "주의해 주", "배송에 이런",
        "박스 파손", "박스파손", "박스 찢", "박스가 찢", "박스가 터", "박스 터", "박스 찌그", "박스가 찌그", "박스 구겨", "박스가 엉망", "박스 뜯", "박스 개봉",
        "외박스 파손", "상자 파손", "상자 터", "상자 찌그", "테이프 뜯",

        // 🟡 3. 제품 하자/캡/원단/재단/실밥/수분/제조일 (DEFECT & QUALITY)
        "헐거", "열려있", "열려서", "열려", "안닫", "안 닫", "뚜껑 헐", "뚜껑 부러", "뚜껑 깨", "뚜껑 안",
        "캡이 헐", "캡 헐", "캡 열", "캡 안", "캡 부러", "캡 깨", "캡 불량", "스티커",
        "마름", "말라있", "말라서", "말라", "마르", "물기 부족", "물기 없", "물기 마", "물기 적", "수분 부족", "수분 없", "수분이 좀", "수분 아쉽", "건조",
        "뒤집어서", "뒤집어 쓰", "뒤집어쓰",
        "터져", "터짐", "찌그러", "찢어", "찢김", "구멍", "불량", "파손",
        "새서", "새어", "흘러", "샜", "흘러나",
        "재단", "재단 불량", "재단이 아쉽", "실처럼", "실밥", "올 풀림", "올풀림", "마감 불량", "마감 아쉽", "마감이 아쉽", "깔끔하지 않", "원단 불량", "원단이 깔끔",
        "제조일", "제조일자", "생산일자", "제조년월", "오래된", "유통기한 임박", "유통기한",
        "너무 작", "사이즈 작", "사이즈 아쉽", "크기 작", "너무 얇", "두께 아쉽", "두께 얇", "얇아", "얇네", "비쳐", "비침",
        "거칠", "까칠", "끈적", "딸려나",

        // 🟡 4. 구매 만류 / 비추천 / 후회 / 교환·환불 희망 (RECOMMENDATION & CS)
        "패스 하", "패스하", "패스합", "패스요", "패스 권", "패스 추천", "패스하세요", "패스 하세요", "패스", "그냥 패스",
        "두꺼운 걸 찾", "두꺼운 거 찾", "두꺼운거 찾", "두꺼운걸 찾",
        "사지 마", "사지마", "사지마세요", "사지 마세요", "구매하지 마", "구매 비추", "비추", "비추천",
        "살 걸", "살걸", "살 걸 그", "살걸그", "괜히 샀", "괜히 삿", "후회", "차라리", "실망", "돈 아깝", "돈아깝", "돈 버렸", "돈버렸",
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

    function getReviewExclusion(score, reviewText) {
        if (score === 1 || score === 2) return "lowScore";
        if (![3, 4, 5].includes(score) || !reviewText || /(?:\.{3}|…)$/u.test(reviewText)) return "unreadable";

        const text = reviewText.replace(/\s+/g, " ");
        if (badWords.some(word => text.includes(word))) return "complaint";
        if (/만족스럽지|만족하지\s*않|불만족|좋지는?\s*않|좋지\s*못|추천하지\s*않|추천\s*안|(?:마음|맘)에\s*(?:안\s*들|들지\s*않)|기대\s*(?:이하|만큼은?\s*아니)|(?:뽑기|꺼내기|쓰기|사용하기)(?:가|는)?\s*(?:힘들|어렵|불편)|(?:배송|택배|도착)[^.!?。]{0,35}(?:(?:며칠|몇\s*주|일주일|[3-9]\s*일)(?:이나|씩)?\s*기다|너무\s*오래\s*걸)/u.test(text)) {
            return "complaint";
        }
        if (score === 3 && (Array.from(text.replace(/\s/g, "")).length < 5 ||
            /보통|무난|그럭저럭|나쁘지|긴\s*(하지만|한데)|지만|다만/u.test(text))) return "notPraise";

        const positive = /좋아요|좋네요|좋습니다|좋았|좋고|좋은\s*거\s*같|만족|추천해|추천합니다|잘\s*(?:쓰|쓸|사용|닦)|(?:마음|맘)에\s*들|배송(?:이|도)?\s*빠르|부드러워|부드럽습니다|촉촉해|최고|훌륭|정착/u;
        if (positive.test(text)) return null;
        if (score >= 4 && /굿|재구매|늘\s*쓰|항상\s*(?:쓰|사|구매)|꾸준히\s*(?:쓰|사용|구매)|믿고\s*(?:쓰|사|구매)|또\s*(?:살|시킬|구매)/u.test(text)) return null;
        return "notPraise";
    }

    // 분석 버튼 클릭 핸들러
    const analyzeBtn = panel.querySelector("#bebesup-analyze-btn");
    analyzeBtn.onclick = async () => {
        if (preparingReply) return;
        const api = getGridApi();
        const reviewInfo = findReviewTableInfo();
        if (!api && reviewInfo.rows.length === 0) {
            return alert("⚠️ 스마트스토어 리뷰 목록 테이블을 찾지 못했습니다.\n먼저 [리뷰 관리] 화면에서 검색을 진행해 주세요.");
        }

        analyzeBtn.innerText = "⏳ 전수 분석 중...";
        preparingReply = true;
        analyzeBtn.disabled = true;

        const { scoreColId, prodColId, contentColId } = api ? resolveAgGridCols(api) : {};
        const reviews = [];
        try {
            if (reviewInfo.type === "AG_GRID") {
                await visitReviewPage(reviewInfo, row => reviews.push({
                    id: row.reviewNo || "-",
                    author: row.author || "-",
                    date: row.date || "-",
                    prodName: row.prodName || "베베숲 제품",
                    score: row.score,
                    text: row.reviewText
                }));
            } else if (api && typeof api.forEachNode === "function") {
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
                const globalReviewList = getGlobalReviewList(reviewInfo.doc);
                const { scoreColIdx, prodColIdx, contentColIdx, replyColIdx, reviewNoColIdx } = reviewInfo.table ? resolveTableColIndexes(reviewInfo.table) : {};
                reviewInfo.rows.forEach((tr, idx) => {
                    const rowData = extractSmartStoreRowData(tr, { scoreColIdx, prodColIdx, contentColIdx, replyColIdx, reviewNoColIdx }, globalReviewList);
                    const score = rowData.score;
                    const prodName = rowData.prodName || "베베숲 제품";
                    const text = rowData.reviewText;

                    const idMatch = text.match(/\b\d{9,11}\b/);
                    const dateMatch = (tr.innerText || "").match(/\d{4}\.\d{2}\.\d{2}/);

                    reviews.push({
                        id: rowData.reviewNo || (idMatch ? idMatch[0] : `REV-${idx + 1}`),
                        author: (tr.innerText || "").match(/[a-zA-Z0-9_*]{3,12}/)?.[0] || "-",
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

            showAnalysisDashboardModal(analyzeReviewData(reviews));
        } catch (error) {
            alert(error.message);
        } finally {
            preparingReply = false;
            analyzeBtn.disabled = false;
            analyzeBtn.innerText = "📊 실시간 AI 분석";
        }
    };

    // ========================================================
    // 🚀 자동 답글 실행 엔진
    // ========================================================
    const runBtn = panel.querySelector("#bebesup-run-btn");
    const catSelect = panel.querySelector("#bebesup-target-cat");

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

    // 카테고리 표시명 변환 헬퍼 함수
    function getCategoryLabel(cat) {
        if (cat === "SKINCARE") return "스킨케어";
        if (cat === "DETERGENT") return "세제";
        return "전라인 공통(물티슈)";
    }

    // 단일 배치(50개) 처리 함수
    async function prepareReplyBatch(category, testOnly = false, visited = new Set()) {
        const catLabel = getCategoryLabel(category);
        // 🌿 물티슈/전라인 전용 정성 공식 답글
        let replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n언제나 아기 피부에 닿는 만큼 더욱 순하고 도톰하게 정성을 담겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";

        if (category === "SKINCARE") {
            // 💧 스킨케어 전용 정성 공식 답글
            replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n우리 아이 피부를 촉촉하고 순하게 지켜줄 수 있도록 늘 엄선된 성분으로 보답하겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";
        } else if (category === "DETERGENT") {
            // 🫧 세제/생활용품 전용 정성 공식 답글
            replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n온 가족 안심 세탁을 위해 깨끗한 세정력과 순한 안심 성분으로 보답하겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";
        }

        const reviewInfo = findReviewTableInfo();
        if (reviewInfo.rows.length === 0) return { status: "WAIT" };

        let otherCategory = 0;
        let unknownCategory = 0;
        const excluded = { answered: 0, lowScore: 0, complaint: 0, notPraise: 0, unreadable: 0 };
        const selectedReviewNumbers = new Set();
        const candidates = [];
        let firstReviewNo = "";

        const BATCH_TARGET_LIMIT = 50;

        const isGrid = reviewInfo.type === "AG_GRID";
        const checked = await visitReviewPage(reviewInfo, (rowData, checkbox) => {
            const { reviewNo, prodName, optionInfo, reviewText, score, isAnswered } = rowData;
            if (!firstReviewNo && reviewNo) firstReviewNo = reviewNo;

            const detectedCategory = classifyProductCategory(prodName, optionInfo);
            if (!detectedCategory) {
                unknownCategory++;
                return;
            }
            if (detectedCategory !== category) {
                otherCategory++;
                return;
            }
            if (isAnswered) {
                excluded.answered++;
                return;
            }
            const reason = getReviewExclusion(score, reviewText);
            if (reason) {
                excluded[reason]++;
                return;
            }
            if (!/^\d+$/.test(reviewNo) || (isGrid && !rowData.replyStatusKnown) || !checkbox || checkbox.disabled) {
                excluded.unreadable++;
                return;
            }

            candidates.push(reviewNo);
        });

        const batch = candidates.slice(0, BATCH_TARGET_LIMIT);
        const summary = {
            checked, eligible: candidates.length, batchSize: batch.length,
            excluded, otherCategory, unknownCategory, reviewInfo
        };
        if (testOnly) return { status: "TESTED", ...summary };
        if (firstReviewNo && visited.has(firstReviewNo)) return { status: "PAGE_REPEAT" };
        if (firstReviewNo) visited.add(firstReviewNo);
        if (batch.length === 0) return { status: "EMPTY", ...summary };

        const wanted = new Set(batch);
        await visitReviewPage(reviewInfo, ({ reviewNo }, checkbox) => {
            if (!checkbox || checkbox.disabled) return;
            if (checkbox.checked !== wanted.has(reviewNo)) checkbox.click();
            if (checkbox.checked && wanted.has(reviewNo)) selectedReviewNumbers.add(reviewNo);
        });
        const selectedCount = selectedReviewNumbers.size;
        if (selectedCount !== batch.length) return { status: "SELECTION_FAILED" };

        runBtn.innerText = `⏳ [${catLabel}] ${selectedCount}개 작성 중...`;

        // 1. 답글작성 버튼 탐색 (테이블 인근 툴바 및 전역/iframe)
        const replyBtn = findBatchReplyButton(reviewInfo.doc);
        if (!replyBtn) {
            return { status: "NO_BUTTON" };
        }

        await sleep(500);
        replyBtn.focus();
        replyBtn.click();

        let modalInfo;
        for (let attempt = 0; attempt < 30; attempt++) {
            modalInfo = findReplyModalInfo(reviewInfo.doc);
            if (modalInfo) break;
            await sleep(200);
        }
        if (!modalInfo) {
            return { status: "NO_REPLY_FIELD" };
        }

        const { reviewNumbers, textarea: replyBox, doc } = modalInfo;
        if (selectedReviewNumbers.size > 0) {
            const modalNumbers = new Set(reviewNumbers.value.match(/\d+/g) || []);
            if (modalNumbers.size !== selectedCount || [...modalNumbers].some(number => !selectedReviewNumbers.has(number))) {
                return { status: "REVIEW_NUMBER_MISMATCH" };
            }
        }
        const nativeSetter = Object.getOwnPropertyDescriptor(doc.defaultView.HTMLTextAreaElement.prototype, "value")?.set;
        if (!nativeSetter) {
            return { status: "NO_REPLY_FIELD" };
        }
        nativeSetter.call(replyBox, replyMsg);
        replyBox.dispatchEvent(new Event("input", { bubbles: true }));
        replyBox.dispatchEvent(new Event("change", { bubbles: true }));
        return { status: "READY", count: selectedCount };
    }

    async function findAndPrepareReplyBatch(category) {
        const visited = new Set();
        let checkedPages = 0;
        let checkedReviews = 0;
        while (true) {
            const result = await prepareReplyBatch(category, false, visited);
            if (result.status !== "EMPTY") return result;
            checkedPages++;
            checkedReviews += result.checked;
            const pager = getReviewPager(result.reviewInfo);
            if (!pager) return { status: "PAGER_UNCONFIRMED", checkedPages, checkedReviews };
            if (!pager.next) return { status: "EMPTY", checkedPages, checkedReviews };
            runBtn.innerText = "⏳ 다음 페이지에서 답글 후보 찾는 중...";
            if (!await advanceReviewPage(result.reviewInfo, pager)) return { status: "PAGE_CHANGE_FAILED" };
        }
    }

    const testBtn = panel.querySelector("#bebesup-test-btn");
    const noReviewsMessage = "리뷰 목록을 찾지 못했습니다. 스마트스토어에서 리뷰를 검색해 주세요.";
    function showSelectionSummary(category, result, testOnly) {
        const excludedCount = Object.values(result.excluded).reduce((total, count) => total + count, 0);
        const lines = [
            `[${getCategoryLabel(category)}] ${testOnly ? "선별 테스트 결과" : "답글 대상 0건"}`,
            `현재 검색 페이지에서 읽음: ${result.checked}건`,
            `선택한 상품군: ${result.eligible + excludedCount}건`,
            `답글 작성 가능: ${result.eligible}건`,
            `선택한 상품군 중 작성 제외: ${excludedCount}건`,
            `  1~2점 ${result.excluded.lowScore}건 · 불만 감지 ${result.excluded.complaint}건`,
            `  칭찬 기준 미충족 ${result.excluded.notPraise}건 · 이미 답글 등록 ${result.excluded.answered}건`,
            `  본문·평점·답글 상태 또는 선택 정보 미확인 ${result.excluded.unreadable}건`,
            `다른 상품군: ${result.otherCategory}건 · 상품군 미확인: ${result.unknownCategory}건`
        ];
        if (result.eligible > result.batchSize) {
            lines.push(`이번 작성창에 선택: ${result.batchSize}건 · 다음 배치: ${result.eligible - result.batchSize}건`);
        }
        alert(lines.join("\n"));
    }

    let preparingReply = false;
    testBtn.onclick = async () => {
        if (preparingReply) return;
        preparingReply = true;
        testBtn.disabled = true;
        testBtn.innerText = "페이지 검사 중...";
        const category = catSelect.value;
        try {
            const result = await prepareReplyBatch(category, true);
            if (result.status === "WAIT") alert(noReviewsMessage);
            else showSelectionSummary(category, result, true);
        } catch (error) {
            alert(`선별 테스트 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            preparingReply = false;
            testBtn.disabled = false;
            testBtn.innerText = "선별 테스트";
        }
    };

    runBtn.onclick = async () => {
        if (preparingReply || findReplyModalInfo(document)) return;
        preparingReply = true;
        runBtn.disabled = true;
        runBtn.innerText = "⏳ 리뷰 선별 중...";
        try {
            const category = catSelect.value;
            const result = await findAndPrepareReplyBatch(category);
            if (result.status === "READY") {
                runBtn.innerText = `✅ 답글 ${result.count}건 입력 완료`;
                return;
            }

            runBtn.innerText = "▶ 답글 작성 테스트";
            if (result.status === "EMPTY") {
                alert(`${result.checkedPages}페이지에서 ${result.checkedReviews}건을 검사했습니다. 마지막 페이지까지 답글 작성 가능한 리뷰가 없습니다.`);
                return;
            }
            if (result.status === "PAGER_UNCONFIRMED") {
                alert(`${result.checkedPages}페이지에서 ${result.checkedReviews}건을 검사했지만 작성 대상이 없었습니다. 다음 페이지 버튼을 확인하지 못했습니다.`);
                return;
            }
            const messages = {
                WAIT: noReviewsMessage,
                PAGE_REPEAT: "같은 리뷰 페이지가 다시 표시되어 탐색을 중단했습니다.",
                PAGE_CHANGE_FAILED: "다음 페이지의 리뷰가 표시되는지 확인하지 못했습니다.",
                SELECTION_FAILED: "답글 대상 리뷰 전체를 선택하지 못해 작성창을 열지 않았습니다.",
                NO_BUTTON: "스마트스토어의 답글작성 버튼을 찾지 못했습니다.",
                NO_REPLY_FIELD: "일괄 답글 창의 두 번째 입력칸을 확인하지 못했습니다.",
                REVIEW_NUMBER_MISMATCH: "선택한 리뷰와 답글 창에 표시된 리뷰 글번호가 일치하지 않아 중단했습니다."
            };
            alert(messages[result.status] || "답글 작성창을 준비하지 못했습니다.");
        } catch (error) {
            runBtn.innerText = "▶ 답글 작성 테스트";
            alert(`답글 작성 준비 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            preparingReply = false;
            runBtn.disabled = false;
        }
    };
})();
