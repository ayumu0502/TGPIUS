import type { ReactNode } from "react";
import BackButton from "@/components/ui/BackButton";

type PremiumMessagesShellProps = {
  children: ReactNode;
  sidebar: ReactNode;
  activeConversationId?: string;
};

export default function PremiumMessagesShell({
  children,
  sidebar,
  activeConversationId,
}: PremiumMessagesShellProps) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col lg:flex-row">
      {activeConversationId ? (
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] bg-white px-4 py-3 lg:hidden">
          <BackButton />
        </div>
      ) : null}

      <aside
        className={`flex w-full flex-col border-[var(--card-border)] bg-white lg:w-96 lg:shrink-0 lg:border-r ${
          activeConversationId ? "hidden lg:flex" : "flex"
        }`}
      >
        {sidebar}
      </aside>

      <main
        className={`min-h-0 flex-1 flex-col bg-[var(--content-bg)] ${
          activeConversationId ? "flex" : "hidden lg:flex"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
