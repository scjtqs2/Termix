import {SSHTabList} from "@/apps/SSH/Terminal/SSHTabList.tsx";
import React from "react";
import {ChevronUp} from "lucide-react";

interface TerminalTab {
    id: number;
    title: string;
}

interface SSHTopbarProps {
    allTabs: TerminalTab[];
    currentTab: number;
    setActiveTab: (tab: number) => void;
    allSplitScreenTab: number[];
    setSplitScreenTab: (tab: number) => void;
    setCloseTab: (tab: number) => void;
    onHideTopbar?: () => void;
}

export function SSHTopbar({
                              allTabs,
                              currentTab,
                              setActiveTab,
                              allSplitScreenTab,
                              setSplitScreenTab,
                              setCloseTab,
                              onHideTopbar
                          }: SSHTopbarProps): React.ReactElement {
    return (
        <div className="flex h-11.5 z-100" style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            backgroundColor: '#18181b',
            borderBottom: '1px solid #222224',
            display: 'flex',
            alignItems: 'center',
        }}>
            <div style={{flex: 1, minWidth: 0, height: '100%', overflowX: 'auto'}}>
                <div style={{minWidth: 'max-content', height: '100%', paddingLeft: 8}}>
                    <SSHTabList
                        allTabs={allTabs}
                        currentTab={currentTab}
                        setActiveTab={setActiveTab}
                        allSplitScreenTab={allSplitScreenTab}
                        setSplitScreenTab={setSplitScreenTab}
                        setCloseTab={setCloseTab}
                    />
                </div>
            </div>
            <div style={{flex: '0 0 auto', paddingRight: 8, paddingLeft: 16}}>
                <button
                    onClick={() => onHideTopbar?.()}
                    style={{
                        height: 28,
                        width: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'hsl(240 5% 9%)',
                        color: 'hsl(240 5% 64.9%)',
                        border: '1px solid hsl(240 3.7% 15.9%)',
                        borderRadius: 6,
                        cursor: 'pointer',
                    }}
                    title="Hide top bar"
                >
                    <ChevronUp size={16} strokeWidth={2}/>
                </button>
            </div>
        </div>
    )
}