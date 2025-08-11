import React from "react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

interface HomepageWelcomeCardProps {
    onHidePermanently: () => void;
}

export function HomepageWelcomeCard({onHidePermanently}: HomepageWelcomeCardProps): React.ReactElement {
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    The Future of Termix
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                    Please checkout the linked survey{" "}
                    <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSeGvnQODFtnpjmJsMKgASbaQ87CLQEBCcnzK_Vuw5TdfbfIyA/viewform?usp=sharing&ouid=107601685503825301492"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                        here
                    </a>
                    . The purpose of this survey is to gather feedback from users on what the future UI of Termix could
                    look like to optimize server management. Please take a minute or two to read the survey questions
                    and answer them to the best of your ability. Thank you!
                </p>
                <p className="text-muted-foreground text-center leading-relaxed mt-6">
                    A special thanks to those in Asia who recently joined Termix through various forum posts, keep
                    sharing it! A Chinese translation is planned for Termix, but since I don’t speak Chinese, I’ll need
                    to hire someone to help with the translation. If you’d like to support me financially, you can do
                    so{" "}
                    <a
                        href="https://github.com/sponsors/LukeGus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                        here.
                    </a>
                </p>
            </CardContent>
            <CardFooter className="justify-center">
                <Button
                    variant="outline"
                    onClick={onHidePermanently}
                    className="w-full max-w-xs"
                >
                    Hide Permanently
                </Button>
            </CardFooter>
        </Card>
    );
}
