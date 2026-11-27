// Feestaanvraag op feesten.html en en/feesten.html.
// Gebruikt dezelfde functie als het reisformulier op index.html (uitnodiging-aanvraag);
// de feestvelden gaan als regels in 'bericht', 'soort' blijft leeg.
(function(){
  var form=document.getElementById('feestForm');
  if(!form)return;
  // Op de eigen computer (localhost) gaat het naar de testdatabase.
  var lokaal=location.hostname==='localhost';
  var adres='https://'+(lokaal?'whebrmytlidfzvcickdh':'hktczewqpevvgxqcswov')+'.supabase.co/functions/v1/uitnodiging-aanvraag';
  // Openbare sleutel (dezelfde als in de app), geen geheim.
  var sleutel=lokaal?'sb_publishable_LPdEmMiecZRwwuV8b0Ai5A_cKDsCzK-':'sb_publishable_YmfLKfk25pED0oqoTbSYPA_LWhZIuZC';
  var engels=document.documentElement.lang==='en';
  var t=engels?{
    naam:'Please enter your name.',
    email:'This email address doesn’t look right.',
    datumGratis:'Choose a date from today up to and including 30 December 2026, or leave it empty.',
    datum:'Choose a date from today, or leave it empty.',
    gasten:'Enter a number of guests from 1 to {max}, or leave it empty.',
    hoogstens:'(at most {max})',
    wachten:'One moment…',
    gelukt:'Thank you! Your request has arrived. You’ll hear from us soon.',
    mislukt:'Sending failed. Feel free to email us at info@makingmemories.be.',
    verbinding:'Sending failed. Please check your connection, or email us at info@makingmemories.be.'
  }:{
    naam:'Vul je naam in.',
    email:'Dit e-mailadres lijkt niet te kloppen.',
    datumGratis:'Kies een datum vanaf vandaag tot en met 30 december 2026, of laat het veld leeg.',
    datum:'Kies een datum vanaf vandaag, of laat het veld leeg.',
    gasten:'Vul een aantal gasten van 1 tot {max} in, of laat het veld leeg.',
    hoogstens:'(hoogstens {max})',
    wachten:'Even geduld…',
    gelukt:'Bedankt! Je aanvraag is goed aangekomen. Je hoort snel van ons.',
    mislukt:'Versturen lukte niet. Mail ons gerust op info@makingmemories.be.',
    verbinding:'Versturen lukte niet. Controleer je verbinding, of mail ons op info@makingmemories.be.'
  };
  // De aanvraag wordt in het Nederlands gelezen, ook als de Engelse pagina is gebruikt.
  var BEN={particulier:'iemand die zelf feest',vereniging:'een vereniging, school of club',zaal:'een feestzaal',fotograaf:'fotograaf of DJ'};
  var GRATIS_TOT='2026-12-30';
  var geladen=Date.now();
  var status=form.querySelector('.form-status');
  var knop=form.querySelector('button');
  var grens=form.querySelector('[data-grens]');
  function meld(tekst,soort){status.textContent=tekst;status.className='form-status '+(soort||'');}
  function twee(n){return (n<10?'0':'')+n;}
  // Wie zelf feest (of een vereniging) vraagt een gratis feest: tot en met 30-12, hoogstens 30 gasten.
  // Voor een feestzaal, fotograaf of DJ geldt dat niet; een gastlink laat hoogstens 100 gasten toe.
  function gratis(){return form.ben.value==='particulier'||form.ben.value==='vereniging';}
  function grenzen(){
    var nu=new Date(), vandaag=nu.getFullYear()+'-'+twee(nu.getMonth()+1)+'-'+twee(nu.getDate());
    var max=gratis()?30:100;
    form.datum.min=gratis()&&vandaag>GRATIS_TOT?GRATIS_TOT:vandaag;
    if(gratis())form.datum.max=GRATIS_TOT;else form.datum.removeAttribute('max');
    form.gasten.max=max;
    grens.textContent=t.hoogstens.replace('{max}',max);
  }
  form.ben.addEventListener('change',grenzen);
  grenzen();
  // Knoppen die naar het formulier leiden, zetten meteen de juiste keuze bij 'Ik ben'.
  Array.prototype.forEach.call(document.querySelectorAll('[data-ben]'),function(a){
    a.addEventListener('click',function(){form.ben.value=a.getAttribute('data-ben');grenzen();});
  });
  function fout(veld,tekst){meld(tekst,'err');veld.focus();}
  form.addEventListener('submit',function(e){
    e.preventDefault();
    grenzen();
    var naam=form.naam.value.trim(), email=form.email.value.trim();
    if(!naam)return fout(form.naam,t.naam);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fout(form.email,t.email);
    if(!form.datum.validity.valid)return fout(form.datum,gratis()?t.datumGratis:t.datum);
    if(!form.gasten.validity.valid)return fout(form.gasten,t.gasten.replace('{max}',form.gasten.max));
    var regels=['FEESTAANVRAAG'];
    function regel(label,waarde){waarde=waarde.trim();if(waarde)regels.push(label+': '+waarde);}
    regel('Ik ben',BEN[form.ben.value]||'');
    regel('Zaak',form.zaak.value);
    regel('Soort feest',form.feestsoort.value);
    regel('Wanneer',form.datum.value.split('-').reverse().join('-'));
    regel('Gasten',form.gasten.value);
    regel('Via',form.via.value);
    if(engels)regel('Taal','Engels');
    var extra=form.bericht.value.trim();
    var bericht=(regels.join('\n')+(extra?'\n\n'+extra:'')).slice(0,1000);
    knop.disabled=true;meld(t.wachten);
    fetch(adres,{method:'POST',headers:{'Content-Type':'application/json','apikey':sleutel},body:JSON.stringify({
      naam:naam,email:email,soort:'',bericht:bericht,
      website:form.website.value,ingevuld_ms:Date.now()-geladen
    })}).then(function(r){return r.json().catch(function(){return {};}).then(function(d){return {ok:r.ok&&d.ok,fout:d.fout};});})
    .then(function(r){
      if(r.ok){form.reset();grenzen();meld(t.gelukt,'ok');}
      else{meld(r.fout||t.mislukt,'err');}
    })
    .catch(function(){meld(t.verbinding,'err');})
    .then(function(){knop.disabled=false;});
  });
})();
