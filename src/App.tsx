import React, { useState, useEffect } from "react"
import { Sidebar } from "@/ui/Navigation/Sidebar.tsx"
import { Homepage } from "@/ui/Homepage/Homepage.tsx"
import { Terminal } from "@/ui/SSH/Terminal/Terminal.tsx"
import { SSHTunnel } from "@/ui/SSH/Tunnel/SSHTunnel.tsx"
import { ConfigEditor } from "@/ui/SSH/Config Editor/ConfigEditor.tsx"
import { SSHManager } from "@/ui/SSH/Manager/SSHManager.tsx"
import axios from "axios"

const apiBase = import.meta.env.DEV ? "http://localhost:8081/users" : "/users";
const API = axios.create({ baseURL: apiBase });

function getCookie(name: string) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, "");
}

function App() {
    const [view, setView] = React.useState<string>("homepage")
    const [mountedViews, setMountedViews] = React.useState<Set<string>>(new Set(["homepage"]))
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [username, setUsername] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        const checkAuth = () => {
            const jwt = getCookie("jwt");
            if (jwt) {
                setAuthLoading(true);
                API.get("/me", {headers: {Authorization: `Bearer ${jwt}`}})
                    .then((meRes) => {
                        setIsAuthenticated(true);
                        setIsAdmin(!!meRes.data.is_admin);
                        setUsername(meRes.data.username || null);
                    })
                    .catch((err) => {
                        setIsAuthenticated(false);
                        setIsAdmin(false);
                        setUsername(null);
                        // Clear invalid JWT
                        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    })
                    .finally(() => setAuthLoading(false));
            } else {
                setIsAuthenticated(false);
                setIsAdmin(false);
                setUsername(null);
                setAuthLoading(false);
            }
        }
        
        checkAuth()

        const handleStorageChange = () => checkAuth()
        window.addEventListener('storage', handleStorageChange)
        
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const handleSelectView = (nextView: string) => {
        setMountedViews((prev) => {
            if (prev.has(nextView)) return prev
            const next = new Set(prev)
            next.add(nextView)
            return next
        })
        setView(nextView)
    }

    return (
        <Sidebar
            onSelectView={handleSelectView}
            disabled={!isAuthenticated || authLoading}
            isAdmin={isAdmin}
            username={username}
        >
            {mountedViews.has("homepage") && (
                <div style={{display: view === "homepage" ? "block" : "none"}}>
                    <Homepage onSelectView={handleSelectView} />
                </div>
            )}
            {mountedViews.has("ssh_manager") && (
                <div style={{display: view === "ssh_manager" ? "block" : "none"}}>
                    <SSHManager onSelectView={handleSelectView} />
                </div>
            )}
            {mountedViews.has("terminal") && (
                <div style={{display: view === "terminal" ? "block" : "none"}}>
                    <Terminal onSelectView={handleSelectView} />
                </div>
            )}
            {mountedViews.has("tunnel") && (
                <div style={{display: view === "tunnel" ? "block" : "none"}}>
                    <SSHTunnel onSelectView={handleSelectView} />
                </div>
            )}
            {mountedViews.has("config_editor") && (
                <div style={{display: view === "config_editor" ? "block" : "none"}}>
                    <ConfigEditor onSelectView={handleSelectView} />
                </div>
            )}
        </Sidebar>
    )
}

export default App