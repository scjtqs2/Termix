import React, {useState, useEffect} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {User, Shield, Key, AlertCircle} from "lucide-react";
import {TOTPSetup} from "@/ui/User/TOTPSetup.tsx";
import {getUserInfo} from "@/ui/main-axios.ts";
import {toast} from "sonner";
import {PasswordReset} from "@/ui/User/PasswordReset.tsx";

interface UserProfileProps {
    isTopbarOpen?: boolean;
}

export function UserProfile({isTopbarOpen = true}: UserProfileProps) {
    const [userInfo, setUserInfo] = useState<{
        username: string;
        is_admin: boolean;
        is_oidc: boolean;
        totp_enabled: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const info = await getUserInfo();
            setUserInfo({
                username: info.username,
                is_admin: info.is_admin,
                is_oidc: info.is_oidc,
                totp_enabled: info.totp_enabled || false
            });
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to load user information");
        } finally {
            setLoading(false);
        }
    };

    const handleTOTPStatusChange = (enabled: boolean) => {
        if (userInfo) {
            setUserInfo({...userInfo, totp_enabled: enabled});
        }
    };

    if (loading) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="animate-pulse">Loading user profile...</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !userInfo) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "Failed to load user profile"}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto p-6 overflow-y-auto" style={{
            marginTop: isTopbarOpen ? '60px' : '0',
            transition: 'margin-top 0.3s ease',
            maxHeight: 'calc(100vh - 60px)'
        }}>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">User Profile</h1>
                <p className="text-muted-foreground mt-2">Manage your account settings and security</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="w-4 h-4"/>
                        Profile
                    </TabsTrigger>
                    {!userInfo.is_oidc && (
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="w-4 h-4"/>
                            Security
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>Your account details and settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Username</Label>
                                    <p className="text-lg font-medium mt-1">{userInfo.username}</p>
                                </div>
                                <div>
                                    <Label>Account Type</Label>
                                    <p className="text-lg font-medium mt-1">
                                        {userInfo.is_admin ? "Administrator" : "User"}
                                    </p>
                                </div>
                                <div>
                                    <Label>Authentication Method</Label>
                                    <p className="text-lg font-medium mt-1">
                                        {userInfo.is_oidc ? "External (OIDC)" : "Local"}
                                    </p>
                                </div>
                                <div>
                                    <Label>Two-Factor Authentication</Label>
                                    <p className="text-lg font-medium mt-1">
                                        {userInfo.is_oidc ? (
                                            <span className="text-muted-foreground">Locked (OIDC Auth)</span>
                                        ) : (
                                            userInfo.totp_enabled ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <Shield className="w-4 h-4"/>
                                                    Enabled
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">Disabled</span>
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <TOTPSetup
                        isEnabled={userInfo.totp_enabled}
                        onStatusChange={handleTOTPStatusChange}
                    />

                    {!userInfo.is_oidc && (
                        <PasswordReset
                            userInfo={userInfo}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}