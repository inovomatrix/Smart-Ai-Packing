/**
 * PackSmart AI — Authentication Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { supabase, IS_LIVE_SUPABASE } from "./supabase-config.js";

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        if (IS_LIVE_SUPABASE && supabase) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    this.currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
                        role: "user"
                    };
                }
                supabase.auth.onAuthStateChange((_event, session) => {
                    if (session?.user) {
                        this.currentUser = {
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
                            role: "user"
                        };
                    } else {
                        this.currentUser = null;
                    }
                    this.updateUI();
                });
            } catch (e) {
                console.warn("[Auth] Live auth check error:", e);
            }
        }

        // Check if demo user saved in localStorage
        if (!this.currentUser) {
            const saved = localStorage.getItem("packsmart_user");
            if (saved) {
                try {
                    this.currentUser = JSON.parse(saved);
                } catch (_) {}
            } else {
                // Auto-seed default evaluator session for instant SIH judging
                this.signInDemo();
            }
        }

        this.updateUI();
    }

    async signIn(email, password) {
        if (IS_LIVE_SUPABASE && supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            this.currentUser = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.full_name || email.split("@")[0],
                role: "user"
            };
            localStorage.setItem("packsmart_user", JSON.stringify(this.currentUser));
            if (data.session) localStorage.setItem("packsmart_token", data.session.access_token);
        } else {
            // Local mode
            this.currentUser = {
                id: "evaluator-" + Math.random().toString(36).substring(7),
                email: email,
                name: email.split("@")[0],
                role: "evaluator"
            };
            localStorage.setItem("packsmart_user", JSON.stringify(this.currentUser));
            localStorage.setItem("packsmart_token", "evaluator-jwt-token");
        }
        this.updateUI();
        return this.currentUser;
    }

    async signUp(email, password, fullName) {
        if (IS_LIVE_SUPABASE && supabase) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            });
            if (error) throw error;
            this.currentUser = {
                id: data.user.id,
                email: data.user.email,
                name: fullName || email.split("@")[0],
                role: "user"
            };
            localStorage.setItem("packsmart_user", JSON.stringify(this.currentUser));
        } else {
            this.currentUser = {
                id: "evaluator-" + Math.random().toString(36).substring(7),
                email: email,
                name: fullName || email.split("@")[0],
                role: "evaluator"
            };
            localStorage.setItem("packsmart_user", JSON.stringify(this.currentUser));
            localStorage.setItem("packsmart_token", "evaluator-jwt-token");
        }
        this.updateUI();
        return this.currentUser;
    }

    signInDemo() {
        this.currentUser = {
            id: "sih-judge-evaluator",
            email: "judge@sih2026.gov.in",
            name: "SIH 2026 Evaluator",
            role: "Judge / Evaluator"
        };
        localStorage.setItem("packsmart_user", JSON.stringify(this.currentUser));
        localStorage.setItem("packsmart_token", "sih-judge-bypass-jwt");
        this.updateUI();
        return this.currentUser;
    }

    async signOut() {
        if (IS_LIVE_SUPABASE && supabase) {
            try {
                await supabase.auth.signOut();
            } catch (_) {}
        }
        this.currentUser = null;
        localStorage.removeItem("packsmart_user");
        localStorage.removeItem("packsmart_token");
        this.updateUI();
    }

    updateUI() {
        const userChip = document.getElementById("header-user-chip");
        const loginBtn = document.getElementById("header-login-btn");
        const userNameSpan = document.getElementById("user-display-name");

        if (this.currentUser) {
            if (userChip) userChip.style.display = "flex";
            if (loginBtn) loginBtn.style.display = "none";
            if (userNameSpan) userNameSpan.textContent = this.currentUser.name;
        } else {
            if (userChip) userChip.style.display = "none";
            if (loginBtn) loginBtn.style.display = "flex";
        }
    }
}

export const auth = new AuthManager();
