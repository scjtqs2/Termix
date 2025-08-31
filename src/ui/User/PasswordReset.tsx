import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Key} from "lucide-react";
import React from "react";

export function PasswordReset() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5"/>
                    Password
                </CardTitle>
                <CardDescription>
                    Change your account password
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Password change functionality can be implemented here
                </p>
            </CardContent>
        </Card>
    )
}