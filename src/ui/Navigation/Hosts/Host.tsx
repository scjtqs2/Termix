import React from "react";
import {Status, StatusIndicator} from "@/components/ui/shadcn-io/status";
import {Button} from "@/components/ui/button.tsx";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Server, Terminal} from "lucide-react";

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

interface HostProps {
    host: SSHHost;
}

export function Host({ host }: HostProps): React.ReactElement {
    const tags = Array.isArray(host.tags) ? host.tags : [];
    const hasTags = tags.length > 0;
    
    return (
        <div>
            <div className="flex items-center gap-2">
                <Status status={"online"} className="!bg-transparent !p-0.75 flex-shrink-0">
                    <StatusIndicator/>
                </Status>
                <p className="font-semibold flex-1 min-w-0 break-words text-sm">
                    {host.name || host.ip}
                </p>
                <ButtonGroup className="flex-shrink-0">
                    <Button variant="outline" className="!px-2 border-1 border-[#303032]">
                        <Server/>
                    </Button>
                    <Button variant="outline" className="!px-2 border-1 border-[#303032]">
                        <Terminal/>
                    </Button>
                </ButtonGroup>
            </div>
            {hasTags && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {tags.map((tag: string) => (
                        <div key={tag} className="bg-[#18181b] border-1 border-[#303032] pl-2 pr-2 rounded-[10px]">
                            <p className="text-sm">{tag}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}