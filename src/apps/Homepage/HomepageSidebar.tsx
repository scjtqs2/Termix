import React from 'react';
import {
    Computer,
    Server,
    File,
    Hammer, ChevronUp, User2, HardDrive
} from "lucide-react";

import {
    Sidebar,
    SidebarContent, SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem, SidebarProvider,
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
import axios from "axios";

interface SidebarProps {
    onSelectView: (view: string) => void;
    getView?: () => string;
    disabled?: boolean;
    isAdmin?: boolean;
    username?: string | null;
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

const apiBase =
    typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:8081/users"
        : "/users";

const API = axios.create({
    baseURL: apiBase,
});

export function HomepageSidebar({
                                    onSelectView,
                                    getView,
                                    disabled,
                                    isAdmin,
                                    username
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

    React.useEffect(() => {
        if (adminSheetOpen) {
            API.get("/registration-allowed").then(res => {
                setAllowRegistration(res.data.allowed);
            });

            API.get("/oidc-config").then(res => {
                if (res.data) {
                    setOidcConfig(res.data);
                }
            }).catch((error) => {
            });
        }
    }, [adminSheetOpen]);

    const handleToggle = async (checked: boolean) => {
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

    return (
        <div>
            <SidebarProvider>
                <Sidebar>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-lg font-bold text-white flex items-center gap-2">
                                Termix
                            </SidebarGroupLabel>
                            <Separator className="p-0.25 mt-1 mb-1"/>
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
                                        <SidebarMenuButton onClick={() => window.open("https://dashix.dev", "_blank")} disabled={disabled}>
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
                                                onSelect={() => setAdminSheetOpen(true)}>
                                                <span>Admin Settings</span>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                                            onSelect={handleLogout}>
                                            <span>Sign out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                    {/* Admin Settings Sheet (always rendered, only openable if isAdmin) */}
                    {isAdmin && (
                        <Sheet open={adminSheetOpen} onOpenChange={setAdminSheetOpen}>
                            <SheetContent side="left" className="w-[400px] max-h-screen overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Admin Settings</SheetTitle>
                                </SheetHeader>
                                <div className="pt-1 pb-4 px-4 flex flex-col gap-6">
                                    {/* Registration Settings */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">User Registration</h3>
                                        <label className="flex items-center gap-2">
                                            <Checkbox checked={allowRegistration} onCheckedChange={handleToggle}
                                                      disabled={regLoading}/>
                                            Allow new account registration
                                        </label>
                                    </div>

                                    <Separator className="p-0.25 mt-2 mb-2"/>
                                    
                                    {/* OIDC Configuration */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">External Authentication (OIDC)</h3>
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
                                                    placeholder="http://100.98.3.50:9000/application/o/token/"
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
                                                    JSON path to extract user ID from JWT (e.g., "sub", "email", "preferred_username")
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
                                                    JSON path to extract display name from JWT (e.g., "name", "preferred_username")
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
                                            
                                            <div className="flex gap-2">
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
                                </div>
                                <SheetFooter className="px-4 pt-1 pb-4">
                                    <Separator className="p-0.25 mt-2 mb-2"/>
                                    <SheetClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    )}
                </Sidebar>
            </SidebarProvider>
        </div>
    )
}