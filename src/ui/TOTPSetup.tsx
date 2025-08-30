import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Copy, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { setupTOTP, enableTOTP, disableTOTP, generateBackupCodes } from "@/ui/main-axios";
import { toast } from "sonner";

interface TOTPSetupProps {
    isEnabled: boolean;
    onStatusChange?: (enabled: boolean) => void;
}

export function TOTPSetup({ isEnabled: initialEnabled, onStatusChange }: TOTPSetupProps) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [setupStep, setSetupStep] = useState<"init" | "qr" | "verify" | "backup">("init");
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [disableCode, setDisableCode] = useState("");

    const handleSetupStart = async () => {
        setError(null);
        setLoading(true);
        try {
            const response = await setupTOTP();
            setQrCode(response.qr_code);
            setSecret(response.secret);
            setSetupStep("qr");
            setIsSettingUp(true);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to start TOTP setup");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const response = await enableTOTP(verificationCode);
            setBackupCodes(response.backup_codes);
            setSetupStep("backup");
            toast.success("Two-factor authentication enabled successfully!");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Invalid verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        setError(null);
        setLoading(true);
        try {
            await disableTOTP(password || undefined, disableCode || undefined);
            setIsEnabled(false);
            setIsSettingUp(false);
            setSetupStep("init");
            setPassword("");
            setDisableCode("");
            onStatusChange?.(false);
            toast.success("Two-factor authentication disabled");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to disable TOTP");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateNewBackupCodes = async () => {
        setError(null);
        setLoading(true);
        try {
            const response = await generateBackupCodes(password || undefined, disableCode || undefined);
            setBackupCodes(response.backup_codes);
            toast.success("New backup codes generated");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to generate backup codes");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const downloadBackupCodes = () => {
        const content = `Termix Two-Factor Authentication Backup Codes\n` +
            `Generated: ${new Date().toISOString()}\n\n` +
            `Keep these codes in a safe place. Each code can only be used once.\n\n` +
            backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'termix-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Backup codes downloaded");
    };

    const handleComplete = () => {
        setIsEnabled(true);
        setIsSettingUp(false);
        setSetupStep("init");
        setVerificationCode("");
        onStatusChange?.(true);
    };

    if (isEnabled && !isSettingUp) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>
                        Your account is protected with two-factor authentication
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Enabled</AlertTitle>
                        <AlertDescription>
                            Two-factor authentication is currently active on your account
                        </AlertDescription>
                    </Alert>

                    <Tabs defaultValue="disable" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="disable">Disable 2FA</TabsTrigger>
                            <TabsTrigger value="backup">Backup Codes</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="disable" className="space-y-4">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>
                                    Disabling two-factor authentication will make your account less secure
                                </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-2">
                                <Label htmlFor="disable-password">Password or TOTP Code</Label>
                                <Input
                                    id="disable-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">Or</p>
                                <Input
                                    id="disable-code"
                                    type="text"
                                    placeholder="6-digit TOTP code"
                                    maxLength={6}
                                    value={disableCode}
                                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            
                            <Button
                                variant="destructive"
                                onClick={handleDisable}
                                disabled={loading || (!password && !disableCode)}
                            >
                                Disable Two-Factor Authentication
                            </Button>
                        </TabsContent>
                        
                        <TabsContent value="backup" className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Generate new backup codes if you've lost your existing ones
                            </p>
                            
                            <div className="space-y-2">
                                <Label htmlFor="backup-password">Password or TOTP Code</Label>
                                <Input
                                    id="backup-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">Or</p>
                                <Input
                                    id="backup-code"
                                    type="text"
                                    placeholder="6-digit TOTP code"
                                    maxLength={6}
                                    value={disableCode}
                                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            
                            <Button
                                onClick={handleGenerateNewBackupCodes}
                                disabled={loading || (!password && !disableCode)}
                            >
                                Generate New Backup Codes
                            </Button>
                            
                            {backupCodes.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Your Backup Codes</Label>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={downloadBackupCodes}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                                        {backupCodes.map((code, i) => (
                                            <div key={i}>{code}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (setupStep === "qr") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Set Up Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Step 1: Scan the QR code with your authenticator app
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center">
                        <img src={qrCode} alt="TOTP QR Code" className="w-64 h-64" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Manual Entry Code</Label>
                        <div className="flex gap-2">
                            <Input
                                value={secret}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(secret, "Secret key")}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            If you can't scan the QR code, enter this code manually in your authenticator app
                        </p>
                    </div>
                    
                    <Button onClick={() => setSetupStep("verify")} className="w-full">
                        Next: Verify Code
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (setupStep === "verify") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verify Your Authenticator</CardTitle>
                    <CardDescription>
                        Step 2: Enter the 6-digit code from your authenticator app
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="verify-code">Verification Code</Label>
                        <Input
                            id="verify-code"
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            className="text-center text-2xl tracking-widest font-mono"
                        />
                    </div>
                    
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setSetupStep("qr")}
                            disabled={loading}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleVerifyCode}
                            disabled={loading || verificationCode.length !== 6}
                            className="flex-1"
                        >
                            {loading ? "Verifying..." : "Verify and Enable"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (setupStep === "backup") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Save Your Backup Codes</CardTitle>
                    <CardDescription>
                        Step 3: Store these codes in a safe place
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                            Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                        </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Your Backup Codes</Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={downloadBackupCodes}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                            {backupCodes.map((code, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{i + 1}.</span>
                                    <span>{code}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <Button onClick={handleComplete} className="w-full">
                        Complete Setup
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                    Add an extra layer of security to your account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Enabled</AlertTitle>
                    <AlertDescription>
                        Two-factor authentication adds an extra layer of security by requiring a code from your authenticator app when signing in.
                    </AlertDescription>
                </Alert>
                
                <Button onClick={handleSetupStart} disabled={loading} className="w-full">
                    {loading ? "Setting up..." : "Enable Two-Factor Authentication"}
                </Button>
                
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}