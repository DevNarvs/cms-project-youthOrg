import { supabase } from './supabase'
import type { Program, Announcement, Organization } from '@/types/database'

export interface PDFGeneratorOptions {
  organizationId: string
  includePrograms?: boolean
  includeAnnouncements?: boolean
  includeArchived?: boolean
}

export async function generateOrganizationReport(
  options: PDFGeneratorOptions
): Promise<string> {
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, description, contact_email, contact_phone')
    .eq('id', options.organizationId)
    .single()

  let programs: Program[] = []
  let announcements: Announcement[] = []

  if (options.includePrograms) {
    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('organization_id', options.organizationId)
      .eq('archived', options.includeArchived || false)
      .eq('approved', true)
      .order('start_date', { ascending: true })

    programs = data || []
  }

  if (options.includeAnnouncements) {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('organization_id', options.organizationId)
      .eq('archived', options.includeArchived || false)
      .eq('approved', true)
      .order('publish_date', { ascending: false })

    announcements = data || []
  }

  return generateHTML(org, programs, announcements)
}

function generateHTML(
  org: Organization | null,
  programs: Program[],
  announcements: Announcement[]
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${org?.name || 'Organization'} Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }

    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }

    h1 {
      color: #1e40af;
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .report-date {
      color: #64748b;
      font-size: 0.9em;
      margin-top: 10px;
    }

    .org-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 40px;
    }

    .org-info p {
      margin: 5px 0;
    }

    section {
      margin-bottom: 50px;
    }

    h2 {
      color: #1e40af;
      font-size: 1.8em;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    thead {
      background: #3b82f6;
      color: white;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    tbody tr:hover {
      background: #f8fafc;
    }

    .announcement {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .announcement h3 {
      color: #1e40af;
      margin-bottom: 10px;
    }

    .announcement .date {
      color: #64748b;
      font-size: 0.9em;
      margin-bottom: 10px;
    }

    .announcement .content {
      color: #475569;
      white-space: pre-wrap;
    }

    footer {
      margin-top: 60px;
      text-align: center;
      color: #64748b;
      font-size: 0.9em;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    @media print {
      body {
        padding: 20px;
      }

      .announcement {
        page-break-inside: avoid;
      }

      table {
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <header>
    ${org?.logo_url ? `<img src="${org.logo_url}" alt="Logo" class="logo" />` : ''}
    <h1>${org?.name || 'Organization'}</h1>
    <div class="report-date">
      Generated on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </div>
  </header>


  ${programs.length > 0 ? `
    <section>
      <h2>Programs</h2>
      <table>
        <thead>
          <tr>
            <th>Program Name</th>
            <th>Description</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          ${programs.map(p => `
            <tr>
              <td><strong>${p.name}</strong></td>
              <td>${p.description}</td>
              <td>${p.start_date ? new Date(p.start_date).toLocaleDateString() : 'TBD'}</td>
              <td>${p.end_date ? new Date(p.end_date).toLocaleDateString() : 'TBD'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  ` : ''}

  ${announcements.length > 0 ? `
    <section>
      <h2>Announcements</h2>
      ${announcements.map(a => `
        <div class="announcement">
          <h3>${a.title}</h3>
          <div class="date">${new Date(a.published_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
          <div class="content">${a.content}</div>
        </div>
      `).join('')}
    </section>
  ` : ''}

  <footer>
    <p>This report was automatically generated by ${org?.name || 'Youth Organization CMS'}</p>
  </footer>
</body>
</html>
  `.trim()
}

export function downloadHTMLAsPDF(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function printReport(options: PDFGeneratorOptions): Promise<void> {
  const html = await generateOrganizationReport(options)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.')
  }

  printWindow.document.write(html)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.print()
  }
}

export async function downloadReport(
  options: PDFGeneratorOptions,
  filename?: string
): Promise<void> {
  const html = await generateOrganizationReport(options)
  const defaultFilename = `report-${Date.now()}.html`
  downloadHTMLAsPDF(html, filename || defaultFilename)
}
