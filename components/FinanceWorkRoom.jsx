'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUp, Download, ExternalLink, FileSpreadsheet, FileText } from 'lucide-react'
import { SEED_CONTENT } from '@/lib/portfolio-data'
import { FINANCE_ROOMS, cleanOwner, roomForProject } from '@/lib/finance-site-map'
import s from './FinanceWorkRoom.module.css'

function previewFor(project, files) {
  if (project?.coverImageUrl) return project.coverImageUrl
  return files.find((f) => f.projectId === project?.id && String(f.label || '').startsWith('__project_thumbnail__'))?.publicUrl || ''
}

function projectFiles(project, files) {
  return files.filter((f) => f.projectId === project?.id && !String(f.label || '').startsWith('__project_thumbnail__'))
}

function Stage({ project, files, flip }) {
  const preview = previewFor(project, files)
  const attached = projectFiles(project, files)
  const primary = attached[0]
  return (
    <div className={s.stage}>
      <div className={`${s.monitor} ${flip ? s.monitorFlip : ''}`}>
        <div className={s.monitorBody}>
          <div className={s.monitorScreen}>
            {preview ? (
              <img src={preview} alt="" />
            ) : (
              <div className={s.sheetPreview}>
                <div className={s.sheetTop}><span>{project.category || 'FINANCE CASE'}</span><span>{project.year || 'MODEL'}</span></div>
                <div className={s.sheetTitle}>{project.title}</div>
                <div className={s.sheetBars}>{[72,48,84,61,90].map((w,i)=><i key={i} style={{width:`${w}%`}} />)}</div>
                <div className={s.sheetGrid}>
                  {(project.metrics || []).slice(0,4).map((m,i)=><div key={i}><small>{m.k || m.label}</small><b>{m.v || m.value}</b></div>)}
                </div>
                <div className={s.sheetFooter}><FileSpreadsheet size={14} /><span>{primary?.originalName || primary?.label || 'Investment analysis'}</span></div>
              </div>
            )}
          </div>
        </div>
        <div className={s.monitorNeck} />
        <div className={s.monitorFoot} />
      </div>
    </div>
  )
}

function Footer({ owner, room }) {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <p className={s.footerEye}><i />Open to serious finance conversations</p>
        <h2>Want to discuss the work?<span>Let’s get into the numbers.</span></h2>
        <p className={s.footerLead}>The best conversations start with the assumptions, capital structure and downside case — not the headline return.</p>
        <div className={s.footerCtas}>
          {owner.email ? <a className={s.footerPrimary} href={`mailto:${owner.email}`}>Start a conversation <b><ArrowRight size={16}/></b></a> : <Link className={s.footerPrimary} href="/#contact-footer">Start a conversation <b><ArrowRight size={16}/></b></Link>}
          <Link className={s.footerGhost} href="/#works">Back to all work</Link>
        </div>
        <div className={s.footerCols}>
          <div><h3>Current room</h3><ul><li>{room.label}</li><li>{room.description}</li></ul></div>
          <div><h3>Navigate</h3><ul><li><Link href="/">Home</Link></li><li><Link href="/#about">My story</Link></li><li><Link href="/#works">All work</Link></li></ul></div>
          <div><h3>Status</h3><ul><li>{owner.location}</li><li>Finance · M&A · Private Markets</li></ul></div>
        </div>
        <div className={s.footerBottom}><span>© {new Date().getFullYear()} {owner.name}</span><Link href="/">Back home ↑</Link></div>
      </div>
    </footer>
  )
}

export default function FinanceWorkRoom({ slug }) {
  const [content, setContent] = useState(SEED_CONTENT)
  const [files, setFiles] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch('/api/content', { cache: 'no-store' }).then((r)=>r.ok?r.json():null).catch(()=>null),
      fetch('/api/files', { cache: 'no-store' }).then((r)=>r.ok?r.json():[]).catch(()=>[]),
    ]).then(([c,f]) => {
      if (!alive) return
      if (c && !c.error) setContent((prev)=>({ ...prev, ...c }))
      setFiles(Array.isArray(f) ? f : [])
      setLoaded(true)
    })
    const t=setTimeout(()=>setLoaded(true),1000)
    return()=>{alive=false;clearTimeout(t)}
  },[])

  useEffect(()=>{
    const q=()=>{
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight)
      setScroll(Math.min(1,scrollY/max))
    }
    q();addEventListener('scroll',q,{passive:true});return()=>removeEventListener('scroll',q)
  },[])

  const room = FINANCE_ROOMS.find((r)=>r.slug===slug) || FINANCE_ROOMS[0]
  const owner = useMemo(()=>cleanOwner(content.owner || {}),[content.owner])
  const projects = useMemo(()=>{
    const list=(Array.isArray(content.projects)?content.projects:[]).filter((p)=>p && p.hidden!==true)
    return list.filter((p)=>roomForProject(p).slug===room.slug)
  },[content.projects,room.slug])

  return (
    <div className={s.root} style={{ '--accent': room.color }}>
      <div className={`${s.loader} ${loaded?s.loaderGone:''}`}><span>{room.label}</span><i/></div>

      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href="/#works" className={s.back}><ArrowLeft size={15}/> Back to the doors</Link>
          <ul>
            {FINANCE_ROOMS.map((r)=><li key={r.slug}><Link className={r.slug===room.slug?s.current:''} href={`/work/${r.slug}`}>{r.label}</Link></li>)}
          </ul>
          <div className={s.navName}>DC</div>
        </div>
      </nav>

      <main className={s.wrap}>
        <section className={s.intro}>
          <h1>{room.label}</h1>
          <div>
            <p>{room.description}</p>
            <span className={s.count}>{String(projects.length).padStart(2,'0')} published case{projects.length===1?'':'s'}</span>
          </div>
        </section>

        <section className={s.stack} aria-label="Projects">
          {projects.map((project,index)=>{
            const attached=projectFiles(project,files)
            const flip=index%2===1
            const summary=project.executiveSummary || project.problem || project.impact || project.subtitle || 'Finance case study and supporting analysis.'
            return (
              <article className={`${s.card} ${flip?s.flip:''}`} style={{'--i':index}} key={project.id || index}>
                <div className={s.cardIn}>
                  <div className={s.cardInfo}>
                    <p className={s.cardMeta}><span className={s.no}>{String(index+1).padStart(2,'0')}</span><i/><span>{project.category || room.label}{project.year ? ` · ${project.year}`:''}</span></p>
                    <h2>{project.title}</h2>
                    <p className={s.sub}>{project.industry || project.subtitle || project.impact}</p>
                    <p className={s.desc}>{summary}</p>
                    <ul className={s.tags}>{(project.tags || []).slice(0,5).map((t)=><li key={t}>{t}</li>)}</ul>
                    <div className={s.actions}>
                      {attached.length ? <a className={s.live} href={attached[0].publicUrl} target="_blank" rel="noreferrer">Open primary file <ExternalLink size={15}/></a> : <span className={s.note}>Case summary available</span>}
                      {attached.length>1 && <span className={s.fileCount}>{attached.length} files attached</span>}
                    </div>
                    {attached.length>1 && <div className={s.fileRail}>{attached.slice(1,5).map((f)=><a key={f.id} href={f.publicUrl} target="_blank" rel="noreferrer"><FileText size={13}/>{f.label || f.originalName}<ExternalLink size={11}/></a>)}</div>}
                  </div>
                  <Stage project={project} files={files} flip={flip}/>
                </div>
                <div className={s.cardDim}/>
              </article>
            )
          })}
          {!projects.length && <article className={s.empty}><span>Nothing published in this room yet.</span><p>Projects hidden in Admin stay completely absent here.</p></article>}
        </section>

        <section className={s.outro}><p>Reached the end of {room.label}.</p><Link href="/#works">Choose another door <ArrowRight size={14}/></Link></section>
      </main>

      <Footer owner={owner} room={room}/>

      <button className={`${s.top} ${scroll>.12?s.topShow:''}`} onClick={()=>scrollTo({top:0,behavior:'smooth'})}>
        <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><circle className={s.progress} cx="26" cy="26" r="23" style={{strokeDashoffset:144.5*(1-scroll)}}/></svg>
        <ArrowUp size={15}/>
      </button>
    </div>
  )
}
