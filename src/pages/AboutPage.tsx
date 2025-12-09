import { PublicLayout } from '@/components/layouts/PublicLayout'

export function AboutPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            This is the About Us page. Content will be managed through the CMS and can be
            customized by administrators.
          </p>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              To empower youth organizations with modern tools for content management and
              community engagement.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground">
              A world where every youth organization can effectively communicate and share
              their impact with their communities.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
