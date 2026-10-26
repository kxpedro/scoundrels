import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsroomSidebar } from "@/components/newsroom/sidebar";

export const metadata: Metadata = { title: "Redação", robots: { index: false, follow: false } };

export default function NewsroomLayout({ children }: LayoutProps<"/[lang]/redacao">) {
  return (
    <div className="grid flex-1 md:grid-cols-[200px_minmax(0,1fr)]">
      <Suspense fallback={<aside className="hidden bg-[#100e18] md:block" />}>
        <NewsroomSidebar />
      </Suspense>
      <main className="min-w-0 px-4 py-6 sm:px-7">{children}</main>
    </div>
  );
}
