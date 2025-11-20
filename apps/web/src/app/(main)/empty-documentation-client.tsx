"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

const AGENTS = [
  { id: "cursor", name: "Cursor" },
  { id: "windsurf", name: "Windsurf" },
  { id: "github-copilot", name: "GitHub Copilot" },
];

const INIT_COMMAND_PREFIX = "davia init --agent=";
const AGENT_PROMPT =
  "Generate documentation of my repository using Davia. Create 5 pages to document the project.";

export function EmptyDocumentationClient() {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]!.id);

  const initCommand = `${INIT_COMMAND_PREFIX}${selectedAgent}`;

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(initCommand);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="w-full space-y-8">
      <p className="text-lg text-muted-foreground">
        You haven&apos;t generated any documentation yet.
      </p>

      <div className="flex justify-center">
        <Tabs
          value={selectedAgent}
          onValueChange={setSelectedAgent}
          className="w-full max-w-md"
        >
          <TabsList className="w-full grid grid-cols-3">
            {AGENTS.map((agent) => (
              <TabsTrigger key={agent.id} value={agent.id}>
                {agent.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <div className="flex gap-4">
          <span className="text-primary font-bold text-xl shrink-0 leading-6">
            1.
          </span>
          <div className="flex-1 space-y-3">
            <p className="text-base font-medium leading-6">
              Run the command in the terminal:
            </p>
            <div className="relative group">
              <code className="bg-muted border border-border p-4 pr-14 text-base rounded-lg block font-mono select-all break-all text-left">
                {initCommand}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 size-10 hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                onClick={handleCopyCommand}
                aria-label="Copy command"
              >
                {copiedCommand ? (
                  <CheckIcon className="size-5 text-green-600" />
                ) : (
                  <CopyIcon className="size-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <span className="text-primary font-bold text-xl shrink-0 leading-6">
            2.
          </span>
          <div className="flex-1 space-y-3">
            <p className="text-base font-medium leading-6">
              To generate docs, ask your coding agent:
            </p>
            <div className="relative group">
              <code className="bg-muted border border-border p-4 pr-14 text-base rounded-lg block font-mono select-all break-all text-left">
                {AGENT_PROMPT}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 size-10 hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                onClick={handleCopyPrompt}
                aria-label="Copy prompt"
              >
                {copiedPrompt ? (
                  <CheckIcon className="size-5 text-green-600" />
                ) : (
                  <CopyIcon className="size-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
