import {HomepageSidebar} from "@/apps/Homepage/HomepageSidebar.tsx";
import React, {useEffect, useState} from "react";
import {HomepageAuth} from "@/apps/Homepage/HomepageAuth.tsx";
import axios from "axios";
import {HomepageUpdateLog} from "@/apps/Homepage/HompageUpdateLog.tsx";
import {HomepageWelcomeCard} from "@/apps/Homepage/HomepageWelcomeCard.tsx";

interface HomepageProps {
    onSelectView: (view: string) => void;
}

function setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name: string) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, "");
}

const apiBase = import.meta.env.DEV ? "http://localhost:8081/users" : "/users";

const API = axios.create({
    baseURL: apiBase,
});

export function Homepage({onSelectView}: HomepageProps): React.ReactElement {
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);
    const [showWelcomeCard, setShowWelcomeCard] = useState(true);

    useEffect(() => {
        const jwt = getCookie("jwt");
        const welcomeHidden = getCookie("welcome_hidden");

        if (jwt) {
            setAuthLoading(true);
            Promise.all([
                API.get("/me", {headers: {Authorization: `Bearer ${jwt}`}}),
                API.get("/db-health")
            ])
                .then(([meRes]) => {
                    setLoggedIn(true);
                    setIsAdmin(!!meRes.data.is_admin);
                    setUsername(meRes.data.username || null);
                    setDbError(null);
                    setShowWelcomeCard(welcomeHidden !== "true");
                })
                .catch((err) => {
                    setLoggedIn(false);
                    setIsAdmin(false);
                    setUsername(null);
                    setCookie("jwt", "", -1);
                    if (err?.response?.data?.error?.includes("Database")) {
                        setDbError("Could not connect to the database. Please try again later.");
                    } else {
                        setDbError(null);
                    }
                })
                .finally(() => setAuthLoading(false));
        } else {
            setAuthLoading(false);
        }
    }, []);

    const handleHideWelcomeCard = () => {
        setShowWelcomeCard(false);
        setCookie("welcome_hidden", "true", 365 * 10);
    };

    return (
        <HomepageSidebar
            onSelectView={onSelectView}
            disabled={!loggedIn || authLoading}
            isAdmin={isAdmin}
            username={loggedIn ? username : null}
        >
            <div className="w-full min-h-svh grid place-items-center">
                <div className="flex flex-row items-center justify-center gap-8">
                    <HomepageAuth
                        setLoggedIn={setLoggedIn}
                        setIsAdmin={setIsAdmin}
                        setUsername={setUsername}
                        loggedIn={loggedIn}
                        authLoading={authLoading}
                        dbError={dbError}
                        setDbError={setDbError}
                    />
                    <HomepageUpdateLog
                        loggedIn={loggedIn}
                    />
                </div>

                {loggedIn && !authLoading && showWelcomeCard && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                        <HomepageWelcomeCard onHidePermanently={handleHideWelcomeCard}/>
                    </div>
                )}
            </div>
        </HomepageSidebar>
    );
}