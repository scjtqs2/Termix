import React from "react";
import {ButtonGroup} from "@/components/ui/button-group.tsx";
import {Button} from "@/components/ui/button.tsx";
import {SeparatorVertical, X} from "lucide-react";

export function Tab(): React.ReactElement {
    return (
        <div>
            <ButtonGroup>
                <Button variant="outline" className="!px-2 border-1 border-[#303032]">
                    Server Name
                </Button>
                <Button variant="outline" className="!px-2 border-1 border-[#303032]">
                    <SeparatorVertical className="w-[28px] h-[28px]" />
                </Button>
                <Button variant="outline" className="!px-2 border-1 border-[#303032]">
                    <X/>
                </Button>
            </ButtonGroup>
        </div>
    )
}
