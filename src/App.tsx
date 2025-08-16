import React, {useState, useEffect} from "react"
import {LeftSidebar} from "@/ui/Navigation/LeftSidebar.tsx"
import {Homepage} from "@/ui/Homepage/Homepage.tsx"
import {TerminalView} from "@/ui/SSH/Terminal/TerminalView.tsx"
import {SSHTunnel} from "@/ui/SSH/Tunnel/SSHTunnel.tsx"
import {ConfigEditor} from "@/ui/SSH/Config Editor/ConfigEditor.tsx"
import {SSHManager} from "@/ui/SSH/Manager/SSHManager.tsx"
import {TabProvider, useTabs} from "@/contexts/TabContext"
import axios from "axios"
import {TopNavbar} from "@/ui/Navigation/TopNavbar.tsx";

const apiBase = import.meta.env.DEV ? "http://localhost:8081/users" : "/users";
const API = axios.create({baseURL: apiBase});

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

function AppContent() {
    const [view, setView] = useState<string>("homepage")
    const [mountedViews, setMountedViews] = useState<Set<string>>(new Set(["homepage"]))
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [username, setUsername] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)
    const [isTopbarOpen, setIsTopbarOpen] = useState<boolean>(true)
    const {currentTab, tabs} = useTabs();

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

    const handleAuthSuccess = (authData: { isAdmin: boolean; username: string | null; userId: string | null }) => {
        setIsAuthenticated(true)
        setIsAdmin(authData.isAdmin)
        setUsername(authData.username)
    }

    // Determine what to show based on current tab
    const currentTabData = tabs.find(tab => tab.id === currentTab);
    const showTerminalView = currentTabData?.type === 'terminal' || currentTabData?.type === 'server';
    const showHome = currentTabData?.type === 'home';
    const showSshManager = currentTabData?.type === 'ssh_manager';
    
    console.log('Current tab:', currentTab);
    console.log('Current tab data:', currentTabData);
    console.log('Show terminal view:', showTerminalView);
    console.log('All tabs:', tabs);

    return (
        <div>
            {/* Enhanced background overlay - detailed pattern when not authenticated */}
            {!isAuthenticated && !authLoading && (
                <div 
                    className="fixed inset-0 bg-gradient-to-br from-background via-muted/20 to-background z-[9999]"
                    aria-hidden="true"
                >
                    {/* Diagonal stripes pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 20px,
                                hsl(var(--primary) / 0.4) 20px,
                                hsl(var(--primary) / 0.4) 40px
                            )`
                        }} />
                    </div>
                    
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px),
                                            linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }} />
                    </div>
                    
                    {/* Radial gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60" />
                </div>
            )}
            
            {/* Show login form directly when not authenticated */}
            {!isAuthenticated && !authLoading && (
                <div className="fixed inset-0 flex items-center justify-center z-[10000]">
                    <Homepage 
                        onSelectView={handleSelectView}
                        isAuthenticated={isAuthenticated}
                        authLoading={authLoading}
                        onAuthSuccess={handleAuthSuccess}
                        isTopbarOpen={isTopbarOpen}
                    />
                </div>
            )}
            
            {/* Show sidebar layout only when authenticated */}
            {isAuthenticated && (
                <LeftSidebar
                    onSelectView={handleSelectView}
                    disabled={!isAuthenticated || authLoading}
                    isAdmin={isAdmin}
                    username={username}
                >
                    {/* Always render TerminalView to maintain terminal persistence */}
                    <div
                        className="h-screen w-full"
                        style={{
                            visibility: showTerminalView ? "visible" : "hidden",
                            pointerEvents: showTerminalView ? "auto" : "none",
                            height: showTerminalView ? "100vh" : 0,
                            width: showTerminalView ? "100%" : 0,
                            position: showTerminalView ? "static" : "absolute",
                            overflow: "hidden",
                        }}
                    >
                        <TerminalView isTopbarOpen={isTopbarOpen} />
                    </div>
                    
                    {/* Always render Homepage to keep it mounted */}
                    <div
                        className="h-screen w-full"
                        style={{
                            visibility: showHome ? "visible" : "hidden",
                            pointerEvents: showHome ? "auto" : "none",
                            height: showHome ? "100vh" : 0,
                            width: showHome ? "100%" : 0,
                            position: showHome ? "static" : "absolute",
                            overflow: "hidden",
                        }}
                    >
                        <Homepage 
                            onSelectView={handleSelectView}
                            isAuthenticated={isAuthenticated}
                            authLoading={authLoading}
                            onAuthSuccess={handleAuthSuccess}
                            isTopbarOpen={isTopbarOpen}
                        />
                    </div>

                    {/* Always render SSH Manager but toggle visibility for persistence */}
                    <div
                        className="h-screen w-full"
                        style={{
                            visibility: showSshManager ? "visible" : "hidden",
                            pointerEvents: showSshManager ? "auto" : "none",
                            height: showSshManager ? "100vh" : 0,
                            width: showSshManager ? "100%" : 0,
                            position: showSshManager ? "static" : "absolute",
                            overflow: "hidden",
                        }}
                    >
                        <SSHManager onSelectView={handleSelectView} isTopbarOpen={isTopbarOpen} />
                    </div>
                    
                    {/* Legacy views - keep for compatibility (exclude homepage to avoid duplicate mounts) */}
                    {mountedViews.has("ssh_manager") && (
                        <div style={{display: view === "ssh_manager" ? "block" : "none"}}>
                            <SSHManager onSelectView={handleSelectView} isTopbarOpen={isTopbarOpen}/>
                        </div>
                    )}
                    {mountedViews.has("terminal") && (
                        <div style={{display: view === "terminal" ? "block" : "none"}}>
                            <Terminal onSelectView={handleSelectView}/>
                        </div>
                    )}
                    {mountedViews.has("tunnel") && (
                        <div style={{display: view === "tunnel" ? "block" : "none"}}>
                            <SSHTunnel onSelectView={handleSelectView}/>
                        </div>
                    )}
                    {mountedViews.has("config_editor") && (
                        <div style={{display: view === "config_editor" ? "block" : "none"}}>
                            <ConfigEditor onSelectView={handleSelectView}/>
                        </div>
                    )}
                    <TopNavbar isTopbarOpen={isTopbarOpen} setIsTopbarOpen={setIsTopbarOpen}/>
                </LeftSidebar>
            )}
        </div>
    )
}

function App() {
    return (
        <TabProvider>
            <AppContent />
        </TabProvider>
    );
}

export default App