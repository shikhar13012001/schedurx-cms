// Clinic sites are complete HTML pages from app/[slug]/route.ts and skip this layout.
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
