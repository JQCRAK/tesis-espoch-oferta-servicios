// frontend/src/pages/admin/TabEGraduado.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    FaGraduationCap, FaSyncAlt, FaExclamationTriangle, FaFilter, FaTimes,
    FaClipboardList, FaCheckCircle, FaTimesCircle,
    FaLayerGroup, FaQuestion, FaStar, FaLightbulb, FaBullseye,
    FaTag, FaCommentDots, FaCalendarAlt, FaInfoCircle, FaCodeBranch,
} from 'react-icons/fa';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const ROJO='#BE1E2D', AZUL='#1565C0', VERDE='#2E7D32', NARANJA='#E65100';
const MORADO='#4527A0', CIAN='#00695C', GRIS='#37474F', DORADO='#F57F17';
const PALETA=[ROJO,AZUL,VERDE,NARANJA,MORADO,CIAN,GRIS,DORADO,'#AD1457','#00838F','#558B2F','#4E342E'];

import { leerSesion } from '../../utils/storageSeguro';
const hdrs = () => {
    const u = leerSesion('usuario');
    return { Authorization: `Bearer ${u?.token||''}` };
};

const normTxt = s => s?.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim()??'';
const pct = (v,t) => t===0?0:Math.round((v/t)*100);
const MESES_ARR=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const PALABRAS_INVERTIDAS=['excelente','muy bueno','muy buena','optimo','optima','sobresaliente'];
const esEscalaInvertida = (etiquetaMin='',etiquetaMax='') => {
    const mn = normTxt(etiquetaMin);
    const mx = normTxt(etiquetaMax);
    return (
        PALABRAS_INVERTIDAS.some(p => mn.includes(p)) ||
        mx.includes('insuficiente') || mx.includes('muy malo') || mx.includes('pesimo')
    );
};
const promAjustado = (prom, invertida) => invertida ? (6 - prom) : prom;

if(typeof document!=='undefined'&&!document.getElementById('teg-kf')){
    const st=document.createElement('style');st.id='teg-kf';
    st.textContent=`
        @keyframes teg-spin{to{transform:rotate(360deg);}}
        @keyframes teg-in{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .teg-a{animation:teg-in 0.28s ease both;}
        .teg-sel{padding:5px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:0.73rem;
            font-family:'Segoe UI',system-ui,sans-serif;color:#374151;background:white;outline:none;cursor:pointer;}
        .teg-sel:focus,.teg-sel.on{border-color:#BE1E2D !important;}
        .teg-pag:hover:not(:disabled){background:#BE1E2D !important;color:white !important;border-color:#BE1E2D !important;}
        .teg-gh:hover{background:#f8fafc !important;cursor:pointer;}
    `;
    document.head.appendChild(st);
}

// ═══════════════════════════════════════════════════════════
// NLP FRONTEND
// ═══════════════════════════════════════════════════════════
const STOPWORDS=new Set(['el','la','los','las','un','una','de','del','en','que','y','a','al','se','es','por','con','para','su','sus','lo','le','me','mi','mas','si','pero','no','ya','o','como','hay','muy','ser','son','fue','han','era','esto','esta','este','cada','otro','mismo','puede','debe','hacer','hace','tener','tiene','haber','entre','sobre','sin','nos','nuestro','nuestra']);

function analizarTexto(textos){
    if(!textos?.length) return {palabras:[],temas:[],frases:[]};
    const freq={},bigrams={};
    textos.forEach(t=>{
        if(!t||typeof t!=='string') return;
        const limpio=t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
        if(!limpio) return;
        const words=limpio.split(' ').filter(w=>w.length>3&&!STOPWORDS.has(w));
        words.forEach(w=>{freq[w]=(freq[w]||0)+1;});
        for(let i=0;i<words.length-1;i++){const bg=`${words[i]} ${words[i+1]}`;bigrams[bg]=(bigrams[bg]||0)+1;}
    });
    const palabras=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([w,c])=>({word:w,count:c}));
    const frases=Object.entries(bigrams).filter(([,v])=>v>=2).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([bg,c])=>({frase:bg,count:c}));
    const TEMAS={
        'Habilidades técnicas':['programacion','lenguajes','tecnologias','herramientas','software','desarrollo','codigo','bases','datos','sistemas','redes','seguridad'],
        'Habilidades blandas':['comunicacion','trabajo','equipo','liderazgo','gestion','proyectos','tiempo','organizacion','creatividad','responsabilidad'],
        'Empleabilidad':['empleo','trabajo','empresa','laboral','oportunidades','mercado','experiencia','practica','pasantias'],
        'Formación académica':['formacion','pensum','cursos','materias','practicas','proyectos','investigacion','tesis','universidad'],
        'Emprendimiento':['emprendimiento','negocios','innovacion','startup','empresa','administracion','finanzas'],
        'Idiomas':['ingles','idiomas','certificaciones','bilingue','internacional'],
        'Posgrado':['maestria','especializacion','doctorado','posgrado','diplomado','beca'],
    };
    const temaConteo={};
    Object.entries(TEMAS).forEach(([tema,kws])=>{let cnt=0;kws.forEach(kw=>{cnt+=(freq[kw]||0);});if(cnt>0)temaConteo[tema]=cnt;});
    const temas=Object.entries(temaConteo).sort((a,b)=>b[1]-a[1]).map(([tema,count],i)=>({tema,count,color:PALETA[i%PALETA.length]}));
    return{palabras,temas,frases,total:textos.length};
}

// ═══════════════════════════════════════════════════════════
// COMPONENTES BASE
// ═══════════════════════════════════════════════════════════
const KPI=({icon:I,valor,label,sub,color,delay=0})=>(
    <div className="teg-a" style={{background:'white',borderRadius:10,padding:'10px 13px',border:'1px solid #e5e7eb',borderLeft:`4px solid ${color}`,boxShadow:'0 1px 3px rgba(0,0,0,.05)',display:'flex',alignItems:'center',gap:10,animationDelay:`${delay}ms`}}>
        <div style={{width:32,height:32,borderRadius:8,background:`${color}14`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><I style={{color,fontSize:'0.84rem'}}/></div>
        <div>
            <div style={{fontSize:'1.25rem',fontWeight:800,color:'#0f172a',lineHeight:1,fontFamily:FONT}}>{valor}</div>
            <div style={{fontSize:'0.63rem',fontWeight:600,color:'#6b7280',fontFamily:FONT,marginTop:2}}>{label}</div>
            {sub&&<div style={{fontSize:'0.57rem',color:'#9ca3af',fontFamily:FONT,marginTop:1}}>{sub}</div>}
        </div>
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
        ok:  {I:FaCheckCircle,       color:VERDE,  bg:'#f0fdf4',bd:'#bbf7d0',lbl:'Fortaleza'},
        warn:{I:FaExclamationTriangle,color:NARANJA,bg:'#fff7ed',bd:'#fed7aa',lbl:'Atención'},
        crit:{I:FaTimesCircle,        color:ROJO,   bg:'#fef2f2',bd:'#fecaca',lbl:'Crítico'},
        info:{I:FaLightbulb,          color:AZUL,   bg:'#eff6ff',bd:'#bfdbfe',lbl:'Sugerencia'},
    }[tipo]||{I:FaLightbulb,color:AZUL,bg:'#eff6ff',bd:'#bfdbfe',lbl:'Info'};
    const{I}=cfg;
    return <div className="teg-a" style={{background:cfg.bg,border:`1px solid ${cfg.bd}`,borderLeft:`3px solid ${cfg.color}`,borderRadius:7,padding:'8px 11px',display:'flex',gap:8,alignItems:'flex-start',animationDelay:`${delay}ms`}}>
        <I style={{color:cfg.color,fontSize:'0.82rem',flexShrink:0,marginTop:1}}/>
        <div>
            <span style={{fontSize:'0.58rem',fontWeight:700,color:cfg.color,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:FONT}}>{cfg.lbl} · </span>
            <span style={{fontSize:'0.76rem',fontWeight:600,color:'#0f172a',fontFamily:FONT}}>{titulo}</span>
            {detalle&&<p style={{margin:'2px 0 0',fontSize:'0.68rem',color:'#6b7280',fontFamily:FONT,lineHeight:1.5}}>{detalle}</p>}
        </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════
// GRÁFICAS
// ═══════════════════════════════════════════════════════════
const GEscala=({resps,min='',max=''})=>{
    const vals=resps.map(r=>Number(r.valor)).filter(v=>v>=1&&v<=5);
    if(!vals.length) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const invertida = esEscalaInvertida(min, max);
    const c={1:0,2:0,3:0,4:0,5:0};
    vals.forEach(v=>c[v]++);
    const mx=Math.max(...Object.values(c),1);
    const promReal=(vals.reduce((s,v)=>s+v,0)/vals.length);
    const promMostrar=promReal.toFixed(2);
    const col = invertida
        ? {1:'#16a34a',2:'#22c55e',3:'#eab308',4:'#f97316',5:'#ef4444'}
        : {1:'#ef4444',2:'#f97316',3:'#eab308',4:'#22c55e',5:'#16a34a'};
    const promAdj = promAjustado(promReal, invertida);
    const colorProm = promAdj>=4.0?VERDE:promAdj>=3.0?NARANJA:ROJO;
    const interpretacion = invertida
        ? (promReal<=1.5?'Excelente':promReal<=2.5?'Muy Bueno':promReal<=3.5?'Bueno':promReal<=4.5?'Regular':'Insuficiente')
        : (promReal>=4.5?'Muy alto':promReal>=3.5?'Alto':promReal>=2.5?'Moderado':promReal>=1.5?'Bajo':'Muy bajo');
    return <div>
        {invertida&&<div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 9px',background:`${AZUL}08`,border:`1px solid ${AZUL}20`,borderRadius:6,marginBottom:10}}>
            <FaInfoCircle style={{color:AZUL,fontSize:'0.68rem',flexShrink:0}}/>
            <span style={{fontSize:'0.62rem',color:AZUL,fontFamily:FONT,fontWeight:500}}>Escala invertida — <strong>1 = Excelente</strong>, 5 = Insuficiente.</span>
        </div>}
        <div style={{display:'flex',gap:6,alignItems:'flex-end',marginBottom:10}}>
            {[1,2,3,4,5].map(n=>{
                const h=Math.max(4,Math.round((c[n]/mx)*64));
                const etq = invertida ? ['Exc','Muy B','Bueno','Reg','Insuf'][n-1] : String(n);
                return <div key={n} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <span style={{fontSize:'0.60rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>{c[n]}</span>
                    <div style={{width:'100%',height:h,backgroundColor:col[n],borderRadius:'3px 3px 0 0'}}/>
                    <span style={{fontSize:invertida?'0.52rem':'0.62rem',fontWeight:700,color:col[n],fontFamily:FONT,textAlign:'center',lineHeight:1.2}}>{etq}</span>
                </div>;
            })}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
            <span style={{fontSize:'0.60rem',color:'#94a3b8',fontFamily:FONT}}>{min||'1=Muy bajo'}</span>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <div style={{background:`${colorProm}10`,border:`1px solid ${colorProm}25`,borderRadius:6,padding:'3px 9px',display:'inline-flex',alignItems:'center',gap:5}}>
                    <FaStar style={{color:DORADO,fontSize:'0.58rem'}}/>
                    <span style={{fontSize:'0.68rem',fontWeight:700,color:colorProm,fontFamily:FONT}}>Promedio: {promMostrar}</span>
                </div>
                <span style={{fontSize:'0.62rem',fontWeight:600,color:colorProm,background:`${colorProm}10`,borderRadius:99,padding:'2px 7px',fontFamily:FONT,border:`1px solid ${colorProm}25`}}>{interpretacion}</span>
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
    return <div>
        {lista.map(([op,cnt],i)=><Barra key={i} label={op} valor={cnt} total={total} color={PALETA[i%PALETA.length]} compact/>)}
        <div style={{marginTop:6,fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>{total} respuesta{total!==1?'s':''}{tipo==='checkboxes'?' (múltiple)':''}</div>
    </div>;
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

const GMatriz=({resps,items,tipo,min='',max=''})=>{
    if(!resps.length||!items?.length) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const invertida = esEscalaInvertida(min, max);
    const pi={};items.forEach((_,idx)=>{pi[idx]={votos:{}};});
    resps.forEach(r=>{const arr=Array.isArray(r.valor)?r.valor:[];arr.forEach(({indice,valor})=>{if(pi[indice]!==undefined){const k=String(valor);pi[indice].votos[k]=(pi[indice].votos[k]||0)+1;}});});
    const cols=tipo==='escala'?[1,2,3,4,5]:[];
    const cH = invertida
        ? {1:'#bbf7d0',2:'#dcfce7',3:'#fef9c3',4:'#fef3c7',5:'#fee2e2'}
        : {1:'#fee2e2',2:'#fef3c7',3:'#fef9c3',4:'#dcfce7',5:'#bbf7d0'};
    return <div style={{overflowX:'auto'}}>
        {invertida&&<div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 9px',background:`${AZUL}08`,border:`1px solid ${AZUL}20`,borderRadius:6,marginBottom:8}}>
            <FaInfoCircle style={{color:AZUL,fontSize:'0.68rem',flexShrink:0}}/>
            <span style={{fontSize:'0.62rem',color:AZUL,fontFamily:FONT,fontWeight:500}}>Escala invertida — <strong>1 = {min||'Excelente'}</strong></span>
        </div>}
        {tipo==='escala'&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:'0.58rem',color:'#94a3b8',fontFamily:FONT}}>{min||'1=Bajo'}</span>
            <span style={{fontSize:'0.58rem',color:'#94a3b8',fontFamily:FONT}}>{max||'5=Alto'}</span>
        </div>}
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
                    const promR=totI>0?cols.reduce((s,c)=>s+(c*(vo[c]||0)),0)/totI:null;
                    const promAdj=promR!==null?promAjustado(promR,invertida):null;
                    const colorProm=promAdj===null?GRIS:promAdj>=4.0?VERDE:promAdj>=3.0?NARANJA:ROJO;
                    return <tr key={idx} style={{background:idx%2===0?'#fafafa':'white'}}>
                        <td style={{padding:'6px 8px',color:'#374151',lineHeight:1.4,fontWeight:500}}>{item}</td>
                        {cols.map(c=>{const v=vo[c]||0;return <td key={c} style={{textAlign:'center',padding:'6px 4px',background:v>0?cH[c]:'transparent',fontWeight:v>0?700:400,color:v>0?'#374151':'#d1d5db'}}>{v>0?v:'·'}</td>;})}
                        <td style={{textAlign:'center',padding:'6px 6px',fontWeight:700,color:colorProm}}>{promR!==null?promR.toFixed(1):'—'}</td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;
};

const GraficaTextoNLP=({resps})=>{
    const textos=useMemo(()=>resps.map(r=>r.valor).filter(v=>v&&String(v).trim().length>2),[resps]);
    const{palabras,temas,frases,total}=useMemo(()=>analizarTexto(textos),[textos]);
    if(!total) return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Sin respuestas</p>;
    const maxFreq=palabras[0]?.count||1;
    return <div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:`${AZUL}08`,border:`1px solid ${AZUL}20`,borderRadius:8,marginBottom:12}}>
            <FaCommentDots style={{color:AZUL,fontSize:'0.78rem',flexShrink:0}}/>
            <div>
                <div style={{fontSize:'0.72rem',fontWeight:700,color:AZUL,fontFamily:FONT}}>Análisis NLP · {total} respuesta{total!==1?'s':''}</div>
                <div style={{fontSize:'0.60rem',color:'#64748b',fontFamily:FONT}}>Detección automática de patrones y temas</div>
            </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
                <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Palabras frecuentes</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,alignItems:'center',minHeight:80}}>
                    {palabras.slice(0,20).map((p,i)=>{
                        const size=0.62+((p.count/maxFreq)*0.55);
                        const color=PALETA[i%PALETA.length];
                        return <span key={i} style={{fontSize:`${size}rem`,fontWeight:p.count===maxFreq?800:700,color,opacity:0.5+((p.count/maxFreq)*0.5),fontFamily:FONT,padding:'2px 6px',borderRadius:99,background:`${color}12`,border:`1px solid ${color}22`}} title={`${p.word}: ${p.count}×`}>{p.word}</span>;
                    })}
                </div>
                {frases.length>0&&<div style={{marginTop:10}}>
                    <p style={{margin:'0 0 6px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Frases recurrentes</p>
                    {frases.slice(0,5).map((f,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,padding:'4px 8px',background:i%2===0?'#f8fafc':'white',borderRadius:5}}>
                        <FaTag style={{color:PALETA[i%PALETA.length],fontSize:'0.55rem',flexShrink:0}}/>
                        <span style={{fontSize:'0.70rem',color:'#374151',flex:1,fontFamily:FONT,textTransform:'capitalize'}}>{f.frase}</span>
                        <span style={{fontSize:'0.62rem',fontWeight:700,color:PALETA[i%PALETA.length],background:`${PALETA[i%PALETA.length]}12`,borderRadius:99,padding:'1px 6px',fontFamily:FONT}}>{f.count}×</span>
                    </div>)}
                </div>}
            </div>
            <div>
                <p style={{margin:'0 0 8px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Temas detectados</p>
                {temas.length>0
                    ?temas.map((t,i)=><Barra key={i} label={t.tema} valor={t.count} total={palabras.reduce((s,p)=>s+p.count,1)} color={t.color} compact/>)
                    :<p style={{margin:0,fontSize:'0.68rem',color:'#9ca3af',fontFamily:FONT}}>Sin temas detectados.</p>
                }
                {palabras.length>0&&<div style={{marginTop:10}}>
                    <p style={{margin:'0 0 6px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Top 8 términos</p>
                    {palabras.slice(0,8).map((p,i)=><Barra key={i} label={p.word} valor={p.count} total={maxFreq} color={PALETA[i%PALETA.length]} compact/>)}
                </div>}
            </div>
        </div>
        <div style={{marginTop:12,borderTop:'1px solid #f1f5f9',paddingTop:10}}>
            <p style={{margin:'0 0 6px',fontSize:'0.63rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:FONT}}>Muestra de respuestas</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {textos.filter(t=>t.length>20).slice(0,4).map((t,i)=><div key={i} style={{padding:'7px 10px',background:i%2===0?'#f8fafc':'#fff7f7',borderRadius:7,border:'1px solid #e5e7eb',fontSize:'0.69rem',color:'#374151',fontFamily:FONT,lineHeight:1.55,fontStyle:'italic'}}>"{t.slice(0,120)}{t.length>120?'...':''}"</div>)}
            </div>
        </div>
    </div>;
};

const GraficaPregunta=({grupo,filtros})=>{
    const resps=useMemo(()=>{
        let r=grupo.respuestasRaw||[];
        if(filtros.encuestaId)     r=r.filter(x=>x.encuestaId===filtros.encuestaId);
        if(filtros.anioGraduacion) r=r.filter(x=>String(x.anioGraduacion)===filtros.anioGraduacion);
        if(filtros.genero)         r=r.filter(x=>normTxt(x.genero||'')===normTxt(filtros.genero));
        return r;
    },[grupo.respuestasRaw,filtros]);

    if(grupo.esMatriz) return <GMatriz resps={resps} items={grupo.items} tipo={grupo.tipo} min={grupo.etiquetaMin} max={grupo.etiquetaMax}/>;
    switch(grupo.tipo){
        case 'escala':           return <GEscala resps={resps} min={grupo.etiquetaMin} max={grupo.etiquetaMax}/>;
        case 'opcion_multiple':
        case 'checkboxes':       return <GOpciones resps={resps} tipo={grupo.tipo}/>;
        case 'si_no':            return <GSiNo resps={resps}/>;
        case 'texto_libre':      return <GraficaTextoNLP resps={resps}/>;
        case 'numero':           return <GNumero resps={resps}/>;
        default:                 return <p style={{margin:0,fontSize:'0.70rem',color:'#9ca3af',fontFamily:FONT}}>Tipo no visualizable</p>;
    }
};

const TipoBadge=({tipo,esMatriz})=>{
    const cfg={escala:{lbl:'Escala',c:AZUL},opcion_multiple:{lbl:'Opción',c:VERDE},checkboxes:{lbl:'Múltiple',c:CIAN},si_no:{lbl:'Sí/No',c:NARANJA},texto_libre:{lbl:'Texto · NLP',c:MORADO},numero:{lbl:'Número',c:DORADO}}[tipo]||{lbl:tipo,c:GRIS};
    return <span style={{fontSize:'0.58rem',fontWeight:700,color:cfg.c,background:`${cfg.c}12`,border:`1px solid ${cfg.c}25`,borderRadius:99,padding:'2px 7px',fontFamily:FONT,whiteSpace:'nowrap'}}>{esMatriz?`${cfg.lbl} · Tabla`:cfg.lbl}</span>;
};

const TarjetaGrupo=({grupo,encuestas,filtros,num})=>{
    const[open,setOpen]=useState(true);
    const aparece=encuestas.filter(e=>grupo.encuestasAparece.includes(e._id)).map(e=>e.titulo);
    const cnt=useMemo(()=>{
        let r=grupo.respuestasRaw||[];
        if(filtros.encuestaId)     r=r.filter(x=>x.encuestaId===filtros.encuestaId);
        if(filtros.anioGraduacion) r=r.filter(x=>String(x.anioGraduacion)===filtros.anioGraduacion);
        if(filtros.genero)         r=r.filter(x=>normTxt(x.genero||'')===normTxt(filtros.genero));
        return r.length;
    },[grupo.respuestasRaw,filtros]);
    const invertida = grupo.tipo==='escala' && esEscalaInvertida(grupo.etiquetaMin||'', grupo.etiquetaMax||'');

    return <div className="teg-a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:10}}>
        <div className="teg-gh" onClick={()=>setOpen(a=>!a)} style={{padding:'10px 14px',display:'flex',alignItems:'flex-start',gap:10,background:open?`${ROJO}04`:'white',borderBottom:open?'1px solid #f1f5f9':'none'}}>
            <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                <span style={{fontSize:'0.60rem',fontWeight:800,color:ROJO,fontFamily:FONT}}>{num}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.79rem',fontWeight:600,color:'#0f172a',fontFamily:FONT,flex:1,lineHeight:1.4}}>{grupo.textoCanonical}</span>
                    <div style={{display:'flex',gap:5,flexShrink:0,flexWrap:'wrap'}}>
                        <TipoBadge tipo={grupo.tipo} esMatriz={grupo.esMatriz}/>
                        {grupo.esComun&&<span style={{fontSize:'0.58rem',fontWeight:700,color:VERDE,background:`${VERDE}10`,border:`1px solid ${VERDE}25`,borderRadius:99,padding:'2px 7px',fontFamily:FONT}}>Recurrente</span>}
                        {invertida&&<span style={{fontSize:'0.58rem',fontWeight:700,color:AZUL,background:`${AZUL}10`,border:`1px solid ${AZUL}25`,borderRadius:99,padding:'2px 7px',fontFamily:FONT}}>⚠ Invertida</span>}
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
// TARJETA CONDICIONAL — NUEVA
// ═══════════════════════════════════════════════════════════
const LADO_CFG = {
    si: { color: VERDE,  bg: '#f0fdf4', bd: '#bbf7d0', label: 'Si respondieron "SÍ"'  },
    no: { color: ROJO,   bg: '#fef2f2', bd: '#fecaca', label: 'Si respondieron "NO"'  },
};

const TarjetaCondicional = ({ grupo, encuestas, filtros, num }) => {
    const [open, setOpen] = useState(true);
    const lado = LADO_CFG[grupo.ladoPadre] || LADO_CFG.si;

    const cnt = useMemo(() => {
        let r = grupo.respuestasRaw || [];
        if (filtros.encuestaId)     r = r.filter(x => x.encuestaId === filtros.encuestaId);
        if (filtros.anioGraduacion) r = r.filter(x => String(x.anioGraduacion) === filtros.anioGraduacion);
        if (filtros.genero)         r = r.filter(x => normTxt(x.genero || '') === normTxt(filtros.genero));
        return r.length;
    }, [grupo.respuestasRaw, filtros]);

    return (
        <div className="teg-a" style={{
            background: 'white', borderRadius: 10,
            border: `1px solid ${lado.bd}`,
            borderLeft: `4px solid ${lado.color}`,
            overflow: 'hidden', marginBottom: 8,
        }}>
            <div className="teg-gh" onClick={() => setOpen(a => !a)} style={{
                padding: '9px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                background: open ? `${lado.color}06` : 'white',
                borderBottom: open ? `1px solid ${lado.bd}` : 'none',
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Badges: lado + tipo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '0.56rem', fontWeight: 700, color: lado.color,
                            background: lado.bg, border: `1px solid ${lado.bd}`,
                            borderRadius: 99, padding: '1px 7px', fontFamily: FONT,
                        }}>{lado.label}</span>
                        <TipoBadge tipo={grupo.tipo} esMatriz={false} />
                    </div>
                    {/* Pregunta padre — contexto */}
                    <div style={{ fontSize: '0.60rem', color: '#94a3b8', fontFamily: FONT, marginBottom: 3 }}>
                        ↳ <em>{grupo.textoPadre?.slice(0, 80)}{grupo.textoPadre?.length > 80 ? '…' : ''}</em>
                    </div>
                    {/* Texto de la subpregunta */}
                    <span style={{ fontSize: '0.79rem', fontWeight: 600, color: '#0f172a', fontFamily: FONT, lineHeight: 1.4 }}>
                        {num}. {grupo.textoCanonical}
                    </span>
                    <div style={{ marginTop: 3, fontSize: '0.60rem', color: '#94a3b8', fontFamily: FONT }}>
                        {cnt} respuesta{cnt !== 1 ? 's' : ''}
                    </div>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', flexShrink: 0, padding: '2px 5px', fontFamily: FONT }}>
                    {open ? '▲' : '▼'}
                </div>
            </div>
            {open && (
                <div style={{ padding: '12px 14px' }}>
                    <GraficaPregunta grupo={grupo} filtros={filtros} />
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// ANÁLISIS DINÁMICO
// ═══════════════════════════════════════════════════════════
const promedioEscalaConInfo = (resps, etiquetaMin='', etiquetaMax='') => {
    const vals = resps.map(r=>Number(r.valor)).filter(v=>v>=1&&v<=5);
    if(!vals.length) return null;
    const promReal = vals.reduce((a,b)=>a+b,0) / vals.length;
    const invertida = esEscalaInvertida(etiquetaMin, etiquetaMax);
    return { promReal, promAdj: promAjustado(promReal, invertida), invertida, n: vals.length };
};

const calcularInsightsGraduados=(kpis,comunes,otras,encCerradas,graduadosRaw)=>{
    const ins=[];
    const todasPregs=[...comunes,...otras];
    const{tasa,totalGraduados,graduadosRespondieron}=kpis;
    const sinResponder=totalGraduados-graduadosRespondieron;

    if(tasa>=80)        ins.push({tipo:'ok',  titulo:`Alta participación: ${tasa}% (${graduadosRespondieron}/${totalGraduados})`,detalle:`Solo ${sinResponder} graduado${sinResponder!==1?'s':''} no respondió.`});
    else if(tasa>=60)   ins.push({tipo:'warn',titulo:`Participación moderada: ${tasa}% (${graduadosRespondieron}/${totalGraduados})`,detalle:`${sinResponder} graduados no respondieron.`});
    else if(tasa>=30)   ins.push({tipo:'crit',titulo:`Participación baja: ${tasa}%`,detalle:`Solo ${graduadosRespondieron} de ${totalGraduados} respondieron.`});
    else if(tasa>0)     ins.push({tipo:'crit',titulo:`Participación crítica: ${tasa}%`,detalle:'Urgente revisar estrategia de convocatoria.'});

    const porGenero={};
    graduadosRaw.forEach(g=>{const gen=g.genero||'Sin especificar';if(!porGenero[gen])porGenero[gen]={total:0,respondieron:0};porGenero[gen].total++;if(g.respondio)porGenero[gen].respondieron++;});
    const genEntries=Object.entries(porGenero).filter(([,v])=>v.total>=3);
    if(genEntries.length>=2){
        genEntries.sort((a,b)=>(b[1].respondieron/b[1].total)-(a[1].respondieron/a[1].total));
        const mejor=genEntries[0],peor=genEntries[genEntries.length-1];
        const pMejor=Math.round(mejor[1].respondieron/mejor[1].total*100);
        const pPeor=Math.round(peor[1].respondieron/peor[1].total*100);
        if(pMejor-pPeor>=20) ins.push({tipo:'info',titulo:'Brecha de participación por género',detalle:`${mejor[0]}: ${pMejor}% · ${peor[0]}: ${pPeor}%.`});
    }

    const porAnio={};
    graduadosRaw.forEach(g=>{const a=String(g.anioGraduacion||'');if(!a)return;if(!porAnio[a])porAnio[a]={total:0,respondieron:0};porAnio[a].total++;if(g.respondio)porAnio[a].respondieron++;});
    const anioEntries=Object.entries(porAnio).filter(([,v])=>v.total>=2).sort((a,b)=>Number(b[0])-Number(a[0]));
    if(anioEntries.length>=1){
        const masReciente=anioEntries[0];
        const pR=Math.round(masReciente[1].respondieron/masReciente[1].total*100);
        if(pR<50)   ins.push({tipo:'warn',titulo:`Baja participación de graduados ${masReciente[0]}: ${pR}%`,detalle:'Considerar comunicación directa.'});
        else if(pR>=80) ins.push({tipo:'ok',titulo:`Alta participación de graduados ${masReciente[0]}: ${pR}%`,detalle:'Alto compromiso de los más recientes.'});
    }

    const pregsEscala=todasPregs.filter(g=>g.tipo==='escala'&&g.respuestasRaw?.length>=3);
    if(pregsEscala.length>0){
        const conInfo=pregsEscala
            .map(g=>{const info=promedioEscalaConInfo(g.respuestasRaw,g.etiquetaMin||'',g.etiquetaMax||'');if(!info)return null;return{texto:g.textoCanonical,invertida:info.invertida,...info};})
            .filter(Boolean).sort((a,b)=>a.promAdj-b.promAdj);
        if(conInfo.length>0){
            const peor=conInfo[0],mejor=conInfo[conInfo.length-1];
            const textoPromPeor=`${peor.promReal.toFixed(2)}/5`;
            const textoPromMejor=`${mejor.promReal.toFixed(2)}/5`;
            if(peor.promAdj<3.0) ins.push({tipo:'crit',titulo:`Área crítica: "${peor.texto.slice(0,55)}…"`,detalle:`Promedio ${textoPromPeor} en ${peor.n} respuestas.`});
            else if(peor.promAdj<3.5) ins.push({tipo:'warn',titulo:`Área de mejora: "${peor.texto.slice(0,55)}…"`,detalle:`Promedio ${textoPromPeor}.`});
            if(mejor.promAdj>=4.0&&conInfo.length>1) ins.push({tipo:'ok',titulo:`Fortaleza: "${mejor.texto.slice(0,55)}…"`,detalle:`Promedio ${textoPromMejor} en ${mejor.n} respuestas.`});
            if(conInfo.length>=3&&(mejor.promAdj-peor.promAdj)>=1.5) ins.push({tipo:'info',titulo:`Alta dispersión entre indicadores (rango ${(mejor.promAdj-peor.promAdj).toFixed(1)} pts)`,detalle:'Percepciones diferenciadas.'});
            const invertidas=conInfo.filter(c=>c.invertida);
            if(invertidas.length>0) ins.push({tipo:'info',titulo:`${invertidas.length} pregunta${invertidas.length!==1?'s':''} con escala invertida`,detalle:'Los análisis usan valor ajustado.'});
        }
    }

    todasPregs.filter(g=>g.tipo==='si_no'&&g.respuestasRaw?.length>=2).forEach(g=>{
        const si=g.respuestasRaw.filter(r=>r.valor==='Sí').length;
        const total=g.respuestasRaw.length;
        const pctSi=Math.round(si/total*100);
        const texto=g.textoCanonical.slice(0,55)+(g.textoCanonical.length>55?'…':'');
        if(pctSi<=25)  ins.push({tipo:'crit',titulo:`Solo ${pctSi}% respondió "Sí": "${texto}"`,detalle:`${si} de ${total} afirmativas.`});
        else if(pctSi>=80) ins.push({tipo:'ok',titulo:`${pctSi}% respondió "Sí": "${texto}"`,detalle:`Consenso elevado: ${si} de ${total}.`});
    });

    if(encCerradas.length>=2){
        const encOrdenadas=[...encCerradas].sort((a,b)=>new Date(a.fechaCierre)-new Date(b.fechaCierre));
        const idAntigua=encOrdenadas[0]._id,idReciente=encOrdenadas[encOrdenadas.length-1]._id;
        let mejora=0,empeora=0;
        todasPregs.filter(g=>g.esComun&&g.tipo==='escala').forEach(g=>{
            const infoA=promedioEscalaConInfo(g.respuestasRaw.filter(r=>r.encuestaId===idAntigua),g.etiquetaMin||'',g.etiquetaMax||'');
            const infoR=promedioEscalaConInfo(g.respuestasRaw.filter(r=>r.encuestaId===idReciente),g.etiquetaMin||'',g.etiquetaMax||'');
            if(infoA&&infoR){if(infoR.promAdj>infoA.promAdj+0.2)mejora++;else if(infoR.promAdj<infoA.promAdj-0.2)empeora++;}
        });
        if(mejora>empeora)      ins.push({tipo:'ok',  titulo:`Tendencia positiva: ${mejora} indicador${mejora!==1?'es':''} mejoró`,detalle:`"${encOrdenadas[0].titulo}" → "${encOrdenadas[encOrdenadas.length-1].titulo}".`});
        else if(empeora>mejora) ins.push({tipo:'warn', titulo:`Tendencia negativa: ${empeora} indicador${empeora!==1?'es':''} empeoró`,detalle:'Analizar factores del contexto.'});
        ins.push({tipo:'ok',titulo:`${encCerradas.length} encuestas cerradas — análisis longitudinal activo`,detalle:'Mantener preguntas comunes para seguimiento.'});
    } else if(encCerradas.length===1){
        ins.push({tipo:'info',titulo:'1 encuesta cerrada — base de datos inicial',detalle:'Con la segunda se activará el análisis longitudinal.'});
    }

    const pregsTexto=todasPregs.filter(g=>g.tipo==='texto_libre');
    if(pregsTexto.length>0){
        const prom=Math.round(pregsTexto.reduce((s,g)=>s+(g.respuestasRaw?.length||0),0)/pregsTexto.length);
        if(prom>=5)    ins.push({tipo:'ok',  titulo:`Buena cobertura cualitativa: ~${prom} respuestas/pregunta`,detalle:'Volumen suficiente para NLP confiable.'});
        else if(prom>0)ins.push({tipo:'info',titulo:`Cobertura cualitativa limitada: ~${prom} respuesta${prom!==1?'s':''}/pregunta`,detalle:'Con más respuestas el NLP mejora.'});
    }
    return ins;
};

const calcularPlanGraduados=(kpis,encCerradas,graduadosRaw,todasPregs)=>{
    const plan=[];let prioridad=1;
    const{tasa,totalGraduados,graduadosRespondieron}=kpis;
    if(tasa<40)          plan.push({prioridad:prioridad++,accion:'Campaña urgente de convocatoria',impacto:'alto',meta:`${totalGraduados-graduadosRespondieron} sin responder`});
    if(tasa>=40&&tasa<70)plan.push({prioridad:prioridad++,accion:'Recordatorio por email a graduados pendientes',impacto:'medio',meta:`${totalGraduados-graduadosRespondieron} por contactar`});
    if(encCerradas.length===0)plan.push({prioridad:prioridad++,accion:'Cerrar la encuesta activa',impacto:'alto',meta:'Los gráficos solo operan sobre encuestas cerradas'});
    const debiles=(todasPregs||[]).filter(g=>g.tipo==='escala'&&g.respuestasRaw?.length>=2).map(g=>{const info=promedioEscalaConInfo(g.respuestasRaw,g.etiquetaMin||'',g.etiquetaMax||'');if(!info)return null;return{texto:g.textoCanonical,promAdj:info.promAdj};}).filter(x=>x&&x.promAdj<3.5).sort((a,b)=>a.promAdj-b.promAdj);
    if(debiles.length>0){const d=debiles[0];plan.push({prioridad:prioridad++,accion:`Plan de mejora para ${debiles.length} área${debiles.length!==1?'s':''} con valoración baja`,impacto:'alto',meta:`"${d.texto.slice(0,45)}…" — prom. ajustado ${d.promAdj.toFixed(2)}/5`});}
    if(encCerradas.length===1)plan.push({prioridad:prioridad++,accion:'Mantener preguntas en la próxima encuesta',impacto:'medio',meta:'Habilitar análisis longitudinal'});
    const porAnio={};
    (graduadosRaw||[]).forEach(g=>{const a=String(g.anioGraduacion||'');if(!a)return;if(!porAnio[a])porAnio[a]={total:0,respondieron:0};porAnio[a].total++;if(g.respondio)porAnio[a].respondieron++;});
    const anioDebil=Object.entries(porAnio).filter(([,v])=>v.total>=2&&Math.round(v.respondieron/v.total*100)<40);
    if(anioDebil.length>0){const[anio,datos]=anioDebil[0];plan.push({prioridad:prioridad++,accion:`Reforzar comunicación con promoción ${anio}`,impacto:'medio',meta:`Solo ${Math.round(datos.respondieron/datos.total*100)}% respondió`});}
    return plan;
};

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
const TabEGraduado=()=>{
    const[datos,    setDatos]   =useState(null);
    const[cargando, setCargando]=useState(true);
    const[error,    setError]   =useState('');
    const[fEnc,setFEnc]=useState({mesAnio:'',encuestaId:'',anioGraduacion:'',genero:''});

    const cargar=useCallback(async()=>{
        setCargando(true);setError('');
        try{
            const r=await axios.get(`${API}/admin/estadisticas/encuesta`,{headers:hdrs()});
            setDatos(r.data);
        }catch{setError('No se pudieron cargar las estadísticas de encuestas de graduados.');}
        finally{setCargando(false);}
    },[]);
    useEffect(()=>{cargar();},[cargar]);

    const cEnc=useCallback((k,v)=>setFEnc(p=>{
        const n={...p,[k]:v};
        if(k==='mesAnio') n.encuestaId='';
        return n;
    }),[]);
    const lEnc=useCallback(()=>setFEnc({mesAnio:'',encuestaId:'',anioGraduacion:'',genero:''}),[]);

    const opsMesAnio=useMemo(()=>{
        if(!datos) return [];
        const enc=datos.encuestas.filter(e=>e.estado==='cerrada'&&e.fechaCierre);
        const set=new Set();
        enc.forEach(e=>{const d=new Date(e.fechaCierre);set.add(`${d.getMonth()+1}-${d.getFullYear()}`);});
        return[...set]
            .sort((a,b)=>{const[ma,ya]=a.split('-').map(Number);const[mb,yb]=b.split('-').map(Number);return yb!==ya?yb-ya:mb-ma;})
            .map(clave=>{const[m,y]=clave.split('-').map(Number);return{clave,label:`${MESES_ARR[m-1]} ${y}`};});
    },[datos]);

    const opsAnioGrad=useMemo(()=>{
        if(!datos?.graduadosRaw) return [];
        return[...new Set(datos.graduadosRaw.map(g=>g.anioGraduacion).filter(Boolean))].sort((a,b)=>b-a).map(String);
    },[datos]);

    const opsGenero=useMemo(()=>{
        if(!datos?.graduadosRaw) return [];
        const mapa={};
        datos.graduadosRaw.forEach(g=>{const gen=(g.genero||'').trim();if(!gen)return;const clave=normTxt(gen);if(!mapa[clave])mapa[clave]=gen;});
        return Object.values(mapa).sort();
    },[datos]);

    // ── useMemo df — incluye preguntas condicionales ──────────────
    const df=useMemo(()=>{
        if(!datos) return null;
        const{encuestas,graduadosRaw,preguntasAgrupadas,preguntasCondicionalesAgrupadas,kpis}=datos;
        const encC=encuestas.filter(e=>e.estado==='cerrada');

        const encFiltradas=fEnc.mesAnio
            ?encC.filter(e=>{if(!e.fechaCierre)return false;const d=new Date(e.fechaCierre);return`${d.getMonth()+1}-${d.getFullYear()}`===fEnc.mesAnio;})
            :encC;
        const idsC=new Set(encFiltradas.map(e=>e._id));

        // Preguntas principales
        const pregsF=(preguntasAgrupadas||[]).map(g=>({
            ...g,
            respuestasRaw:(g.respuestasRaw||[]).filter(r=>{
                if(!idsC.has(r.encuestaId))        return false;
                if(fEnc.encuestaId&&r.encuestaId!==fEnc.encuestaId) return false;
                if(fEnc.anioGraduacion&&String(r.anioGraduacion)!==fEnc.anioGraduacion) return false;
                if(fEnc.genero&&normTxt(r.genero||'')!==normTxt(fEnc.genero)) return false;
                return true;
            }),
            encuestasAparece:(g.encuestasAparece||[]).filter(id=>idsC.has(id)),
        })).filter(g=>g.respuestasRaw.length>0);

        // Preguntas condicionales — NUEVO
        const condicionales=(preguntasCondicionalesAgrupadas||[]).map(g=>({
            ...g,
            respuestasRaw:(g.respuestasRaw||[]).filter(r=>{
                if(!idsC.has(r.encuestaId))        return false;
                if(fEnc.encuestaId&&r.encuestaId!==fEnc.encuestaId) return false;
                if(fEnc.anioGraduacion&&String(r.anioGraduacion)!==fEnc.anioGraduacion) return false;
                if(fEnc.genero&&normTxt(r.genero||'')!==normTxt(fEnc.genero)) return false;
                return true;
            }),
            encuestasAparece:(g.encuestasAparece||[]).filter(id=>idsC.has(id)),
        })).filter(g=>g.respuestasRaw.length>0);

        const comunes=pregsF.filter(g=>g.esComun);
        const otras  =pregsF.filter(g=>!g.esComun);

        const totalGrad=graduadosRaw.length;
        let gradResp=graduadosRaw.filter(g=>fEnc.encuestaId?g.encuestasRespondidas.includes(fEnc.encuestaId):g.respondio);
        if(fEnc.anioGraduacion) gradResp=gradResp.filter(g=>String(g.anioGraduacion)===fEnc.anioGraduacion);
        if(fEnc.genero)         gradResp=gradResp.filter(g=>normTxt(g.genero||'')===normTxt(fEnc.genero));
        const respondieron=gradResp.length;
        const kE={...kpis,graduadosRespondieron:respondieron,tasa:totalGrad>0?Math.round((respondieron/totalGrad)*100):0,totalGraduados:totalGrad};

        return{
            encC,encFiltradas,comunes,otras,condicionales,kE,graduadosRaw,
            insights:calcularInsightsGraduados(kE,comunes,otras,encC,graduadosRaw),
            plan:calcularPlanGraduados(kE,encC,graduadosRaw,[...comunes,...otras]),
        };
    },[datos,fEnc]);

    if(cargando) return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:320}}><div style={{width:30,height:30,border:'3px solid #f1f5f9',borderTop:`3px solid ${ROJO}`,borderRadius:'50%',animation:'teg-spin .8s linear infinite'}}/><p style={{margin:'14px 0 0',fontSize:'0.78rem',color:'#9ca3af',fontFamily:FONT}}>Cargando...</p></div>;
    if(error)    return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:320}}><FaExclamationTriangle style={{fontSize:'2rem',color:NARANJA,marginBottom:10}}/><p style={{margin:'0 0 14px',fontSize:'0.82rem',color:'#374151',fontFamily:FONT}}>{error}</p><button onClick={cargar} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',background:'white',border:'1px solid #e5e7eb',borderRadius:7,cursor:'pointer',fontSize:'0.74rem',fontWeight:600,color:'#374151',fontFamily:FONT}}><FaSyncAlt style={{fontSize:'0.66rem'}}/>Reintentar</button></div>;
    if(!df) return null;

    const{encC,encFiltradas,comunes,otras,condicionales,kE,graduadosRaw,insights,plan}=df;
    const hayF=Object.values(fEnc).some(v=>v!=='');
    const sinD={margin:0,fontSize:'0.72rem',color:'#9ca3af',textAlign:'center',padding:'16px 0',fontFamily:FONT};

    return <div style={{fontFamily:FONT,paddingBottom:56}}>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
            <KPI icon={FaGraduationCap} valor={kE.totalGraduados}          label="Graduados totales"     sub="Con tesis verificada"       color={ROJO}   delay={0}  />
            <KPI icon={FaClipboardList} valor={encC.length}                 label="Encuestas cerradas"    sub="Con resultados"            color={AZUL}   delay={40} />
            <KPI icon={FaCheckCircle}   valor={kE.graduadosRespondieron}    label="Respondieron"          sub={`${kE.tasa}% del total`}   color={VERDE}  delay={80} />
            <KPI icon={FaLayerGroup}    valor={comunes.length}              label="Preguntas recurrentes" sub="En 2+ encuestas"           color={MORADO} delay={120}/>
            <KPI icon={FaQuestion}      valor={otras.length}               label="Otras preguntas"       sub="Específicas por encuesta"  color={CIAN}   delay={160}/>
        </div>

        {/* Filtros */}
        <div className="teg-a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',padding:'10px 14px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                    <div style={{width:22,height:22,borderRadius:5,background:`${ROJO}15`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <FaFilter style={{color:ROJO,fontSize:'0.60rem'}}/>
                    </div>
                    <span style={{fontSize:'0.72rem',fontWeight:700,color:'#374151',fontFamily:FONT}}>Filtrar resultados</span>
                    {hayF&&<span style={{background:ROJO,color:'white',borderRadius:99,fontSize:'0.55rem',fontWeight:700,padding:'1px 5px',fontFamily:FONT}}>{Object.values(fEnc).filter(v=>v!=='').length}</span>}
                </div>
                <div style={{width:1,height:20,background:'#e5e7eb',flexShrink:0}}/>

                {opsMesAnio.length>0
                    ?<select value={fEnc.mesAnio} onChange={e=>cEnc('mesAnio',e.target.value)} className={`teg-sel${fEnc.mesAnio?' on':''}`}>
                        <option value="">Todos los períodos</option>
                        {opsMesAnio.map(o=><option key={o.clave} value={o.clave}>{o.label}</option>)}
                    </select>
                    :<span style={{fontSize:'0.68rem',color:'#94a3b8',fontFamily:FONT}}>Sin períodos cerrados</span>
                }
                {opsAnioGrad.length>0&&(
                    <select value={fEnc.anioGraduacion} onChange={e=>cEnc('anioGraduacion',e.target.value)} className={`teg-sel${fEnc.anioGraduacion?' on':''}`}>
                        <option value="">Promoción</option>
                        {opsAnioGrad.map(a=><option key={a} value={a}>{a}</option>)}
                    </select>
                )}
                {opsGenero.length>0&&(
                    <select value={fEnc.genero} onChange={e=>cEnc('genero',e.target.value)} className={`teg-sel${fEnc.genero?' on':''}`}>
                        <option value="">Género</option>
                        {opsGenero.map(g=><option key={g} value={g}>{g}</option>)}
                    </select>
                )}
                {(fEnc.mesAnio?encFiltradas:encC).length>0&&(
                    <select value={fEnc.encuestaId} onChange={e=>cEnc('encuestaId',e.target.value)} className={`teg-sel${fEnc.encuestaId?' on':''}`} style={{minWidth:200,maxWidth:320}}>
                        <option value="">{fEnc.mesAnio?'Todas de este período':'Todas las encuestas cerradas'}</option>
                        {(fEnc.mesAnio?encFiltradas:encC).map(e=><option key={e._id} value={e._id}>{e.titulo}</option>)}
                    </select>
                )}
                {hayF&&<>
                    {Object.entries(fEnc).filter(([,v])=>v).map(([k,v])=>{
                        const lblMap={mesAnio:'Período',encuestaId:'Encuesta',anioGraduacion:'Promoción',genero:'Género'};
                        let display=v;
                        if(k==='mesAnio')    display=opsMesAnio.find(o=>o.clave===v)?.label||v;
                        if(k==='encuestaId') display=(fEnc.mesAnio?encFiltradas:encC).find(e=>e._id===v)?.titulo?.slice(0,28)||v;
                        return <span key={k} style={{background:`${ROJO}12`,color:ROJO,border:`1px solid ${ROJO}25`,borderRadius:99,fontSize:'0.63rem',fontWeight:600,padding:'2px 7px',fontFamily:FONT,display:'inline-flex',alignItems:'center',gap:3}}>
                            <span style={{color:'#9ca3af',fontSize:'0.58rem'}}>{lblMap[k]}:</span>&nbsp;{display.length>28?display.slice(0,28)+'…':display}
                            <button onClick={()=>cEnc(k,'')} style={{background:'none',border:'none',color:ROJO,cursor:'pointer',padding:0,fontSize:'0.70rem',lineHeight:1,opacity:0.7}}>×</button>
                        </span>;
                    })}
                    <button onClick={lEnc} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:'0.65rem',fontFamily:FONT,display:'flex',alignItems:'center',gap:2,padding:'2px 4px'}}><FaTimes style={{fontSize:'0.55rem'}}/>Limpiar</button>
                </>}
            </div>
            {fEnc.mesAnio&&<div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:6}}>
                <FaCalendarAlt style={{color:AZUL,fontSize:'0.60rem'}}/>
                <span style={{fontSize:'0.62rem',color:'#475569',fontFamily:FONT}}>
                    Período: <strong style={{color:AZUL}}>{opsMesAnio.find(o=>o.clave===fEnc.mesAnio)?.label}</strong>
                    {' · '}{encFiltradas.length} encuesta{encFiltradas.length!==1?'s':''} en este período
                </span>
            </div>}
        </div>

        {/* Preguntas recurrentes */}
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

        {/* Otras preguntas */}
        {otras.length>0&&<div style={{marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:7,background:`${AZUL}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaQuestion style={{color:AZUL,fontSize:'0.78rem'}}/></div>
                <div>
                    <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Otras Preguntas</div>
                    <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>{fEnc.encuestaId?'De la encuesta seleccionada':'Específicas de una encuesta'} · {otras.length} grupo{otras.length!==1?'s':''}</div>
                </div>
            </div>
            {otras.map((g,i)=><TarjetaGrupo key={g.id} grupo={g} encuestas={encC} filtros={fEnc} num={comunes.length+i+1}/>)}
        </div>}

        {/* ── PREGUNTAS CONDICIONALES — NUEVO ── */}
        {condicionales.length>0&&<div style={{marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:7,background:`${NARANJA}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <FaCodeBranch style={{color:NARANJA,fontSize:'0.78rem'}}/>
                </div>
                <div>
                    <div style={{fontSize:'0.84rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Preguntas Condicionales</div>
                    <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>
                        Solo se muestran según la respuesta Sí/No dada · {condicionales.length} subpregunta{condicionales.length!==1?'s':''}
                    </div>
                </div>
            </div>
            {condicionales.map((g,i)=>(
                <TarjetaCondicional
                    key={g.id}
                    grupo={g}
                    encuestas={encC}
                    filtros={fEnc}
                    num={comunes.length+otras.length+i+1}
                />
            ))}
        </div>}

        {/* Sin datos */}
        {comunes.length===0&&otras.length===0&&condicionales.length===0&&(
            <div style={{padding:'32px',background:'white',borderRadius:10,border:'1px solid #e5e7eb',textAlign:'center',marginBottom:14}}>
                <FaClipboardList style={{color:'#cbd5e1',fontSize:'2rem',marginBottom:8}}/>
                <p style={{margin:'0 0 6px',fontSize:'0.78rem',fontWeight:600,color:'#94a3b8',fontFamily:FONT}}>{encC.length===0?'No hay encuestas cerradas aún':'Sin resultados con los filtros actuales'}</p>
                <p style={{margin:0,fontSize:'0.68rem',color:'#cbd5e1',fontFamily:FONT}}>{encC.length===0?'Los gráficos aparecerán al cerrar una encuesta.':'Prueba limpiando los filtros.'}</p>
            </div>
        )}

        {/* Insights + Plan */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14}}>
            <div className="teg-a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',animationDelay:'200ms'}}>
                <div style={{padding:'11px 16px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${ROJO}09,transparent)`,display:'flex',alignItems:'center',gap:9,flexWrap:'wrap'}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${ROJO}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaLightbulb style={{color:ROJO,fontSize:'0.82rem'}}/></div>
                    <div>
                        <div style={{fontSize:'0.82rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Análisis de Situación</div>
                        <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>{insights.length} observaciones{hayF&&<span style={{color:ROJO,marginLeft:4}}>· Filtrado aplicado</span>}</div>
                    </div>
                    <div style={{marginLeft:'auto',display:'flex',gap:10}}>
                        {[['crit','Crítico',ROJO],['warn','Atención',NARANJA],['ok','Fortaleza',VERDE],['info','Sugerencia',AZUL]].map(([tipo,lbl,c])=>(
                            <div key={tipo} style={{display:'flex',alignItems:'center',gap:3}}>
                                <div style={{width:6,height:6,borderRadius:'50%',background:c}}/>
                                <span style={{fontSize:'0.60rem',color:'#6b7280',fontFamily:FONT}}>{lbl}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{padding:'13px 16px'}}>
                    {insights.length===0?<p style={sinD}>Sin datos suficientes para análisis</p>:<>
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
            <div className="teg-a" style={{background:'white',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',animationDelay:'220ms'}}>
                <div style={{padding:'11px 16px',borderBottom:'1px solid #f1f5f9',background:`linear-gradient(135deg,${AZUL}09,transparent)`,display:'flex',alignItems:'center',gap:9}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${AZUL}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><FaBullseye style={{color:AZUL,fontSize:'0.82rem'}}/></div>
                    <div>
                        <div style={{fontSize:'0.82rem',fontWeight:700,color:'#0f172a',fontFamily:FONT}}>Plan de Acción</div>
                        <div style={{fontSize:'0.61rem',color:'#9ca3af',fontFamily:FONT}}>Prioridades basadas en datos reales</div>
                    </div>
                </div>
                <div style={{padding:'12px 14px'}}>
                    {plan.length===0
                        ?<div style={{textAlign:'center',padding:'20px 0'}}><FaCheckCircle style={{color:VERDE,fontSize:'1.6rem',marginBottom:8}}/><p style={{margin:0,fontSize:'0.74rem',color:VERDE,fontFamily:FONT,fontWeight:600}}>¡Sin acciones críticas!</p></div>
                        :plan.map((a,i)=>{
                            const imp={alto:ROJO,medio:NARANJA,bajo:CIAN}[a.impacto]||AZUL;
                            return <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderBottom:i<plan.length-1?'1px solid #f1f5f9':'none'}}>
                                <div style={{width:22,height:22,borderRadius:6,background:`${imp}15`,border:`1px solid ${imp}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                                    <span style={{fontSize:'0.65rem',fontWeight:800,color:imp,fontFamily:FONT}}>{a.prioridad}</span>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:'0.72rem',fontWeight:600,color:'#0f172a',fontFamily:FONT,marginBottom:2}}>{a.accion}</div>
                                    <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                                        <span style={{fontSize:'0.60rem',fontWeight:700,color:imp,background:`${imp}12`,border:`1px solid ${imp}25`,borderRadius:99,padding:'1px 5px',fontFamily:FONT}}>Impacto {a.impacto}</span>
                                        <span style={{fontSize:'0.60rem',color:'#9ca3af',fontFamily:FONT}}>{a.meta}</span>
                                    </div>
                                </div>
                            </div>;
                        })}
                </div>
            </div>
        </div>
    </div>;
};

export default TabEGraduado;