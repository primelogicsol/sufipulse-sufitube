!function(){try{var a="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},b=(new a.Error).stack;b&&(a._sentryDebugIds=a._sentryDebugIds||{},a._sentryDebugIds[b]="8e67875a-a206-4faa-ad23-470a90293cd2",a._sentryDebugIdIdentifier="sentry-dbid-8e67875a-a206-4faa-ad23-470a90293cd2")}catch(a){}}();"use strict";(()=>{var a={};a.id=605,a.ids=[605],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8086:a=>{a.exports=require("module")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14985:a=>{a.exports=require("dns")},19063:a=>{a.exports=require("require-in-the-middle")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},19771:a=>{a.exports=require("process")},21820:a=>{a.exports=require("os")},27910:a=>{a.exports=require("stream")},28354:a=>{a.exports=require("util")},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{a.exports=require("node:child_process")},33873:a=>{a.exports=require("path")},34631:a=>{a.exports=require("tls")},36686:a=>{a.exports=require("diagnostics_channel")},37067:a=>{a.exports=require("node:http")},38522:a=>{a.exports=require("node:zlib")},41692:a=>{a.exports=require("node:tls")},44708:a=>{a.exports=require("node:https")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{a.exports=require("node:os")},53053:a=>{a.exports=require("node:diagnostics_channel")},53567:(a,b,c)=>{c.a(a,async(a,d)=>{try{c.r(b),c.d(b,{handler:()=>x,patchFetch:()=>w,routeModule:()=>y,serverHooks:()=>B,workAsyncStorage:()=>z,workUnitAsyncStorage:()=>A});var e=c(3690),f=c(56947),g=c(75250),h=c(31652),i=c(75082),j=c(261),k=c(42412),l=c(16614),m=c(11966),n=c(79485),o=c(37579),p=c(19985),q=c(83847),r=c(73808),s=c(86439),t=c(10574),u=c(80376),v=a([u]);u=(v.then?(await v)():v)[0];let y=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/notify/route",pathname:"/api/notify",filename:"route",bundlePath:"app/api/notify/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\Fayaz\\Sufipulseupdate2026\\Sufipulseupdate\\app\\api\\notify\\route.ts",nextConfigOutput:"standalone",userland:u}),{workAsyncStorage:z,workUnitAsyncStorage:A,serverHooks:B}=y;function w(){return(0,g.patchFetch)({workAsyncStorage:z,workUnitAsyncStorage:A})}async function x(a,b,c){var d;let e="/api/notify/route";"/index"===e&&(e="/");let g=await y.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(z.dynamicRoutes[E]||z.routes[D]);if(F&&!x){let a=!!z.routes[D],b=z.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||y.isDev||x||(G=D,G="/index"===G?"/":G);let H=!0===y.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>y.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>y.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await y.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await y.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await y.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}d()}catch(a){d(a)}})},55511:a=>{a.exports=require("crypto")},55591:a=>{a.exports=require("https")},56801:a=>{a.exports=require("import-in-the-middle")},57075:a=>{a.exports=require("node:stream")},57975:a=>{a.exports=require("node:util")},59735:(a,b,c)=>{c.a(a,async(a,d)=>{try{c.d(b,{WV:()=>i,ZT:()=>l,oC:()=>j});var e=c(62187),f=c(63808),g=c(88723),h=a([f]);async function i(a){let b=a.cookies.get("access_token")?.value??null;if(!b)return null;let c=await (0,f.$Y)(b);if(!c?.userId)return null;let d=g.N.findById(c.userId);if(!d||d.is_blocked)return null;let{password_hash:e,...h}=d;return h}async function j(a){let b=await i(a);return b||e.NextResponse.json({error:"Not authenticated"},{status:401})}async function k(a,...b){let c=await j(a);return c instanceof e.NextResponse||b.includes(c.role)?c:e.NextResponse.json({error:"Forbidden"},{status:403})}f=(h.then?(await h)():h)[0];let l=a=>k(a,"admin");d()}catch(a){d(a)}})},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{a.exports=require("node:fs")},73566:a=>{a.exports=require("worker_threads")},74998:a=>{a.exports=require("perf_hooks")},75919:a=>{a.exports=require("node:worker_threads")},76760:a=>{a.exports=require("node:path")},77030:a=>{a.exports=require("node:net")},78474:a=>{a.exports=require("node:events")},79551:a=>{a.exports=require("url")},79646:a=>{a.exports=require("child_process")},80376:(a,b,c)=>{c.a(a,async(a,d)=>{try{c.r(b),c.d(b,{DELETE:()=>u,GET:()=>q,HEAD:()=>v,OPTIONS:()=>w,PATCH:()=>t,POST:()=>r,PUT:()=>s});var e=c(63033),f=c(62187),g=c(59735),h=c(7688),i=a([g]);g=(i.then?(await i)():i)[0];let l=null;try{l=c(75961)}catch{}let m=process.env.FROM_EMAIL||"noreply@sufipulse.com",n="SufiPulse";async function j(a){let b,c=await (0,g.ZT)(a);if(c instanceof f.NextResponse)return c;try{b=await a.json()}catch{return f.NextResponse.json({error:"Invalid JSON"},{status:400})}let{to:d,subject:e,name:h,role:i,event:j,message:k,action_url:o,reference:p}=b;if(!d||!d.includes("@")||!e||!k)return f.NextResponse.json({error:"Missing required fields"},{status:400});let q=process.env.SMTP_HOST,r=parseInt(process.env.SMTP_PORT||"587",10),s=process.env.SMTP_USER,t=process.env.SMTP_PASS;if(!l||!q||!s||!t)return console.log(`[SufiPulse Email] TO:${d} SUBJECT:${e}
${k}`),f.NextResponse.json({sent:!1,reason:"SMTP not configured"});try{let a=l.createTransport({host:q,port:r,secure:465===r,auth:{user:s,pass:t}}),b=function(a){let{name:b,role:c,event:d,message:e,action_url:f,reference:g}=a,h={application_received:"#f59e0b",under_review:"#3b82f6",approved:"#10b981",revision_requested:"#f59e0b",rejected:"#ef4444",kalam_approved:"#10b981",kalam_revision:"#f59e0b",kalam_submitted:"#6366f1",sada_submitted:"#6366f1",article_submitted:"#6366f1",assignment_received:"#8b5cf6",royalty_paid:"#10b981",session_scheduled:"#3b82f6",session_completed:"#10b981"}[d]||"#f59e0b",i="http://localhost:3000";return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SufiPulse</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;background:#111111;border-radius:12px 12px 0 0;border-bottom:1px solid #2a2a2a;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${n}</div>
                    <div style="font-size:12px;color:#888;margin-top:2px;">Musical Registry &amp; Creative Production</div>
                  </td>
                  <td align="right">
                    <div style="display:inline-block;background:${h}20;border:1px solid ${h}50;color:${h};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize;">
                      ${d.replace(/_/g," ")}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;background:#111111;">
              <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${({writer:"Ahl-e-Qalam \xb7 Writer",vocalist:"Ahl-e-Sada \xb7 Vocalist",producer:"Ahl-e-Naghma \xb7 Producer",literary:"Ahl-e-Tahreer \xb7 Literary Contributor",studio:"Studio Engineer / Partner",admin:"SufiPulse Administration"})[c]||c}</p>
              <p style="margin:0 0 24px;color:#ffffff;font-size:20px;font-weight:600;">Dear ${b},</p>
              <p style="margin:0 0 24px;color:#cccccc;font-size:15px;line-height:1.7;">${e}</p>

              ${g?`<p style="margin:0 0 24px;color:#666;font-size:13px;">Reference: <span style="color:#888;">${g}</span></p>`:""}

              ${"approved"===d?`
              <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-left:3px solid ${h};border-radius:8px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 8px;color:#ffffff;font-weight:600;font-size:14px;">Accessing Your Dashboard</p>
                <p style="margin:0 0 4px;color:#aaa;font-size:13px;">1. Visit <a href="${i}/login" style="color:${h};">${i}/login</a></p>
                <p style="margin:0 0 4px;color:#aaa;font-size:13px;">2. Sign in with your registered email address</p>
                <p style="margin:0 0 4px;color:#aaa;font-size:13px;">3. Use the password you set during registration</p>
                <p style="margin:0;color:#aaa;font-size:13px;">4. Navigate to your contributor dashboard to begin</p>
              </div>
              <p style="margin:0 0 24px;color:#666;font-size:12px;">
                If you haven't created an account yet, 
                <a href="${i}/register" style="color:${h};">register here</a> 
                using this email address to activate your dashboard.
              </p>
              `:""}

              ${f?`
              <div style="text-align:center;margin-top:32px;">
                <a href="${f}" style="display:inline-block;background:${h};color:#000;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
                  ${"approved"===d?"Go to My Dashboard":"revision_requested"===d?"View My Profile":"View Status"}
                </a>
              </div>
              `:""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#0d0d0d;border-top:1px solid #1a1a1a;border-radius:0 0 12px 12px;">
              <p style="margin:0;color:#444;font-size:12px;text-align:center;">
                \xa9 ${new Date().getFullYear()} SufiPulse \xb7 Musical Registry \xb7 Production Division<br/>
                This is an automated notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}({name:h,role:i,event:j,message:k,action_url:o,reference:p});return await a.sendMail({from:`"${n}" <${m}>`,to:d,subject:e,html:b,text:k}),f.NextResponse.json({sent:!0})}catch(a){return console.error("[SufiPulse Email Error]",a),f.NextResponse.json({sent:!1,error:a.message},{status:500})}}let o={...e},p="workUnitAsyncStorage"in o?o.workUnitAsyncStorage:"requestAsyncStorage"in o?o.requestAsyncStorage:void 0;function k(a,b){return"phase-production-build"===process.env.NEXT_PHASE||"function"!=typeof a?a:new Proxy(a,{apply:(a,c,d)=>{let e;try{let a=p?.getStore();e=a?.headers}catch{}return h.wrapRouteHandlerWithSentry(a,{method:b,parameterizedRoute:"/api/notify",headers:e}).apply(c,d)}})}let q=k(void 0,"GET"),r=k(j,"POST"),s=k(void 0,"PUT"),t=k(void 0,"PATCH"),u=k(void 0,"DELETE"),v=k(void 0,"HEAD"),w=k(void 0,"OPTIONS");d()}catch(a){d(a)}})},80481:a=>{a.exports=require("node:readline")},81630:a=>{a.exports=require("http")},84297:a=>{a.exports=require("async_hooks")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},86592:a=>{a.exports=require("node:inspector")},91645:a=>{a.exports=require("net")},93139:a=>{a.exports=import("bcryptjs")},94735:a=>{a.exports=require("events")},96456:a=>{a.exports=require("zlib")}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[6323,7688,1510,1477,7720],()=>b(b.s=53567));module.exports=c})();
//# sourceMappingURL=route.js.map