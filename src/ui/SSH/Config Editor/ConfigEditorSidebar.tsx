import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from 'react';
import {Separator} from '@/components/ui/separator.tsx';
import {CornerDownLeft, Folder, File, Server, ArrowUp, Pin} from 'lucide-react';
import {ScrollArea} from '@/components/ui/scroll-area.tsx';
import {cn} from '@/lib/utils.ts';
import {Input} from '@/components/ui/input.tsx';
import {Button} from '@/components/ui/button.tsx';
import {
    listSSHFiles,
    connectSSH,
    getSSHStatus,
    getConfigEditorPinned,
    addConfigEditorPinned,
    removeConfigEditorPinned
} from '@/ui/SSH/ssh-axios.ts';

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

const ConfigEditorSidebar = forwardRef(function ConfigEditorSidebar(
    {onSelectView, onOpenFile, tabs, host}: {
        onSelectView?: (view: string) => void;
        onOpenFile: (file: any) => void;
        tabs: any[];
        host: SSHHost;
    },
    ref
) {
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<any[]>([]);
    const pathInputRef = useRef<HTMLInputElement>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [fileSearch, setFileSearch] = useState('');
    const [debouncedFileSearch, setDebouncedFileSearch] = useState('');
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 200);
        return () => clearTimeout(handler);
    }, [search]);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedFileSearch(fileSearch), 200);
        return () => clearTimeout(handler);
    }, [fileSearch]);

    const [sshSessionId, setSshSessionId] = useState<string | null>(null);
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState<string | null>(null);
    const [connectingSSH, setConnectingSSH] = useState(false);
    const [connectionCache, setConnectionCache] = useState<Record<string, {
        sessionId: string;
        timestamp: number
    }>>({});
    const [fetchingFiles, setFetchingFiles] = useState(false);

    useEffect(() => {
        // when host changes, set path and connect
        const nextPath = host?.defaultPath || '/';
        setCurrentPath(nextPath);
        (async () => {
            await connectToSSH(host);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [host?.id]);

    async function connectToSSH(server: SSHHost): Promise<string | null> {
        const sessionId = server.id.toString();

        const cached = connectionCache[sessionId];
        if (cached && Date.now() - cached.timestamp < 30000) {
            setSshSessionId(cached.sessionId);
            return cached.sessionId;
        }

        if (connectingSSH) {
            return null;
        }

        setConnectingSSH(true);

        try {
            if (!server.password && !server.key) {
                setFilesError('No authentication credentials available for this SSH host');
                return null;
            }

            const connectionConfig = {
                ip: server.ip,
                port: server.port,
                username: server.username,
                password: server.password,
                sshKey: server.key,
                keyPassword: server.keyPassword,
            };

            await connectSSH(sessionId, connectionConfig);

            setSshSessionId(sessionId);

            setConnectionCache(prev => ({
                ...prev,
                [sessionId]: {sessionId, timestamp: Date.now()}
            }));

            return sessionId;
        } catch (err: any) {
            setFilesError(err?.response?.data?.error || 'Failed to connect to SSH');
            setSshSessionId(null);
            return null;
        } finally {
            setConnectingSSH(false);
        }
    }

    async function fetchFiles() {
        if (fetchingFiles) {
            return;
        }

        setFetchingFiles(true);
        setFiles([]);
        setFilesLoading(true);
        setFilesError(null);

        try {
            let pinnedFiles: any[] = [];
            try {
                if (host) {
                    pinnedFiles = await getConfigEditorPinned(host.id);
                }
            } catch (err) {
            }

            if (host && sshSessionId) {
                let res: any[] = [];

                try {
                    const status = await getSSHStatus(sshSessionId);
                    if (!status.connected) {
                        const newSessionId = await connectToSSH(host);
                        if (newSessionId) {
                            setSshSessionId(newSessionId);
                            res = await listSSHFiles(newSessionId, currentPath);
                        } else {
                            throw new Error('Failed to reconnect SSH session');
                        }
                    } else {
                        res = await listSSHFiles(sshSessionId, currentPath);
                    }
                } catch (sessionErr) {
                    const newSessionId = await connectToSSH(host);
                    if (newSessionId) {
                        setSshSessionId(newSessionId);
                        res = await listSSHFiles(newSessionId, currentPath);
                    } else {
                        throw sessionErr;
                    }
                }

                const processedFiles = (res || []).map((f: any) => {
                    const filePath = currentPath + (currentPath.endsWith('/') ? '' : '/') + f.name;
                    const isPinned = pinnedFiles.some(pinned => pinned.path === filePath);
                    return {
                        ...f,
                        path: filePath,
                        isPinned,
                        isSSH: true,
                        sshSessionId: sshSessionId
                    };
                });

                setFiles(processedFiles);
            }
        } catch (err: any) {
            setFiles([]);
            setFilesError(err?.response?.data?.error || err?.message || 'Failed to list files');
        } finally {
            setFilesLoading(false);
            setFetchingFiles(false);
        }
    }

    useEffect(() => {
        if (host && sshSessionId && !connectingSSH && !fetchingFiles) {
            const timeoutId = setTimeout(() => {
                fetchFiles();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [currentPath, host, sshSessionId]);

    useImperativeHandle(ref, () => ({
        openFolder: async (_server: SSHHost, path: string) => {
            if (connectingSSH || fetchingFiles) {
                return;
            }

            if (currentPath === path) {
                setTimeout(() => fetchFiles(), 100);
                return;
            }

            setFetchingFiles(false);
            setFilesLoading(false);
            setFilesError(null);
            setFiles([]);

            setCurrentPath(path);
            if (!sshSessionId) {
                const sessionId = await connectToSSH(host);
                if (sessionId) setSshSessionId(sessionId);
            }
        },
        fetchFiles: () => {
            if (host && sshSessionId) {
                fetchFiles();
            }
        }
    }));

    useEffect(() => {
        if (pathInputRef.current) {
            pathInputRef.current.scrollLeft = pathInputRef.current.scrollWidth;
        }
    }, [currentPath]);

    const filteredFiles = files.filter(file => {
        const q = debouncedFileSearch.trim().toLowerCase();
        if (!q) return true;
        return file.name.toLowerCase().includes(q);
    });

    return (
        <div className="flex flex-col h-full w-[256px]" style={{maxWidth: 256}}>
            <div className="flex flex-col flex-grow min-h-0">
                <div className="flex-1 w-full h-full flex flex-col bg-[#09090b] border-r-2 border-[#303032] overflow-hidden p-0 relative min-h-0">
                    {host && (
                        <div className="flex flex-col h-full w-full" style={{maxWidth: 260}}>
                            <div className="flex items-center gap-2 px-2 py-2 border-b-2 border-[#303032] bg-[#18181b] z-20" style={{maxWidth: 260}}>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 bg-[#18181b] border-2 border-[#303032] rounded-md hover:bg-[#2d2d30] focus:outline-none focus:ring-2 focus:ring-ring"
                                    onClick={() => {
                                        let path = currentPath;
                                        if (path && path !== '/' && path !== '') {
                                            if (path.endsWith('/')) path = path.slice(0, -1);
                                            const lastSlash = path.lastIndexOf('/');
                                            if (lastSlash > 0) {
                                                setCurrentPath(path.slice(0, lastSlash));
                                            } else {
                                                setCurrentPath('/');
                                            }
                                        } else {
                                            setCurrentPath('/');
                                        }
                                    }}
                                >
                                    <ArrowUp className="w-4 h-4"/>
                                </Button>
                                <Input ref={pathInputRef} value={currentPath}
                                       onChange={e => setCurrentPath(e.target.value)}
                                       className="flex-1 bg-[#18181b] border border-[#434345] text-white truncate rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring hover:border-[#5a5a5d]"
                                />
                            </div>
                            <div className="px-2 py-2 border-b-1 border-[#303032] bg-[#18181b]">
                                <Input
                                    placeholder="Search files and folders..."
                                    className="w-full h-7 text-sm bg-[#23232a] border border-[#434345] text-white placeholder:text-muted-foreground rounded"
                                    autoComplete="off"
                                    value={fileSearch}
                                    onChange={e => setFileSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 w-full h-full bg-[#09090b] border-t-1 border-[#303032]">
                                <ScrollArea className="w-full h-full bg-[#09090b]" style={{
                                    height: '100%',
                                    maxHeight: '100%',
                                    paddingRight: 8,
                                    scrollbarGutter: 'stable',
                                    background: '#09090b'
                                }}>
                                    <div className="p-2 pr-2">
                                        {connectingSSH || filesLoading ? (
                                            <div className="text-xs text-muted-foreground">Loading...</div>
                                        ) : filesError ? (
                                            <div className="text-xs text-red-500">{filesError}</div>
                                        ) : filteredFiles.length === 0 ? (
                                            <div className="text-xs text-muted-foreground">No files or folders found.</div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                {filteredFiles.map((item: any) => {
                                                    const isOpen = (tabs || []).some((t: any) => t.id === item.path);
                                                    return (
                                                        <div
                                                            key={item.path}
                                                            className={cn(
                                                                "flex items-center gap-2 px-3 py-2 bg-[#18181b] border-2 border-[#303032] rounded group max-w-full",
                                                                isOpen && "opacity-60 cursor-not-allowed pointer-events-none"
                                                            )}
                                                            style={{maxWidth: 220, marginBottom: 8}}
                                                        >
                                                            <div
                                                                className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                                                                onClick={() => !isOpen && (item.type === 'directory' ? setCurrentPath(item.path) : onOpenFile({
                                                                    name: item.name,
                                                                    path: item.path,
                                                                    isSSH: item.isSSH,
                                                                    sshSessionId: item.sshSessionId
                                                                }))}
                                                            >
                                                                {item.type === 'directory' ?
                                                                    <Folder className="w-4 h-4 text-blue-400"/> :
                                                                    <File className="w-4 h-4 text-muted-foreground"/>}
                                                                <span className="text-sm text-white truncate max-w-[120px]">{item.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {item.type === 'file' && (
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7"
                                                                            disabled={isOpen}
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                try {
                                                                                    if (item.isPinned) {
                                                                                        await removeConfigEditorPinned({
                                                                                            name: item.name,
                                                                                            path: item.path,
                                                                                            hostId: host?.id,
                                                                                            isSSH: true,
                                                                                            sshSessionId: host?.id.toString()
                                                                                        });
                                                                                        setFiles(files.map(f =>
                                                                                            f.path === item.path ? { ...f, isPinned: false } : f
                                                                                        ));
                                                                                    } else {
                                                                                        await addConfigEditorPinned({
                                                                                            name: item.name,
                                                                                            path: item.path,
                                                                                            hostId: host?.id,
                                                                                            isSSH: true,
                                                                                            sshSessionId: host?.id.toString()
                                                                                        });
                                                                                        setFiles(files.map(f =>
                                                                                            f.path === item.path ? { ...f, isPinned: true } : f
                                                                                        ));
                                                                                    }
                                                                                } catch (err) {
                                                                                    console.error('Failed to pin/unpin file:', err);
                                                                                }
                                                                            }}
                                                                    >
                                                                        <Pin className={`w-1 h-1 ${item.isPinned ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}/>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
export {ConfigEditorSidebar};