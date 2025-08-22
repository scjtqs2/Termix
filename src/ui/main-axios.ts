import axios from 'axios';

interface SSHHostData {
    name?: string;
    ip: string;
    port: number;
    username: string;
    folder?: string;
    tags?: string[];
    pin?: boolean;
    authType: 'password' | 'key';
    password?: string;
    key?: File | null;
    keyPassword?: string;
    keyType?: string;
    enableTerminal?: boolean;
    enableTunnel?: boolean;
    enableFileManager?: boolean;
    defaultPath?: string;
    tunnelConnections?: any[];
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
    enableFileManager: boolean;
    defaultPath: string;
    tunnelConnections: any[];
    createdAt: string;
    updatedAt: string;
}

interface TunnelConfig {
    name: string;
    hostName: string;
    sourceIP: string;
    sourceSSHPort: number;
    sourceUsername: string;
    sourcePassword?: string;
    sourceAuthMethod: string;
    sourceSSHKey?: string;
    sourceKeyPassword?: string;
    sourceKeyType?: string;
    endpointIP: string;
    endpointSSHPort: number;
    endpointUsername: string;
    endpointPassword?: string;
    endpointAuthMethod: string;
    endpointSSHKey?: string;
    endpointKeyPassword?: string;
    endpointKeyType?: string;
    sourcePort: number;
    endpointPort: number;
    maxRetries: number;
    retryInterval: number;
    autoStart: boolean;
    isPinned: boolean;
}

interface TunnelStatus {
    status: string;
    reason?: string;
    errorType?: string;
    retryCount?: number;
    maxRetries?: number;
    nextRetryIn?: number;
    retryExhausted?: boolean;
}

interface FileManagerFile {
    name: string;
    path: string;
    type?: 'file' | 'directory';
    isSSH?: boolean;
    sshSessionId?: string;
}

interface FileManagerShortcut {
    name: string;
    path: string;
}

export type ServerStatus = {
    status: 'online' | 'offline';
    lastChecked: string;
};

export type ServerMetrics = {
    cpu: { percent: number | null; cores: number | null; load: [number, number, number] | null };
    memory: { percent: number | null; usedGiB: number | null; totalGiB: number | null };
    disk: { percent: number | null; usedHuman: string | null; totalHuman: string | null };
    lastChecked: string;
};

interface AuthResponse {
    token: string;
}

interface UserInfo {
    id: string;
    username: string;
    is_admin: boolean;
}

interface RegistrationResponse {
    allowed: boolean;
}

interface OIDCConfig {
    configured: boolean;
}

interface UserCount {
    count: number;
}

interface PasswordResetInitiate {
    username: string;
}

interface PasswordResetVerify {
    username: string;
    resetCode: string;
}

interface PasswordResetComplete {
    username: string;
    tempToken: string;
    newPassword: string;
}

interface OIDCAuthorize {
    auth_url: string;
}

function setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}

const sshHostApi = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8081/ssh' : '/ssh',
    headers: {
        'Content-Type': 'application/json',
    },
});

const tunnelApi = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8083/ssh' : '/ssh',
    headers: {
        'Content-Type': 'application/json',
    },
});

const fileManagerApi = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8084/ssh' : '/ssh',
    headers: {
        'Content-Type': 'application/json',
    }
});

const statsApi = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8085' : '',
    headers: {
        'Content-Type': 'application/json',
    }
});

const authApi = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8081/users' : '/users',
    headers: {
        'Content-Type': 'application/json',
    }
});

[sshHostApi, tunnelApi, fileManagerApi, statsApi, authApi].forEach(api => {
    api.interceptors.request.use((config) => {
        const token = getCookie('jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
});

export async function getSSHHosts(): Promise<SSHHost[]> {
    try {
        const response = await sshHostApi.get('/db/host');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function createSSHHost(hostData: SSHHostData): Promise<SSHHost> {
    try {
        const submitData = {
            name: hostData.name || '',
            ip: hostData.ip,
            port: parseInt(hostData.port.toString()) || 22,
            username: hostData.username,
            folder: hostData.folder || '',
            tags: hostData.tags || [],
            pin: hostData.pin || false,
            authMethod: hostData.authType,
            password: hostData.authType === 'password' ? hostData.password : '',
            key: hostData.authType === 'key' ? hostData.key : null,
            keyPassword: hostData.authType === 'key' ? hostData.keyPassword : '',
            keyType: hostData.authType === 'key' ? hostData.keyType : '',
            enableTerminal: hostData.enableTerminal !== false,
            enableTunnel: hostData.enableTunnel !== false,
            enableFileManager: hostData.enableFileManager !== false,
            defaultPath: hostData.defaultPath || '/',
            tunnelConnections: hostData.tunnelConnections || [],
        };

        if (!submitData.enableTunnel) {
            submitData.tunnelConnections = [];
        }

        if (!submitData.enableFileManager) {
            submitData.defaultPath = '';
        }

        if (hostData.authType === 'key' && hostData.key instanceof File) {
            const formData = new FormData();
            formData.append('key', hostData.key);

            const dataWithoutFile = {...submitData};
            delete dataWithoutFile.key;
            formData.append('data', JSON.stringify(dataWithoutFile));

            const response = await sshHostApi.post('/db/host', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } else {
            const response = await sshHostApi.post('/db/host', submitData);
            return response.data;
        }
    } catch (error) {
        throw error;
    }
}

export async function updateSSHHost(hostId: number, hostData: SSHHostData): Promise<SSHHost> {
    try {
        const submitData = {
            name: hostData.name || '',
            ip: hostData.ip,
            port: parseInt(hostData.port.toString()) || 22,
            username: hostData.username,
            folder: hostData.folder || '',
            tags: hostData.tags || [],
            pin: hostData.pin || false,
            authMethod: hostData.authType,
            password: hostData.authType === 'password' ? hostData.password : '',
            key: hostData.authType === 'key' ? hostData.key : null,
            keyPassword: hostData.authType === 'key' ? hostData.keyPassword : '',
            keyType: hostData.authType === 'key' ? hostData.keyType : '',
            enableTerminal: hostData.enableTerminal !== false,
            enableTunnel: hostData.enableTunnel !== false,
            enableFileManager: hostData.enableFileManager !== false,
            defaultPath: hostData.defaultPath || '/',
            tunnelConnections: hostData.tunnelConnections || [],
        };

        if (!submitData.enableTunnel) {
            submitData.tunnelConnections = [];
        }
        if (!submitData.enableFileManager) {
            submitData.defaultPath = '';
        }

        if (hostData.authType === 'key' && hostData.key instanceof File) {
            const formData = new FormData();
            formData.append('key', hostData.key);

            const dataWithoutFile = {...submitData};
            delete dataWithoutFile.key;
            formData.append('data', JSON.stringify(dataWithoutFile));

            const response = await sshHostApi.put(`/db/host/${hostId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } else {
            const response = await sshHostApi.put(`/db/host/${hostId}`, submitData);
            return response.data;
        }
    } catch (error) {
        throw error;
    }
}

export async function bulkImportSSHHosts(hosts: SSHHostData[]): Promise<{
    message: string;
    success: number;
    failed: number;
    errors: string[];
}> {
    try {
        const response = await sshHostApi.post('/bulk-import', {hosts});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function deleteSSHHost(hostId: number): Promise<any> {
    try {
        const response = await sshHostApi.delete(`/db/host/${hostId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getSSHHostById(hostId: number): Promise<SSHHost> {
    try {
        const response = await sshHostApi.get(`/db/host/${hostId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getTunnelStatuses(): Promise<Record<string, TunnelStatus>> {
    try {
        const response = await tunnelApi.get('/tunnel/status');
        return response.data || {};
    } catch (error) {
        throw error;
    }
}

export async function getTunnelStatusByName(tunnelName: string): Promise<TunnelStatus | undefined> {
    const statuses = await getTunnelStatuses();
    return statuses[tunnelName];
}

export async function connectTunnel(tunnelConfig: TunnelConfig): Promise<any> {
    try {
        const response = await tunnelApi.post('/tunnel/connect', tunnelConfig);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function disconnectTunnel(tunnelName: string): Promise<any> {
    try {
        const response = await tunnelApi.post('/tunnel/disconnect', {tunnelName});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function cancelTunnel(tunnelName: string): Promise<any> {
    try {
        const response = await tunnelApi.post('/tunnel/cancel', {tunnelName});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getFileManagerRecent(hostId: number): Promise<FileManagerFile[]> {
    try {
        const response = await sshHostApi.get(`/file_manager/recent?hostId=${hostId}`);
        return response.data || [];
    } catch (error) {
        return [];
    }
}

export async function addFileManagerRecent(file: {
    name: string;
    path: string;
    isSSH: boolean;
    sshSessionId?: string;
    hostId: number
}): Promise<any> {
    try {
        const response = await sshHostApi.post('/file_manager/recent', file);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function removeFileManagerRecent(file: {
    name: string;
    path: string;
    isSSH: boolean;
    sshSessionId?: string;
    hostId: number
}): Promise<any> {
    try {
        const response = await sshHostApi.delete('/file_manager/recent', {data: file});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getFileManagerPinned(hostId: number): Promise<FileManagerFile[]> {
    try {
        const response = await sshHostApi.get(`/file_manager/pinned?hostId=${hostId}`);
        return response.data || [];
    } catch (error) {
        return [];
    }
}

export async function addFileManagerPinned(file: {
    name: string;
    path: string;
    isSSH: boolean;
    sshSessionId?: string;
    hostId: number
}): Promise<any> {
    try {
        const response = await sshHostApi.post('/file_manager/pinned', file);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function removeFileManagerPinned(file: {
    name: string;
    path: string;
    isSSH: boolean;
    sshSessionId?: string;
    hostId: number
}): Promise<any> {
    try {
        const response = await sshHostApi.delete('/file_manager/pinned', {data: file});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getFileManagerShortcuts(hostId: number): Promise<FileManagerShortcut[]> {
    try {
        const response = await sshHostApi.get(`/file_manager/shortcuts?hostId=${hostId}`);
        return response.data || [];
    } catch (error) {
        return [];
    }
}

export async function addFileManagerShortcut(shortcut: {
    name: string;
    path: string;
    isSSH: boolean;
    sshSessionId?: string;
    hostId: number
}): Promise<any> {
    try {
        const response = await sshHostApi.post('/file_manager/shortcuts', shortcut);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function removeFileManagerShortcut(shortcut: {
    name: string;
    path: string;
    isSSH: boolean;
    sshSessionId?: string;
    hostId: number
}): Promise<any> {
    try {
        const response = await sshHostApi.delete('/file_manager/shortcuts', {data: shortcut});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function connectSSH(sessionId: string, config: {
    ip: string;
    port: number;
    username: string;
    password?: string;
    sshKey?: string;
    keyPassword?: string;
}): Promise<any> {
    try {
        const response = await fileManagerApi.post('/ssh/connect', {
            sessionId,
            ...config
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function disconnectSSH(sessionId: string): Promise<any> {
    try {
        const response = await fileManagerApi.post('/ssh/disconnect', {sessionId});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getSSHStatus(sessionId: string): Promise<{ connected: boolean }> {
    try {
        const response = await fileManagerApi.get('/ssh/status', {
            params: {sessionId}
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function listSSHFiles(sessionId: string, path: string): Promise<any[]> {
    try {
        const response = await fileManagerApi.get('/ssh/listFiles', {
            params: {sessionId, path}
        });
        return response.data || [];
    } catch (error) {
        throw error;
    }
}

export async function readSSHFile(sessionId: string, path: string): Promise<{ content: string; path: string }> {
    try {
        const response = await fileManagerApi.get('/ssh/readFile', {
            params: {sessionId, path}
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function writeSSHFile(sessionId: string, path: string, content: string): Promise<any> {
    try {
        const response = await fileManagerApi.post('/ssh/writeFile', {
            sessionId,
            path,
            content
        });

        if (response.data && (response.data.message === 'File written successfully' || response.status === 200)) {
            return response.data;
        } else {
            throw new Error('File write operation did not return success status');
        }
    } catch (error) {
        throw error;
    }
}

export async function uploadSSHFile(sessionId: string, path: string, fileName: string, content: string): Promise<any> {
    try {
        const response = await fileManagerApi.post('/ssh/uploadFile', {
            sessionId,
            path,
            fileName,
            content
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function createSSHFile(sessionId: string, path: string, fileName: string, content: string = ''): Promise<any> {
    try {
        const response = await fileManagerApi.post('/ssh/createFile', {
            sessionId,
            path,
            fileName,
            content
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function createSSHFolder(sessionId: string, path: string, folderName: string): Promise<any> {
    try {
        const response = await fileManagerApi.post('/ssh/createFolder', {
            sessionId,
            path,
            folderName
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function deleteSSHItem(sessionId: string, path: string, isDirectory: boolean): Promise<any> {
    try {
        const response = await fileManagerApi.delete('/ssh/deleteItem', {
            data: {
                sessionId,
                path,
                isDirectory
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function renameSSHItem(sessionId: string, oldPath: string, newName: string): Promise<any> {
    try {
        const response = await fileManagerApi.put('/ssh/renameItem', {
            sessionId,
            oldPath,
            newName
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}



export async function getAllServerStatuses(): Promise<Record<number, ServerStatus>> {
    try {
        const response = await statsApi.get('/status');
        return response.data || {};
    } catch (error) {
        throw error;
    }
}

export async function getServerStatusById(id: number): Promise<ServerStatus> {
    try {
        const response = await statsApi.get(`/status/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getServerMetricsById(id: number): Promise<ServerMetrics> {
    try {
        const response = await statsApi.get(`/metrics/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Auth-related functions
export async function registerUser(username: string, password: string): Promise<any> {
    try {
        const response = await authApi.post('/create', { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
    try {
        const response = await authApi.post('/login', { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getUserInfo(): Promise<UserInfo> {
    try {
        const response = await authApi.get('/me');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getRegistrationAllowed(): Promise<{ allowed: boolean }> {
    try {
        const response = await authApi.get('/registration-allowed');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getOIDCConfig(): Promise<any> {
    try {
        const response = await authApi.get('/oidc-config');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getUserCount(): Promise<UserCount> {
    try {
        const response = await authApi.get('/count');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function initiatePasswordReset(username: string): Promise<any> {
    try {
        const response = await authApi.post('/initiate-reset', { username });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function verifyPasswordResetCode(username: string, resetCode: string): Promise<any> {
    try {
        const response = await authApi.post('/verify-reset-code', { username, resetCode });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function completePasswordReset(username: string, tempToken: string, newPassword: string): Promise<any> {
    try {
        const response = await authApi.post('/complete-reset', { username, tempToken, newPassword });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getOIDCAuthorizeUrl(): Promise<OIDCAuthorize> {
    try {
        const response = await authApi.get('/oidc/authorize');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export {sshHostApi, tunnelApi, fileManagerApi, authApi};