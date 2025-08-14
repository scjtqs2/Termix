import React from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function TopNavbar(): React.ReactElement {
    const { state } = useSidebar();
    
    return (
        <div 
            className="fixed z-10 h-[50px] bg-[#18181b] border border-[#303032] rounded-lg transition-[left] duration-200 ease-linear"
            style={{
                top: "0.5rem",
                left: state === "collapsed" ? "calc(1.5rem + 0.5rem)" : "calc(16rem + 0.5rem)",
                right: "0.5rem"
            }}
        >

        </div>
    )
}