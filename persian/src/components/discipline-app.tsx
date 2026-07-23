"use client";

import { useEffect, useState } from "react";
import {
  Archive, BarChart3, Bell, BookOpenCheck, Brain, CheckCircle2, ChevronLeft,
  Flame, Gauge, Heart, History, Leaf, LogOut, Menu, Moon,
  Plus, Search, Settings, Sparkles, Sun, Target, TrendingDown, X,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { deadlineState } from "@/lib/penalty-engine";

type Mistake = { id:number; name:string; category:string; color:string; count:number; trigger:string; intention:string };
type RecordItem = { id:number; mistakeId:number; date:string; iso:string; note:string; feeling:string; lesson:string };
type Commitment = { id:number; mistakeId:number; title:string; due:string; status:"pending"|"done"; reason:string };
type LocalAccount = { name:string; email:string; passwordHash:string; salt:string };

const accountStorageKey = "my-path-local-accounts";
const sessionStorageKey = "my-path-current-account";

async function hashPassword(password:string,salt:string){
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("");
}

function loadAccounts():LocalAccount[]{
  try{return JSON.parse(localStorage.getItem(accountStorageKey)??"[]")}catch{return []}
}

const defaultMistakeTypes:Mistake[] = [
  {id:1,name:"به‌تعویق انداختن کارها",category:"بهره‌وری",color:"#6d63d9",count:7,trigger:"کارهای بزرگ و مبهم",intention:"فقط ۵ دقیقه شروع می‌کنم"},
  {id:2,name:"استفاده بیش‌ازحد از موبایل",category:"تمرکز",color:"#3676d8",count:5,trigger:"خستگی یا بی‌حوصلگی",intention:"موبایل را از اتاق خارج می‌کنم"},
  {id:3,name:"دیر خوابیدن",category:"سلامت",color:"#8055c8",count:4,trigger:"تماشای ویدیو در شب",intention:"ساعت ۱۰:۳۰ صفحه‌ها را خاموش می‌کنم"},
  {id:4,name:"واکنش عجولانه",category:"روابط",color:"#dd5f69",count:3,trigger:"احساس نادیده‌گرفته‌شدن",intention:"سه نفس می‌کشم و بعد پاسخ می‌دهم"},
  {id:5,name:"خرج بدون برنامه",category:"مالی",color:"#df9638",count:2,trigger:"خرید آنلاین و تخفیف",intention:"قانون انتظار ۲۴ ساعته"},
  {id:6,name:"رها کردن ورزش",category:"سلامت",color:"#16967a",count:4,trigger:"کمبود وقت",intention:"نسخه کوتاه ۱۰ دقیقه‌ای انجام می‌دهم"},
  {id:7,name:"قول بیش‌ازحد",category:"مرزبندی",color:"#c34f8c",count:2,trigger:"سختی نه گفتن",intention:"قبل از پاسخ تقویمم را بررسی می‌کنم"},
  {id:8,name:"انتقاد سخت از خود",category:"ذهن‌آگاهی",color:"#4b85a8",count:6,trigger:"اشتباه یا مقایسه",intention:"با خودم مثل یک دوست حرف می‌زنم"},
];
const initialRecords:RecordItem[] = [
  {id:1,mistakeId:1,date:"امروز، ۱۰:۲۰",iso:"2026-07-23",note:"گزارش را تا آخر صبح عقب انداختم.",feeling:"اضطراب",lesson:"کار را به سه بخش کوچک تقسیم کنم."},
  {id:2,mistakeId:2,date:"دیروز، ۲۲:۴۰",iso:"2026-07-22",note:"یک ساعت بی‌هدف در شبکه‌های اجتماعی بودم.",feeling:"خستگی",lesson:"موبایل شب‌ها بیرون اتاق بماند."},
  {id:3,mistakeId:4,date:"۲ روز پیش",iso:"2026-07-21",note:"پیش از شنیدن کامل حرف طرف مقابل جواب دادم.",feeling:"ناراحتی",lesson:"مکث سه‌نفسه را تمرین کنم."},
  {id:4,mistakeId:3,date:"۳ روز پیش",iso:"2026-07-20",note:"تا ساعت یک شب بیدار ماندم.",feeling:"بی‌حوصلگی",lesson:"یادآور خاموشی صفحه را فعال کنم."},
];
const initialCommitments:Commitment[] = [
  {id:1,mistakeId:1,title:"۲۵ دقیقه کار بدون حواس‌پرتی",due:"2026-07-24",status:"pending",reason:"برای جبران تعویق امروز"},
  {id:2,mistakeId:2,title:"یک شب بدون موبایل در اتاق خواب",due:"2026-07-23",status:"pending",reason:"برای بازگرداندن تمرکز"},
  {id:3,mistakeId:4,title:"نوشتن یک پیام همدلانه",due:"2026-07-25",status:"pending",reason:"برای ترمیم رابطه"},
  {id:4,mistakeId:3,title:"خواب پیش از ۱۱ شب",due:"2026-07-20",status:"done",reason:"مراقبت از انرژی فردا"},
];
const weekly=[{day:"شنبه",count:3},{day:"یکشنبه",count:2},{day:"دوشنبه",count:4},{day:"سه‌شنبه",count:2},{day:"چهارشنبه",count:1},{day:"پنجشنبه",count:2},{day:"جمعه",count:1}];
const nav=[
  ["dashboard","امروز من",Gauge],["mistakes","الگوهای من",Brain],["commitments","تعهدهای من",Target],
  ["journal","دفترچه رشد",BookOpenCheck],["insights","بینش‌ها",BarChart3],["archive","تاریخچه",History],
  ["settings","تنظیمات",Settings],
] as const;

export function DisciplineApp() {
  const [authenticated,setAuthenticated]=useState(()=>typeof window!=="undefined"&&Boolean(sessionStorage.getItem(sessionStorageKey)));
  const [authMode,setAuthMode]=useState<"login"|"signup">("login");
  const [loginError,setLoginError]=useState("");
  const [page,setPage]=useState("dashboard");
  const [dark,setDark]=useState(false);
  const [query,setQuery]=useState("");
  const [records,setRecords]=useState<RecordItem[]>(()=>{
    if(typeof window==="undefined") return initialRecords;
    try{return JSON.parse(localStorage.getItem("personal-growth-data")??"").records??initialRecords}catch{return initialRecords}
  });
  const [commitments,setCommitments]=useState<Commitment[]>(()=>{
    if(typeof window==="undefined") return initialCommitments;
    try{return JSON.parse(localStorage.getItem("personal-growth-data")??"").commitments??initialCommitments}catch{return initialCommitments}
  });
  const [mistakeTypes,setMistakeTypes]=useState<Mistake[]>(()=>{
    if(typeof window==="undefined") return defaultMistakeTypes;
    try{return JSON.parse(localStorage.getItem("personal-growth-data")??"").mistakeTypes??defaultMistakeTypes}catch{return defaultMistakeTypes}
  });
  const [modal,setModal]=useState<Mistake|null>(null);
  const [customModal,setCustomModal]=useState(false);
  const [note,setNote]=useState("");
  const [feeling,setFeeling]=useState("خستگی");
  const [lesson,setLesson]=useState("");
  const [toast,setToast]=useState("");

  useEffect(()=>localStorage.setItem("personal-growth-data",JSON.stringify({records,commitments,mistakeTypes})),[records,commitments,mistakeTypes]);
  useEffect(()=>{ document.documentElement.classList.toggle("dark",dark); },[dark]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(""),2600);return()=>clearTimeout(id)},[toast]);

  const mistake=(id:number)=>mistakeTypes.find(m=>m.id===id)!;
  const pending=commitments.filter(c=>c.status==="pending");
  const filtered=mistakeTypes.filter(m=>(m.name+m.category+m.trigger).includes(query));
  const title=nav.find(n=>n[0]===page)?.[1]??"امروز من";
  const occurrence=(id:number)=>records.filter(r=>r.mistakeId===id).length+1;

  async function handleAuth(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const data=new FormData(e.currentTarget);
    const email=String(data.get("email")??"").trim().toLowerCase();
    const password=String(data.get("password")??"");
    const accounts=loadAccounts();
    if(authMode==="signup"){
      const name=String(data.get("name")??"").trim();
      const confirmation=String(data.get("confirmation")??"");
      if(password.length<8){setLoginError("گذرواژه باید دست‌کم ۸ نویسه داشته باشد.");return}
      if(password!==confirmation){setLoginError("گذرواژه و تکرار آن یکسان نیست.");return}
      if(accounts.some(account=>account.email===email)){setLoginError("برای این نشانی رایانامه قبلاً حساب ساخته شده است.");return}
      const salt=crypto.randomUUID();
      const account:LocalAccount={name,email,salt,passwordHash:await hashPassword(password,salt)};
      localStorage.setItem(accountStorageKey,JSON.stringify([...accounts,account]));
      sessionStorage.setItem(sessionStorageKey,email);
      setAuthenticated(true);setLoginError("");return;
    }
    const account=accounts.find(item=>item.email===email);
    if(account&&await hashPassword(password,account.salt)===account.passwordHash){
      sessionStorage.setItem(sessionStorageKey,email);setAuthenticated(true);setLoginError("");
    }else setLoginError("نشانی رایانامه یا گذرواژه درست نیست.");
  }
  function register(){
    if(!modal)return;
    const now=new Date();
    setRecords(v=>[{id:Date.now(),mistakeId:modal.id,date:"همین حالا",iso:now.toISOString().slice(0,10),note,feeling,lesson},...v]);
    const due=new Date();due.setDate(due.getDate()+1);
    setCommitments(v=>[{id:Date.now()+1,mistakeId:modal.id,title:lesson||modal.intention,due:due.toISOString().slice(0,10),status:"pending",reason:`قدم کوچک پس از تکرار ${occurrence(modal.id)}`},...v]);
    setModal(null);setNote("");setLesson("");setToast("ثبت شد؛ بدون قضاوت، با یک قدم کوچک رو به جلو.");
  }
  function complete(id:number){setCommitments(v=>v.map(c=>c.id===id?{...c,status:"done"}:c));setToast("آفرین! تعهد انجام شد و در دفترچه رشد ثبت شد.");}
  function createCustomMistake(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const data=new FormData(e.currentTarget);
    const name=String(data.get("name")??"").trim();
    if(!name)return;
    setMistakeTypes(v=>[{
      id:Date.now(),name,
      category:String(data.get("category")??"").trim()||"شخصی",
      color:"#6257d5",count:0,
      trigger:String(data.get("trigger")??"").trim()||"هنوز مشخص نیست",
      intention:String(data.get("intention")??"").trim()||"دفعه بعد مکث می‌کنم و آگاهانه انتخاب می‌کنم",
    },...v]);
    setCustomModal(false);
    setToast("اشتباه دلخواه ساخته شد؛ اکنون می‌توانی آن را ثبت کنی.");
  }

  if(!authenticated)return <div className="login-page"><div className="login-card card">
    <div className="brand-mark" style={{margin:"0 auto 16px",color:"white",background:"#6257d5"}}><Leaf size={22}/></div>
    <h1>مسیر من</h1><p className="muted">فضای خصوصی برای دیدن الگوها و بهترشدن، بدون قضاوت</p>
    <div className="auth-switch"><button className={authMode==="login"?"active":""} onClick={()=>{setAuthMode("login");setLoginError("")}}>ورود</button><button className={authMode==="signup"?"active":""} onClick={()=>{setAuthMode("signup");setLoginError("")}}>ساخت حساب</button></div>
    <form onSubmit={handleAuth}>{authMode==="signup"&&<label>نام شما<input className="field" name="name" autoComplete="name" required/></label>}<label>نشانی رایانامه<input className="field" name="email" type="email" autoComplete="email" required/></label><label>گذرواژه<input className="field" name="password" type="password" minLength={8} autoComplete={authMode==="signup"?"new-password":"current-password"} required/></label>{authMode==="signup"&&<label>تکرار گذرواژه<input className="field" name="confirmation" type="password" minLength={8} autoComplete="new-password" required/></label>}{loginError&&<div className="login-error">{loginError}</div>}<button className="btn btn-primary"><Heart size={17}/> {authMode==="signup"?"ساخت حساب و ورود":"ورود به فضای شخصی"}</button></form>
    <div className="privacy-hint">اطلاعات حساب و یادداشت‌ها فقط در همین مرورگر نگهداری می‌شود.</div>
  </div></div>;

  return <div className="app-shell">
    <aside className="sidebar" style={{background:"#18233a"}}>
      <div className="brand"><div className="brand-mark" style={{background:"#6257d5"}}><Leaf size={21}/></div><div><b>مسیر من</b><div style={{fontSize:10,opacity:.65}}>دفتر شخصی رشد و خودآگاهی</div></div></div>
      <div className="nav">{nav.map(([id,label,Icon])=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}><Icon size={18}/><span>{label}</span>{id==="commitments"&&<span className="badge purple" style={{marginRight:"auto"}}>{pending.length.toLocaleString("fa-IR")}</span>}</button>)}</div>
      <div className="gentle-note"><Sparkles size={16}/><span>هدف کامل‌بودن نیست؛ هدف آگاه‌ترشدن و انتخاب بهتر در دفعه بعد است.</span></div>
      <div style={{marginTop:"auto",borderTop:"1px solid #ffffff18",paddingTop:15}}><div className="person"><div className="avatar">م</div><div><b style={{fontSize:13}}>فضای شخصی من</b><div style={{fontSize:10,opacity:.6}}>خصوصی و امن</div></div></div><button className="btn" onClick={()=>{sessionStorage.removeItem(sessionStorageKey);setAuthenticated(false)}} style={{color:"#cbd8ef",background:"transparent",marginTop:10}}><LogOut size={16}/> خروج</button></div>
    </aside>
    <main className="main"><header className="header"><div style={{display:"flex",alignItems:"center",gap:10}}><button className="btn btn-soft mobile-menu"><Menu size={18}/></button><div className="search"><Search size={16} color="var(--muted)"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجوی یک الگو یا یادداشت..."/></div></div><div style={{display:"flex",gap:8}}><button className="btn btn-soft" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className="btn btn-soft"><Bell size={18}/></button></div></header>
      <div className="content"><div className="topline"><div><h1>{title}</h1><div className="muted">پنجشنبه، ۱ اسد · امروز فرصتی تازه است</div></div><button className="btn btn-primary" onClick={()=>setPage("mistakes")}><Plus size={17}/> ثبت یک اتفاق</button></div>
        {page==="dashboard"&&<Dashboard records={records} commitments={commitments} mistake={mistake} go={setPage}/>}
        {page==="mistakes"&&<MistakesView items={filtered} records={records} open={setModal} home={()=>setPage("dashboard")} create={()=>setCustomModal(true)}/>}
        {page==="commitments"&&<CommitmentsView items={pending} mistake={mistake} complete={complete}/>}
        {page==="journal"&&<JournalView records={records} commitments={commitments} mistake={mistake}/>}
        {page==="insights"&&<InsightsView records={records}/>}
        {page==="archive"&&<ArchiveView records={records} mistake={mistake}/>}
        {page==="settings"&&<SettingsView/>}
      </div>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={()=>setModal(null)}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
      <div className="section-title"><div><h2>ثبت با مهربانی، نه سرزنش</h2><div className="muted">این یادداشت فقط برای شناخت بهتر الگوهای خودت است.</div></div><button className="btn btn-soft" onClick={()=>setModal(null)}><X size={17}/></button></div>
      <div className="reflection-card"><Brain size={20}/><div><b>{modal.name}</b><div className="muted">این تکرار حدوداً بار {occurrence(modal.id).toLocaleString("fa-IR")} است · محرک رایج: {modal.trigger}</div></div></div>
      <div className="form-grid"><label className="full">چه اتفاقی افتاد؟<textarea className="field" rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="کوتاه و واقع‌بینانه بنویس..."/></label><label>آن لحظه چه حسی داشتم؟<select className="field" value={feeling} onChange={e=>setFeeling(e.target.value)}><option>خستگی</option><option>اضطراب</option><option>عصبانیت</option><option>بی‌حوصلگی</option><option>ترس</option><option>فشار</option></select></label><label>قدم کوچک بعدی<input className="field" value={lesson} onChange={e=>setLesson(e.target.value)} placeholder={modal.intention}/></label></div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:9}}><button className="btn btn-soft" onClick={()=>setModal(null)}>فعلاً نه</button><button className="btn btn-primary" onClick={register}><Sparkles size={17}/> ثبت و ساخت تعهد</button></div>
    </div></div>}
    {customModal&&<div className="modal-backdrop" onMouseDown={()=>setCustomModal(false)}><form className="modal" onSubmit={createCustomMistake} onMouseDown={e=>e.stopPropagation()}>
      <div className="section-title"><div><h2>ایجاد اشتباه دلخواه</h2><div className="muted">الگویی را که خودت می‌خواهی دنبال کنی بنویس.</div></div><button type="button" className="btn btn-soft" onClick={()=>setCustomModal(false)}><X size={17}/></button></div>
      <div className="form-grid">
        <label>نام اشتباه<input className="field" name="name" required placeholder="مثلاً: قطع کردن حرف دیگران"/></label>
        <label>دسته‌بندی<input className="field" name="category" placeholder="مثلاً: روابط"/></label>
        <label className="full">محرک احتمالی<input className="field" name="trigger" placeholder="چه موقع معمولاً اتفاق می‌افتد؟"/></label>
        <label className="full">تصمیم من برای دفعه بعد<input className="field" name="intention" placeholder="مثلاً: سه ثانیه مکث می‌کنم"/></label>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:9}}><button type="button" className="btn btn-soft" onClick={()=>setCustomModal(false)}>انصراف</button><button className="btn btn-primary" type="submit"><Plus size={17}/> ساخت اشتباه</button></div>
    </form></div>}
    {toast&&<div className="toast"><CheckCircle2 size={17} style={{display:"inline",marginLeft:8}}/>{toast}</div>}
  </div>;
}

function Dashboard({records,commitments,mistake,go}:{records:RecordItem[];commitments:Commitment[];mistake:(id:number)=>Mistake;go:(p:string)=>void}){
  const pending=commitments.filter(c=>c.status==="pending");const completed=commitments.filter(c=>c.status==="done");
  const stats=[["ثبت‌های این ماه",records.length+9,Brain,"#eeecff","#6257d5","شناخت بیشتر از الگوها"],["روزهای آگاهانه","۱۲",Flame,"#fff1e4","#d47819","۴ روز پیوسته"],["تعهدهای باز",pending.length,Target,"#e9f0ff","#3768d9","قدم‌های کوچک بعدی"],["تعهدهای انجام‌شده",completed.length+8,CheckCircle2,"#e7f7ef","#188663","نرخ انجام ۸۲٪"]] as const;
  return <><div className="welcome-card card"><div><span className="badge purple">مرور امروز</span><h2>با خودت مهربان باش؛ تغییر از دیدن شروع می‌شود.</h2><p>امروز فقط یک الگو را مشاهده کن و برای دفعه بعد یک انتخاب کوچک‌تر و روشن‌تر بساز.</p></div><div className="welcome-orb"><Leaf size={34}/></div></div>
    <div className="stats">{stats.map(([label,value,Icon,bg,color,note])=><div className="card stat" key={label}><div className="stat-head"><span className="muted">{label}</span><div className="icon-box" style={{background:bg,color}}><Icon size={19}/></div></div><strong>{typeof value==="number"?value.toLocaleString("fa-IR"):value}</strong><span className="positive">{note}</span></div>)}</div>
    <div className="grid-2"><section className="card section"><div className="section-title"><div><h2>روند هفتگی تکرارها</h2><div className="muted">هدف، کاهش آرام و پایدار است</div></div><span className="badge green"><TrendingDown size={12}/> ۱۸٪ کمتر</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly}><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6d63d9" stopOpacity={.3}/><stop offset="95%" stopColor="#6d63d9" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--line)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11}/><Tooltip/><Area type="monotone" dataKey="count" stroke="#6d63d9" strokeWidth={3} fill="url(#pg)"/></AreaChart></ResponsiveContainer></div></section>
      <section className="card section"><div className="section-title"><h2>قدم‌های بعدی من</h2><button className="btn" onClick={()=>go("commitments")} style={{color:"var(--primary)",background:"transparent"}}>همه <ChevronLeft size={15}/></button></div>{pending.slice(0,4).map(c=><div key={c.id} className="commitment-mini"><div className="check-ring"/><div style={{flex:1}}><b>{c.title}</b><div className="muted">{mistake(c.mistakeId).name}</div></div><span className={`badge ${deadlineState(new Date(c.due))==="overdue"?"orange":"purple"}`}>{new Date(c.due).toLocaleDateString("fa-IR")}</span></div>)}</section></div>
    <section className="card section" style={{marginTop:15}}><div className="section-title"><h2>آخرین مشاهده‌های من</h2><button className="btn" onClick={()=>go("journal")} style={{color:"var(--primary)",background:"transparent"}}>دفترچه رشد <ChevronLeft size={15}/></button></div><div className="table-wrap"><table><thead><tr><th>الگو</th><th>احساس</th><th>آنچه یاد گرفتم</th><th>زمان</th></tr></thead><tbody>{records.slice(0,5).map(r=><tr key={r.id}><td><b>{mistake(r.mistakeId).name}</b></td><td><span className="badge purple">{r.feeling}</span></td><td>{r.lesson||mistake(r.mistakeId).intention}</td><td>{r.date}</td></tr>)}</tbody></table></div></section></>;
}
function MistakesView({items,records,open,home,create}:{items:Mistake[];records:RecordItem[];open:(m:Mistake)=>void;home:()=>void;create:()=>void}){return <><div className="page-actions"><button className="btn btn-soft" onClick={home}>بازگشت به صفحه اصلی</button><button className="btn btn-primary" onClick={create}><Plus size={16}/> ایجاد اشتباه دلخواه</button></div><div className="soft-banner"><Heart size={19}/><span>این‌ها برچسب شخصیت تو نیستند؛ فقط رفتارهایی هستند که می‌توانی بهتر بشناسی و تغییر بدهی.</span></div><div className="mistake-grid">{items.map(m=>{const count=records.filter(r=>r.mistakeId===m.id).length+m.count;return <button className="mistake" key={m.id} onClick={()=>open(m)}><div className="mistake-top"><div className="mistake-icon" style={{background:m.color+"20",color:m.color}}><Brain size={19}/></div><span className="badge" style={{background:m.color+"18",color:m.color}}>{count.toLocaleString("fa-IR")} مشاهده</span></div><h3 style={{fontSize:15,margin:"14px 0 5px"}}>{m.name}</h3><div className="muted">{m.category} · محرک: {m.trigger}</div><div className="intention">اگر دوباره رخ داد: {m.intention}</div></button>})}</div></>}
function CommitmentsView({items,mistake,complete}:{items:Commitment[];mistake:(id:number)=>Mistake;complete:(id:number)=>void}){return <section className="card section"><div className="section-title"><div><h2>تعهدهای کوچک و عملی</h2><div className="muted">پیامدها برای تنبیه نیستند؛ برای بازگشت به مسیرند.</div></div></div>{items.length?items.map(c=><div className="commitment-row" key={c.id}><div className="icon-box" style={{background:"#eeecff",color:"#6257d5"}}><Target size={19}/></div><div style={{flex:1}}><b>{c.title}</b><div className="muted">{c.reason} · مرتبط با {mistake(c.mistakeId).name}</div></div><span className={`badge ${deadlineState(new Date(c.due))==="overdue"?"orange":"blue"}`}>{new Date(c.due).toLocaleDateString("fa-IR")}</span><button className="btn btn-soft" onClick={()=>complete(c.id)}><CheckCircle2 size={15}/> انجام دادم</button></div>):<div className="empty"><CheckCircle2 size={35}/><p>همه تعهدها انجام شده‌اند. نفس راحت!</p></div>}</section>}
function JournalView({records,commitments,mistake}:{records:RecordItem[];commitments:Commitment[];mistake:(id:number)=>Mistake}){return <div className="grid-2"><section className="card section"><div className="section-title"><h2>یادداشت‌های خودآگاهی</h2><span className="badge purple">{records.length.toLocaleString("fa-IR")} یادداشت</span></div>{records.map(r=><div className="journal-entry" key={r.id} style={{borderRightColor:mistake(r.mistakeId).color}}><b>{mistake(r.mistakeId).name}</b><div className="muted">{r.date} · احساس: {r.feeling}</div><p>{r.note}</p><div className="lesson"><Sparkles size={14}/> یادگیری: {r.lesson||mistake(r.mistakeId).intention}</div></div>)}</section><section className="card section"><div className="section-title"><h2>بردهای کوچک من</h2></div>{commitments.filter(c=>c.status==="done").map(c=><div className="commitment-mini" key={c.id}><CheckCircle2 color="#168259"/><div><b>{c.title}</b><div className="muted">انجام شد · {mistake(c.mistakeId).name}</div></div></div>)}</section></div>}
function InsightsView({records}:{records:RecordItem[]}){const data=defaultMistakeTypes.map(m=>({name:m.name,count:records.filter(r=>r.mistakeId===m.id).length+m.count})).sort((a,b)=>b.count-a.count);return <><div className="stats"><div className="card stat"><span className="muted">محرک پرتکرار</span><strong style={{fontSize:17}}>خستگی</strong><span className="positive">اغلب بعد از ساعت ۹ شب</span></div><div className="card stat"><span className="muted">بهترین روز هفته</span><strong style={{fontSize:17}}>جمعه</strong><span className="positive">کمترین تکرار</span></div><div className="card stat"><span className="muted">روند ماه</span><strong>−۱۸٪</strong><span className="positive">پیشرفت آرام و واقعی</span></div><div className="card stat"><span className="muted">تعهد محبوب</span><strong style={{fontSize:17}}>مکث ۵ دقیقه‌ای</strong><span className="positive">بیشترین اثر ثبت‌شده</span></div></div><section className="card section" style={{marginTop:15}}><div className="section-title"><h2>الگوهایی که بیشتر دیده‌ام</h2><span className="badge purple">۳۰ روز اخیر</span></div>{data.map(d=><div className="insight-bar" key={d.name}><span>{d.name}</span><div><i style={{width:`${Math.min(100,d.count/12*100)}%`}}/></div><b>{d.count.toLocaleString("fa-IR")}</b></div>)}</section></>}
function ArchiveView({records,mistake}:{records:RecordItem[];mistake:(id:number)=>Mistake}){return <section className="card section"><div className="section-title"><div><h2>تاریخچه کامل</h2><div className="muted">هیچ یادداشتی بدون تصمیم خودت حذف نمی‌شود.</div></div><span className="badge blue">{records.length.toLocaleString("fa-IR")} رویداد</span></div>{records.map(r=><div className="timeline-item" key={r.id}><div className="timeline-dot" style={{background:mistake(r.mistakeId).color}}/><div><b>{mistake(r.mistakeId).name}</b><div className="muted">{r.date}</div><p>{r.note}</p></div></div>)}</section>}
function SettingsView(){return <div className="grid-2"><section className="card section"><div className="section-title"><h2>لحن و یادآوری‌ها</h2></div><label className="setting-label">زمان مرور روزانه<input className="field" type="time" defaultValue="21:00"/></label><label className="setting-label">سبک پیام‌ها<select className="field"><option>مهربان و تشویق‌کننده</option><option>کوتاه و مستقیم</option><option>بدون اعلان</option></select></label><button className="btn btn-primary">ذخیره</button></section><section className="card section"><div className="section-title"><h2>حریم خصوصی</h2></div><p className="muted" style={{lineHeight:1.9}}>این فضا شخصی است. می‌توانی برای ورود رمز تعیین کنی و در هر زمان یک نسخه از یادداشت‌هایت دریافت کنی.</p><button className="btn btn-soft"><Archive size={16}/> دریافت نسخه پشتیبان</button></section></div>}
