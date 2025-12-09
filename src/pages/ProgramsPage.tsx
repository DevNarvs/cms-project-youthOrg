import { PublicLayout } from '@/components/layouts/PublicLayout'

export function ProgramsPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Our Programs</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Discover all the programs and activities we offer for youth development.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Sample Program</h2>
            <p className="text-muted-foreground mb-4">
              Programs will be dynamically loaded from the database based on approved content.
            </p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Start Date: TBD</span>
              <span>End Date: TBD</span>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
