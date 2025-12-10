import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  noindex?: boolean
  canonical?: string
}

export function SEO({
  title,
  description = 'Youth Organization CMS - Manage programs, announcements, and content for youth organizations',
  keywords = 'youth organization, cms, programs, announcements, volunteer management',
  ogImage = '/og-image.png',
  ogType = 'website',
  noindex = false,
  canonical
}: SEOProps) {
  const appName = import.meta.env.VITE_APP_NAME || 'Youth Organization CMS'
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const fullTitle = title ? `${title} | ${appName}` : appName
  const fullCanonical = canonical || window.location.href

  useEffect(() => {
    document.title = fullTitle

    updateMetaTag('name', 'description', description)
    updateMetaTag('name', 'keywords', keywords)

    updateMetaTag('property', 'og:title', fullTitle)
    updateMetaTag('property', 'og:description', description)
    updateMetaTag('property', 'og:image', `${appUrl}${ogImage}`)
    updateMetaTag('property', 'og:url', fullCanonical)
    updateMetaTag('property', 'og:type', ogType)

    updateMetaTag('name', 'twitter:card', 'summary_large_image')
    updateMetaTag('name', 'twitter:title', fullTitle)
    updateMetaTag('name', 'twitter:description', description)
    updateMetaTag('name', 'twitter:image', `${appUrl}${ogImage}`)

    if (noindex) {
      updateMetaTag('name', 'robots', 'noindex, nofollow')
    } else {
      updateMetaTag('name', 'robots', 'index, follow')
    }

    updateLinkTag('canonical', fullCanonical)
  }, [fullTitle, description, keywords, ogImage, ogType, noindex, fullCanonical, appUrl])

  return null
}

function updateMetaTag(attribute: string, key: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.href = href
}
