import React, {useEffect, useState} from "react";
import {HomepageAuth} from "@/ui/Homepage/HomepageAuth.tsx";
import axios from "axios";
import {HomepageUpdateLog} from "@/ui/Homepage/HompageUpdateLog.tsx";
import {HomepageAlertManager} from "@/ui/Homepage/HomepageAlertManager.tsx";

interface HomepageProps {
    onSelectView: (view: string) => void;
}

function getCookie(name: string) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, "");
}

function setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

const apiBase = import.meta.env.DEV ? "http://localhost:8081/users" : "/users";

const API = axios.create({
    baseURL: apiBase,
});

export function Homepage({onSelectView}: HomepageProps): React.ReactElement {
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);

    useEffect(() => {
        const jwt = getCookie("jwt");

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
                    setUserId(meRes.data.userId || null);
                    setDbError(null);
                })
                .catch((err) => {
                    setLoggedIn(false);
                    setIsAdmin(false);
                    setUsername(null);
                    setUserId(null);
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

    return (
        <div className="w-full min-h-svh grid place-items-center">
            <div className="flex flex-row items-center justify-center gap-8">
                <HomepageAuth
                    setLoggedIn={setLoggedIn}
                    setIsAdmin={setIsAdmin}
                    setUsername={setUsername}
                    setUserId={setUserId}
                    loggedIn={loggedIn}
                    authLoading={authLoading}
                    dbError={dbError}
                    setDbError={setDbError}
                />
                <HomepageUpdateLog
                    loggedIn={loggedIn}
                />
            </div>

            <HomepageAlertManager
                userId={userId}
                loggedIn={loggedIn}
            />
        </div>
    );
}