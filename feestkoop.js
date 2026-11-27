// Een feest kopen op feesten.html en en/feesten.html.
// De functie feest-koop controleert alles en bepaalt het bedrag; de site toont haar melding.
(function(){
  var form=document.getElementById('koopForm');
  if(!form)return;
  // Op de eigen computer (localhost) gaat het naar de testdatabase.
  var lokaal=location.hostname==='localhost';
  var adres='https://'+(lokaal?'whebrmytlidfzvcickdh':'hktczewqpevvgxqcswov')+'.supabase.co/functions/v1/feest-koop';
  // Openbare sleutel (dezelfde als in de app), geen geheim.
  var sleutel=lokaal?'sb_publishable_LPdEmMiecZRwwuV8b0Ai5A_cKDsCzK-':'sb_publishable_YmfLKfk25pED0oqoTbSYPA_LWhZIuZC';
  var engels=document.documentElement.lang==='en';
  var t=engels?{
    feest:'Please enter a name for your party.',
    tijden:'Please enter the date and time of the start and the end.',
    email:'This email address doesn’t look right.',
    email2:'The two email addresses are not the same.',
    koper:'Please fill in your name and address.',
    vinkjes:'Please tick both boxes.',
    wachten:'One moment, we are taking you to the payment page…',
    mislukt:'Ordering did not work. Please try again later, or email info@makingmemories.be.',
    verbinding:'Ordering did not work. Please check your connection and try again.',
    duur:'The party lasts {duur}{volgende}. Photos can be added until 24 hours after that.',
    uur:'{u} hours', minuten:' and {m} minutes', volgende:' and ends the next day',
    telang:'A party lasts at most 24 hours. Choose an earlier end.',
    voor:'The end must be after the start.'
  }:{
    feest:'Geef je feest een naam.',
    tijden:'Vul de datum en het uur van het begin en het einde in.',
    email:'Dit e-mailadres lijkt niet te kloppen.',
    email2:'De twee e-mailadressen zijn niet gelijk.',
    koper:'Vul je naam en adres in.',
    vinkjes:'Vink beide vakjes aan.',
    wachten:'Even geduld, we brengen je naar de betaalpagina…',
    mislukt:'Bestellen lukte niet. Probeer het later opnieuw, of mail info@makingmemories.be.',
    verbinding:'Bestellen lukte niet. Controleer je verbinding en probeer opnieuw.',
    duur:'Het feest duurt {duur}{volgende}. Foto\'s toevoegen kan tot 24 uur daarna.',
    uur:'{u} uur', minuten:' en {m} minuten', volgende:' en eindigt de volgende dag',
    telang:'Een feest duurt hoogstens 24 uur. Kies een vroeger einde.',
    voor:'Het einde moet na het begin liggen.'
  };
  // De functie antwoordt in het Nederlands; op de Engelse pagina vertalen we wat we kennen.
  var EN={
    'Dit e-mailadres lijkt niet te kloppen.':t.email,
    'De twee e-mailadressen zijn niet gelijk.':t.email2,
    'Naam van het feest: 1 tot 80 tekens.':'Name of the party: 1 to 80 characters.',
    'Vul je voornaam en familienaam in (minstens 2 letters).':'Please fill in your first and last name (at least 2 letters).',
    'Controleer je adres (straat en nummer, postcode, gemeente, land).':'Please check your address (street and number, postcode, town, country).',
    'Vink beide vakjes aan.':t.vinkjes,
    'Vul de datum en het uur van het begin en het einde in.':t.tijden,
    'Controleer de datums en uren.':'Please check the dates and times.',
    'Het einde moet na het begin liggen.':t.voor,
    'Een feest duurt hoogstens 24 uur.':'A party lasts at most 24 hours.',
    'Dit feest is (bijna) voorbij. Kies een latere datum of een later einde.':'This party is (almost) over. Choose a later date or a later end.',
    'Je kunt hoogstens een jaar vooruit kopen.':'You can buy at most one year ahead.',
    'Feesten kopen kan nu niet. Probeer het later opnieuw.':'Buying a party is not possible right now. Please try again later.',
    'Te veel pogingen. Probeer het over een uur opnieuw.':'Too many attempts. Please try again in an hour.',
    'Te veel pogingen met dit e-mailadres. Probeer het later opnieuw.':'Too many attempts with this email address. Please try again later.',
    'Even druk, probeer zo opnieuw.':'It is busy right now, please try again in a moment.',
    'Je hebt op dat moment al een feest. Kijk in je mail, of mail info@makingmemories.be.':'You already have a party at that time. Check your email, or write to info@makingmemories.be.',
    'Je hebt al 3 komende feesten. Mail info@makingmemories.be voor meer.':'You already have 3 upcoming parties. Email info@makingmemories.be for more.',
    'Voor die maand zijn alle feesten verkocht.':'All parties for that month have been sold.',
    'Feesten kopen is nog niet ingesteld.':'Buying a party has not been set up yet.',
    'Betaling aanmaken is mislukt. Probeer het later opnieuw.':'Creating the payment failed. Please try again later.'
  };
  function vertaal(m){
    if(!engels)return m;
    var vanaf=/^Kopen kan voor feesten vanaf (\d\d-\d\d-\d{4})\.$/.exec(m);
    if(vanaf)return 'You can buy for parties from '+vanaf[1]+'.';
    return EN[m]||m;
  }

  var geladen=Date.now();
  var status=form.querySelector('.form-status');
  var knop=form.querySelector('button[type=submit]');
  var duurRegel=document.getElementById('koopDuur');
  function meld(tekst,soort){status.textContent=tekst;status.className='form-status '+(soort||'');}
  function toon(sleutelNaam,aan){
    Array.prototype.forEach.call(document.querySelectorAll('[data-koop="'+sleutelNaam+'"]'),function(e){e.hidden=!aan;});
  }

  // Voorstel voor het einde: begin + 6 uur. Wie het einde zelf kiest, houdt zijn keuze.
  var zelfGekozen=false;
  function moment(d,u){return d&&u?Date.parse(d+'T'+u+':00Z'):NaN;}
  function stelVoor(){
    if(!zelfGekozen){
      var b=moment(form.begin_datum.value,form.begin_uur.value);
      if(!isNaN(b)){
        var e=new Date(b+6*36e5).toISOString();
        form.eind_datum.value=e.slice(0,10);form.eind_uur.value=e.slice(11,16);
      }
    }
    duur();
  }
  // Alleen een hulpregel: of de tijden mogen, beslist de database.
  function duur(){
    var b=moment(form.begin_datum.value,form.begin_uur.value), e=moment(form.eind_datum.value,form.eind_uur.value);
    duurRegel.className='form-note';
    if(isNaN(b)||isNaN(e)){duurRegel.textContent='';return;}
    var min=Math.round((e-b)/6e4);
    if(min<=0){duurRegel.textContent=t.voor;duurRegel.className='form-note let-op';return;}
    if(min>1440){duurRegel.textContent=t.telang;duurRegel.className='form-note let-op';return;}
    var d=t.uur.replace('{u}',Math.floor(min/60))+(min%60?t.minuten.replace('{m}',min%60):'');
    duurRegel.textContent=t.duur.replace('{duur}',d).replace('{volgende}',form.eind_datum.value!==form.begin_datum.value?t.volgende:'');
  }
  ['begin_datum','begin_uur'].forEach(function(n){form[n].addEventListener('change',stelVoor);});
  ['eind_datum','eind_uur'].forEach(function(n){form[n].addEventListener('change',function(){zelfGekozen=true;duur();});});

  function fout(veld,tekst){meld(tekst,'err');veld.focus();}
  function eersteLege(namen){
    for(var i=0;i<namen.length;i++){if(!form[namen[i]].value.trim())return form[namen[i]];}
    return null;
  }
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var leeg;
    if(!form.feestnaam.value.trim())return fout(form.feestnaam,t.feest);
    if((leeg=eersteLege(['begin_datum','begin_uur','eind_datum','eind_uur'])))return fout(leeg,t.tijden);
    var email=form.email.value.trim(), email2=form.email2.value.trim();
    if(!/^[^\s@<>]+@[^\s@<>]+\.[A-Za-z]{2,}$/.test(email))return fout(form.email,t.email);
    if(email.toLowerCase()!==email2.toLowerCase())return fout(form.email2,t.email2);
    if((leeg=eersteLege(['voornaam','familienaam','straat','postcode','gemeente'])))return fout(leeg,t.koper);
    if(!form.akkoord.checked)return fout(form.akkoord,t.vinkjes);
    if(!form.geen_herroeping.checked)return fout(form.geen_herroeping,t.vinkjes);

    var gegevens={akkoord:true,geen_herroeping:true,website:form.website.value,ingevuld_ms:Date.now()-geladen};
    ['feestnaam','begin_datum','begin_uur','eind_datum','eind_uur','email','email2','voornaam','familienaam','straat','postcode','gemeente','land']
      .forEach(function(n){gegevens[n]=form[n].value.trim();});
    knop.disabled=true;meld(t.wachten);
    fetch(adres,{method:'POST',headers:{'Content-Type':'application/json','apikey':sleutel},body:JSON.stringify(gegevens)})
    .then(function(r){return r.json().catch(function(){return {};});})
    .then(function(d){
      if(d.checkout_url&&/^https:\/\//.test(d.checkout_url)){
        // Mollie brengt de koper altijd terug naar de Nederlandse bedankpagina; die stuurt door naar het Engels.
        if(engels&&d.ref){try{localStorage.setItem('mm-feest-en',d.ref);}catch(e){}}
        location.assign(d.checkout_url);
        return;
      }
      knop.disabled=false;
      meld(d.fout?vertaal(d.fout):t.mislukt,'err');
      if(d.reden==='uit')toon('open',false),toon('dicht',true);
    })
    .catch(function(){knop.disabled=false;meld(t.verbinding,'err');});
  });
  // Terug van de betaalpagina met de terugknop: de knop weer vrijgeven.
  window.addEventListener('pageshow',function(e){if(e.persisted){knop.disabled=false;meld('');}});

  // Staat de verkoop open? Zo niet (of lukt het vragen niet), dan blijft de tegel op "binnenkort".
  fetch(adres,{headers:{'apikey':sleutel}})
  .then(function(r){return r.ok?r.json():null;})
  .then(function(a){
    if(!a||a.open!==true)return;
    var prijs=String(a.prijs||'4.95');
    prijs=engels?prijs:prijs.replace('.',',');
    Array.prototype.forEach.call(document.querySelectorAll('[data-prijs]'),function(e){e.textContent=prijs;});
    Array.prototype.forEach.call(document.querySelectorAll('[data-gasten]'),function(e){e.textContent=a.gasten;});
    if(a.open_dagen!=null)Array.prototype.forEach.call(document.querySelectorAll('[data-dagen]'),function(e){e.textContent=a.open_dagen;});
    if(a.vanaf){
      var nu=new Date(), vandaag=nu.getFullYear()+'-'+('0'+(nu.getMonth()+1)).slice(-2)+'-'+('0'+nu.getDate()).slice(-2);
      form.begin_datum.min=form.eind_datum.min=a.vanaf>vandaag?a.vanaf:vandaag;
    }
    if(a.tot)form.begin_datum.max=a.tot;
    toon('dicht',false);toon('open',true);
    var gratis=document.querySelector('.intro [data-ben]');
    if(gratis)gratis.classList.add('licht');
    if(location.hash==='#kopen')document.getElementById('kopen').scrollIntoView();
  })
  .catch(function(){});
})();
