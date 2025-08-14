import React, {useState} from "react";
import {SSHManagerHostViewer} from "@/ui/SSH/Manager/SSHManagerHostViewer.tsx"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {SSHManagerHostEditor} from "@/ui/SSH/Manager/SSHManagerHostEditor.tsx";
import {useSidebar} from "@/components/ui/sidebar.tsx";

interface ConfigEditorProps {
    onSelectView: (view: string) => void;
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

export function SSHManager({onSelectView}: ConfigEditorProps): React.ReactElement {
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

    return (
        <div>
            <div className="flex w-full h-screen overflow-hidden">
                <div
                    className={`flex-1 bg-[#18181b] m-[8px] text-white p-4 pt-0 rounded-lg border border-[#303032] flex flex-col min-h-0 ${
                        sidebarState === 'collapsed' ? 'ml-6' : ''
                    }`}>
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