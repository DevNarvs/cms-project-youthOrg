import { PublicLayout } from '@/components/layouts/PublicLayout'

export function OrganizationsPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Organizations</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Browse all youth organizations in our network.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">ORG</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Organization Name</h2>
                <p className="text-sm text-muted-foreground">Youth Development</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Organizations will be dynamically loaded from the database.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
