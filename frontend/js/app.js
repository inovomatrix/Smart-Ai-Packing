/**
 * PackSmart AI — Main SPA Application Entrypoint
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { auth } from "./auth.js";
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

    // Close mobile drawer if open
    const sidebar = document.getElementById("app-sidebar");
    if (sidebar) sidebar.classList.remove("mobile-open");
}

window.navigateToView = navigateToView;

document.addEventListener("DOMContentLoaded", async () => {
    setupNavigation();
    setupAuthModal();
    setupMobileDrawer();

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
