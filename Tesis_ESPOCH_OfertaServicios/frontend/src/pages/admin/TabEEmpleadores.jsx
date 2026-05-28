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
    FaEnvelope, FaCalendarAlt, FaAward, FaMedal,
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
        .emp-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.10) !important;transform:translateY(-1px);}
        .emp-card{transition:all 0.18s ease;}
    `;
    document.head.appendChild(st);
}

// ═══════════════════════════════════════════════════════════
// NLP FRONTEND
// ═══════════════════════════════════════════════════════════
const STOPWORDS_ES=new Set(['el','la','los','las','un','una','unos','unas','de','del','en','que','y','a','al','se','es','por','con','para','su','sus','lo','le','les','me','mi','mas','si','pero','no','ya','o','como','hay','muy','ser','son','fue','han','has','era','esto','esta','este','estos','estas','son','ser','tener','tiene','tienen','tuvo','que','cual','quien','cuando','donde','como','porque','aunque','sino','pues','entonces','tambien','ademas','asi','bien','mejor','mayor','menor','todo','todos','toda','todas','cada','otro','otros','otra','otras','mismo','misma','mismos','mismas','puede','pueden','debe','deben','hacer','hace','hacen','tener','tiene','tienen','haber','hay','esta','estan','ser','somos','son','fue','fueron','seria','seran','nos','nuestro','nuestra','nuestros','nuestras','su','sus','mi','mis','entre','sobre','bajo','ante','tras','durante','mediante','segun','sin','mas','menos','muy','bien','mal','tanto','poco','mucho','algo','nada','alguien','nadie']);

function analizarTexto(textos){
    if(!textos?.length) return {palabras:[],temas:[],frases:[]};
    const freq={},bigrams={};
    textos.forEach(t=>{
        if(!t||typeof t!=='string') return;
        const limpio=t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
        if(!limpio) return;
        const words=limpio.split(' ').filter(w=>w.length>3&&!STOPWORDS_ES.has(w));
        words.forEach(w=>{freq[w]=(freq[w]||0)+1;});
        for(let i=0;i<words.length-1;i++){const bg=`${words[i]} ${words[i+1]}`;bigrams[bg]=(bigrams[bg]||0)+1;}
    });
    const palabras=Object.entries(freq).filter(([,v])=>v>=1).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([w,c])=>({word:w,count:c}));
    const frasesFrecuentes=Object.entries(bigrams).filter(([,v])=>v>=2).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([bg,c])=>({frase:bg,count:c}));
    const TEMAS={'Habilidades técnicas':['programacion','lenguajes','frameworks','tecnologias','herramientas','software','desarrollo','codigo','bases','datos','sistemas','redes','seguridad','cloud','web','movil'],'Habilidades blandas':['comunicacion','trabajo','equipo','liderazgo','gestion','proyectos','tiempo','organizacion','adaptacion','creatividad','proactividad','responsabilidad'],'Inglés / Idiomas':['ingles','idiomas','lenguaje','certificaciones','internacional','bilingue'],'Experiencia práctica':['practica','proyectos','reales','empresas','pasantias','experiencia','aplicacion','industria'],'Formación continua':['certificaciones','cursos','actualizacion','capacitacion','especializacion','maestria','posgrado'],'Emprendimiento':['emprendimiento','negocios','innovacion','startup','empresa','gestion','administracion']};
    const temaConteo={};
    Object.entries(TEMAS).forEach(([tema,kws])=>{let cnt=0;kws.forEach(kw=>{cnt+=(freq[kw]||0);});if(cnt>0)temaConteo[tema]=cnt;});
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
    const cfg={ok:{I:FaCheckCircle,color:VERDE,bg:'#f0fdf4',bd:'#bbf7d0',lbl:'Fortaleza'},warn:{I:FaExclamationTriangle,color:NARANJA,bg:'#fff7ed',bd:'#fed7aa',lbl:'Atención'},crit:{I:FaTimesCircle,color:ROJO,bg:'#fef2f2',bd:'#fecaca',lbl:'Crítico'},info:{I:FaLightbulb,color:AZUL,bg:'#eff6ff',bd:'#bfdbfe',lbl:'Sugerencia'}}[tipo]||{I:FaLightbulb,color:AZUL,bg:'#eff6ff',bd:'#bfdbfe',lbl:'Info'};
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
                    {palabras.slice(0,20).map((p,i)=>{
                        const size=0.62+((p.count/maxFreq)*0.55);
                        const opacidad=0.45+((p.count/maxFreq)*0.55);
                        const color=PALETA[i%PALETA.length];
                        return <span key={i} style={{fontSize:`${size}rem`,fontWeight:p.count===maxFreq?800:p.count>=maxFreq*0.6?700:600,color,opacity:opacidad,fontFamily:FONT,padding:'2px 6px',borderRadius:99,background:`${color}12`,border:`1px solid ${color}22`,cursor:'default',lineHeight:1.4}} title={`${p.word}: ${p.count} vez${p.count!==1?'es':''}`}>{p.word}</span>;
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
            <div>
                <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Temas identificados</p>
                {temas.length>0?<>
                    {temas.map((t,i)=><Barra key={i} label={t.tema} valor={t.count} total={palabras.reduce((s,p)=>s+p.count,1)} color={t.color} compact/>)}
                    <div style={{marginTop:10,padding:'8px 10px',background:`${VERDE}08`,border:`1px solid ${VERDE}20`,borderRadius:7}}>
                        <p style={{margin:0,fontSize:'0.64rem',color:'#14532d',fontFamily:FONT,lineHeight:1.55}}><strong>Patrón principal:</strong> "{temas[0]?.tema}" — la mayoría de respuestas converge en este tema.</p>
                    </div>
                </>:<p style={{margin:0,fontSize:'0.68rem',color:'#9ca3af',fontFamily:FONT}}>No se detectaron temas con suficiente frecuencia.</p>}
                {palabras.length>0&&<div style={{marginTop:12}}>
                    <p style={{margin:'0 0 6px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Top 8 términos</p>
                    {palabras.slice(0,8).map((p,i)=><Barra key={i} label={p.word} valor={p.count} total={maxFreq} color={PALETA[i%PALETA.length]} compact/>)}
                </div>}
            </div>
        </div>
        <div style={{marginTop:14,borderTop:'1px solid #f1f5f9',paddingTop:12}}>
            <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Muestra de respuestas</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {textos.filter(t=>t.length>20).slice(0,4).map((t,i)=><div key={i} style={{padding:'7px 10px',background:i%2===0?'#f8fafc':'#fff7f7',borderRadius:7,border:'1px solid #e5e7eb',fontSize:'0.69rem',color:'#374151',fontFamily:FONT,lineHeight:1.55,fontStyle:'italic'}}>"{t.slice(0,120)}{t.length>120?'...':''}"</div>)}
            </div>
        </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════
// GRÁFICAS ENCUESTA
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
// MAPA — igual que antes
// ═══════════════════════════════════════════════════════════
const BOUNDS_PROV={'azuay':[[-3.35,-79.40],[-2.38,-78.55]],'bolivar':[[-1.95,-79.38],[-1.20,-78.60]],'canar':[[-3.10,-79.40],[-2.10,-78.60]],'carchi':[[0.30,-78.35],[0.92,-77.60]],'chimborazo':[[-2.30,-79.10],[-1.25,-78.20]],'cotopaxi':[[-1.50,-79.18],[-0.35,-78.30]],'el oro':[[-3.80,-80.35],[-2.95,-79.55]],'esmeraldas':[[0.50,-80.30],[1.45,-78.85]],'guayas':[[-3.15,-80.35],[-1.55,-79.20]],'imbabura':[[0.10,-78.75],[0.65,-77.80]],'loja':[[-4.70,-80.25],[-3.30,-78.85]],'los rios':[[-1.80,-79.90],[-0.65,-79.20]],'manabi':[[-1.90,-80.90],[-0.05,-79.70]],'morona santiago':[[-3.90,-78.50],[-1.45,-76.70]],'napo':[[-1.50,-78.30],[-0.30,-76.90]],'orellana':[[-1.30,-77.50],[0.50,-75.20]],'pastaza':[[-2.70,-78.20],[-1.00,-75.80]],'pichincha':[[-0.65,-79.10],[0.20,-78.00]],'santa elena':[[-3.20,-81.10],[-1.80,-80.30]],'santo domingo de los tsachilas':[[-0.65,-79.60],[0.05,-78.90]],'sucumbios':[[-0.35,-77.60],[0.60,-75.20]],'tungurahua':[[-1.60,-78.90],[-1.05,-78.20]],'zamora chinchipe':[[-5.00,-79.40],[-3.30,-77.90]]};

const ZC=({prov})=>{
    const map=useMap();
    useEffect(()=>{
        const b=prov?BOUNDS_PROV[norm(prov)]:null;
        b?map.fitBounds(b,{padding:[20,20]}):map.fitBounds(EC,{padding:[8,8],maxZoom:8});
    },[prov]);
    return null;
};

// ── Etiquetas de cantones en el mapa (igual que TabIndicadores) ──
const EtiquetasCantones=({cantonesGeoData,filtroProvNorm,lookupCant,filtroCanton})=>{
    const map=useMap();
    useEffect(()=>{
        if(!cantonesGeoData?.features||!filtroProvNorm) return;
        const markers=[];
        const candidatos=[];
        cantonesGeoData.features.forEach(feature=>{
            const np=feature.properties?.DPA_DESPRO||feature.properties?.NAME_1||'';
            if(norm(np)!==filtroProvNorm) return;
            const nc=feature.properties?.DPA_DESCAN||feature.properties?.DPA_CANTON||feature.properties?.NAME_2||'';
            if(!nc) return;
            const g=lookupCant[normCanton(nc)]||lookupCant[norm(nc)]||0;
            if(g===0) return;
            try{
                const layer=window.L.geoJSON(feature);
                const bounds=layer.getBounds();
                if(!bounds.isValid()) return;
                const sw=map.latLngToContainerPoint(bounds.getSouthWest());
                const ne=map.latLngToContainerPoint(bounds.getNorthEast());
                const pxW=Math.abs(ne.x-sw.x),pxH=Math.abs(ne.y-sw.y),area=pxW*pxH;
                candidatos.push({feature,nc,g,bounds,pxW,pxH,area});
            }catch(_){}
        });
        const total=candidatos.length;
        const cantonSelNorm=filtroCanton?normCanton(filtroCanton):'';
        candidatos.forEach(({feature,nc,g,bounds,pxW,pxH,area})=>{
            const center=bounds.getCenter();
            const esSeleccionado=cantonSelNorm&&(normCanton(nc)===cantonSelNorm||norm(nc)===cantonSelNorm);
            const palabras=nc.split(' ');
            let lineas;
            if(palabras.length===1) lineas=[palabras[0]];
            else if(palabras.length===2) lineas=palabras;
            else{const mid=Math.ceil(palabras.length/2);lineas=[palabras.slice(0,mid).join(' '),palabras.slice(mid).join(' ')];}
            const maxChars=Math.max(...lineas.map(l=>l.length));
            const numLineas=lineas.length;
            const lado=Math.sqrt(area);
            const porArea=Math.floor((lado*0.20)/(maxChars*0.62));
            const porAncho=Math.floor((pxW*0.65)/(maxChars*0.62));
            const porAlto=Math.floor((pxH*0.45)/(numLineas*1.3));
            const limitGlobal=esSeleccionado?13:total<=3?9:total<=6?8:7;
            let fontSize=Math.min(porArea,porAncho,porAlto,limitGlobal);
            fontSize=Math.max(6,fontSize);
            if(fontSize<6) return;
            const mostrarConteo=esSeleccionado?true:(area>=8000&&total<=3&&fontSize>=8);
            const iconW=pxW,iconH=pxH;
            const lineasHTML=lineas.map(linea=>`<div style="font-family:${FONT};font-size:${fontSize}px;font-weight:${esSeleccionado?900:700};color:#ffffff;text-shadow:-1px -1px 0 rgba(0,0,0,0.85),1px -1px 0 rgba(0,0,0,0.85),-1px 1px 0 rgba(0,0,0,0.85),1px 1px 0 rgba(0,0,0,0.85),0 2px 3px rgba(0,0,0,0.95);text-align:center;white-space:nowrap;line-height:1.15;letter-spacing:0px;text-transform:uppercase;max-width:${pxW*0.90}px;overflow:hidden;">${linea}</div>`).join('');
            const icon=window.L.divIcon({className:'',html:`<div style="width:${iconW}px;height:${iconH}px;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;overflow:hidden;gap:0px;">${lineasHTML}${mostrarConteo?`<div style="font-family:${FONT};font-size:${Math.max(6,fontSize-1)}px;font-weight:600;color:rgba(255,255,255,0.85);text-shadow:0 1px 2px rgba(0,0,0,0.95);text-align:center;white-space:nowrap;margin-top:1px;line-height:1;">${g} emp.</div>`:''}</div>`,iconSize:[iconW,iconH],iconAnchor:[iconW/2,iconH/2]});
            try{const marker=window.L.marker(center,{icon,interactive:false,zIndexOffset:1000});marker.addTo(map);markers.push(marker);}catch(_){}
        });
        return()=>{markers.forEach(m=>{try{map.removeLayer(m);}catch(_){}})};
    },[cantonesGeoData,filtroProvNorm,lookupCant,filtroCanton,map]);
    return null;
};

const MapaEmp=({porProv,porCiud,filtros,geoData})=>{
    const [zoomKey,setZoomKey]=useState(0);
    const onZoom=useCallback(()=>setZoomKey(k=>k+1),[]);

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
            mouseover(e){
                const g=lCR.current[normCanton(nc)]||lCR.current[norm(nc)]||0;
                const pv=lP[norm(np)];if(!pv)return;
                layer.bindTooltip(`<div style="font-family:${FONT};min-width:110px"><div style="font-weight:700;font-size:.82rem;color:${pv.color};margin-bottom:3px">${nc}</div><div style="font-size:.74rem;color:#374151">${g>0?`<strong>${g}</strong> empresa${g!==1?'s':''}`:'<span style="color:#9ca3af">Sin empresas</span>'}</div><div style="font-size:.64rem;color:#9ca3af;margin-top:2px">${np}</div></div>`,{direction:'top',opacity:1,sticky:true}).openTooltip(e.latlng);
                e.target.setStyle({fillOpacity:g>0?1:0.5,weight:2.5,color:'#000'});e.target.bringToFront();
            },
            mouseout(e){layer.unbindTooltip();e.target.setStyle(eCR.current(f));},
        });
    },[lP]);

    // ZoomWatcher inline
    const ZoomWatcher=({onZoom})=>{const map=useMap();useEffect(()=>{map.on('zoomend',onZoom);return()=>map.off('zoomend',onZoom);},[map,onZoom]);return null;};

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
        <ZoomWatcher onZoom={onZoom}/>
        {hayP&&geoData.cantones&&(
            <EtiquetasCantones
                key={`etq-emp-${pN}-${zoomKey}`}
                cantonesGeoData={geoData.cantones}
                filtroProvNorm={pN}
                lookupCant={lC}
                filtroCanton={filtros.ciudad}
            />
        )}
    </MapContainer>;
};

// ═══════════════════════════════════════════════════════════
// COLUMNA IZQUIERDA — cantones o primera mitad provincias
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// COLUMNA DERECHA — empresas con sus encuestas
// ═══════════════════════════════════════════════════════════
const POR_PAG_E=5;

const TarjetaEmpresa=({empresa,encuestasRespondidas,encCerradas,idx})=>{
    const respondio=encuestasRespondidas.length>0;
    const colorFondo=respondio?'#f0fdf4':'#fafafa';
    const colorBorde=respondio?'#bbf7d0':'#e5e7eb';
    const colorAcc=respondio?VERDE:GRIS;

    return(
        <div className="emp-card" style={{
            background:colorFondo,
            border:`1px solid ${colorBorde}`,
            borderLeft:`3px solid ${colorAcc}`,
            borderRadius:9,
            padding:'10px 12px',
            marginBottom:8,
        }}>
            {/* Header empresa */}
            <div style={{display:'flex',alignItems:'flex-start',gap:9,marginBottom:respondio?10:0}}>
                <div style={{width:32,height:32,borderRadius:8,background:`${colorAcc}18`,border:`1px solid ${colorAcc}28`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <FaBuilding style={{color:colorAcc,fontSize:'0.78rem'}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'0.76rem',fontWeight:700,color:'#0f172a',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{empresa.nombreEmpresa}</div>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2,flexWrap:'wrap'}}>
                        <FaUserTie style={{color:'#94a3b8',fontSize:'0.58rem',flexShrink:0}}/>
                        <span style={{fontSize:'0.65rem',color:'#64748b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{empresa.nombreGerente}</span>
                    </div>
                    <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
                        <span style={{fontSize:'0.55rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>{empresa.tipoCapital}</span>
                        <span style={{fontSize:'0.55rem',fontWeight:700,color:NARANJA,background:`${NARANJA}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>{empresa.tipoActividad}</span>
                        {!respondio&&<span style={{fontSize:'0.55rem',fontWeight:700,color:GRIS,background:`${GRIS}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>Sin encuestas</span>}
                    </div>
                </div>
                {/* Indicador de compromiso */}
                <div style={{flexShrink:0,textAlign:'center'}}>
                    <div style={{fontSize:'0.90rem',fontWeight:800,color:colorAcc,fontFamily:FONT,lineHeight:1}}>{encuestasRespondidas.length}</div>
                    <div style={{fontSize:'0.52rem',color:'#94a3b8',fontFamily:FONT,marginTop:1}}>{encuestasRespondidas.length===1?'encuesta':'encuestas'}</div>
                </div>
            </div>

            {/* Encuestas respondidas */}
            {respondio&&(
                <div style={{borderTop:`1px dashed ${colorBorde}`,paddingTop:8,display:'flex',flexDirection:'column',gap:4}}>
                    {encuestasRespondidas.map((enc,j)=>(
                        <div key={j} style={{
                            display:'flex',alignItems:'center',gap:7,
                            padding:'5px 8px',
                            background:'white',
                            border:`1px solid ${VERDE}22`,
                            borderRadius:6,
                        }}>
                            <div style={{width:20,height:20,borderRadius:5,background:`${VERDE}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <FaCheckCircle style={{color:VERDE,fontSize:'0.60rem'}}/>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:'0.67rem',fontWeight:600,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{enc.titulo}</div>
                                {enc.fechaRespuesta&&(
                                    <div style={{display:'flex',alignItems:'center',gap:3,marginTop:1}}>
                                        <FaCalendarAlt style={{color:'#94a3b8',fontSize:'0.52rem'}}/>
                                        <span style={{fontSize:'0.57rem',color:'#94a3b8',fontFamily:FONT}}>{fmt(enc.fechaRespuesta)}</span>
                                    </div>
                                )}
                            </div>
                            <span style={{fontSize:'0.56rem',fontWeight:700,color:VERDE,background:`${VERDE}12`,border:`1px solid ${VERDE}25`,borderRadius:99,padding:'1px 5px',fontFamily:FONT,whiteSpace:'nowrap',flexShrink:0}}>Completada</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ColDer=({filtros,porProv,emps,total,offset,respuestasRaw,encCerradas})=>{
    const [pag,setPag]=useState(1);
    useEffect(()=>{setPag(1);},[filtros.provincia,filtros.ciudad]);

    const hayP=!!filtros.provincia;

    if(!hayP){
        // Sin filtro: segunda mitad de provincias
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

    // ── Con filtro provincia/canton: tarjetas de empresas ──
    const normProv=norm(filtros.provincia||'');
    const normCant=filtros.ciudad?normCanton(filtros.ciudad):'';

    const empsEnZona=emps.filter(e=>{
        if(norm(e.provincia||'')!==normProv) return false;
        if(normCant&&normCanton(e.ciudad||'')!==normCant) return false;
        return true;
    });

    const totalPag=Math.ceil(empsEnZona.length/POR_PAG_E);
    const slice=empsEnZona.slice((pag-1)*POR_PAG_E,pag*POR_PAG_E);

    // Stats compromiso
    const conResp=empsEnZona.filter(e=>e.encuestasRespondidas.length>0).length;
    const sinResp=empsEnZona.length-conResp;
    const tasaCompromiso=empsEnZona.length>0?Math.round((conResp/empsEnZona.length)*100):0;

    // Cruzar encuestas respondidas con títulos y fechas
    const buildEncuestasEmp=(emp)=>{
        return emp.encuestasRespondidas.map(encId=>{
            const encInfo=encCerradas.find(e=>e._id===encId);
            const respInfo=respuestasRaw.find(r=>r.empleadorId===emp._id&&r.encuestaId===encId);
            return{
                id:encId,
                titulo:encInfo?.titulo||'Encuesta',
                fechaRespuesta:respInfo?.fechaRespuesta||null,
            };
        });
    };

    return(
        <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
            {/* Header */}
            <div style={{padding:'8px 10px 6px',borderBottom:'1px solid #f1f5f9',background:'#fafafa',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <FaBuilding style={{color:ROJO,fontSize:'0.60rem'}}/>
                    <span style={{fontSize:'0.62rem',fontWeight:700,color:'#475569',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.4px'}}>Empresas</span>
                    <span style={{fontSize:'0.58rem',color:'#94a3b8',fontFamily:FONT}}>· {filtros.ciudad||filtros.provincia}</span>
                    <span style={{fontSize:'0.58rem',fontWeight:700,color:ROJO,background:`${ROJO}12`,border:`1px solid ${ROJO}25`,borderRadius:99,padding:'0 5px',fontFamily:FONT,marginLeft:'auto'}}>{empsEnZona.length}</span>
                </div>
            </div>

            {/* Barra de compromiso */}
            {empsEnZona.length>0&&(
                <div style={{padding:'8px 10px',borderBottom:'1px solid #f1f5f9',background:'white',flexShrink:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                        <span style={{fontSize:'0.60rem',fontWeight:700,color:'#475569',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.4px'}}>Compromiso institucional</span>
                        <span style={{fontSize:'0.66rem',fontWeight:800,color:tasaCompromiso>=70?VERDE:tasaCompromiso>=40?NARANJA:ROJO,fontFamily:FONT}}>{tasaCompromiso}%</span>
                    </div>
                    <div style={{height:5,background:'#f1f5f9',borderRadius:99,overflow:'hidden',marginBottom:4}}>
                        <div style={{height:'100%',width:`${tasaCompromiso}%`,background:tasaCompromiso>=70?VERDE:tasaCompromiso>=40?NARANJA:ROJO,borderRadius:99,transition:'width .6s ease'}}/>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:3}}>
                            <div style={{width:6,height:6,borderRadius:'50%',background:VERDE}}/>
                            <span style={{fontSize:'0.57rem',color:'#6b7280',fontFamily:FONT}}>{conResp} respondieron</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:3}}>
                            <div style={{width:6,height:6,borderRadius:'50%',background:'#e5e7eb'}}/>
                            <span style={{fontSize:'0.57rem',color:'#6b7280',fontFamily:FONT}}>{sinResp} sin responder</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de empresas con scroll */}
            <div style={{flex:1,overflowY:'auto',padding:'8px 8px 4px'}}>
                {empsEnZona.length===0?(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:8}}>
                        <FaBuilding style={{fontSize:'1.6rem',color:'#cbd5e1'}}/>
                        <span style={{fontSize:'0.68rem',color:'#94a3b8',fontFamily:FONT}}>Sin empresas en esta zona</span>
                    </div>
                ):slice.map((emp,i)=>(
                    <TarjetaEmpresa
                        key={emp._id}
                        empresa={emp}
                        encuestasRespondidas={buildEncuestasEmp(emp)}
                        encCerradas={encCerradas}
                        idx={i}
                    />
                ))}
            </div>

            {/* Paginador */}
            {totalPag>1&&(
                <div style={{flexShrink:0,borderTop:'1px solid #f1f5f9',padding:'5px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafafa'}}>
                    <span style={{fontSize:'0.57rem',color:'#94a3b8',fontFamily:FONT}}>{(pag-1)*POR_PAG_E+1}–{Math.min(pag*POR_PAG_E,empsEnZona.length)} de {empsEnZona.length}</span>
                    <div style={{display:'flex',gap:3}}>
                        <button className="t5pag" disabled={pag===1} onClick={()=>setPag(p=>p-1)} style={{width:20,height:20,borderRadius:4,border:'1px solid #e5e7eb',background:'white',color:pag===1?'#d1d5db':'#374151',cursor:pag===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',transition:'all .15s'}}><FaChevronLeft/></button>
                        {Array.from({length:Math.min(totalPag,4)},(_,i)=>i+1).map(p=>(
                            <button key={p} className="t5pag" onClick={()=>setPag(p)} style={{width:20,height:20,borderRadius:4,border:`1px solid ${pag===p?ROJO:'#e5e7eb'}`,background:pag===p?ROJO:'white',color:pag===p?'white':'#374151',cursor:'pointer',fontSize:'0.58rem',fontWeight:pag===p?700:400,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONT,transition:'all .15s'}}>{p}</button>
                        ))}
                        <button className="t5pag" disabled={pag===totalPag} onClick={()=>setPag(p=>p+1)} style={{width:20,height:20,borderRadius:4,border:'1px solid #e5e7eb',background:'white',color:pag===totalPag?'#d1d5db':'#374151',cursor:pag===totalPag?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',transition:'all .15s'}}><FaChevronRight/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// ANÁLISIS REAL DE DATOS — INSIGHTS DINÁMICOS
// ═══════════════════════════════════════════════════════════

// Helper: promedio de respuestas de escala
const promedioEscala=(resps)=>{
    const vals=resps.map(r=>Number(r.valor)).filter(v=>v>=1&&v<=5);
    if(!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0)/vals.length;
};

// Helper: distribución Si/No
const distSiNo=(resps)=>{
    const si=resps.filter(r=>r.valor==='Sí').length;
    const no=resps.filter(r=>r.valor==='No').length;
    const total=si+no;
    return total>0?{si,no,total,pctSi:Math.round((si/total)*100)}:null;
};

// Helper: opción más frecuente
const modaOpciones=(resps)=>{
    const c={};
    resps.forEach(r=>{
        const v=r.valor;
        if(Array.isArray(v)) v.forEach(x=>{c[x]=(c[x]||0)+1;});
        else if(v) c[v]=(c[v]||0)+1;
    });
    const entries=Object.entries(c).sort((a,b)=>b[1]-a[1]);
    return entries.length>0?{valor:entries[0][0],count:entries[0][1],total:resps.length}:null;
};

const calcularInsights=(kpis,comunes,otras,encCerradas,empleadoresRaw,respuestasRaw)=>{
    const ins=[];
    const todasPregs=[...comunes,...otras];
    const{tasa,totalEmps,respondieron}=kpis;

    // ── 1. PARTICIPACIÓN ─────────────────────────────────────
    const sinResponder=totalEmps-respondieron;
    if(tasa>=80)
        ins.push({tipo:'ok',titulo:`Participación alta: ${tasa}% (${respondieron}/${totalEmps})`,detalle:`Solo ${sinResponder} empresa${sinResponder!==1?'s':''} no respondió. La muestra es estadísticamente representativa para análisis.`});
    else if(tasa>=60)
        ins.push({tipo:'warn',titulo:`Participación moderada: ${tasa}% (${respondieron}/${totalEmps})`,detalle:`${sinResponder} empresa${sinResponder!==1?'s':''} no respondió. Se recomienda reenvío para mejorar representatividad.`});
    else if(tasa>=40)
        ins.push({tipo:'crit',titulo:`Participación baja: ${tasa}% — muestra insuficiente`,detalle:`Solo ${respondieron} de ${totalEmps} respondieron. Con menos del 40% los resultados pueden estar sesgados.`});
    else if(tasa>0)
        ins.push({tipo:'crit',titulo:`Participación crítica: ${tasa}% — datos no representativos`,detalle:`Únicamente ${respondieron} empresa${respondieron!==1?'s':''} respondió. Se recomienda replantear la estrategia de convocatoria.`});

    // ── 2. TASA DE RESPUESTA POR TIPO DE CAPITAL ─────────────
    const porCapital={};
    empleadoresRaw.forEach(e=>{
        const t=e.tipoCapital||'Sin clasificar';
        if(!porCapital[t]) porCapital[t]={total:0,respondieron:0};
        porCapital[t].total++;
        if(e.respondio) porCapital[t].respondieron++;
    });
    const capitalEntries=Object.entries(porCapital).filter(([,v])=>v.total>=2);
    if(capitalEntries.length>=2){
        const mejorCap=capitalEntries.sort((a,b)=>(b[1].respondieron/b[1].total)-(a[1].respondieron/a[1].total))[0];
        const pctMejor=Math.round((mejorCap[1].respondieron/mejorCap[1].total)*100);
        const peorCap=capitalEntries[capitalEntries.length-1];
        const pctPeor=Math.round((peorCap[1].respondieron/peorCap[1].total)*100);
        if(pctMejor-pctPeor>=20)
            ins.push({tipo:'info',titulo:`Brecha de participación por tipo de capital`,detalle:`Empresas ${mejorCap[0]}: ${pctMejor}% de respuesta. Empresas ${peorCap[0]}: ${pctPeor}%. Diferencia de ${pctMejor-pctPeor} puntos porcentuales.`});
    }

    // ── 3. ANÁLISIS DE PREGUNTAS DE ESCALA ───────────────────
    const pregsEscala=todasPregs.filter(g=>g.tipo==='escala'&&g.respuestasRaw?.length>=3);
    if(pregsEscala.length>0){
        const conProm=pregsEscala.map(g=>({
            texto:g.textoCanonical,
            prom:promedioEscala(g.respuestasRaw),
            n:g.respuestasRaw.length,
        })).filter(x=>x.prom!==null).sort((a,b)=>a.prom-b.prom);

        if(conProm.length>0){
            const peor=conProm[0];
            const mejor=conProm[conProm.length-1];
            if(peor.prom<3.0)
                ins.push({tipo:'crit',titulo:`Área crítica detectada: "${peor.texto.slice(0,50)}${peor.texto.length>50?'…':''}"`,detalle:`Promedio de ${peor.prom.toFixed(2)}/5 en ${peor.n} respuestas. Es el indicador más bajo y requiere atención inmediata.`});
            else if(peor.prom<3.5)
                ins.push({tipo:'warn',titulo:`Área de mejora: "${peor.texto.slice(0,50)}${peor.texto.length>50?'…':''}"`,detalle:`Promedio de ${peor.prom.toFixed(2)}/5. Por debajo del umbral óptimo (3.5). Se recomienda profundizar en esta dimensión.`});

            if(mejor.prom>=4.0&&conProm.length>1)
                ins.push({tipo:'ok',titulo:`Fortaleza destacada: "${mejor.texto.slice(0,50)}${mejor.texto.length>50?'…':''}"`,detalle:`Promedio de ${mejor.prom.toFixed(2)}/5 en ${mejor.n} respuestas. Es el aspecto mejor valorado por los empleadores.`});

            // Rango de variación entre preguntas
            if(conProm.length>=3){
                const rango=mejor.prom-peor.prom;
                if(rango>=1.5)
                    ins.push({tipo:'info',titulo:`Alta dispersión entre indicadores (rango ${rango.toFixed(1)} puntos)`,detalle:`Las valoraciones van de ${peor.prom.toFixed(1)} a ${mejor.prom.toFixed(1)}. Esto indica percepciones muy diferenciadas según el tema evaluado.`});
            }
        }
    }

    // ── 4. ANÁLISIS SI/NO ────────────────────────────────────
    const pregsSiNo=todasPregs.filter(g=>g.tipo==='si_no'&&g.respuestasRaw?.length>=2);
    pregsSiNo.forEach(g=>{
        const d=distSiNo(g.respuestasRaw);
        if(!d) return;
        const texto=g.textoCanonical.slice(0,55)+(g.textoCanonical.length>55?'…':'');
        if(d.pctSi<=25)
            ins.push({tipo:'crit',titulo:`Solo ${d.pctSi}% respondió "Sí" a: "${texto}"`,detalle:`${d.si} de ${d.total} empleadores respondieron afirmativamente. Este indicador binario señala una brecha significativa.`});
        else if(d.pctSi>=80)
            ins.push({tipo:'ok',titulo:`${d.pctSi}% respondió "Sí" a: "${texto}"`,detalle:`${d.si} de ${d.total} empleadores con respuesta positiva. Consenso elevado en este aspecto.`});
    });

    // ── 5. OPCIÓN MÁS FRECUENTE EN OPCIONES MÚLTIPLES ────────
    const pregsOpc=todasPregs.filter(g=>(g.tipo==='opcion_multiple'||g.tipo==='checkboxes')&&g.respuestasRaw?.length>=3);
    if(pregsOpc.length>0){
        const moda=modaOpciones(pregsOpc[0].respuestasRaw);
        if(moda&&moda.count/moda.total>=0.5)
            ins.push({tipo:'info',titulo:`Tendencia dominante: "${moda.valor}"`,detalle:`La opción "${moda.valor}" fue seleccionada por ${moda.count} de ${moda.total} empleadores (${Math.round(moda.count/moda.total*100)}%). Preferencia clara del sector.`});
    }

    // ── 6. VÍNCULO CON ESPOCH ────────────────────────────────
    const conEspoch=respuestasRaw.filter(r=>(r.datosEncuestado?.estudiosEspoch||'').trim()!=='').length;
    if(conEspoch>0){
        const pctEspoch=Math.round((conEspoch/Math.max(respuestasRaw.length,1))*100);
        ins.push({tipo:'ok',titulo:`${conEspoch} encuestador${conEspoch!==1?'es':''} con vínculo ESPOCH (${pctEspoch}%)`,detalle:`Encuestadores con estudios en ESPOCH. Este dato evidencia el impacto directo de la institución en el sector empleador.`});
    }

    // ── 7. LONGITUDINAL — 2+ ENCUESTAS ───────────────────────
    if(encCerradas.length>=2){
        const pregsComunes=todasPregs.filter(g=>g.esComun&&g.tipo==='escala');
        if(pregsComunes.length>0){
            // Comparar promedio de la encuesta más antigua vs más reciente
            const encOrdenadas=[...encCerradas].sort((a,b)=>new Date(a.fechaCierre)-new Date(b.fechaCierre));
            const idAntigua=encOrdenadas[0]._id;
            const idReciente=encOrdenadas[encOrdenadas.length-1]._id;
            let mejora=0,empeora=0;
            pregsComunes.forEach(g=>{
                const rA=g.respuestasRaw.filter(r=>r.encuestaId===idAntigua);
                const rR=g.respuestasRaw.filter(r=>r.encuestaId===idReciente);
                const pA=promedioEscala(rA),pR=promedioEscala(rR);
                if(pA&&pR){ if(pR>pA+0.2) mejora++; else if(pR<pA-0.2) empeora++; }
            });
            if(mejora>empeora)
                ins.push({tipo:'ok',titulo:`Tendencia positiva entre encuestas: ${mejora} indicador${mejora!==1?'es':''} mejoró`,detalle:`Comparando "${encOrdenadas[0].titulo}" vs "${encOrdenadas[encOrdenadas.length-1].titulo}", la mayoría de indicadores de escala muestran mejoría.`});
            else if(empeora>mejora)
                ins.push({tipo:'warn',titulo:`Tendencia negativa: ${empeora} indicador${empeora!==1?'es':''} empeoró`,detalle:`Entre la primera y última encuesta, varios indicadores de escala bajaron. Se recomienda analizar los cambios en el contexto.`});
            else if(mejora>0)
                ins.push({tipo:'info',titulo:`Tendencia estable entre ${encCerradas.length} encuestas`,detalle:`Los indicadores de escala no muestran variación significativa entre períodos. La percepción del sector se mantiene constante.`});
        }
        ins.push({tipo:'ok',titulo:`${encCerradas.length} encuestas cerradas — análisis longitudinal disponible`,detalle:`Datos de múltiples períodos permiten comparar tendencias. Se recomienda mantener preguntas comunes en futuras encuestas.`});
    } else if(encCerradas.length===1){
        ins.push({tipo:'info',titulo:`1 encuesta cerrada — base de datos inicial`,detalle:`Con la segunda encuesta se habilitará el análisis de tendencias. Se recomienda reutilizar las preguntas actuales.`});
    }

    // ── 8. COBERTURA DE TEXTO LIBRE ───────────────────────────
    const pregsTexto=todasPregs.filter(g=>g.tipo==='texto_libre');
    if(pregsTexto.length>0){
        const totalResps=pregsTexto.reduce((s,g)=>s+(g.respuestasRaw?.length||0),0);
        const promRespTexto=Math.round(totalResps/pregsTexto.length);
        if(promRespTexto>=5)
            ins.push({tipo:'ok',titulo:`Buena cobertura cualitativa: ~${promRespTexto} respuestas por pregunta abierta`,detalle:`Las preguntas de texto libre tienen suficiente volumen para análisis NLP confiable de patrones y temas.`});
        else if(promRespTexto>0)
            ins.push({tipo:'info',titulo:`Cobertura cualitativa limitada: ~${promRespTexto} respuesta${promRespTexto!==1?'s':''} por pregunta abierta`,detalle:`Con más respuestas el análisis NLP mejora. Actualmente los patrones detectados son referenciales.`});
    }

    return ins;
};

const calcularPlan=(kpis,encCerradas,empleadoresRaw,todasPregs)=>{
    const plan=[];
    let prioridad=1;
    const{tasa,totalEmps,respondieron}=kpis;

    // P1: Participación crítica
    if(tasa<40)
        plan.push({prioridad:prioridad++,accion:'Implementar estrategia de reenganche a empleadores inactivos',impacto:'alto',meta:`${totalEmps-respondieron} empresas sin responder — objetivo: superar 60%`});

    // P2: Recordatorio si participación media
    if(tasa>=40&&tasa<70)
        plan.push({prioridad:prioridad++,accion:'Enviar recordatorio personalizado a empleadores pendientes',impacto:'medio',meta:`${totalEmps-respondieron} contactos por realizar para superar 70%`});

    // P3: Sin encuestas cerradas
    if(encCerradas.length===0)
        plan.push({prioridad:prioridad++,accion:'Cerrar la encuesta activa para habilitar el análisis de resultados',impacto:'alto',meta:'Los gráficos y análisis solo operan sobre encuestas cerradas'});

    // P4: Análisis de preguntas débiles
    const pregsEscala=(todasPregs||[]).filter(g=>g.tipo==='escala'&&g.respuestasRaw?.length>=2);
    if(pregsEscala.length>0){
        const promedios=pregsEscala.map(g=>({texto:g.textoCanonical,prom:promedioEscala(g.respuestasRaw)})).filter(x=>x.prom!==null);
        const debiles=promedios.filter(x=>x.prom<3.5);
        if(debiles.length>0)
            plan.push({prioridad:prioridad++,accion:`Diseñar plan de mejora para ${debiles.length} área${debiles.length!==1?'s':''} con valoración baja`,impacto:'alto',meta:`"${debiles[0].texto.slice(0,40)}${debiles[0].texto.length>40?'…':''}" (${debiles[0].prom.toFixed(2)}/5) y ${debiles.length>1?`${debiles.length-1} más`:'ninguna más'}`});
    }

    // P5: Longitudinal
    if(encCerradas.length===1)
        plan.push({prioridad:prioridad++,accion:'Mantener las preguntas actuales en la próxima encuesta',impacto:'medio',meta:'Habilitar comparación longitudinal y detección de tendencias'});

    // P6: Baja participación por tipo de capital
    const porCapital={};
    (empleadoresRaw||[]).forEach(e=>{
        const t=e.tipoCapital||'Sin clasificar';
        if(!porCapital[t]) porCapital[t]={total:0,respondieron:0};
        porCapital[t].total++;
        if(e.respondio) porCapital[t].respondieron++;
    });
    const capitalDebil=Object.entries(porCapital).filter(([,v])=>v.total>=2&&Math.round(v.respondieron/v.total*100)<50);
    if(capitalDebil.length>0){
        const [tipo,datos]=capitalDebil[0];
        plan.push({prioridad:prioridad++,accion:`Reforzar convocatoria a empresas de capital ${tipo}`,impacto:'medio',meta:`Solo ${Math.round(datos.respondieron/datos.total*100)}% de este segmento respondió (${datos.respondieron}/${datos.total})`});
    }

    // P7: Vínculo ESPOCH sin aprovechar
    const conEspoch=(todasPregs||[]).flatMap(g=>g.respuestasRaw||[]).filter(r=>(r.datosEncuestado?.estudiosEspoch||'').trim()!=='').length;
    if(conEspoch>0)
        plan.push({prioridad:prioridad++,accion:'Aprovechar red de egresados ESPOCH en empresas para fortalecer vínculos',impacto:'bajo',meta:`${conEspoch} encuestador${conEspoch!==1?'es':''} identificado${conEspoch!==1?'s':''} con formación ESPOCH`});

    return plan;
};

// ═══════════════════════════════════════════════════════════
// TABLA EMPRESAS PAGINADA
// ═══════════════════════════════════════════════════════════
const TablaEmpresasPaginada=({empleadoresFiltrados,hayFE,sinD,fEmp})=>{
    const LIMIT_T=10;
    const [pagTabla,setPagTabla]=useState(1);
    useEffect(()=>{setPagTabla(1);},[fEmp.provincia,fEmp.ciudad,fEmp.tipoCapital]);
    const totalPagT=Math.ceil(empleadoresFiltrados.length/LIMIT_T);
    const sliceT=empleadoresFiltrados.slice((pagTabla-1)*LIMIT_T,pagTabla*LIMIT_T);
    const ini=(pagTabla-1)*LIMIT_T+1,fin=Math.min(pagTabla*LIMIT_T,empleadoresFiltrados.length);
    return(
        <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',boxShadow:'0 1px 3px rgba(0,0,0,.05)',overflow:'hidden',marginBottom:14,animationDelay:'100ms'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${ROJO}08,transparent)`,display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:26,height:26,borderRadius:6,background:`${ROJO}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <FaBuilding style={{color:ROJO,fontSize:'0.74rem'}}/>
                </div>
                <div style={{flex:1}}>
                    <div style={{fontSize:'0.80rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Empresas Registradas</div>
                    {empleadoresFiltrados.length>0&&<div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>{empleadoresFiltrados.length} organizaciones{hayFE?' · filtrado':''} · página {pagTabla} de {totalPagT}</div>}
                </div>
                {empleadoresFiltrados.length>0&&<span style={{fontSize:'0.63rem',fontWeight:700,color:ROJO,background:`${ROJO}10`,border:`1px solid ${ROJO}25`,borderRadius:99,padding:'2px 9px',fontFamily:FONT}}>{empleadoresFiltrados.length} total</span>}
            </div>
            <div style={{padding:'12px 14px'}}>
                {!empleadoresFiltrados.length?<p style={sinD}>Sin empresas</p>:<>
                    <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr auto',gap:8,padding:'5px 10px',borderBottom:'2px solid #f0f0f0',marginBottom:4}}>
                        {['Empresa','Gerente','Provincia / Cantón','Tipo','Estado'].map(h=><span key={h} style={{fontSize:'0.58rem',fontWeight:700,color:'#94a3b8',fontFamily:FONT,textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</span>)}
                    </div>
                    {sliceT.map((e,i)=>(
                        <div key={e._id} className="t5r" style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr auto',gap:8,padding:'8px 10px',background:i%2===0?'#fafafa':'white',borderRadius:6,alignItems:'center',minHeight:40,marginBottom:2}}>
                            <div style={{minWidth:0}}>
                                <div style={{fontSize:'0.74rem',fontWeight:600,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombreEmpresa}</div>
                                {e.emailOrganizacion&&<div style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.emailOrganizacion}</div>}
                            </div>
                            <span style={{fontSize:'0.68rem',color:'#475569',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombreGerente||'—'}</span>
                            <span style={{fontSize:'0.66rem',color:'#64748b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{[e.provincia,e.ciudad].filter(Boolean).join(' › ')||'—'}</span>
                            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                                <span style={{fontSize:'0.55rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>{e.tipoCapital}</span>
                                <span style={{fontSize:'0.55rem',fontWeight:700,color:NARANJA,background:`${NARANJA}10`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>{e.tipoActividad}</span>
                            </div>
                            <span style={{fontSize:'0.60rem',fontWeight:700,color:e.respondio?VERDE:GRIS,background:e.respondio?`${VERDE}10`:`${GRIS}10`,border:`1px solid ${e.respondio?VERDE:GRIS}22`,borderRadius:99,padding:'2px 8px',fontFamily:FONT,whiteSpace:'nowrap'}}>
                                {e.respondio?'✓ Respondió':'Pendiente'}
                            </span>
                        </div>
                    ))}
                    {totalPagT>1&&(
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,paddingTop:10,borderTop:'1px solid #f1f5f9'}}>
                            <span style={{fontSize:'0.65rem',color:'#94a3b8',fontFamily:FONT}}>Mostrando {ini}–{fin} de {empleadoresFiltrados.length}</span>
                            <div style={{display:'flex',gap:4,alignItems:'center'}}>
                                <button className="t5pag" disabled={pagTabla===1} onClick={()=>setPagTabla(p=>p-1)}
                                    style={{width:28,height:28,borderRadius:6,border:'1px solid #e5e7eb',background:'white',color:pagTabla===1?'#d1d5db':'#374151',cursor:pagTabla===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',transition:'all .15s'}}>
                                    <FaChevronLeft/>
                                </button>
                                {Array.from({length:Math.min(totalPagT,5)},(_,i)=>{
                                    const ini2=Math.max(1,Math.min(pagTabla-2,totalPagT-4));
                                    return ini2+i;
                                }).map(p=>(
                                    <button key={p} className="t5pag" onClick={()=>setPagTabla(p)} style={{
                                        width:28,height:28,borderRadius:6,
                                        border:`1px solid ${pagTabla===p?ROJO:'#e5e7eb'}`,
                                        background:pagTabla===p?ROJO:'white',
                                        color:pagTabla===p?'white':'#374151',
                                        cursor:'pointer',fontSize:'0.72rem',
                                        fontWeight:pagTabla===p?700:400,
                                        display:'flex',alignItems:'center',justifyContent:'center',
                                        fontFamily:FONT,transition:'all .15s',
                                    }}>{p}</button>
                                ))}
                                <button className="t5pag" disabled={pagTabla===totalPagT} onClick={()=>setPagTabla(p=>p+1)}
                                    style={{width:28,height:28,borderRadius:6,border:'1px solid #e5e7eb',background:'white',color:pagTabla===totalPagT?'#d1d5db':'#374151',cursor:pagTabla===totalPagT?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',transition:'all .15s'}}>
                                    <FaChevronRight/>
                                </button>
                            </div>
                        </div>
                    )}
                </>}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// PANEL ENCUESTADORES POR EMPRESA
// ═══════════════════════════════════════════════════════════
const PanelEncuestadores=({empleadoresFiltrados,respuestasRaw,fEmp})=>{
    const mapaEnc=useMemo(()=>{
        const m={};
        respuestasRaw.forEach(r=>{
            const eid=r.empleadorId;
            if(!eid) return;
            if(!m[eid]) m[eid]=[];
            m[eid].push({
                encuestaId:      r.encuestaId,
                encuestaTitulo:  r.encuestaTitulo||'Encuesta',
                fechaRespuesta:  r.fechaRespuesta,
                datosEncuestado: r.datosEncuestado||{},
            });
        });
        return m;
    },[respuestasRaw]);

    const empsConResp=useMemo(()=>
        empleadoresFiltrados.filter(e=>mapaEnc[e._id]&&mapaEnc[e._id].length>0)
    ,[empleadoresFiltrados,mapaEnc]);

    const [expandidos,setExpandidos]=useState({});
    useEffect(()=>{setExpandidos({});},[fEmp.provincia,fEmp.ciudad]);
    const toggle=(id)=>setExpandidos(p=>({...p,[id]:!p[id]}));

    // Solo visible cuando hay provincia seleccionada
    if(!fEmp.provincia) return null;
    if(!empsConResp.length) return null;

    const construirGrupos=(emp)=>{
        const respEmp=mapaEnc[emp._id]||[];
        const porEnc={};
        respEmp.forEach(r=>{
            const nombre=(r.datosEncuestado.nombresApellidos||'').trim()||'Encuestador anónimo';
            if(!porEnc[nombre]) porEnc[nombre]={
                nombre,
                cargo:         r.datosEncuestado.cargo||'',
                profesion:     r.datosEncuestado.profesion||'',
                email:         r.datosEncuestado.email||'',
                telefono:      r.datosEncuestado.telefono||'',
                edad:          r.datosEncuestado.edad||null,
                genero:        r.datosEncuestado.genero||'',
                aniosServicio: r.datosEncuestado.aniosServicio||null,
                estudiosEspoch:r.datosEncuestado.estudiosEspoch||'',
                encuestas:[],
            };
            porEnc[nombre].encuestas.push({
                encuestaId: r.encuestaId,
                titulo:     r.encuestaTitulo||'Encuesta',
                fecha:      r.fechaRespuesta,
            });
        });
        return Object.values(porEnc);
    };

    return(
        <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',boxShadow:'0 1px 3px rgba(0,0,0,.05)',overflow:'hidden',marginBottom:14,animationDelay:'140ms'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${MORADO}08,transparent)`,display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:26,height:26,borderRadius:6,background:`${MORADO}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <FaUserTie style={{color:MORADO,fontSize:'0.74rem'}}/>
                </div>
                <div style={{flex:1}}>
                    <div style={{fontSize:'0.80rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Encuestadores por Empresa</div>
                    <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>
                        Personas que completaron encuestas · agrupadas por empresa
                        {fEmp.provincia&&<span style={{color:MORADO,marginLeft:4,fontWeight:600}}>· {fEmp.ciudad||fEmp.provincia}</span>}
                    </div>
                </div>
                <span style={{fontSize:'0.63rem',fontWeight:700,color:MORADO,background:`${MORADO}10`,border:`1px solid ${MORADO}25`,borderRadius:99,padding:'2px 9px',fontFamily:FONT}}>{empsConResp.length} empresa{empsConResp.length!==1?'s':''}</span>
            </div>

            <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
                {empsConResp.map((emp)=>{
                    const grupos=construirGrupos(emp);
                    const abierto=expandidos[emp._id]!==false;
                    const totalEncuestas=mapaEnc[emp._id]?.length||0;
                    const totalEncuestadores=grupos.length;

                    return(
                        <div key={emp._id} style={{border:'1px solid #e2e8f0',borderRadius:9,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,.04)'}}>
                            {/* Header empresa colapsable */}
                            <div className="t5gh" onClick={()=>toggle(emp._id)} style={{
                                padding:'10px 14px',display:'flex',alignItems:'center',gap:10,
                                background:abierto?`${MORADO}05`:'#fafafa',
                                borderBottom:abierto?'1px solid #f1f5f9':'none',
                            }}>
                                <div style={{width:34,height:34,borderRadius:8,background:`${MORADO}15`,border:`1px solid ${MORADO}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    <FaBuilding style={{color:MORADO,fontSize:'0.82rem'}}/>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:'0.78rem',fontWeight:700,color:'#0f172a',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.nombreEmpresa}</div>
                                    <div style={{display:'flex',gap:6,marginTop:2,flexWrap:'wrap',alignItems:'center'}}>
                                        {emp.provincia&&<span style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT}}>{emp.provincia}{emp.ciudad?` › ${emp.ciudad}`:''}</span>}
                                        <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>·</span>
                                        <span style={{fontSize:'0.60rem',fontWeight:600,color:MORADO,fontFamily:FONT}}>{totalEncuestadores} encuestador{totalEncuestadores!==1?'es':''}</span>
                                        <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>·</span>
                                        <span style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT}}>{totalEncuestas} encuesta{totalEncuestas!==1?'s':''} completada{totalEncuestas!==1?'s':''}</span>
                                    </div>
                                </div>
                                <div style={{display:'flex',gap:5,flexShrink:0,alignItems:'center'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:`${VERDE}10`,border:`1px solid ${VERDE}22`,borderRadius:99}}>
                                        <FaCheckCircle style={{color:VERDE,fontSize:'0.54rem'}}/>
                                        <span style={{fontSize:'0.62rem',fontWeight:700,color:VERDE,fontFamily:FONT}}>{totalEncuestas}</span>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:`${MORADO}10`,border:`1px solid ${MORADO}22`,borderRadius:99}}>
                                        <FaUserTie style={{color:MORADO,fontSize:'0.54rem'}}/>
                                        <span style={{fontSize:'0.62rem',fontWeight:700,color:MORADO,fontFamily:FONT}}>{totalEncuestadores}</span>
                                    </div>
                                    <span style={{fontSize:'0.62rem',color:'#94a3b8',fontFamily:FONT,marginLeft:4}}>{abierto?'▲':'▼'}</span>
                                </div>
                            </div>

                            {/* Encuestadores expandidos — grid 2×2 */}
                            {abierto&&(
                                <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                                    {grupos.map((enc,gi)=>{
                                        const color=PALETA[gi%PALETA.length];
                                        return(
                                        <div key={gi} style={{
                                            background:'white',
                                            border:`1px solid ${color}28`,
                                            borderTop:`3px solid ${color}`,
                                            borderRadius:9,padding:'12px',
                                            boxShadow:'0 1px 4px rgba(0,0,0,.05)',
                                            display:'flex',flexDirection:'column',gap:9,
                                        }}>
                                            {/* Cabecera encuestador */}
                                            <div style={{display:'flex',alignItems:'flex-start',gap:9}}>
                                                <div style={{
                                                    width:40,height:40,borderRadius:'50%',
                                                    background:`${color}18`,
                                                    border:`2px solid ${color}35`,
                                                    display:'flex',alignItems:'center',justifyContent:'center',
                                                    flexShrink:0,fontSize:'0.88rem',fontWeight:800,
                                                    color,fontFamily:FONT,
                                                }}>
                                                    {enc.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{flex:1,minWidth:0}}>
                                                    <div style={{fontSize:'0.75rem',fontWeight:700,color:'#0f172a',fontFamily:FONT,lineHeight:1.3}}>{enc.nombre}</div>
                                                    <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
                                                        {enc.cargo&&<span style={{fontSize:'0.60rem',fontWeight:600,color,background:`${color}12`,border:`1px solid ${color}25`,borderRadius:99,padding:'1px 6px',fontFamily:FONT}}>{enc.cargo}</span>}
                                                        {enc.profesion&&<span style={{fontSize:'0.59rem',color:'#64748b',background:'#f1f5f9',borderRadius:99,padding:'1px 6px',fontFamily:FONT}}>{enc.profesion}</span>}
                                                    </div>
                                                </div>
                                                {enc.encuestas.length>1&&(
                                                    <span style={{fontSize:'0.57rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,border:`1px solid ${VERDE}25`,borderRadius:99,padding:'2px 6px',fontFamily:FONT,flexShrink:0,whiteSpace:'nowrap'}}>×{enc.encuestas.length}</span>
                                                )}
                                            </div>

                                            {/* Datos personales en grid 2 columnas pequeño */}
                                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                                                {enc.genero&&(
                                                    <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 6px',background:'#f8fafc',borderRadius:5}}>
                                                        <span style={{fontSize:'0.62rem',color:'#94a3b8'}}>👤</span>
                                                        <span style={{fontSize:'0.60rem',color:'#475569',fontFamily:FONT}}>{enc.genero}</span>
                                                    </div>
                                                )}
                                                {enc.edad&&(
                                                    <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 6px',background:'#f8fafc',borderRadius:5}}>
                                                        <span style={{fontSize:'0.62rem',color:'#94a3b8'}}>🎂</span>
                                                        <span style={{fontSize:'0.60rem',color:'#475569',fontFamily:FONT}}>{enc.edad} años</span>
                                                    </div>
                                                )}
                                                {enc.aniosServicio&&(
                                                    <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 6px',background:'#f8fafc',borderRadius:5}}>
                                                        <span style={{fontSize:'0.62rem',color:'#94a3b8'}}>📅</span>
                                                        <span style={{fontSize:'0.60rem',color:'#475569',fontFamily:FONT}}>{enc.aniosServicio} años serv.</span>
                                                    </div>
                                                )}
                                                {enc.estudiosEspoch&&(
                                                    <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 6px',background:`${ROJO}06`,border:`1px solid ${ROJO}15`,borderRadius:5}}>
                                                        <span style={{fontSize:'0.62rem',color:ROJO}}>🎓</span>
                                                        <span style={{fontSize:'0.59rem',fontWeight:600,color:ROJO,fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{enc.estudiosEspoch}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Contacto */}
                                            {(enc.email||enc.telefono)&&(
                                                <div style={{display:'flex',flexDirection:'column',gap:4,paddingTop:6,borderTop:`1px dashed ${color}20`}}>
                                                    {enc.email&&(
                                                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                                                            <FaEnvelope style={{color:'#94a3b8',fontSize:'0.58rem',flexShrink:0}}/>
                                                            <span style={{fontSize:'0.61rem',color:'#475569',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{enc.email}</span>
                                                        </div>
                                                    )}
                                                    {enc.telefono&&(
                                                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                                                            <span style={{fontSize:'0.58rem',color:'#94a3b8',flexShrink:0}}>📞</span>
                                                            <span style={{fontSize:'0.61rem',color:'#475569',fontFamily:FONT}}>{enc.telefono}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Encuestas completadas */}
                                            <div style={{display:'flex',flexDirection:'column',gap:4,paddingTop:6,borderTop:`1px solid ${color}15`}}>
                                                <div style={{fontSize:'0.58rem',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT,marginBottom:2}}>Encuestas completadas</div>
                                                {enc.encuestas.map((encu,ei2)=>(
                                                    <div key={ei2} style={{
                                                        display:'flex',alignItems:'center',gap:6,
                                                        padding:'5px 8px',
                                                        background:`${VERDE}06`,
                                                        border:`1px solid ${VERDE}20`,
                                                        borderRadius:6,
                                                    }}>
                                                        <FaCheckCircle style={{color:VERDE,fontSize:'0.58rem',flexShrink:0}}/>
                                                        <div style={{flex:1,minWidth:0}}>
                                                            <div style={{fontSize:'0.66rem',fontWeight:600,color:'#1e293b',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{encu.titulo}</div>
                                                            {encu.fecha&&<div style={{display:'flex',alignItems:'center',gap:3,marginTop:1}}>
                                                                <FaCalendarAlt style={{color:'#94a3b8',fontSize:'0.50rem'}}/>
                                                                <span style={{fontSize:'0.57rem',color:'#94a3b8',fontFamily:FONT}}>{fmt(encu.fecha)}</span>
                                                            </div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
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
    const [fEnc,     setFEnc]    =useState({mesAnio:'',encuestaId:'',tipoCapital:''});
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
    const cEnc=useCallback((k,v)=>setFEnc(p=>{
        const n={...p,[k]:v};
        // Al cambiar mes/año resetear encuesta específica
        if(k==='mesAnio') n.encuestaId='';
        return n;
    }),[]);
    const lEmp=useCallback(()=>setFEmp({provincia:'',ciudad:'',tipoCapital:''}),[]);
    const lEnc=useCallback(()=>setFEnc({mesAnio:'',encuestaId:'',tipoCapital:''}),[]);

    const df=useMemo(()=>{
        if(!datos) return null;
        const{encuestas,empleadoresRaw,respuestasRaw,preguntasAgrupadas,kpis}=datos;
        const encC=encuestas.filter(e=>e.estado==='cerrada');

        // ── Filtro mes/año sobre fechaCierre ──────────────────
        const encFiltradas=fEnc.mesAnio
            ? encC.filter(e=>{
                if(!e.fechaCierre) return false;
                const d=new Date(e.fechaCierre);
                const clave=`${d.getMonth()+1}-${d.getFullYear()}`;
                return clave===fEnc.mesAnio;
              })
            : encC;
        const idsC=new Set(encFiltradas.map(e=>e._id));

        let emps=empleadoresRaw;
        if(fEmp.provincia)   emps=emps.filter(e=>norm(e.provincia)===norm(fEmp.provincia));
        if(fEmp.ciudad)      emps=emps.filter(e=>normCanton(e.ciudad||'')===normCanton(fEmp.ciudad));
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

        const todasPregsF=[...comunes,...otras];

        return{
            encC,encFiltradas,empleadoresFiltrados:emps,empleadoresRaw,respuestasRaw,
            porProv,porCiud,porCap,porAct,mitad,ciuD,
            comunes,otras,kE,
            insights:calcularInsights(kE,comunes,otras,encC,empleadoresRaw,respuestasRaw),
            plan:calcularPlan(kE,encC,empleadoresRaw,todasPregsF),
        };
    },[datos,fEmp,fEnc]);

    const opsProv=useMemo(()=>datos?[...new Set(datos.empleadoresRaw.map(e=>e.provincia).filter(Boolean))].sort():[]   ,[datos]);
    const opsCap =useMemo(()=>datos?[...new Set(datos.empleadoresRaw.map(e=>e.tipoCapital).filter(Boolean))].sort():[] ,[datos]);

    // Opciones mes/año desde fechaCierre de encuestas cerradas
    const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const opsMesAnio=useMemo(()=>{
        if(!datos) return [];
        const enc=datos.encuestas.filter(e=>e.estado==='cerrada'&&e.fechaCierre);
        const set=new Set();
        enc.forEach(e=>{
            const d=new Date(e.fechaCierre);
            set.add(`${d.getMonth()+1}-${d.getFullYear()}`);
        });
        return [...set]
            .sort((a,b)=>{
                const [ma,ya]=a.split('-').map(Number);
                const [mb,yb]=b.split('-').map(Number);
                return yb!==ya?yb-ya:mb-ma;
            })
            .map(clave=>{
                const [m,y]=clave.split('-').map(Number);
                return {clave,label:`${MESES[m-1]} ${y}`};
            });
    },[datos]);

    if(cargando) return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:320}}><div style={{width:30,height:30,border:'3px solid #f1f5f9',borderTop:`3px solid ${ROJO}`,borderRadius:'50%',animation:'t5spin .8s linear infinite'}}/><p style={{margin:'14px 0 0',fontSize:'0.78rem',color:'#9ca3af',fontFamily:FONT}}>Cargando...</p></div>;
    if(error)    return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:320}}><FaExclamationTriangle style={{fontSize:'2rem',color:NARANJA,marginBottom:10}}/><p style={{margin:'0 0 14px',fontSize:'0.82rem',color:'#374151',fontFamily:FONT}}>{error}</p><button onClick={cargar} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',background:'white',border:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer',fontSize:'0.74rem',fontWeight:600,color:'#374151',fontFamily:FONT}}><FaSyncAlt style={{fontSize:'0.66rem'}}/>Reintentar</button></div>;
    if(!df) return null;

    const{encC,encFiltradas,empleadoresFiltrados,empleadoresRaw,respuestasRaw,porProv,porCiud,porCap,porAct,mitad,ciuD,comunes,otras,kE,insights,plan}=df;
    const hayFE=Object.values(fEmp).some(v=>v!=='');
    const hayFN=Object.values(fEnc).some(v=>v!=='');
    const sinD={margin:0,fontSize:'0.72rem',color:'#9ca3af',textAlign:'center',padding:'16px 0',fontFamily:FONT};

    return <div style={{fontFamily:FONT,paddingBottom:56}}>

        {/* Tabs */}
        <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',borderBottom:'2px solid #f1f5f9',paddingBottom:10}}>
            {[{id:'empresas',lbl:'Información de Empresas',icon:FaBuilding},{id:'encuestas',lbl:'Resultados de Encuestas',icon:FaChartBar}].map(({id,lbl,icon:I})=>{
                const act=modo===id;
                return <button key={id} className="t5tab" onClick={()=>setModo(id)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:'0.78rem',fontFamily:FONT,border:`2px solid ${act?ROJO:'#e5e7eb'}`,background:act?ROJO:'white',color:act?'white':'#6b7280',fontWeight:act?700:500,boxShadow:act?`0 2px 8px ${ROJO}30`:'none',transition:'all .15s'}}>
                    <I style={{fontSize:'0.72rem'}}/>{lbl}
                </button>;
            })}
        </div>

        {/* ════════ MODO EMPRESAS ════════ */}
        {modo==='empresas'&&<>
            {/* Filtros */}
            <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'10px 14px',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                        <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaFilter style={{color:ROJO,fontSize:'0.60rem'}}/></div>
                        <span style={{fontSize:'0.72rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>Filtrar empresas</span>
                        {hayFE&&<span style={{background:ROJO,color:'white',borderRadius:99,fontSize:'0.55rem',fontWeight:700,padding:'1px 5px',fontFamily:FONT}}>{Object.values(fEmp).filter(v=>v!=='').length}</span>}
                    </div>
                    <div style={{width:1,height:20,background:'#e5e7eb',flexShrink:0}}/>
                    <select value={fEmp.provincia} onChange={e=>cEmp('provincia',e.target.value)} className={`t5sel${fEmp.provincia?' on':''}`} disabled={opsProv.length===0}>
                        <option value="">Provincia</option>{opsProv.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                    {fEmp.provincia&&ciuD.length>0&&<select value={fEmp.ciudad} onChange={e=>cEmp('ciudad',e.target.value)} className={`t5sel${fEmp.ciudad?' on':''}`}>
                        <option value="">Cantón</option>{ciuD.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>}
                    <select value={fEmp.tipoCapital} onChange={e=>cEmp('tipoCapital',e.target.value)} className={`t5sel${fEmp.tipoCapital?' on':''}`} disabled={opsCap.length===0}>
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

            {/* KPIs */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                <KPI icon={FaBuilding}      valor={empleadoresFiltrados.length}                          label="Empleadores"         sub="Registrados activos"     color={ROJO}    delay={0}  />
                <KPI icon={FaCheckCircle}   valor={empleadoresFiltrados.filter(e=>e.respondio).length}   label="Respondieron alguna" sub="Al menos una encuesta"  color={VERDE}   delay={40} />
                <KPI icon={FaTimesCircle}   valor={empleadoresFiltrados.filter(e=>!e.respondio).length}  label="Sin responder"       sub="Ninguna encuesta"       color={NARANJA} delay={80} />
                <KPI icon={FaClipboardList} valor={encC.length}                                          label="Encuestas cerradas"  sub="Con resultados"         color={AZUL}    delay={120}/>
            </div>

            {/* Mapa */}
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
                <div style={{display:'grid',gridTemplateColumns:'1fr 420px 1fr',gap:0,height:480}}>
                    <div style={{borderRight:'1px solid #f1f5f9',overflow:'hidden'}}>
                        <ColIzq filtros={fEmp} porProv={porProv} porCiud={porCiud} total={empleadoresFiltrados.length} mitad={mitad}/>
                    </div>
                    <div style={{padding:'8px',borderLeft:'1px solid #f1f5f9',borderRight:'1px solid #f1f5f9',height:'100%'}}>
                        <MapaEmp porProv={porProv} porCiud={porCiud} filtros={fEmp} geoData={geoData}/>
                    </div>
                    <div style={{overflow:'hidden'}}>
                        <ColDer
                            filtros={fEmp}
                            porProv={porProv}
                            emps={empleadoresRaw}
                            total={empleadoresFiltrados.length}
                            offset={mitad}
                            respuestasRaw={respuestasRaw}
                            encCerradas={encC}
                        />
                    </div>
                </div>
                {/* Composición del sector */}
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

            <TablaEmpresasPaginada empleadoresFiltrados={empleadoresFiltrados} hayFE={hayFE} sinD={sinD} fEmp={fEmp}/>
            <PanelEncuestadores empleadoresFiltrados={empleadoresFiltrados} respuestasRaw={respuestasRaw} fEmp={fEmp}/>
        </>}

        {/* ════════ MODO ENCUESTAS ════════ */}
        {modo==='encuestas'&&<>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
                <KPI icon={FaBuilding}      valor={kE.totalEmps}      label="Empleadores totales" sub="Registrados activos"      color={ROJO}   delay={0}  />
                <KPI icon={FaClipboardList} valor={encC.length}        label="Encuestas cerradas"  sub="Con resultados"          color={AZUL}   delay={40} />
                <KPI icon={FaCheckCircle}   valor={kE.respondieron}    label="Respondieron"        sub={`${kE.tasa}% del total`} color={VERDE}  delay={80} />
                <KPI icon={FaLayerGroup}    valor={comunes.length}     label="Preguntas recurrentes" sub="En 2+ encuestas"       color={MORADO} delay={120}/>
                <KPI icon={FaQuestion}      valor={otras.length}       label="Otras preguntas"     sub="Específicas por encuesta" color={CIAN}  delay={160}/>
            </div>

            {/* Filtros encuestas — cascada: mes/año → tipo empresa → encuesta específica */}
            <div className="t5a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'10px 14px',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    {/* Ícono + label */}
                    <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                        <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <FaFilter style={{color:ROJO,fontSize:'0.60rem'}}/>
                        </div>
                        <span style={{fontSize:'0.72rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>Filtrar resultados</span>
                        {hayFN&&<span style={{background:ROJO,color:'white',borderRadius:99,fontSize:'0.55rem',fontWeight:700,padding:'1px 5px',fontFamily:FONT}}>{Object.values(fEnc).filter(v=>v!=='').length}</span>}
                    </div>
                    <div style={{width:1,height:20,background:'#e5e7eb',flexShrink:0}}/>

                    {/* 1. Mes / Año — desde fechaCierre */}
                    {opsMesAnio.length>0
                        ?<select value={fEnc.mesAnio} onChange={e=>cEnc('mesAnio',e.target.value)} className={`t5sel${fEnc.mesAnio?' on':''}`}>
                            <option value="">Todos los períodos</option>
                            {opsMesAnio.map(o=><option key={o.clave} value={o.clave}>{o.label}</option>)}
                        </select>
                        :<span style={{fontSize:'0.68rem',color:'#94a3b8',fontFamily:FONT}}>Sin períodos disponibles</span>
                    }

                    {/* 2. Tipo de empresa */}
                    <select value={fEnc.tipoCapital} onChange={e=>cEnc('tipoCapital',e.target.value)} className={`t5sel${fEnc.tipoCapital?' on':''}`} disabled={opsCap.length===0} style={{opacity:opsCap.length===0?0.45:1}}>
                        <option value="">Tipo de empresa</option>
                        {opsCap.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* 3. Encuesta específica — filtrada por mes/año si está seleccionado */}
                    {(fEnc.mesAnio?encFiltradas:encC).length>0
                        ?<select value={fEnc.encuestaId} onChange={e=>cEnc('encuestaId',e.target.value)} className={`t5sel${fEnc.encuestaId?' on':''}`} style={{minWidth:200,maxWidth:320}}>
                            <option value="">{fEnc.mesAnio?'Todas de este período':'Todas las encuestas cerradas'}</option>
                            {(fEnc.mesAnio?encFiltradas:encC).map(e=><option key={e._id} value={e._id}>{e.titulo}</option>)}
                        </select>
                        :fEnc.mesAnio&&<span style={{fontSize:'0.68rem',color:'#94a3b8',fontFamily:FONT}}>Sin encuestas en este período</span>
                    }

                    {/* Chips de filtros activos */}
                    {hayFN&&(
                        <>
                            {Object.entries(fEnc).filter(([,v])=>v).map(([k,v])=>{
                                const lblMap={mesAnio:'Período',encuestaId:'Encuesta',tipoCapital:'Tipo'};
                                const lbl=lblMap[k]||k;
                                let display=v;
                                if(k==='mesAnio') display=opsMesAnio.find(o=>o.clave===v)?.label||v;
                                if(k==='encuestaId') display=(fEnc.mesAnio?encFiltradas:encC).find(e=>e._id===v)?.titulo?.slice(0,28)||v;
                                return(
                                    <span key={k} style={{background:`${ROJO}12`,color:ROJO,border:`1px solid ${ROJO}25`,borderRadius:99,fontSize:'0.63rem',fontWeight:600,padding:'2px 7px',fontFamily:FONT,display:'inline-flex',alignItems:'center',gap:3}}>
                                        <span style={{color:'#9ca3af',fontSize:'0.58rem'}}>{lbl}:</span>&nbsp;{display.length>28?display.slice(0,28)+'…':display}
                                        <button onClick={()=>cEnc(k,'')} style={{background:'none',border:'none',color:ROJO,cursor:'pointer',padding:0,fontSize:'0.70rem',lineHeight:1,opacity:0.7}}>×</button>
                                    </span>
                                );
                            })}
                            <button onClick={lEnc} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:'0.65rem',fontFamily:FONT,display:'flex',alignItems:'center',gap:2,padding:'2px 4px'}}>
                                <FaTimes style={{fontSize:'0.55rem'}}/>Limpiar
                            </button>
                        </>
                    )}
                </div>

                {/* Indicador del período activo */}
                {fEnc.mesAnio&&(
                    <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:6}}>
                        <FaCalendarAlt style={{color:AZUL,fontSize:'0.60rem'}}/>
                        <span style={{fontSize:'0.62rem',color:'#475569',fontFamily:FONT}}>
                            Período: <strong style={{color:AZUL}}>{opsMesAnio.find(o=>o.clave===fEnc.mesAnio)?.label}</strong>
                            {' · '}{encFiltradas.length} encuesta{encFiltradas.length!==1?'s':''} en este período
                        </span>
                    </div>
                )}
            </div>

            {comunes.length>0&&<div style={{marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${VERDE}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaLayerGroup style={{color:VERDE,fontSize:'0.78rem'}}/></div>
                    <div>
                        <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Preguntas Recurrentes</div>
                        <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>Aparecen en múltiples encuestas · {comunes.length} grupo{comunes.length!==1?'s':''}</div>
                    </div>
                </div>
                {comunes.map((g,i)=><TarjetaGrupo key={g.id} grupo={g} encuestas={encC} filtros={fEnc} num={i+1}/>)}
            </div>}

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