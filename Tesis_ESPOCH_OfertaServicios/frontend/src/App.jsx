import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { leerSesion } from './utils/storageSeguro';
import LayoutPublico from './pages/LayoutPublico';
import PublicHome from './pages/PublicHome';
import Noticias from './pages/Noticias';
import Proyectos from './pages/Proyectos';
import Login from './pages/Login';
import EncuestaEmpleador from './pages/EncuestaEmpleador';
import PerfilPublico from './pages/PerfilPublico';
import LayoutGraduado from './pages/graduado/LayoutGraduado';
import PerfilGraduado from './pages/graduado/PerfilGraduado';
import NoticiasGraduado from './pages/graduado/NoticiasGraduado';
import EncuestasGraduado from './pages/graduado/EncuestasGraduado';

import AdminLayout      from './pages/admin/AdminLayout';
import HomeAdmin        from './pages/admin/HomeAdmin';
import GestionGraduados from './pages/admin/GestionGraduados';
import GestionEncuestas from './pages/admin/GestionEncuestas';
import GestionEstadisticas from './pages/admin/GestionEstadisticas';
import GestionReportes  from './pages/admin/GestionReportes';
import GestionEventos   from './pages/admin/GestionEventos';
import GestionEmpleadores from './pages/admin/GestionEmpleadores';

/* ──────────────────────────────────────────────────────
   PLACEHOLDER — Página "Próximamente"
────────────────────────────────────────────────────── */
const Proximamente = ({ titulo, subtitulo, color = '#BE1E2D' }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '55vh',
        textAlign: 'center',
        color: '#718096',
        fontFamily: 'inherit',
        padding: '40px 24px',
    }}>
        <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: `${color}18`,
            border: `1px solid ${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: 18,
        }}>🚧</div>
        <h2 style={{
            margin: '0 0 8px',
            fontSize: '1.1rem',
            fontWeight: '800',
            color: '#2d3748',
        }}>{titulo}</h2>
        {subtitulo && (
            <p style={{
                margin: '0 0 6px',
                fontSize: '0.82rem',
                color: '#718096',
            }}>{subtitulo}</p>
        )}
        <p style={{ margin: 0, fontSize: '0.76rem', color: '#a0aec0' }}>
            Sección en desarrollo · próximo sprint
        </p>
    </div>
);

//PROTEGER LA RUTA
const ProtegerRuta = ({ children, rolRequerido }) => {
    const usuario = leerSesion('usuario');
    if (!usuario) return <Navigate to="/login" replace />;
    if (rolRequerido && usuario.rol !== rolRequerido) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

//APP
function App() {
    return (
        <Router>
            
            <Routes>
                <Route path="/encuesta-empleador" element={<EncuestaEmpleador />} />

                {/* ════════════════════════════════
                    RUTAS PÚBLICAS
                ════════════════════════════════ */}
                <Route element={<LayoutPublico />}>
                    <Route path="/"           element={<PublicHome />} />
                    <Route path="/noticias"   element={<Noticias />} />
                    <Route path="/proyectos"  element={<Proyectos />} />
                </Route>

                <Route path="/perfil/:id" element={<PerfilPublico />} />

                {/* ── LOGIN ── */}
                <Route path="/login" element={<Login />} />

                {/* ════════════════════════════════
                    GRADUADO
                ════════════════════════════════ */}
                <Route
                    path="/graduado"
                    element={
                        <ProtegerRuta rolRequerido="graduado">
                            <LayoutGraduado />
                        </ProtegerRuta>
                    }
                >
                    <Route index         element={<Navigate to="/graduado/perfil" replace />} />
                    <Route path="perfil" element={<PerfilGraduado />} />
                    <Route path="noticias" element={<NoticiasGraduado />} />
                    <Route path="encuestas" element={<EncuestasGraduado />} />
                    <Route path="notificaciones"
                        element={<Proximamente titulo="Notificaciones" />}
                    />
                </Route>

                {/* ════════════════════════════════
                    ADMIN
                ════════════════════════════════ */}
                <Route
                    path="/home-admin"
                    element={
                        <ProtegerRuta rolRequerido="admin">
                            <AdminLayout />
                        </ProtegerRuta>
                    }
                >
                    {/* Panel principal */}
                    <Route index element={<HomeAdmin />} />

                    {/* Gestión de graduados */}
                    <Route path="graduados"  element={<GestionGraduados />} />
                    <Route path="empleadores" element={<GestionEmpleadores />} />

                    {/* Encuestas — Anexo 13 y 14 */}
                    <Route path="encuestas"  element={<GestionEncuestas />} />

                    <Route path="estadisticas"  element={<GestionEstadisticas />} />

                    {/* Reportes — Anexos 19, 21, 25 */}
                    <Route path="reportes"   element={<GestionReportes />} />

                    {/* Eventos y webinars */}
                    <Route path="eventos"    element={<GestionEventos />} />

                    {/* Resultados — próximamente */}
                    <Route
                        path="resultados"
                        element={
                            <Proximamente
                                titulo="Resultados de Encuestas"
                                subtitulo="Análisis de respuestas · Empleabilidad · Competencias"
                                color="#BE1E2D"
                            />
                        }
                    />
                </Route>

                {/* ── COMPATIBILIDAD ── */}
                <Route path="/home-graduado" element={<Navigate to="/graduado/perfil" replace />} />

                {/* ── 404 ── */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Router>
    );
}

export default App;