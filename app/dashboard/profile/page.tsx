'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  specialty: string | null
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setSpecialty(profileData.specialty || '')
      }
    }
    
    getProfile()
  }, [supabase, router])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (!user) throw new Error('Usuario no autenticado')
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          specialty: specialty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      
      if (updateError) throw updateError
      
      setSuccess('Perfil actualizado correctamente')
      
      // Actualizar el estado local
      if (profile) {
        setProfile({
          ...profile,
          full_name: fullName,
          specialty: specialty,
        })
      }
    } catch (error: any) {
      setError(error.message || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }
  
  const handleChangePassword = async () => {
    setError(null)
    setSuccess(null)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: prompt('Nueva contraseña:') || ''
      })
      
      if (error) throw error
      
      setSuccess('Contraseña actualizada correctamente')
    } catch (error: any) {
      setError(error.message || 'Error al cambiar la contraseña')
    }
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
<div className="min-h-screen bg-gray-50">
<Navbar user={user} />  <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-2 text-gray-600">
          Administra tu información personal
        </p>
      </div>      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Información de cuenta */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Cuenta</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rol</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{profile.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Miembro desde</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(profile.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
          </dl>
        </div>        {/* Formulario de edición */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dr. Juan Pérez"
            />
          </div>          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
              Especialidad
            </label>
            <input
              id="specialty"
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enfermería, Medicina General, etc."
            />
          </div>          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>        {/* Seguridad */}
        <div className="px-6 py-5 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seguridad</h2>
          <button
            type="button"
            onClick={handleChangePassword}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Cambiar Contraseña
          </button>
        </div>
      </div>      {/* Estadísticas */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Guías Consultadas"
            value="--"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          {(profile.role === 'admin' || profile.role === 'editor') && (
            <StatCard
              title="Guías Creadas"
              value="--"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          )}
        </div>
      </div>
    </div>
  </main>
</div>
)
}function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
return (
<div className="bg-gray-50 rounded-lg p-4">
<div className="flex items-center">
<div className="flex-shrink-0 text-blue-600">
{icon}
</div>
<div className="ml-4">
<p className="text-sm font-medium text-gray-500">{title}</p>
<p className="text-2xl font-semibold text-gray-900">{value}</p>
</div>
</div>
</div>
)
}