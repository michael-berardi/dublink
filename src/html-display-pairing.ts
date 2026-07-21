function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type DisplayPairingPageOptions = {
  scannedSession: string;
  canonicalSession: string;
  displayCount: number;
  activeDisplays: number[];
  assignmentToken: string;
};

export function displayPairingPage(options: DisplayPairingPageOptions): string {
  const displayCount = Math.max(2, Math.min(4, Math.floor(options.displayCount)));
  const activeDisplays = Array.from(new Set(options.activeDisplays))
    .filter((display) => Number.isInteger(display) && display >= 1 && display <= displayCount)
    .sort((a, b) => a - b);
  const activeSet = new Set(activeDisplays);
  const initialChoices = Array.from({ length: displayCount }, (_, index) => {
    const displayNumber = index + 1;
    const active = activeSet.has(displayNumber);
    return `<button class="display-choice${active ? ' connected' : ''}" type="button" data-display-number="${displayNumber}" data-active="${active}"${active ? ' disabled' : ''}><span class="display-number">${displayNumber}</span><span><strong>Display ${displayNumber}</strong><small>${active ? 'Already connected' : 'Connect this TV'}</small></span></button>`;
  }).join('');
  const safeScannedSession = escapeHtml(options.scannedSession);
  const safeCanonicalSession = escapeHtml(options.canonicalSession);
  const safeAssignmentToken = escapeHtml(options.assignmentToken);
  const activeDisplayData = activeDisplays.join(',');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Assign TV Display | DubMenu</title>
  <style>
    :root{color-scheme:dark;--bg:#07110d;--surface:#101d17;--surface-2:#16271f;--border:#2b4137;--text:#f5faf7;--muted:#9fb0a7;--primary:#38e28f;--primary-dark:#0d6d43;--danger:#ff8c8c}
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;background:radial-gradient(circle at 50% 0,rgba(56,226,143,.11),transparent 36rem),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    body{display:flex;justify-content:center;padding:max(1.25rem,env(safe-area-inset-top)) max(1rem,env(safe-area-inset-right)) max(1.5rem,env(safe-area-inset-bottom)) max(1rem,env(safe-area-inset-left))}
    main{width:min(100%,31rem);align-self:flex-start}
    .brand{margin:.35rem 0 1.65rem;color:var(--primary);font-size:1.05rem;font-weight:900;letter-spacing:-.03em}
    .eyebrow{margin:0 0 .55rem;color:var(--primary);font-size:.7rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
    h1{margin:0;font-size:clamp(2rem,9vw,3rem);line-height:.98;letter-spacing:-.055em}
    .intro{margin:.8rem 0 1.25rem;color:var(--muted);font-size:.98rem;line-height:1.5}
    .card{padding:1rem;border:1px solid var(--border);border-radius:1.05rem;background:linear-gradient(145deg,rgba(255,255,255,.035),transparent),var(--surface);box-shadow:0 24px 60px rgba(0,0,0,.25)}
    .count-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.2rem .1rem 1rem;border-bottom:1px solid var(--border)}
    .count-label strong{display:block;font-size:.94rem}.count-label small{display:block;margin-top:.2rem;color:var(--muted);font-size:.78rem}
    .stepper{display:grid;grid-template-columns:2.75rem 3rem 2.75rem;align-items:center;overflow:hidden;border:1px solid var(--border);border-radius:.75rem;background:var(--surface-2)}
    .stepper button{width:2.75rem;height:2.75rem;border:0;background:transparent;color:var(--text);font-size:1.55rem;line-height:1;cursor:pointer}.stepper button:disabled{color:#587064;cursor:not-allowed}.stepper button:not(:disabled):active{background:rgba(56,226,143,.14)}
    .stepper output{text-align:center;font-size:1.05rem;font-weight:900}
    .question{margin:1rem 0 .7rem;font-size:.85rem;font-weight:800;color:var(--muted)}
    .choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}
    .display-choice{display:flex;align-items:center;gap:.65rem;min-width:0;padding:.78rem;border:1px solid var(--border);border-radius:.8rem;background:var(--surface-2);color:var(--text);text-align:left;cursor:pointer;transition:border-color .16s ease,background .16s ease,transform .16s ease}
    .display-choice:not(:disabled):hover,.display-choice:not(:disabled):focus-visible{border-color:var(--primary);background:#193528;outline:none;transform:translateY(-1px)}
    .display-choice.connected{opacity:.58;cursor:default}
    .display-number{display:grid;place-items:center;flex:0 0 auto;width:2.2rem;height:2.2rem;border-radius:50%;background:var(--primary);color:#042015;font-size:1rem;font-weight:950}
    .connected .display-number{background:#4b6257;color:#d7e3dc}
    .display-choice strong,.display-choice small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.display-choice strong{font-size:.84rem}.display-choice small{margin-top:.18rem;color:var(--muted);font-size:.69rem}
    .status{min-height:1.25rem;margin:.8rem .15rem 0;color:var(--muted);font-size:.78rem;line-height:1.4}.status.error{color:var(--danger)}
    .helper{margin:1rem .2rem 0;color:var(--muted);font-size:.78rem;line-height:1.45}
    @media(max-width:360px){.choices{grid-template-columns:1fr}.brand{margin-bottom:1.15rem}.card{padding:.8rem}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  </style>
</head>
<body data-display-count="${displayCount}" data-active-displays="${activeDisplayData}">
<main>
  <div class="brand">DUBMENU</div>
  <p class="eyebrow">Resume display setup</p>
  <h1>Which display is this?</h1>
  <p class="intro">Choose this TV's position in your saved multi-display menu. DubMenu will reconnect it to the right content automatically.</p>
  <section class="card" aria-label="Assign this TV">
    <div class="count-row">
      <div class="count-label"><strong>Number of displays</strong><small>Saved for this menu</small></div>
      <div class="stepper" role="group" aria-label="Number of displays">
        <button id="displayCountDecrease" type="button" aria-label="Decrease number of displays">&minus;</button>
        <output id="displayCountValue" aria-live="polite">${displayCount}</output>
        <button id="displayCountIncrease" type="button" aria-label="Increase number of displays">+</button>
      </div>
    </div>
    <p class="question">Select this TV</p>
    <div class="choices" id="displaySlotChoices">${initialChoices}</div>
    <div class="status" id="pairingStatus" role="status" aria-live="polite">Connected displays are unavailable until they disconnect.</div>
  </section>
  <p class="helper">Your saved layout supports up to four displays. This choice stays in the TV's browser, so reopening the page resumes the same display.</p>
</main>
<script>
(function(){
  var scannedSession='${safeScannedSession}';
  var canonicalSession='${safeCanonicalSession}';
  var assignmentToken='${safeAssignmentToken}';
  var displayCount=${displayCount};
  var activeDisplays=${JSON.stringify(activeDisplays)};
  var firstAvailableDisplay=1;while(activeDisplays.indexOf(firstAvailableDisplay)!==-1&&firstAvailableDisplay<4)firstAvailableDisplay+=1;
  var minimumDisplayCount=Math.max(firstAvailableDisplay,activeDisplays.reduce(function(highest,displayNumber){return Math.max(highest,displayNumber);},1));
  var busy=false;
  var choices=document.getElementById('displaySlotChoices');
  var value=document.getElementById('displayCountValue');
  var decrease=document.getElementById('displayCountDecrease');
  var increase=document.getElementById('displayCountIncrease');
  var status=document.getElementById('pairingStatus');

  function isActive(displayNumber){return activeDisplays.indexOf(displayNumber)!==-1;}
  function render(){
    value.textContent=String(displayCount);
    document.body.setAttribute('data-display-count',String(displayCount));
    decrease.disabled=busy||displayCount<=minimumDisplayCount;
    increase.disabled=busy||displayCount>=4;
    var html='';
    for(var displayNumber=1;displayNumber<=displayCount;displayNumber+=1){
      var active=isActive(displayNumber);
      html+='<button class="display-choice'+(active?' connected':'')+'" type="button" data-display-number="'+displayNumber+'" data-active="'+active+'"'+(active||busy?' disabled':'')+'><span class="display-number">'+displayNumber+'</span><span><strong>Display '+displayNumber+'</strong><small>'+(active?'Already connected':'Connect this TV')+'</small></span></button>';
    }
    choices.innerHTML=html;
  }
  function changeCount(delta){
    if(busy)return;
    displayCount=Math.max(minimumDisplayCount,Math.min(4,displayCount+delta));
    render();
  }
  async function assignDisplay(displayNumber){
    if(busy||isActive(displayNumber)||displayNumber<1||displayNumber>displayCount)return;
    busy=true;render();status.className='status';status.textContent='Connecting this TV as Display '+displayNumber+'...';
    try{
      var response=await fetch('/api/pair-display',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scannedSession:scannedSession,canonicalSession:canonicalSession,assignmentToken:assignmentToken,displayNumber:displayNumber,displayCount:displayCount})});
      var data={};try{data=await response.json();}catch(e){}
      if(!response.ok||!data.success)throw new Error(data.error||'Could not connect this display.');
      status.textContent='Display '+displayNumber+' connected. Opening menu controls...';
      location.replace(data.redirectUrl);
    }catch(error){
      busy=false;render();status.className='status error';status.textContent=error&&error.message?error.message:'Could not connect this display.';
    }
  }
  decrease.addEventListener('click',function(){changeCount(-1);});
  increase.addEventListener('click',function(){changeCount(1);});
  choices.addEventListener('click',function(event){
    var button=event.target&&event.target.closest?event.target.closest('[data-display-number]'):null;
    if(button)assignDisplay(Number(button.getAttribute('data-display-number')));
  });
  render();
})();
</script>
</body>
</html>`;
}
