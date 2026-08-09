import { MetadataRoute } from 'next'

import { dbAdmin } from '@/lib/firebase-admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ikadiy.uii.ac.id'

  // 1. Rute statis utama
  const staticRoutes = [
    '',
    '/agenda',
    '/berita',
    '/direktori-bisnis',
    '/layanan',
    '/tentang-kami',
    '/pengurus',
    '/statistik',
    '/galeri',
    '/virtual-run',
    '/run',
  ]

  const sitemapData: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  try {
    // 2. Fetch Berita
    const beritaSnap = await dbAdmin.collection('berita').where('status', '==', 'Published').get()
    beritaSnap.docs.forEach((doc) => {
      const data = doc.data()
      // Misal format URL berita: /berita/[slug]-[id] atau /berita/[id]
      const slug = data.slug || doc.id
      sitemapData.push({
        url: `${baseUrl}/berita/${slug}`,
        lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      })
    })

    // 3. Fetch Agenda
    const agendaSnap = await dbAdmin.collection('agenda').get()
    agendaSnap.docs.forEach((doc) => {
      const data = doc.data()
      const titleSlug = data.judul ? data.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'agenda'
      sitemapData.push({
        url: `${baseUrl}/agenda/${titleSlug}-${doc.id}`,
        lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })

    // 4. Fetch Direktori Bisnis
    const bisnisSnap = await dbAdmin.collection('direktori_bisnis').where('status', '==', 'Approved').get()
    bisnisSnap.docs.forEach((doc) => {
      sitemapData.push({
        url: `${baseUrl}/direktori-bisnis/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    })

    // 5. Fetch Masterclass
    const masterclassSnap = await dbAdmin.collection('masterclass_courses').get()
    masterclassSnap.docs.forEach((doc) => {
      sitemapData.push({
        url: `${baseUrl}/masterclass/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })

  } catch (error) {
    console.error('Sitemap Generation Error:', error)
  }

  return sitemapData
}
