import React from "react";
import {useSidebar} from "@/components/ui/sidebar";
import {Button} from "@/components/ui/button.tsx";
import {ChevronDown, ChevronUpIcon} from "lucide-react";

interface TopNavbarProps {
    isTopbarOpen: boolean;
    setIsTopbarOpen: (open: boolean) => void;
}

export function TopNavbar({isTopbarOpen, setIsTopbarOpen}: TopNavbarProps): React.ReactElement {
    const {state} = useSidebar();

    return (
        <div>
            <div
                className="fixed z-10 h-[50px] bg-[#18181b] border-2 border-[#303032] rounded-lg transition-all duration-200 ease-linear flex flex-row"
                style={{
                    top: isTopbarOpen ? "0.5rem" : "-3rem",
                    left: state === "collapsed" ? "calc(1.5rem + 0.5rem)" : "calc(16rem + 0.5rem)",
                    right: "0.5rem"
                }}
            >
                <div className="h-full p-1 pr-2 border-r-2 border-[#303032] w-[calc(100%-3rem)]">
                    test
                </div>

                <div className="flex items-center justify-center flex-1">
                    <Button
                        variant="outline"
                        onClick={() => setIsTopbarOpen(false)}
                        className="w-[28px] h-[28px]"
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