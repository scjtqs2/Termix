import React, {useState} from "react";
import {SSHManagerHostViewer} from "@/ui/SSH/Manager/SSHManagerHostViewer.tsx"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {SSHManagerHostEditor} from "@/ui/SSH/Manager/SSHManagerHostEditor.tsx";
import {useSidebar} from "@/components/ui/sidebar.tsx";

interface ConfigEditorProps {
	onSelectView: (view: string) => void;
	isTopbarOpen?: boolean;
}

interface SSHHost {
	id: number;
	name: string;
	ip: string;
	port: number;
	username: string;
	folder: string;
	tags: string[];
	pin: boolean;
	authType: string;
	password?: string;
	key?: string;
	keyPassword?: string;
	keyType?: string;
	enableTerminal: boolean;
	enableTunnel: boolean;
	enableConfigEditor: boolean;
	defaultPath: string;
	tunnelConnections: any[];
	createdAt: string;
	updatedAt: string;
}

export function SSHManager({onSelectView, isTopbarOpen}: ConfigEditorProps): React.ReactElement {
	const [activeTab, setActiveTab] = useState("host_viewer");
	const [editingHost, setEditingHost] = useState<SSHHost | null>(null);
	const {state: sidebarState} = useSidebar();

	const handleEditHost = (host: SSHHost) => {
		setEditingHost(host);
		setActiveTab("add_host");
	};

	const handleFormSubmit = () => {
		setEditingHost(null);
		setActiveTab("host_viewer");
	};

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		if (value === "host_viewer") {
			setEditingHost(null);
		}
	};

	// Dynamic margins similar to TerminalView but with 16px gaps when retracted
	const topMarginPx = isTopbarOpen ? 74 : 26;
	const leftMarginPx = sidebarState === 'collapsed' ? 26 : 8;
	const bottomMarginPx = 8;

	return (
		<div>
			<div className="w-full">
				<div
					className="bg-[#18181b] text-white p-4 pt-0 rounded-lg border-2 border-[#303032] flex flex-col min-h-0 overflow-hidden"
					style={{
						marginLeft: leftMarginPx,
						marginRight: 17,
						marginTop: topMarginPx,
						marginBottom: bottomMarginPx,
						height: `calc(100vh - ${topMarginPx + bottomMarginPx}px)`
					}}
				>
					<Tabs value={activeTab} onValueChange={handleTabChange}
							className="flex-1 flex flex-col h-full min-h-0">
						<TabsList className="mt-1.5">
							<TabsTrigger value="host_viewer">Host Viewer</TabsTrigger>
							<TabsTrigger value="add_host">
								{editingHost ? "Edit Host" : "Add Host"}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="host_viewer" className="flex-1 flex flex-col h-full min-h-0">
							<Separator className="p-0.25 -mt-0.5 mb-1"/>
							<SSHManagerHostViewer onEditHost={handleEditHost}/>
						</TabsContent>
						<TabsContent value="add_host" className="flex-1 flex flex-col h-full min-h-0">
							<Separator className="p-0.25 -mt-0.5 mb-1"/>
							<div className="flex flex-col h-full min-h-0">
								<SSHManagerHostEditor
										editingHost={editingHost}
										onFormSubmit={handleFormSubmit}
								/>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	)
}