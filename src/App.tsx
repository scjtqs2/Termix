import React from "react"

import {Homepage} from "@/apps/Homepage/Homepage.tsx"
import {SSH} from "@/apps/SSH/Terminal/SSH.tsx"
import {SSHTunnel} from "@/apps/SSH/Tunnel/SSHTunnel.tsx";
import {ConfigEditor} from "@/apps/SSH/Config Editor/ConfigEditor.tsx";
import {SSHManager} from "@/apps/SSH/Manager/SSHManager.tsx"

function App() {
    const [view, setView] = React.useState<string>("homepage")
    const [mountedViews, setMountedViews] = React.useState<Set<string>>(new Set(["homepage"]))

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
        <div className="flex min-h-svh w-full">
            <main className="flex-1 w-full">
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
                        <SSH onSelectView={handleSelectView} />
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
            </main>
        </div>
    )
}

export default App