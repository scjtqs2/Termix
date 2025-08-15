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
    
    // Debug logging
    console.log("TopNavbar - Sidebar state:", state);
    console.log("TopNavbar - State type:", typeof state);
    console.log("TopNavbar - State === 'collapsed':", state === "collapsed");
    
    // Adjust pixel values to get exactly 15px margins
    // Current left margin when expanded is 15px (perfect), when collapsed is 38px (need to reduce by 23px)
    // Current right margin is 15px (perfect)
    const leftPosition = state === "collapsed" ? "26px" : "264px";
    console.log("TopNavbar - Calculated left position:", leftPosition);

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