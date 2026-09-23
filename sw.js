/* Grand Tour v550. Written by standalone.js; edit it there. */
var CACHE="grandtour";
var KEEP=["./","index.html","manifest.webmanifest","icon-180.png","icon-512.png","assets/flags.json","assets/coast.json","fonts/abrilfatface.woff2","fonts/caveat.woff2","fonts/oswald.woff2","fonts/specialelite.woff2","fonts/staatliches.woff2"];
self.addEventListener("install",function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(KEEP.map(function(u){
      return fetch(u,{cache:"no-store"}).then(function(r){if(r.ok)return c.put(u,r);}).catch(function(){});
    }));
  }));
});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim());});
function keyOf(req){var u=new URL(req.url);return u.origin+u.pathname;}
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  var u=new URL(req.url);
  if(u.origin!==self.location.origin)return;
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
function pushLang(){
  return caches.open(CACHE).then(function(c){
    return c.match("gt-lang").then(function(r){return r?r.text():"en";});
  }).then(function(s){return PUSH_SAY[s]?s:"en";}).catch(function(){return "en";});
}
self.addEventListener("push",function(e){
  /* showNotification is not optional: a browser that is asked for userVisibleOnly and then shown
     nothing puts up its own "this site was updated in the background", which is worse than ours. */
  e.waitUntil(pushLang().then(function(lg){
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
