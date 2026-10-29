import { Link2 } from "lucide-react";
import { LinkGenerator } from "@/components/link-generator";

export default function Home() {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
            <Link2 className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold text-slate-900 sm:text-lg">
            NewJaisa Sales Link Generator
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Generate Sales Tracking Links
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Generate tracking links for NewJaisa products, collections, and landing
          pages to help measure sales attributed to our Sales Team.
        </p>

        <div className="mt-8">
          <LinkGenerator />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <p className="mx-auto max-w-3xl px-4 py-4 text-sm text-slate-500 sm:px-6">
          This tool only creates links. Visits, orders, and revenue from these links
          are measured in Shopify and Google Analytics 4.
        </p>
      </footer>
    </>
  );
}
