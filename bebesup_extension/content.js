// ========================================================
// 🌿 [베베숲 AI 리뷰 어시스턴트] GitHub 핫패치(Hot-Patch) 원격 자동 로더
// - 역할: 스마트스토어 접속 시 GitHub의 최신 content_core.js를 실시간 로드
// - 오프라인/지연 시: 로컬 캐시 및 내장 코드로 0초 즉시 폴백(Fallback) 안전 구동
// ========================================================
(async function() {
    // GitHub Raw URL & jsDelivr CDN URL (캐시버스팅 포함)
    const GITHUB_RAW_URL = "https://raw.githubusercontent.com/bebesupcs/bebesup-review/main/bebesup_extension/content_core.js";
    const JSDELIVR_CDN_URL = "https://cdn.jsdelivr.net/gh/bebesupcs/bebesup-review@main/bebesup_extension/content_core.js";
    const CACHE_KEY = "bebesup_hotpatch_code";
    const VERSION_KEY = "bebesup_hotpatch_time";

    function executeScriptCode(code) {
        try {
            const scriptEl = document.createElement("script");
            scriptEl.type = "text/javascript";
            scriptEl.textContent = code;
            (document.head || document.documentElement || document.body).appendChild(scriptEl);
            scriptEl.remove();
            return true;
        } catch(e) {
            console.error("[베베숲 AI] 스크립트 실행 오류:", e);
            return false;
        }
    }

    async function fetchRemoteCode(url, timeoutMs = 2500) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(url + "?t=" + Date.now(), {
                signal: controller.signal,
                cache: "no-store"
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const text = await res.text();
                if (text && text.includes("베베숲 AI") && text.length > 5000) {
                    return text;
                }
            }
        } catch(e) {}
        return null;
    }

    // 전역 수동 강제 업데이트 함수
    window.__BEBESUP_FORCE_UPDATE__ = async function() {
        const btn = document.querySelector("#bebesup-update-check-btn");
        if (btn) btn.innerText = "⏳";
        let freshCode = await fetchRemoteCode(GITHUB_RAW_URL, 4000);
        if (!freshCode) freshCode = await fetchRemoteCode(JSDELIVR_CDN_URL, 4000);

        if (freshCode) {
            localStorage.setItem(CACHE_KEY, freshCode);
            localStorage.setItem(VERSION_KEY, String(Date.now()));
            alert("🎉 [베베숲 AI] 깃허브 최신 패치가 성공적으로 다운로드되었습니다!\n\n화면을 새로고침(F5)하여 최신 버전으로 실행합니다.");
            location.reload();
        } else {
            alert("ℹ️ 현재 깃허브와 정상 연결되어 있으며 이미 최신 상태이거나, 인터넷 연결을 확인해 주세요.");
            if (btn) btn.innerText = "🔄";
        }
    };

    // 1. 실행 로직: 로컬 번들 파일과 캐시 코드 중 최신 버전 우선 실행
    let localCode = null;
    try {
        const localRes = await fetch(chrome.runtime.getURL("content_core.js"));
        if (localRes.ok) localCode = await localRes.text();
    } catch(e) {}

    const cachedCode = localStorage.getItem(CACHE_KEY);

    function parseVer(code) {
        if (!code) return [0, 0, 0];
        const m = code.match(/v(\d+)\.(\d+)\.(\d+)/);
        return m ? [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)] : [0, 0, 0];
    }
    function isNewer(verA, verB) {
        for (let i = 0; i < 3; i++) {
            if ((verA[i] || 0) > (verB[i] || 0)) return true;
            if ((verA[i] || 0) < (verB[i] || 0)) return false;
        }
        return false;
    }

    const localVer = parseVer(localCode);
    const cachedVer = parseVer(cachedCode);

    let codeToRun = localCode;
    if (cachedCode && isNewer(cachedVer, localVer)) {
        codeToRun = cachedCode;
    } else if (localCode) {
        localStorage.setItem(CACHE_KEY, localCode);
    }

    let isExecuted = false;
    if (codeToRun && codeToRun.length > 5000) {
        isExecuted = executeScriptCode(codeToRun);
    }

    // 2. 백그라운드에서 GitHub 최신 코드가 있는지 확인
    (async () => {
        try {
            let remoteCode = await fetchRemoteCode(GITHUB_RAW_URL, 3000);
            if (!remoteCode) remoteCode = await fetchRemoteCode(JSDELIVR_CDN_URL, 3000);

            if (remoteCode) {
                const hasDiff = !cachedCode || remoteCode !== cachedCode;
                localStorage.setItem(CACHE_KEY, remoteCode);
                localStorage.setItem(VERSION_KEY, String(Date.now()));

                if (!isExecuted) {
                    // 캐시가 없어서 실행 못했던 경우 -> 다운로드받은 코드로 즉시 실행!
                    executeScriptCode(remoteCode);
                    isExecuted = true;
                } else if (hasDiff) {
                    // 이미 캐시로 떴는데 깃허브에 새 버전이 올라온 경우 -> 부드러운 알림 배너 표시
                    console.log("[베베숲 AI] 깃허브에 새로운 패치가 감지되어 캐시가 갱신되었습니다. 다음 새로고침 시 적용됩니다.");
                    const patchBadge = document.querySelector("#bebesup-patch-badge");
                    if (patchBadge) {
                        patchBadge.innerHTML = `<span style="color:#d97706; font-weight:bold; cursor:pointer;" onclick="location.reload()" title="깃허브에 새 패치가 등록되었습니다! 클릭하여 적용">⚡ 새 패치 있음 (F5)</span>`;
                    }
                }
            } else if (!isExecuted) {
                // 원격도 실패하고 캐시도 없는 완전 최초 오프라인 상태 -> 로컬 번들 파일 로드
                loadLocalFallback();
            }
        } catch(err) {
            if (!isExecuted) {
                loadLocalFallback();
            }
        }
    })();

    function loadLocalFallback() {
        try {
            const localScript = document.createElement("script");
            localScript.src = chrome.runtime.getURL("content_core.js");
            (document.head || document.documentElement || document.body).appendChild(localScript);
        } catch(e) {
            console.error("[베베숲 AI] 로컬 폴백 로드 실패:", e);
        }
    }
})();
