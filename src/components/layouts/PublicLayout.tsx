import { ReactNode } from 'react'
import { Navbar } from '../Navbar'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Youth Organization CMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
