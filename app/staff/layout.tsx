import { ClerkProvider } from "@clerk/nextjs";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
    <ClerkProvider>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
    </ClerkProvider>
    </div>
  );
}