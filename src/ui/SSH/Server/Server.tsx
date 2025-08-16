import React from "react";
import { useSidebar } from "@/components/ui/sidebar";

interface ServerProps {
	hostConfig?: any;
	title?: string;
	isVisible?: boolean;
	isTopbarOpen?: boolean;
	embedded?: boolean; // when rendered inside a pane in TerminalView
}

export function Server({ hostConfig, title, isVisible = true, isTopbarOpen = true, embedded = false }: ServerProps): React.ReactElement {
	const { state: sidebarState } = useSidebar();

	const topMarginPx = isTopbarOpen ? 74 : 16;
	const leftMarginPx = sidebarState === 'collapsed' ? 16 : 8;
	const bottomMarginPx = 16;

	const wrapperStyle: React.CSSProperties = embedded
		? { opacity: isVisible ? 1 : 0, height: '100%', width: '100%' }
		: {
				opacity: isVisible ? 1 : 0,
				marginLeft: leftMarginPx,
				marginRight: 17,
				marginTop: topMarginPx,
				marginBottom: bottomMarginPx,
				height: `calc(100vh - ${topMarginPx + bottomMarginPx}px)`,
		  };

	const containerClass = embedded
		? "h-full w-full text-white overflow-hidden bg-transparent"
		: "bg-[#18181b] text-white rounded-lg border-2 border-[#303032] overflow-hidden";

	return (
		<div style={wrapperStyle} className={containerClass}>
			<div className="h-full w-full flex items-center justify-center">
				<div className="text-sm opacity-70 text-center">
					<div>{title || 'Server'}</div>
				</div>
			</div>
		</div>
	);
}
