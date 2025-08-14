import React, {useState} from 'react';
import {
    Computer,
    Server,
    File,
    Hammer, ChevronUp, User2, HardDrive, Trash2, Users, Shield, Settings, Menu, ChevronRight
} from "lucide-react";

import {
    Sidebar,
    SidebarContent, SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem, SidebarProvider, SidebarInset, SidebarHeader,
} from "@/components/ui/sidebar.tsx"

import {
    Separator,
} from "@/components/ui/separator.tsx"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@radix-ui/react-dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Alert, AlertTitle, AlertDescription} from "@/components/ui/alert.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import axios from "axios";

interface SidebarProps {
    onSelectView: (view: string) => void;
    getView?: () => string;
    disabled?: boolean;
    isAdmin?: boolean;
    username?: string | null;
    children?: React.ReactNode;
}

function handleLogout() {
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
}

function getCookie(name: string) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, "");
}

const apiBase = import.meta.env.DEV ? "http://localhost:8081/users" : "/users";

const API = axios.create({
    baseURL: apiBase,
});

export function LeftSidebar({
                                    onSelectView,
                                    getView,
                                    disabled,
                                    isAdmin,
                                    username,
                                    children,
                                }: SidebarProps): React.ReactElement {
    const [adminSheetOpen, setAdminSheetOpen] = React.useState(false);
    const [allowRegistration, setAllowRegistration] = React.useState(true);
    const [regLoading, setRegLoading] = React.useState(false);
    const [oidcConfig, setOidcConfig] = React.useState({
        client_id: '',
        client_secret: '',
        issuer_url: '',
        authorization_url: '',
        token_url: '',
        identifier_path: 'sub',
        name_path: 'name',
        scopes: 'openid email profile'
    });
    const [oidcLoading, setOidcLoading] = React.useState(false);
    const [oidcError, setOidcError] = React.useState<string | null>(null);
    const [oidcSuccess, setOidcSuccess] = React.useState<string | null>(null);

    const [deleteAccountOpen, setDeleteAccountOpen] = React.useState(false);
    const [deletePassword, setDeletePassword] = React.useState("");
    const [deleteLoading, setDeleteLoading] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const [adminCount, setAdminCount] = React.useState(0);

    const [users, setUsers] = React.useState<Array<{
        id: string;
        username: string;
        is_admin: boolean;
        is_oidc: boolean;
    }>>([]);
    const [usersLoading, setUsersLoading] = React.useState(false);
    const [newAdminUsername, setNewAdminUsername] = React.useState("");
    const [makeAdminLoading, setMakeAdminLoading] = React.useState(false);
    const [makeAdminError, setMakeAdminError] = React.useState<string | null>(null);
    const [makeAdminSuccess, setMakeAdminSuccess] = React.useState<string | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

    React.useEffect(() => {
        if (adminSheetOpen) {
            const jwt = getCookie("jwt");
            if (jwt && isAdmin) {
                API.get("/oidc-config").then(res => {
                    if (res.data) {
                        setOidcConfig(res.data);
                    }
                }).catch((error) => {
                });
                fetchUsers();
            }
        } else {
            const jwt = getCookie("jwt");
            if (jwt && isAdmin) {
                fetchAdminCount();
            }
        }
    }, [adminSheetOpen, isAdmin]);

    React.useEffect(() => {
        if (!isAdmin) {
            setAdminSheetOpen(false);
            setUsers([]);
            setAdminCount(0);
        }
    }, [isAdmin]);

    const handleToggle = async (checked: boolean) => {
        if (!isAdmin) {
            return;
        }

        setRegLoading(true);
        const jwt = getCookie("jwt");
        try {
            await API.patch(
                "/registration-allowed",
                {allowed: checked},
                {headers: {Authorization: `Bearer ${jwt}`}}
            );
            setAllowRegistration(checked);
        } catch (e) {
        } finally {
            setRegLoading(false);
        }
    };

    const handleOIDCConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAdmin) {
            return;
        }
        
        setOidcLoading(true);
        setOidcError(null);
        setOidcSuccess(null);

        const requiredFields = ['client_id', 'client_secret', 'issuer_url', 'authorization_url', 'token_url'];
        const missingFields = requiredFields.filter(field => !oidcConfig[field as keyof typeof oidcConfig]);

        if (missingFields.length > 0) {
            setOidcError(`Missing required fields: ${missingFields.join(', ')}`);
            setOidcLoading(false);
            return;
        }

        const jwt = getCookie("jwt");
        try {
            await API.post(
                "/oidc-config",
                oidcConfig,
                {headers: {Authorization: `Bearer ${jwt}`}}
            );
            setOidcSuccess("OIDC configuration updated successfully!");
        } catch (err: any) {
            setOidcError(err?.response?.data?.error || "Failed to update OIDC configuration");
        } finally {
            setOidcLoading(false);
        }
    };

    const handleOIDCConfigChange = (field: string, value: string) => {
        setOidcConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteLoading(true);
        setDeleteError(null);

        if (!deletePassword.trim()) {
            setDeleteError("Password is required");
            setDeleteLoading(false);
            return;
        }

        const jwt = getCookie("jwt");
        try {
            await API.delete("/delete-account", {
                headers: {Authorization: `Bearer ${jwt}`},
                data: {password: deletePassword}
            });

            handleLogout();
        } catch (err: any) {
            setDeleteError(err?.response?.data?.error || "Failed to delete account");
            setDeleteLoading(false);
        }
    };

    const fetchUsers = async () => {
        const jwt = getCookie("jwt");

        if (!jwt || !isAdmin) {
            return;
        }
        
        setUsersLoading(true);
        try {
            const response = await API.get("/list", {
                headers: {Authorization: `Bearer ${jwt}`}
            });
            setUsers(response.data.users);

            const adminUsers = response.data.users.filter((user: any) => user.is_admin);
            setAdminCount(adminUsers.length);
        } catch (err: any) {
            console.error("Failed to fetch users:", err);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchAdminCount = async () => {
        const jwt = getCookie("jwt");

        if (!jwt || !isAdmin) {
            return;
        }
        
        try {
            const response = await API.get("/list", {
                headers: {Authorization: `Bearer ${jwt}`}
            });
            const adminUsers = response.data.users.filter((user: any) => user.is_admin);
            setAdminCount(adminUsers.length);
        } catch (err: any) {
            console.error("Failed to fetch admin count:", err);
        }
    };

    const makeUserAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminUsername.trim()) return;

        if (!isAdmin) {
            return;
        }

        setMakeAdminLoading(true);
        setMakeAdminError(null);
        setMakeAdminSuccess(null);

        const jwt = getCookie("jwt");
        try {
            await API.post("/make-admin",
                {username: newAdminUsername.trim()},
                {headers: {Authorization: `Bearer ${jwt}`}}
            );
            setMakeAdminSuccess(`User ${newAdminUsername} is now an admin`);
            setNewAdminUsername("");
            fetchUsers();
        } catch (err: any) {
            setMakeAdminError(err?.response?.data?.error || "Failed to make user admin");
        } finally {
            setMakeAdminLoading(false);
        }
    };

    const removeAdminStatus = async (username: string) => {
        if (!confirm(`Are you sure you want to remove admin status from ${username}?`)) return;

        if (!isAdmin) {
            return;
        }

        const jwt = getCookie("jwt");
        try {
            await API.post("/remove-admin",
                {username},
                {headers: {Authorization: `Bearer ${jwt}`}}
            );
            fetchUsers();
        } catch (err: any) {
            console.error("Failed to remove admin status:", err);
        }
    };

    const deleteUser = async (username: string) => {
        if (!confirm(`Are you sure you want to delete user ${username}? This action cannot be undone.`)) return;

        if (!isAdmin) {
            return;
        }

        const jwt = getCookie("jwt");
        try {
            await API.delete("/delete-user", {
                headers: {Authorization: `Bearer ${jwt}`},
                data: {username}
            });
            fetchUsers();
        } catch (err: any) {
            console.error("Failed to delete user:", err);
        }
    };

    return (
        <div className="min-h-svh">
            <SidebarProvider open={isSidebarOpen}>
                <Sidebar variant="floating">
                    <SidebarHeader>
                        <SidebarGroupLabel className="text-lg font-bold text-white">
                            Termix
                            <Button
                                variant="outline"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="w-[28px] h-[28px] absolute right-5"
                            >
                                <Menu className="h-4 w-4"/>
                            </Button>
                        </SidebarGroupLabel>
                    </SidebarHeader>
                    <Separator className="p-0.25"/>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem key={"SSH Manager"}>
                                        <SidebarMenuButton onClick={() => onSelectView("ssh_manager")}
                                                           disabled={disabled}>
                                            <HardDrive/>
                                            <span>SSH Manager</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <div className="ml-5">
                                        <SidebarMenuItem key={"Terminal"}>
                                            <SidebarMenuButton onClick={() => onSelectView("terminal")}
                                                               disabled={disabled}>
                                                <Computer/>
                                                <span>Terminal</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem key={"Tunnel"}>
                                            <SidebarMenuButton onClick={() => onSelectView("tunnel")}
                                                               disabled={disabled}>
                                                <Server/>
                                                <span>Tunnel</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem key={"Config Editor"}>
                                            <SidebarMenuButton onClick={() => onSelectView("config_editor")}
                                                               disabled={disabled}>
                                                <File/>
                                                <span>Config Editor</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </div>
                                    <SidebarMenuItem key={"Tools"}>
                                        <SidebarMenuButton onClick={() => window.open("https://dashix.dev", "_blank")}
                                                           disabled={disabled}>
                                            <Hammer/>
                                            <span>Tools</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <Separator className="p-0.25 mt-1 mb-1"/>
                    <SidebarFooter>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            className="data-[state=open]:opacity-90 w-full"
                                            style={{width: '100%'}}
                                            disabled={disabled}
                                        >
                                            <User2/> {username ? username : 'Signed out'}
                                            <ChevronUp className="ml-auto"/>
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        side="top"
                                        align="start"
                                        sideOffset={6}
                                        className="min-w-[var(--radix-popper-anchor-width)] bg-sidebar-accent text-sidebar-accent-foreground border border-border rounded-md shadow-2xl p-1"
                                    >
                                        {isAdmin && (
                                            <DropdownMenuItem
                                                className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                                                onSelect={() => {
                                                    if (isAdmin) {
                                                        setAdminSheetOpen(true);
                                                    }
                                                }}>
                                                <span>Admin Settings</span>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                                            onSelect={handleLogout}>
                                            <span>Sign out</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                                            onSelect={() => setDeleteAccountOpen(true)}
                                            disabled={isAdmin && adminCount <= 1}
                                        >
                                            <span
                                                className={isAdmin && adminCount <= 1 ? "text-muted-foreground" : "text-red-400"}>
                                                Delete Account
                                                {isAdmin && adminCount <= 1 && " (Last Admin)"}
                                            </span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                    {/* Admin Settings Sheet */}
                    {isAdmin && (
                        <Sheet open={adminSheetOpen && isAdmin} onOpenChange={(open) => {
                            if (open && !isAdmin) return;
                            setAdminSheetOpen(open);
                        }}>
                            <SheetContent side="left" className="w-[700px] max-h-screen overflow-y-auto">
                                <SheetHeader className="px-6 pb-4">
                                    <SheetTitle>Admin Settings</SheetTitle>
                                </SheetHeader>

                                <div className="px-6">
                                    <Tabs defaultValue="registration" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4 mb-6">
                                            <TabsTrigger value="registration" className="flex items-center gap-2">
                                                <Users className="h-4 w-4"/>
                                                Reg
                                            </TabsTrigger>
                                            <TabsTrigger value="oidc" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4"/>
                                                OIDC
                                            </TabsTrigger>
                                            <TabsTrigger value="users" className="flex items-center gap-2">
                                                <Users className="h-4 w-4"/>
                                                Users
                                            </TabsTrigger>
                                            <TabsTrigger value="admins" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4"/>
                                                Admins
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Registration Settings Tab */}
                                        <TabsContent value="registration" className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold">User Registration</h3>
                                                <label className="flex items-center gap-2">
                                                    <Checkbox checked={allowRegistration} onCheckedChange={handleToggle}
                                                              disabled={regLoading}/>
                                                    Allow new account registration
                                                </label>
                                            </div>
                                        </TabsContent>

                                        {/* OIDC Configuration Tab */}
                                        <TabsContent value="oidc" className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold">External Authentication
                                                    (OIDC)</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Configure external identity provider for OIDC/OAuth2 authentication.
                                                    Users will see an "External" login option once configured.
                                                </p>

                                                {oidcError && (
                                                    <Alert variant="destructive">
                                                        <AlertTitle>Error</AlertTitle>
                                                        <AlertDescription>{oidcError}</AlertDescription>
                                                    </Alert>
                                                )}

                                                <form onSubmit={handleOIDCConfigSubmit} className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="client_id">Client ID</Label>
                                                        <Input
                                                            id="client_id"
                                                            value={oidcConfig.client_id}
                                                            onChange={(e) => handleOIDCConfigChange('client_id', e.target.value)}
                                                            placeholder="your-client-id"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="client_secret">Client Secret</Label>
                                                        <Input
                                                            id="client_secret"
                                                            type="password"
                                                            value={oidcConfig.client_secret}
                                                            onChange={(e) => handleOIDCConfigChange('client_secret', e.target.value)}
                                                            placeholder="your-client-secret"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="authorization_url">Authorization URL</Label>
                                                        <Input
                                                            id="authorization_url"
                                                            value={oidcConfig.authorization_url}
                                                            onChange={(e) => handleOIDCConfigChange('authorization_url', e.target.value)}
                                                            placeholder="https://your-provider.com/application/o/authorize/"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="issuer_url">Issuer URL</Label>
                                                        <Input
                                                            id="issuer_url"
                                                            value={oidcConfig.issuer_url}
                                                            onChange={(e) => handleOIDCConfigChange('issuer_url', e.target.value)}
                                                            placeholder="https://your-provider.com/application/o/termix/"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="token_url">Token URL</Label>
                                                        <Input
                                                            id="token_url"
                                                            value={oidcConfig.token_url}
                                                            onChange={(e) => handleOIDCConfigChange('token_url', e.target.value)}
                                                            placeholder="https://your-provider.com/application/o/token/"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="identifier_path">User Identifier Path</Label>
                                                        <Input
                                                            id="identifier_path"
                                                            value={oidcConfig.identifier_path}
                                                            onChange={(e) => handleOIDCConfigChange('identifier_path', e.target.value)}
                                                            placeholder="sub"
                                                            required
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            JSON path to extract user ID from JWT (e.g., "sub", "email",
                                                            "preferred_username")
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="name_path">Display Name Path</Label>
                                                        <Input
                                                            id="name_path"
                                                            value={oidcConfig.name_path}
                                                            onChange={(e) => handleOIDCConfigChange('name_path', e.target.value)}
                                                            placeholder="name"
                                                            required
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            JSON path to extract display name from JWT (e.g., "name",
                                                            "preferred_username")
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="scopes">Scopes</Label>
                                                        <Input
                                                            id="scopes"
                                                            value={oidcConfig.scopes}
                                                            onChange={(e) => handleOIDCConfigChange('scopes', e.target.value)}
                                                            placeholder="openid email profile"
                                                            required
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Space-separated list of OAuth2 scopes to request
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            type="submit"
                                                            className="flex-1"
                                                            disabled={oidcLoading}
                                                        >
                                                            {oidcLoading ? "Saving..." : "Save Configuration"}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setOidcConfig({
                                                                    client_id: '',
                                                                    client_secret: '',
                                                                    issuer_url: '',
                                                                    authorization_url: '',
                                                                    token_url: '',
                                                                    identifier_path: 'sub',
                                                                    name_path: 'name',
                                                                    scopes: 'openid email profile'
                                                                });
                                                            }}
                                                        >
                                                            Reset
                                                        </Button>
                                                    </div>

                                                    {oidcSuccess && (
                                                        <Alert>
                                                            <AlertTitle>Success</AlertTitle>
                                                            <AlertDescription>{oidcSuccess}</AlertDescription>
                                                        </Alert>
                                                    )}
                                                </form>
                                            </div>
                                        </TabsContent>

                                        {/* Users Management Tab */}
                                        <TabsContent value="users" className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">User Management</h3>
                                                    <Button
                                                        onClick={fetchUsers}
                                                        disabled={usersLoading}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        {usersLoading ? "Loading..." : "Refresh"}
                                                    </Button>
                                                </div>

                                                {usersLoading ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        Loading users...
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-md overflow-hidden">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="px-4">Username</TableHead>
                                                                    <TableHead className="px-4">Type</TableHead>
                                                                    <TableHead className="px-4">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {users.map((user) => (
                                                                    <TableRow key={user.id}>
                                                                        <TableCell className="px-4 font-medium">
                                                                            {user.username}
                                                                            {user.is_admin && (
                                                                                <span
                                                                                    className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border">
                                                                                    Admin
                                                                                </span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="px-4">
                                                                            {user.is_oidc ? "External" : "Local"}
                                                                        </TableCell>
                                                                        <TableCell className="px-4">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => deleteUser(user.username)}
                                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                disabled={user.is_admin}
                                                                            >
                                                                                <Trash2 className="h-4 w-4"/>
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        {/* Admins Management Tab */}
                                        <TabsContent value="admins" className="space-y-6">
                                            <div className="space-y-6">
                                                <h3 className="text-lg font-semibold">Admin Management</h3>

                                                {/* Add New Admin Form */}
                                                <div className="space-y-4 p-6 border rounded-md bg-muted/50">
                                                    <h4 className="font-medium">Make User Admin</h4>
                                                    <form onSubmit={makeUserAdmin} className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="new-admin-username">Username</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    id="new-admin-username"
                                                                    value={newAdminUsername}
                                                                    onChange={(e) => setNewAdminUsername(e.target.value)}
                                                                    placeholder="Enter username to make admin"
                                                                    required
                                                                />
                                                                <Button
                                                                    type="submit"
                                                                    disabled={makeAdminLoading || !newAdminUsername.trim()}
                                                                >
                                                                    {makeAdminLoading ? "Adding..." : "Make Admin"}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {makeAdminError && (
                                                            <Alert variant="destructive">
                                                                <AlertTitle>Error</AlertTitle>
                                                                <AlertDescription>{makeAdminError}</AlertDescription>
                                                            </Alert>
                                                        )}

                                                        {makeAdminSuccess && (
                                                            <Alert>
                                                                <AlertTitle>Success</AlertTitle>
                                                                <AlertDescription>{makeAdminSuccess}</AlertDescription>
                                                            </Alert>
                                                        )}
                                                    </form>
                                                </div>

                                                {/* Current Admins Table */}
                                                <div className="space-y-4">
                                                    <h4 className="font-medium">Current Admins</h4>
                                                    <div className="border rounded-md overflow-hidden">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="px-4">Username</TableHead>
                                                                    <TableHead className="px-4">Type</TableHead>
                                                                    <TableHead className="px-4">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {users.filter(user => user.is_admin).map((admin) => (
                                                                    <TableRow key={admin.id}>
                                                                        <TableCell className="px-4 font-medium">
                                                                            {admin.username}
                                                                            <span
                                                                                className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border">
                                                                                Admin
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="px-4">
                                                                            {admin.is_oidc ? "External" : "Local"}
                                                                        </TableCell>
                                                                        <TableCell className="px-4">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => removeAdminStatus(admin.username)}
                                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                                disabled={admin.username === username}
                                                                            >
                                                                                <Shield className="h-4 w-4"/>
                                                                                Remove Admin
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>

                                <SheetFooter className="px-6 pt-6 pb-6">
                                    <Separator className="p-0.25 mt-2 mb-2"/>
                                    <SheetClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Delete Account Confirmation Sheet */}
                    <Sheet open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
                        <SheetContent side="left" className="w-[400px]">
                            <SheetHeader className="pb-0">
                                <SheetTitle>Delete Account</SheetTitle>
                                <SheetDescription>
                                    This action cannot be undone. This will permanently delete your account and all
                                    associated data.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="pb-4 px-4 flex flex-col gap-4">
                                <Alert variant="destructive">
                                    <AlertTitle>Warning</AlertTitle>
                                    <AlertDescription>
                                        Deleting your account will remove all your data including SSH hosts,
                                        configurations, and settings.
                                        This action is irreversible.
                                    </AlertDescription>
                                </Alert>

                                {deleteError && (
                                    <Alert variant="destructive">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{deleteError}</AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleDeleteAccount} className="space-y-4">
                                    {isAdmin && adminCount <= 1 && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Cannot Delete Account</AlertTitle>
                                            <AlertDescription>
                                                You are the last admin user. You cannot delete your account as this
                                                would leave the system without any administrators.
                                                Please make another user an admin first, or contact system support.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="delete-password">Confirm Password</Label>
                                        <Input
                                            id="delete-password"
                                            type="password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            placeholder="Enter your password to confirm"
                                            required
                                            disabled={isAdmin && adminCount <= 1}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            className="flex-1"
                                            disabled={deleteLoading || !deletePassword.trim() || (isAdmin && adminCount <= 1)}
                                        >
                                            {deleteLoading ? "Deleting..." : "Delete Account"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setDeleteAccountOpen(false);
                                                setDeletePassword("");
                                                setDeleteError(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </SheetContent>
                    </Sheet>
                </Sidebar>
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>

            {!isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-0 left-0 w-[10px] h-full bg-[#18181b] cursor-pointer z-20 flex items-center justify-center">
                    <ChevronRight size={10} />
                </div>
            )}
        </div>
    )
}