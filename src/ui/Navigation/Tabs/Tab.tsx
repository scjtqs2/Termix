import React from "react";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Home, SeparatorVertical, X} from "lucide-react";

interface TabProps {
    tabType: string;
    title?: string;
    isActive?: boolean;
    onActivate?: () => void;
    onClose?: () => void;
    onSplit?: () => void;
    canSplit?: boolean;
    canClose?: boolean;
    disableActivate?: boolean;
    disableSplit?: boolean;
    disableClose?: boolean;
}

export function Tab({tabType, title, isActive, onActivate, onClose, onSplit, canSplit = false, canClose = false, disableActivate = false, disableSplit = false, disableClose = false}: TabProps): React.ReactElement {
    if (tabType === "home") {
        return (
            <Button
                variant="outline"
                className={`!px-2 border-1 border-[#303032] ${isActive ? '!bg-[#1d1d1f] !text-white !border-[#2d2d30]' : ''}`}
                onClick={onActivate}
                disabled={disableActivate}
            >
                <Home/>
            </Button>
        );
    }

    if (tabType === "terminal") {
        return (
            <ButtonGroup>
                <Button
                    variant="outline"
                    className={`!px-2 border-1 border-[#303032] ${isActive ? '!bg-[#1d1d1f] !text-white !border-[#2d2d30]' : ''}`}
                    onClick={onActivate}
                    disabled={disableActivate}
                >
                    {title || "Terminal"}
                </Button>
                {canSplit && (
                    <Button
                        variant="outline"
                        className="!px-2 border-1 border-[#303032]"
                        onClick={onSplit}
                        disabled={disableSplit}
                        title={disableSplit ? 'Cannot split this tab' : 'Split'}
                    >
                        <SeparatorVertical className="w-[28px] h-[28px]" />
                    </Button>
                )}
                {canClose && (
                    <Button
                        variant="outline"
                        className="!px-2 border-1 border-[#303032]"
                        onClick={onClose}
                        disabled={disableClose}
                    >
                        <X/>
                    </Button>
                )}
            </ButtonGroup>
        );
    }

    if (tabType === "ssh_manager") {
        return (
            <ButtonGroup>
                <Button
                    variant="outline"
                    className={`!px-2 border-1 border-[#303032] ${isActive ? '!bg-[#1d1d1f] !text-white !border-[#2d2d30]' : ''}`}
                    onClick={onActivate}
                    disabled={disableActivate}
                >
                    {title || "SSH Manager"}
                </Button>
                <Button
                    variant="outline"
                    className="!px-2 border-1 border-[#303032]"
                    onClick={onClose}
                    disabled={disableClose}
                >
                    <X/>
                </Button>
            </ButtonGroup>
        );
    }

    return null;
}
