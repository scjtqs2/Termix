import React from "react";
import {useSidebar} from "@/components/ui/sidebar";
import {Button} from "@/components/ui/button.tsx";
import {ChevronDown, ChevronUpIcon} from "lucide-react";
import {Tab} from "@/ui/Navigation/Tabs/Tab.tsx";
import {useTabs} from "@/contexts/TabContext";

interface TopNavbarProps {
    isTopbarOpen: boolean;
    setIsTopbarOpen: (open: boolean) => void;
}

export function TopNavbar({isTopbarOpen, setIsTopbarOpen}: TopNavbarProps): React.ReactElement {
    const {state} = useSidebar();
    const {tabs, currentTab, setCurrentTab, setSplitScreenTab, removeTab, allSplitScreenTab} = useTabs() as any;
    const leftPosition = state === "collapsed" ? "26px" : "264px";

    const handleTabActivate = (tabId: number) => {
        setCurrentTab(tabId);
    };

    const handleTabSplit = (tabId: number) => {
        setSplitScreenTab(tabId);
    };

    const handleTabClose = (tabId: number) => {
        removeTab(tabId);
    };

    const isSplitScreenActive = Array.isArray(allSplitScreenTab) && allSplitScreenTab.length > 0;
    const currentTabObj = tabs.find((t: any) => t.id === currentTab);
    const currentTabIsHome = currentTabObj?.type === 'home';
    const currentTabIsSshManager = currentTabObj?.type === 'ssh_manager';

    return (
        <div>
            <div
                className="fixed z-10 h-[50px] bg-[#18181b] border-2 border-[#303032] rounded-lg transition-all duration-200 ease-linear flex flex-row"
                style={{
                    top: isTopbarOpen ? "0.5rem" : "-3rem",
                    left: leftPosition,
                    right: "17px",
                    position: "fixed",
                    transform: "none",
                    margin: "0",
                    padding: "0"
                }}
            >
                <div className="h-full p-1 pr-2 border-r-2 border-[#303032] w-[calc(100%-3rem)] flex items-center overflow-x-auto overflow-y-hidden gap-2 thin-scrollbar">
                    {tabs.map((tab: any) => {
                        const isActive = tab.id === currentTab;
                        const isSplit = Array.isArray(allSplitScreenTab) && allSplitScreenTab.includes(tab.id);
                        const isTerminal = tab.type === 'terminal';
                        const isSshManager = tab.type === 'ssh_manager';
                        // Old logic port:
                        const isSplitButtonDisabled = (isActive && !isSplitScreenActive) || ((allSplitScreenTab?.length || 0) >= 3 && !isSplit);
                        // Disable split entirely when on Home or SSH Manager
                        const disableSplit = isSplitButtonDisabled || isActive || currentTabIsHome || currentTabIsSshManager || isSshManager;
                        const disableActivate = isSplit || ((tab.type === 'home' || tab.type === 'ssh_manager') && isSplitScreenActive);
                        const disableClose = (isSplitScreenActive && isActive) || isSplit;
                        return (
                            <Tab
                                key={tab.id}
                                tabType={tab.type}
                                title={tab.title}
                                isActive={isActive}
                                onActivate={() => handleTabActivate(tab.id)}
                                onClose={isTerminal || isSshManager ? () => handleTabClose(tab.id) : undefined}
                                onSplit={isTerminal ? () => handleTabSplit(tab.id) : undefined}
                                canSplit={isTerminal}
                                canClose={isTerminal || isSshManager}
                                disableActivate={disableActivate}
                                disableSplit={disableSplit}
                                disableClose={disableClose}
                            />
                        );
                    })}
                </div>

                <div className="flex items-center justify-center flex-1">
                    <Button
                        variant="outline"
                        onClick={() => setIsTopbarOpen(false)}
                        className="w-[28px] h-[28]"
                    >
                        <ChevronUpIcon/>
                    </Button>
                </div>
            </div>

            {!isTopbarOpen && (
                <div
                    onClick={() => setIsTopbarOpen(true)}
                    className="absolute top-0 left-0 w-full h-[10px] bg-[#18181b] cursor-pointer z-20 flex items-center justify-center rounded-bl-md rounded-br-md">
                    <ChevronDown size={10} />
                </div>
            )}
        </div>
    )
}