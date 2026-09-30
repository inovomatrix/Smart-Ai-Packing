/**
 * PackSmart AI — Main SPA Application Entrypoint
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { auth } from "./auth.js";
import { API } from "./api.js";
import { loadDashboard } from "./dashboard.js";
import { initAnalysisWizard } from "./analysis.js";
import { displayRecommendationResults } from "./recommendation.js";
import { initSimulator, loadWhatIfFromAnalysis } from "./simulator.js";
import { initComparison } from "./comparison.js";
import { initDatabases } from "./database.js";
import { initSustainability } from "./sustainability.js";
import { initCostOptimizer } from "./cost.js";
import { initShelfLifeEstimator } from "./shelf_life.js";
import { initHistory, loadHistoryTable } from "./history.js";
import { initDemoScenarios } from "./demo.js";

// Modern Toast Notification Utility
export function showToast(message, type = "info", duration = 3800) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const iconMap = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ"
    };

    toast.innerHTML = `
        <span class="toast-icon">${iconMap[type] || "ℹ"}</span>
        <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-hide");
        setTimeout(() => toast.remove(), 250);
    }, duration);
}
window.showToast = showToast;

// Forward native window.alert to sleek modern toast
window.alert = function(msg) {
    const isErr = msg.toLowerCase().includes("error") || msg.toLowerCase().includes("failed");
    const isWarn = msg.toLowerCase().includes("please") || msg.toLowerCase().includes("maximum");
    const isSucc = msg.toLowerCase().includes("successfully") || msg.toLowerCase().includes("passed");
    const type = isErr ? "error" : (isWarn ? "warning" : (isSucc ? "success" : "info"));
    showToast(msg, type);
};

// Global modern styling for Chart.js
if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = "#64748b";
    Chart.defaults.plugins.tooltip.backgroundColor = "#090d16";
    Chart.defaults.plugins.tooltip.titleColor = "#ffffff";
    Chart.defaults.plugins.tooltip.bodyColor = "#cbd5e1";
    Chart.defaults.plugins.tooltip.borderColor = "rgba(255, 255, 255, 0.1)";
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
}

// Make global helpers accessible to inline calls
window.displayRecommendationResults = displayRecommendationResults;
window.loadWhatIfFromAnalysis = loadWhatIfFromAnalysis;

let activeView = "dashboard";

export function navigateToView(viewId) {
    activeView = viewId;

    // Toggle view containers
    document.querySelectorAll(".spa-view").forEach(v => v.classList.remove("active"));
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
        targetView.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Toggle sidebar nav items
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("data-view") === viewId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Lazy data reloads
    if (viewId === "dashboard") loadDashboard();
    if (viewId === "history") loadHistoryTable();
    if (viewId === "sustainability") initSustainability();
    if (viewId === "cost") initCostOptimizer();
    if (viewId === "admin") updateAdminDiagnostics();

    // Close mobile drawer if open
    const sidebar = document.getElementById("app-sidebar");
    if (sidebar) sidebar.classList.remove("mobile-open");
}

window.navigateToView = navigateToView;

document.addEventListener("DOMContentLoaded", async () => {
    setupNavigation();
    setupAuthModal();
    setupMobileDrawer();
    setupSettingsPanel();

    // Initialize all modules
    await initAnalysisWizard();
    await loadDashboard();
    await initSimulator();
    await initComparison();
    await initDatabases();
    await initSustainability();
    await initCostOptimizer();
    await initShelfLifeEstimator();
    await initHistory();
    initDemoScenarios();
    updateAdminDiagnostics();
});

function setupNavigation() {
    // Sidebar nav links
    document.querySelectorAll(".nav-item[data-view]").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.getAttribute("data-view");
            navigateToView(view);
        });
    });

    // CTA buttons
    const ctaNewAnalysis = document.getElementById("cta-new-analysis");
    if (ctaNewAnalysis) {
        ctaNewAnalysis.addEventListener("click", () => navigateToView("analysis"));
    }
}

function setupMobileDrawer() {
    const hamburger = document.getElementById("btn-mobile-menu");
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("mobile-drawer-overlay");

    if (hamburger && sidebar) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
            if (overlay) overlay.classList.toggle("active");
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("mobile-open");
            overlay.classList.remove("active");
        });
    }
}

function setupAuthModal() {
    const modal = document.getElementById("modal-auth");
    const openBtn = document.getElementById("header-login-btn");
    const closeBtn = document.getElementById("btn-close-auth-modal");
    const demoBypassBtn = document.getElementById("btn-auth-demo-bypass");
    const form = document.getElementById("auth-form");
    const toggleLink = document.getElementById("auth-toggle-mode");
    const logoutBtn = document.getElementById("header-logout-btn");

    let isSignUp = false;

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            modal.style.display = "flex";
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    if (demoBypassBtn) {
        demoBypassBtn.addEventListener("click", () => {
            auth.signInDemo();
            if (modal) modal.style.display = "none";
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            auth.signOut();
        });
    }

    if (toggleLink) {
        toggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            isSignUp = !isSignUp;
            document.getElementById("auth-modal-title").textContent = isSignUp ? "Create PackSmart AI Account" : "Sign In to PackSmart AI";
            document.getElementById("auth-submit-btn").textContent = isSignUp ? "Create Account" : "Sign In";
            document.getElementById("auth-fullname-group").style.display = isSignUp ? "block" : "none";
            toggleLink.textContent = isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up";
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("auth-email").value;
            const password = document.getElementById("auth-password").value;
            const fullName = document.getElementById("auth-fullname")?.value;

            try {
                if (isSignUp) {
                    await auth.signUp(email, password, fullName);
                } else {
                    await auth.signIn(email, password);
                }
                if (modal) modal.style.display = "none";
                form.reset();
            } catch (err) {
                alert(`Authentication error: ${err.message}`);
            }
        });
    }

    // Close on backdrop click for all modals
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            e.target.style.display = "none";
        }
    });
}

function setupSettingsPanel() {
    const input = document.getElementById("settings-api-url-input");
    const testBtn = document.getElementById("btn-settings-test-api");
    const saveBtn = document.getElementById("btn-settings-save-api");
    const resetBtn = document.getElementById("btn-settings-reset-api");
    const resultText = document.getElementById("settings-api-test-result");
    const badge = document.getElementById("settings-api-status-badge");

    const currentUrl = API.getApiBaseUrl();
    if (input && currentUrl) {
        input.value = currentUrl;
    }

    function updateBadge() {
        const url = API.getApiBaseUrl();
        if (badge) {
            if (url) {
                const displayHost = url.replace(/^https?:\/\//, "").substring(0, 30);
                badge.textContent = `● Custom Backend: ${displayHost}`;
                badge.className = "badge badge-info";
            } else {
                badge.textContent = "● Embedded Engine & Fallback Active";
                badge.className = "badge badge-success";
            }
        }
    }
    updateBadge();

    if (testBtn) {
        testBtn.addEventListener("click", async () => {
            const url = input ? input.value : "";
            testBtn.disabled = true;
            testBtn.textContent = "Testing...";
            if (resultText) resultText.textContent = "Connecting to API endpoint...";

            const res = await API.testConnection(url);
            testBtn.disabled = false;
            testBtn.textContent = "Test Connection";

            if (resultText) {
                resultText.style.color = res.success ? "#059669" : "#dc2626";
                resultText.textContent = res.success 
                    ? `✓ Connection Success: ${res.message}` 
                    : `✕ Connection Notice: ${res.message}. The web app will continue using the embedded scientific dataset.`;
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const url = input ? input.value.trim() : "";
            API.setApiBaseUrl(url);
            updateBadge();
            showToast(url ? `Backend API URL saved: ${url}` : "Reset to embedded scientific dataset & relative API.", "success");
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (input) input.value = "";
            API.setApiBaseUrl("");
            updateBadge();
            if (resultText) resultText.textContent = "";
            showToast("Reset to Cloudflare Standalone Mode with embedded scientific dataset.", "info");
        });
    }
}

async function updateAdminDiagnostics() {
    try {
        const commodities = await API.fetchCommodities();
        const materials = await API.fetchMaterials();

        const commEl = document.getElementById("settings-count-commodities");
        if (commEl) commEl.textContent = `${commodities.length} Food Commodities`;

        const matEl = document.getElementById("settings-count-materials");
        if (matEl) matEl.textContent = `${materials.length} ASTM Materials`;
    } catch (e) {
        console.warn("[Admin] Diagnostic count update error:", e);
    }
}
