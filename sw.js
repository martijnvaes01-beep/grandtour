/* Grand Tour v399. Written by standalone.js; edit it there. */
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
