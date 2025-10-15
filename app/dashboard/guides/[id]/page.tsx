import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function GuideDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Obtener la guía
  const { data: guide, error } = await supabase
    .from('medical_guides')
    .select(`
      *,
      category:categories(name),
      creator:profiles!medical_guides_created_by_fkey(full_name, specialty)
    `)
    .eq('id', params.id)
    .single()

  if (error || !guide) {
    notFound()
  }

  // Registrar el acceso
  await supabase.from('access_logs').insert({
    user_id: user.id,
    guide_id: guide.id,
  })

  // Obtener URL firmada del archivo
  const { data: signedUrlData } = await supabase.storage
    .from('medical-guides')
    .createSignedUrl(guide.file_url, 3600) // URL válida por 1 hora

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/dashboard" className="hover:text-gray-700">
                  Dashboard
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/dashboard/guides" className="hover:text-gray-700">
                  Guías
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">{guide.title}</li>
            </ol>
          </nav>

          {/* Contenido */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {guide.category?.name || 'Sin categoría'}
                    </span>
                    {!guide.is_published && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Borrador
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {guide.title}
                  </h1>
                  <p className="text-gray-600">
                    {guide.description}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {guide.tags && guide.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {guide.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>
                    {guide.creator?.full_name || 'Desconocido'}
                    {guide.creator?.specialty && ` · ${guide.creator.specialty}`}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(guide.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-3">
                {signedUrlData?.signedUrl && (
                  <a
                    href={signedUrlData.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Documento
                  </a>
                )}
                {signedUrlData?.signedUrl && (
                  <a
                    href={signedUrlData.signedUrl}
                    download
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar
                  </a>
                )}
              </div>
            </div>

            {/* Vista previa del documento */}
            {signedUrlData?.signedUrl && guide.file_type === 'application/pdf' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <iframe
                    src={signedUrlData.signedUrl}
                    className="w-full h-full"
                    title="Vista previa del documento"
                  />
                </div>
              </div>
            )}
          </div>    
        </div>
      </main>
    </div>
  )
}