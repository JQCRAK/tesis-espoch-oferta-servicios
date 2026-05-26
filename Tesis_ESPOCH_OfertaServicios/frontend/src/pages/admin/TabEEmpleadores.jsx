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
} from 'react-icons/fa';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const ROJO='#BE1E2D',AZUL='#1565C0',VERDE='#2E7D32',NARANJA='#E65100',MORADO='#4527A0',CIAN='#00695C',GRIS='#37474F',DORADO='#F57F17';
const PALETA=[ROJO,AZUL,VERDE,NARANJA,MORADO,CIAN,GRIS,DORADO,'#AD1457','#00838F','#558B2F','#4E342E'];
const PALETA_LIGHT=['#f7c5c9','#b3c9f0','#b2dfb4','#f9cba8','#c5bce8','#a8d5cc','#b0bec5','#fde68a','#f4b8d1','#a8d8db','#c8dba6','#c8b5b0'];
import { leerSesion } from '../../utils/storageSeguro';

const hdrs = () => {
    const usuario = leerSesion('usuario');
    const t = usuario ? usuario.token : '';
    return { Authorization: `Bearer ${t}` };
};
const norm=s=>s?.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim()??'';
const pct=(v,t)=>t===0?0:Math.round((v/t)*100);
const fmt=d=>d?new Date(d).toLocaleDateString('es-EC',{day:'2-digit',month:'short',year:'numeric'}):'—';
const EC=[[-4.80,-80.50],[1.20,-75.80]];
const CANTON_ALIAS={'banos':'banos de agua santa','lago agrio':'nueva loja','san miguel de riobamba':'riobamba'};
const normCanton=n=>{const k=norm(n);return CANTON_ALIAS[k]||k;};

if(typeof document!=='undefined'&&!document.getElementById('tee5-kf')){
    const st=document.createElement('style');st.id='tee5-kf';
    st.textContent=`
        @keyframes t5spin{to{transform:rotate(360deg);}}
        @keyframes t5in{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .t5a{animation:t5in 0.28s ease both;}
        .t5r:hover{background:#f8fafc !important;}
        .t5sel{padding:5px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:0.73rem;font-family:'Segoe UI',system-ui,sans-serif;color:#374151;background:white;outline:none;cursor:pointer;}
        .t5sel:focus,.t5sel.on{border-color:#BE1E2D !important;}
        .t5pag:hover:not(:disabled){background:#BE1E2D !important;color:white !important;border-color:#BE1E2D !important;}
        .t5tab:hover{background:#f1f5f9 !important;}
        .t5gh:hover{background:#f8fafc !important;cursor:pointer;}
        .leaflet-container{font-family:'Segoe UI',system-ui,sans-serif !important;}
        .leaflet-tooltip{font-family:'Segoe UI',system-ui,sans-serif !important;border-radius:6px !important;border:1px solid #e2e8f0 !important;box-shadow:0 4px 12px rgba(0,0,0,.15) !important;padding:8px 12px !important;font-size:.78rem !important;color:#0f172a !important;background:white !important;}
        .leaflet-tooltip::before{display:none !important;}
        .leaflet-control-zoom{border:1px solid #e2e8f0 !important;border-radius:8px !important;overflow:hidden !important;}
        .leaflet-control-zoom a{color:#374151 !important;width:32px !important;height:32px !important;line-height:32px !important;background:white !important;}
        .leaflet-control-zoom a:hover{background:#f8fafc !important;color:#BE1E2D !important;}
        .leaflet-control-attribution{font-size:.58rem !important;}
    `;
    document.head.appendChild(st);
}

// ═══════════════════════════════════════════════════════════
// NLP FRONTEND — análisis de texto libre
// ═══════════════════════════════════════════════════════════
const STOPWORDS_ES=new Set(['el','la','los','las','un','una','unos','unas','de','del','en','que','y','a','al','se','es','por','con','para','su','sus','lo','le','les','me','mi','mas','si','pero','no','ya','o','como','hay','muy','ser','son','fue','han','has','era','esto','esta','este','estos','estas','son','ser','tener','tiene','tienen','tuvo','que','cual','quien','cuando','donde','como','porque','aunque','sino','pues','entonces','tambien','ademas','asi','bien','mejor','mayor','menor','todo','todos','toda','todas','cada','otro','otros','otra','otras','mismo','misma','mismos','mismas','puede','pueden','debe','deben','hacer','hace','hacen','tener','tiene','tienen','haber','hay','esta','estan','ser','somos','son','fue','fueron','seria','seran','nos','nuestro','nuestra','nuestros','nuestras','vuestro','su','sus','mi','mis','tu','tus','su','entre','sobre','bajo','ante','tras','durante','mediante','segun','sin','sobre','tras','con','mas','menos','muy','bien','mal','tanto','poco','mucho','algo','nada','alguien','nadie','alguno','ninguno','primer','segundo','tercer','primer','nueva','nuevo','nuevos','nuevas']);

function analizarTexto(textos){
    if(!textos?.length) return {palabras:[],temas:[],frases:[]};
    const freq={};
    const bigrams={};
    const oracionesLimpias=[];

    textos.forEach(t=>{
        if(!t||typeof t!=='string') return;
        const limpio=t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
        if(!limpio) return;
        oracionesLimpias.push(limpio);
        const words=limpio.split(' ').filter(w=>w.length>3&&!STOPWORDS_ES.has(w));
        words.forEach(w=>{freq[w]=(freq[w]||0)+1;});
        for(let i=0;i<words.length-1;i++){
            const bg=`${words[i]} ${words[i+1]}`;
            bigrams[bg]=(bigrams[bg]||0)+1;
        }
    });

    const palabras=Object.entries(freq).filter(([,v])=>v>=1).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([w,c])=>({word:w,count:c}));
    const frasesFrecuentes=Object.entries(bigrams).filter(([,v])=>v>=2).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([bg,c])=>({frase:bg,count:c}));

    // Categorizar en temas comunes
    const TEMAS={
        'Habilidades técnicas':['programacion','lenguajes','frameworks','tecnologias','herramientas','software','desarrollo','codigo','bases','datos','sistemas','redes','seguridad','cloud','web','movil','algoritmos','estructuras'],
        'Habilidades blandas':['comunicacion','trabajo','equipo','liderazgo','gestion','proyectos','tiempo','organizacion','adaptacion','creatividad','proactividad','responsabilidad','etica','profesionalismo','colaboracion'],
        'Inglés / Idiomas':['ingles','idiomas','lenguaje','certificaciones','internacional','bilingue'],
        'Experiencia práctica':['practica','proyectos','reales','empresas','pasantias','experiencia','aplicacion','industria','casos','problemas'],
        'Formación continua':['certificaciones','cursos','actualizacion','capacitacion','especializacion','maestria','posgrado','aprendizaje','continuo'],
        'Emprendimiento':['emprendimiento','negocios','innovacion','startup','empresa','gestion','administracion','finanzas','marketing'],
    };
    const temaConteo={};
    Object.entries(TEMAS).forEach(([tema,kws])=>{
        let cnt=0;
        kws.forEach(kw=>{cnt+=(freq[kw]||0);});
        if(cnt>0) temaConteo[tema]=cnt;
    });
    const temas=Object.entries(temaConteo).sort((a,b)=>b[1]-a[1]).map(([tema,count],i)=>({tema,count,color:PALETA[i%PALETA.length]}));

    return {palabras,temas,frases:frasesFrecuentes,total:textos.length};
}

// ═══════════════════════════════════════════════════════════
// COMPONENTES BASE
// ═══════════════════════════════════════════════════════════
const KPI=({icon:I,valor,label,sub,color,delay=0})=>(
    <div className="t5a" style={{background:'white',borderRadius:10,padding:'10px 13px',border:'1px solid #e5e7eb',borderLeft:`4px solid ${color}`,boxShadow:'0 1px 3px rgba(0,0,0,.05)',display:'flex',alignItems:'center',gap:10,animationDelay:`${delay}ms`}}>
        <div style={{width:32,height:32,borderRadius:8,background:`${color}14`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><I style={{color,fontSize:'0.84rem'}}/></div>
        <div>
            <div style={{fontSize:'1.25rem',fontWeight:800,color:'#0f172a',lineHeight:1,fontFamily:FONT}}>{valor}</div>
            <div style={{fontSize:'0.63rem',fontWeight:600,color:'#6b7280',fontFamily:FONT,marginTop:2}}>{label}</div>
            {sub&&<div style={{fontSize:'0.57rem',color:'#9ca3af',fontFamily:FONT,marginTop:1}}>{sub}</div>}
        </div>
    </div>
);

const Panel=({titulo,sub,icon:I,color,children,delay=0,style={}})=>(
    <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',boxShadow:'0 1px 3px rgba(0,0,0,.05)',overflow:'hidden',animationDelay:`${delay}ms`,...style}}>
        <div style={{padding:'9px 14px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${color}08,transparent)`,display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:26,height:26,borderRadius:6,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><I style={{color,fontSize:'0.74rem'}}/></div>
            <div>
                <div style={{fontSize:'0.80rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>{titulo}</div>
                {sub&&<div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>{sub}</div>}
            </div>
        </div>
        <div style={{padding:'12px 14px'}}>{children}</div>
    </div>
);

const Barra=({label,valor,total,color,compact=false})=>{
    const p=pct(valor,total);
    return <div style={{marginBottom:compact?5:8}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2,alignItems:'baseline'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
                <div style={{width:7,height:7,borderRadius:'50%',backgroundColor:color,flexShrink:0}}/>
                <span style={{fontSize:compact?'0.70rem':'0.73rem',color:'#374151',fontFamily:FONT,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
            </div>
            <span style={{fontSize:'0.67rem',color:'#6b7280',fontFamily:FONT,whiteSpace:'nowrap',marginLeft:6}}><strong style={{color:'#111827'}}>{valor}</strong><span style={{color:'#d1d5db',margin:'0 2px'}}>·</span>{p}%</span>
        </div>
        <div style={{height:compact?4:6,backgroundColor:'#f1f5f9',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${p}%`,backgroundColor:color,borderRadius:99,transition:'width .7s cubic-bezier(.4,0,.2,1)'}}/>
        </div>
    </div>;
};

const Donut=({segs,r=40,g=11,sz=96,label,sublabel})=>{
    const cx=sz/2,cy=sz/2,circ=2*Math.PI*r;
    const tot=segs.reduce((a,s)=>a+(s.v||0),0);
    if(!tot) return <svg width={sz} height={sz}><circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={g}/></svg>;
    let off=0;
    return <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={g}/>
            {segs.map((s,i)=>{const da=((s.v||0)/tot)*circ;const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth={g} strokeDasharray={`${da} ${circ}`} strokeDashoffset={-off} strokeLinecap="butt"/>;off+=da;return el;})}
        </svg>
        {label&&<div style={{position:'absolute',textAlign:'center',pointerEvents:'none'}}>
            <div style={{fontSize:sz>100?'1.1rem':'0.85rem',fontWeight:800,color:'#111827',lineHeight:1,fontFamily:FONT}}>{label}</div>
            {sublabel&&<div style={{fontSize:'0.54rem',color:'#9ca3af',fontFamily:FONT,marginTop:1}}>{sublabel}</div>}
        </div>}
    </div>;
};

const Insight=({tipo,titulo,detalle,delay=0})=>{
    const cfg={
        ok:{I:FaCheckCircle,color:VERDE,bg:'#f0fdf4',bd:'#bbf7d0',lbl:'Fortaleza'},
        warn:{I:FaExclamationTriangle,color:NARANJA,bg:'#fff7ed',bd:'#fed7aa',lbl:'Atención'},
        crit:{I:FaTimesCircle,color:ROJO,bg:'#fef2f2',bd:'#fecaca',lbl:'Crítico'},
        info:{I:FaLightbulb,color:AZUL,bg:'#eff6ff',bd:'#bfdbfe',lbl:'Sugerencia'},
    }[tipo]||{I:FaLightbulb,color:AZUL,bg:'#eff6ff',bd:'#bfdbfe',lbl:'Info'};
    const {I}=cfg;
    return <div className="t5a" style={{background:cfg.bg,border:`1px solid ${cfg.bd}`,borderLeft:`3px solid ${cfg.color}`,borderRadius:7,padding:'8px 11px',display:'flex',gap:8,alignItems:'flex-start',animationDelay:`${delay}ms`}}>
        <I style={{color:cfg.color,fontSize:'0.82rem',flexShrink:0,marginTop:1}}/>
        <div>
            <span style={{fontSize:'0.58rem',fontWeight:700,color:cfg.color,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:FONT}}>{cfg.lbl} · </span>
            <span style={{fontSize:'0.76rem',fontWeight:600,color:'#0f172a',fontFamily:FONT}}>{titulo}</span>
            {detalle&&<p style={{margin:'2px 0 0',fontSize:'0.68rem',color:'#6b7280',fontFamily:FONT,lineHeight:1.5}}>{detalle}</p>}
        </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════
// GRÁFICA DE TEXTO LIBRE — NLP
// ═══════════════════════════════════════════════════════════
const GraficaTextoNLP=({resps,pregunta})=>{
    const textos=useMemo(()=>resps.map(r=>r.valor).filter(v=>v&&String(v).trim().length>2),[resps]);
    const {palabras,temas,frases,total}=useMemo(()=>analizarTexto(textos),[textos]);

    if(!total) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;

    const maxFreq=palabras[0]?.count||1;

    return <div>
        {/* Header de análisis */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:`${AZUL}08`,border:`1px solid ${AZUL}20`,borderRadius:8,marginBottom:12}}>
            <FaCommentDots style={{color:AZUL,fontSize:'0.78rem',flexShrink:0}}/>
            <div>
                <div style={{fontSize:'0.72rem',fontWeight:700,color:AZUL,fontFamily:FONT}}>Análisis de {total} respuesta{total!==1?'s':''}</div>
                <div style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT}}>Detección automática de patrones y palabras clave</div>
            </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {/* Nube de palabras visual */}
            <div>
                <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Palabras más frecuentes</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,alignItems:'center',minHeight:80}}>
                    {palabras.slice(0,20).map((p,i)=>{
                        const size=0.62+((p.count/maxFreq)*0.55);
                        const opacidad=0.45+((p.count/maxFreq)*0.55);
                        const color=PALETA[i%PALETA.length];
                        return <span key={i} style={{
                            fontSize:`${size}rem`,fontWeight:p.count===maxFreq?800:p.count>=maxFreq*0.6?700:600,
                            color,opacity:opacidad,fontFamily:FONT,
                            padding:'2px 6px',borderRadius:99,
                            background:`${color}12`,border:`1px solid ${color}22`,
                            cursor:'default',transition:'opacity .2s',
                            lineHeight:1.4,
                        }} title={`${p.word}: ${p.count} vez${p.count!==1?'es':''}`}>{p.word}</span>;
                    })}
                </div>
                {frases.length>0&&<div style={{marginTop:12}}>
                    <p style={{margin:'0 0 6px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Frases recurrentes</p>
                    {frases.slice(0,5).map((f,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,padding:'4px 8px',background:i%2===0?'#f8fafc':'white',borderRadius:5}}>
                        <FaTag style={{color:PALETA[i%PALETA.length],fontSize:'0.55rem',flexShrink:0}}/>
                        <span style={{fontSize:'0.70rem',color:'#374151',flex:1,fontFamily:FONT,textTransform:'capitalize'}}>{f.frase}</span>
                        <span style={{fontSize:'0.62rem',fontWeight:700,color:PALETA[i%PALETA.length],background:`${PALETA[i%PALETA.length]}12`,borderRadius:99,padding:'1px 6px',fontFamily:FONT}}>{f.count}×</span>
                    </div>)}
                </div>}
            </div>

            {/* Temas detectados */}
            <div>
                <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Temas identificados</p>
                {temas.length>0
                    ?<>
                        {temas.map((t,i)=><Barra key={i} label={t.tema} valor={t.count} total={palabras.reduce((s,p)=>s+p.count,1)} color={t.color} compact/>)}
                        <div style={{marginTop:10,padding:'8px 10px',background:`${VERDE}08`,border:`1px solid ${VERDE}20`,borderRadius:7}}>
                            <p style={{margin:0,fontSize:'0.64rem',color:'#14532d',fontFamily:FONT,lineHeight:1.55}}>
                                <strong>Patrón principal:</strong> "{temas[0]?.tema}" — la mayoría de respuestas converge en este tema. Se recomienda fortalecer esta área en el plan de estudios.
                            </p>
                        </div>
                    </>
                    :<p style={{margin:0,fontSize:'0.68rem',color:'#9ca3af',fontFamily:FONT}}>No se detectaron temas con suficiente frecuencia.</p>
                }

                {/* Top palabras en barra */}
                {palabras.length>0&&<div style={{marginTop:12}}>
                    <p style={{margin:'0 0 6px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Top 8 términos</p>
                    {palabras.slice(0,8).map((p,i)=><Barra key={i} label={p.word} valor={p.count} total={maxFreq} color={PALETA[i%PALETA.length]} compact/>)}
                </div>}
            </div>
        </div>

        {/* Muestra de respuestas representativas */}
        <div style={{marginTop:14,borderTop:'1px solid #f1f5f9',paddingTop:12}}>
            <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Muestra de respuestas</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {textos.filter(t=>t.length>20).slice(0,4).map((t,i)=><div key={i} style={{padding:'7px 10px',background:i%2===0?'#f8fafc':'#fff7f7',borderRadius:7,border:'1px solid #e5e7eb',fontSize:'0.69rem',color:'#374151',fontFamily:FONT,lineHeight:1.55,fontStyle:'italic'}}>
                    "{t.slice(0,120)}{t.length>120?'...':''}"
                </div>)}
            </div>
        </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════
// RESTO DE GRÁFICAS
// ═══════════════════════════════════════════════════════════
const GEscala=({resps,min,max})=>{
    const vals=resps.map(r=>Number(r.valor)).filter(v=>v>=1&&v<=5);
    if(!vals.length) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const c={1:0,2:0,3:0,4:0,5:0};vals.forEach(v=>c[v]++);
    const mx=Math.max(...Object.values(c),1);
    const prom=(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2);
    const col={1:'#ef4444',2:'#f97316',3:'#eab308',4:'#22c55e',5:'#16a34a'};
    return <div>
        <div style={{display:'flex',gap:6,alignItems:'flex-end',marginBottom:10}}>
            {[1,2,3,4,5].map(n=>{const h=Math.max(4,Math.round((c[n]/mx)*64));return <div key={n} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <span style={{fontSize:'0.60rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>{c[n]}</span>
                <div style={{width:'100%',height:h,backgroundColor:col[n],borderRadius:'3px 3px 0 0'}}/>
                <span style={{fontSize:'0.62rem',fontWeight:700,color:col[n],fontFamily:FONT}}>{n}</span>
            </div>;})}
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
    </div>;
};

const GOpciones=({resps,tipo})=>{
    const total=resps.length;
    if(!total) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const c={};
    resps.forEach(r=>{const v=r.valor;if(Array.isArray(v))v.forEach(x=>{c[x]=(c[x]||0)+1;});else if(v)c[v]=(c[v]||0)+1;});
    const lista=Object.entries(c).sort((a,b)=>b[1]-a[1]);
    return <div>{lista.map(([op,cnt],i)=><Barra key={i} label={op} valor={cnt} total={total} color={PALETA[i%PALETA.length]} compact/>)}<div style={{marginTop:6,fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>{total} respuesta{total!==1?'s':''}{tipo==='checkboxes'?' (múltiple)':''}</div></div>;
};

const GSiNo=({resps})=>{
    const total=resps.length;
    if(!total) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const si=resps.filter(r=>r.valor==='Sí').length,no=resps.filter(r=>r.valor==='No').length;
    return <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <Donut segs={[{v:si,c:VERDE},{v:no,c:ROJO}]} r={34} g={10} sz={84} label={`${pct(si,total)}%`} sublabel="Sí"/>
        <div style={{flex:1}}>
            {[[VERDE,'Sí',si],[ROJO,'No',no]].map(([c,l,v])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0}}/>
                    <span style={{fontSize:'0.72rem',color:'#374151',flex:1,fontFamily:FONT}}>{l}</span>
                    <span style={{fontSize:'0.72rem',fontWeight:700,color:c,fontFamily:FONT}}>{v}</span>
                    <span style={{fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>({pct(v,total)}%)</span>
                </div>
            ))}
            <div style={{fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT,marginTop:4}}>{total} respuestas</div>
        </div>
    </div>;
};

const GNumero=({resps})=>{
    const vals=resps.map(r=>Number(r.valor)).filter(v=>!isNaN(v)&&v>=0);
    if(!vals.length) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const avg=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
    return <div style={{display:'flex',gap:10}}>
        {[['Promedio',avg,AZUL],['Mínimo',Math.min(...vals),VERDE],['Máximo',Math.max(...vals),ROJO],['N',vals.length,GRIS]].map(([l,v,c])=>(
            <div key={l} style={{flex:1,textAlign:'center',padding:8,background:`${c}08`,border:`1px solid ${c}20`,borderRadius:8}}>
                <div style={{fontSize:'1.1rem',fontWeight:800,color:c,fontFamily:FONT}}>{v}</div>
                <div style={{fontSize:'0.60rem',color:'#6b7280',fontFamily:FONT}}>{l}</div>
            </div>
        ))}
    </div>;
};

const GMatriz=({resps,items,tipo,min,max})=>{
    if(!resps.length||!items?.length) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const pi={};items.forEach((_,idx)=>{pi[idx]={votos:{}};});
    resps.forEach(r=>{const arr=Array.isArray(r.valor)?r.valor:[];arr.forEach(({indice,valor})=>{if(pi[indice]!==undefined){const k=String(valor);pi[indice].votos[k]=(pi[indice].votos[k]||0)+1;}});});
    const cols=tipo==='escala'?[1,2,3,4,5]:[];
    const cH={1:'#fee2e2',2:'#fef3c7',3:'#fef9c3',4:'#dcfce7',5:'#bbf7d0'};
    return <div style={{overflowX:'auto'}}>
        {tipo==='escala'&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:'0.58rem',color:'#94a3b8',fontFamily:FONT}}>{min||'1=Bajo'}</span><span style={{fontSize:'0.58rem',color:'#94a3b8',fontFamily:FONT}}>{max||'5=Alto'}</span></div>}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.70rem',fontFamily:FONT}}>
            <thead><tr>
                <th style={{textAlign:'left',padding:'4px 8px',color:'#94a3b8',fontWeight:700,fontSize:'0.60rem',borderBottom:'1px solid #e5e7eb',width:'40%'}}>Ítem</th>
                {cols.map(c=><th key={c} style={{textAlign:'center',padding:'4px 4px',color:'#6b7280',fontWeight:700,fontSize:'0.60rem',borderBottom:'1px solid #e5e7eb',minWidth:36}}>{c}</th>)}
                <th style={{textAlign:'center',padding:'4px 6px',color:'#94a3b8',fontWeight:700,fontSize:'0.60rem',borderBottom:'1px solid #e5e7eb'}}>Prom.</th>
            </tr></thead>
            <tbody>
                {items.map((item,idx)=>{
                    const vo=pi[idx]?.votos||{};
                    const totI=Object.values(vo).reduce((a,b)=>a+b,0);
                    const prom=totI>0?(cols.reduce((s,c)=>s+(c*(vo[c]||0)),0)/totI).toFixed(1):'—';
                    return <tr key={idx} style={{background:idx%2===0?'#fafafa':'white'}}>
                        <td style={{padding:'6px 8px',color:'#374151',lineHeight:1.4,fontWeight:500}}>{item}</td>
                        {cols.map(c=>{const v=vo[c]||0;return <td key={c} style={{textAlign:'center',padding:'6px 4px',background:v>0?cH[c]:'transparent',fontWeight:v>0?700:400,color:v>0?'#374151':'#d1d5db'}}>{v>0?v:'·'}</td>;})}
                        <td style={{textAlign:'center',padding:'6px 6px',fontWeight:700,color:AZUL}}>{prom}</td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;
};

const GraficaPregunta=({grupo,filtros})=>{
    const resps=useMemo(()=>{
        let r=grupo.respuestasRaw||[];
        if(filtros.encuestaId) r=r.filter(x=>x.encuestaId===filtros.encuestaId);
        if(filtros.tipoCapital) r=r.filter(x=>x.tipoCapital===filtros.tipoCapital);
        return r;
    },[grupo.respuestasRaw,filtros]);
    if(grupo.esMatriz) return <GMatriz resps={resps} items={grupo.items} tipo={grupo.tipo} min={grupo.etiquetaMin} max={grupo.etiquetaMax}/>;
    switch(grupo.tipo){
        case 'escala': return <GEscala resps={resps} min={grupo.etiquetaMin} max={grupo.etiquetaMax}/>;
        case 'opcion_multiple': case 'checkboxes': return <GOpciones resps={resps} tipo={grupo.tipo}/>;
        case 'si_no': return <GSiNo resps={resps}/>;
        case 'texto_libre': return <GraficaTextoNLP resps={resps} pregunta={grupo.textoCanonical}/>;
        case 'numero': return <GNumero resps={resps}/>;
        default: return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Tipo no visualizable</p>;
    }
};

const TipoBadge=({tipo,esMatriz})=>{
    const cfg={escala:{lbl:'Escala',c:AZUL},opcion_multiple:{lbl:'Opción',c:VERDE},checkboxes:{lbl:'Múltiple',c:CIAN},si_no:{lbl:'Sí/No',c:NARANJA},texto_libre:{lbl:'Texto · NLP',c:MORADO},numero:{lbl:'Número',c:DORADO}}[tipo]||{lbl:tipo,c:GRIS};
    return <span style={{fontSize:'0.58rem',fontWeight:700,color:cfg.c,background:`${cfg.c}12`,border:`1px solid ${cfg.c}25`,borderRadius:99,padding:'2px 7px',fontFamily:FONT,whiteSpace:'nowrap'}}>{esMatriz?`${cfg.lbl} · Tabla`:cfg.lbl}</span>;
};

const TarjetaGrupo=({grupo,encuestas,filtros,num})=>{
    const [open,setOpen]=useState(true);
    const aparece=encuestas.filter(e=>grupo.encuestasAparece.includes(e._id)).map(e=>e.titulo);
    const cnt=useMemo(()=>{
        let r=grupo.respuestasRaw||[];
        if(filtros.encuestaId) r=r.filter(x=>x.encuestaId===filtros.encuestaId);
        if(filtros.tipoCapital) r=r.filter(x=>x.tipoCapital===filtros.tipoCapital);
        return r.length;
    },[grupo.respuestasRaw,filtros]);
    return <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:10}}>
        <div className="t5gh" onClick={()=>setOpen(a=>!a)} style={{padding:'10px 14px',display:'flex',alignItems:'flex-start',gap:10,background:open?`${ROJO}04`:'white',borderBottom:open?'1px solid #f1f5f9':'none'}}>
            <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                <span style={{fontSize:'0.60rem',fontWeight:800,color:ROJO,fontFamily:FONT}}>{num}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.79rem',fontWeight:600,color:'#0f172a',fontFamily:FONT,flex:1,lineHeight:1.4}}>{grupo.textoCanonical}</span>
                    <div style={{display:'flex',gap:5,flexShrink:0,flexWrap:'wrap'}}>
                        <TipoBadge tipo={grupo.tipo} esMatriz={grupo.esMatriz}/>
                        {grupo.esComun&&<span style={{fontSize:'0.58rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,border:`1px solid ${VERDE}25`,borderRadius:99,padding:'2px 7px',fontFamily:FONT}}>Recurrente</span>}
                    </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>{cnt} respuesta{cnt!==1?'s':''}</span>
                    {aparece.length>0&&<span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>· {aparece.slice(0,2).join(', ')}{aparece.length>2?` +${aparece.length-2}`:''}</span>}
                </div>
            </div>
            <div style={{fontSize:'0.68rem',color:'#94a3b8',flexShrink:0,padding:'2px 5px',fontFamily:FONT}}>{open?'▲':'▼'}</div>
        </div>
        {open&&<div style={{padding:'12px 14px'}}><GraficaPregunta grupo={grupo} filtros={filtros}/></div>}
    </div>;
};

// ═══════════════════════════════════════════════════════════
// MAPA
// ═══════════════════════════════════════════════════════════
const BOUNDS_PROV={'azuay':[[-3.35,-79.40],[-2.38,-78.55]],'bolivar':[[-1.95,-79.38],[-1.20,-78.60]],'canar':[[-3.10,-79.40],[-2.10,-78.60]],'carchi':[[0.30,-78.35],[0.92,-77.60]],'chimborazo':[[-2.30,-79.10],[-1.25,-78.20]],'cotopaxi':[[-1.50,-79.18],[-0.35,-78.30]],'el oro':[[-3.80,-80.35],[-2.95,-79.55]],'esmeraldas':[[0.50,-80.30],[1.45,-78.85]],'guayas':[[-3.15,-80.35],[-1.55,-79.20]],'imbabura':[[0.10,-78.75],[0.65,-77.80]],'loja':[[-4.70,-80.25],[-3.30,-78.85]],'los rios':[[-1.80,-79.90],[-0.65,-79.20]],'manabi':[[-1.90,-80.90],[-0.05,-79.70]],'morona santiago':[[-3.90,-78.50],[-1.45,-76.70]],'napo':[[-1.50,-78.30],[-0.30,-76.90]],'orellana':[[-1.30,-77.50],[0.50,-75.20]],'pastaza':[[-2.70,-78.20],[-1.00,-75.80]],'pichincha':[[-0.65,-79.10],[0.20,-78.00]],'santa elena':[[-3.20,-81.10],[-1.80,-80.30]],'santo domingo de los tsachilas':[[-0.65,-79.60],[0.05,-78.90]],'sucumbios':[[-0.35,-77.60],[0.60,-75.20]],'tungurahua':[[-1.60,-78.90],[-1.05,-78.20]],'zamora chinchipe':[[-5.00,-79.40],[-3.30,-77.90]]};
const ZC=({prov})=>{const map=useMap();useEffect(()=>{const b=prov?BOUNDS_PROV[norm(prov)]:null;b?map.fitBounds(b,{padding:[20,20]}):map.fitBounds(EC,{padding:[8,8],maxZoom:8});},[prov]);return null;};

const MapaEmp=({porProv,porCiud,filtros,geoData})=>{
    const lP=useMemo(()=>{const m={};(porProv||[]).forEach((p,i)=>{m[norm(p.provincia)]={total:p.total,color:PALETA[i%PALETA.length],light:PALETA_LIGHT[i%PALETA_LIGHT.length]};});return m;},[porProv]);
    const lC=useMemo(()=>{const m={};(porCiud||[]).forEach(c=>{m[normCanton(c.ciudad)]=c.total;});return m;},[porCiud]);
    const pN=norm(filtros.provincia||''),hayP=!!filtros.provincia;
    const getC=f=>f.properties?.DPA_DESCAN||f.properties?.DPA_CANTON||f.properties?.NAME_2||'';
    const getP=f=>f.properties?.DPA_DESPRO||f.properties?.NAME_1||'';
    const lCR=useRef(lC),eCR=useRef(null);
    useEffect(()=>{lCR.current=lC;},[lC]);
    const estC=useCallback((f)=>{
        const nc=getC(f),np=getP(f),pn=norm(np);
        const g=lC[normCanton(nc)]||lC[norm(nc)]||0,pv=lP[pn];
        if(hayP&&pn!==pN) return {fillColor:'#dde2e8',fillOpacity:0.55,color:'#94a3b8',weight:0.4};
        if(!pv) return {fillColor:'#edf0f4',fillOpacity:0.5,color:'#94a3b8',weight:0.4};
        if(!g) return {fillColor:pv.light,fillOpacity:0.35,color:'#000',weight:0.8};
        return {fillColor:pv.color,fillOpacity:0.80,color:'#000',weight:1.2};
    },[lP,lC,hayP,pN]);
    useEffect(()=>{eCR.current=estC;},[estC]);
    const estP=useCallback((f)=>{const pn=norm(getP(f)),pv=lP[pn];if(hayP&&pn===pN&&pv)return{fillOpacity:0,color:pv.color,weight:3};return{fillOpacity:0,color:pv?'#475569':'#94a3b8',weight:pv?1.8:0.8};},[lP,hayP,pN]);
    const estE=useCallback(()=>({fillColor:'#e2e8f0',fillOpacity:0.08,color:'#64748b',weight:1.5}),[]);
    const onE=useCallback((f,layer)=>{
        const nc=getC(f),np=getP(f);
        layer.on({
            mouseover(e){const g=lCR.current[normCanton(nc)]||lCR.current[norm(nc)]||0;const pv=lP[norm(np)];if(!pv)return;
                layer.bindTooltip(`<div style="font-family:${FONT};min-width:110px"><div style="font-weight:700;font-size:.82rem;color:${pv.color};margin-bottom:3px">${nc}</div><div style="font-size:.74rem;color:#374151">${g>0?`<strong>${g}</strong> empresa${g!==1?'s':''}`:'<span style="color:#9ca3af">Sin empresas</span>'}</div><div style="font-size:.64rem;color:#9ca3af;margin-top:2px">${np}</div></div>`,{direction:'top',opacity:1,sticky:true}).openTooltip(e.latlng);
                e.target.setStyle({fillOpacity:g>0?1:0.5,weight:2.5,color:'#000'});e.target.bringToFront();},
            mouseout(e){layer.unbindTooltip();e.target.setStyle(eCR.current(f));},
        });
    },[lP]);
    const kC=useMemo(()=>`c5-${JSON.stringify(lC)}-${filtros.provincia}-${filtros.ciudad}`,[lC,filtros.provincia,filtros.ciudad]);
    const kP=useMemo(()=>`p5-${JSON.stringify(Object.keys(lP))}-${filtros.provincia}`,[lP,filtros.provincia]);
    if(!porProv?.length||!geoData?.ecuador||!geoData?.cantones||!geoData?.provincias)
        return <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}><FaGlobeAmericas style={{fontSize:'2rem',color:'#94a3b8'}}/><p style={{margin:0,fontSize:'0.80rem',color:'#475569',fontFamily:FONT,fontWeight:700}}>{!geoData?.cantones?'Cargando mapa...':'Sin datos geográficos'}</p></div>;
    return <MapContainer bounds={EC} boundsOptions={{padding:[8,8]}} minZoom={6.4} maxZoom={13} maxBounds={[[-5.5,-82.0],[2.0,-74.5]]} maxBoundsViscosity={0.9} style={{width:'100%',height:'100%',borderRadius:8,zIndex:1}} scrollWheelZoom zoomControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' subdomains="abcd" maxZoom={19}/>
        <GeoJSON key="ec5" data={geoData.ecuador} style={estE}/>
        <GeoJSON key={kC} data={geoData.cantones} style={estC} onEachFeature={onE}/>
        <GeoJSON key={kP} data={geoData.provincias} style={estP}/>
        <ZC prov={filtros.provincia}/>
    </MapContainer>;
};

// ── Columna izquierda: cantones o provincias primera mitad ──
const ColIzq=({filtros,porProv,porCiud,total,mitad})=>{
    const hayP=!!filtros.provincia;
    const lista=hayP?porCiud:porProv.slice(0,mitad);
    const color=hayP?ROJO:CIAN,titulo=hayP?'Cantones':'Provincias',key=hayP?'ciudad':'provincia';
    return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        <div style={{padding:'8px 10px 6px',borderBottom:'1px solid #f1f5f9',background:'#fafafa',display:'flex',alignItems:'center',gap:5}}>
            <FaMapMarkerAlt style={{color,fontSize:'0.60rem'}}/>
            <span style={{fontSize:'0.62rem',fontWeight:700,color:'#475569',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.4px'}}>{titulo}</span>
            {hayP&&<span style={{fontSize:'0.58rem',color:'#94a3b8',fontFamily:FONT}}>· {filtros.provincia}</span>}
            <span style={{fontSize:'0.58rem',fontWeight:700,color,background:`${color}12`,border:`1px solid ${color}25`,borderRadius:99,padding:'0 6px',fontFamily:FONT,marginLeft:'auto'}}>{lista.length}</span>
        </div>
        {lista.length>0&&<div style={{display:'grid',gridTemplateColumns:'10px 1fr 1fr 1fr',gap:6,padding:'4px 10px 4px 8px',borderBottom:'1px solid #e5e7eb'}}>
            <div/><span style={{fontSize:'0.57rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textTransform:'uppercase'}}>{titulo.slice(0,-1)}</span>
            <span style={{fontSize:'0.57rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textAlign:'center'}}>N</span>
            <span style={{fontSize:'0.57rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textAlign:'center'}}>%</span>
        </div>}
        <div style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
            {lista.length===0?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}><span style={{fontSize:'0.68rem',color:'#cbd5e1',fontFamily:FONT}}>—</span></div>
            :lista.map((item,i)=>{const nombre=item[key]||item.ciudad||item.provincia;const ci=PALETA[i%PALETA.length];return <div key={i} className="t5r" style={{display:'grid',gridTemplateColumns:'10px 1fr 1fr 1fr',alignItems:'center',gap:6,padding:'6px 10px 6px 8px',background:i%2===0?'#f8fafc':'transparent',minHeight:32}}>
                <div style={{width:8,height:8,borderRadius:2,backgroundColor:ci,flexShrink:0}}/>
                <span style={{fontSize:'0.70rem',fontWeight:500,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textTransform:'capitalize'}}>{nombre}</span>
                <span style={{fontSize:'0.70rem',fontWeight:700,color:'#0f172a',fontFamily:FONT,textAlign:'center'}}>{item.total}</span>
                <span style={{fontSize:'0.60rem',fontWeight:700,color:ci,background:`${ci}14`,border:`1px solid ${ci}25`,borderRadius:99,padding:'2px 4px',textAlign:'center',fontFamily:FONT,display:'block',margin:'0 auto',width:'fit-content'}}>{pct(item.total,total)}%</span>
            </div>;})}
        </div>
    </div>;
};

// ── Columna derecha: gerentes (siempre) + respondieron si hay prov ──
const POR_PAG_G=6,POR_PAG_R=5;
const ColDer=({filtros,porProv,emps,total,offset,respuestasRaw,encCerradas})=>{
    const [pagG,setPagG]=useState(1);
    const [pagR,setPagR]=useState(1);
    useEffect(()=>{setPagG(1);setPagR(1);},[filtros.provincia,filtros.ciudad]);

    const hayP=!!filtros.provincia;

    if(!hayP){
        // Sin filtro provincia: segunda mitad de provincias
        const lista=porProv.slice(offset);
        return <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
            <div style={{padding:'8px 10px 6px',borderBottom:'1px solid #f1f5f9',background:'#fafafa',display:'flex',alignItems:'center',gap:5}}>
                <FaMapMarkerAlt style={{color:CIAN,fontSize:'0.60rem'}}/>
                <span style={{fontSize:'0.62rem',fontWeight:700,color:'#475569',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.4px'}}>Provincias</span>
                {lista.length>0&&<span style={{fontSize:'0.58rem',fontWeight:700,color:CIAN,background:`${CIAN}12`,border:`1px solid ${CIAN}25`,borderRadius:99,padding:'0 6px',fontFamily:FONT}}>{offset+1}–{offset+lista.length}</span>}
            </div>
            {lista.length>0&&<div style={{display:'grid',gridTemplateColumns:'10px 1fr 1fr 1fr',gap:6,padding:'4px 10px 4px 8px',borderBottom:'1px solid #e5e7eb'}}>
                <div/><span style={{fontSize:'0.57rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textTransform:'uppercase'}}>Provincia</span>
                <span style={{fontSize:'0.57rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textAlign:'center'}}>N</span>
                <span style={{fontSize:'0.57rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textAlign:'center'}}>%</span>
            </div>}
            <div style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
                {lista.length===0?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}><span style={{fontSize:'0.68rem',color:'#cbd5e1',fontFamily:FONT}}>—</span></div>
                :lista.map((p,i)=>{const ri=i+offset,ci=PALETA[ri%PALETA.length];return <div key={i} className="t5r" style={{display:'grid',gridTemplateColumns:'10px 1fr 1fr 1fr',alignItems:'center',gap:6,padding:'6px 10px 6px 8px',background:i%2===0?'#f8fafc':'transparent',minHeight:32}}>
                    <div style={{width:8,height:8,borderRadius:2,backgroundColor:ci,flexShrink:0}}/>
                    <span style={{fontSize:'0.70rem',fontWeight:500,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.provincia}</span>
                    <span style={{fontSize:'0.70rem',fontWeight:700,color:'#0f172a',fontFamily:FONT,textAlign:'center'}}>{p.total}</span>
                    <span style={{fontSize:'0.60rem',fontWeight:700,color:ci,background:`${ci}14`,border:`1px solid ${ci}25`,borderRadius:99,padding:'2px 4px',textAlign:'center',fontFamily:FONT,display:'block',margin:'0 auto',width:'fit-content'}}>{pct(p.total,total)}%</span>
                </div>;})}
            </div>
        </div>;
    }

    // Con filtro provincia: parte superior gerentes, parte inferior quiénes respondieron
    const empsEnProv=emps.filter(e=>norm(e.provincia)===norm(filtros.provincia)&&(!filtros.ciudad||norm(e.ciudad)===norm(filtros.ciudad)));
    const totPagG=Math.ceil(empsEnProv.length/POR_PAG_G);
    const slG=empsEnProv.slice((pagG-1)*POR_PAG_G,pagG*POR_PAG_G);

    // Respondieron: respuestas de empleadores de esta provincia
    const empIdsEnProv=new Set(empsEnProv.map(e=>e._id));
    const respondieronAqui=respuestasRaw.filter(r=>empIdsEnProv.has(r.empleadorId));
    const totPagR=Math.ceil(respondieronAqui.length/POR_PAG_R);
    const slR=respondieronAqui.slice((pagR-1)*POR_PAG_R,pagR*POR_PAG_R);

    return <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        {/* Gerentes */}
        <div style={{padding:'6px 10px 5px',borderBottom:'1px solid #f1f5f9',background:'#fafafa',display:'flex',alignItems:'center',gap:5}}>
            <FaUserTie style={{color:ROJO,fontSize:'0.58rem'}}/>
            <span style={{fontSize:'0.60rem',fontWeight:700,color:'#475569',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.4px'}}>Gerentes</span>
            <span style={{fontSize:'0.56rem',color:'#94a3b8',fontFamily:FONT}}>· {filtros.ciudad||filtros.provincia}</span>
            <span style={{fontSize:'0.56rem',fontWeight:700,color:ROJO,background:`${ROJO}12`,border:`1px solid ${ROJO}25`,borderRadius:99,padding:'0 5px',fontFamily:FONT,marginLeft:'auto'}}>{empsEnProv.length}</span>
        </div>
        <div style={{flex:'0 0 auto',maxHeight:'46%',overflowY:'auto',borderBottom:'2px solid #e5e7eb'}}>
            {slG.length===0?<div style={{padding:'10px',textAlign:'center'}}><span style={{fontSize:'0.65rem',color:'#cbd5e1',fontFamily:FONT}}>Sin empresas aquí</span></div>
            :slG.map((e,i)=><div key={e._id||i} className="t5r" style={{padding:'6px 10px 6px 8px',background:i%2===0?'#fef9f9':'transparent',minHeight:40,borderBottom:'1px solid #f8fafc'}}>
                <div style={{fontSize:'0.71rem',fontWeight:600,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombreGerente}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:1}}>
                    <span style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{e.nombreEmpresa}</span>
                    <span style={{fontSize:'0.52rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,borderRadius:99,padding:'1px 4px',fontFamily:FONT,marginLeft:4,flexShrink:0}}>{e.tipoCapital}</span>
                </div>
            </div>)}
        </div>
        {totPagG>1&&<div style={{padding:'3px 8px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafafa',borderBottom:'1px solid #f1f5f9'}}>
            <span style={{fontSize:'0.56rem',color:'#94a3b8',fontFamily:FONT}}>{(pagG-1)*POR_PAG_G+1}–{Math.min(pagG*POR_PAG_G,empsEnProv.length)} de {empsEnProv.length}</span>
            <div style={{display:'flex',gap:2}}>
                <button className="t5pag" disabled={pagG===1} onClick={()=>setPagG(p=>p-1)} style={{width:18,height:18,borderRadius:4,border:'1px solid #e5e7eb',background:'white',color:pagG===1?'#d1d5db':'#374151',cursor:pagG===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',transition:'all .15s'}}><FaChevronLeft/></button>
                <button className="t5pag" disabled={pagG===totPagG} onClick={()=>setPagG(p=>p+1)} style={{width:18,height:18,borderRadius:4,border:'1px solid #e5e7eb',background:'white',color:pagG===totPagG?'#d1d5db':'#374151',cursor:pagG===totPagG?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',transition:'all .15s'}}><FaChevronRight/></button>
            </div>
        </div>}

        {/* Respondieron */}
        <div style={{padding:'6px 10px 5px',borderBottom:'1px solid #f1f5f9',background:'#f0fdf4',display:'flex',alignItems:'center',gap:5}}>
            <FaCheckCircle style={{color:VERDE,fontSize:'0.58rem'}}/>
            <span style={{fontSize:'0.60rem',fontWeight:700,color:'#475569',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.4px'}}>Respondieron encuesta</span>
            <span style={{fontSize:'0.56rem',fontWeight:700,color:VERDE,background:`${VERDE}12`,border:`1px solid ${VERDE}25`,borderRadius:99,padding:'0 5px',fontFamily:FONT,marginLeft:'auto'}}>{respondieronAqui.length}</span>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
            {respondieronAqui.length===0
                ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60px'}}><span style={{fontSize:'0.65rem',color:'#cbd5e1',fontFamily:FONT}}>Ninguna empresa de aquí respondió</span></div>
                :slR.map((r,i)=>{
                    const encTitulo=encCerradas.find(e=>e._id===r.encuestaId)?.titulo||r.encuestaTitulo||'Encuesta';
                    const de=r.datosEncuestado||{};
                    return <div key={r._id||i} className="t5r" style={{padding:'6px 10px 6px 8px',background:i%2===0?'#f0fdf4':'transparent',minHeight:42,borderBottom:'1px solid #f8fafc'}}>
                        <div style={{fontSize:'0.70rem',fontWeight:600,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.nombreEmpresa}</div>
                        <div style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1}}>{de.nombresApellidos?`${de.nombresApellidos} · `:''}{de.cargo||''}</div>
                        <div style={{fontSize:'0.56rem',color:VERDE,fontFamily:FONT,marginTop:1,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{encTitulo.slice(0,40)}{encTitulo.length>40?'…':''}</div>
                    </div>;
                })
            }
        </div>
        {totPagR>1&&<div style={{padding:'3px 8px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f0fdf4',borderTop:'1px solid #dcfce7',flexShrink:0}}>
            <span style={{fontSize:'0.56rem',color:'#94a3b8',fontFamily:FONT}}>{(pagR-1)*POR_PAG_R+1}–{Math.min(pagR*POR_PAG_R,respondieronAqui.length)} de {respondieronAqui.length}</span>
            <div style={{display:'flex',gap:2}}>
                <button className="t5pag" disabled={pagR===1} onClick={()=>setPagR(p=>p-1)} style={{width:18,height:18,borderRadius:4,border:'1px solid #dcfce7',background:'white',color:pagR===1?'#d1d5db':'#374151',cursor:pagR===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',transition:'all .15s'}}><FaChevronLeft/></button>
                <button className="t5pag" disabled={pagR===totPagR} onClick={()=>setPagR(p=>p+1)} style={{width:18,height:18,borderRadius:4,border:'1px solid #dcfce7',background:'white',color:pagR===totPagR?'#d1d5db':'#374151',cursor:pagR===totPagR?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',transition:'all .15s'}}><FaChevronRight/></button>
            </div>
        </div>}
    </div>;
};

// ═══════════════════════════════════════════════════════════
// INSIGHTS AUTOMÁTICOS
// ═══════════════════════════════════════════════════════════
const calcularInsights=(kpis,comunes,otras,encCerradas)=>{
    const ins=[];
    const{tasa,totalEmps,respondieron}=kpis;
    if(tasa>=80) ins.push({tipo:'ok',titulo:`Alta participación: ${tasa}%`,detalle:`${respondieron} de ${totalEmps} respondieron. Muestra representativa.`});
    else if(tasa>=50) ins.push({tipo:'warn',titulo:`Participación moderada: ${tasa}%`,detalle:`${totalEmps-respondieron} empleadores no respondieron. Considerar reenvío.`});
    else ins.push({tipo:'crit',titulo:`Baja participación: ${tasa}%`,detalle:`Solo ${respondieron} de ${totalEmps} respondieron. Datos pueden no ser representativos.`});
    if(encCerradas.length===0) ins.push({tipo:'warn',titulo:'Sin encuestas cerradas',detalle:'Los análisis aparecerán al cerrar una encuesta activa.'});
    else if(encCerradas.length>=2) ins.push({tipo:'ok',titulo:`${encCerradas.length} encuestas cerradas`,detalle:'Hay datos históricos para comparar tendencias entre períodos.'});
    if(comunes.length>0) ins.push({tipo:'ok',titulo:`${comunes.length} pregunta${comunes.length!==1?'s':''} recurrente${comunes.length!==1?'s':''}`,detalle:'Comparación longitudinal disponible entre encuestas.'});
    const textoGrupos=[...comunes,...otras].filter(g=>g.tipo==='texto_libre');
    if(textoGrupos.length>0) ins.push({tipo:'info',titulo:`${textoGrupos.length} pregunta${textoGrupos.length!==1?'s':''} de texto con análisis NLP`,detalle:'Detección automática de temas, patrones y palabras clave aplicada.'});
    return ins;
};

const calcularPlan=(kpis,encCerradas)=>{
    const plan=[];
    if(kpis.tasa<50) plan.push({prioridad:1,accion:'Reenviar encuesta a empleadores sin respuesta',impacto:'alto',meta:`Alcanzar 70%+ de participación`});
    if(kpis.tasa<70&&kpis.tasa>=50) plan.push({prioridad:2,accion:'Recordatorio por email a empleadores pendientes',impacto:'medio',meta:`${kpis.totalEmps-kpis.respondieron} empleadores por contactar`});
    if(encCerradas.length===0) plan.push({prioridad:3,accion:'Cerrar encuesta activa para habilitar resultados',impacto:'alto',meta:'Los gráficos solo muestran encuestas cerradas'});
    if(encCerradas.length===1) plan.push({prioridad:4,accion:'Reutilizar preguntas en próxima encuesta',impacto:'medio',meta:'Generar datos comparativos longitudinales'});
    return plan;
};

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
const TabEEmpleadores=()=>{
    const [datos,    setDatos]   =useState(null);
    const [cargando, setCargando]=useState(true);
    const [error,    setError]   =useState('');
    const [modo,     setModo]    =useState('empresas');
    const [fEmp,     setFEmp]    =useState({provincia:'',ciudad:'',tipoCapital:''});
    const [fEnc,     setFEnc]    =useState({encuestaId:'',tipoCapital:''});
    const [geoData,  setGeoData] =useState({ecuador:null,cantones:null,provincias:null});
    const [geoError, setGeoError]=useState(false);

    useEffect(()=>{
        Promise.all([
            fetch('/geo/ecuador.geojson').then(r=>{if(!r.ok)throw 0;return r.json();}),
            fetch('/geo/cantones.geojson').then(r=>{if(!r.ok)throw 0;return r.json();}),
            fetch('/geo/provinciales.geojson').then(r=>{if(!r.ok)throw 0;return r.json();}),
        ]).then(([e,c,p])=>setGeoData({ecuador:e,cantones:c,provincias:p})).catch(()=>setGeoError(true));
    },[]);

    const cargar=useCallback(async()=>{
        setCargando(true);setError('');
        try{const r=await axios.get(`${API}/admin/estadisticas-empleadores`,{headers:hdrs()});setDatos(r.data);}
        catch{setError('No se pudieron cargar las estadísticas de empleadores.');}
        finally{setCargando(false);}
    },[]);
    useEffect(()=>{cargar();},[cargar]);

    const cEmp=useCallback((k,v)=>setFEmp(p=>{const n={...p,[k]:v};if(k==='provincia')n.ciudad='';return n;}),[]);
    const cEnc=useCallback((k,v)=>setFEnc(p=>({...p,[k]:v})),[]);
    const lEmp=useCallback(()=>setFEmp({provincia:'',ciudad:'',tipoCapital:''}),[]);
    const lEnc=useCallback(()=>setFEnc({encuestaId:'',tipoCapital:''}),[]);

    const df=useMemo(()=>{
        if(!datos) return null;
        const{encuestas,empleadoresRaw,respuestasRaw,preguntasAgrupadas,kpis}=datos;
        const encC=encuestas.filter(e=>e.estado==='cerrada');
        const idsC=new Set(encC.map(e=>e._id));

        let emps=empleadoresRaw;
        if(fEmp.provincia)   emps=emps.filter(e=>norm(e.provincia)===norm(fEmp.provincia));
        if(fEmp.ciudad)      emps=emps.filter(e=>norm(e.ciudad)===norm(fEmp.ciudad));
        if(fEmp.tipoCapital) emps=emps.filter(e=>e.tipoCapital===fEmp.tipoCapital);

        const cP={},cC={},cCap={},cAct={};
        emps.forEach(e=>{
            if(e.provincia)    cP[e.provincia]    =(cP[e.provincia]   ||0)+1;
            if(e.ciudad)       cC[e.ciudad]       =(cC[e.ciudad]      ||0)+1;
            if(e.tipoCapital)  cCap[e.tipoCapital]=(cCap[e.tipoCapital]||0)+1;
            if(e.tipoActividad)cAct[e.tipoActividad]=(cAct[e.tipoActividad]||0)+1;
        });
        const porProv=Object.entries(cP).map(([p,t])=>({provincia:p,total:t})).sort((a,b)=>b.total-a.total);
        const porCiud=Object.entries(cC).map(([c,t])=>({ciudad:c,total:t})).sort((a,b)=>b.total-a.total);
        const porCap =Object.entries(cCap).map(([t,v])=>({tipo:t,total:v}));
        const porAct =Object.entries(cAct).map(([t,v])=>({tipo:t,total:v}));
        const mitad  =Math.ceil(porProv.length/2);
        const ciuD   =fEmp.provincia?[...new Set(empleadoresRaw.filter(e=>norm(e.provincia)===norm(fEmp.provincia)).map(e=>e.ciudad).filter(Boolean))].sort():[];

        const pregsF=preguntasAgrupadas.map(g=>({
            ...g,
            respuestasRaw:(g.respuestasRaw||[]).filter(r=>{
                if(!idsC.has(r.encuestaId)) return false;
                if(fEnc.encuestaId&&r.encuestaId!==fEnc.encuestaId) return false;
                if(fEnc.tipoCapital&&r.tipoCapital!==fEnc.tipoCapital) return false;
                return true;
            }),
            encuestasAparece:(g.encuestasAparece||[]).filter(id=>idsC.has(id)),
        })).filter(g=>g.respuestasRaw.length>0);

        const comunes=pregsF.filter(g=>g.esComun);
        const otras  =pregsF.filter(g=>!g.esComun);
        const respond=empleadoresRaw.filter(e=>fEnc.encuestaId?e.encuestasRespondidas.includes(fEnc.encuestaId):e.respondio).length;
        const kE={...kpis,respondieron:respond,tasa:empleadoresRaw.length>0?Math.round((respond/empleadoresRaw.length)*100):0,totalEmps:empleadoresRaw.length};

        return{
            encC,empleadoresFiltrados:emps,respuestasRaw,
            porProv,porCiud,porCap,porAct,mitad,ciuD,
            comunes,otras,kE,
            insights:calcularInsights(kE,comunes,otras,encC),
            plan:calcularPlan(kE,encC),
        };
    },[datos,fEmp,fEnc]);

    const opsProv=useMemo(()=>datos?[...new Set(datos.empleadoresRaw.map(e=>e.provincia).filter(Boolean))].sort():[]   ,[datos]);
    const opsCap =useMemo(()=>datos?[...new Set(datos.empleadoresRaw.map(e=>e.tipoCapital).filter(Boolean))].sort():[] ,[datos]);

    if(cargando) return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:320}}><div style={{width:30,height:30,border:'3px solid #f1f5f9',borderTop:`3px solid ${ROJO}`,borderRadius:'50%',animation:'t5spin .8s linear infinite'}}/><p style={{margin:'14px 0 0',fontSize:'0.78rem',color:'#9ca3af',fontFamily:FONT}}>Cargando...</p></div>;
    if(error)    return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:320}}><FaExclamationTriangle style={{fontSize:'2rem',color:NARANJA,marginBottom:10}}/><p style={{margin:'0 0 14px',fontSize:'0.82rem',color:'#374151',fontFamily:FONT}}>{error}</p><button onClick={cargar} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',background:'white',border:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer',fontSize:'0.74rem',fontWeight:600,color:'#374151',fontFamily:FONT}}><FaSyncAlt style={{fontSize:'0.66rem'}}/>Reintentar</button></div>;
    if(!df) return null;

    const{encC,empleadoresFiltrados,respuestasRaw,porProv,porCiud,porCap,porAct,mitad,ciuD,comunes,otras,kE,insights,plan}=df;
    const hayFE=Object.values(fEmp).some(v=>v!=='');
    const hayFN=Object.values(fEnc).some(v=>v!=='');
    const sinD={margin:0,fontSize:'0.72rem',color:'#9ca3af',textAlign:'center',padding:'16px 0',fontFamily:FONT};

    return <div style={{fontFamily:FONT,paddingBottom:56}}>

        {/* Tabs + actualizar */}
        <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',borderBottom:'2px solid #f1f5f9',paddingBottom:10}}>
            {[{id:'empresas',lbl:'Información de Empresas',icon:FaBuilding},{id:'encuestas',lbl:'Resultados de Encuestas',icon:FaChartBar}].map(({id,lbl,icon:I})=>{
                const act=modo===id;
                return <button key={id} className="t5tab" onClick={()=>setModo(id)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:'0.78rem',fontFamily:FONT,border:`2px solid ${act?ROJO:'#e5e7eb'}`,background:act?ROJO:'white',color:act?'white':'#6b7280',fontWeight:act?700:500,boxShadow:act?`0 2px 8px ${ROJO}30`:'none',transition:'all .15s'}}>
                    <I style={{fontSize:'0.72rem'}}/>{lbl}
                </button>;
            })}
            <button onClick={cargar} style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:5,padding:'7px 12px',background:'white',border:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer',fontSize:'0.70rem',fontWeight:600,color:'#374151',fontFamily:FONT}}><FaSyncAlt style={{fontSize:'0.62rem'}}/>Actualizar</button>
        </div>

        {/* ════════ MODO EMPRESAS ════════ */}
        {modo==='empresas'&&<>
            {/* Filtros empresas */}
            <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'10px 14px',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                        <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaFilter style={{color:ROJO,fontSize:'0.60rem'}}/></div>
                        <span style={{fontSize:'0.72rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>Filtrar empresas</span>
                        {hayFE&&<span style={{background:ROJO,color:'white',borderRadius:99,fontSize:'0.55rem',fontWeight:700,padding:'1px 5px',fontFamily:FONT}}>{Object.values(fEmp).filter(v=>v!=='').length}</span>}
                    </div>
                    <div style={{width:1,height:20,background:'#e5e7eb',flexShrink:0}}/>
                    <select value={fEmp.provincia} onChange={e=>cEmp('provincia',e.target.value)} className={`t5sel${fEmp.provincia?' on':''}`} disabled={opsProv.length===0} style={{opacity:opsProv.length===0?0.45:1}}>
                        <option value="">Provincia</option>{opsProv.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                    {fEmp.provincia&&ciuD.length>0&&<select value={fEmp.ciudad} onChange={e=>cEmp('ciudad',e.target.value)} className={`t5sel${fEmp.ciudad?' on':''}`}>
                        <option value="">Cantón</option>{ciuD.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>}
                    <select value={fEmp.tipoCapital} onChange={e=>cEmp('tipoCapital',e.target.value)} className={`t5sel${fEmp.tipoCapital?' on':''}`} disabled={opsCap.length===0} style={{opacity:opsCap.length===0?0.45:1}}>
                        <option value="">Tipo de empresa</option>{opsCap.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    {hayFE&&<>
                        {Object.entries(fEmp).filter(([,v])=>v).map(([k,v])=>{
                            const lbl={provincia:'Provincia',ciudad:'Cantón',tipoCapital:'Tipo'}[k]||k;
                            return <span key={k} style={{background:`${ROJO}12`,color:ROJO,border:`1px solid ${ROJO}25`,borderRadius:99,fontSize:'0.63rem',fontWeight:600,padding:'2px 7px',fontFamily:FONT,display:'inline-flex',alignItems:'center',gap:3}}>
                                <span style={{color:'#9ca3af',fontSize:'0.58rem'}}>{lbl}:</span>&nbsp;{v}
                                <button onClick={()=>cEmp(k,'')} style={{background:'none',border:'none',color:ROJO,cursor:'pointer',padding:0,fontSize:'0.70rem',lineHeight:1,opacity:0.7}}>×</button>
                            </span>;
                        })}
                        <button onClick={lEmp} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:'0.65rem',fontFamily:FONT,display:'flex',alignItems:'center',gap:2,padding:'2px 4px'}}><FaTimes style={{fontSize:'0.55rem'}}/>Limpiar</button>
                    </>}
                </div>
            </div>

            {/* KPIs empresas */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                <KPI icon={FaBuilding}      valor={empleadoresFiltrados.length}                          label="Empleadores"         sub="Registrados activos"          color={ROJO}    delay={0}  />
                <KPI icon={FaCheckCircle}   valor={empleadoresFiltrados.filter(e=>e.respondio).length}   label="Respondieron alguna" sub="Al menos una encuesta"        color={VERDE}   delay={40} />
                <KPI icon={FaTimesCircle}   valor={empleadoresFiltrados.filter(e=>!e.respondio).length}  label="Sin responder"       sub="Ninguna encuesta"             color={NARANJA} delay={80} />
                <KPI icon={FaClipboardList} valor={encC.length}                                          label="Encuestas cerradas"  sub="Con resultados"               color={AZUL}    delay={120}/>
            </div>

            {/* Mapa con gerentes + respondieron en col derecha */}
            <div className="t5a" style={{background:'white',borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,.06)',overflow:'hidden',marginBottom:14,animationDelay:'80ms'}}>
                <div style={{padding:'11px 16px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${CIAN}0a,transparent)`,display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${CIAN}1a`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><FaMapMarked style={{color:CIAN,fontSize:'0.80rem'}}/></div>
                    <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Distribución Geográfica</div>
                        <div style={{fontSize:'0.62rem',color:'#94a3b8',fontFamily:FONT}}>
                            Ubicación de organizaciones · Ecuador continental
                            {fEmp.provincia&&<span style={{color:ROJO,marginLeft:4,fontWeight:600}}>· {fEmp.provincia}{fEmp.ciudad?` › ${fEmp.ciudad}`:''}</span>}
                        </div>
                    </div>
                    {fEmp.provincia&&<div style={{display:'flex',gap:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 8px',background:`${ROJO}10`,border:`1px solid ${ROJO}25`,borderRadius:99}}>
                            <FaBuilding style={{color:ROJO,fontSize:'0.58rem'}}/>
                            <span style={{fontSize:'0.62rem',fontWeight:700,color:ROJO,fontFamily:FONT}}>{empleadoresFiltrados.length} empresa{empleadoresFiltrados.length!==1?'s':''}</span>
                        </div>
                    </div>}
                </div>
                {geoError&&<div style={{padding:'9px 16px',background:'#fff7ed',borderBottom:'1px solid #fed7aa',display:'flex',alignItems:'center',gap:8}}><FaExclamationTriangle style={{color:'#d97706',fontSize:'0.80rem'}}/><p style={{margin:0,fontSize:'0.72rem',color:'#92400e',fontFamily:FONT}}>No se cargaron GeoJSON. Verifica <code>public/geo/</code></p></div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 420px 1fr',gap:0,height:460}}>
                    <div style={{borderRight:'1px solid #f1f5f9',overflow:'hidden'}}>
                        <ColIzq filtros={fEmp} porProv={porProv} porCiud={porCiud} total={empleadoresFiltrados.length} mitad={mitad}/>
                    </div>
                    <div style={{padding:'8px',borderLeft:'1px solid #f1f5f9',borderRight:'1px solid #f1f5f9',height:'100%'}}>
                        <MapaEmp porProv={porProv} porCiud={porCiud} filtros={fEmp} geoData={geoData}/>
                    </div>
                    <div style={{overflow:'hidden'}}>
                        <ColDer filtros={fEmp} porProv={porProv} emps={empleadoresFiltrados} total={empleadoresFiltrados.length} offset={mitad} respuestasRaw={respuestasRaw} encCerradas={encC}/>
                    </div>
                </div>
                <div style={{borderTop:'1px solid #e5e7eb',padding:'14px 20px',background:'#fafafa'}}>
                    <p style={{margin:'0 0 12px',fontSize:'0.63rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.5px'}}>Composición del sector</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
                        {[[porCap,'Tipo de Capital',0],[porAct,'Tipo de Actividad',4]].map(([lista,tit,off])=>(
                            <div key={tit} style={{display:'flex',gap:14,alignItems:'center'}}>
                                <Donut segs={lista.map((c,i)=>({v:c.total,c:PALETA[(i+off)%PALETA.length]}))} r={34} g={10} sz={84} label={empleadoresFiltrados.length} sublabel="total"/>
                                <div style={{flex:1}}>
                                    <div style={{fontSize:'0.64rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:6,fontFamily:FONT}}>{tit}</div>
                                    {lista.map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                                        <div style={{width:7,height:7,borderRadius:'50%',background:PALETA[(i+off)%PALETA.length],flexShrink:0}}/>
                                        <span style={{fontSize:'0.70rem',color:'#374151',flex:1,fontFamily:FONT}}>{c.tipo}</span>
                                        <span style={{fontSize:'0.70rem',fontWeight:700,color:PALETA[(i+off)%PALETA.length],fontFamily:FONT}}>{c.total}</span>
                                        <span style={{fontSize:'0.58rem',color:'#9ca3af',fontFamily:FONT}}>({pct(c.total,empleadoresFiltrados.length)}%)</span>
                                    </div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabla empresas */}
            <Panel titulo="Empresas Registradas" sub={`${empleadoresFiltrados.length} organizaciones${hayFE?' · filtrado':''}`} icon={FaBuilding} color={ROJO} delay={100}>
                {!empleadoresFiltrados.length?<p style={sinD}>Sin empresas</p>:<>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:8,padding:'5px 10px',borderBottom:'1px solid #e5e7eb',marginBottom:4}}>
                        {['Empresa','Gerente','Provincia / Cantón','Tipo','Estado'].map(h=><span key={h} style={{fontSize:'0.58rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textTransform:'uppercase'}}>{h}</span>)}
                    </div>
                    {empleadoresFiltrados.slice(0,30).map((e,i)=><div key={e._id} className="t5r" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:8,padding:'7px 10px',background:i%2===0?'#fafafa':'white',borderRadius:5,alignItems:'center',minHeight:38}}>
                        <span style={{fontSize:'0.72rem',fontWeight:600,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombreEmpresa}</span>
                        <span style={{fontSize:'0.68rem',color:'#475569',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombreGerente}</span>
                        <span style={{fontSize:'0.66rem',color:'#64748b',fontFamily:FONT}}>{[e.provincia,e.ciudad].filter(Boolean).join(' › ')||'—'}</span>
                        <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                            <span style={{fontSize:'0.55rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>{e.tipoCapital}</span>
                            <span style={{fontSize:'0.55rem',fontWeight:700,color:NARANJA,background:`${NARANJA}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>{e.tipoActividad}</span>
                        </div>
                        <span style={{fontSize:'0.58rem',fontWeight:700,color:e.respondio?VERDE:GRIS,background:e.respondio?`${VERDE}10`:`${GRIS}10`,borderRadius:99,padding:'2px 6px',fontFamily:FONT,whiteSpace:'nowrap'}}>{e.respondio?'✓ Respondió':'Pendiente'}</span>
                    </div>)}
                    {empleadoresFiltrados.length>30&&<p style={{margin:'8px 0 0',fontSize:'0.65rem',color:'#94a3b8',fontFamily:FONT,textAlign:'center'}}>Mostrando 30 de {empleadoresFiltrados.length}. Usa los filtros para refinar.</p>}
                </>}
            </Panel>
        </>}

        {/* ════════ MODO ENCUESTAS ════════ */}
        {modo==='encuestas'&&<>
            {/* KPIs encuestas */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
                <KPI icon={FaBuilding}      valor={kE.totalEmps}      label="Empleadores totales" sub="Registrados activos"           color={ROJO}    delay={0}  />
                <KPI icon={FaClipboardList} valor={encC.length}        label="Encuestas cerradas"  sub="Con resultados"               color={AZUL}    delay={40} />
                <KPI icon={FaCheckCircle}   valor={kE.respondieron}    label="Respondieron"        sub={`${kE.tasa}% del total`}      color={VERDE}   delay={80} />
                <KPI icon={FaLayerGroup}    valor={comunes.length}     label="Preguntas recurrentes" sub="En 2+ encuestas"            color={MORADO}  delay={120}/>
                <KPI icon={FaQuestion}      valor={otras.length}       label="Otras preguntas"     sub="Específicas por encuesta"     color={CIAN}    delay={160}/>
            </div>

            {/* Filtros encuestas — SOLO encuesta y tipo */}
            <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'10px 14px',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                        <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaFilter style={{color:ROJO,fontSize:'0.60rem'}}/></div>
                        <span style={{fontSize:'0.72rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>Filtrar resultados</span>
                        {hayFN&&<span style={{background:ROJO,color:'white',borderRadius:99,fontSize:'0.55rem',fontWeight:700,padding:'1px 5px',fontFamily:FONT}}>{Object.values(fEnc).filter(v=>v!=='').length}</span>}
                    </div>
                    <div style={{width:1,height:20,background:'#e5e7eb',flexShrink:0}}/>
                    {encC.length>0?<select value={fEnc.encuestaId} onChange={e=>cEnc('encuestaId',e.target.value)} className={`t5sel${fEnc.encuestaId?' on':''}`} style={{minWidth:220,maxWidth:340}}>
                        <option value="">Todas las encuestas cerradas</option>
                        {encC.map(e=><option key={e._id} value={e._id}>{e.titulo}</option>)}
                    </select>:<span style={{fontSize:'0.70rem',color:'#94a3b8',fontFamily:FONT}}>Sin encuestas cerradas disponibles</span>}
                    <select value={fEnc.tipoCapital} onChange={e=>cEnc('tipoCapital',e.target.value)} className={`t5sel${fEnc.tipoCapital?' on':''}`} disabled={opsCap.length===0} style={{opacity:opsCap.length===0?0.45:1}}>
                        <option value="">Tipo de empresa</option>{opsCap.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    {hayFN&&<>
                        {Object.entries(fEnc).filter(([,v])=>v).map(([k,v])=>{
                            const lbl={encuestaId:'Encuesta',tipoCapital:'Tipo'}[k]||k;
                            const display=k==='encuestaId'?(encC.find(e=>e._id===v)?.titulo?.slice(0,32)||v):v;
                            return <span key={k} style={{background:`${ROJO}12`,color:ROJO,border:`1px solid ${ROJO}25`,borderRadius:99,fontSize:'0.63rem',fontWeight:600,padding:'2px 7px',fontFamily:FONT,display:'inline-flex',alignItems:'center',gap:3}}>
                                <span style={{color:'#9ca3af',fontSize:'0.58rem'}}>{lbl}:</span>&nbsp;{display.length>30?display.slice(0,30)+'…':display}
                                <button onClick={()=>cEnc(k,'')} style={{background:'none',border:'none',color:ROJO,cursor:'pointer',padding:0,fontSize:'0.70rem',lineHeight:1,opacity:0.7}}>×</button>
                            </span>;
                        })}
                        <button onClick={lEnc} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:'0.65rem',fontFamily:FONT,display:'flex',alignItems:'center',gap:2,padding:'2px 4px'}}><FaTimes style={{fontSize:'0.55rem'}}/>Limpiar</button>
                    </>}
                </div>
            </div>

            {/* Preguntas recurrentes */}
            {comunes.length>0&&<div style={{marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${VERDE}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaLayerGroup style={{color:VERDE,fontSize:'0.78rem'}}/></div>
                    <div>
                        <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Preguntas Recurrentes</div>
                        <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>Aparecen en múltiples encuestas · {comunes.length} grupo{comunes.length!==1?'s':''} · Comparación longitudinal</div>
                    </div>
                </div>
                {comunes.map((g,i)=><TarjetaGrupo key={g.id} grupo={g} encuestas={encC} filtros={fEnc} num={i+1}/>)}
            </div>}

            {/* Otras preguntas */}
            {otras.length>0&&<div style={{marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${AZUL}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaQuestion style={{color:AZUL,fontSize:'0.78rem'}}/></div>
                    <div>
                        <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Otras Preguntas</div>
                        <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>{fEnc.encuestaId?'Preguntas de la encuesta seleccionada':'Específicas de una encuesta'} · {otras.length} grupo{otras.length!==1?'s':''}</div>
                    </div>
                </div>
                {otras.map((g,i)=><TarjetaGrupo key={g.id} grupo={g} encuestas={encC} filtros={fEnc} num={comunes.length+i+1}/>)}
            </div>}

            {/* Sin datos */}
            {comunes.length===0&&otras.length===0&&<div style={{padding:'32px',background:'white',borderRadius:10,border:'1px solid #e5e7eb',textAlign:'center',marginBottom:14}}>
                <FaClipboardList style={{color:'#cbd5e1',fontSize:'2rem',marginBottom:8}}/>
                <p style={{margin:'0 0 6px',fontSize:'0.78rem',fontWeight:600,color:'#94a3b8',fontFamily:FONT}}>{encC.length===0?'No hay encuestas cerradas aún':'Sin resultados con los filtros actuales'}</p>
                <p style={{margin:0,fontSize:'0.68rem',color:'#cbd5e1',fontFamily:FONT}}>{encC.length===0?'Los gráficos aparecerán al cerrar una encuesta.':'Prueba limpiando los filtros.'}</p>
            </div>}

            {/* Insights + Plan */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14}}>
                <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',animationDelay:'200ms'}}>
                    <div style={{padding:'11px 16px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${ROJO}09,transparent)`,display:'flex',alignItems:'center',gap:9,flexWrap:'wrap'}}>
                        <div style={{width:28,height:28,borderRadius:7,background:`${ROJO}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaLightbulb style={{color:ROJO,fontSize:'0.82rem'}}/></div>
                        <div>
                            <div style={{fontSize:'0.82rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Análisis de Situación — Empleadores</div>
                            <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>{insights.length} observaciones · generado automáticamente</div>
                        </div>
                        <div style={{marginLeft:'auto',display:'flex',gap:10}}>
                            {[['crit','Crítico',ROJO],['warn','Atención',NARANJA],['ok','Fortaleza',VERDE],['info','Sugerencia',AZUL]].map(([tipo,lbl,c])=>(
                                <div key={tipo} style={{display:'flex',alignItems:'center',gap:3}}><div style={{width:6,height:6,borderRadius:'50%',background:c}}/><span style={{fontSize:'0.60rem',color:'#6b7280',fontFamily:FONT}}>{lbl}</span></div>
                            ))}
                        </div>
                    </div>
                    <div style={{padding:'13px 16px'}}>
                        {insights.length===0?<p style={sinD}>Sin datos suficientes</p>:<>
                            {['crit','warn','ok','info'].map(tipo=>{
                                const gr=insights.filter(r=>r.tipo===tipo);
                                if(!gr.length) return null;
                                const lbls={crit:'🔴 Puntos Críticos',warn:'⚠️ Atención',ok:'✅ Fortalezas',info:'💡 Sugerencias'};
                                return <div key={tipo} style={{marginBottom:12}}>
                                    <p style={{margin:'0 0 6px',fontSize:'0.65rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:FONT}}>{lbls[tipo]}</p>
                                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:6}}>
                                        {gr.map((r,i)=><Insight key={i} tipo={r.tipo} titulo={r.titulo} detalle={r.detalle} delay={i*35}/>)}
                                    </div>
                                </div>;
                            })}
                        </>}
                    </div>
                </div>
                <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',animationDelay:'220ms'}}>
                    <div style={{padding:'11px 16px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${AZUL}09,transparent)`,display:'flex',alignItems:'center',gap:9}}>
                        <div style={{width:28,height:28,borderRadius:7,background:`${AZUL}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaBullseye style={{color:AZUL,fontSize:'0.82rem'}}/></div>
                        <div><div style={{fontSize:'0.82rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Plan de Acción</div><div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>Acciones priorizadas por impacto</div></div>
                    </div>
                    <div style={{padding:'12px 14px'}}>
                        {plan.length===0
                            ?<div style={{textAlign:'center',padding:'20px 0'}}><FaCheckCircle style={{color:VERDE,fontSize:'1.6rem',marginBottom:8}}/><p style={{margin:0,fontSize:'0.74rem',color:VERDE,fontFamily:FONT,fontWeight:600}}>¡Sin acciones críticas!</p></div>
                            :plan.map((a,i)=>{const imp={alto:ROJO,medio:NARANJA,bajo:CIAN}[a.impacto]||AZUL;return <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderBottom:i<plan.length-1?'1px solid #f1f5f9':'none'}}>
                                <div style={{width:22,height:22,borderRadius:6,background:`${imp}15`,border:`1px solid ${imp}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}><span style={{fontSize:'0.65rem',fontWeight:800,color:imp,fontFamily:FONT}}>{a.prioridad}</span></div>
                                <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:'0.72rem',fontWeight:600,color:'#0f172a',fontFamily:FONT,marginBottom:2}}>{a.accion}</div>
                                    <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                                        <span style={{fontSize:'0.60rem',fontWeight:700,color:imp,background:`${imp}12`,border:`1px solid ${imp}25`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>Impacto {a.impacto}</span>
                                        <span style={{fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>{a.meta}</span>
                                    </div>
                                </div>
                            </div>;})}
                    </div>
                </div>
            </div>
        </>}
    </div>;
};

export default TabEEmpleadores;