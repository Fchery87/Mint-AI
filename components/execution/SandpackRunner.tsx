"use client";

import { Sandpack } from "@codesandbox/sandpack-react";
import type { ProjectFile } from "@/lib/project-types";
import { projectFilesToSandpack } from "@/lib/execution/sandpack-executor";

interface SandpackRunnerProps {
  files: ProjectFile[];
  className?: string;
}

export function SandpackRunner({ files, className }: SandpackRunnerProps) {
  const config = projectFilesToSandpack(files);

  return (
    <div className={className}>
      <Sandpack
        template={config.template}
        files={config.files}
        customSetup={
          config.dependencies ? { dependencies: config.dependencies } : undefined
        }
        options={{
          showNavigator: true,
          showLineNumbers: true,
          showTabs: true,
          editorHeight: 420,
          resizablePanels: true,
        }}
      />
    </div>
  );
}

