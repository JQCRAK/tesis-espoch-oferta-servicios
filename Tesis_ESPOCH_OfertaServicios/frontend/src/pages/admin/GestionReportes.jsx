// frontend/src/pages/admin/GestionReportes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    FaFilePdf, FaFileExcel, FaUserGraduate, FaGlobe,
    FaCalendarAlt, FaSpinner, FaCheckCircle, FaFilter,
    FaSyncAlt, FaBuilding, FaChartBar, FaTimes,
    FaSortAlphaDown, FaSortAlphaUp, FaSort, FaEye,
    FaFileWord,
} from 'react-icons/fa';
import ModalReporte from './ModalReporte';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
import { leerSesion } from '../../utils/storageSeguro';

const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};

// ── Constantes institucionales ───────────────────────────
const FACULTAD = 'Facultad de Informática y Electrónica';
const CARRERA = 'Carrera de Software';
const ESPOCH = 'ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO';
const DEPTO = 'SEGUIMIENTO A GRADUADOS E INSERCIÓN LABORAL';

const fmtPeriodo = (ini, fin) => {
    if (!ini) return 'Todos los períodos';
    if (!fin || ini === fin) return `${ini}`;
    return `${ini} – ${fin}`;
};

// ════════════════════════════════════════════════════════════
// PDF — Graduados
// ════════════════════════════════════════════════════════════
const generarPDFGraduados = (datos, anioInicio, anioFin) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const periodoTxt = fmtPeriodo(anioInicio, anioFin);

    const dibujarPagina = () => {
        const hX = 10, hY = 10, hW = W - 20;

        // ── Logos ──
        try { doc.addImage('/img/logo_espoch.png', 'PNG', hX + 1, hY + 2, 20, 24); } catch { }
        try { doc.addImage('/img/logo_vinculacion.png', 'PNG', hX + hW - 30, hY + 1, 28, 25); } catch {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(0, 0, 0);
            doc.text('Decanato', hX + hW - 12, hY + 6, { align: 'center' });
            doc.text('de Vinculación', hX + hW - 12, hY + 10, { align: 'center' });
            doc.text('Espoch', hX + hW - 12, hY + 14, { align: 'center' });
            doc.setLineWidth(0.5); doc.setDrawColor(0, 0, 0);
            doc.line(hX + hW - 20, hY + 16, hX + hW - 4, hY + 16);
        }

        // ── Textos centrales ──
        const cx = hX + 24 + (hW - 46) / 2;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO', cx, hY + 9, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text('DECANATO DE VINCULACIÓN', cx, hY + 15, { align: 'center' });
        doc.text('SEGUIMIENTO A GRADUADOS E INSERCIÓN LABORAL', cx, hY + 21, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
        doc.text('DATOS GRADUADOS', cx, hY + 29, { align: 'center' });

        // ── Filas FACULTAD / CARRERA / PERÍODO — sin bordes ──
        const infoY = hY + 34;
        const rowH = 8;
        const filas = [
            { label: 'FACULTAD:', valor: 'FACULTAD DE INFORMÁTICA Y ELECTRÓNICA' },
            { label: 'CARRERA/PROGRAMA:', valor: 'SOFTWARE' },
            { label: 'PERÍODO ACADÉMICO:', valor: periodoTxt.toUpperCase() },
        ];
        doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
        filas.forEach((fila, i) => {
            const y = infoY + i * rowH + 5.5;
            doc.setFont('helvetica', 'bold');
            const anchoLabel = doc.getTextWidth(fila.label + ' ');
            doc.text(fila.label, hX + 3, y);
            doc.setFont('helvetica', 'normal');
            doc.text(fila.valor, hX + 3 + anchoLabel, y);
        });
    };

    dibujarPagina();

    const tableStartY = 10 + 34 + 8 * 3 + 2;

    autoTable(doc, {
        startY: tableStartY,
        columns: [
            { header: 'N°', dataKey: 'nro' },
            { header: 'APELLIDOS', dataKey: 'apellidos' },
            { header: 'NOMBRES', dataKey: 'nombres' },
            { header: 'CÉDULA', dataKey: 'cedula' },
            { header: 'EMAIL', dataKey: 'email' },
            { header: 'CELULAR', dataKey: 'celular' },
        ],
        body: datos.graduados,
        theme: 'grid',
        styles: {
            fontSize: 7.5, cellPadding: 2, font: 'helvetica',
            textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3,
            fillColor: [255, 255, 255],
        },
        headStyles: {
            fillColor: [255, 255, 255], textColor: [0, 0, 0],
            fontStyle: 'bold', fontSize: 7.5, halign: 'center',
            lineColor: [0, 0, 0], lineWidth: 0.3,
        },
        columnStyles: {
            nro: { halign: 'center', cellWidth: 10 },
            apellidos: { cellWidth: 38 },
            nombres: { cellWidth: 38 },
            cedula: { halign: 'center', cellWidth: 24 },
            email: { cellWidth: 55 },
            celular: { halign: 'center', cellWidth: 22 },
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        margin: { left: 10, right: 10 },
        didDrawPage: ({ pageNumber }) => {
            doc.setFontSize(6.5); doc.setTextColor(100, 100, 100);
            doc.text(
                `Generado: ${new Date().toLocaleDateString('es-EC')} — Pág. ${pageNumber}`,
                W / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }
            );
        },
    });

    doc.save(`Anexo25_Graduados_${periodoTxt.replace(/\s/g, '_')}.pdf`);
};
// ════════════════════════════════════════════════════════════
// PDF — Empleadores
// ════════════════════════════════════════════════════════════
const generarPDFEmpleadores = (datos, anioInicio, anioFin) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }); // ← portrait
    const W = doc.internal.pageSize.getWidth();
    const periodoTxt = fmtPeriodo(anioInicio, anioFin);

    const dibujarPagina = () => {
        const hX = 10, hY = 10, hW = W - 20;

        // ── Logo ESPOCH izquierda ──
        try { doc.addImage('/img/logo_espoch.png', 'PNG', hX + 1, hY + 2, 20, 24); } catch { }

        // ── Logo Vinculación derecha — más grande y sin distorsión ──
        try { doc.addImage('/img/logo_vinculacion.png', 'PNG', hX + hW - 30, hY + 1, 28, 25); } catch {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(0, 0, 0);
            doc.text('Decanato', hX + hW - 12, hY + 6, { align: 'center' });
            doc.text('de Vinculación', hX + hW - 12, hY + 10, { align: 'center' });
            doc.text('Espoch', hX + hW - 12, hY + 14, { align: 'center' });
            doc.setLineWidth(0.5); doc.setDrawColor(0, 0, 0);
            doc.line(hX + hW - 20, hY + 16, hX + hW - 4, hY + 16);
        }

        // ── Textos centrales ──
        const cx = hX + 24 + (hW - 52) / 2;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO', cx, hY + 9, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text('DECANATO DE VINCULACIÓN', cx, hY + 15, { align: 'center' });
        doc.text('SEGUIMIENTO A GRADUADOS E INSERCIÓN LABORAL', cx, hY + 21, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
        doc.text('DATOS EMPLEADORES', cx, hY + 29, { align: 'center' });

        // ── Filas FACULTAD / CARRERA / PERÍODO — sin bordes ──
        const infoY = hY + 34;
        const rowH = 8;
        const filas = [
            { label: 'FACULTAD:', valor: 'FACULTAD DE INFORMÁTICA Y ELECTRÓNICA' },
            { label: 'CARRERA/PROGRAMA:', valor: 'SOFTWARE' },
            { label: 'PERÍODO ACADÉMICO:', valor: periodoTxt.toUpperCase() },
        ];
        doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
        filas.forEach((fila, i) => {
            const y = infoY + i * rowH + 5.5;
            doc.setFont('helvetica', 'bold');
            const anchoLabel = doc.getTextWidth(fila.label + ' ');
            doc.text(fila.label, hX + 3, y);
            doc.setFont('helvetica', 'normal');
            doc.text(fila.valor, hX + 3 + anchoLabel, y);
        });
    };

    dibujarPagina();

    const tableStartY = 10 + 34 + 8 * 3 + 2;

    autoTable(doc, {
        startY: tableStartY,
        columns: [
            { header: 'N°', dataKey: 'nro' },
            { header: 'NOMBRE\nORGANIZACIÓN', dataKey: 'nombreOrganizacion' },
            { header: 'NOMBRE DEL GERENTE\nY/O PROPIETARIO', dataKey: 'nombreGerente' },
            { header: 'PROVINCIA', dataKey: 'provincia' },
            { header: 'CIUDAD', dataKey: 'ciudad' },
            { header: 'EMAIL', dataKey: 'email' },
            { header: 'CONTACTO', dataKey: 'contacto' },
        ],
        body: datos.empleadores,
        theme: 'grid',
        styles: {
            fontSize: 7, cellPadding: 2, font: 'helvetica',
            textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3,
            fillColor: [255, 255, 255],
        },
        headStyles: {
            fillColor: [255, 255, 255], textColor: [0, 0, 0],
            fontStyle: 'bold', fontSize: 7, halign: 'center',
            lineColor: [0, 0, 0], lineWidth: 0.3,
        },
        columnStyles: {
            nro: { halign: 'center', cellWidth: 10 },
            nombreOrganizacion: { cellWidth: 36 },
            nombreGerente: { cellWidth: 36 },
            provincia: { cellWidth: 20 },
            ciudad: { cellWidth: 18 },
            email: { cellWidth: 45 },
            contacto: { halign: 'center', cellWidth: 22 },
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        margin: { left: 10, right: 10 },
        didDrawPage: ({ pageNumber }) => {
            doc.setFontSize(6.5); doc.setTextColor(100, 100, 100);
            doc.text(
                `Generado: ${new Date().toLocaleDateString('es-EC')} — Pág. ${pageNumber}`,
                W / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }
            );
        },
    });

    doc.save(`Anexo25_Empleadores_${periodoTxt.replace(/\s/g, '_')}.pdf`);
};
// ════════════════════════════════════════════════════════════
// EXCEL — Graduados
// ════════════════════════════════════════════════════════════
const generarExcelGraduados = (datos, anioInicio, anioFin) => {
    const periodoTxt = fmtPeriodo(anioInicio, anioFin);
    const wb = XLSX.utils.book_new();
    const meta = [
        [ESPOCH], [`DECANATO DE VINCULACIÓN`], [DEPTO], [`DATOS GRADUADOS`], [],
        [`FACULTAD: ${FACULTAD}`], [`CARRERA/PROGRAMA: ${CARRERA}`],
        [`PERÍODO ACADÉMICO: ${periodoTxt}`], [],
        ['N°', 'APELLIDOS', 'NOMBRES', 'CÉDULA', 'EMAIL', 'CELULAR'],
    ];
    const filas = datos.graduados.map(g => [g.nro, g.apellidos, g.nombres, g.cedula, g.email, g.celular]);
    const ws = XLSX.utils.aoa_to_sheet([...meta, ...filas]);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 35 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Graduados');
    XLSX.writeFile(wb, `Anexo25_Graduados_${periodoTxt.replace(/\s/g, '_')}.xlsx`);
};

// ════════════════════════════════════════════════════════════
// EXCEL — Empleadores
// ════════════════════════════════════════════════════════════
const generarExcelEmpleadores = (datos, anioInicio, anioFin) => {
    const periodoTxt = fmtPeriodo(anioInicio, anioFin);
    const wb = XLSX.utils.book_new();
    const meta = [
        [ESPOCH], [`DECANATO DE VINCULACIÓN`], [DEPTO], [`DATOS EMPLEADORES`], [],
        [`FACULTAD: ${FACULTAD}`], [`CARRERA/PROGRAMA: ${CARRERA}`],
        [`PERÍODO ACADÉMICO: ${periodoTxt}`], [],
        ['N°', 'NOMBRE ORGANIZACIÓN', 'GERENTE/PROPIETARIO', 'PROVINCIA', 'CIUDAD', 'EMAIL', 'CONTACTO'],
    ];
    const filas = datos.empleadores.map(e => [e.nro, e.nombreOrganizacion, e.nombreGerente, e.provincia, e.ciudad, e.email, e.contacto]);
    const ws = XLSX.utils.aoa_to_sheet([...meta, ...filas]);
    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 35 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Empleadores');
    XLSX.writeFile(wb, `Anexo25_Empleadores_${periodoTxt.replace(/\s/g, '_')}.xlsx`);
};

// ════════════════════════════════════════════════════════════
// MODAL GRADUADOS — Anexo 25
// ════════════════════════════════════════════════════════════
const ModalGraduados = ({ onClose, aniosGlobal }) => {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [generando, setGenerando] = useState('');
    const [anioInicio, setAnioInicio] = useState('');
    const [anioFin, setAnioFin] = useState('');
    const [orden, setOrden] = useState('apellidos_asc');

    const cargar = useCallback(async (ini, fin, ord) => {
        setCargando(true);
        try {
            const p = new URLSearchParams();
            if (ini) { p.append('anioInicio', ini); p.append('anioFin', fin || ini); }
            p.append('orden', ord);
            const { data } = await axios.get(`${API}/admin/reportes/anexo25-graduados?${p}`, { headers: hdrs() });
            setDatos(data);
        } catch { setDatos(null); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar('', '', 'apellidos_asc'); }, [cargar]);

    const aplicar = () => cargar(anioInicio, anioFin, orden);
    const handleOrden = (nuevoOrden) => { setOrden(nuevoOrden); cargar(anioInicio, anioFin, nuevoOrden); };
    const anios = datos?.aniosDisponibles || aniosGlobal || [];

    const IconOrden = ({ campo }) => {
        if (orden === `${campo}_asc`) return <FaSortAlphaDown style={{ fontSize: '0.65rem', color: 'var(--color-espoch-rojo)' }} />;
        if (orden === `${campo}_desc`) return <FaSortAlphaUp style={{ fontSize: '0.65rem', color: 'var(--color-espoch-rojo)' }} />;
        return <FaSort style={{ fontSize: '0.6rem', color: '#ced4da' }} />;
    };

    const toggleOrden = (campo) => {
        handleOrden(orden === `${campo}_asc` ? `${campo}_desc` : `${campo}_asc`);
    };

    return (
        <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={ms.modal}>
                <div style={{ ...ms.head, borderColor: 'var(--color-espoch-rojo)' }}>
                    <div>
                        <h2 style={ms.tit}>Anexo 25 — Base de Datos Graduados</h2>
                        <p style={ms.sub}>FIE · Carrera de Software · Solo graduados con tesis verificada · {datos ? `${datos.total} registros` : '...'}</p>
                    </div>
                    <button style={ms.close} onClick={onClose}><FaTimes /></button>
                </div>

                <div style={ms.filtrosWrap}>
                    <div style={ms.filtrosRow}>
                        <FaCalendarAlt style={{ fontSize: '0.7rem', color: '#adb5bd' }} />
                        <span style={ms.flbl}>Año graduación:</span>
                        <select value={anioInicio} onChange={e => { setAnioInicio(e.target.value); if (!e.target.value) setAnioFin(''); }} style={ms.sel}>
                            <option value="">Todos</option>
                            {anios.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        {anioInicio && (<>
                            <span style={ms.flbl}>hasta</span>
                            <select value={anioFin} onChange={e => setAnioFin(e.target.value)} style={ms.sel}>
                                {anios.filter(a => a >= parseInt(anioInicio)).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </>)}
                        <button style={ms.btnFiltrar} onClick={aplicar} disabled={cargando}>
                            <FaFilter style={{ fontSize: '0.62rem' }} /> Filtrar
                        </button>
                        {anioInicio && (
                            <button style={ms.btnLimpiar} onClick={() => { setAnioInicio(''); setAnioFin(''); cargar('', '', orden); }}>
                                <FaSyncAlt style={{ fontSize: '0.58rem' }} /> Limpiar
                            </button>
                        )}
                    </div>
                    <p style={ms.periodoTxt}>Período: <strong>{fmtPeriodo(anioInicio || null, anioFin || null)}</strong></p>
                </div>

                <div style={ms.body}>
                    {cargando ? (
                        <div style={ms.loadBox}>
                            <FaSpinner style={{ fontSize: '1.2rem', color: '#adb5bd', animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.78rem', color: '#adb5bd' }}>Cargando datos...</span>
                        </div>
                    ) : datos && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={ms.tabla}>
                                <thead>
                                    <tr style={ms.trHead}>
                                        <th style={ms.th}>N°</th>
                                        <th style={{ ...ms.th, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleOrden('apellidos')}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>APELLIDOS <IconOrden campo="apellidos" /></span>
                                        </th>
                                        <th style={{ ...ms.th, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleOrden('nombres')}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>NOMBRES <IconOrden campo="nombres" /></span>
                                        </th>
                                        <th style={ms.th}>CÉDULA</th>
                                        <th style={ms.th}>EMAIL</th>
                                        <th style={ms.th}>CELULAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.graduados.length === 0 ? (
                                        <tr><td colSpan={6} style={ms.tdVacio}>Sin registros para este período.</td></tr>
                                    ) : (<>
                                        {datos.graduados.slice(0, 5).map((g, i) => (
                                            <tr key={i} style={ms.trBody}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={{ ...ms.td, textAlign: 'center', color: '#adb5bd', fontSize: '0.7rem' }}>{g.nro}</td>
                                                <td style={ms.td}><span style={ms.celTxt}>{g.apellidos}</span></td>
                                                <td style={ms.td}><span style={ms.celTxt}>{g.nombres}</span></td>
                                                <td style={{ ...ms.td, textAlign: 'center' }}><span style={ms.celMono}>{g.cedula}</span></td>
                                                <td style={ms.td}><span style={{ ...ms.celTxt, color: '#6c757d' }}>{g.email}</span></td>
                                                <td style={{ ...ms.td, textAlign: 'center' }}><span style={ms.celMono}>{g.celular}</span></td>
                                            </tr>
                                        ))}
                                        {datos.total > 5 && (
                                            <tr><td colSpan={6} style={{ ...ms.tdVacio, padding: '8px 12px', fontStyle: 'normal', color: '#6c757d', background: '#f8f9fa' }}>
                                                <FaEye style={{ marginRight: 5, fontSize: '0.7rem' }} />
                                                Mostrando 5 de {datos.total} registros — el reporte completo incluye todos
                                            </td></tr>
                                        )}
                                    </>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={ms.foot}>
                    <span style={{ fontSize: '0.71rem', color: '#adb5bd', flex: 1 }}>
                        {datos && `${datos.total} registros · Período: ${fmtPeriodo(anioInicio || null, anioFin || null)}`}
                    </span>
                    <button style={{ ...ms.btnDesc, background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', opacity: (!datos || cargando || generando) ? 0.5 : 1 }}
                        disabled={!datos || cargando || !!generando}
                        onClick={() => { setGenerando('pdf'); try { generarPDFGraduados(datos, anioInicio || null, anioFin || null); } catch (e) { alert('Error PDF'); } finally { setGenerando(''); } }}>
                        {generando === 'pdf' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaFilePdf />} PDF
                    </button>
                    <button style={{ ...ms.btnDesc, background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32', opacity: (!datos || cargando || generando) ? 0.5 : 1 }}
                        disabled={!datos || cargando || !!generando}
                        onClick={() => { setGenerando('excel'); try { generarExcelGraduados(datos, anioInicio || null, anioFin || null); } catch (e) { alert('Error Excel'); } finally { setGenerando(''); } }}>
                        {generando === 'excel' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaFileExcel />} Excel
                    </button>
                    <button style={ms.btnCerrar} onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
// MODAL EMPLEADORES — Anexo 25
// ════════════════════════════════════════════════════════════
const ModalEmpleadores = ({ onClose }) => {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [generando, setGenerando] = useState('');
    const [anioInicio, setAnioInicio] = useState('');
    const [anioFin, setAnioFin] = useState('');
    const [orden, setOrden] = useState('empresa_asc');

    const cargar = useCallback(async (ini, fin, ord) => {
        setCargando(true);
        try {
            const p = new URLSearchParams();
            if (ini) { p.append('anioInicio', ini); p.append('anioFin', fin || ini); }
            p.append('orden', ord);
            const { data } = await axios.get(`${API}/admin/reportes/anexo25-empleadores?${p}`, { headers: hdrs() });
            setDatos(data);
        } catch { setDatos(null); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar('', '', 'empresa_asc'); }, [cargar]);

    const aplicar = () => cargar(anioInicio, anioFin, orden);
    const anios = datos?.aniosDisponibles || [];

    const IconOrden = ({ campo }) => {
        if (orden === `${campo}_asc`) return <FaSortAlphaDown style={{ fontSize: '0.65rem', color: 'var(--color-espoch-rojo)' }} />;
        if (orden === `${campo}_desc`) return <FaSortAlphaUp style={{ fontSize: '0.65rem', color: 'var(--color-espoch-rojo)' }} />;
        return <FaSort style={{ fontSize: '0.6rem', color: '#ced4da' }} />;
    };

    const toggleOrden = (campo) => {
        const nuevo = orden === `${campo}_asc` ? `${campo}_desc` : `${campo}_asc`;
        setOrden(nuevo); cargar(anioInicio, anioFin, nuevo);
    };

    return (
        <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ ...ms.modal, maxWidth: 820 }}>
                <div style={{ ...ms.head, borderColor: '#1976d2' }}>
                    <div>
                        <h2 style={ms.tit}>Anexo 25 — Base de Datos Empleadores</h2>
                        <p style={ms.sub}>FIE · Carrera de Software · {datos ? `${datos.total} registros` : '...'}</p>
                    </div>
                    <button style={ms.close} onClick={onClose}><FaTimes /></button>
                </div>

                <div style={ms.filtrosWrap}>
                    <div style={ms.filtrosRow}>
                        <FaCalendarAlt style={{ fontSize: '0.7rem', color: '#adb5bd' }} />
                        <span style={ms.flbl}>Año registro:</span>
                        <select value={anioInicio} onChange={e => { setAnioInicio(e.target.value); if (!e.target.value) setAnioFin(''); }} style={ms.sel}>
                            <option value="">Todos</option>
                            {anios.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        {anioInicio && (<>
                            <span style={ms.flbl}>hasta</span>
                            <select value={anioFin} onChange={e => setAnioFin(e.target.value)} style={ms.sel}>
                                {anios.filter(a => a >= parseInt(anioInicio)).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </>)}
                        <button style={ms.btnFiltrar} onClick={aplicar} disabled={cargando}>
                            <FaFilter style={{ fontSize: '0.62rem' }} /> Filtrar
                        </button>
                        {anioInicio && (
                            <button style={ms.btnLimpiar} onClick={() => { setAnioInicio(''); setAnioFin(''); cargar('', '', orden); }}>
                                <FaSyncAlt style={{ fontSize: '0.58rem' }} /> Limpiar
                            </button>
                        )}
                    </div>
                    <p style={ms.periodoTxt}>Período: <strong>{fmtPeriodo(anioInicio || null, anioFin || null)}</strong></p>
                </div>

                <div style={ms.body}>
                    {cargando ? (
                        <div style={ms.loadBox}>
                            <FaSpinner style={{ fontSize: '1.2rem', color: '#adb5bd', animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.78rem', color: '#adb5bd' }}>Cargando datos...</span>
                        </div>
                    ) : datos && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={ms.tabla}>
                                <thead>
                                    <tr style={ms.trHead}>
                                        <th style={ms.th}>N°</th>
                                        <th style={{ ...ms.th, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleOrden('empresa')}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>ORGANIZACIÓN <IconOrden campo="empresa" /></span>
                                        </th>
                                        <th style={{ ...ms.th, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleOrden('gerente')}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>GERENTE/PROPIETARIO <IconOrden campo="gerente" /></span>
                                        </th>
                                        <th style={ms.th}>PROVINCIA</th>
                                        <th style={ms.th}>CIUDAD</th>
                                        <th style={ms.th}>EMAIL</th>
                                        <th style={ms.th}>CONTACTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.empleadores.length === 0 ? (
                                        <tr><td colSpan={7} style={ms.tdVacio}>Sin registros para este período.</td></tr>
                                    ) : (<>
                                        {datos.empleadores.slice(0, 5).map((e, i) => (
                                            <tr key={i} style={ms.trBody}
                                                onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#fafafa'}
                                                onMouseLeave={ev => ev.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={{ ...ms.td, textAlign: 'center', color: '#adb5bd', fontSize: '0.7rem' }}>{e.nro}</td>
                                                <td style={ms.td}><span style={ms.celTxt}>{e.nombreOrganizacion}</span></td>
                                                <td style={ms.td}><span style={ms.celTxt}>{e.nombreGerente}</span></td>
                                                <td style={ms.td}><span style={{ ...ms.celTxt, color: '#6c757d' }}>{e.provincia}</span></td>
                                                <td style={ms.td}><span style={{ ...ms.celTxt, color: '#6c757d' }}>{e.ciudad}</span></td>
                                                <td style={ms.td}><span style={{ ...ms.celTxt, color: '#6c757d', fontSize: '0.7rem' }}>{e.email}</span></td>
                                                <td style={{ ...ms.td, textAlign: 'center' }}><span style={ms.celMono}>{e.contacto}</span></td>
                                            </tr>
                                        ))}
                                        {datos.total > 5 && (
                                            <tr><td colSpan={7} style={{ ...ms.tdVacio, padding: '8px 12px', fontStyle: 'normal', color: '#6c757d', background: '#f8f9fa' }}>
                                                <FaEye style={{ marginRight: 5, fontSize: '0.7rem' }} />
                                                Mostrando 5 de {datos.total} registros — el reporte completo incluye todos
                                            </td></tr>
                                        )}
                                    </>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={ms.foot}>
                    <span style={{ fontSize: '0.71rem', color: '#adb5bd', flex: 1 }}>
                        {datos && `${datos.total} registros · Período: ${fmtPeriodo(anioInicio || null, anioFin || null)}`}
                    </span>
                    <button style={{ ...ms.btnDesc, background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', opacity: (!datos || cargando || generando) ? 0.5 : 1 }}
                        disabled={!datos || cargando || !!generando}
                        onClick={() => { setGenerando('pdf'); try { generarPDFEmpleadores(datos, anioInicio || null, anioFin || null); } catch (e) { alert('Error PDF'); } finally { setGenerando(''); } }}>
                        {generando === 'pdf' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaFilePdf />} PDF
                    </button>
                    <button style={{ ...ms.btnDesc, background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32', opacity: (!datos || cargando || generando) ? 0.5 : 1 }}
                        disabled={!datos || cargando || !!generando}
                        onClick={() => { setGenerando('excel'); try { generarExcelEmpleadores(datos, anioInicio || null, anioFin || null); } catch (e) { alert('Error Excel'); } finally { setGenerando(''); } }}>
                        {generando === 'excel' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaFileExcel />} Excel
                    </button>
                    <button style={ms.btnCerrar} onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
const GestionReportes = () => {
    const [metricas, setMetricas] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [modalGrad, setModalGrad] = useState(false);
    const [modalEmp, setModalEmp] = useState(false);
    const [modalReporte, setModalReporte] = useState(false);

    useEffect(() => {
        const cargarMetricas = async () => {
            try {
                const { data } = await axios.get(`${API}/admin/reportes/metricas`, { headers: hdrs() });
                setMetricas(data);
            } catch { setMetricas(null); }
            finally { setCargando(false); }
        };
        cargarMetricas();
    }, []);

    const m = metricas || {};

    /* ── Definición de reportes ── */
    const reportes = [
        {
            id: 'grad',
            anexo: 'Anexo 25',
            estado: 'disponible',
            titulo: 'Base de Datos Graduados',
            desc: 'Lista de graduados con apellidos, nombres, cédula, email y celular. Filtro por año de graduación · Orden alfabético configurable.',
            color: '#e53935',
            bg: '#ffebee',
            border: '#ffcdd2',
            ico: FaUserGraduate,
            onClick: () => setModalGrad(true),
        },
        {
            id: 'emp',
            anexo: 'Anexo 25',
            estado: 'disponible',
            titulo: 'Base de Datos Empleadores',
            desc: 'Lista de empleadores con organización, gerente, provincia, ciudad, email y contacto. Filtro por año de registro · Orden alfabético configurable.',
            color: '#1976d2',
            bg: '#e3f2fd',
            border: '#bbdefb',
            ico: FaBuilding,
            onClick: () => setModalEmp(true),
        },
        {
            id: 'anexo19',
            anexo: 'Anexo 19',
            estado: 'disponible',
            titulo: 'Informe Encuentro de Graduados',
            desc: 'Genera el informe Word completo con carátula, información general, análisis estadístico con gráficas de encuestas de graduados y empleadores.',
            color: '#6a1b9a',
            bg: '#f3e8ff',
            border: '#ddd6fe',
            ico: FaFileWord,
            onClick: () => setModalReporte(true),
        },
    ];

    return (
        <div style={s.page}>

            {/* ═══ MÉTRICAS ═══ */}
            <div style={s.gridMet}>
                {[
                    { icon: FaUserGraduate, etiq: 'GRADUADOS REGISTRADOS', val: m.totalGraduados, color: '#e53935', bg: '#ffebee', border: '#ffcdd2', top: '#e53935' },
                    { icon: FaBuilding, etiq: 'EMPLEADORES', val: m.totalEmpleadores, color: '#1976d2', bg: '#e3f2fd', border: '#bbdefb', top: '#1976d2' },
                    { icon: FaGlobe, etiq: 'PERFILES PÚBLICOS', val: m.perfilesPublicos, color: '#2e7d32', bg: '#e8f5e9', border: '#c8e6c9', top: '#2e7d32' },
                    { icon: FaCheckCircle, etiq: 'VERIFICADOS', val: m.verificados, color: '#f57f17', bg: '#fff8e1', border: '#ffe082', top: '#f57f17' },
                ].map((mc, i) => {
                    const Icon = mc.icon;
                    return (
                        <div key={i} style={{ ...s.metCard, borderTop: `3px solid ${mc.top}` }}>
                            <div style={s.metRow}>
                                <div>
                                    <p style={s.metEtiq}>{mc.etiq}</p>
                                    <p style={s.metVal}>
                                        {cargando
                                            ? <span style={{ color: '#ced4da' }}>···</span>
                                            : (mc.val ?? '—')}
                                    </p>
                                </div>
                                <div style={{ ...s.metIco, background: mc.bg, border: `1px solid ${mc.border}` }}>
                                    <Icon style={{ fontSize: '1rem', color: mc.color }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ TÍTULO SECCIÓN ═══ */}
            <div style={s.cardTit2}>
                <h2 style={s.secTit}>Reportes Estadísticos — PIMAC</h2>
                <p style={s.secSub}>Indicador 100 · Anexo 25 · Seguimiento a Graduados e Inserción Laboral</p>
            </div>

            {/* ═══ TARJETAS DE REPORTES ═══ */}
            <div style={s.reportesGrid}>
                {reportes.map((r) => {
                    const Icon = r.ico;
                    const activo = r.estado === 'disponible';
                    return (
                        <div key={r.id} style={{
                            ...s.reporteCard,
                            borderTop: `3px solid ${r.color}`,
                            opacity: activo ? 1 : 0.75,
                        }}>
                            <div style={s.reporteCardHead}>
                                <div style={{ ...s.reporteIco, background: r.bg, border: `1px solid ${r.border}` }}>
                                    <Icon style={{ fontSize: '1.1rem', color: r.color }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                                        <span style={{ ...s.badge, background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>
                                            {r.anexo}
                                        </span>
                                        <span style={{
                                            ...s.badge,
                                            background: activo ? '#e8f5e9' : '#f5f5f5',
                                            color: activo ? '#2e7d32' : '#9e9e9e',
                                            border: activo ? '1px solid #c8e6c9' : '1px solid #e0e0e0',
                                        }}>
                                            {activo ? 'Disponible' : 'Próximamente'}
                                        </span>
                                    </div>
                                    <p style={s.reporteTit}>{r.titulo}</p>
                                    <p style={s.reporteDesc}>{r.desc}</p>
                                </div>
                            </div>
                            <div style={s.reporteCardFoot}>
                                <span style={{ fontSize: '0.69rem', color: activo ? '#adb5bd' : '#ced4da' }}>
                                    {activo ? 'Listo para descargar' : 'En desarrollo'}
                                </span>
                                <button
                                    style={{
                                        ...s.btnAbrir,
                                        background: activo ? r.color : '#bdbdbd',
                                        cursor: activo ? 'pointer' : 'not-allowed',
                                    }}
                                    disabled={!activo}
                                    onClick={r.onClick || undefined}
                                >
                                    <FaEye style={{ fontSize: '0.72rem' }} /> Ver y Descargar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ MODALES ═══ */}
            {modalGrad && <ModalGraduados onClose={() => setModalGrad(false)} aniosGlobal={[]} />}
            {modalEmp && <ModalEmpleadores onClose={() => setModalEmp(false)} />}
            {modalReporte && <ModalReporte onClose={() => setModalReporte(false)} />}

            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   ESTILOS PÁGINA
═══════════════════════════════════════════════════════════ */
const s = {
    page: { maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Segoe UI',Roboto,sans-serif" },
    gridMet: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 },
    metCard: { backgroundColor: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    metRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    metEtiq: { margin: '0 0 5px', fontSize: '0.58rem', fontWeight: '700', color: '#adb5bd', letterSpacing: '0.8px' },
    metVal: { margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#2c3e50', lineHeight: 1 },
    metIco: { width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardTit2: { backgroundColor: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e9ecef' },
    secTit: { margin: '0 0 3px', fontSize: '0.95rem', fontWeight: '700', color: '#2c3e50' },
    secSub: { margin: 0, fontSize: '0.72rem', color: '#adb5bd' },
    badge: { display: 'inline-block', fontSize: '0.62rem', fontWeight: '600', padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
    reportesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 },
    reporteCard: { backgroundColor: 'white', borderRadius: 10, padding: '16px', border: '1px solid #e9ecef', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12 },
    reporteCardHead: { display: 'flex', gap: 12, alignItems: 'flex-start' },
    reporteIco: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    reporteTit: { margin: '0 0 4px', fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' },
    reporteDesc: { margin: 0, fontSize: '0.72rem', color: '#6c757d', lineHeight: 1.5 },
    reporteCardFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f0f0f0' },
    btnAbrir: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', color: 'white', border: 'none', borderRadius: 7, fontSize: '0.75rem', fontWeight: '700' },
};

/* ═══════════════════════════════════════════════════════════
   ESTILOS MODAL
═══════════════════════════════════════════════════════════ */
const ms = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' },
    modal: { backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 13px', borderBottom: '2px solid', flexShrink: 0 },
    tit: { margin: '0 0 2px', fontSize: '0.95rem', fontWeight: '700', color: '#2c3e50' },
    sub: { margin: 0, fontSize: '0.71rem', color: '#adb5bd' },
    close: { background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '1rem', padding: 4 },
    filtrosWrap: { padding: '12px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0, background: '#fafafa' },
    filtrosRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
    flbl: { fontSize: '0.74rem', color: '#6c757d', whiteSpace: 'nowrap' },
    sel: { border: '1px solid #e9ecef', background: 'white', outline: 'none', fontSize: '0.76rem', color: '#2c3e50', cursor: 'pointer', padding: '5px 8px', borderRadius: 6 },
    btnFiltrar: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: 'var(--color-espoch-rojo)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.73rem', fontWeight: '700' },
    btnLimpiar: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 9px', background: 'white', color: '#6c757d', border: '1px solid #e9ecef', borderRadius: 6, cursor: 'pointer', fontSize: '0.71rem' },
    periodoTxt: { margin: 0, fontSize: '0.7rem', color: '#adb5bd' },
    body: { flex: 1, overflowY: 'auto', padding: '14px 20px' },
    loadBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '32px', background: '#f8f9fa', borderRadius: 8 },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    trHead: { borderBottom: '2px solid #f0f0f0', background: '#f8f9fa' },
    th: { padding: '8px 10px', textAlign: 'left', fontSize: '0.6rem', fontWeight: '700', color: '#6c757d', letterSpacing: '0.6px', whiteSpace: 'nowrap' },
    trBody: { borderBottom: '1px solid #f8f9fa', transition: 'background 0.1s' },
    td: { padding: '8px 10px', verticalAlign: 'middle' },
    tdVacio: { padding: '20px 10px', textAlign: 'center', color: '#adb5bd', fontSize: '0.76rem', fontStyle: 'italic' },
    celTxt: { fontSize: '0.76rem', fontWeight: '500', color: '#2c3e50' },
    celMono: { fontSize: '0.71rem', fontFamily: 'monospace', color: '#495057', background: '#f8f9fa', padding: '1px 5px', borderRadius: 3, border: '1px solid #e9ecef' },
    foot: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0 },
    btnDesc: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem', fontWeight: '700', flexShrink: 0 },
    btnCerrar: { padding: '7px 14px', background: 'transparent', border: '1px solid #e9ecef', borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem', fontWeight: '600', color: '#6c757d' },
};

export default GestionReportes;