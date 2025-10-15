import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function GuidesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Obtener categorías
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Obtener guías
  let guidesQuery = supabase
    .from('medical_guides')
    .select(`
      *,
      category:categories(name),
      creator:profiles!medical_guides_created_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  // Si no es admin o editor, solo mostrar publicadas
  if (profile?.role === 'viewer') {
    guidesQuery = guidesQuery.eq('is_published', true)
  }

  const { data: guides } = await guidesQuery

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guías Médicas</h1>
              <p className="mt-2 text-gray-600">
                Explora todas las guías disponibles
              </p>
            </div>
            {(profile?.role === 'admin' || profile?.role === 'editor') && (
              <Link
                href="/dashboard/upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                + Nueva Guía
              </Link>
            )}
          </div>

          {/* Filtros por categoría */}
          {categories && categories.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrar por categoría:</h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200">
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de guías */}
          {guides && guides.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/dashboard/guides/${guide.id}`}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {guide.category?.name || 'Sin categoría'}
                      </span>
                      {!guide.is_published && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Borrador
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {guide.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {guide.description || 'Sin descripción'}
                    </p>

                    {guide.tags && guide.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {guide.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                          >
                            #{tag}
                          </span>
                        ))}
                        {guide.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{guide.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {guide.creator?.full_name || 'Desconocido'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay guías disponibles</h3>
              <p className="mt-1 text-sm text-gray-500">
                {profile?.role === 'admin' || profile?.role === 'editor' 
                  ? 'Comienza subiendo tu primera guía médica.'
                  : 'Aún no hay guías publicadas.'}
              </p>
              {(profile?.role === 'admin' || profile?.role === 'editor') && (
                <div className="mt-6">
                  <Link
                    href="/dashboard/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Guía
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}