// frontend/src/pages/admin/GestionEstadisticas.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    FaGraduationCap, FaClipboardList, FaBuilding,
    FaExclamationTriangle, FaSyncAlt,
} from 'react-icons/fa';

import TabIndicadoresGraduados from './TabIndicadoresGraduados';
import TabEGraduado            from './TabEGraduado';
import TabEEmpleadores         from './TabEEmpleadores';
import { leerSesion } from '../../utils/storageSeguro';

// ── Config ────────────────────────────────────────────────────
const API  = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const ROJO = '#BE1E2D';

const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};

// ── Helpers ───────────────────────────────────────────────────
const pct        = (v, t) => (t === 0 ? 0 : Math.round((v / t) * 100));
const norm       = s => s?.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim() ?? '';
const CANTON_ALIAS = { 'banos': 'banos de agua santa', 'lago agrio': 'nueva loja', 'san miguel de riobamba': 'riobamba' };
const normCanton = n => { const k = norm(n); return CANTON_ALIAS[k] || k; };

// ── Tabs principales ──────────────────────────────────────────
const TABS = [
    { id: 'graduados',   label: 'Indicadores de Seguimiento', icon: FaGraduationCap },
    { id: 'encuestas',   label: 'Graduados',                  icon: FaClipboardList },
    { id: 'empleadores', label: 'Empleadores',                icon: FaBuilding      },
];

// ── Sub-tabs de Graduados ─────────────────────────────────────
const SUB_TABS_GRADUADOS = [
    { id: 'info',       label: 'Información de Graduados' },
    { id: 'resultados', label: 'Resultados de Encuesta'   },
];

// ── Animación global (solo una vez) ──────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('gest-est-kf')) {
    const st = document.createElement('style');
    st.id = 'gest-est-kf';
    st.textContent = `
        @keyframes gest-spin   { to { transform: rotate(360deg); } }
        @keyframes gest-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .gest-anim { animation: gest-fadein 0.28s ease both; }
    `;
    document.head.appendChild(st);
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE MASTER
// ══════════════════════════════════════════════════════════════
const GestionEstadisticas = () => {
    const [tab,              setTab]              = useState('graduados');
    const [subTabGraduados,  setSubTabGraduados]  = useState('info');
    const [datos,            setDatos]            = useState(null);
    const [cargando,         setCargando]         = useState(true);
    const [error,            setError]            = useState('');
    const [filtros,          setFiltros]          = useState({
        anio: '', provincia: '', canton: '', genero: '', disponibilidad: '', especialidad: '',
    });
    const [geoData,  setGeoData]  = useState({ ecuador: null, cantones: null, provincias: null });
    const [geoError, setGeoError] = useState(false);

    // ── Carga GeoJSON ─────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            fetch('/geo/ecuador.geojson').then(r  => { if (!r.ok)  throw new Error(); return r.json();  }),
            fetch('/geo/cantones.geojson').then(r  => { if (!r.ok)  throw new Error(); return r.json();  }),
            fetch('/geo/provinciales.geojson').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        ])
        .then(([ecuador, cantones, provincias]) => setGeoData({ ecuador, cantones, provincias }))
        .catch(() => setGeoError(true));
    }, []);

    // ── Carga estadísticas desde backend ──────────────────────
    const cargar = useCallback(async () => {
        setCargando(true); setError('');
        try {
            const r = await axios.get(`${API}/admin/estadisticas`, { headers: hdrs() });
            setDatos(r.data);
        } catch {
            setError('No se pudieron cargar las estadísticas.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    // ── Cambio de filtros ─────────────────────────────────────
    const cambiarFiltro = useCallback((campo, valor) => {
        setFiltros(prev => {
            const n = { ...prev, [campo]: valor };
            if (campo === 'provincia') { n.canton = ''; n.genero = ''; n.disponibilidad = ''; n.especialidad = ''; }
            if (campo === 'anio')      { n.genero = ''; n.disponibilidad = ''; n.especialidad = ''; }
            if (campo === 'canton')    { n.genero = ''; n.disponibilidad = ''; n.especialidad = ''; }
            return n;
        });
    }, []);

    const limpiar = useCallback(() =>
        setFiltros({ anio: '', provincia: '', canton: '', genero: '', disponibilidad: '', especialidad: '' }),
    []);

    // ── Helpers de análisis ───────────────────────────────────
    const calcularInsightsFrontend = useCallback((params) => {
        const { tasaEmp, tasaVis, promProy, promCert, totalEmp, tot, totalDis,
                totalProv, idxConc, porAnio, anioMax, cTe } = params;
        const insights = [];
        const hayIA     = ['Python', 'TensorFlow', 'Scikit-learn', 'Keras', 'PyTorch'].some(t => cTe[t] > 0);
        const hayCloud  = ['AWS', 'Docker', 'Kubernetes', 'Azure', 'GCP'].some(t => cTe[t] > 0);
        const hayMobile = ['Flutter', 'React Native', 'Kotlin', 'Swift'].some(t => cTe[t] > 0);

        if      (tasaEmp >= 80) insights.push({ tipo: 'ok',   titulo: `Alta empleabilidad: ${tasaEmp}%`,       detalle: `${totalEmp} de ${tot} graduados empleados. Posición competitiva sólida.` });
        else if (tasaEmp >= 60) insights.push({ tipo: 'warn', titulo: `Empleabilidad moderada: ${tasaEmp}%`,   detalle: `${totalDis} graduados buscan empleo. Fortalecer la bolsa de empleo.` });
        else                    insights.push({ tipo: 'crit', titulo: `Empleabilidad crítica: ${tasaEmp}%`,    detalle: 'Más del 40% sin empleo. Acción urgente: ferias y convenios empresariales.' });

        if (tasaVis >= 80) insights.push({ tipo: 'ok',   titulo: `Alta visibilidad: ${tasaVis}% perfiles públicos`, detalle: 'Empleadores tienen acceso a la mayoría. Mantener incentivos de completitud.' });
        else               insights.push({ tipo: 'warn', titulo: `Solo ${tasaVis}% con perfil visible`,             detalle: 'Muchos perfiles ocultos. Campaña: verificar tesis y activar perfil.' });

        if (porAnio.length >= 2) {
            const ult = porAnio[porAnio.length - 1], pen = porAnio[porAnio.length - 2];
            const delta = ult.total - pen.total;
            if      (delta > 0) insights.push({ tipo: 'ok',   titulo: `Crecimiento: +${delta} en ${ult.anio}`,           detalle: `De ${pen.total} (${pen.anio}) a ${ult.total} (${ult.anio}). Carrera en expansión.` });
            else if (delta < 0) insights.push({ tipo: 'warn', titulo: `Descenso: ${Math.abs(delta)} menos en ${ult.anio}`, detalle: `De ${pen.total} (${pen.anio}) a ${ult.total} (${ult.anio}). Revisar deserción.` });
            else                insights.push({ tipo: 'info', titulo: `Graduaciones estables: ${ult.total}/año`,          detalle: 'Número consistente. Evaluar estrategias para mayor tasa oportuna.' });
        }

        if      (idxConc > 75 && totalProv < 5) insights.push({ tipo: 'warn', titulo: `Alta concentración: ${idxConc}% en top 3 provincias`, detalle: 'Poca distribución. Promover movilidad y alianzas regionales.' });
        else if (totalProv >= 8)                 insights.push({ tipo: 'ok',   titulo: `Distribución en ${totalProv} provincias`,              detalle: 'Buena presencia nacional institucional.' });
        else                                     insights.push({ tipo: 'info', titulo: `Presencia en ${totalProv} provincias`,                 detalle: 'Objetivo: superar 8 provincias activas.' });

        if      (promProy >= 3)   insights.push({ tipo: 'ok',   titulo: `Excelente portafolio: ${promProy} proy/graduado`, detalle: 'Ventaja competitiva visible para empleadores.' });
        else if (promProy >= 1.5) insights.push({ tipo: 'info', titulo: `Portafolio moderado: ${promProy} proy/graduado`,  detalle: 'Incentivar publicación de proyectos de tesis y personales.' });
        else                      insights.push({ tipo: 'warn', titulo: `Portafolio bajo: ${promProy} proy/graduado`,      detalle: 'Muy pocos proyectos. Campaña: publicar tesis y proyectos académicos.' });

        if      (promCert >= 3) insights.push({ tipo: 'ok',   titulo: `Alta certificación: ${promCert}/graduado`, detalle: 'Excelente nivel. Refleja aprendizaje continuo.' });
        else if (promCert < 1)  insights.push({ tipo: 'warn', titulo: `Baja certificación: ${promCert}/graduado`, detalle: 'Organizar talleres de certificaciones AWS, Google, Microsoft.' });

        if (hayIA)      insights.push({ tipo: 'ok',   titulo: 'Presencia en IA/ML detectada',         detalle: 'Skills IA/ML presentes. Alta demanda global.' });
        if (hayCloud)   insights.push({ tipo: 'ok',   titulo: 'Competencias Cloud/DevOps presentes',  detalle: 'Incentivar certificaciones oficiales AWS/Azure/GCP.' });
        if (!hayMobile) insights.push({ tipo: 'info', titulo: 'Escasa presencia en desarrollo móvil', detalle: 'Flutter y React Native tienen alta demanda laboral.' });

        if (anioMax?.total > 0 && porAnio.length > 1) {
            insights.push({ tipo: 'info', titulo: `Año récord: ${anioMax.anio} con ${anioMax.total} graduados`, detalle: `Analizar factores de ${anioMax.anio} para replicar ese rendimiento.` });
        }
        return insights;
    }, []);

    const calcularPlanFrontend = useCallback(({ tasaEmp, tasaVis, promProy, promCert, totalProv, cTe }) => {
        const hayMobile = ['Flutter', 'React Native', 'Kotlin', 'Swift'].some(t => cTe[t] > 0);
        return [
            tasaEmp  < 70  && { prioridad: 1, accion: 'Activar bolsa de empleo institucional',       impacto: 'alto',  meta: 'Reducir desempleo a menos del 20%' },
            tasaVis  < 70  && { prioridad: 2, accion: 'Campaña de activación de perfiles públicos',  impacto: 'alto',  meta: `Llevar visibilidad del ${tasaVis}% al 80%` },
            promProy < 2   && { prioridad: 3, accion: 'Campaña de publicación de proyectos y tesis', impacto: 'medio', meta: 'Alcanzar 2+ proyectos por graduado' },
            promCert < 1.5 && { prioridad: 4, accion: 'Talleres de certificación tecnológica',       impacto: 'medio', meta: 'Alcanzar 2+ certificaciones promedio' },
            !hayMobile     && { prioridad: 5, accion: 'Agregar Flutter/React Native al pensum',      impacto: 'medio', meta: 'Cubrir demanda de desarrollo móvil' },
            totalProv < 5  && { prioridad: 6, accion: 'Convenios con empresas fuera de Chimborazo', impacto: 'bajo',  meta: 'Graduados en 8+ provincias' },
        ].filter(Boolean);
    }, []);

    // ── Datos filtrados (recalcula TODO desde el raw) ─────────
    const df = useMemo(() => {
        if (!datos?.graduadosRaw) return datos;

        let lista = datos.graduadosRaw;
        if (filtros.anio)           lista = lista.filter(g => String(g.anioGraduacion) === filtros.anio);
        if (filtros.provincia)      lista = lista.filter(g => g.provinciaActual === filtros.provincia);
        if (filtros.canton)         lista = lista.filter(g => g.cantonActual === filtros.canton);
        if (filtros.genero)         lista = lista.filter(g => g.genero === filtros.genero);
        if (filtros.disponibilidad) lista = lista.filter(g => g.disponibilidad === filtros.disponibilidad);
        if (filtros.especialidad)   lista = lista.filter(g => (g.afinidades || []).some(a => a.categoria === filtros.especialidad));

        const tot      = lista.length;
        const totalDis = lista.filter(g => g.disponibilidad === 'disponible').length;
        const totalPub = lista.filter(g => g.perfilPublico).length;
        const totalEmp = tot - totalDis;

        const cGe = {}, cAn = {}, cPr = {}, cCa = {}, cTe = {}, cAf = {}, cHa = {};
        lista.forEach(g => {
            const kg = g.genero || 'No esp.'; cGe[kg] = (cGe[kg] || 0) + 1;
            if (g.anioGraduacion)              cAn[g.anioGraduacion] = (cAn[g.anioGraduacion] || 0) + 1;
            const kp = g.provinciaActual?.trim(); if (kp) cPr[kp] = (cPr[kp] || 0) + 1;
            const kc = normCanton(g.cantonActual); if (kc) cCa[kc] = (cCa[kc] || 0) + 1;
            (g.tecnologias || []).forEach(t => { if (t) cTe[t] = (cTe[t] || 0) + 1; });
            (g.afinidades || []).forEach(a => { if (a.categoria) cAf[a.categoria] = (cAf[a.categoria] || 0) + 1; });
            (g.habilidadesBlandas || []).forEach(h => { if (h) cHa[h] = (cHa[h] || 0) + 1; });
        });

        const porAnio       = Object.entries(cAn).map(([a, t]) => ({ anio: parseInt(a), total: t })).sort((a, b) => a.anio - b.anio);
        const anioMax       = porAnio.reduce((mx, a) => a.total > mx.total ? a : mx, { anio: 0, total: 0 });
        const porProvFinal  = Object.entries(cPr).map(([provincia, total]) => ({ provincia, total })).sort((a, b) => b.total - a.total);
        const porCantonFinal = Object.entries(cCa).map(([canton, total]) => ({ canton, total })).sort((a, b) => b.total - a.total);

        const tasaEmp = tot > 0 ? Math.round(totalEmp / tot * 100) : 0;
        const tasaVis = tot > 0 ? Math.round(totalPub / tot * 100) : 0;
        const totalProv = porProvFinal.length;
        const concTop3  = porProvFinal.slice(0, 3).reduce((s, p) => s + p.total, 0);
        const idxConc   = tot > 0 ? Math.round(concTop3 / tot * 100) : 0;

        const catTec = {
            frontend: ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Svelte'],
            backend:  ['Node.js', 'Python', 'Java', 'PHP', 'Django', 'FastAPI', 'Spring', 'Laravel', 'Express', 'NestJS'],
            data:     ['Python', 'Pandas', 'NumPy', 'TensorFlow', 'Scikit-learn', 'Keras', 'PyTorch', 'Power BI', 'Tableau', 'SQL'],
            cloud:    ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'CI/CD', 'Jenkins', 'GitHub Actions'],
            mobile:   ['Flutter', 'React Native', 'Kotlin', 'Swift', 'Android Studio', 'Ionic', 'Expo'],
            database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'SQLite', 'Oracle', 'Cassandra', 'DynamoDB'],
        };
        const tecsCat = {};
        Object.entries(catTec).forEach(([cat, lista2]) => {
            const t2 = lista2.reduce((s, t) => s + (cTe[t] || 0), 0); if (t2 > 0) tecsCat[cat] = t2;
        });

        const promProy = tot > 0 ? parseFloat((lista.reduce((s, g) => s + (g.cantidadProyectos || 0), 0) / tot).toFixed(1)) : 0;
        const promCert = tot > 0 ? parseFloat((lista.reduce((s, g) => s + (g.cantidadCertificados || 0), 0) / tot).toFixed(1)) : 0;

        const insightsFiltrados = calcularInsightsFrontend({
            tasaEmp, tasaVis, promProy, promCert,
            totalEmp, tot, totalDis, totalProv, idxConc,
            porAnio, anioMax, cTe,
        });
        const planFiltrado = calcularPlanFrontend({ tasaEmp, tasaVis, promProy, promCert, totalProv, cTe });

        return {
            ...datos,
            totalGraduados:    tot,
            totalDisponibles:  totalDis,
            totalPublicos:     totalPub,
            tasaEmpleabilidad: tasaEmp,
            tasaVisibilidad:   tasaVis,
            porGenero:         Object.entries(cGe).map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor),
            porAnio, anioMax,
            porProvincia:      porProvFinal,
            porCanton:         porCantonFinal,
            topTecnologias:    Object.entries(cTe).map(([tecnologia, total]) => ({ tecnologia, total })).sort((a, b) => b.total - a.total).slice(0, 20),
            topAfinidades:     Object.entries(cAf).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total),
            topHabilidadesBlandas: Object.entries(cHa).map(([habilidad, total]) => ({ habilidad, total })).sort((a, b) => b.total - a.total).slice(0, 15),
            tecsPorCategoria:  tecsCat,
            insights:          insightsFiltrados,
            planAccion:        planFiltrado,
            distribucionProyectos: (() => {
                const r = { '0': 0, '1-2': 0, '3-4': 0, '5': 0 };
                lista.forEach(g => { const n = g.cantidadProyectos || 0; if (n === 0) r['0']++; else if (n <= 2) r['1-2']++; else if (n <= 4) r['3-4']++; else r['5']++; });
                return [
                    { rango: '0',   label: 'Sin proyectos', cantidad: r['0'],   color: '#ef4444' },
                    { rango: '1-2', label: '1 a 2',         cantidad: r['1-2'], color: '#f97316' },
                    { rango: '3-4', label: '3 a 4',         cantidad: r['3-4'], color: '#3b82f6' },
                    { rango: '5',   label: '5 (máximo)',     cantidad: r['5'],   color: '#22c55e' },
                ];
            })(),
            distribucionCertificados: (() => {
                const r = { '0': 0, '1-2': 0, '3-4': 0, '5': 0 };
                lista.forEach(g => { const n = g.cantidadCertificados || 0; if (n === 0) r['0']++; else if (n <= 2) r['1-2']++; else if (n <= 4) r['3-4']++; else r['5']++; });
                return [
                    { rango: '0',   label: 'Sin certificados', cantidad: r['0'],   color: '#ef4444' },
                    { rango: '1-2', label: '1 a 2',            cantidad: r['1-2'], color: '#f97316' },
                    { rango: '3-4', label: '3 a 4',            cantidad: r['3-4'], color: '#3b82f6' },
                    { rango: '5',   label: '5 (máximo)',        cantidad: r['5'],   color: '#22c55e' },
                ];
            })(),
            totalProyectos:       lista.reduce((s, g) => s + (g.cantidadProyectos || 0), 0),
            totalCertificados:    lista.reduce((s, g) => s + (g.cantidadCertificados || 0), 0),
            promedioProyectos:    promProy,
            promedioCertificados: promCert,
            graduadosFiltrados:   lista,
        };
    }, [datos, filtros, calcularInsightsFrontend, calcularPlanFrontend]);

    // ── Estados de carga / error ──────────────────────────────
    if (cargando) return (
        <div style={S.centro}>
            <div style={S.spin} />
            <p style={{ margin: '14px 0 0', fontSize: '0.80rem', color: '#9ca3af', fontFamily: FONT }}>
                Calculando estadísticas...
            </p>
        </div>
    );

    if (error) return (
        <div style={S.centro}>
            <FaExclamationTriangle style={{ fontSize: '2rem', color: '#E65100', marginBottom: 10 }} />
            <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: '#374151', fontFamily: FONT }}>{error}</p>
            <button style={S.btnAct} onClick={cargar}>
                <FaSyncAlt style={{ marginRight: 6 }} />Reintentar
            </button>
        </div>
    );

    if (!df) return null;

    // ── Render principal ──────────────────────────────────────
    return (
        <div style={{ fontFamily: FONT, paddingBottom: 56 }}>

            {/* ── Fila 1: Tabs principales ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {TABS.map((t, i) => {
                    const Ico = t.icon;
                    const act = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)} className="gest-anim" style={{
                            display: 'inline-flex', alignItems: 'center', padding: '8px 16px',
                            borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontFamily: FONT,
                            border: `1px solid ${act ? ROJO : '#e5e7eb'}`,
                            background: act ? ROJO : 'white',
                            color: act ? 'white' : '#6b7280',
                            fontWeight: act ? 700 : 500,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            animationDelay: `${i * 50}ms`,
                        }}>
                            <Ico style={{ marginRight: 6, fontSize: '0.76rem' }} />{t.label}
                        </button>
                    );
                })}
                <div style={{ marginLeft: 'auto' }}>
                    <button style={S.btnAct} onClick={cargar}>
                        <FaSyncAlt style={{ marginRight: 5, fontSize: '0.66rem' }} />Actualizar
                    </button>
                </div>
            </div>

            {/* ── Fila 2: Sub-tabs solo cuando tab === 'encuestas' ── */}
            {tab === 'encuestas' && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {SUB_TABS_GRADUADOS.map((st, i) => {
                        const act = subTabGraduados === st.id;
                        return (
                            <button
                                key={st.id}
                                onClick={() => setSubTabGraduados(st.id)}
                                className="gest-anim"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '7px 14px',
                                    borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontFamily: FONT,
                                    border: `1px solid ${act ? ROJO : '#e5e7eb'}`,
                                    background: act ? ROJO : 'white',
                                    color: act ? 'white' : '#6b7280',
                                    fontWeight: act ? 700 : 500,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                    animationDelay: `${i * 50}ms`,
                                }}
                            >
                                {st.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Contenido del tab activo ── */}
            {tab === 'graduados' && (
                <TabIndicadoresGraduados
                    df={df}
                    datos={datos}
                    filtros={filtros}
                    cambiarFiltro={cambiarFiltro}
                    limpiar={limpiar}
                    geoData={geoData}
                    geoError={geoError}
                />
            )}

            {tab === 'encuestas' && subTabGraduados === 'info'       && <TabEGraduado />}
            {tab === 'encuestas' && subTabGraduados === 'resultados'  && (
                <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                    Resultados de Encuesta — próximamente
                </div>
            )}

            {tab === 'empleadores' && <TabEEmpleadores />}

        </div>
    );
};

const S = {
    centro: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, textAlign: 'center' },
    spin:   { width: 30, height: 30, border: '3px solid #f1f5f9', borderTop: `3px solid ${ROJO}`, borderRadius: '50%', animation: 'gest-spin 0.8s linear infinite' },
    btnAct: { display: 'inline-flex', alignItems: 'center', padding: '7px 12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600, color: '#374151', fontFamily: FONT, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
};

export default GestionEstadisticas;