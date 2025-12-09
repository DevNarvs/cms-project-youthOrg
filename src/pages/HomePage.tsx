import { PublicLayout } from '@/components/layouts/PublicLayout'

export function HomePage() {
  return (
    <PublicLayout>
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to Youth Organization CMS
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering youth organizations to manage their content and reach their communities.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-2">Program 1</h3>
              <p className="text-muted-foreground">
                Content will be dynamically loaded from the database.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-2">Program 2</h3>
              <p className="text-muted-foreground">
                Content will be dynamically loaded from the database.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-2">Program 3</h3>
              <p className="text-muted-foreground">
                Content will be dynamically loaded from the database.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
