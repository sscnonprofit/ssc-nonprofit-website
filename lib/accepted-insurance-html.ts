export const acceptedInsuranceHtml = String.raw`<!-- =====================================================================
  SSC — Accepted Insurance Plans  (sscnonprofit.net palette)
  Custom HTML block styled with the .net site's design tokens:
    primary #6f0f29 (burgundy) · accent #ce8e54 (caramel) · green #558a49
    background #fcfaf8 · text #251d1d · border #e0dad6 · Bricolage Grotesque
  Self-contained: paste into one Elementor HTML widget (WordPress) or drop
  into a page/component on the Next.js site. If the host page already loads
  Bricolage Grotesque (sscnonprofit.net does), the font link below is a no-op.
  ===================================================================== -->




<style>
.ssc-ins{
  --p:#6f0f29;        /* primary burgundy */
  --p-dark:#4c0a1c;
  --a:#ce8e54;        /* caramel accent */
  --g:#558a49;        /* brand green */
  --t:#251d1d;        /* foreground */
  --bg:#fcfaf8;       /* background */
  --card:#ffffff;
  --sec:#f3eeea;      /* secondary / muted bg */
  --muted:#645958;    /* muted text */
  --line:#e0dad6;     /* border */
  --p-tint:#f7ebee; --a-tint:#faf0e4; --g-tint:#eef3ec;
  --r:16px; --r-sm:10px;
  --shadow:0 1px 2px rgba(37,29,29,.05),0 10px 28px rgba(111,15,41,.07);
  --shadow-h:0 2px 4px rgba(37,29,29,.07),0 18px 44px rgba(111,15,41,.13);
  --f:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;
  color:var(--t);font-family:var(--f);line-height:1.7;font-size:17px;
  background:var(--bg);max-width:1120px;margin:0 auto;padding:0 20px 64px}
.ssc-ins *{box-sizing:border-box}
.ssc-ins h2,.ssc-ins h3{font-family:var(--f);color:var(--t);font-weight:600;letter-spacing:-.025em;margin:0}
.ssc-ins h2{font-size:clamp(1.65rem,3.4vw,2.4rem);line-height:1.15}
.ssc-ins h3{font-size:1.15rem;line-height:1.35}
.ssc-ins p{margin:0 0 1rem}
.ssc-ins a{color:var(--p);text-decoration:underline;text-decoration-color:var(--a);text-decoration-thickness:2px;text-underline-offset:3px;transition:color .2s}
.ssc-ins a:hover{color:var(--a)}
.ssc-ins svg{display:block}
.ssc-ins__eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--a);margin-bottom:12px}
.ssc-ins__eyebrow::before{content:"";width:28px;height:2px;background:currentColor;border-radius:2px}
.ssc-ins__section{margin-top:72px}
.ssc-ins__head{max-width:680px;margin-bottom:28px}
.ssc-ins__head p{color:var(--muted);margin-top:12px}

/* ---------- HERO ---------- */
.ssc-ins__hero{position:relative;overflow:hidden;margin-top:32px;border-radius:24px;padding:clamp(32px,6vw,64px);
  background:radial-gradient(900px 380px at 105% -10%,rgba(206,142,84,.28),transparent 62%),linear-gradient(135deg,var(--p) 0%,var(--p-dark) 100%);color:#fcfaf8}
.ssc-ins__hero::after{content:"";position:absolute;right:-80px;bottom:-80px;width:320px;height:320px;border-radius:50%;border:40px solid rgba(252,250,248,.05);pointer-events:none}
.ssc-ins__hero .ssc-ins__eyebrow{color:var(--a)}
.ssc-ins__hero h2{color:#fcfaf8;font-size:clamp(2rem,5vw,3.2rem);font-weight:700;max-width:15ch}
.ssc-ins__hero p{font-size:1.15rem;max-width:56ch;opacity:.9;margin:18px 0 28px}
.ssc-ins__deadline{display:flex;flex-wrap:wrap;align-items:center;gap:14px 18px;background:rgba(252,250,248,.08);border:1px solid rgba(252,250,248,.2);
  backdrop-filter:blur(6px);border-radius:14px;padding:14px 18px;margin-bottom:28px;max-width:640px}
.ssc-ins__deadline svg{width:26px;height:26px;flex:0 0 26px;color:var(--a)}
.ssc-ins__deadline p{margin:0;font-size:1rem;flex:1 1 260px;opacity:1}
.ssc-ins__btns{display:flex;flex-wrap:wrap;gap:12px;position:relative;z-index:1}
.ssc-ins__btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:700;font-size:1rem;text-decoration:none!important;transition:transform .2s,box-shadow .2s,background .2s,color .2s}
.ssc-ins__btn svg{width:18px;height:18px}
.ssc-ins__btn:hover{transform:translateY(-2px)}
.ssc-ins__btn--light{background:#fcfaf8;color:var(--p)!important;box-shadow:0 8px 20px rgba(0,0,0,.2)}
.ssc-ins__btn--light:hover{background:var(--a);color:var(--t)!important}
.ssc-ins__btn--outline{border:2px solid rgba(252,250,248,.55);color:#fcfaf8!important}
.ssc-ins__btn--outline:hover{background:rgba(252,250,248,.12)}
.ssc-ins__btn--solid{background:var(--p);color:#fcfaf8!important;box-shadow:var(--shadow)}
.ssc-ins__btn--solid:hover{background:var(--p-dark)}

/* ---------- PLANS ---------- */
.ssc-ins__plans{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}
.ssc-ins__plan{position:relative;overflow:hidden;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:26px 22px 22px;box-shadow:var(--shadow);transition:transform .25s,box-shadow .25s,border-color .25s}
.ssc-ins__plan:hover{transform:translateY(-4px);box-shadow:var(--shadow-h);border-color:#d9c3ca}
.ssc-ins__plan::before{content:"";position:absolute;inset:0 0 auto 0;height:5px;background:linear-gradient(90deg,var(--p),var(--a))}
.ssc-ins__logo{height:48px;display:flex;align-items:center;margin-bottom:16px}
.ssc-ins__logo img{max-height:44px;max-width:170px;width:auto;object-fit:contain}
.ssc-ins__logo .ssc-ins__mono{display:none}
.ssc-ins__logo.is-fallback img{display:none}
.ssc-ins__logo.is-fallback .ssc-ins__mono{display:grid}
.ssc-ins__mono{width:52px;height:52px;border-radius:14px;place-items:center;background:var(--p-tint);color:var(--p);font-family:var(--f);font-weight:800;font-size:1.15rem}
.ssc-ins__plan h3{font-size:1.25rem}
.ssc-ins__pill{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:.8rem;font-weight:700;color:var(--g);background:var(--g-tint);border-radius:999px;padding:5px 12px}
.ssc-ins__pill svg{width:14px;height:14px}
.ssc-ins__meta{display:grid;grid-template-columns:1fr;gap:14px;margin-top:22px}
@media(min-width:760px){.ssc-ins__meta{grid-template-columns:1fr 1fr}}
.ssc-ins__callout{display:flex;gap:14px;align-items:flex-start;border-radius:var(--r-sm);padding:16px 18px;font-size:.95rem}
.ssc-ins__callout svg{width:22px;height:22px;flex:0 0 22px;margin-top:2px}
.ssc-ins__callout p{margin:0}
.ssc-ins__callout--warn{background:var(--a-tint);border:1px solid #e9d2b4;color:#6e4a1d}
.ssc-ins__callout--info{background:var(--sec);border:1px solid var(--line);color:var(--muted);font-style:italic}

/* ---------- TIMELINE ---------- */
.ssc-ins__why{display:grid;gap:36px;align-items:center}
@media(min-width:900px){.ssc-ins__why{grid-template-columns:1fr 1.1fr}}
.ssc-ins__why p{color:var(--muted)}
.ssc-ins__timeline{list-style:none;margin:0;padding:28px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);position:relative}
.ssc-ins__timeline li{position:relative;padding:0 0 26px 44px}
.ssc-ins__timeline li:last-child{padding-bottom:0}
.ssc-ins__timeline li::before{content:"";position:absolute;left:9px;top:28px;bottom:-2px;width:2px;background:var(--line)}
.ssc-ins__timeline li:last-child::before{display:none}
.ssc-ins__dot{position:absolute;left:0;top:4px;width:20px;height:20px;border-radius:50%;background:var(--card);border:4px solid var(--p)}
.ssc-ins__timeline li.is-key .ssc-ins__dot{border-color:var(--a);box-shadow:0 0 0 6px var(--a-tint)}
.ssc-ins__date{font-family:var(--f);font-weight:800;color:var(--p);font-size:1.1rem;display:block}
.ssc-ins__timeline li span:last-child{color:var(--muted);font-size:.95rem}

/* ---------- 5 QUESTIONS ---------- */
.ssc-ins__qs{list-style:none;counter-reset:q;padding:0;margin:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
@media(min-width:1000px){.ssc-ins__qs{grid-template-columns:repeat(6,1fr)}.ssc-ins__qs li{grid-column:span 2}.ssc-ins__qs li:nth-child(n+4){grid-column:span 3}}
.ssc-ins__qs li{counter-increment:q;position:relative;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px 22px 22px 84px;min-height:96px;display:flex;align-items:center;box-shadow:var(--shadow);font-weight:600;color:var(--t);transition:border-color .25s,transform .25s}
.ssc-ins__qs li:hover{border-color:var(--a);transform:translateY(-2px)}
.ssc-ins__qs li::before{content:counter(q,decimal-leading-zero);position:absolute;left:22px;top:50%;transform:translateY(-50%);font-family:var(--f);font-size:2rem;font-weight:800;line-height:1;
  background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;background-clip:text;color:transparent}

/* ---------- HELP CARD ---------- */
.ssc-ins__help{display:grid;gap:22px;align-items:center;margin-top:28px;padding:28px;border-radius:var(--r);background:linear-gradient(135deg,var(--a-tint),var(--p-tint));border:1px solid #ecdccd}
@media(min-width:760px){.ssc-ins__help{grid-template-columns:auto 1fr auto}}
.ssc-ins__help-ic{width:60px;height:60px;border-radius:16px;background:var(--card);display:grid;place-items:center;color:var(--p);box-shadow:var(--shadow)}
.ssc-ins__help-ic svg{width:30px;height:30px}
.ssc-ins__help h3{margin-bottom:4px}
.ssc-ins__help p{margin:0;color:var(--muted)}

/* ---------- FAQ ---------- */
.ssc-ins__faq{display:grid;gap:12px;max-width:820px}
.ssc-ins__faq details{background:var(--card);border:1px solid var(--line);border-radius:var(--r-sm);transition:box-shadow .25s,border-color .25s}
.ssc-ins__faq details[open]{box-shadow:var(--shadow);border-color:#d9c3ca}
.ssc-ins__faq summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;font-family:var(--f);font-weight:700;font-size:1.08rem;color:var(--p)}
.ssc-ins__faq summary::-webkit-details-marker{display:none}
.ssc-ins__faq summary:focus-visible{outline:3px solid var(--a);outline-offset:2px;border-radius:var(--r-sm)}
.ssc-ins__chev{flex:0 0 32px;width:32px;height:32px;border-radius:50%;background:var(--sec);display:grid;place-items:center;transition:transform .3s,background .3s,color .3s}
.ssc-ins__chev svg{width:16px;height:16px}
.ssc-ins__faq details[open] .ssc-ins__chev{transform:rotate(180deg);background:var(--p);color:#fcfaf8}
.ssc-ins__faq details p{padding:0 22px 20px;margin:0;color:var(--muted)}

/* ---------- CLOSING CTA ---------- */
.ssc-ins__cta{margin-top:72px;border-radius:24px;padding:clamp(32px,5vw,52px);background:linear-gradient(135deg,var(--p),var(--p-dark));color:#fcfaf8;display:grid;gap:24px;align-items:center;position:relative;overflow:hidden}
@media(min-width:860px){.ssc-ins__cta{grid-template-columns:1fr auto}}
.ssc-ins__cta::before{content:"";position:absolute;left:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:rgba(206,142,84,.14)}
.ssc-ins__cta h2{color:#fcfaf8;position:relative}
.ssc-ins__cta p{margin:10px 0 0;opacity:.88;position:relative}
.ssc-ins__cta a{color:#fcfaf8}
.ssc-ins__phone{font-family:var(--f);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:#fcfaf8!important;text-decoration:none!important;display:inline-flex;align-items:center;gap:12px;background:rgba(252,250,248,.08);border:1px solid rgba(252,250,248,.25);border-radius:999px;padding:14px 26px;position:relative;transition:background .2s,color .2s}
.ssc-ins__phone:hover{background:var(--a);color:var(--t)!important}
.ssc-ins__phone svg{width:24px;height:24px}
.ssc-ins .ssc-ins__disclaimer{font-size:.84rem;font-style:italic;color:var(--muted);text-align:center;max-width:760px;margin:28px auto 0}

/* ---------- motion ---------- */
.ssc-ins.js .ssc-reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}
.ssc-ins.js .ssc-reveal.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.ssc-ins *{transition:none!important}.ssc-ins.js .ssc-reveal{opacity:1;transform:none}}
@media(max-width:600px){.ssc-ins{font-size:16px}
  .ssc-ins__plans{gap:10px}.ssc-ins__plan{display:flex;align-items:center;gap:14px;padding:16px 16px 16px 18px}
  .ssc-ins__plan::before{inset:0 auto 0 0;width:5px;height:auto;background:linear-gradient(180deg,var(--p),var(--a))}
  .ssc-ins__logo{height:auto;flex:0 0 auto;margin:0;min-width:44px}.ssc-ins__logo img{max-height:30px;max-width:110px}.ssc-ins__mono{width:44px;height:44px;font-size:1rem;border-radius:12px}
  .ssc-ins__plan h3{font-size:1.05rem;flex:1}.ssc-ins__pill{margin:0}
  .ssc-ins__section{margin-top:56px}.ssc-ins__qs li{padding-left:72px}.ssc-ins__btn{width:100%;justify-content:center}}

/* Host integration: use the existing site font and keep narrow layouts accessible. */
.ssc-ins{--f:var(--font-bricolage),ui-sans-serif,system-ui,sans-serif;line-height:1.6}
.ssc-ins h1{font-family:var(--f);color:#fcfaf8;font-size:clamp(2rem,5vw,3.2rem);font-weight:700;letter-spacing:-.025em;line-height:1.15;max-width:15ch;margin:0;text-wrap:balance}
.ssc-ins__eyebrow{font-size:14px;color:var(--p)}
.ssc-ins__hero .ssc-ins__eyebrow{color:var(--a)}
.ssc-ins__pill{font-size:14px;color:var(--t)}
.ssc-ins__qs{grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.ssc-ins a:focus-visible{outline:3px solid var(--a);outline-offset:4px}
#ssc-ins-plans{scroll-margin-top:160px}
@media(min-width:1000px){.ssc-ins__qs{grid-template-columns:repeat(6,1fr)}}
@media(max-width:600px){.ssc-ins__plan{display:grid;grid-template-columns:44px minmax(0,1fr);gap:8px 14px}.ssc-ins__logo{grid-row:span 2}.ssc-ins__plan h3{overflow-wrap:anywhere}.ssc-ins__pill{justify-self:start}}
</style>

<section class="ssc-ins" id="ssc-ins" aria-labelledby="ssc-ins-title">

  <!-- ===== HERO ===== -->
  <header class="ssc-ins__hero">
    <span class="ssc-ins__eyebrow">Short-Term Rehab · Coverage</span>
    <h1 id="ssc-ins-title">Accepted Insurance Plans</h1>
    <p>Choosing care is easier when you know your coverage first. Here's who we work with, and how to check your plan.</p>

    <!-- Deadline bar: shows Oct 15 – Dec 7 only, with a live day count -->
    <div class="ssc-ins__deadline" id="ssc-ins-deadline" role="note">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      <p><strong>Medicare Open Enrollment ends December 7.</strong> Know your coverage, so you can choose your care.</p>
    </div>

    <div class="ssc-ins__btns">
      <a class="ssc-ins__btn ssc-ins__btn--light" href="#ssc-ins-plans">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>See accepted plans</a>
      <a class="ssc-ins__btn ssc-ins__btn--outline" href="tel:+19204582137">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>Call (920) 458-2137</a>
    </div>
  </header>

  <!-- ===== PLANS ===== -->
  <div class="ssc-ins__section ssc-reveal" id="ssc-ins-plans">
    <div class="ssc-ins__head">
      <span class="ssc-ins__eyebrow">Who we work with</span>
      <h2>Plans we accept for short-term rehab</h2>
      <p>Sheboygan Senior Community works primarily with the following for short-term rehabilitation:</p>
    </div>

    <ul class="ssc-ins__plans">
      <li class="ssc-ins__plan"><div class="ssc-ins__logo is-fallback"><div class="ssc-ins__mono" aria-hidden="true">M</div></div><h3>Medicare</h3>
        <span class="ssc-ins__pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Accepted</span></li>
      <li class="ssc-ins__plan"><div class="ssc-ins__logo is-fallback"><div class="ssc-ins__mono" aria-hidden="true">UH</div></div><h3>UnitedHealthcare</h3>
        <span class="ssc-ins__pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Accepted</span></li>
      <li class="ssc-ins__plan"><div class="ssc-ins__logo is-fallback"><div class="ssc-ins__mono" aria-hidden="true">NH</div></div><h3>Network Health</h3>
        <span class="ssc-ins__pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Accepted</span></li>
      <li class="ssc-ins__plan"><div class="ssc-ins__logo is-fallback"><div class="ssc-ins__mono" aria-hidden="true">H</div></div><h3>Humana</h3>
        <span class="ssc-ins__pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Accepted</span></li>
    </ul>

    <div class="ssc-ins__meta">
      <div class="ssc-ins__callout ssc-ins__callout--warn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/></svg>
        <p><strong>This list does not apply to Medicare co-insurance plans.</strong></p>
      </div>
      <div class="ssc-ins__callout ssc-ins__callout--info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <p>Last updated October 2026 for the 2027 plan year. Participation can vary by specific plan and can change. Please verify before admission.</p>
      </div>
    </div>
  </div>

  <!-- ===== WHY NOW ===== -->
  <div class="ssc-ins__section ssc-ins__why ssc-reveal">
    <div>
      <span class="ssc-ins__eyebrow">Timing matters</span>
      <h2>Why review your coverage now?</h2>
      <p style="margin-top:14px">Medicare's Open Enrollment period runs from October 15 to December 7. This is the main time each year to change Medicare Advantage and Part D plans for the coming year. After December 7, options are much more limited.</p>
    </div>
    <ol class="ssc-ins__timeline" aria-label="Medicare Open Enrollment timeline">
      <li><span class="ssc-ins__dot"></span><span class="ssc-ins__date">October 15</span><span>Open Enrollment begins. Compare plans for next year.</span></li>
      <li class="is-key"><span class="ssc-ins__dot"></span><span class="ssc-ins__date">December 7</span><span>Last day to change Medicare Advantage or Part D plans.</span></li>
      <li><span class="ssc-ins__dot"></span><span class="ssc-ins__date">January 1</span><span>Your new plan choices take effect.</span></li>
    </ol>
  </div>

  <!-- ===== 5 QUESTIONS =====
       DRAFT: source doc said "insert 5 questions from above" but didn't include them.
       Have SSC admissions approve or replace before publishing. -->
  <div class="ssc-ins__section ssc-reveal">
    <div class="ssc-ins__head">
      <span class="ssc-ins__eyebrow">Before you decide</span>
      <h2>5 questions to ask about your plan</h2>
    </div>
    <ol class="ssc-ins__qs">
      <li>Is Sheboygan Senior Community in my plan's network for short-term rehab?</li>
      <li>Does my plan require prior authorization before a rehab stay?</li>
      <li>What will I pay per day — copays, coinsurance, or a deductible?</li>
      <li>How many days of short-term rehab does my plan cover?</li>
      <li>Does my plan require a hospital stay before rehab, and does an "observation" stay count?</li>
    </ol>

    <div class="ssc-ins__help">
      <div class="ssc-ins__help-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
      </div>
      <div>
        <h3>Free, unbiased help is available</h3>
        <p>The <a href="https://www.sheboygancounty.com/departments/departments-f-q/health-and-human-services/aging-and-disability-resource-center" target="_blank" rel="noopener">Aging &amp; Disability Resource Center (ADRC) of Sheboygan County</a> can help you compare plans at no cost.</p>
        <!-- TODO: add other free resources (e.g. Patch Adams) once contacted -->
      </div>
      <a class="ssc-ins__btn ssc-ins__btn--solid" href="tel:+19204674100">Call ADRC 920-467-4100</a>
    </div>
  </div>

  <!-- ===== FAQ ===== -->
  <div class="ssc-ins__section ssc-reveal">
    <div class="ssc-ins__head">
      <span class="ssc-ins__eyebrow">Common questions</span>
      <h2>Insurance FAQs</h2>
    </div>
    <div class="ssc-ins__faq">
      <details>
        <summary>Does SSC work with my plan?<span class="ssc-ins__chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
        <p>See the list of accepted plans above. Participation can vary by specific plan, so please verify with us or your plan before admission.</p>
      </details>
      <!-- HIDDEN until Admissions confirms the answer. Uncomment and fill in when ready.
      <details>
        <summary>Do you work with Medicare supplement (Medigap) plans?<span class="ssc-ins__chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
        <p>ANSWER FROM ADMISSIONS</p>
      </details>
      -->
      <details>
        <summary>Can you help me choose a plan?<span class="ssc-ins__chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
        <p>No. We don't sell or recommend plans, but we can point you to free, unbiased assistance, such as the ADRC of Sheboygan County.</p>
      </details>
      <details>
        <summary>What if my plan isn't listed?<span class="ssc-ins__chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
        <p>Call us at <a href="tel:+19204582137">(920) 458-2137</a>. We'll look at your situation, and if we're not the right fit, we can try to help you understand your options.</p>
      </details>
    </div>
  </div>

  <!-- ===== CLOSING CTA ===== -->
  <div class="ssc-ins__cta ssc-reveal">
    <div>
      <h2>Not sure about your coverage?</h2>
      <p>Our team is happy to walk through your situation with you. You can also <a href="/short-term-rehab">learn more about Short-Term Rehab</a>.</p>
    </div>
    <a class="ssc-ins__phone" href="tel:+19204582137">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>(920) 458-2137</a>
  </div>

  <p class="ssc-ins__disclaimer">Sheboygan Senior Community (SSC) is not connected with or endorsed by the federal Medicare program. Plan participation can change, and decisions are made on a case-by-case basis. Call us or your plan to confirm your coverage.</p>
</section>



<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"Does SSC work with my plan?","acceptedAnswer":{"@type":"Answer","text":"Sheboygan Senior Community works primarily with Medicare, UnitedHealthcare, Network Health, and Humana for short-term rehabilitation. Participation can vary by specific plan, so please verify before admission."}},
{"@type":"Question","name":"Can you help me choose a plan?","acceptedAnswer":{"@type":"Answer","text":"No. We don't sell or recommend plans, but we can point you to free, unbiased assistance, such as the ADRC of Sheboygan County."}},
{"@type":"Question","name":"What if my plan isn't listed?","acceptedAnswer":{"@type":"Answer","text":"Call us at (920) 458-2137. We'll look at your situation, and if we're not the right fit, we can try to help you understand your options."}}
]}
</script>`
