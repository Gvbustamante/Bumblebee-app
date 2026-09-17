import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Spinner from './components/Spinner'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import PrimerAcceso from './pages/PrimerAcceso'
import VerificarCertificado from './pages/VerificarCertificado'
import NotFound from './pages/NotFound'
import Forbidden from './pages/Forbidden'
import Home from './pages/Home'

import { ROLES } from './lib/roles'

// Code-splitting por ruta: cada módulo de negocio se carga bajo demanda en vez de ir todo en
// un único bundle (ver docs/ROADMAP.md, aviso de vite build sobre chunks > 500kB).
const UsuariosList = lazy(() => import('./features/usuarios/pages/UsuariosList'))
const DiplomadosList = lazy(() => import('./features/diplomados/pages/DiplomadosList'))
const DiplomadoForm = lazy(() => import('./features/diplomados/pages/DiplomadoForm'))
const DiplomadoDetalle = lazy(() => import('./features/diplomados/pages/DiplomadoDetalle'))
const ModuloForm = lazy(() => import('./features/modulos/pages/ModuloForm'))
const ModuloDetalle = lazy(() => import('./features/modulos/pages/ModuloDetalle'))
const FinancieroAdmin = lazy(() => import('./features/financiero/pages/FinancieroAdmin'))
const MisPagos = lazy(() => import('./features/financiero/pages/MisPagos'))
const Comunicacion = lazy(() => import('./features/comunicacion/pages/Comunicacion'))
const TareasGestionList = lazy(() => import('./features/tareas_gestion/pages/TareasGestionList'))
const Biblioteca = lazy(() => import('./features/biblioteca/pages/Biblioteca'))
const CertificadosAdmin = lazy(() => import('./features/certificados/pages/CertificadosAdmin'))
const CertificadosLider = lazy(() => import('./features/certificados/pages/CertificadosLider'))
const MisCertificados = lazy(() => import('./features/certificados/pages/MisCertificados'))
const CertificadoDetalle = lazy(() => import('./features/certificados/pages/CertificadoDetalle'))
const Ayuda = lazy(() => import('./features/ayuda/pages/Ayuda'))
const Agenda = lazy(() => import('./features/eventos/pages/Agenda'))
const Devocionales = lazy(() => import('./features/devocionales/pages/Devocionales'))
const Calendario = lazy(() => import('./features/calendario/pages/Calendario'))
const Programas = lazy(() => import('./features/programas/pages/Programas'))
const SpellingBeeApp = lazy(() => import('./features/spelling-bee/SpellingBeeApp'))

const STAFF = [ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.DOCENTE]
const TODOS = [ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.DOCENTE, ROLES.ESTUDIANTE]

export default function App() {
  const { loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/:slug" element={<Login />} />
        <Route path="/primer-acceso" element={<PrimerAcceso />} />
        <Route path="/verificar/:codigo" element={<VerificarCertificado />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/spelling-bee" element={<SpellingBeeApp />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />

          <Route
            path="/programas"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <Programas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <UsuariosList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/financiero"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <FinancieroAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-pagos"
            element={
              <ProtectedRoute roles={[ROLES.ESTUDIANTE]}>
                <MisPagos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comunicacion"
            element={
              <ProtectedRoute roles={STAFF}>
                <Comunicacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tareas-gestion"
            element={
              <ProtectedRoute roles={STAFF}>
                <TareasGestionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/biblioteca"
            element={
              <ProtectedRoute roles={TODOS}>
                <Biblioteca />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayuda"
            element={
              <ProtectedRoute roles={TODOS}>
                <Ayuda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute roles={TODOS}>
                <Agenda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devocionales"
            element={
              <ProtectedRoute roles={TODOS}>
                <Devocionales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario"
            element={
              <ProtectedRoute roles={TODOS}>
                <Calendario />
              </ProtectedRoute>
            }
          />

          <Route
            path="/diplomados"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.ESTUDIANTE]}>
                <DiplomadosList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diplomados/nuevo"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <DiplomadoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diplomados/:id/editar"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <DiplomadoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diplomados/:id"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.ESTUDIANTE]}>
                <DiplomadoDetalle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diplomados/:diplomadoId/modulos/nuevo"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER]}>
                <ModuloForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modulos/:id/editar"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER]}>
                <ModuloForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modulos/:id"
            element={
              <ProtectedRoute roles={TODOS}>
                <ModuloDetalle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/certificados"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.ESTUDIANTE]}>
                <RoleSwitchCertificados />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificados/:id"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.ESTUDIANTE]}>
                <CertificadoDetalle />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

function RoleSwitchCertificados() {
  const { profile } = useAuth()
  if (profile.role === ROLES.ADMINISTRADOR) return <CertificadosAdmin />
  if (profile.role === ROLES.LIDER) return <CertificadosLider />
  return <MisCertificados />
}
