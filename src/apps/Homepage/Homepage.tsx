import {HomepageSidebar} from "@/apps/Homepage/HomepageSidebar.tsx";
import React, {useEffect, useState} from "react";
import {HomepageAuth} from "@/apps/Homepage/HomepageAuth.tsx";
import axios from "axios";
import {HomepageUpdateLog} from "@/apps/Homepage/HompageUpdateLog.tsx";

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

const apiBase =
    typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:8081/users"
        : "/users";

const API = axios.create({
    baseURL: apiBase,
});

export function Homepage({onSelectView}: HomepageProps): React.ReactElement {
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
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
                    setDbError(null);
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

    return (
        <div className="flex min-h-screen">
            <HomepageSidebar
                onSelectView={onSelectView}
                disabled={!loggedIn || authLoading}
                isAdmin={isAdmin}
                username={loggedIn ? username : null}
            />
            <div className="flex-1 bg-background grid grid-cols-3 items-center">
                <div className="col-span-1"></div>
                <div className="col-span-1 flex justify-center">
                    <HomepageAuth
                        setLoggedIn={setLoggedIn}
                        setIsAdmin={setIsAdmin}
                        setUsername={setUsername}
                        loggedIn={loggedIn}
                        authLoading={authLoading}
                        dbError={dbError}
                        setDbError={setDbError}
                    />
                </div>
                <div className="col-span-1 flex justify-center">
                    <HomepageUpdateLog
                        loggedIn={loggedIn}
                    />
                </div>
            </div>
        </div>
    );
}