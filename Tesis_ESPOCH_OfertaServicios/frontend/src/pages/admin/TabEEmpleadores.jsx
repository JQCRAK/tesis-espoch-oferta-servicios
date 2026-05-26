// frontend/src/pages/admin/TabEEmpleadores.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    FaBuilding, FaSyncAlt, FaExclamationTriangle, FaFilter, FaTimes,
    FaUsers, FaClipboardList, FaChartBar, FaCheckCircle, FaTimesCircle,
    FaUserTie, FaMapMarkerAlt, FaLayerGroup, FaQuestion, FaStar,
    FaGlobeAmericas, FaMapMarked, FaLightbulb, FaBullseye,
    FaChevronLeft, FaChevronRight, FaTag, FaCommentDots,
    FaSearch, FaCalendarAlt, FaEnvelope, FaPhone, FaEye,
    FaIndustry, FaCity,
} from 'react-icons/fa';
import { leerSesion } from '../../utils/storageSeguro';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";

// ── Paleta institucional ESPOCH ──
const ROJO='#BE1E2D', AZUL='#1565C0', VERDE='#2E7D32', NARANJA='#E65100';
const MORADO='#4527A0', CIAN='#00695C', GRIS='#37474F', DORADO='#F57F17';
const PALETA=[ROJO,AZUL,VERDE,NARANJA,MORADO,CIAN,GRIS,DORADO,'#AD1457','#00838F','#558B2F','#4E342E'];
const PALETA_LIGHT=['#f7c5c9','#b3c9f0','#b2dfb4','#f9cba8','#c5bce8','#a8d5cc','#b0bec5','#fde68a'];

import { leerSesion as _ls } from '../../utils/storageSeguro';
const hdrs = () => {
    const u = leerSesion('usuario');
    return { Authorization: `Bearer ${u?.token || ''}` };
};

const norm  = s => s?.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim() ?? '';
const pct   = (v,t) => t===0 ? 0 : Math.round((v/t)*100);
const fmt   = d => d ? new Date(d).toLocaleDateString('es-EC',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const EC    = [[-4.80,-80.50],[1.20,-75.80]];
const CANTON_ALIAS = {'banos':'banos de agua santa','lago agrio':'nueva loja','san miguel de riobamba':'riobamba'};
const normCanton = n => { const k=norm(n); return CANTON_ALIAS[k]||k; };

// ── Inyectar estilos globales ──
if (typeof document !== 'undefined' && !document.getElementById('tee-kf')) {
    const st = document.createElement('style');
    st.id = 'tee-kf';
    st.textContent = `
        @keyframes teeSpin{to{transform:rotate(360deg);}}
        @keyframes teeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
        @keyframes teePulse{0%,100%{opacity:1;}50%{opacity:.6;}}
        .teeA{animation:teeIn .25s ease both;}
        .teeHov:hover{background:#f8fafc !important;cursor:pointer;}
        .teePag:hover:not(:disabled){background:${ROJO} !important;color:white !important;border-color:${ROJO} !important;}
        .teeTab{transition:all .15s;}
        .teeTab:hover{background:#f1f5f9 !important;}
        .teeRow:hover{background:#fafafa !important;}
        .teeCard:hover{box-shadow:0 4px 16px rgba(0,0,0,.1) !important;transform:translateY(-1px);}
        .teeCard{transition:box-shadow .2s,transform .2s;}
        .leaflet-container{font-family:${FONT} !important;}
        .leaflet-tooltip{font-family:${FONT} !important;border-radius:6px !important;border:1px solid #e2e8f0 !important;
            box-shadow:0 4px 12px rgba(0,0,0,.15) !important;padding:8px 12px !important;font-size:.78rem !important;
            color:#0f172a !important;background:white !important;}
        .leaflet-tooltip::before{display:none !important;}
        .leaflet-control-zoom{border:1px solid #e2e8f0 !important;border-radius:8px !important;overflow:hidden !important;}
        .leaflet-control-zoom a{color:#374151 !important;width:32px !important;height:32px !important;line-height:32px !important;background:white !important;}
        .leaflet-control-zoom a:hover{background:#f8fafc !important;color:${ROJO} !important;}
        .leaflet-control-attribution{font-size:.58rem !important;}
    `;
    document.head.appendChild(st);
}

// ══════════════════════════════════════════════════════════
// NLP FRONTEND
// ══════════════════════════════════════════════════════════
const STOPWORDS_ES = new Set(['el','la','los','las','un','una','de','del','en','que','y','a','al','se','es','por','con','para','su','sus','lo','le','les','me','mi','mas','si','pero','no','ya','o','como','hay','muy','ser','son','fue','han','era','esto','esta','este','estos','estas','todo','todos','toda','todas','cada','otro','otros','misma','mismos','puede','pueden','debe','deben','hacer','hace','tener','tiene','haber','entre','sobre','bajo','ante','tras','durante','mediante','segun','sin','nos','nuestro','nuestra','nos','vuestro','mayor','menor','bien','mal','tanto','poco','mucho','algo','nada','alguien','nadie','alguno','ninguno','nueva','nuevo','nuevos','nuevas']);

function analizarTexto(textos) {
    if (!textos?.length) return { palabras:[], temas:[], frases:[] };
    const freq={}, bigrams={}, oracionesLimpias=[];
    textos.forEach(t => {
        if (!t || typeof t !== 'string') return;
        const limpio = t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
        if (!limpio) return;
        oracionesLimpias.push(limpio);
        const words = limpio.split(' ').filter(w => w.length>3 && !STOPWORDS_ES.has(w));
        words.forEach(w => { freq[w]=(freq[w]||0)+1; });
        for (let i=0; i<words.length-1; i++) { const bg=`${words[i]} ${words[i+1]}`; bigrams[bg]=(bigrams[bg]||0)+1; }
    });
    const palabras = Object.entries(freq).filter(([,v])=>v>=1).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([w,c])=>({word:w,count:c}));
    const frasesFrecuentes = Object.entries(bigrams).filter(([,v])=>v>=2).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([bg,c])=>({frase:bg,count:c}));
    const TEMAS = {
        'Habilidades técnicas':['programacion','lenguajes','frameworks','tecnologias','herramientas','software','desarrollo','codigo','bases','datos','sistemas'],
        'Habilidades blandas':['comunicacion','trabajo','equipo','liderazgo','gestion','proyectos','tiempo','organizacion','adaptacion','creatividad','responsabilidad'],
        'Inglés / Idiomas':['ingles','idiomas','lenguaje','certificaciones','internacional','bilingue'],
        'Experiencia práctica':['practica','proyectos','reales','empresas','pasantias','experiencia','aplicacion','industria'],
        'Formación continua':['certificaciones','cursos','actualizacion','capacitacion','especializacion','aprendizaje'],
        'Emprendimiento':['emprendimiento','negocios','innovacion','startup','empresa','gestion','administracion'],
    };
    const temaConteo = {};
    Object.entries(TEMAS).forEach(([tema,kws]) => { let cnt=0; kws.forEach(kw => { cnt+=(freq[kw]||0); }); if (cnt>0) temaConteo[tema]=cnt; });
    const temas = Object.entries(temaConteo).sort((a,b)=>b[1]-a[1]).map(([tema,count],i) => ({tema,count,color:PALETA[i%PALETA.length]}));
    return { palabras, temas, frases:frasesFrecuentes, total:textos.length };
}

// ══════════════════════════════════════════════════════════
// COMPONENTES BASE
// ══════════════════════════════════════════════════════════
const KPI = ({ icon:I, valor, label, sub, color, delay=0 }) => (
    <div className="teeA" style={{background:'white',borderRadius:10,padding:'12px 14px',border:'1px solid #e5e7eb',borderTop:`3px solid ${color}`,boxShadow:'0 1px 4px rgba(0,0,0,.05)',display:'flex',alignItems:'center',gap:11,animationDelay:`${delay}ms`}}>
        <div style={{width:34,height:34,borderRadius:9,background:`${color}14`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <I style={{color,fontSize:'0.88rem'}}/>
        </div>
        <div>
            <div style={{fontSize:'1.3rem',fontWeight:800,color:'#0f172a',lineHeight:1,fontFamily:FONT}}>{valor}</div>
            <div style={{fontSize:'0.63rem',fontWeight:700,color:'#6b7280',fontFamily:FONT,marginTop:2,textTransform:'uppercase',letterSpacing:'0.4px'}}>{label}</div>
            {sub && <div style={{fontSize:'0.58rem',color:'#9ca3af',fontFamily:FONT,marginTop:1}}>{sub}</div>}
        </div>
    </div>
);

const Barra = ({ label, valor, total, color, compact=false }) => {
    const p = pct(valor,total);
    return (
        <div style={{marginBottom:compact?5:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:2,alignItems:'baseline'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
                    <div style={{width:7,height:7,borderRadius:'50%',backgroundColor:color,flexShrink:0}}/>
                    <span style={{fontSize:compact?'0.70rem':'0.73rem',color:'#374151',fontFamily:FONT,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
                </div>
                <span style={{fontSize:'0.67rem',color:'#6b7280',fontFamily:FONT,whiteSpace:'nowrap',marginLeft:6}}>
                    <strong style={{color:'#111827'}}>{valor}</strong>
                    <span style={{color:'#d1d5db',margin:'0 2px'}}>·</span>{p}%
                </span>
            </div>
            <div style={{height:compact?4:6,backgroundColor:'#f1f5f9',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${p}%`,backgroundColor:color,borderRadius:99,transition:'width .7s cubic-bezier(.4,0,.2,1)'}}/>
            </div>
        </div>
    );
};

const Donut = ({ segs, r=40, g=11, sz=96, label, sublabel }) => {
    const cx=sz/2, cy=sz/2, circ=2*Math.PI*r;
    const tot = segs.reduce((a,s) => a+(s.v||0), 0);
    if (!tot) return <svg width={sz} height={sz}><circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={g}/></svg>;
    let off=0;
    return (
        <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={g}/>
                {segs.map((s,i) => { const da=((s.v||0)/tot)*circ; const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth={g} strokeDasharray={`${da} ${circ}`} strokeDashoffset={-off} strokeLinecap="butt"/>; off+=da; return el; })}
            </svg>
            {label && (
                <div style={{position:'absolute',textAlign:'center',pointerEvents:'none'}}>
                    <div style={{fontSize:sz>100?'1.1rem':'0.85rem',fontWeight:800,color:'#111827',lineHeight:1,fontFamily:FONT}}>{label}</div>
                    {sublabel && <div style={{fontSize:'0.54rem',color:'#9ca3af',fontFamily:FONT,marginTop:1}}>{sublabel}</div>}
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// GRÁFICAS DE ENCUESTA
// ══════════════════════════════════════════════════════════
const GEscala = ({ resps, min, max }) => {
    const vals = resps.map(r => Number(r.valor)).filter(v => v>=1 && v<=5);
    if (!vals.length) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const c={1:0,2:0,3:0,4:0,5:0}; vals.forEach(v => c[v]++);
    const mx = Math.max(...Object.values(c),1);
    const prom = (vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2);
    const col = {1:'#ef4444',2:'#f97316',3:'#eab308',4:'#22c55e',5:'#16a34a'};
    return (
        <div>
            <div style={{display:'flex',gap:6,alignItems:'flex-end',marginBottom:10}}>
                {[1,2,3,4,5].map(n => { const h=Math.max(4,Math.round((c[n]/mx)*64)); return (
                    <div key={n} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                        <span style={{fontSize:'0.60rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>{c[n]}</span>
                        <div style={{width:'100%',height:h,backgroundColor:col[n],borderRadius:'3px 3px 0 0'}}/>
                        <span style={{fontSize:'0.62rem',fontWeight:700,color:col[n],fontFamily:FONT}}>{n}</span>
                    </div>
                ); })}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>{min||'1=Muy bajo'}</span>
                <div style={{background:`${AZUL}10`,border:`1px solid ${AZUL}25`,borderRadius:6,padding:'3px 9px',display:'inline-flex',alignItems:'center',gap:5}}>
                    <FaStar style={{color:DORADO,fontSize:'0.58rem'}}/>
                    <span style={{fontSize:'0.68rem',fontWeight:700,color:AZUL,fontFamily:FONT}}>Promedio: {prom}</span>
                </div>
                <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>{max||'5=Excelente'}</span>
            </div>
            <div style={{marginTop:6,fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>{vals.length} respuesta{vals.length!==1?'s':''}</div>
        </div>
    );
};

const GOpciones = ({ resps, tipo }) => {
    const total = resps.length;
    if (!total) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const c={};
    resps.forEach(r => { const v=r.valor; if (Array.isArray(v)) v.forEach(x => { c[x]=(c[x]||0)+1; }); else if (v) c[v]=(c[v]||0)+1; });
    const lista = Object.entries(c).sort((a,b) => b[1]-a[1]);
    return <div>{lista.map(([op,cnt],i) => <Barra key={i} label={op} valor={cnt} total={total} color={PALETA[i%PALETA.length]} compact/>)}<div style={{marginTop:6,fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>{total} respuesta{total!==1?'s':''}{tipo==='checkboxes'?' (múltiple)':''}</div></div>;
};

const GSiNo = ({ resps }) => {
    const total = resps.length;
    if (!total) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const si = resps.filter(r => r.valor==='Sí').length;
    const no = resps.filter(r => r.valor==='No').length;
    return (
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <Donut segs={[{v:si,c:VERDE},{v:no,c:ROJO}]} r={34} g={10} sz={84} label={`${pct(si,total)}%`} sublabel="Sí"/>
            <div style={{flex:1}}>
                {[[VERDE,'Sí',si],[ROJO,'No',no]].map(([c,l,v]) => (
                    <div key={l} style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0}}/>
                        <span style={{fontSize:'0.72rem',color:'#374151',flex:1,fontFamily:FONT}}>{l}</span>
                        <span style={{fontSize:'0.72rem',fontWeight:700,color:c,fontFamily:FONT}}>{v}</span>
                        <span style={{fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>({pct(v,total)}%)</span>
                    </div>
                ))}
                <div style={{fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT,marginTop:4}}>{total} respuestas</div>
            </div>
        </div>
    );
};

const GraficaTextoNLP = ({ resps }) => {
    const textos = useMemo(() => resps.map(r => r.valor).filter(v => v && String(v).trim().length>2), [resps]);
    const { palabras, temas, frases, total } = useMemo(() => analizarTexto(textos), [textos]);
    if (!total) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const maxFreq = palabras[0]?.count || 1;
    return (
        <div>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:`${AZUL}08`,border:`1px solid ${AZUL}20`,borderRadius:8,marginBottom:12}}>
                <FaCommentDots style={{color:AZUL,fontSize:'0.78rem',flexShrink:0}}/>
                <div>
                    <div style={{fontSize:'0.72rem',fontWeight:700,color:AZUL,fontFamily:FONT}}>Análisis de {total} respuesta{total!==1?'s':''}</div>
                    <div style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT}}>Detección automática de patrones y palabras clave</div>
                </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                    <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Palabras más frecuentes</p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,alignItems:'center',minHeight:80}}>
                        {palabras.slice(0,20).map((p,i) => {
                            const size = 0.62+((p.count/maxFreq)*0.55);
                            const color = PALETA[i%PALETA.length];
                            return <span key={i} style={{fontSize:`${size}rem`,fontWeight:p.count===maxFreq?800:700,color,fontFamily:FONT,padding:'2px 6px',borderRadius:99,background:`${color}12`,border:`1px solid ${color}22`,lineHeight:1.4}} title={`${p.word}: ${p.count}`}>{p.word}</span>;
                        })}
                    </div>
                </div>
                <div>
                    <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Temas identificados</p>
                    {temas.length > 0
                        ? temas.map((t,i) => <Barra key={i} label={t.tema} valor={t.count} total={palabras.reduce((s,p)=>s+p.count,1)} color={t.color} compact/>)
                        : <p style={{margin:0,fontSize:'0.68rem',color:'#9ca3af',fontFamily:FONT}}>No se detectaron temas.</p>
                    }
                </div>
            </div>
            <div style={{marginTop:12,borderTop:'1px solid #f1f5f9',paddingTop:10}}>
                <p style={{margin:'0 0 6px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Muestra de respuestas</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                    {textos.filter(t => t.length>20).slice(0,4).map((t,i) => (
                        <div key={i} style={{padding:'7px 10px',background:i%2===0?'#f8fafc':'#fff7f7',borderRadius:7,border:'1px solid #e5e7eb',fontSize:'0.69rem',color:'#374151',fontFamily:FONT,lineHeight:1.55,fontStyle:'italic'}}>
                            "{t.slice(0,120)}{t.length>120?'...':''}"
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GraficaPregunta = ({ grupo, filtros }) => {
    const resps = useMemo(() => {
        let r = grupo.respuestasRaw || [];
        if (filtros.encuestaId) r = r.filter(x => x.encuestaId===filtros.encuestaId);
        if (filtros.tipoCapital) r = r.filter(x => x.tipoCapital===filtros.tipoCapital);
        return r;
    }, [grupo.respuestasRaw, filtros]);

    switch (grupo.tipo) {
        case 'escala': return <GEscala resps={resps} min={grupo.etiquetaMin} max={grupo.etiquetaMax}/>;
        case 'opcion_multiple': case 'checkboxes': return <GOpciones resps={resps} tipo={grupo.tipo}/>;
        case 'si_no': return <GSiNo resps={resps}/>;
        case 'texto_libre': return <GraficaTextoNLP resps={resps}/>;
        default: return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Tipo no visualizable</p>;
    }
};

const TarjetaGrupo = ({ grupo, encuestas, filtros, num }) => {
    const [open, setOpen] = useState(true);
    const cnt = useMemo(() => {
        let r = grupo.respuestasRaw || [];
        if (filtros.encuestaId) r = r.filter(x => x.encuestaId===filtros.encuestaId);
        if (filtros.tipoCapital) r = r.filter(x => x.tipoCapital===filtros.tipoCapital);
        return r.length;
    }, [grupo.respuestasRaw, filtros]);

    const tipoBadge = {
        escala:{ lbl:'Escala',c:AZUL }, opcion_multiple:{ lbl:'Opción',c:VERDE },
        checkboxes:{ lbl:'Múltiple',c:CIAN }, si_no:{ lbl:'Sí/No',c:NARANJA },
        texto_libre:{ lbl:'Texto · NLP',c:MORADO }, numero:{ lbl:'Número',c:DORADO },
    }[grupo.tipo] || { lbl:grupo.tipo, c:GRIS };

    return (
        <div className="teeA" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:10}}>
            <div className="teeHov" onClick={() => setOpen(a=>!a)} style={{padding:'10px 14px',display:'flex',alignItems:'flex-start',gap:10,background:open?`${ROJO}04`:'white',borderBottom:open?'1px solid #f1f5f9':'none'}}>
                <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                    <span style={{fontSize:'0.60rem',fontWeight:800,color:ROJO,fontFamily:FONT}}>{num}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:8,flexWrap:'wrap'}}>
                        <span style={{fontSize:'0.79rem',fontWeight:600,color:'#0f172a',fontFamily:FONT,flex:1,lineHeight:1.4}}>{grupo.textoCanonical}</span>
                        <div style={{display:'flex',gap:5,flexShrink:0}}>
                            <span style={{fontSize:'0.58rem',fontWeight:700,color:tipoBadge.c,background:`${tipoBadge.c}12`,border:`1px solid ${tipoBadge.c}25`,borderRadius:99,padding:'2px 7px',fontFamily:FONT}}>{tipoBadge.lbl}</span>
                            {grupo.esComun && <span style={{fontSize:'0.58rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,border:`1px solid ${VERDE}25`,borderRadius:99,padding:'2px 7px',fontFamily:FONT}}>Recurrente</span>}
                        </div>
                    </div>
                    <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT,marginTop:3,display:'block'}}>{cnt} respuesta{cnt!==1?'s':''}</span>
                </div>
                <div style={{fontSize:'0.68rem',color:'#94a3b8',flexShrink:0,padding:'2px 5px',fontFamily:FONT}}>{open?'▲':'▼'}</div>
            </div>
            {open && <div style={{padding:'12px 14px'}}><GraficaPregunta grupo={grupo} filtros={filtros}/></div>}
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// MAPA
// ══════════════════════════════════════════════════════════
const BOUNDS_PROV = {
    'azuay':[[-3.35,-79.40],[-2.38,-78.55]],'bolivar':[[-1.95,-79.38],[-1.20,-78.60]],
    'canar':[[-3.10,-79.40],[-2.10,-78.60]],'carchi':[[0.30,-78.35],[0.92,-77.60]],
    'chimborazo':[[-2.30,-79.10],[-1.25,-78.20]],'cotopaxi':[[-1.50,-79.18],[-0.35,-78.30]],
    'el oro':[[-3.80,-80.35],[-2.95,-79.55]],'esmeraldas':[[0.50,-80.30],[1.45,-78.85]],
    'guayas':[[-3.15,-80.35],[-1.55,-79.20]],'imbabura':[[0.10,-78.75],[0.65,-77.80]],
    'loja':[[-4.70,-80.25],[-3.30,-78.85]],'los rios':[[-1.80,-79.90],[-0.65,-79.20]],
    'manabi':[[-1.90,-80.90],[-0.05,-79.70]],'morona santiago':[[-3.90,-78.50],[-1.45,-76.70]],
    'napo':[[-1.50,-78.30],[-0.30,-76.90]],'orellana':[[-1.30,-77.50],[0.50,-75.20]],
    'pastaza':[[-2.70,-78.20],[-1.00,-75.80]],'pichincha':[[-0.65,-79.10],[0.20,-78.00]],
    'santa elena':[[-3.20,-81.10],[-1.80,-80.30]],'santo domingo de los tsachilas':[[-0.65,-79.60],[0.05,-78.90]],
    'sucumbios':[[-0.35,-77.60],[0.60,-75.20]],'tungurahua':[[-1.60,-78.90],[-1.05,-78.20]],
    'zamora chinchipe':[[-5.00,-79.40],[-3.30,-77.90]],
};

const ZC = ({ prov }) => {
    const map = useMap();
    useEffect(() => {
        const b = prov ? BOUNDS_PROV[norm(prov)] : null;
        b ? map.fitBounds(b,{padding:[20,20]}) : map.fitBounds(EC,{padding:[8,8],maxZoom:8});
    }, [prov]);
    return null;
};

const MapaEmp = ({ porProv, porCiud, filtros, geoData }) => {
    const lP = useMemo(() => {
        const m={};
        (porProv||[]).forEach((p,i) => { m[norm(p.provincia)]={total:p.total,color:PALETA[i%PALETA.length],light:PALETA_LIGHT[i%PALETA_LIGHT.length]}; });
        return m;
    }, [porProv]);
    const lC = useMemo(() => {
        const m={};
        (porCiud||[]).forEach(c => { m[normCanton(c.ciudad)]=c.total; });
        return m;
    }, [porCiud]);
    const pN=norm(filtros.provincia||''), hayP=!!filtros.provincia;
    const getC = f => f.properties?.DPA_DESCAN||f.properties?.DPA_CANTON||f.properties?.NAME_2||'';
    const getP = f => f.properties?.DPA_DESPRO||f.properties?.NAME_1||'';
    const lCR=useRef(lC), eCR=useRef(null);
    useEffect(() => { lCR.current=lC; }, [lC]);
    const estC = useCallback(f => {
        const nc=getC(f), np=getP(f), pn=norm(np);
        const g=lC[normCanton(nc)]||lC[norm(nc)]||0, pv=lP[pn];
        if (hayP && pn!==pN) return {fillColor:'#dde2e8',fillOpacity:0.55,color:'#94a3b8',weight:0.4};
        if (!pv) return {fillColor:'#edf0f4',fillOpacity:0.5,color:'#94a3b8',weight:0.4};
        if (!g) return {fillColor:pv.light,fillOpacity:0.35,color:'#000',weight:0.8};
        return {fillColor:pv.color,fillOpacity:0.80,color:'#000',weight:1.2};
    }, [lP,lC,hayP,pN]);
    useEffect(() => { eCR.current=estC; }, [estC]);
    const estP = useCallback(f => {
        const pn=norm(getP(f)), pv=lP[pn];
        if (hayP && pn===pN && pv) return {fillOpacity:0,color:pv.color,weight:3};
        return {fillOpacity:0,color:pv?'#475569':'#94a3b8',weight:pv?1.8:0.8};
    }, [lP,hayP,pN]);
    const estE = useCallback(() => ({fillColor:'#e2e8f0',fillOpacity:0.08,color:'#64748b',weight:1.5}), []);
    const onE = useCallback((f,layer) => {
        const nc=getC(f), np=getP(f);
        layer.on({
            mouseover(e) {
                const g=lCR.current[normCanton(nc)]||lCR.current[norm(nc)]||0;
                const pv=lP[norm(np)]; if (!pv) return;
                layer.bindTooltip(`<div style="font-family:${FONT};min-width:110px"><div style="font-weight:700;font-size:.82rem;color:${pv.color};margin-bottom:3px">${nc}</div><div style="font-size:.74rem;color:#374151">${g>0?`<strong>${g}</strong> empresa${g!==1?'s':''}` :'<span style="color:#9ca3af">Sin empresas</span>'}</div><div style="font-size:.64rem;color:#9ca3af;margin-top:2px">${np}</div></div>`,{direction:'top',opacity:1,sticky:true}).openTooltip(e.latlng);
                e.target.setStyle({fillOpacity:g>0?1:0.5,weight:2.5,color:'#000'}); e.target.bringToFront();
            },
            mouseout(e) { layer.unbindTooltip(); e.target.setStyle(eCR.current(f)); },
        });
    }, [lP]);
    const kC = useMemo(() => `c-${JSON.stringify(lC)}-${filtros.provincia}-${filtros.ciudad}`, [lC,filtros]);
    const kP = useMemo(() => `p-${JSON.stringify(Object.keys(lP))}-${filtros.provincia}`, [lP,filtros]);
    if (!porProv?.length || !geoData?.ecuador || !geoData?.cantones || !geoData?.provincias)
        return (
            <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
                <FaGlobeAmericas style={{fontSize:'2rem',color:'#94a3b8'}}/>
                <p style={{margin:0,fontSize:'0.80rem',color:'#475569',fontFamily:FONT,fontWeight:700}}>{!geoData?.cantones?'Cargando mapa...':'Sin datos geográficos'}</p>
            </div>
        );
    return (
        <MapContainer bounds={EC} boundsOptions={{padding:[8,8]}} minZoom={6.4} maxZoom={13} maxBounds={[[-5.5,-82.0],[2.0,-74.5]]} maxBoundsViscosity={0.9} style={{width:'100%',height:'100%',borderRadius:8,zIndex:1}} scrollWheelZoom zoomControl>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' subdomains="abcd" maxZoom={19}/>
            <GeoJSON key="ec" data={geoData.ecuador} style={estE}/>
            <GeoJSON key={kC} data={geoData.cantones} style={estC} onEachFeature={onE}/>
            <GeoJSON key={kP} data={geoData.provincias} style={estP}/>
            <ZC prov={filtros.provincia}/>
        </MapContainer>
    );
};

// ══════════════════════════════════════════════════════════
// SECCIÓN 1 — EMPRESAS REGISTRADAS (con paginación de 10)
// ══════════════════════════════════════════════════════════
const POR_PAG_EMP = 10;

const SeccionEmpresas = ({ empleadoresRaw, opsProv, opsCap }) => {
    const [buscar,   setBuscar]   = useState('');
    const [filtProv, setFiltProv] = useState('');
    const [filtCap,  setFiltCap]  = useState('');
    const [pagina,   setPagina]   = useState(1);
    const [verDetalle, setVerDetalle] = useState(null);

    // Filtrar
    const lista = useMemo(() => {
        let r = empleadoresRaw;
        if (buscar)   r = r.filter(e => norm(e.nombreEmpresa).includes(norm(buscar)) || norm(e.nombreGerente).includes(norm(buscar)));
        if (filtProv) r = r.filter(e => norm(e.provincia) === norm(filtProv));
        if (filtCap)  r = r.filter(e => e.tipoCapital === filtCap);
        return r;
    }, [empleadoresRaw, buscar, filtProv, filtCap]);

    const totalPags = Math.ceil(lista.length / POR_PAG_EMP);
    const slice = lista.slice((pagina-1)*POR_PAG_EMP, pagina*POR_PAG_EMP);

    const limpiar = () => { setBuscar(''); setFiltProv(''); setFiltCap(''); setPagina(1); };

    const hayFiltro = buscar || filtProv || filtCap;

    return (
        <div className="teeA">
            {/* Header con estadísticas rápidas */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
                <KPI icon={FaBuilding} valor={empleadoresRaw.length} label="Total registradas" color={ROJO} delay={0}/>
                <KPI icon={FaCheckCircle} valor={empleadoresRaw.filter(e=>e.respondio).length} label="Respondieron encuesta" color={VERDE} delay={40}/>
                <KPI icon={FaTimesCircle} valor={empleadoresRaw.filter(e=>!e.respondio).length} label="Sin responder" color={NARANJA} delay={80}/>
                <KPI icon={FaCity} valor={[...new Set(empleadoresRaw.map(e=>e.provincia).filter(Boolean))].length} label="Provincias" color={AZUL} delay={120}/>
            </div>

            {/* Barra de filtros */}
            <div style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'12px 16px',marginBottom:14,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                {/* Buscador */}
                <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:200,background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:8,padding:'8px 12px'}}>
                    <FaSearch style={{color:'#94a3b8',fontSize:'0.72rem',flexShrink:0}}/>
                    <input
                        value={buscar} onChange={e=>{setBuscar(e.target.value);setPagina(1);}}
                        placeholder="Buscar empresa o gerente..."
                        style={{border:'none',background:'transparent',outline:'none',fontSize:'0.78rem',color:'#374151',width:'100%',fontFamily:FONT}}
                    />
                    {buscar && <button onClick={()=>{setBuscar('');setPagina(1);}} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:'0.85rem',lineHeight:1}}>×</button>}
                </div>

                <select value={filtProv} onChange={e=>{setFiltProv(e.target.value);setPagina(1);}} style={{padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:'0.76rem',color:'#374151',fontFamily:FONT,background:'white',outline:'none',cursor:'pointer'}}>
                    <option value="">Todas las provincias</option>
                    {opsProv.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select value={filtCap} onChange={e=>{setFiltCap(e.target.value);setPagina(1);}} style={{padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:'0.76rem',color:'#374151',fontFamily:FONT,background:'white',outline:'none',cursor:'pointer'}}>
                    <option value="">Todos los tipos</option>
                    {opsCap.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {hayFiltro && (
                    <button onClick={limpiar} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'8px 12px',background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:8,cursor:'pointer',fontSize:'0.74rem',fontWeight:600,color:ROJO,fontFamily:FONT}}>
                        <FaTimes style={{fontSize:'0.62rem'}}/>Limpiar
                    </button>
                )}

                <span style={{fontSize:'0.72rem',color:'#6b7280',fontFamily:FONT,marginLeft:'auto'}}>
                    {lista.length} resultado{lista.length!==1?'s':''}
                </span>
            </div>

            {/* Tabla */}
            <div style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden'}}>
                {/* Cabecera */}
                <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 80px',gap:0,padding:'10px 16px',background:'#f8fafc',borderBottom:'2px solid #e5e7eb'}}>
                    {['Empresa','Gerente','Provincia / Cantón','Tipo Capital','Tipo Actividad','Estado'].map(h => (
                        <span key={h} style={{fontSize:'0.60rem',fontWeight:700,color:'#6b7280',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</span>
                    ))}
                </div>

                {/* Filas */}
                {slice.length === 0 ? (
                    <div style={{padding:'32px',textAlign:'center'}}>
                        <FaBuilding style={{color:'#cbd5e1',fontSize:'2rem',marginBottom:8}}/>
                        <p style={{margin:0,fontSize:'0.78rem',color:'#94a3b8',fontFamily:FONT}}>Sin empresas con esos filtros</p>
                    </div>
                ) : slice.map((e, i) => (
                    <div key={e._id} className="teeRow" style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 80px',gap:0,padding:'10px 16px',borderBottom:i<slice.length-1?'1px solid #f1f5f9':'none',alignItems:'center',cursor:'pointer',transition:'background .1s'}} onClick={()=>setVerDetalle(verDetalle===e._id ? null : e._id)}>
                        <div>
                            <div style={{fontSize:'0.76rem',fontWeight:700,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombreEmpresa}</div>
                            <div style={{fontSize:'0.62rem',color:'#94a3b8',fontFamily:FONT,marginTop:1}}>{e.emailOrganizacion}</div>
                        </div>
                        <div style={{fontSize:'0.72rem',color:'#475569',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombreGerente}</div>
                        <div style={{fontSize:'0.70rem',color:'#6b7280',fontFamily:FONT}}>{[e.provincia,e.ciudad].filter(Boolean).join(' › ')||'—'}</div>
                        <div>
                            <span style={{fontSize:'0.60rem',fontWeight:700,color:e.tipoCapital==='Pública'?AZUL:e.tipoCapital==='Privada'?MORADO:CIAN,background:e.tipoCapital==='Pública'?`${AZUL}12`:e.tipoCapital==='Privada'?`${MORADO}12`:`${CIAN}12`,borderRadius:99,padding:'2px 7px',fontFamily:FONT}}>{e.tipoCapital||'—'}</span>
                        </div>
                        <div>
                            <span style={{fontSize:'0.60rem',fontWeight:600,color:NARANJA,background:`${NARANJA}10`,borderRadius:99,padding:'2px 7px',fontFamily:FONT}}>{e.tipoActividad||'—'}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                            <span style={{fontSize:'0.60rem',fontWeight:700,color:e.respondio?VERDE:GRIS,background:e.respondio?`${VERDE}10`:`${GRIS}10`,borderRadius:99,padding:'2px 6px',fontFamily:FONT,whiteSpace:'nowrap'}}>
                                {e.respondio ? '✓ Respondió' : 'Pendiente'}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Paginación */}
                {totalPags > 1 && (
                    <div style={{padding:'12px 16px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafafa'}}>
                        <span style={{fontSize:'0.70rem',color:'#6b7280',fontFamily:FONT}}>
                            Mostrando {(pagina-1)*POR_PAG_EMP+1}–{Math.min(pagina*POR_PAG_EMP,lista.length)} de {lista.length} empresas
                        </span>
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                            <button className="teePag" disabled={pagina===1} onClick={()=>setPagina(p=>p-1)} style={{width:30,height:30,borderRadius:6,border:'1px solid #e5e7eb',background:'white',color:pagina===1?'#d1d5db':'#374151',cursor:pagina===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',transition:'all .15s'}}>
                                <FaChevronLeft/>
                            </button>
                            {Array.from({length:totalPags},(_,i)=>i+1).filter(p=>p===1||p===totalPags||Math.abs(p-pagina)<=1).reduce((acc,p,idx,arr)=>{if(idx>0&&p-arr[idx-1]>1)acc.push('…');acc.push(p);return acc;},[]).map((item,i)=>
                                item==='…' ? <span key={`e${i}`} style={{fontSize:'0.7rem',color:'#9ca3af',padding:'0 2px',fontFamily:FONT}}>···</span>
                                : <button key={item} className="teePag" onClick={()=>setPagina(item)} style={{width:30,height:30,borderRadius:6,border:`1px solid ${item===pagina?ROJO:'#e5e7eb'}`,background:item===pagina?ROJO:'white',color:item===pagina?'white':'#374151',cursor:'pointer',fontSize:'0.74rem',fontWeight:item===pagina?700:400,fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>{item}</button>
                            )}
                            <button className="teePag" disabled={pagina===totalPags} onClick={()=>setPagina(p=>p+1)} style={{width:30,height:30,borderRadius:6,border:'1px solid #e5e7eb',background:'white',color:pagina===totalPags?'#d1d5db':'#374151',cursor:pagina===totalPags?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',transition:'all .15s'}}>
                                <FaChevronRight/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// SECCIÓN 2 — ENCUESTAS REALIZADAS
// ══════════════════════════════════════════════════════════
const SeccionEncuestas = ({ encuestas, empleadoresRaw, respuestasRaw, preguntasAgrupadas, kpis }) => {
    const [encSel,     setEncSel]     = useState('');
    const [filtCap,    setFiltCap]    = useState('');
    const opsCap = useMemo(() => [...new Set(empleadoresRaw.map(e=>e.tipoCapital).filter(Boolean))].sort(), [empleadoresRaw]);

    const encC = encuestas.filter(e => e.estado === 'cerrada');
    const encA = encuestas.filter(e => e.estado === 'activa');

    const filtros = { encuestaId: encSel, tipoCapital: filtCap };

    const pregsF = useMemo(() => {
        const idsC = new Set(encC.map(e=>e._id));
        return preguntasAgrupadas.map(g => ({
            ...g,
            respuestasRaw: (g.respuestasRaw||[]).filter(r => {
                if (!idsC.has(r.encuestaId)) return false;
                if (filtros.encuestaId && r.encuestaId!==filtros.encuestaId) return false;
                if (filtros.tipoCapital && r.tipoCapital!==filtros.tipoCapital) return false;
                return true;
            }),
        })).filter(g => g.respuestasRaw.length > 0);
    }, [preguntasAgrupadas, encC, filtros.encuestaId, filtros.tipoCapital]);

    const comunes = pregsF.filter(g => g.esComun);
    const otras   = pregsF.filter(g => !g.esComun);

    const estadoBadge = est => ({
        activa:  { bg:'#e8f5e9', color:'#2e7d32', label:'Activa' },
        cerrada: { bg:'#f5f5f5', color:'#757575', label:'Cerrada' },
        borrador:{ bg:'#fff8e1', color:'#f57f17', label:'Borrador' },
    }[est] || { bg:'#f5f5f5', color:'#9e9e9e', label:est });

    return (
        <div className="teeA">
            {/* KPIs encuestas */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
                <KPI icon={FaClipboardList} valor={encuestas.length}          label="Encuestas totales"    color={AZUL}   delay={0}/>
                <KPI icon={FaCheckCircle}   valor={encC.length}               label="Cerradas"             color={VERDE}  delay={40}/>
                <KPI icon={FaStar}          valor={encA.length}               label="Activas"              color={NARANJA} delay={80}/>
                <KPI icon={FaUsers}         valor={kpis.empleadoresRespondieron||0} label="Respondieron"  color={CIAN}   delay={120}/>
                <KPI icon={FaLayerGroup}    valor={comunes.length}            label="Preguntas recurrentes" color={MORADO} delay={160}/>
            </div>

            {/* Lista de encuestas */}
            <div style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:16}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${AZUL}06,transparent)`,display:'flex',alignItems:'center',gap:8}}>
                    <FaClipboardList style={{color:AZUL,fontSize:'0.82rem'}}/>
                    <span style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Lista de Encuestas</span>
                    <span style={{fontSize:'0.62rem',color:'#94a3b8',fontFamily:FONT}}>· {encuestas.length} en total</span>
                </div>
                {encuestas.length === 0 ? (
                    <div style={{padding:'32px',textAlign:'center'}}>
                        <FaClipboardList style={{color:'#cbd5e1',fontSize:'2rem',marginBottom:8}}/>
                        <p style={{margin:0,fontSize:'0.78rem',color:'#94a3b8',fontFamily:FONT}}>No hay encuestas registradas aún</p>
                    </div>
                ) : (
                    <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                        {encuestas.map((enc, i) => {
                            const b = estadoBadge(enc.estado);
                            const respEnc = respuestasRaw.filter(r => r.encuestaId === enc._id).length;
                            return (
                                <div key={enc._id} className="teeCard" style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:`1px solid ${encSel===enc._id?ROJO:'#e5e7eb'}`,borderRadius:9,background:encSel===enc._id?`${ROJO}04`:'#fafafa',cursor:'pointer',boxShadow:'0 1px 3px rgba(0,0,0,.04)'}} onClick={()=>setEncSel(encSel===enc._id?'':enc._id)}>
                                    <div style={{width:36,height:36,borderRadius:9,background:`${AZUL}12`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                        <FaClipboardList style={{color:AZUL,fontSize:'0.88rem'}}/>
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontSize:'0.82rem',fontWeight:700,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{enc.titulo}</div>
                                        <div style={{display:'flex',gap:8,marginTop:3,alignItems:'center',flexWrap:'wrap'}}>
                                            {enc.fechaInicio && <span style={{fontSize:'0.62rem',color:'#94a3b8',fontFamily:FONT}}>Inicio: {fmt(enc.fechaInicio)}</span>}
                                            {enc.fechaCierre && <span style={{fontSize:'0.62rem',color:'#94a3b8',fontFamily:FONT}}>· Cierre: {fmt(enc.fechaCierre)}</span>}
                                            <span style={{fontSize:'0.62rem',color:VERDE,fontFamily:FONT,fontWeight:600}}>{respEnc} respuesta{respEnc!==1?'s':''}</span>
                                        </div>
                                    </div>
                                    <span style={{fontSize:'0.62rem',fontWeight:700,color:b.color,background:b.bg,borderRadius:99,padding:'3px 9px',fontFamily:FONT,whiteSpace:'nowrap',flexShrink:0}}>{b.label}</span>
                                    {encSel===enc._id && <span style={{fontSize:'0.70rem',color:ROJO,fontFamily:FONT,fontWeight:700,flexShrink:0}}>▼ Seleccionada</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Filtros para gráficas */}
            {encC.length > 0 && (
                <div style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'12px 16px',marginBottom:14,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                    <FaFilter style={{color:'#94a3b8',fontSize:'0.70rem'}}/>
                    <span style={{fontSize:'0.74rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>Filtrar resultados:</span>
                    <select value={encSel} onChange={e=>setEncSel(e.target.value)} style={{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:'0.74rem',color:'#374151',fontFamily:FONT,background:'white',outline:'none',cursor:'pointer',minWidth:220}}>
                        <option value="">Todas las encuestas cerradas</option>
                        {encC.map(e => <option key={e._id} value={e._id}>{e.titulo}</option>)}
                    </select>
                    <select value={filtCap} onChange={e=>setFiltCap(e.target.value)} style={{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:'0.74rem',color:'#374151',fontFamily:FONT,background:'white',outline:'none',cursor:'pointer'}}>
                        <option value="">Todos los tipos de empresa</option>
                        {opsCap.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {(encSel||filtCap) && <button onClick={()=>{setEncSel('');setFiltCap('');}} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:8,cursor:'pointer',fontSize:'0.72rem',fontWeight:600,color:ROJO,fontFamily:FONT}}><FaTimes style={{fontSize:'0.60rem'}}/>Limpiar</button>}
                </div>
            )}

            {/* Preguntas recurrentes */}
            {comunes.length > 0 && (
                <div style={{marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <div style={{width:28,height:28,borderRadius:7,background:`${VERDE}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaLayerGroup style={{color:VERDE,fontSize:'0.78rem'}}/></div>
                        <div>
                            <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Preguntas Recurrentes</div>
                            <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>Aparecen en múltiples encuestas · {comunes.length} grupo{comunes.length!==1?'s':''}</div>
                        </div>
                    </div>
                    {comunes.map((g,i) => <TarjetaGrupo key={g.id} grupo={g} encuestas={encC} filtros={filtros} num={i+1}/>)}
                </div>
            )}

            {/* Otras preguntas */}
            {otras.length > 0 && (
                <div style={{marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <div style={{width:28,height:28,borderRadius:7,background:`${AZUL}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaQuestion style={{color:AZUL,fontSize:'0.78rem'}}/></div>
                        <div>
                            <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Otras Preguntas</div>
                            <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>{encSel?'Preguntas de la encuesta seleccionada':'Específicas de una encuesta'} · {otras.length} grupo{otras.length!==1?'s':''}</div>
                        </div>
                    </div>
                    {otras.map((g,i) => <TarjetaGrupo key={g.id} grupo={g} encuestas={encC} filtros={filtros} num={comunes.length+i+1}/>)}
                </div>
            )}

            {comunes.length===0 && otras.length===0 && (
                <div style={{padding:'32px',background:'white',borderRadius:10,border:'1px solid #e5e7eb',textAlign:'center'}}>
                    <FaClipboardList style={{color:'#cbd5e1',fontSize:'2rem',marginBottom:8}}/>
                    <p style={{margin:'0 0 6px',fontSize:'0.78rem',fontWeight:600,color:'#94a3b8',fontFamily:FONT}}>{encC.length===0?'No hay encuestas cerradas aún':'Sin resultados con los filtros actuales'}</p>
                    <p style={{margin:0,fontSize:'0.68rem',color:'#cbd5e1',fontFamily:FONT}}>{encC.length===0?'Los gráficos aparecerán al cerrar una encuesta.':'Prueba limpiando los filtros.'}</p>
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// SECCIÓN 3 — RESPUESTAS POR EMPRESA
// ══════════════════════════════════════════════════════════
const POR_PAG_R3 = 6;

const SeccionRespuestas = ({ respuestasRaw, empleadoresRaw, encuestas, opsProv }) => {
    const [filtProv, setFiltProv] = useState('');
    const [filtCant, setFiltCant] = useState('');
    const [filtEnc,  setFiltEnc]  = useState('');
    const [pagina,   setPagina]   = useState(1);

    const encC = encuestas.filter(e => e.estado==='cerrada');

    // Cantones disponibles según provincia seleccionada
    const cantones = useMemo(() => {
        if (!filtProv) return [];
        return [...new Set(empleadoresRaw.filter(e => norm(e.provincia)===norm(filtProv)).map(e=>e.ciudad).filter(Boolean))].sort();
    }, [filtProv, empleadoresRaw]);

    // Filtrar respuestas
    const respFiltradas = useMemo(() => {
        let r = respuestasRaw;
        if (filtProv) r = r.filter(x => norm(x.provincia)===norm(filtProv));
        if (filtCant) r = r.filter(x => norm(x.ciudad)===norm(filtCant));
        if (filtEnc)  r = r.filter(x => x.encuestaId===filtEnc);
        return r;
    }, [respuestasRaw, filtProv, filtCant, filtEnc]);

    // Agrupar por empresa
    const porEmpresa = useMemo(() => {
        const m = {};
        respFiltradas.forEach(r => {
            const key = r.empleadorId || r.nombreEmpresa;
            if (!m[key]) m[key] = { nombreEmpresa:r.nombreEmpresa, provincia:r.provincia, ciudad:r.ciudad, tipoCapital:r.tipoCapital, tipoActividad:r.tipoActividad, respuestas:[] };
            m[key].respuestas.push(r);
        });
        return Object.values(m).sort((a,b) => b.respuestas.length - a.respuestas.length);
    }, [respFiltradas]);

    const totalPags = Math.ceil(porEmpresa.length / POR_PAG_R3);
    const slice = porEmpresa.slice((pagina-1)*POR_PAG_R3, pagina*POR_PAG_R3);

    const limpiar = () => { setFiltProv(''); setFiltCant(''); setFiltEnc(''); setPagina(1); };
    const hayFiltro = filtProv || filtCant || filtEnc;

    const capColor = cap => ({ Pública:`${AZUL}`, Privada:`${MORADO}`, Mixto:`${CIAN}` }[cap] || GRIS);

    return (
        <div className="teeA">
            {/* KPIs */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
                <KPI icon={FaClipboardList} valor={respuestasRaw.length}                                                     label="Respuestas totales"  color={AZUL}   delay={0}/>
                <KPI icon={FaBuilding}      valor={[...new Set(respuestasRaw.map(r=>r.empleadorId||r.nombreEmpresa))].length} label="Empresas respondieron" color={VERDE} delay={40}/>
                <KPI icon={FaUsers}         valor={[...new Set(respuestasRaw.map(r=>r.datosEncuestado?.nombresApellidos).filter(Boolean))].length} label="Personas distintas" color={MORADO} delay={80}/>
                <KPI icon={FaClipboardList} valor={encC.length}                                                              label="Encuestas cerradas"  color={NARANJA} delay={120}/>
            </div>

            {/* Filtros */}
            <div style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'14px 16px',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                    <FaFilter style={{color:ROJO,fontSize:'0.70rem'}}/>
                    <span style={{fontSize:'0.78rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Filtrar por ubicación y encuesta</span>
                    {hayFiltro && <span style={{background:ROJO,color:'white',borderRadius:99,fontSize:'0.58rem',fontWeight:700,padding:'1px 6px',fontFamily:FONT}}>{[filtProv,filtCant,filtEnc].filter(Boolean).length}</span>}
                </div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:140}}>
                        <FaMapMarkerAlt style={{color:'#94a3b8',fontSize:'0.66rem',flexShrink:0}}/>
                        <select value={filtProv} onChange={e=>{setFiltProv(e.target.value);setFiltCant('');setPagina(1);}} style={{flex:1,padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:'0.74rem',color:'#374151',fontFamily:FONT,background:'white',outline:'none',cursor:'pointer'}}>
                            <option value="">Todas las provincias</option>
                            {opsProv.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {filtProv && cantones.length > 0 && (
                        <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:140}}>
                            <FaCity style={{color:'#94a3b8',fontSize:'0.66rem',flexShrink:0}}/>
                            <select value={filtCant} onChange={e=>{setFiltCant(e.target.value);setPagina(1);}} style={{flex:1,padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:'0.74rem',color:'#374151',fontFamily:FONT,background:'white',outline:'none',cursor:'pointer'}}>
                                <option value="">Todos los cantones</option>
                                {cantones.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{display:'flex',alignItems:'center',gap:6,flex:2,minWidth:200}}>
                        <FaClipboardList style={{color:'#94a3b8',fontSize:'0.66rem',flexShrink:0}}/>
                        <select value={filtEnc} onChange={e=>{setFiltEnc(e.target.value);setPagina(1);}} style={{flex:1,padding:'8px 10px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:'0.74rem',color:'#374151',fontFamily:FONT,background:'white',outline:'none',cursor:'pointer'}}>
                            <option value="">Todas las encuestas</option>
                            {encC.map(e => <option key={e._id} value={e._id}>{e.titulo}</option>)}
                        </select>
                    </div>

                    {hayFiltro && (
                        <button onClick={limpiar} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'8px 12px',background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:8,cursor:'pointer',fontSize:'0.74rem',fontWeight:600,color:ROJO,fontFamily:FONT}}>
                            <FaTimes style={{fontSize:'0.60rem'}}/>Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Chips de filtros activos */}
                {hayFiltro && (
                    <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap',alignItems:'center'}}>
                        <span style={{fontSize:'0.64rem',color:'#94a3b8',fontFamily:FONT}}>Filtros activos:</span>
                        {filtProv && <span style={{background:`${ROJO}12`,color:ROJO,border:`1px solid ${ROJO}25`,borderRadius:99,fontSize:'0.65rem',fontWeight:600,padding:'2px 8px',fontFamily:FONT}}>{filtProv}</span>}
                        {filtCant && <span style={{background:`${ROJO}12`,color:ROJO,border:`1px solid ${ROJO}25`,borderRadius:99,fontSize:'0.65rem',fontWeight:600,padding:'2px 8px',fontFamily:FONT}}>{filtCant}</span>}
                        {filtEnc  && <span style={{background:`${AZUL}12`,color:AZUL,border:`1px solid ${AZUL}25`,borderRadius:99,fontSize:'0.65rem',fontWeight:600,padding:'2px 8px',fontFamily:FONT}}>{encC.find(e=>e._id===filtEnc)?.titulo?.slice(0,40)||filtEnc}</span>}
                        <span style={{fontSize:'0.64rem',color:'#6b7280',fontFamily:FONT}}>· {porEmpresa.length} empresa{porEmpresa.length!==1?'s':''}</span>
                    </div>
                )}
            </div>

            {/* Tarjetas por empresa */}
            {porEmpresa.length === 0 ? (
                <div style={{padding:'40px',background:'white',borderRadius:10,border:'1px solid #e5e7eb',textAlign:'center'}}>
                    <FaBuilding style={{color:'#cbd5e1',fontSize:'2.2rem',marginBottom:10}}/>
                    <p style={{margin:'0 0 6px',fontSize:'0.84rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT}}>
                        {respuestasRaw.length===0 ? 'Aún no hay respuestas de empleadores' : 'Sin resultados con esos filtros'}
                    </p>
                    <p style={{margin:0,fontSize:'0.70rem',color:'#cbd5e1',fontFamily:FONT}}>
                        {respuestasRaw.length===0 ? 'Las respuestas aparecerán aquí cuando los empleadores completen las encuestas.' : 'Prueba ajustando o limpiando los filtros.'}
                    </p>
                </div>
            ) : (
                <>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14,marginBottom:16}}>
                        {slice.map((grupo, i) => {
                            const cc = capColor(grupo.tipoCapital);
                            return (
                                <div key={i} className="teeCard" style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
                                    {/* Header empresa */}
                                    <div style={{padding:'12px 14px',background:`linear-gradient(135deg,${cc}0a,transparent)`,borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'flex-start',gap:10}}>
                                        <div style={{width:38,height:38,borderRadius:9,background:`${cc}15`,border:`1px solid ${cc}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                            <FaBuilding style={{color:cc,fontSize:'0.88rem'}}/>
                                        </div>
                                        <div style={{flex:1,minWidth:0}}>
                                            <div style={{fontSize:'0.82rem',fontWeight:700,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{grupo.nombreEmpresa}</div>
                                            <div style={{display:'flex',gap:5,marginTop:3,flexWrap:'wrap',alignItems:'center'}}>
                                                {grupo.provincia && <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT,display:'flex',alignItems:'center',gap:3}}><FaMapMarkerAlt style={{fontSize:'0.52rem'}}/>{[grupo.provincia,grupo.ciudad].filter(Boolean).join(' › ')}</span>}
                                            </div>
                                        </div>
                                        <div style={{display:'flex',flexDirection:'column',gap:3,alignItems:'flex-end',flexShrink:0}}>
                                            {grupo.tipoCapital && <span style={{fontSize:'0.58rem',fontWeight:700,color:cc,background:`${cc}12`,borderRadius:99,padding:'2px 6px',fontFamily:FONT,whiteSpace:'nowrap'}}>{grupo.tipoCapital}</span>}
                                            <span style={{fontSize:'0.60rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,borderRadius:99,padding:'2px 6px',fontFamily:FONT}}>{grupo.respuestas.length} resp.</span>
                                        </div>
                                    </div>

                                    {/* Respuestas individuales */}
                                    <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:8}}>
                                        {grupo.respuestas.map((r, j) => {
                                            const de = r.datosEncuestado || {};
                                            const encTitulo = encC.find(e=>e._id===r.encuestaId)?.titulo || r.encuestaTitulo || 'Encuesta sin título';
                                            return (
                                                <div key={j} style={{padding:'9px 11px',background:j%2===0?'#f8fafc':'#f0fdf4',borderRadius:8,border:`1px solid ${j%2===0?'#f1f5f9':'#dcfce7'}`}}>
                                                    {/* Quién respondió */}
                                                    <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:6}}>
                                                        <div style={{width:26,height:26,borderRadius:7,background:`${VERDE}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                                            <FaUserTie style={{color:VERDE,fontSize:'0.60rem'}}/>
                                                        </div>
                                                        <div style={{flex:1,minWidth:0}}>
                                                            <div style={{fontSize:'0.74rem',fontWeight:700,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                                                {de.nombresApellidos || 'Encuestado sin nombre'}
                                                            </div>
                                                            <div style={{display:'flex',gap:6,marginTop:2,flexWrap:'wrap'}}>
                                                                {de.cargo && <span style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT,fontWeight:500}}>{de.cargo}</span>}
                                                                {de.cargo && de.profesion && <span style={{fontSize:'0.56rem',color:'#d1d5db'}}>·</span>}
                                                                {de.profesion && <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>{de.profesion}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Qué encuesta respondió */}
                                                    <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 8px',background:`${AZUL}08`,borderRadius:6,border:`1px solid ${AZUL}15`}}>
                                                        <FaClipboardList style={{color:AZUL,fontSize:'0.58rem',flexShrink:0}}/>
                                                        <div style={{flex:1,minWidth:0}}>
                                                            <div style={{fontSize:'0.64rem',color:'#64748b',fontFamily:FONT,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                                                {encTitulo}
                                                            </div>
                                                        </div>
                                                        {r.fechaRespuesta && (
                                                            <span style={{fontSize:'0.56rem',color:'#94a3b8',fontFamily:FONT,flexShrink:0,whiteSpace:'nowrap'}}>
                                                                {fmt(r.fechaRespuesta)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Info adicional del encuestado */}
                                                    {(de.aniosServicio || de.email || de.estudiosEspoch) && (
                                                        <div style={{display:'flex',gap:8,marginTop:5,flexWrap:'wrap'}}>
                                                            {de.aniosServicio && <span style={{fontSize:'0.58rem',color:'#94a3b8',fontFamily:FONT}}>{de.aniosServicio} años de servicio</span>}
                                                            {de.estudiosEspoch && de.estudiosEspoch !== 'Ninguno' && (
                                                                <span style={{fontSize:'0.58rem',fontWeight:600,color:MORADO,background:`${MORADO}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>Estudios ESPOCH: {de.estudiosEspoch}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Paginación */}
                    {totalPags > 1 && (
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'white',borderRadius:10,border:'1px solid #e5e7eb'}}>
                            <span style={{fontSize:'0.72rem',color:'#6b7280',fontFamily:FONT}}>
                                Mostrando {(pagina-1)*POR_PAG_R3+1}–{Math.min(pagina*POR_PAG_R3,porEmpresa.length)} de {porEmpresa.length} empresa{porEmpresa.length!==1?'s':''}
                            </span>
                            <div style={{display:'flex',gap:4,alignItems:'center'}}>
                                <button className="teePag" disabled={pagina===1} onClick={()=>setPagina(p=>p-1)} style={{width:32,height:32,borderRadius:7,border:'1px solid #e5e7eb',background:'white',color:pagina===1?'#d1d5db':'#374151',cursor:pagina===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',transition:'all .15s'}}>
                                    <FaChevronLeft/>
                                </button>
                                {Array.from({length:Math.min(totalPags,7)},(_,i)=>i+1).map(p => (
                                    <button key={p} className="teePag" onClick={()=>setPagina(p)} style={{width:32,height:32,borderRadius:7,border:`1px solid ${p===pagina?ROJO:'#e5e7eb'}`,background:p===pagina?ROJO:'white',color:p===pagina?'white':'#374151',cursor:'pointer',fontSize:'0.74rem',fontWeight:p===pagina?700:400,fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>{p}</button>
                                ))}
                                <button className="teePag" disabled={pagina===totalPags} onClick={()=>setPagina(p=>p+1)} style={{width:32,height:32,borderRadius:7,border:'1px solid #e5e7eb',background:'white',color:pagina===totalPags?'#d1d5db':'#374151',cursor:pagina===totalPags?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',transition:'all .15s'}}>
                                    <FaChevronRight/>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════
const TabEEmpleadores = () => {
    const [datos,    setDatos]   = useState(null);
    const [cargando, setCargando]= useState(true);
    const [error,    setError]   = useState('');
    const [seccion,  setSeccion] = useState('empresas');
    const [geoData,  setGeoData] = useState({ecuador:null,cantones:null,provincias:null});
    const [geoError, setGeoError]= useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/geo/ecuador.geojson').then(r=>{if(!r.ok)throw 0;return r.json();}),
            fetch('/geo/cantones.geojson').then(r=>{if(!r.ok)throw 0;return r.json();}),
            fetch('/geo/provinciales.geojson').then(r=>{if(!r.ok)throw 0;return r.json();}),
        ]).then(([e,c,p]) => setGeoData({ecuador:e,cantones:c,provincias:p})).catch(() => setGeoError(true));
    }, []);

    const cargar = useCallback(async () => {
        setCargando(true); setError('');
        try {
            const r = await axios.get(`${API}/admin/estadisticas-empleadores`, { headers:hdrs() });
            setDatos(r.data);
        } catch {
            setError('No se pudieron cargar las estadísticas de empleadores.');
        } finally { setCargando(false); }
    }, []);
    useEffect(() => { cargar(); }, [cargar]);

    const opsProv = useMemo(() => datos ? [...new Set(datos.empleadoresRaw.map(e=>e.provincia).filter(Boolean))].sort() : [], [datos]);
    const opsCap  = useMemo(() => datos ? [...new Set(datos.empleadoresRaw.map(e=>e.tipoCapital).filter(Boolean))].sort() : [], [datos]);

    if (cargando) return (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:340}}>
            <div style={{width:32,height:32,border:'3px solid #f1f5f9',borderTop:`3px solid ${ROJO}`,borderRadius:'50%',animation:'teeSpin .8s linear infinite'}}/>
            <p style={{margin:'14px 0 0',fontSize:'0.78rem',color:'#9ca3af',fontFamily:FONT}}>Cargando estadísticas...</p>
        </div>
    );

    if (error) return (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:340}}>
            <FaExclamationTriangle style={{fontSize:'2rem',color:NARANJA,marginBottom:10}}/>
            <p style={{margin:'0 0 14px',fontSize:'0.82rem',color:'#374151',fontFamily:FONT}}>{error}</p>
            <button onClick={cargar} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',background:'white',border:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer',fontSize:'0.74rem',fontWeight:600,color:'#374151',fontFamily:FONT}}>
                <FaSyncAlt style={{fontSize:'0.66rem'}}/>Reintentar
            </button>
        </div>
    );

    if (!datos) return null;

    const { encuestas, empleadoresRaw, respuestasRaw, preguntasAgrupadas, kpis } = datos;

    const tabs = [
        { id:'empresas',  lbl:'Empresas Registradas', icon:FaBuilding,      cnt:empleadoresRaw.length },
        { id:'encuestas', lbl:'Encuestas Realizadas',  icon:FaClipboardList, cnt:encuestas.filter(e=>e.estado==='cerrada').length },
        { id:'respuestas',lbl:'Respuestas por Empresa',icon:FaUsers,         cnt:respuestasRaw.length },
    ];

    return (
        <div style={{fontFamily:FONT,paddingBottom:48}}>
            {/* ── TABS DE NAVEGACIÓN ── */}
            <div style={{display:'flex',gap:6,marginBottom:20,alignItems:'center',borderBottom:'2px solid #f1f5f9',paddingBottom:0}}>
                {tabs.map(({ id, lbl, icon:I, cnt }) => {
                    const act = seccion === id;
                    return (
                        <button key={id} className="teeTab" onClick={() => setSeccion(id)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:'8px 8px 0 0',cursor:'pointer',fontSize:'0.80rem',fontFamily:FONT,border:'none',borderBottom:act?`2px solid ${ROJO}`:'2px solid transparent',background:act?'white':'transparent',color:act?ROJO:'#6b7280',fontWeight:act?700:500,marginBottom:-2,transition:'all .15s'}}>
                            <I style={{fontSize:'0.74rem'}}/>
                            {lbl}
                            <span style={{fontSize:'0.60rem',fontWeight:700,color:act?'white':GRIS,background:act?ROJO:`${GRIS}18`,borderRadius:99,padding:'1px 6px',fontFamily:FONT,minWidth:18,textAlign:'center'}}>{cnt}</span>
                        </button>
                    );
                })}
                <button onClick={cargar} style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'white',border:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer',fontSize:'0.70rem',fontWeight:600,color:'#374151',fontFamily:FONT,transition:'all .15s'}}>
                    <FaSyncAlt style={{fontSize:'0.62rem'}}/>Actualizar
                </button>
            </div>

            {/* ── CONTENIDO POR SECCIÓN ── */}
            {seccion === 'empresas' && (
                <SeccionEmpresas
                    empleadoresRaw={empleadoresRaw}
                    opsProv={opsProv}
                    opsCap={opsCap}
                />
            )}

            {seccion === 'encuestas' && (
                <SeccionEncuestas
                    encuestas={encuestas}
                    empleadoresRaw={empleadoresRaw}
                    respuestasRaw={respuestasRaw}
                    preguntasAgrupadas={preguntasAgrupadas}
                    kpis={kpis}
                />
            )}

            {seccion === 'respuestas' && (
                <SeccionRespuestas
                    respuestasRaw={respuestasRaw}
                    empleadoresRaw={empleadoresRaw}
                    encuestas={encuestas}
                    opsProv={opsProv}
                />
            )}
        </div>
    );
};

export default TabEEmpleadores;