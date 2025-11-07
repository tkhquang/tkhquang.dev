import "@/assets/styles/(frames)/index.css";
import { Main } from "@/components/layout";
import AppProvider from "@/providers/AppProvider";

export default function FrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <Main className="flex-1">{children}</Main>
    </AppProvider>
  );
}
