// Bedankpagina na het betalen van een feest: toont alleen de stand, nooit een feestlink.
(function(){
  var doos=document.getElementById('bedankt');
  if(!doos)return;
  var engels=document.documentElement.lang==='en';
  var ref=new URLSearchParams(location.search).get('ref')||'';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref))ref='';
  // De taalknop houdt de bestelling vast; kiest iemand Nederlands, dan niet meer doorsturen.
  var taalknop=document.querySelector('[data-taal]');
  if(taalknop&&ref){
    taalknop.href=taalknop.getAttribute('href')+'?ref='+ref;
    taalknop.addEventListener('click',function(){try{localStorage.removeItem('mm-feest-en');}catch(e){}});
  }
  // Wie op de Engelse pagina kocht, komt van Mollie op de Nederlandse pagina aan.
  if(!engels&&ref){
    var taalRef='';
    try{taalRef=localStorage.getItem('mm-feest-en')||'';}catch(e){}
    if(taalRef===ref){location.replace('en/feesten-bedankt.html?ref='+ref);return;}
  }
  // Op de eigen computer (localhost) gaat het naar de testdatabase.
  var lokaal=location.hostname==='localhost';
  var adres='https://'+(lokaal?'whebrmytlidfzvcickdh':'hktczewqpevvgxqcswov')+'.supabase.co/functions/v1/feest-koop';
  var sleutel=lokaal?'sb_publishable_LPdEmMiecZRwwuV8b0Ai5A_cKDsCzK-':'sb_publishable_YmfLKfk25pED0oqoTbSYPA_LWhZIuZC';
  var PAUZES=[0,2000,3000,5000,8000,12000];
  var opnieuw=document.getElementById('opnieuw');

  // Welk blok bij welke stand hoort.
  function toon(stand){
    Array.prototype.forEach.call(doos.querySelectorAll('[data-stand]'),function(b){
      b.hidden=b.getAttribute('data-stand').split(' ').indexOf(stand)<0;
    });
  }
  function vraag(){
    return fetch(adres+'?ref='+ref,{headers:{'apikey':sleutel},cache:'no-store'})
      .then(function(r){return r.ok?r.json():{};})
      .then(function(d){return d.status||'';})
      .catch(function(){return '';});
  }
  function volg(){
    opnieuw.hidden=true;
    toon('laden');
    var keer=0, laatst='';
    (function stap(){
      setTimeout(function(){
        vraag().then(function(s){
          if(s)laatst=s;
          if(s==='betaald'||s==='mislukt'||s==='te_laat'||s==='nakijken'){toon(s);return;}
          if(s)toon(s==='bezig'?'bezig':'onbekend');
          keer++;
          if(keer<PAUZES.length){stap();return;}
          if(!laatst)toon('geenverbinding');
          opnieuw.hidden=false;
        });
      },PAUZES[keer]);
    })();
  }
  if(!ref){toon('onbekend');return;}
  opnieuw.addEventListener('click',volg);
  volg();
})();
