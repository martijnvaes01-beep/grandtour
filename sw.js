/* Grand Tour v818. Written by standalone.js; edit it there. */
var CACHE="grandtour";
var KEEP=["assets/app.2017a72cbe.js","./","index.html","manifest.webmanifest","icon-180.png","icon-512.png","assets/flags.96aa85ca2f.json","assets/coast.c087b86c1b.json","assets/zing.162e1052e8.json","assets/more.b89ddfda92.json","fonts/abrilfatface.woff2","fonts/caveat.woff2","fonts/oswald.woff2","fonts/specialelite.woff2","fonts/staatliches.woff2"];
self.addEventListener("install",function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    /* THE PAGE ONCE, NOT TWICE (v675, the code review): "./" and "index.html" are the same 1.5 MB, and
       each was fetched on its own. One fetch, kept under both names. The fonts never change their bytes,
       so they may come out of the HTTP cache the page has just filled. */
    return Promise.all(KEEP.filter(function(u){return u!=="./";}).map(function(u){
      var mode=/^fonts\//.test(u)?"default":"no-store";
      return fetch(u,{cache:mode}).then(function(r){
        if(!r.ok)return;
        if(u==="index.html")return Promise.all([c.put("./",r.clone()),c.put(u,r)]);
        return c.put(u,r);
      }).catch(function(){});
    }));
  }));
});
/* a hashed asset another build asked for is dead weight: gone when this worker takes over (v591) */
var HASHED=/\/assets\/[a-z]+\.[0-9a-f]{10}\.json$/;
self.addEventListener("activate",function(e){e.waitUntil(caches.open(CACHE).then(function(c){
  return c.keys().then(function(ks){return Promise.all(ks.map(function(k){
    var p=new URL(k.url).pathname;
    if(HASHED.test(p)&&!KEEP.some(function(u){return p.slice(-u.length)===u;}))return c.delete(k);
  }));});
}).catch(function(){}).then(function(){return self.clients.claim();}));});
function keyOf(req){var u=new URL(req.url);return u.origin+u.pathname;}
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  var u=new URL(req.url);
  if(u.origin!==self.location.origin)return;
  /* A NAME THAT IS ITS CONTENT NEVER CHANGES, so its copy is the answer and the network is only for
     the first time (v591). Everything else is still network first. */
  if(HASHED.test(u.pathname)){
    e.respondWith(caches.open(CACHE).then(function(c){
      return c.match(keyOf(req)).then(function(hit){
        return hit||fetch(req).then(function(r){if(r&&r.ok)c.put(keyOf(req),r.clone());return r;});
      });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function(r){
    if(r&&r.ok&&r.type==="basic"){
      var copy=r.clone();
      caches.open(CACHE).then(function(c){c.put(keyOf(req),copy);}).catch(function(){});
    }
    return r;
  }).catch(function(){
    return caches.open(CACHE).then(function(c){
      return c.match(keyOf(req)).then(function(hit){
        if(hit)return hit;
        if(req.mode==="navigate")return c.match(new URL("index.html",self.registration.scope).href)
          .then(function(p){return p||c.match(new URL("./",self.registration.scope).href);});
        return Response.error();
      });
    });
  }));
});

/* ================= PUSH (v518) =================
   A push here carries no body at all - see worker/push.js for why - so there is nothing to decrypt
   and nothing about anybody's duel has passed through Google's servers. What arrives is "something
   happened"; the wording is fixed and the game works out what actually changed when it is opened,
   which it already does six seconds into every boot.

   THE LANGUAGE COMES OUT OF THE CACHE, because a service worker cannot read localStorage and the
   page's language lives there. The page writes it into this cache whenever it changes and whenever
   a device subscribes; a worker that finds nothing falls back to English, which is what t() does.
   The Cache API is used rather than IndexedDB for one reason: this worker already opens a cache,
   and three lines of something already here beats twenty of something new. */
/* ONE SENTENCE THAT IS TRUE OF BOTH THINGS A PUSH CAN MEAN (v531): a challenge of yours answered,
   or somebody wanting revenge. A push carries no body, so the worker cannot say which, and a line
   that named one would be wrong half the time. Post waiting at the bureau is both, and it is what
   the letter a result arrives in already is. */
var PUSH_SAY={
  en:["Grand Tour","There's post for you at the duel bureau."],
  nl:["Grand Tour","Er ligt post voor je bij het duelbureau."],
  fr:["Grand Tour","Du courrier vous attend au bureau des duels."],
  de:["Grand Tour","Im Duellbüro liegt Post für dich."],
  es:["Grand Tour","Tienes correo en la oficina de duelos."]
};
/* THE EVENING REMINDER FOR THE DAILY (v796). Still no body: the worker keeps one letter per device
   saying what it last woke it for ("d" the daily, "x" a duel), and this asks for it by the device's own
   endpoint. If that cannot be had in three seconds it is a duel, which is what every push was before.
   The run of days comes from the cache the page writes when a day is finished ("gt-day"). */
var PUSH_DAY={
  en:["The daily is waiting","Today's daily is still open. Five games, one try.","Your {n}-day run is still alive. Today's daily is waiting."],
  nl:["De daily wacht","De daily van vandaag staat nog open. Vijf spellen, één poging.","Je reeks van {n} dagen leeft nog. De daily van vandaag wacht op je."],
  fr:["La partie du jour attend","La partie du jour est encore ouverte. Cinq jeux, un seul essai.","Votre série de {n} jours tient toujours. La partie du jour vous attend."],
  de:["Das Tagesspiel wartet","Das Tagesspiel von heute ist noch offen. Fünf Spiele, ein Versuch.","Deine Serie von {n} Tagen lebt noch. Das Tagesspiel wartet."],
  es:["La partida del día espera","La partida de hoy sigue abierta. Cinco juegos, un intento.","Tu racha de {n} días sigue viva. La partida de hoy te espera."]
};
var PUSH_WHY="https://grandtour-scores.martijnvaes01.workers.dev/api/push/why";
function pushWhy(){
  return self.registration.pushManager.getSubscription().then(function(sub){
    if(!sub)return "x";
    var ctl=new AbortController();setTimeout(function(){ctl.abort();},3000);
    return fetch(PUSH_WHY,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({ep:sub.endpoint}),signal:ctl.signal})
      .then(function(r){return r.json();}).then(function(j){return j&&j.k==="d"?"d":"x";});
  }).catch(function(){return "x";});
}
function pushDayRun(){
  return caches.open(CACHE).then(function(c){return c.match("gt-day");})
    .then(function(r){return r?r.json():null;}).catch(function(){return null;});
}
function localDay(n){var d=new Date(Date.now()+(n||0)*864e5);
  return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
function pushLang(){
  return caches.open(CACHE).then(function(c){
    return c.match("gt-lang").then(function(r){return r?r.text():"en";});
  }).then(function(s){return PUSH_SAY[s]?s:"en";}).catch(function(){return "en";});
}
self.addEventListener("push",function(e){
  /* showNotification is not optional: a browser that is asked for userVisibleOnly and then shown
     nothing puts up its own "this site was updated in the background", which is worse than ours. */
  e.waitUntil(Promise.all([pushLang(),pushWhy(),pushDayRun()]).then(function(a){
    var lg=a[0],why=a[1],run=a[2];
    if(why==="d"){
      var dy=PUSH_DAY[lg]||PUSH_DAY.en,n=run&&run.d===localDay(-1)?(run.s|0):0;
      return self.registration.showNotification(dy[0],{
        body:n>=2?dy[2].replace("{n}",n):dy[1],
        icon:"icon-512.png",badge:"icon-180.png",
        tag:"gt-daily",renotify:false,
        data:{go:"?day=1"}
      });
    }
    var say=PUSH_SAY[lg];
    return self.registration.showNotification(say[0],{
      body:say[1],
      icon:"icon-512.png",
      badge:"icon-180.png",
      tag:"gt-duel",          /* one at a time: three results waiting is still one thing to look at */
      renotify:true,
      data:{go:"?duel=1"}
    });
  }));
});
self.addEventListener("notificationclick",function(e){
  e.notification.close();
  var go=(e.notification.data&&e.notification.data.go)||"";
  /* FOCUS WHAT IS ALREADY OPEN RATHER THAN OPENING A SECOND ONE. Two copies of this game in two
     tabs is the case the save's own second-tab warning exists for, and a notification that causes
     it would be this feature making that problem rather than avoiding it. */
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){
      if(list[i].url.indexOf(self.registration.scope)===0&&"focus" in list[i])return list[i].focus();
    }
    if(self.clients.openWindow)return self.clients.openWindow(new URL(go||"./",self.registration.scope).href);
  }));
});
