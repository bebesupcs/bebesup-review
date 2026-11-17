// ========================================================
// 🌿 베베숲(Bebesup) 스마트스토어 카테고리별 답글 도우미 (안전 테스트 모드)
// ========================================================

(function initBebesupHelper() {
    if (document.getElementById("bebesup-helper-panel")) return;

    // 상단 플로팅 컨트롤 바 생성
    const panel = document.createElement("div");
    panel.id = "bebesup-helper-panel";
    panel.style.cssText = `
        position: fixed;
        top: 15px;
        right: 80px;
        z-index: 99999999;
        background: #ffffff;
        border: 2px solid #00b050;
        padding: 6px 14px;
        border-radius: 30px;
        box-shadow: 0 4px 20px rgba(0, 176, 80, 0.35);
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif;
    `;

    panel.innerHTML = `
        <span style="font-weight:bold; color:#00b050; font-size:13px;">🌿 베베숲 AI</span>
        
        <!-- 카테고리 선택 -->
        <select id="bebesup-target-cat" style="font-size:12px; padding:4px 8px; border-radius:15px; border:1px solid #ccc; outline:none; font-weight:bold;">
            <option value="WIPES">🌿 물티슈만 모아서 테스트</option>
            <option value="SKINCARE">💧 스킨케어만 모아서 테스트</option>
            <option value="DETERGENT">🫧 세제/생활용품만 모아서 테스트</option>
        </select>

        <!-- 모드 선택 (기본: 눈으로 확인하는 안전 테스트 모드!) -->
        <select id="bebesup-run-mode" style="font-size:12px; padding:4px 8px; border-radius:15px; border:1.5px solid #f57c00; color:#e65100; outline:none; font-weight:bold; background:#fff8e1;">
            <option value="TEST">👀 눈으로 확인 모드 (등록버튼 안 누름)</option>
            <option value="REAL">🚀 실제 자동등록 모드 (등록까지 100% 자동)</option>
        </select>

        <button id="bebesup-run-btn" style="background:#00b050; color:white; border:none; padding:7px 16px; border-radius:20px; font-size:12px; font-weight:bold; cursor:pointer; transition:all 0.2s;">
            ▶ 실행
        </button>
    `;

    document.body.appendChild(panel);

    const runBtn = panel.querySelector("#bebesup-run-btn");
    const catSelect = panel.querySelector("#bebesup-target-cat");
    const modeSelect = panel.querySelector("#bebesup-run-mode");

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    runBtn.onclick = async () => {
        const category = catSelect.value;
        const runMode = modeSelect.value;

        let catLabel = "물티슈";
        // 🌿 물티슈 전용 공식 답글
        let replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n언제나 아기 피부에 닿는 만큼 더욱 순하고 도톰하게 정성을 담겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";

        if (category === "SKINCARE") {
            catLabel = "스킨케어";
            // 💧 스킨케어 전용 공식 답글
            replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n우리 아이 피부를 촉촉하고 순하게 지켜줄 수 있도록 늘 엄선된 성분으로 보답하겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";
        } else if (category === "DETERGENT") {
            catLabel = "세제/생활";
            // 🫧 세제/생활용품 전용 공식 답글
            replyMsg = "안녕하세요. 베베숲입니다. 소중한 리뷰 감사드립니다.\n온 가족 안심 세탁을 위해 깨끗한 세정력과 순한 안심 성분으로 보답하겠습니다.\n궁금한 점이 생기시면 언제든 편하게 말씀해 주세요😊\n앞으로도 만족스러운 경험을 드릴 수 있도록 노력하겠습니다💚";
        }

        // ag-Grid API 호출
        const gridEl = document.querySelector(".ag-root-wrapper") || document.querySelector(".ag-root") || document.querySelector("[role='grid']");
        let api = null;
        if (gridEl && gridEl.__agComponent) {
            api = gridEl.__agComponent.gridOptions?.api || gridEl.__agComponent.gridApi;
        }
        if (!api && window.angular) {
            const scope = window.angular.element(gridEl || document.querySelector(".ag-theme-balham") || document.querySelector("div[ui-view]")).scope();
            api = scope?.gridOptions?.api || scope?.gridApi || scope?.vm?.gridOptions?.api;
        }

        if (!api) {
            return alert("⚠️ 스마트스토어 리뷰 목록 테이블을 찾지 못했습니다.");
        }

        // 부정어 사전 (원단크기, 두께, 배송파손 등)
        const badWords = [
            "헐거", "열려", "안닫", "스티커", "뚜껑", "캡이", "캡 헐", "캡 열", "캡 안",
            "마름", "물기", "말라", "터져", "찌그러", "파손", "찢", "불량", "냄새", "이물", "아쉽", "별로",
            "작아", "작네", "작은", "사이즈", "얇아", "얇네", "얇음", "너무 얇", "두께 아쉽", "비쳐", "비침"
        ];

        api.deselectAll();
        let selectedCount = 0;
        let skippedBad = 0;
        let skippedLow = 0;

        api.forEachNode(node => {
            if (selectedCount >= 50) return;
            const d = node.data || {};
            const rowEl = document.querySelector(`.ag-row[row-id="${node.id}"], .ag-row[row-index="${node.rowIndex}"]`);
            const rowText = rowEl ? rowEl.innerText : JSON.stringify(d);

            // 1. 1~3점 평점 스킵
            const score = Number(d.reviewScore || d.score || d.starScore || 0);
            const isLow = (score > 0 && score < 4) || rowText.includes("★ 1") || rowText.includes("★ 2") || rowText.includes("★ 3") || rowText.includes("★★★☆☆");
            if (isLow) {
                skippedLow++;
                return;
            }

            // 2. 부정 키워드 스킵
            const reviewText = String(d.content || d.reviewContent || d.reviewBody || rowText);
            if (badWords.some(w => reviewText.includes(w))) {
                skippedBad++;
                return;
            }

            // 3. ⭐ 카테고리 엄격 분리! (선택한 카테고리 상품만 정확히 골라 담음)
            const prodName = String(d.productName || d.channelProductName || rowText);
            const isSkincare = prodName.includes("로션") || prodName.includes("크림") || prodName.includes("수딩") || prodName.includes("바스") || prodName.includes("샴푸") || prodName.includes("스킨");
            const isDetergent = prodName.includes("세제") || prodName.includes("유연제") || prodName.includes("세정제") || prodName.includes("비누");

            if (category === "SKINCARE" && !isSkincare) return;
            if (category === "DETERGENT" && !isDetergent) return;
            if (category === "WIPES" && (isSkincare || isDetergent)) return;

            node.setSelected(true, false);
            selectedCount++;
        });

        if (selectedCount === 0) {
            return alert(`🛡️ 현재 화면에 [${catLabel}] 카테고리의 답글 대상 칭찬 리뷰가 없습니다!\n(불만글: ${skippedBad}건 제외됨)`);
        }

        runBtn.innerText = `⏳ [${catLabel}] 여는 중...`;

        // [답글작성] 클릭
        const replyBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText && b.innerText.trim() === "답글작성");
        if (!replyBtn) return;
        replyBtn.click();
        await sleep(1200);

        // 모달창 내 [답글 내용] 주입
        const modal = document.querySelector(".modal-content, div.modal, [role='dialog']");
        if (!modal) return;

        const tas = modal.querySelectorAll("textarea");
        const replyBox = tas.length >= 2 ? tas[1] : tas[0];

        if (replyBox) {
            replyBox.focus();
            document.execCommand('insertText', false, replyMsg);
            replyBox.dispatchEvent(new Event('input', { bubbles: true }));
            replyBox.dispatchEvent(new Event('change', { bubbles: true }));

            runBtn.innerText = `✅ [${catLabel}] ${selectedCount}개 완료!`;
            setTimeout(() => { runBtn.innerText = "▶ 실행"; }, 3000);

            // 🛡️ 모드에 따른 분기:
            if (runMode === "REAL") {
                // 실제 등록 모드일 때만 [등록] 클릭
                await sleep(800);
                const submitBtn = Array.from(modal.querySelectorAll("button")).find(b => b.innerText && b.innerText.trim() === "등록");
                if (submitBtn) {
                    submitBtn.click();
                    await sleep(1000);
                    const confirmBtn = Array.from(document.querySelectorAll("div.modal button, button")).find(b => b.innerText && b.innerText.trim() === "확인");
                    if (confirmBtn) confirmBtn.click();
                }
            } else {
                // 👀 [안전 테스트 모드]: 등록 버튼 누르지 않고 팝업창을 열어둔 채 멈춤!
                console.log(`[테스트 완료] ${catLabel} 맞춤 문구 주입 완료. 등록하지 않고 대기합니다.`);
            }
        }
    };
})();
