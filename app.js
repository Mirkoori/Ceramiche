
(function(){
"use strict";

/* ---------- utilità ---------- */
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var eur=function(n){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(Number(n)||0)};
var $=function(s,r){return (r||document).querySelector(s)};
var CATS=["Ciotole","Piatti","Tazze","Vasi","Decorazioni"];
var TYPES=[["ciotola","Ciotola"],["piatto","Piatto"],["tazza","Tazza"],["vaso","Vaso"]];

var DEFAULTS={
  brand:"Nome Brand",
  tagline:"Ceramiche artigianali dalla Turchia",
  story:"Selezioniamo ceramiche dipinte a mano in piccoli laboratori turchi, dove la tradizione di Iznik e Kütahya è ancora un mestiere di famiglia. Ogni pezzo arriva da noi, lo guardiamo uno a uno e lo imballiamo con cura prima di spedirlo.",
  shippingCost:7.9, freeFrom:90, shippingDays:"3-5 giorni lavorativi",
  company:"", vat:"", address:"", email:"", phone:"", instagram:"", rea:"", pec:"", regime:"forfettario"
};
var DEMO=[
  {id:"demo-1",name:"Ciotola Iznik cobalto",category:"Ciotole",type:"ciotola",price:34,stock:6,c1:"#1d3fae",c2:"#37b6c9",dims:"Ø 18 cm · h 8 cm",desc:"Ciotola dipinta a mano con motivi floreali in blu cobalto su fondo bianco. Adatta a zuppe, frutta o come centrotavola.",demo:true},
  {id:"demo-2",name:"Piatto da portata Kütahya",category:"Piatti",type:"piatto",price:58,stock:3,c1:"#0c8a87",c2:"#1d3fae",dims:"Ø 32 cm",desc:"Grande piatto decorato con bordo geometrico turchese e blu. Ogni pezzo ha piccole variazioni di smalto.",demo:true},
  {id:"demo-3",name:"Tazza turchese, set da 2",category:"Tazze",type:"tazza",price:36,stock:10,c1:"#17b3ad",c2:"#e9f4f2",dims:"Ø 8 cm · h 9 cm · 280 ml",desc:"Due tazze a smalto turchese lucido, con manico a anello. Per caffè lungo, tè o cioccolata.",demo:true},
  {id:"demo-4",name:"Vaso Anatolia",category:"Vasi",type:"vaso",price:78,stock:2,c1:"#b9552f",c2:"#f0c38a",dims:"h 28 cm · Ø 15 cm",desc:"Vaso dalla forma slanciata con smalto color terra e decorazione dorata a pennello.",demo:true},
  {id:"demo-5",name:"Piatto da dolce blu e bianco",category:"Piatti",type:"piatto",price:24,stock:12,c1:"#2f55d1",c2:"#ffffff",dims:"Ø 20 cm",desc:"Piatto da dolce con decoro a tulipani, il fiore simbolo della ceramica ottomana.",demo:true},
  {id:"demo-6",name:"Ciotola da tè turchese",category:"Ciotole",type:"ciotola",price:19,stock:0,c1:"#0f9d9a",c2:"#9be3dc",dims:"Ø 11 cm · h 6 cm",desc:"Piccola ciotola per tè, spuntini o piccoli oggetti. Smalto brillante e interno chiaro.",demo:true}
];

/* ---------- illustrazione vasellame ---------- */
function vessel(type,c1,c2,w){
  var id="g"+Math.random().toString(36).slice(2,8), a=c1||"#1d3fae", b=c2||"#ffffff", body="", extra="";
  var defs='<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+a+'" stop-opacity=".78"/></linearGradient></defs>';
  var shadow='<ellipse cx="100" cy="170" rx="62" ry="7" fill="#000" opacity=".18"/>';
  if(type==="piatto"){
    shadow='<ellipse cx="100" cy="150" rx="84" ry="8" fill="#000" opacity=".18"/>';
    body='<ellipse cx="100" cy="128" rx="86" ry="26" fill="url(#'+id+')"/><ellipse cx="100" cy="124" rx="62" ry="16" fill="'+b+'" opacity=".92"/><ellipse cx="100" cy="124" rx="44" ry="10" fill="none" stroke="'+a+'" stroke-width="3" stroke-dasharray="3 6"/><ellipse cx="100" cy="119" rx="70" ry="12" fill="#fff" opacity=".12"/>';
  }else if(type==="tazza"){
    body='<path d="M56 76 H140 V132 Q140 164 98 164 Q56 164 56 132 Z" fill="url(#'+id+')"/><path d="M140 92 Q172 92 172 120 Q172 146 138 146" fill="none" stroke="'+a+'" stroke-width="12" stroke-linecap="round"/><ellipse cx="98" cy="76" rx="42" ry="9" fill="'+b+'" opacity=".95"/><path d="M56 108 H140" stroke="'+b+'" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round" opacity=".9"/><path d="M66 90 V140" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".2"/>';
  }else if(type==="vaso"){
    body='<path d="M82 34 H118 L116 62 Q158 84 158 122 Q158 166 100 168 Q42 166 42 122 Q42 84 84 62 Z" fill="url(#'+id+')"/><ellipse cx="100" cy="34" rx="18" ry="5" fill="'+b+'" opacity=".9"/><path d="M48 124 Q100 146 152 124" fill="none" stroke="'+b+'" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round" opacity=".9"/><path d="M62 98 Q56 124 66 148" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".2"/>';
  }else{
    body='<path d="M26 82 Q28 150 100 164 Q172 150 174 82 Z" fill="url(#'+id+')"/><ellipse cx="100" cy="82" rx="74" ry="16" fill="'+b+'" opacity=".95"/><ellipse cx="100" cy="84" rx="62" ry="11" fill="'+a+'" opacity=".35"/><path d="M40 112 Q100 134 160 112" fill="none" stroke="'+b+'" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round" opacity=".9"/><rect x="74" y="160" width="52" height="8" rx="3" fill="'+a+'" opacity=".85"/><path d="M42 100 Q50 130 78 148" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".2"/>';
  }
  return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(type)+'"'+(w?' width="'+w+'"':'')+'>'+defs+shadow+body+extra+'</svg>';
}
function picOf(p){
  if(p.images&&p.images.length) return '<img src="'+esc(U(p.images[0]))+'" alt="'+esc(p.name)+'" loading="lazy">';
  return '<div style="width:100%;height:100%;background:color-mix(in srgb,'+esc(p.c1||"#1d3fae")+' 16%,var(--surface2));display:flex;align-items:center;justify-content:center">'+vessel(p.type,p.c1,p.c2)+'</div>';
}

/* ---------- stato ---------- */
var ADMIN=!!window.ADMIN_PAGE;
var sb=null, session=null, isAdmin=false;
var ADMIN_EMAIL="negozio-admin@example.com";
var SUPA_URL="https://dbstgkxqnzbaxxxdgqum.supabase.co", SUPA_KEY="sb_publishable_8POu32i6i-kz4IZlbjOQHw_Nrofggk0";
function U(path){ return SUPA_URL+"/storage/v1/object/public/shop-images/"+encodeURI(path); }
var products=[], loaded=false, orders=[], settings=Object.assign({},DEFAULTS);
var cart=[], filterCat="Tutti", flash=null, gallery=0, btype="privato";
var adminTab="prodotti", edit=null, confirmDel=null, busy=false;
try{ cart=JSON.parse(localStorage.getItem("cart-v1")||"[]")||[]; }catch(e){ cart=[]; }
function saveCart(){ try{ localStorage.setItem("cart-v1",JSON.stringify(cart)); }catch(e){} }

function shop(){
  var live=loaded&&products.length?products.filter(function(p){return p.visible!==false}):null;
  if(live){ live.sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0)}); return live; }
  return DEMO;
}
function usingDemo(){ return !(loaded&&products.length); }
function byId(id){ var l=shop(); for(var i=0;i<l.length;i++) if(l[i].id===id) return l[i]; return null; }
function cartLines(){
  var out=[]; cart.forEach(function(c){ var p=byId(c.id); if(p) out.push({p:p,qty:Math.min(c.qty,Math.max(p.stock||0,0)||c.qty)}); }); return out;
}
function totals(){
  var sub=0; cartLines().forEach(function(l){sub+=l.p.price*l.qty});
  var ship=sub===0?0:(sub>=Number(settings.freeFrom)?0:Number(settings.shippingCost));
  return {sub:sub,ship:ship,total:sub+ship};
}
function addToCart(id,n){
  var p=byId(id); if(!p||(p.stock||0)<=0) return;
  var c=cart.find(function(x){return x.id===id});
  var max=p.stock||99;
  if(c) c.qty=Math.min(max,c.qty+(n||1)); else cart.push({id:id,qty:Math.min(max,n||1)});
  saveCart(); updateChrome();
}

/* ---------- viste ---------- */
function card(p){
  var sold=(p.stock||0)<=0;
  return '<article class="card"><button class="pic" data-go="prodotto-'+esc(p.id)+'" aria-label="'+esc(p.name)+'">'+picOf(p)+
    (sold?'<span class="tag sold">Esaurito</span>':(p.demo?'<span class="tag">Esempio</span>':''))+'</button>'+
    '<h3>'+esc(p.name)+'</h3><div class="meta"><span>'+esc(p.category||"")+'</span><strong>'+eur(p.price)+'</strong></div></article>';
}
function demoBar(){
  if(!usingDemo()) return "";
  return '<div class="demo-bar">Stai vedendo prodotti di esempio. Il catalogo reale sostituirà questi esempi.</div>';
}
function vHome(){
  var l=shop().slice(0,4);
  return '<section class="hero"><div class="hero-copy"><p class="eyebrow">'+esc(settings.tagline)+'</p>'+
    '<h1>Ceramiche turche, scelte una per una.</h1>'+
    '<p class="lead">Ciotole, piatti, tazze e vasi dipinti a mano nei laboratori dell’Anatolia. Pezzi da usare ogni giorno, mai due identici.</p>'+
    '<div class="cta-row"><a class="btn" href="#negozio">Scopri la collezione</a><a class="btn ghost" href="#chi-siamo">La nostra selezione</a></div></div>'+
    '<div class="hero-art" aria-hidden="true">'+vessel("vaso","#e9a23b","#fff4d6",120)+vessel("ciotola","#f4f6f5","#1d3fae",190)+vessel("tazza","#17b3ad","#ffffff",110)+'</div></section>'+
    '<section class="sec"><div class="values"><div><h3>Selezionate in Turchia</h3><p>Lavoriamo con piccoli laboratori e scegliamo i pezzi di persona.</p></div>'+
    '<div><h3>Dipinte a mano</h3><p>Ogni ceramica ha il suo disegno: piccole differenze di smalto sono parte del pezzo.</p></div>'+
    '<div><h3>Imballate con cura</h3><p>Protezioni su misura per far arrivare tutto intero, anche i vasi più delicati.</p></div></div></section>'+
    '<section class="sec"><div class="sec-head"><div><p class="eyebrow">In vetrina</p><h2>Le ultime arrivate</h2></div><a class="btn ghost small" href="#negozio">Vedi tutto</a></div><div class="grid">'+l.map(card).join("")+'</div>'+demoBar()+'</section>'+
    '<section class="sec"><div class="story"><div><p class="eyebrow">La nostra storia</p><h2>Una selezione, non una fabbrica.</h2></div><p>'+esc(settings.story)+'</p></div></section>';
}
function vShop(){
  var all=shop(), cats=["Tutti"].concat(CATS.filter(function(c){return all.some(function(p){return p.category===c})}));
  var l=filterCat==="Tutti"?all:all.filter(function(p){return p.category===filterCat});
  return '<section class="sec"><div class="sec-head"><div><p class="eyebrow">Collezione</p><h2>Tutte le ceramiche</h2></div>'+
    '<div class="chips" role="group" aria-label="Categorie">'+cats.map(function(c){return '<button class="chip" data-act="cat" data-v="'+esc(c)+'" aria-pressed="'+(c===filterCat)+'">'+esc(c)+'</button>'}).join("")+'</div></div>'+
    (l.length?'<div class="grid">'+l.map(card).join("")+'</div>':'<div class="empty">Nessun prodotto in questa categoria.</div>')+demoBar()+'</section>';
}
function vProduct(id){
  var p=byId(id);
  if(!p) return '<section class="sec"><div class="empty">Prodotto non trovato. <a href="#negozio">Torna al negozio</a></div></section>';
  var imgs=p.images||[], g=Math.min(gallery,Math.max(imgs.length-1,0));
  var big=imgs.length?'<img src="'+esc(U(imgs[g]))+'" alt="'+esc(p.name)+'">':picOf(p);
  var th=imgs.length>1?'<div class="thumbs">'+imgs.map(function(x,i){return '<button data-act="thumb" data-v="'+i+'" aria-current="'+(i===g)+'" aria-label="Foto '+(i+1)+'"><img src="'+esc(U(x))+'" alt=""></button>'}).join("")+'</div>':'';
  var sold=(p.stock||0)<=0;
  return '<div class="pdp"><div><div class="big">'+big+'</div>'+th+'</div><div class="pdp-info">'+
    '<p class="crumb"><a href="#negozio">Negozio</a> / '+esc(p.category||"")+'</p><h1>'+esc(p.name)+'</h1><p class="price">'+eur(p.price)+'</p>'+
    '<p>'+esc(p.desc||"")+'</p>'+
    '<dl class="specs">'+(p.dims?'<dt>Misure</dt><dd>'+esc(p.dims)+'</dd>':'')+'<dt>Materiale</dt><dd>'+esc(p.material||"Ceramica smaltata, dipinta a mano")+'</dd><dt>Cura</dt><dd>'+esc(p.care||"Lavaggio a mano consigliato")+'</dd><dt>Disponibilità</dt><dd>'+(sold?"Esaurito":((p.stock||0)<=3?"Ultimi "+p.stock+" pezzi":"Disponibile"))+'</dd></dl>'+
    '<div class="note">Pezzo artigianale: piccole variazioni di colore e di smalto sono normali e lo rendono unico.</div>'+
    '<div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn" data-act="add" data-v="'+esc(p.id)+'"'+(sold?' disabled':'')+'>'+(sold?'Esaurito':'Aggiungi al carrello')+'</button><a class="btn ghost" href="#spedizioni">Spedizioni e resi</a></div>'+
    (p.demo?'<p class="note warn">Prodotto di esempio per la bozza del sito.</p>':'')+'</div></div>';
}
function vCart(){
  var L=cartLines(), t=totals();
  if(flash&&flash.type==="order") return '<section class="sec"><div class="msg ok"><strong>Richiesta ricevuta.</strong> '+esc(flash.text)+'</div><p style="margin-top:16px"><a class="btn" href="#negozio">Continua a guardare</a></p></section>';
  if(!L.length) return '<section class="sec"><h2>Il carrello è vuoto</h2><p style="margin:12px 0 20px;color:var(--muted)">Aggiungi una ceramica per iniziare.</p><a class="btn" href="#negozio">Vai al negozio</a></section>';
  var lines=L.map(function(l){return '<div class="line"><div class="pic">'+picOf(l.p)+'</div><div><h3>'+esc(l.p.name)+'</h3><small>'+eur(l.p.price)+' cad.</small><div style="margin-top:6px"><span class="qty"><button data-act="dec" data-v="'+esc(l.p.id)+'" aria-label="Meno">−</button><span>'+l.qty+'</span><button data-act="inc" data-v="'+esc(l.p.id)+'" aria-label="Più">+</button></span> <button class="btn ghost small" data-act="rm" data-v="'+esc(l.p.id)+'">Rimuovi</button></div></div><strong>'+eur(l.p.price*l.qty)+'</strong></div>'}).join("");
  var free=Number(settings.freeFrom), miss=free-t.sub;
  return '<div class="cart"><div><h1 style="font-size:2rem;margin-bottom:8px">Carrello</h1>'+lines+(miss>0&&t.sub>0?'<p class="note" style="margin-top:16px">Ti mancano '+eur(miss)+' per la spedizione gratuita.</p>':'')+'</div>'+
    '<aside class="sum"><h2 style="font-size:1.3rem">Riepilogo</h2><div class="row"><span>Prodotti</span><span>'+eur(t.sub)+'</span></div><div class="row"><span>Spedizione</span><span>'+(t.ship?eur(t.ship):"Gratis")+'</span></div><div class="row total"><span>Totale</span><span>'+eur(t.total)+'</span></div>'+(settings.regime==="forfettario"?'<p class="note">Operazione senza IVA (regime forfettario). Spediamo in Italia.</p>':'<p class="note">Spediamo in Italia.</p>')+
    '<form class="form" id="checkout" style="margin-top:8px"><p class="note warn">Checkout in bozza: nessun pagamento viene richiesto. L’ordine viene registrato come richiesta.</p>'+
    '<label class="f">Nome e cognome<input type="text" name="name" required autocomplete="name" id="c-name"></label>'+
    '<label class="f">Email<input type="email" name="email" required autocomplete="email" id="c-email"></label>'+
    '<label class="f">Indirizzo<input type="text" name="addr" required autocomplete="street-address" id="c-addr"></label>'+
    '<div class="two"><label class="f">CAP<input type="text" name="zip" required autocomplete="postal-code" id="c-zip"></label><label class="f">Città<input type="text" name="city" required autocomplete="address-level2" id="c-city"></label></div>'+
    '<fieldset class="bill"><legend>Fatturazione</legend>'+
    '<div class="seg" role="radiogroup" aria-label="Tipo di cliente"><label><input type="radio" name="btype" value="privato"'+(btype==="privato"?' checked':'')+'> Privato</label><label><input type="radio" name="btype" value="azienda"'+(btype==="azienda"?' checked':'')+'> Azienda o professionista</label></div>'+
    '<div data-bill="privato"'+(btype==="privato"?'':' hidden')+'><label class="f">Codice fiscale<input type="text" name="cf" id="c-cf" maxlength="16" autocapitalize="characters" autocomplete="off"></label></div>'+
    '<div data-bill="azienda" class="form"'+(btype==="azienda"?'':' hidden')+'><label class="f">Ragione sociale<input type="text" name="company" id="c-company" autocomplete="organization"></label><div class="two"><label class="f">Partita IVA<input type="text" name="vat" id="c-vat" maxlength="11" inputmode="numeric"></label><label class="f">Codice fiscale, se diverso<input type="text" name="cf2" id="c-cf2" maxlength="16" autocapitalize="characters"></label></div><div class="two"><label class="f">Codice SDI<input type="text" name="sdi" id="c-sdi" maxlength="7" autocapitalize="characters"></label><label class="f">oppure PEC<input type="email" name="pec" id="c-pec"></label></div></div>'+
    '<label class="check"><input type="checkbox" name="same" id="c-same" checked><span>Indirizzo di fatturazione uguale a quello di spedizione</span></label>'+
    '<div data-bill="addr" class="form" hidden><label class="f">Indirizzo di fatturazione<input type="text" name="baddr" id="c-baddr"></label><div class="two"><label class="f">CAP<input type="text" name="bzip" id="c-bzip"></label><label class="f">Città<input type="text" name="bcity" id="c-bcity"></label></div></div></fieldset>'+
    '<label class="f">Note<textarea name="note" id="c-note"></textarea></label>'+
    '<label class="check"><input type="checkbox" name="terms" required id="c-terms"><span>Ho letto le <a href="#condizioni">condizioni di vendita</a> e il <a href="#recesso">diritto di recesso</a>.</span></label>'+
    '<label class="check"><input type="checkbox" name="privacy" required id="c-priv"><span>Ho letto l’<a href="#privacy">informativa privacy</a>.</span></label>'+
    '<div data-err></div>'+
    '<button class="btn" type="submit"'+(busy?' disabled':'')+'>Invia richiesta d’ordine</button></form></aside></div>';
}

/* testi legali: partono dai dati inseriti in Gestione > Negozio */
function S(k,ph){ return settings[k]?esc(settings[k]):'<mark>['+ph+']</mark>'; }
function legalWrap(title,body){
  return '<article class="legal"><p class="eyebrow">Informazioni legali</p><h1>'+title+'</h1><div class="note warn">Testo di partenza, da far controllare al commercialista o a un legale prima della pubblicazione. I campi evidenziati vanno compilati in Gestione, sezione Negozio.</div>'+body+'</article>';
}
var LEGAL={
  privacy:function(){return legalWrap("Informativa privacy",
    '<h2>Titolare del trattamento</h2><p>'+S("company","ragione sociale")+', '+S("address","indirizzo")+'. Email: '+S("email","email")+'.</p>'+
    '<h2>Dati che raccogliamo</h2><p>Nome, indirizzo di spedizione e di fatturazione, email, codice fiscale o partita IVA (con codice SDI o PEC per le aziende) che inserisci nel modulo d’ordine, più i dati tecnici necessari al funzionamento del sito.</p>'+
    '<h2>Perché li usiamo</h2><ul><li>Gestire l’ordine, la spedizione e l’assistenza (esecuzione del contratto).</li><li>Adempiere a obblighi fiscali e contabili (obbligo di legge).</li><li>Inviare newsletter solo se hai dato un consenso specifico (consenso).</li></ul>'+
    '<h2>Per quanto tempo</h2><p>I dati d’ordine sono conservati per il tempo richiesto dagli obblighi fiscali (di norma 10 anni). I dati per la newsletter fino alla revoca del consenso.</p>'+
    '<h2>A chi li comunichiamo</h2><p>Corrieri, fornitori di pagamento, fornitori di hosting e consulenti fiscali, nel limite di quanto necessario ai loro servizi.</p>'+
    '<h2>I tuoi diritti</h2><p>Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento scrivendo a '+S("email","email")+'. Hai diritto di reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).</p>')},
  cookie:function(){return legalWrap("Cookie",'<p>Questo sito usa solo strumenti tecnici necessari al funzionamento, come la memoria del carrello sul tuo dispositivo. Non usiamo cookie di profilazione o di analisi che richiedano consenso.</p><p>Se in futuro aggiungeremo strumenti di statistica o pubblicità, ti chiederemo il consenso prima di attivarli.</p>')},
  condizioni:function(){return legalWrap("Condizioni di vendita",
    '<h2>Venditore</h2><p>'+S("company","ragione sociale")+', P. IVA '+S("vat","partita IVA")+', '+S("address","indirizzo")+'. Iscritto al Registro Imprese: '+S("rea","CCIAA e numero REA")+'. Contatti: '+S("email","email")+(settings.pec?', PEC '+esc(settings.pec):'')+(settings.phone?', '+esc(settings.phone):'')+'.</p>'+
    '<h2>Prodotti</h2><p>Vendiamo ceramiche artigianali. Trattandosi di pezzi dipinti a mano, colori, smalti e decori possono differire leggermente da quelli delle fotografie.</p>'+
    '<h2>Prezzi</h2><p>'+(settings.regime==="forfettario"?'I prezzi sono in euro. Operazione senza applicazione dell’IVA ai sensi dell’art. 1, commi 54-89, legge 190/2014 (regime forfettario).':'I prezzi sono in euro e comprendono l’IVA.')+' Le spese di spedizione sono indicate nel carrello prima dell’invio dell’ordine.</p>'+
    '<h2>Fattura</h2><p>Per ogni ordine emettiamo fattura con i dati di fatturazione indicati nel modulo. La ricevi all’indirizzo email indicato; le aziende anche tramite SDI.</p><h2>Ordine e pagamento</h2><p>Il contratto si conclude quando ricevi la nostra conferma d’ordine. I metodi di pagamento disponibili sono indicati in fase di acquisto.</p>'+
    '<h2>Consegna</h2><p>Spediamo in '+esc(settings.shippingDays)+' dalla conferma dell’ordine, salvo diversa indicazione. Controlla il pacco alla consegna e segnala subito eventuali danni al corriere.</p>'+
    '<h2>Garanzia legale</h2><p>Se sei consumatore hai la garanzia legale di conformità di 2 anni prevista dal Codice del Consumo. Per usarla scrivi a '+S("email","email")+'.</p>'+
    '<h2>Recesso</h2><p>Hai 14 giorni per recedere, come spiegato nella pagina <a href="#recesso">Diritto di recesso</a>.</p>'+
    '<h2>Controversie</h2><p>Si applica la legge italiana. Per i consumatori è competente il giudice del luogo di residenza. Puoi usare anche la piattaforma europea per la risoluzione online delle controversie: ec.europa.eu/consumers/odr.</p>')},
  recesso:function(){return legalWrap("Diritto di recesso",
    '<p>Se acquisti come consumatore puoi recedere senza spiegare il motivo entro 14 giorni da quando ricevi il prodotto.</p>'+
    '<h2>Come fare</h2><ul><li>Scrivi a '+S("email","email")+' indicando ordine e prodotti da restituire.</li><li>Restituisci il prodotto entro 14 giorni dalla comunicazione, ben imballato e integro.</li><li>Le spese di restituzione sono a tuo carico, salvo diversa indicazione.</li></ul>'+
    '<h2>Rimborso</h2><p>Rimborsiamo il prezzo dei prodotti, e la spedizione standard di andata, entro 14 giorni da quando riceviamo la comunicazione. Possiamo trattenere il rimborso fino al ritorno della merce.</p>'+
    '<h2>Prodotti danneggiati</h2><p>Se il prodotto torna danneggiato per un imballaggio non adeguato, il rimborso può essere ridotto del valore perso.</p>'+
    '<h2>Modulo tipo</h2><p>A: '+S("company","ragione sociale")+', '+S("email","email")+'. Con la presente comunico di recedere dal contratto di vendita del seguente bene: ______. Ordinato il ______, ricevuto il ______. Nome: ______. Indirizzo: ______. Data: ______.</p>')},
  spedizioni:function(){return legalWrap("Spedizioni e resi",
    '<p>Spedizione in Italia in '+esc(settings.shippingDays)+'. Costo '+eur(settings.shippingCost)+', gratuita da '+eur(settings.freeFrom)+' di acquisti.</p>'+
    '<p>Ogni ceramica è protetta con materiali da imballo resistenti. Se un pezzo arriva rotto, scrivi a '+S("email","email")+' entro 48 ore con qualche foto del pacco e del contenuto: troveremo una soluzione.</p>'+
    '<p>Per resi e rimborsi vedi <a href="#recesso">Diritto di recesso</a>.</p>')},
  "chi-siamo":function(){return '<article class="legal"><p class="eyebrow">Chi siamo</p><h1>'+esc(settings.brand)+'</h1><p>'+esc(settings.story)+'</p><p>Ci trovi su Etsy e qui, nel nostro negozio. Se cerchi un pezzo particolare o un regalo, scrivici'+(settings.email?': '+esc(settings.email):'')+'.</p><p><a class="btn" href="#negozio">Vai al negozio</a></p></article>'}
};

/* ---------- admin ---------- */
var loginMsg=null, pwMsg=null;
function vChangePw(){
  return '<section class="sec"><div style="max-width:420px"><p class="eyebrow">Primo accesso</p><h2 style="margin-bottom:12px">Scegli la tua password</h2><p class="note" style="margin-bottom:16px">Stai usando la password provvisoria. Scegline una tua: almeno 10 caratteri.</p><form class="form" id="chpw"><input type="text" name="u" value="'+ADMIN_EMAIL+'" autocomplete="username" hidden><label class="f">Nuova password<input type="password" name="np" id="n-pass" required minlength="10" autocomplete="new-password"></label><label class="f">Ripeti la nuova password<input type="password" name="np2" id="n-pass2" required minlength="10" autocomplete="new-password"></label>'+(pwMsg?'<div class="msg err">'+esc(pwMsg)+'</div>':'')+'<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit">Salva e continua</button><button class="btn ghost" type="button" data-act="logout">Esci</button></div></form></div></section>';
}
function vLogin(){
  return '<section class="sec"><div style="max-width:420px"><p class="eyebrow">Area riservata</p><h2 style="margin-bottom:16px">Accesso gestione</h2><form class="form" id="login"><input type="text" name="u" value="'+ADMIN_EMAIL+'" autocomplete="username" hidden><label class="f">Password<input type="password" name="password" id="l-pass" required autocomplete="current-password"></label>'+(loginMsg?'<div class="msg '+(loginMsg.ok?'ok':'err')+'">'+esc(loginMsg.text)+'</div>':'')+'<div><button class="btn" type="submit">Accedi</button></div></form></div></section>';
}
function vAdmin(){
  if(!session) return vLogin();
  if(session.user&&session.user.user_metadata&&session.user.user_metadata.must_change_password===true) return vChangePw();
  if(!isAdmin) return '<section class="sec"><div class="empty">Questo account non ha i permessi di gestione. <button class="btn ghost small" data-act="logout">Esci</button></div></section>';
  var tabs=[["prodotti","Prodotti"],["form",edit&&edit.id?"Modifica":"Nuovo prodotto"],["ordini","Ordini"+(orders.filter(function(o){return o.status!=="evaso"}).length?" ("+orders.filter(function(o){return o.status!=="evaso"}).length+")":"")],["negozio","Negozio"]];
  var h='<section class="sec"><div class="sec-head"><div><p class="eyebrow">Area riservata</p><h2>Gestione negozio</h2></div><button class="btn ghost small" data-act="logout">Esci</button></div>'+
    '<div class="adm-tabs" role="tablist">'+tabs.map(function(t){return '<button role="tab" data-act="tab" data-v="'+t[0]+'" aria-selected="'+(adminTab===t[0])+'">'+t[1]+'</button>'}).join("")+'</div>';
  if(!sb) h+='<div class="msg err">Collegamento al database non riuscito: ricarica la pagina.</div>';
  if(flash&&flash.type==="adm") h+='<div class="msg '+(flash.ok?'ok':'err')+'" style="margin-bottom:14px">'+esc(flash.text)+'</div>';
  if(adminTab==="prodotti") h+=aProducts(); else if(adminTab==="form") h+=aForm(); else if(adminTab==="ordini") h+=aOrders(); else h+=aSettings();
  return h+'</section>';
}
function aProducts(){
  var real=products.slice().sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0)});
  var h='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px"><button class="btn" data-act="new">Aggiungi prodotto</button>'+(real.length===0?'<button class="btn ghost" data-act="seed"'+(busy?' disabled':'')+'>Importa i prodotti di esempio</button>':'')+'</div>';
  if(!real.length) return h+'<div class="empty">Il catalogo è vuoto. Nel sito pubblico si vedono i prodotti di esempio finché non aggiungi il primo.</div>';
  return h+'<div class="table">'+real.map(function(p){
    var del=confirmDel===p.id;
    return '<div class="trow"><div class="pic">'+picOf(p)+'</div><div style="min-width:0"><strong>'+esc(p.name)+'</strong><br><small>'+esc(p.category||"")+' · '+eur(p.price)+' · '+(p.stock||0)+' pz'+(p.visible===false?' · <em>nascosto</em>':'')+'</small></div>'+
      '<div class="acts"><button class="btn ghost small" data-act="vis" data-v="'+esc(p.id)+'">'+(p.visible===false?'Mostra':'Nascondi')+'</button><button class="btn ghost small" data-act="edit" data-v="'+esc(p.id)+'">Modifica</button>'+
      (del?'<button class="btn danger small" data-act="del2" data-v="'+esc(p.id)+'">Conferma eliminazione</button><button class="btn ghost small" data-act="delx">Annulla</button>':'<button class="btn danger small" data-act="del" data-v="'+esc(p.id)+'">Elimina</button>')+'</div></div>';
  }).join("")+'</div>';
}
function aForm(){
  var p=edit||{images:[]}; var im=p.images||[];
  function v(k,d){return esc(p[k]!=null?p[k]:(d||""))}
  return '<form class="form" id="pform" style="max-width:720px">'+
    '<label class="f">Nome<input type="text" name="name" id="p-name" required value="'+v("name")+'"></label>'+
    '<div class="two"><label class="f">Categoria<select name="category" id="p-cat">'+CATS.map(function(c){return '<option'+((p.category||"Ciotole")===c?' selected':'')+'>'+c+'</option>'}).join("")+'</select></label>'+
    '<label class="f">Forma (per l’illustrazione senza foto)<select name="type" id="p-type">'+TYPES.map(function(t){return '<option value="'+t[0]+'"'+((p.type||"ciotola")===t[0]?' selected':'')+'>'+t[1]+'</option>'}).join("")+'</select></label></div>'+
    '<div class="two"><label class="f">Prezzo (€)<input type="number" name="price" id="p-price" min="0" step="0.01" required value="'+v("price")+'"></label>'+
    '<label class="f">Pezzi disponibili<input type="number" name="stock" id="p-stock" min="0" step="1" required value="'+v("stock","1")+'"></label></div>'+
    '<label class="f">Descrizione<textarea name="desc" id="p-desc">'+v("desc")+'</textarea></label>'+
    '<div class="two"><label class="f">Misure<input type="text" name="dims" id="p-dims" placeholder="Ø 18 cm · h 8 cm" value="'+v("dims")+'"></label>'+
    '<label class="f">Materiale<input type="text" name="material" id="p-mat" value="'+v("material","Ceramica smaltata, dipinta a mano")+'"></label></div>'+
    '<label class="f">Cura<input type="text" name="care" id="p-care" value="'+v("care","Lavaggio a mano consigliato")+'"></label>'+
    '<div class="two"><label class="f">Colore principale<input type="color" name="c1" id="p-c1" value="'+v("c1","#1d3fae")+'"></label><label class="f">Colore secondario<input type="color" name="c2" id="p-c2" value="'+v("c2","#ffffff")+'"></label></div>'+
    '<div class="f"><span style="font-size:.88rem;font-weight:500">Foto</span><div class="photos" id="photos">'+photosHtml()+'</div>'+
    (sb?'<input type="file" id="p-files" accept="image/png,image/jpeg,image/webp" multiple><span id="upmsg" style="font-size:.85rem;color:var(--muted)">La prima foto è quella di copertina. Il caricamento parte appena scegli i file.</span>':'<span class="note">Il caricamento foto non è disponibile.</span>')+'</div>'+
    '<label class="check"><input type="checkbox" name="visible" id="p-vis"'+(p.visible===false?'':' checked')+'><span>Visibile nel negozio</span></label>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit"'+(busy?' disabled':'')+'>Salva prodotto</button><button class="btn ghost" type="button" data-act="cancel">Annulla</button></div></form>';
}
function photosHtml(){
  var im=(edit&&edit.images)||[];
  return im.map(function(id,i){return '<div class="ph"><img src="'+esc(U(id))+'" alt=""><button type="button" data-act="rmphoto" data-v="'+i+'" aria-label="Rimuovi foto">×</button></div>'}).join("");
}
function billText(b){
  b=b||{}; if(!b.type) return "non indicata";
  var a=esc(b.addr||"")+", "+esc(b.zip||"")+" "+esc(b.city||"");
  if(b.type==="azienda") return esc(b.company)+" · P.IVA "+esc(b.vat)+(b.cf?" · CF "+esc(b.cf):"")+" · "+(b.sdi?"SDI "+esc(b.sdi):"PEC "+esc(b.pec))+"<br>"+a;
  return "Privato · CF "+esc(b.cf)+"<br>"+a;
}
function downloadCsv(){
  var H=["Numero","Data","Stato","Cliente","Email","Indirizzo spedizione","CAP","Città","Tipo cliente","Ragione sociale","Codice fiscale","Partita IVA","SDI","PEC","Indirizzo fatturazione","Articoli","Prodotti (€)","Spedizione (€)","Totale (€)","N. fattura"];
  function q(x){ x=String(x==null?"":x).replace(/"/g,'""'); return '"'+x+'"'; }
  function n(x){ return String(Number(x||0).toFixed(2)).replace(".",","); }
  var rows=orders.map(function(o){ var c=o.customer||{}, b=o.billing||{};
    return [o.number,new Date(o.createdAt).toLocaleString("it-IT"),o.status,c.name,c.email,c.addr,c.zip,c.city,b.type||"",b.company||"",b.cf||"",b.vat||"",b.sdi||"",b.pec||"",[b.addr,b.zip,b.city].filter(Boolean).join(" "),(o.items||[]).map(function(i){return i.qty+" x "+i.name}).join(" | "),n(o.subtotal),n(o.shipping),n(o.total),o.invoiceNumber||""].map(q).join(";"); });
  var blob=new Blob(["﻿"+[H.map(q).join(";")].concat(rows).join("\r\n")],{type:"text/csv;charset=utf-8"});
  var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="ordini-"+new Date().toISOString().slice(0,10)+".csv";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
}
function aOrders(){
  if(!orders.length) return '<div class="empty">Nessun ordine ricevuto per ora.</div>';
  return '<div style="margin-bottom:14px"><button class="btn ghost small" data-act="csv">Scarica ordini (CSV)</button></div>'+orders.map(function(o){
    var d=new Date(o.createdAt||0).toLocaleString("it-IT",{dateStyle:"medium",timeStyle:"short"}), c=o.customer||{};
    return '<div class="order"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>'+(o.number?'#'+esc(o.number)+' · ':'')+esc(c.name)+'</strong><span class="pill '+(o.status==="evaso"?"":"new")+'">'+esc(o.status||"nuovo")+'</span></div>'+
      '<small style="color:var(--muted)">'+d+' · '+esc(c.email)+'</small><div>'+(o.items||[]).map(function(i){return esc(i.qty)+' × '+esc(i.name)}).join("<br>")+'</div>'+
      '<div><strong>'+eur(o.total)+'</strong> <small style="color:var(--muted)">(spedizione '+eur(o.shipping)+')</small></div>'+
      '<div style="color:var(--muted);font-size:.9rem">'+esc(c.addr)+', '+esc(c.zip)+' '+esc(c.city)+(c.note?'<br>Note: '+esc(c.note):'')+'</div>'+
      '<div style="font-size:.9rem"><strong>Fatturazione:</strong> '+billText(o.billing)+'</div>'+
      '<div class="invrow"><label class="f" style="flex-direction:row;align-items:center;gap:8px">N. fattura <input type="text" id="inv-'+esc(o.id)+'" value="'+esc(o.invoiceNumber||"")+'" placeholder="es. 1/2026"></label><button class="btn ghost small" data-act="inv" data-v="'+esc(o.id)+'">Salva</button>'+(o.invoiceNumber?'<span class="pill">fatturato</span>':'<span class="pill new">da fatturare</span>')+'</div>'+
      '<div><button class="btn ghost small" data-act="evaso" data-v="'+esc(o.id)+'">'+(o.status==="evaso"?"Riapri":"Segna come evaso")+'</button></div></div>';
  }).join("");
}
function aSettings(){
  function f(k,l,t,extra){return '<label class="f">'+l+'<input type="'+(t||"text")+'" name="'+k+'" id="s-'+k+'" value="'+esc(settings[k])+'"'+(extra||"")+'></label>'}
  return '<form class="form" id="sform" style="max-width:720px"><p class="note">Questi dati compaiono nell’intestazione, nel piè di pagina e nei testi legali.</p>'+
    f("brand","Nome del brand")+f("tagline","Frase sotto il logo")+
    '<label class="f">Storia del brand<textarea name="story" id="s-story">'+esc(settings.story)+'</textarea></label>'+
    '<div class="two">'+f("shippingCost","Costo spedizione (€)","number",' min="0" step="0.1"')+f("freeFrom","Spedizione gratis da (€)","number",' min="0" step="1"')+'</div>'+f("shippingDays","Tempi di consegna")+
    '<h3 style="margin-top:8px">Dati del venditore</h3>'+f("company","Ragione sociale")+'<div class="two">'+f("vat","Partita IVA")+f("phone","Telefono","tel")+'</div>'+f("address","Indirizzo")+f("rea","Registro Imprese (CCIAA e numero REA)")+'<label class="f">Regime fiscale<select name="regime" id="s-regime"><option value="forfettario"'+(settings.regime==="forfettario"?' selected':'')+'>Forfettario (senza IVA)</option><option value="ordinario"'+(settings.regime==="ordinario"?' selected':'')+'>Ordinario (prezzi con IVA)</option></select></label>'+f("email","Email di contatto","email")+f("pec","PEC","email")+f("instagram","Instagram (solo nome utente)")+
    '<div><button class="btn" type="submit"'+(busy?' disabled':'')+'>Salva impostazioni</button></div></form>';
}

/* ---------- render ---------- */
function route(){ var h=location.hash.slice(1)||"home"; return h; }
function render(){
  if(ADMIN){ $("#app").innerHTML=vAdmin(); updateChrome(); return; }
  var r=route(), html;
  if(r==="home") html=vHome();
  else if(r==="negozio") html=vShop();
  else if(r.indexOf("prodotto-")===0) html=vProduct(r.slice(9));
  else if(r==="carrello") html=vCart();
  else if(LEGAL[r]) html=LEGAL[r]();
  else html=vHome();
  $("#app").innerHTML=html;
  updateChrome(r);
}
function updateChrome(r){
  r=r||route();
  if(ADMIN){ document.title="Gestione \u00b7 "+settings.brand; var bn=$("#brandname"); if(bn) bn.textContent=settings.brand; return; }
  var n=cart.reduce(function(a,c){return a+c.qty},0);
  $("#cartcount").textContent=n;
  $("#brandname").textContent=settings.brand;
  document.querySelectorAll("[data-nav]").forEach(function(a){ if(a.getAttribute("data-nav")===r) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  document.title=settings.brand;
  var f='<div><h3>'+esc(settings.brand)+'</h3><p>'+esc(settings.tagline)+'.</p>'+(settings.company?'<p style="margin-top:8px">'+esc(settings.company)+(settings.vat?' · P.IVA '+esc(settings.vat):'')+(settings.rea?' · '+esc(settings.rea):'')+'</p>':'')+(settings.email?'<p>'+esc(settings.email)+'</p>':'')+(settings.instagram?'<p>Instagram: @'+esc(settings.instagram)+'</p>':'')+'</div>'+
    '<div><h3>Negozio</h3><ul><li><a href="#negozio">Tutte le ceramiche</a></li><li><a href="#spedizioni">Spedizioni e resi</a></li><li><a href="#chi-siamo">Chi siamo</a></li></ul></div>'+
    '<div><h3>Informazioni legali</h3><ul><li><a href="#condizioni">Condizioni di vendita</a></li><li><a href="#recesso">Diritto di recesso</a></li><li><a href="#privacy">Privacy</a></li><li><a href="#cookie">Cookie</a></li></ul></div>';
  $("#foot").innerHTML=f;
}

/* ---------- azioni ---------- */
function say(type,text,ok){ flash={type:type,text:text,ok:ok}; }
async function guard(fn){ if(busy) return; busy=true; render(); try{ await fn(); }catch(e){ say("adm","Operazione non riuscita ("+(e&&e.code?e.code:"errore")+"). Riprova tra poco.",false); } busy=false; render(); }

document.addEventListener("click",function(ev){
  var t=ev.target.closest("[data-go],[data-act]"); if(!t) return;
  var go=t.getAttribute("data-go"); if(go){ location.hash=go; return; }
  var act=t.getAttribute("data-act"), v=t.getAttribute("data-v");
  if(act==="cat"){ filterCat=v; render(); }
  else if(act==="thumb"){ gallery=Number(v); render(); }
  else if(act==="add"){ addToCart(v,1); location.hash="carrello"; }
  else if(act==="inc"){ addToCart(v,1); render(); }
  else if(act==="dec"){ var c=cart.find(function(x){return x.id===v}); if(c){ c.qty--; if(c.qty<=0) cart=cart.filter(function(x){return x.id!==v}); saveCart(); } render(); }
  else if(act==="rm"){ cart=cart.filter(function(x){return x.id!==v}); saveCart(); render(); }
  else if(act==="tab"){ adminTab=v; flash=null; if(v!=="form") edit=null; render(); }
  else if(act==="new"){ edit={id:null,images:[]}; adminTab="form"; flash=null; render(); }
  else if(act==="edit"){ var p=products.find(function(x){return x.id===v}); if(p){ edit=Object.assign({},p,{images:(p.images||[]).slice()}); adminTab="form"; flash=null; render(); } }
  else if(act==="csv"){ downloadCsv(); }
  else if(act==="inv"){ var inp=$("#inv-"+v); if(inp) guard(async function(){ await chk(sb.from("shop_orders").update({invoice_number:inp.value.trim()}).eq("id",v)); await loadAll(); say("adm","Numero fattura salvato.",true); }); }
  else if(act==="logout"){ sb.auth.signOut(); }
  else if(act==="cancel"){ edit=null; adminTab="prodotti"; render(); }
  else if(act==="del"){ confirmDel=v; render(); }
  else if(act==="delx"){ confirmDel=null; render(); }
  else if(act==="del2"){ confirmDel=null; guard(async function(){ await chk(sb.from("shop_products").delete().eq("id",v)); await loadAll(); say("adm","Prodotto eliminato.",true); }); }
  else if(act==="vis"){ var q=products.find(function(x){return x.id===v}); if(q) guard(async function(){ await chk(sb.from("shop_products").update({visible:q.visible===false}).eq("id",v)); await loadAll(); say("adm",q.visible===false?"Prodotto visibile nel negozio.":"Prodotto nascosto.",true); }); }
  else if(act==="seed"){ guard(async function(){ var now=Date.now(); var rows=DEMO.map(function(d,i){ return {name:d.name,category:d.category,type:d.type,price:d.price,stock:d.stock,descr:d.desc,dims:d.dims,c1:d.c1,c2:d.c2,visible:true,created_at:new Date(now-i*1000).toISOString()}; }); await chk(sb.from("shop_products").insert(rows)); await loadAll(); say("adm","Prodotti di esempio importati. Puoi modificarli o eliminarli.",true); }); }
  else if(act==="rmphoto"){ if(edit){ edit.images.splice(Number(v),1); $("#photos").innerHTML=photosHtml(); } }
  else if(act==="evaso"){ var o=orders.find(function(x){return x.id===v}); if(o) guard(async function(){
    await chk(sb.from("shop_orders").update({status:o.status==="evaso"?"nuovo":"evaso"}).eq("id",v)); await loadAll(); }); }
});
document.addEventListener("change",function(ev){
  if(ev.target.id!=="p-files"||!sb||!edit) return;
  var files=Array.prototype.slice.call(ev.target.files||[]), msg=$("#upmsg"); if(!files.length) return;
  (async function(){
    for(var i=0;i<files.length;i++){
      msg.textContent="Carico foto "+(i+1)+" di "+files.length+"…";
      try{ var ext=(files[i].name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,""); var path="p/"+Date.now()+"-"+i+"."+ext; var up=await sb.storage.from("shop-images").upload(path,files[i],{contentType:files[i].type}); if(up.error) throw {code:up.error.message}; edit.images.push(path); $("#photos").innerHTML=photosHtml(); }
      catch(e){ msg.textContent="Foto non caricata ("+(e&&e.code||"errore")+"). Usa JPG, PNG o WebP sotto i 5 MB."; return; }
    }
    msg.textContent="Foto caricate. Ricordati di salvare il prodotto.";
    ev.target.value="";
  })();
});
document.addEventListener("submit",function(ev){
  var f=ev.target; ev.preventDefault();
  if(f.id==="checkout"){
    var L=cartLines(), t=totals(), fd=new FormData(f);
    var order={items:L.map(function(l){return {id:l.p.id,name:l.p.name,price:l.p.price,qty:l.qty}}),subtotal:t.sub,shipping:t.ship,total:t.total,
      customer:{name:fd.get("name"),email:fd.get("email"),addr:fd.get("addr"),zip:fd.get("zip"),city:fd.get("city"),note:fd.get("note")||""},status:"nuovo",createdAt:Date.now()};
    var bt=fd.get("btype")==="azienda"?"azienda":"privato", same=!!fd.get("same"), box=f.querySelector("[data-err]"), btn=f.querySelector("button[type=submit]");
    function fail(m){ box.innerHTML='<div class="msg err">'+esc(m)+'</div>'; btn.disabled=false; box.scrollIntoView({block:"center"}); }
    var cf=String(bt==="azienda"?(fd.get("cf2")||""):(fd.get("cf")||"")).trim().toUpperCase(), vat=String(fd.get("vat")||"").replace(/\s/g,""), sdi=String(fd.get("sdi")||"").trim().toUpperCase(), pec=String(fd.get("pec")||"").trim(), company=String(fd.get("company")||"").trim();
    if(bt==="privato"&&!/^[A-Z0-9]{16}$/.test(cf)) return fail("Inserisci un codice fiscale di 16 caratteri.");
    if(bt==="azienda"){
      if(!company) return fail("Inserisci la ragione sociale.");
      if(!/^\d{11}$/.test(vat)) return fail("La partita IVA ha 11 cifre.");
      if(!/^[A-Z0-9]{7}$/.test(sdi)&&!pec) return fail("Indica il codice SDI di 7 caratteri oppure la PEC.");
      if(cf&&!/^([A-Z0-9]{16}|\d{11})$/.test(cf)) return fail("Il codice fiscale non è valido.");
    }
    var billing={type:bt,company:bt==="azienda"?company:"",cf:cf,vat:bt==="azienda"?vat:"",sdi:bt==="azienda"?sdi:"",pec:bt==="azienda"?pec:"",sameAddress:same,
      addr:same?fd.get("addr"):fd.get("baddr"),zip:same?fd.get("zip"):fd.get("bzip"),city:same?fd.get("city"):fd.get("bcity")};
    if(!same&&(!billing.addr||!billing.zip||!billing.city)) return fail("Completa l’indirizzo di fatturazione.");
    btn.disabled=true; box.innerHTML="";
    (async function(){
      try{
        if(!sb) throw {code:"no_db"};
        await chk(sb.from("shop_orders").insert({items:order.items,subtotal:order.subtotal,shipping:order.shipping,total:order.total,customer:order.customer,billing:billing}));
        cart=[]; saveCart(); say("order","Abbiamo registrato la tua richiesta. In questa bozza non è stato addebitato nulla.");
        render();
      }catch(e){ fail("Non siamo riusciti a registrare la richiesta. Riprova tra poco."); }
    })();
  }
  else if(f.id==="login"){
    var lf=new FormData(f), em=ADMIN_EMAIL, pw=String(lf.get("password"));
    (async function(){
      try{
        if(!sb) throw {message:"no_db"};
        { var r2=await sb.auth.signInWithPassword({email:em,password:pw}); if(r2.error) throw r2.error; loginMsg=null; }
      }catch(e){ loginMsg={ok:false,text:(e&&e.message==="Invalid login credentials")?"Password non corretta.":"Operazione non riuscita: "+((e&&e.message)||"errore")}; }
      render();
    })();
  }
  else if(f.id==="chpw"){
    var pf=new FormData(f), np=String(pf.get("np")), np2=String(pf.get("np2"));
    if(np.length<10){ pwMsg="La password deve avere almeno 10 caratteri."; render(); return; }
    if(np!==np2){ pwMsg="Le due password non coincidono."; render(); return; }
    (async function(){
      try{
        var r=await sb.auth.updateUser({password:np,data:{must_change_password:false}});
        if(r.error) throw r.error;
        pwMsg=null; var g=await sb.auth.getSession(); session=g.data.session; await checkAdmin(); await loadAll();
      }catch(e){ var m=(e&&e.message)||""; pwMsg=/different from the old password/i.test(m)?"Scegli una password diversa da quella provvisoria.":"Non è stato possibile salvare la password. Riprova."; }
      render();
    })();
  }
  else if(f.id==="pform"){
    var d=new FormData(f), p=edit||{};
    var data={name:String(d.get("name")).trim(),category:d.get("category"),type:d.get("type"),price:Number(d.get("price")),stock:Math.max(0,parseInt(d.get("stock"),10)||0),
      descr:d.get("desc"),dims:d.get("dims"),material:d.get("material"),care:d.get("care"),c1:d.get("c1"),c2:d.get("c2"),visible:!!d.get("visible"),images:(p.images||[]).slice()};
    guard(async function(){
      if(p.id) await chk(sb.from("shop_products").update(data).eq("id",p.id)); else await chk(sb.from("shop_products").insert(data)); await loadAll();
      edit=null; adminTab="prodotti"; say("adm","Prodotto salvato.",true);
    });
  }
  else if(f.id==="sform"){
    var s=new FormData(f), n=Object.assign({},DEFAULTS);
    Object.keys(DEFAULTS).forEach(function(k){ var x=s.get(k); if(x!=null) n[k]=(typeof DEFAULTS[k]==="number")?Number(x):String(x).trim(); });
    guard(async function(){ await chk(sb.from("shop_settings").upsert({id:1,data:n,updated_at:new Date().toISOString()})); settings=n; say("adm","Impostazioni salvate.",true); });
  }
});
document.addEventListener("change",function(ev){
  var t=ev.target;
  if(t.name==="btype"){ btype=t.value; document.querySelectorAll("[data-bill=privato]").forEach(function(e){e.hidden=btype!=="privato"}); document.querySelectorAll("[data-bill=azienda]").forEach(function(e){e.hidden=btype!=="azienda"}); }
  else if(t.id==="c-same"){ document.querySelectorAll("[data-bill=addr]").forEach(function(e){e.hidden=t.checked}); }
});
window.addEventListener("hashchange",function(){ flash=null; gallery=0; render(); window.scrollTo(0,0); });

/* ---------- dati: Supabase ---------- */
async function chk(q){ var r=await q; if(r.error) throw {code:r.error.code||r.error.message}; return r.data; }
function mapProduct(r){ return {id:r.id,name:r.name,category:r.category,type:r.type,price:Number(r.price),stock:r.stock,desc:r.descr,dims:r.dims,material:r.material,care:r.care,c1:r.c1,c2:r.c2,visible:r.visible,images:r.images||[],createdAt:Date.parse(r.created_at)||0}; }
async function checkAdmin(){ isAdmin=false; if(sb&&session){ var r=await sb.rpc("is_shop_admin"); isAdmin=!r.error&&r.data===true; } }
async function loadAll(){
  if(!sb) return;
  var pr=await sb.from("shop_products").select("*").order("created_at",{ascending:false});
  if(!pr.error){ products=pr.data.map(mapProduct); loaded=true; }
  var st=await sb.from("shop_settings").select("data").eq("id",1).maybeSingle();
  if(!st.error&&st.data&&st.data.data) settings=Object.assign({},DEFAULTS,st.data.data);
  if(isAdmin&&ADMIN){
    var od=await sb.from("shop_orders").select("*").order("created_at",{ascending:false}).limit(200);
    if(!od.error) orders=od.data.map(function(o){return {id:o.id,items:o.items,subtotal:Number(o.subtotal),shipping:Number(o.shipping),total:Number(o.total),customer:o.customer,billing:o.billing||{},number:o.order_number,invoiceNumber:o.invoice_number||"",status:o.status,createdAt:Date.parse(o.created_at)||0}});
  }
}

/* ---------- avvio: la pagina si vede subito, i dati arrivano dopo ---------- */
render();
if(window.supabase&&window.supabase.createClient){
  sb=window.supabase.createClient(SUPA_URL,SUPA_KEY);
  sb.auth.onAuthStateChange(function(_ev,s){
    session=s;
    setTimeout(async function(){ await checkAdmin(); await loadAll(); render(); },0);
  });
}
})();
