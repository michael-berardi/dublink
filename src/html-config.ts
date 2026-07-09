import { createStarterConfig } from './starter-template';
export function configPage(sessionId: string, origin: string): string {
  const STARTER_CONFIG = JSON.stringify(createStarterConfig());
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>DubMenu — Remote Control</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    :root{--bg:#000;--surface:#1c1c1e;--surface2:#2c2c2e;--border:#38383a;--text:#fff;--muted:#a1a1a6;--primary:#10b981;--danger:#ef4444;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;}
    .config-column{max-width:560px;margin:0 auto;padding:0.85rem 1rem 6rem;}
    .remote-heading{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.8rem;}
    .remote-heading h1{font-size:1.55rem;font-weight:780;letter-spacing:-0.045em;line-height:1.02;}
    .inline-status{display:inline-flex;align-items:center;gap:0.4rem;padding:0.35rem 0.55rem;background:rgba(28,28,30,0.88);border:1px solid rgba(255,255,255,0.08);border-radius:999px;color:var(--muted);font-size:0.72rem;font-weight:700;line-height:1;white-space:nowrap;}
    .status-dot{display:inline-block;width:0.42rem;height:0.42rem;border-radius:50%;flex-shrink:0;}
    .status-connected{background:var(--primary);}
    .status-disconnected{background:var(--danger);}
    .status-connecting{background:#f59e0b;}
    .status-text{font-size:0.72rem;font-weight:700;}
    .card{background:var(--surface);border:1px solid rgba(255,255,255,0.06);border-radius:1rem;padding:1.1rem;margin-bottom:0.75rem;box-shadow:0 1px 0 rgba(255,255,255,0.04) inset;}
    .primary-card{background:linear-gradient(180deg,rgba(16,185,129,0.14),rgba(28,28,30,0.96));border-color:rgba(16,185,129,0.24);}
    .card-title{font-size:0.75rem;font-weight:760;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:1rem;}
    .card-title-row{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem;}
    .card-title-row .card-title{margin-bottom:0;}
    .text-action{appearance:none;background:var(--surface2);border:1px solid var(--border);border-radius:999px;color:var(--primary);cursor:pointer;font-family:inherit;font-size:0.75rem;font-weight:760;padding:0.4rem 0.65rem;white-space:nowrap;}
    .text-action:focus-visible{outline:2px solid var(--primary);outline-offset:2px;}
    .upload-row{display:flex;align-items:center;gap:0.5rem;}
    .upload-row input{min-width:0;flex:1;}
    .field{margin-bottom:1rem;}
    .field:last-child{margin-bottom:0;}
    .field label{display:block;font-size:0.75rem;font-weight:600;color:var(--muted);margin-bottom:0.375rem;text-transform:uppercase;letter-spacing:0.04em;}
    .field input[type="text"],.field input[type="url"],.field input[type="number"],.field textarea,.field select{
      width:100%;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);font-size:1rem;outline:none;font-family:inherit;
      -webkit-user-select:text;user-select:text;-webkit-tap-highlight-color:transparent;
    }
    #dutchieUrl{min-width:0;width:100%;box-sizing:border-box;}
    #dutchieForm{width:100%;}
    .field input:focus,.field textarea:focus,.field select:focus{box-shadow:0 0 0 2px var(--primary);}
    .field input[type="color"]{width:100%;height:2.5rem;background:var(--surface2);border:none;border-radius:0.5rem;cursor:pointer;padding:0.25rem;}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}
    .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-top:1px solid var(--border);}
    .toggle-row:first-child{border-top:none;}
    .toggle-row span{font-size:1rem;}
    .switch{position:relative;width:44px;height:26px;background:var(--surface2);border-radius:13px;cursor:pointer;transition:background 0.2s;flex-shrink:0;}
    .switch.on{background:var(--primary);}
    .switch::after{content:'';position:absolute;width:22px;height:22px;background:#fff;border-radius:50%;top:2px;left:2px;transition:left 0.2s;}
    .switch.on::after{left:20px;}
    .theme-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}
    .theme-option{background:var(--surface2);border:2px solid transparent;border-radius:0.75rem;padding:1rem;cursor:pointer;transition:border-color 0.2s;}
    .theme-option.selected{border-color:var(--primary);}
    .theme-name{font-size:0.9375rem;font-weight:700;margin-bottom:0.25rem;}
    .theme-desc{font-size:0.75rem;color:var(--muted);line-height:1.4;}
    .theme-preview{height:32px;border-radius:0.375rem;margin-bottom:0.5rem;}
    .preview-dark{background:linear-gradient(135deg,#0a0a0a,#1a1a1a);border:1px solid #10b981;}
    .preview-light{background:linear-gradient(135deg,#f5f5f5,#fff);border:1px solid #059669;}
    .preview-neon{background:linear-gradient(135deg,#050505,#0a0a0a);box-shadow:inset 0 0 10px #00ff88;}
    .preview-minimal{background:linear-gradient(135deg,#111,#1a1a1a);}
    .preview-sunset{background:linear-gradient(135deg,#1a0a0a,#2a1212);border:1px solid #f97316;}
    .preview-forest{background:linear-gradient(135deg,#0a1410,#112218);border:1px solid #22c55e;}
    .preview-royal{background:linear-gradient(135deg,#0a0a1a,#12122a);border:1px solid #818cf8;}
    .preview-gold{background:linear-gradient(135deg,#0c0a05,#1a160c);border:1px solid #fbbf24;}
    .preview-ocean{background:linear-gradient(135deg,#050c14,#0e1824);border:1px solid #06b6d4;}
    .preview-crimson{background:linear-gradient(135deg,#0e0505,#1c0a0a);border:1px solid #dc2626;}
    .preview-bone{background:linear-gradient(135deg,#faf8f5,#fff);border:1px solid #1c1917;}
    .preview-vapor{background:linear-gradient(135deg,#0c0414,#180a26);border:1px solid #e879f9;}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:0.375rem;padding:0.75rem 1.25rem;border:none;border-radius:0.5rem;font-size:0.9375rem;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;}
    .btn-primary{background:var(--primary);}
    .btn-danger{background:var(--danger);}
    .btn-secondary{background:var(--surface2);}
    .btn-sm{padding:0.5rem 0.75rem;font-size:0.8125rem;}
    .search-bar{padding:0.75rem;background:var(--surface2);border-radius:0.5rem;margin-bottom:0.75rem;}
    .search-bar input{background:transparent;border:none;color:var(--text);font-size:1rem;outline:none;width:100%;}
    .cat-item{background:var(--surface2);border-radius:0.75rem;padding:1rem;margin-bottom:0.75rem;}
    .cat-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap;}
    .cat-header input{flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);font-size:1rem;font-weight:600;outline:none;}
    .prod-item{background:var(--surface);border-radius:0.5rem;padding:0.75rem;margin-bottom:0.5rem;}
    .prod-top{display:flex;justify-content:space-between;align-items:center;}
    .prod-name{font-weight:600;font-size:0.9375rem;}
    .prod-price{color:var(--primary);font-weight:700;font-size:0.9375rem;}
    .prod-meta{font-size:0.75rem;color:var(--muted);margin-top:0.25rem;display:flex;gap:0.5rem;flex-wrap:wrap;}
    .badge{display:inline-flex;padding:0.125rem 0.375rem;border-radius:0.25rem;font-size:0.625rem;font-weight:700;text-transform:uppercase;}
    .badge-indica{background:#6d28d9;color:#fff;}
    .badge-sativa{background:#d97706;color:#fff;}
    .badge-hybrid{background:#059669;color:#fff;}
    .badge-out{background:var(--danger);color:#fff;}
    .badge-in{background:var(--primary);color:#fff;}
    .expand-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:0.8125rem;font-family:inherit;padding:0.25rem;}
    .prod-edit{display:none;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border);}
    .prod-edit.open{display:block;}
    .prod-edit .grid-2{margin-bottom:0.5rem;}
    .drag-handle{cursor:grab;user-select:none;padding:0 0.375rem;opacity:0.6;font-size:1rem;line-height:1;color:var(--muted);touch-action:none;}
    .drag-handle:active{cursor:grabbing;}
    .move-btn{background:none;border:none;color:var(--muted);cursor:pointer;padding:0.25rem 0.375rem;font-size:0.875rem;line-height:1;font-family:inherit;}
    .move-btn:hover{color:var(--primary);}
    .move-btn:disabled{opacity:0.25;cursor:default;}
    .cat-item.dragging,.prod-item.dragging{opacity:0.4;}
    .cat-item.drag-over,.prod-item.drag-over{border-top:2px solid var(--primary);}
    .cat-item[data-id],.prod-item[data-id]{border:2px solid transparent;}
    .cat-item.drag-over{border-color:transparent;border-top:2px solid var(--primary);}
    .prod-item.drag-over{border-color:transparent;border-top:2px solid var(--primary);}
    .dnd-controls{display:flex;align-items:center;gap:0.125rem;flex-shrink:0;}
    .actions{display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;}
    .actions .btn{flex:1;min-width:100px;}
    .toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--surface2);color:var(--text);padding:0.75rem 1.5rem;border-radius:0.75rem;font-size:0.9375rem;font-weight:600;z-index:1000;opacity:0;transition:opacity 0.3s,transform 0.3s;pointer-events:none;}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(-8px);}
    .screenset-info{background:var(--surface);border:1px solid var(--primary);border-radius:0.75rem;padding:1rem;margin-bottom:0.75rem;display:none;}
    .screenset-info.active{display:block;}
    .screenset-info h3{font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;}
    .screenset-list{display:flex;flex-direction:column;gap:0.5rem;}
    .screenset-tv{display:flex;align-items:center;gap:0.75rem;padding:0.625rem;background:var(--surface2);border-radius:0.5rem;}
    .screenset-tv-num{width:28px;height:28px;background:var(--primary);color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.8125rem;flex-shrink:0;}
    .screenset-tv-url{font-size:0.75rem;color:var(--muted);flex:1;word-break:break-all;}
    .screen-layout-select{background:var(--surface);border:1px solid var(--border);border-radius:0.45rem;color:var(--text);font-size:0.75rem;padding:0.45rem 0.5rem;max-width:8rem;}
    .helper{font-size:0.8125rem;color:var(--muted);line-height:1.45;margin-top:0.4rem;}
    .import-status{font-size:0.875rem;color:var(--muted);margin-top:0.75rem;min-height:1.2rem;line-height:1.45;display:flex;align-items:center;gap:0.5rem;}
    .import-status.ok{color:var(--primary);}
    .import-status.err{color:var(--danger);}
    .import-spinner{width:1rem;height:1rem;border-radius:999px;border:2px solid rgba(16,185,129,0.2);border-top-color:var(--primary);animation:spin 0.8s linear infinite;flex-shrink:0;}
    .import-progress{display:none;margin-top:0.875rem;border:1px solid var(--border);border-radius:0.75rem;background:var(--surface2);overflow:hidden;}
    .import-progress.active{display:block;}
    .import-progress-bar{height:5px;background:rgba(16,185,129,0.18);}
    .import-progress-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--primary),#86efac);transition:width 0.45s ease;}
    .import-steps{display:grid;gap:0.45rem;padding:0.85rem;}
    .import-step{display:flex;align-items:center;gap:0.55rem;color:var(--muted);font-size:0.8125rem;}
    .import-step-dot{width:0.55rem;height:0.55rem;border-radius:999px;background:var(--border);flex-shrink:0;}
    .import-step.active{color:var(--text);font-weight:650;}
    .import-step.active .import-step-dot{background:var(--primary);box-shadow:0 0 0 3px rgba(16,185,129,0.15);}
    .import-step.done .import-step-dot{background:var(--primary);}
    .import-results{display:none;margin-top:0.75rem;padding:0.75rem;border:1px solid var(--border);border-radius:0.75rem;background:var(--surface2);}
    .import-results.active{display:block;}
    .import-result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:0.6rem;}
    .import-result-stat{background:var(--surface);border:1px solid var(--border);border-radius:0.55rem;padding:0.55rem;}
    .import-result-stat strong{display:block;color:var(--text);font-size:1.15rem;line-height:1;}
    .import-result-stat span{display:block;color:var(--muted);font-size:0.72rem;margin-top:0.25rem;}
    .import-warning{font-size:0.8125rem;color:#fbbf24;line-height:1.4;}
    .import-debug{margin-top:0.65rem;border-top:1px solid var(--border);padding-top:0.65rem;color:var(--muted);font-size:0.75rem;line-height:1.45;}
    .import-debug summary{cursor:pointer;color:var(--text);font-weight:650;}
    .import-debug ul{margin:0.5rem 0 0;padding-left:1rem;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
    .skip-link{position:absolute;left:-9999px;top:0.5rem;z-index:200;background:var(--primary);color:#000;padding:0.5rem 1rem;border-radius:0.375rem;font-weight:700;font-size:0.875rem;}
    .skip-link:focus{left:0.5rem;}
    .lib-btn{background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:0.375rem;padding:0.35rem 0.5rem;font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;flex:0 0 auto;}
    .lib-btn:hover{border-color:var(--primary);color:var(--primary);}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:500;display:none;align-items:center;justify-content:center;padding:1rem;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
    .modal-overlay.open{display:flex;}
    .modal-panel{background:var(--surface);border-radius:0.75rem;width:100%;max-width:680px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border);}
    .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--border);flex-shrink:0;}
    .modal-title{font-size:1.125rem;font-weight:700;}
    .modal-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.5rem;line-height:1;padding:0.25rem 0.5rem;font-family:inherit;border-radius:0.25rem;}
    .modal-close:hover{color:var(--text);background:var(--surface2);}
    .modal-body{padding:1rem 1.25rem;overflow-y:auto;flex:1;}
    .lib-toolbar{display:flex;gap:0.5rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap;}
    .lib-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;}
    .lib-card{background:var(--surface2);border-radius:0.5rem;overflow:hidden;display:flex;flex-direction:column;}
    .lib-thumb{width:100%;aspect-ratio:1;background:var(--bg);object-fit:cover;display:block;}
    .lib-thumb-fallback{width:100%;aspect-ratio:1;background:var(--bg);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.75rem;text-align:center;padding:0.5rem;}
    .lib-meta{padding:0.5rem;font-size:0.6875rem;color:var(--muted);line-height:1.3;flex:1;}
    .lib-meta .lib-name{color:var(--text);font-weight:600;font-size:0.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .lib-actions{display:flex;gap:0.375rem;padding:0 0.5rem 0.5rem;}
    .lib-actions .btn{flex:1;font-size:0.75rem;padding:0.35rem 0.25rem;}
    .lib-skeleton{background:var(--surface2);border-radius:0.5rem;aspect-ratio:1;position:relative;overflow:hidden;}
    .lib-skeleton::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent);animation:libshimmer 1.4s infinite;}
    @keyframes libshimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}
    .lib-empty{text-align:center;padding:2.5rem 1rem;color:var(--muted);}
    .lib-empty p{margin-bottom:1rem;font-size:0.9375rem;}
    .lib-error{text-align:center;padding:2.5rem 1rem;color:var(--danger);font-size:0.9375rem;}
    .lib-loadmore{margin-top:1rem;text-align:center;}
    .lib-loadmore .btn{display:inline-flex;}
    .mobile-control-hub{display:none;}
    .hub-title{font-size:0.68rem;font-weight:780;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin:0 0 0.5rem;}
    .hub-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;}
    .hub-tile{appearance:none;background:linear-gradient(180deg,rgba(44,44,46,0.98),rgba(28,28,30,0.98));border:1px solid rgba(255,255,255,0.08);border-radius:1rem;color:var(--text);cursor:pointer;font-family:inherit;min-height:5.9rem;padding:0.78rem;text-align:left;box-shadow:0 1px 0 rgba(255,255,255,0.05) inset;}
    .hub-tile:focus-visible{outline:2px solid var(--primary);outline-offset:2px;}
    .hub-icon{align-items:center;background:rgba(16,185,129,0.16);border-radius:0.72rem;color:var(--primary);display:flex;font-size:1rem;height:1.75rem;justify-content:center;margin-bottom:0.52rem;width:1.75rem;}
    .hub-label{display:block;font-size:0.95rem;font-weight:780;letter-spacing:-0.02em;}
    .hub-desc{color:var(--muted);display:block;font-size:0.68rem;line-height:1.25;margin-top:0.16rem;}
    .control-section{display:block;}
    .section-head{display:none;}
    .section-back{appearance:none;background:var(--surface2);border:1px solid rgba(255,255,255,0.08);border-radius:999px;color:var(--text);cursor:pointer;font-family:inherit;font-size:1rem;font-weight:700;height:2.35rem;width:2.35rem;}
    .section-kicker{color:var(--primary);font-size:0.72rem;font-weight:760;letter-spacing:0.08em;text-transform:uppercase;}
    .section-head h2{font-size:1.35rem;letter-spacing:-0.03em;line-height:1.08;margin-top:0.1rem;}
    .remote-preview-button{position:static;width:100%;margin:0.75rem 0 0;justify-content:center;border-radius:1rem;padding:0.85rem 1rem;font-size:0.9rem;}
    .backup-actions{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-top:0.75rem;}
    .backup-actions .btn{width:100%;}
    @media(max-width:480px){.lib-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:400px){.grid-2{grid-template-columns:1fr;}.theme-grid{grid-template-columns:1fr;}}
    @media(max-width:480px){
      .cat-header input{flex:1 1 calc(100% - 7.5rem);}
      .cat-header .btn{flex:0 0 auto;}
      .prod-edit .grid-2{grid-template-columns:1fr;}
      .prod-edit input,.prod-edit select{min-width:0;}
      .import-result-grid{grid-template-columns:1fr;}
      .import-step{align-items:flex-start;}
    }

    /* ----------------------------------------------------------------
       Desktop simulator layout.
       On wide screens the config editor becomes a scrolling left pane
       and the right pane hosts a live TV preview iframe.
       The preview iframe is rendered at a 1920x1080 viewport and scaled
       via CSS transform so the real TV renderer is reused exactly.
    ----------------------------------------------------------------- */
    @media(min-width:1100px){
      body{max-width:none;margin:0;height:100vh;overflow:hidden;}
      .config-column{flex:1;min-width:0;max-width:680px;height:100vh;overflow-y:auto;padding:1rem;}
      .remote-heading{margin-bottom:1.25rem;}
      #simulatorPanel{flex:0 0 420px;display:flex;flex-direction:column;height:100vh;background:#000;border-left:1px solid var(--border);padding:1rem;}
      .sim-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:0.75rem;flex-shrink:0;}
      .sim-header h2{font-size:1.25rem;font-weight:700;}
      .sim-controls{display:flex;align-items:flex-end;gap:0.75rem;margin-bottom:0.75rem;flex-shrink:0;flex-wrap:wrap;}
      .sim-field{display:flex;flex-direction:column;gap:0.35rem;}
      .sim-field label{font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);}
      .sim-field select,.sim-field input{background:var(--surface2);border:none;border-radius:0.375rem;padding:0.4rem 0.5rem;color:var(--text);font-size:0.85rem;outline:none;}
      .sim-field-grow{flex:1;min-width:0;}
      .sim-segmented{display:flex;gap:0.25rem;background:var(--surface2);border-radius:0.5rem;padding:0.25rem;}
      .sim-segmented button{background:transparent;border:none;color:var(--text);font-size:0.85rem;font-weight:600;padding:0.35rem 0.75rem;border-radius:0.375rem;cursor:pointer;font-family:inherit;}
      .sim-segmented button.active{background:var(--primary);color:#000;}
      .sim-tabs{display:flex;gap:0.25rem;flex-wrap:wrap;}
      .sim-tab{background:var(--surface2);border:none;color:var(--text);font-size:0.85rem;font-weight:600;padding:0.4rem 0.75rem;border-radius:0.375rem;cursor:pointer;font-family:inherit;border:1px solid transparent;}
      .sim-tab.active{background:var(--surface);border-color:var(--primary);}
      .sim-preview{flex:1;position:relative;overflow:hidden;background:var(--surface);border-radius:0.75rem;border:1px solid var(--border);min-height:0;display:flex;align-items:center;justify-content:center;}
      .sim-frame-wrapper{position:relative;overflow:hidden;}
      .sim-frame{position:absolute;top:0;left:0;width:1920px;height:1080px;border:none;display:block;transform-origin:top left;pointer-events:none;}
      .sim-grid{position:absolute;inset:0;display:grid;gap:0.75rem;padding:0.75rem;}
      .sim-grid-2{grid-template-columns:repeat(2,1fr);grid-template-rows:1fr;}
      .sim-grid-4{grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);}
      .sim-grid-cell{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#000;border-radius:0.5rem;border:1px solid var(--border);}
      .sim-grid-cell .sim-frame-wrapper{position:relative;overflow:hidden;}
      .sim-header,.sim-controls,.sim-footer{position:relative;z-index:10;}
      .sim-footer{display:flex;align-items:center;justify-content:space-between;margin-top:0.75rem;flex-shrink:0;font-size:0.8rem;color:var(--muted);}
    }
    @media(max-width:1099px){
      body:not(.section-open){height:100dvh;overflow:hidden;}
      #simulatorPanel{display:none;}
      .desktop-layout{display:block;}
      .mobile-control-hub{display:block;}
      .control-section{display:none;}
      .control-section.open{display:block;position:fixed;inset:0;z-index:430;background:var(--bg);overflow-y:auto;padding:calc(env(safe-area-inset-top) + 0.75rem) 1rem 7rem;}
      .control-section.open::before{content:'';position:fixed;inset:0 0 auto 0;height:5.4rem;background:linear-gradient(180deg,var(--bg),rgba(0,0,0,0));pointer-events:none;z-index:0;}
      .section-head{display:flex;align-items:center;gap:0.9rem;margin-bottom:1rem;position:sticky;top:0;z-index:2;background:rgba(0,0,0,0.84);padding:0.35rem 0 0.75rem;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);}
      .section-head + .card{margin-top:0;}
      .control-section .card:last-child{margin-bottom:0;}
      body.section-open{overflow:hidden;}
      .config-column{height:100dvh;overflow:hidden;padding:calc(env(safe-area-inset-top) + 0.7rem) 0.9rem calc(env(safe-area-inset-bottom) + 0.8rem);}
      #mainContent{height:100%;display:flex;flex-direction:column;}
      .remote-heading{margin-bottom:0.75rem;flex-shrink:0;}
      .remote-heading h1{font-size:1.18rem;letter-spacing:-0.035em;white-space:nowrap;}
      .modal-overlay{align-items:flex-end;padding:0;}
      .modal-panel{border-radius:1.2rem 1.2rem 0 0;max-height:86vh;border-left:none;border-right:none;border-bottom:none;}
      .mobile-preview-panel{max-width:none;}
    }
/* Mobile preview: compact in-flow remote action. The TV renderer still opens
   in a modal so the main remote remains a static one-screen control surface. */
.mobile-preview-fab{display:flex;align-items:center;gap:0.375rem;background:var(--primary);color:#000;font-weight:700;border:none;cursor:pointer;font-family:inherit;}
@media(min-width:1100px){.mobile-preview-fab{display:none;}}
.mobile-preview-panel{max-width:900px;}
.mobile-preview-body{padding:0;overflow:hidden;}
.mobile-preview-modal-frame{position:relative;width:100%;height:480px;background:#000;border-radius:0 0 0.75rem 0.75rem;overflow:hidden;border-top:1px solid var(--border);}
.mobile-preview-modal-frame iframe{position:absolute;top:0;left:0;width:1920px;height:1080px;border:none;transform-origin:top left;pointer-events:none;}
@media(max-width:600px){.mobile-preview-modal-frame{height:320px;}}
.mobile-preview-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.9375rem;}
@media(max-width:1099px){
  .modal-overlay{align-items:flex-end;padding:0;}
  .modal-panel{border-radius:1.2rem 1.2rem 0 0;max-height:86vh;border-left:none;border-right:none;border-bottom:none;}
  .mobile-preview-panel{max-width:none;}
}
.setup-wizard{display:none;margin:1rem 0 1.2rem;border:1px solid rgba(16,185,129,0.35);background:linear-gradient(160deg,rgba(16,185,129,0.13),rgba(255,255,255,0.055)),var(--surface);border-radius:1rem;padding:1rem;box-shadow:0 22px 70px rgba(0,0,0,0.28);}
.setup-wizard.active{display:block;}
.wizard-eyebrow{font-size:0.75rem;color:var(--accent);font-weight:900;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:0.45rem;}
.wizard-title{margin:0;font-size:clamp(1.7rem,5vw,2.55rem);letter-spacing:-0.045em;line-height:0.96;}
.wizard-copy{color:var(--muted);font-size:0.98rem;line-height:1.45;margin:0.65rem 0 1rem;}
.wizard-grid{display:grid;grid-template-columns:1.05fr 0.95fr;gap:0.9rem;align-items:start;}
.wizard-panel{background:rgba(0,0,0,0.22);border:1px solid var(--border);border-radius:0.85rem;padding:0.85rem;}
.wizard-steps{display:grid;gap:0.55rem;margin-top:0.7rem;}
.wizard-step{display:flex;gap:0.55rem;align-items:flex-start;color:var(--muted);font-size:0.86rem;}
.wizard-step b{color:var(--text);display:block;font-size:0.9rem;}
.wizard-dot{width:1.35rem;height:1.35rem;border-radius:999px;background:rgba(16,185,129,0.18);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:900;flex:0 0 auto;margin-top:0.05rem;}
.wizard-actions{display:flex;gap:0.55rem;flex-wrap:wrap;margin-top:0.8rem;}
.wizard-status{margin-top:0.75rem;color:var(--muted);font-size:0.88rem;min-height:1.2rem;}
.wizard-status.ok{color:var(--accent);}
.wizard-status.err{color:var(--danger);}
.wizard-quality{display:none;margin-top:0.8rem;}
.wizard-quality.active{display:block;}
.wizard-body-lock .mobile-control-hub,.wizard-body-lock .control-section{display:none;}
.wizard-body-lock .screenset-info{display:none;}
.wizard-body-lock #simulatorPanel .sim-controls,.wizard-body-lock #simulatorPanel .sim-footer{display:none;}
@media(max-width:900px){.wizard-grid{grid-template-columns:1fr}.setup-wizard{margin:0.75rem 0;padding:0.85rem}.wizard-title{font-size:2rem}}
@media(max-width:600px){.setup-wizard{margin:0.45rem 0;padding:0.7rem;border-radius:0.85rem}.wizard-eyebrow{font-size:0.68rem;margin-bottom:0.3rem}.wizard-title{font-size:1.55rem;line-height:0.98}.wizard-copy{font-size:0.82rem;line-height:1.28;margin:0.42rem 0 0.55rem}.wizard-steps{gap:0.34rem;margin-top:0.45rem}.wizard-step{gap:0.4rem;font-size:0.76rem;line-height:1.15}.wizard-step b{font-size:0.8rem}.wizard-dot{width:1.1rem;height:1.1rem;font-size:0.62rem}.wizard-panel{padding:0.62rem;border-radius:0.7rem}.wizard-panel .field{margin-bottom:0.55rem}.wizard-panel label{font-size:0.68rem}.wizard-panel input,.wizard-panel textarea,.wizard-panel select{font-size:0.9rem;padding:0.66rem}.wizard-panel textarea{min-height:4.2rem}.wizard-actions{margin-top:0.55rem}.wizard-status{font-size:0.8rem;margin-top:0.55rem}}
  </style>
</head>
<body>

<a class="skip-link" href="#mainContent">Skip to main content</a>
<input type="file" id="importInput" accept=".json" style="display:none" onchange="importData(event)">

<div class="desktop-layout">
<div class="config-column">

<main id="mainContent">

<div class="remote-heading">
  <h1>DubMenu Remote Control</h1>
  <div class="inline-status" role="status" aria-live="polite" aria-atomic="true"><span class="status-dot status-disconnected" id="statusDot" aria-hidden="true"></span><span class="status-text" id="statusText">Connecting...</span></div>

</div>

<section class="setup-wizard" id="setupWizard" aria-labelledby="setupWizardTitle">
  <div class="wizard-eyebrow">First TV setup</div>
  <div class="wizard-grid">
    <div>
      <h2 class="wizard-title" id="setupWizardTitle">Build your TV menu from one source.</h2>
      <p class="wizard-copy">Paste a Dutchie link, store slug, or dispensary website. DubMenu imports products, prices, THC, strain, brand, weights, images, store title, logo, and a safe visual theme, then maps it to the best TV layout.</p>
      <div class="wizard-steps" aria-label="Wizard steps">
        <div class="wizard-step"><span class="wizard-dot">1</span><span><b>Scan menu data</b>Products, categories, prices, photos, title, and logo.</span></div>
        <div class="wizard-step"><span class="wizard-dot">2</span><span><b>Choose the premium layout</b>Dense price wall, image-led, sparse hero, or multi-display wall.</span></div>
        <div class="wizard-step"><span class="wizard-dot">3</span><span><b>Open the normal controls</b>After the TV has products, the full remote appears for fine-tuning.</span></div>
      </div>
    </div>
    <div class="wizard-panel">
      <form id="setupWizardForm" onsubmit="event.preventDefault();runSetupWizard();">
        <div class="field">
          <label for="wizardMenuUrl">Menu URL, Dutchie link, or store slug</label>
          <input type="text" inputmode="url" autocomplete="off" autocapitalize="none" autocorrect="off" enterkeyhint="go" spellcheck="false" id="wizardMenuUrl" placeholder="https://dutchie.com/embedded-menu/your-store or your-store.com" style="-webkit-user-select:text;user-select:text;">
        </div>
        <div class="field">
          <label for="wizardStyleNotes">Visual direction or competitor reference notes</label>
          <textarea id="wizardStyleNotes" rows="3" placeholder="Example: dense green TV price board, daily deals rail, no photos, four displays"></textarea>
        </div>
        <div class="field">
          <label for="wizardDisplayCount">TV displays</label>
          <select id="wizardDisplayCount" onchange="this.dataset.userSet='1';var target=document.getElementById('dutchieDisplayCount');if(target)target.value=this.value;"><option value="1">1 display</option><option value="2">2 displays</option><option value="3">3 displays</option><option value="4">4 displays</option></select>
        </div>
        <button class="btn btn-primary" id="setupWizardBtn" type="submit" style="width:100%;">Build My TV Menu</button>
      </form>
      <div class="wizard-actions">
        <button class="btn btn-sm btn-secondary" type="button" onclick="document.getElementById('importInput').click()">Import Settings JSON</button>
        <button class="btn btn-sm btn-secondary" type="button" onclick="openMobilePreview()">Preview Blank TV</button>
      </div>
      <div class="wizard-status" id="setupWizardStatus" aria-live="polite">Your TV is blank until the wizard imports a menu or settings file.</div>
      <div class="wizard-quality" id="setupWizardQuality"></div>
    </div>
  </div>
</section>

<div class="screenset-info" id="screensetInfo">
  <h3>Screen Set (<span id="screensetCount">1</span> TV<span id="screensetPlural">s</span>)</h3>
  <div class="screenset-list" id="screensetList"></div>
</div>

<div class="mobile-control-hub" aria-label="Remote control sections">
  <div class="hub-title">Controls</div>
  <div class="hub-grid">
    <button class="hub-tile" type="button" onclick="openControlSection('brand')"><span class="hub-icon" aria-hidden="true">B</span><span class="hub-label">Brand</span><span class="hub-desc">Name, logo, color.</span></button>
    <button class="hub-tile" type="button" onclick="openControlSection('design')"><span class="hub-icon" aria-hidden="true">D</span><span class="hub-label">Design</span><span class="hub-desc">Theme and layout.</span></button>
    <button class="hub-tile" type="button" onclick="openControlSection('promos')"><span class="hub-icon" aria-hidden="true">%</span><span class="hub-label">Promos</span><span class="hub-desc">Banners and specials.</span></button>
    <button class="hub-tile" type="button" onclick="openControlSection('inventory')"><span class="hub-icon" aria-hidden="true">P</span><span class="hub-label">Products</span><span class="hub-desc">Categories and prices.</span></button>
    <button class="hub-tile" type="button" onclick="openControlSection('legal')"><span class="hub-icon" aria-hidden="true">L</span><span class="hub-label">Legal</span><span class="hub-desc">Required copy.</span></button>
    <button class="hub-tile" type="button" onclick="openControlSection('import')"><span class="hub-icon" aria-hidden="true">I</span><span class="hub-label">Import</span><span class="hub-desc">Menus and backups.</span></button>
  </div>
  <button class="mobile-preview-fab remote-preview-button" type="button" onclick="openMobilePreview()" aria-label="Open TV preview">
    <span aria-hidden="true">&#9654;</span> Preview TV
  </button>
</div>

<section class="control-section" id="section-brand" aria-labelledby="sectionBrandTitle">
  <div class="section-head"><button class="section-back" type="button" onclick="closeControlSection()" aria-label="Back to controls">‹</button><div><div class="section-kicker">Setup</div><h2 id="sectionBrandTitle">Brand identity</h2></div></div>

<div class="card">
  <h2 class="card-title">Branding</h2>
  <div class="field"><label for="dispensaryName">Dispensary Name</label><input type="text" id="dispensaryName" placeholder="My Dispensary" oninput="debounceConfig('dispensaryName',this.value)"></div>
  <div class="grid-2">
    <div class="field">
      <label for="logoUrl">Logo</label>
      <div class="upload-row">
        <input type="url" id="logoUrl" placeholder="/api/uploads/..." oninput="debounceConfig('logo',this.value)">
        <label for="logoFile" class="lib-btn">Upload</label>
        <input type="file" id="logoFile" accept="image/*" onchange="uploadLogoImage(this)" style="display:none;">
      </div>
      <div class="helper">Upload stores the logo in DubMenu and sends it to the TV immediately.</div>
    </div>
    <div class="field"><label for="primaryColor">Accent Color</label><input type="color" id="primaryColor" value="#10b981" onchange="debounceConfig('primaryColor',this.value)"></div>
  </div>
  <div class="actions" style="margin-top:0;">
    <button class="btn btn-secondary btn-sm" type="button" onclick="openImageLibrary()">Browse Image Library</button>
  </div>
</div>
</section>

<section class="control-section" id="section-import" aria-labelledby="sectionImportTitle">
  <div class="section-head"><button class="section-back" type="button" onclick="closeControlSection()" aria-label="Back to controls">‹</button><div><div class="section-kicker">Smart setup</div><h2 id="sectionImportTitle">Menu Wizard</h2></div></div>
<div class="card primary-card">
  <h2 class="card-title">Import & Design Menu</h2>
  <form id="dutchieForm" onsubmit="event.preventDefault();importDutchie();">
    <div class="field">
      <label for="dutchieUrl">Menu URL, Dutchie Link, or Store Slug</label>
      <input type="text" inputmode="url" autocomplete="off" autocapitalize="none" autocorrect="off" enterkeyhint="go" spellcheck="false" id="dutchieUrl" name="dutchieUrl" placeholder="https://dutchie.com/embedded-menu/your-store or your-store.com" style="-webkit-user-select:text;user-select:text;">
      <div class="helper">The wizard imports products, scans store title/logo, maps categories, chooses a TV-safe visual theme, and picks the strongest layout for the display wall.</div>
    </div>
    <div class="field"><label for="dutchieStyleNotes">Visual direction</label><textarea id="dutchieStyleNotes" rows="2" placeholder="Example: dense green TV price board, daily deals rail, no photos"></textarea></div>
    <div class="field"><label for="dutchieDisplayCount">TV displays</label><select id="dutchieDisplayCount" onchange="this.dataset.userSet='1'"><option value="1">1 display</option><option value="2">2 displays</option><option value="3">3 displays</option><option value="4">4 displays</option></select></div>
    <button class="btn btn-primary" id="dutchieImportBtn" type="submit" style="width:100%;">Build TV Menu</button>
  </form>
  <div class="import-status" id="dutchieStatus" aria-live="polite"></div>
  <div class="import-progress" id="dutchieProgress" aria-hidden="true">
    <div class="import-progress-bar"><div class="import-progress-fill" id="dutchieProgressFill"></div></div>
    <div class="import-steps">
      <div class="import-step" data-step="1"><span class="import-step-dot"></span><span>Normalize the Dutchie/store URL</span></div>
      <div class="import-step" data-step="2"><span class="import-step-dot"></span><span>Find the menu feed or browser-rendered product cards</span></div>
      <div class="import-step" data-step="3"><span class="import-step-dot"></span><span>Import product photos, prices, THC, strain, brand, and weights</span></div>
      <div class="import-step" data-step="4"><span class="import-step-dot"></span><span>Sync the formatted TV menu to this session</span></div>
    </div>
  </div>
  <div class="import-results" id="dutchieResults" aria-live="polite"></div>
</div>
</section>

<section class="control-section" id="section-design" aria-labelledby="sectionDesignTitle">
  <div class="section-head"><button class="section-back" type="button" onclick="closeControlSection()" aria-label="Back to controls">‹</button><div><div class="section-kicker">Presentation</div><h2 id="sectionDesignTitle">Design the TV menu</h2></div></div>
<div class="card">
  <h2 class="card-title">Color Theme</h2>
  <div class="theme-grid" id="templateSelect" role="radiogroup" aria-label="Menu color theme">
    <div class="theme-option" data-template="default" onclick="selectTemplate('default')">
      <div class="theme-preview preview-dark"></div>
      <div class="theme-name">Classic Dark</div>
      <div class="theme-desc">Black background, green accents. Matches most dispensary aesthetics.</div>
    </div>
    <div class="theme-option" data-template="light" onclick="selectTemplate('light')">
      <div class="theme-preview preview-light"></div>
      <div class="theme-name">Clean Light</div>
      <div class="theme-desc">Bright, airy, Apple Store feel. Best for modern, well-lit spaces.</div>
    </div>
    <div class="theme-option" data-template="neon" onclick="selectTemplate('neon')">
      <div class="theme-preview preview-neon"></div>
      <div class="theme-name">Bold Neon</div>
      <div class="theme-desc">Glowing green on deep black. Nightlife, premium, eye-catching.</div>
    </div>
    <div class="theme-option" data-template="minimal" onclick="selectTemplate('minimal')">
      <div class="theme-preview preview-minimal"></div>
      <div class="theme-name">Minimal</div>
      <div class="theme-desc">Monochrome, maximum whitespace. Quiet luxury, understated.</div>
    </div>
    <div class="theme-option" data-template="sunset" onclick="selectTemplate('sunset')">
      <div class="theme-preview preview-sunset"></div>
      <div class="theme-name">Sunset</div>
      <div class="theme-desc">Warm orange on dark brown. Cozy, boutique, inviting.</div>
    </div>
    <div class="theme-option" data-template="forest" onclick="selectTemplate('forest')">
      <div class="theme-preview preview-forest"></div>
      <div class="theme-name">Forest</div>
      <div class="theme-desc">Deep green on dark forest. Natural, organic, earthy.</div>
    </div>
    <div class="theme-option" data-template="royal" onclick="selectTemplate('royal')">
      <div class="theme-preview preview-royal"></div>
      <div class="theme-name">Royal</div>
      <div class="theme-desc">Indigo glow on midnight. Premium, sophisticated, modern.</div>
    </div>
    <div class="theme-option" data-template="gold" onclick="selectTemplate('gold')">
      <div class="theme-preview preview-gold"></div>
      <div class="theme-name">Gold Rush</div>
      <div class="theme-desc">Gold on near-black. Maximum luxury, premium feel.</div>
    </div>
    <div class="theme-option" data-template="ocean" onclick="selectTemplate('ocean')">
      <div class="theme-preview preview-ocean"></div>
      <div class="theme-name">Ocean</div>
      <div class="theme-desc">Cyan on deep navy. Fresh, clinical, modern.</div>
    </div>
    <div class="theme-option" data-template="crimson" onclick="selectTemplate('crimson')">
      <div class="theme-preview preview-crimson"></div>
      <div class="theme-name">Crimson</div>
      <div class="theme-desc">Red on dark black. Bold, urgent, sale-energy.</div>
    </div>
    <div class="theme-option" data-template="bone" onclick="selectTemplate('bone')">
      <div class="theme-preview preview-bone"></div>
      <div class="theme-name">Bone</div>
      <div class="theme-desc">Off-white with black accent. Editorial, high-fashion.</div>
    </div>
    <div class="theme-option" data-template="vapor" onclick="selectTemplate('vapor')">
      <div class="theme-preview preview-vapor"></div>
      <div class="theme-name">Vapor</div>
      <div class="theme-desc">Pink-purple glow. Retro-futuristic, fun.</div>
    </div>
  </div>
</div>

<div class="card">
  <h2 class="card-title">Layout</h2>
  <div class="field">
    <label for="layout">Default Layout</label>
    <select id="layout" onchange="sendConfig('layout',this.value)">
      <option value="auto">Auto (grid)</option>
      <option value="grid">Grid</option>
      <option value="list">Price List</option>
      <option value="pricewall">Dense Price Wall</option>
      <option value="poster">Poster</option>
      <option value="cinematic">Cinematic</option>
      <option value="showcase">Showcase</option>
      <option value="editorial">Editorial</option>
      <option value="sparse">Single-Product Hero</option>
    </select>
  </div>
  <div class="grid-2">
    <div class="field"><label for="currency">Currency</label><input type="text" id="currency" value="$" maxlength="3" onchange="debounceConfig('currency',this.value)"></div>
    <div class="field"><label for="fontSize">Text Size</label><select id="fontSize" onchange="sendConfig('fontSize',this.value)"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></div>
  </div>
  <div class="toggle-row"><span id="lbl-showStrain">Show Strain Type</span><button type="button" class="switch" id="showStrain" role="switch" aria-checked="false" aria-labelledby="lbl-showStrain" onclick="toggleSwitch(this,'showStrain')"></button></div>
  <div class="toggle-row"><span id="lbl-showBrandWeight">Show Brand & Weight</span><button type="button" class="switch" id="showBrandWeight" role="switch" aria-checked="false" aria-labelledby="lbl-showBrandWeight" onclick="toggleSwitch(this);updateBrandWeight()"></button></div>
  <div class="toggle-row"><span id="lbl-showImages">Show Product Images</span><button type="button" class="switch" id="showImages" role="switch" aria-checked="false" aria-labelledby="lbl-showImages" onclick="toggleSwitch(this,'showImages')"></button></div>
  <div class="toggle-row"><span id="lbl-showPromos">Show Sale Badges</span><button type="button" class="switch" id="showPromos" role="switch" aria-checked="false" aria-labelledby="lbl-showPromos" onclick="toggleSwitch(this,'showPromos')"></button></div>
  <div class="toggle-row"><span id="lbl-autoScroll">Auto-Scroll Menu</span><button type="button" class="switch" id="autoScroll" role="switch" aria-checked="false" aria-labelledby="lbl-autoScroll" onclick="toggleSwitch(this,'autoScroll');document.getElementById('scrollSpeedField').style.display=this.classList.contains('on')?'block':'none';showToast(this.classList.contains('on')?'Auto-scroll on':'Auto-scroll off')"></button></div>
  <div class="field" id="scrollSpeedField" style="display:none;"><label for="autoScrollSpeed">Scroll Speed</label><input type="range" id="autoScrollSpeed" min="10" max="150" value="50" oninput="debounceConfig('autoScrollSpeed',parseInt(this.value))" style="width:100%;"></div>
  <div class="field"><label for="customFont">Custom Font Style</label><input type="text" id="customFont" placeholder="e.g. bold serif, condensed, mono" oninput="debounceConfig('customFont',this.value)"><div class="helper">Supports style cues like bold serif, mono, slab serif, or condensed.</div></div>
</div>
<div class="card">
  <h2 class="card-title">Template Intelligence</h2>
  <div class="field">
    <label for="referenceStyleUrl">Reference URL</label>
    <input type="url" id="referenceStyleUrl" placeholder="https://competitor.com/menu-board or template gallery">
    <div class="helper">Use a public competitor/template URL as context. DubMenu analyzes the wording only; it does not copy assets or HTML.</div>
  </div>
  <div class="field">
    <label for="referenceStyleNotes">Reference Notes</label>
    <textarea id="referenceStyleNotes" rows="3" placeholder="Example: dense green TV price board, daily deals rail, no photos, four displays"></textarea>
  </div>
  <button class="btn btn-primary" type="button" style="width:100%;" onclick="applyReferenceStyle()">Analyze & Apply Style</button>
  <div id="referenceStyleResult" class="helper" style="margin-top:0.75rem;">No reference style applied yet.</div>
</div>
</section>

<section class="control-section" id="section-promos" aria-labelledby="sectionPromosTitle">
  <div class="section-head"><button class="section-back" type="button" onclick="closeControlSection()" aria-label="Back to controls">‹</button><div><div class="section-kicker">Merchandising</div><h2 id="sectionPromosTitle">Promos and specials</h2></div></div>
<div class="card">
  <h2 class="card-title">Promo Banner (Always On)</h2>
  <div class="field"><label for="promoBannerText" class="sr-only">Promo banner text</label><input type="text" id="promoBannerText" placeholder="Today's special..." oninput="updatePromoBanner()"></div>
  <div class="grid-2">
    <div class="field"><label for="promoBannerBg">Banner Color</label><input type="color" id="promoBannerBg" value="#10b981" onchange="updatePromoBanner()"></div>
    <div class="field"><label for="promoBannerTextColor">Text Color</label><input type="color" id="promoBannerTextColor" value="#000000" onchange="updatePromoBanner()"></div>
  </div>
  <div class="toggle-row"><span id="lbl-promoBannerActive">Banner Active</span><button type="button" class="switch" id="promoBannerActive" role="switch" aria-checked="false" aria-labelledby="lbl-promoBannerActive" onclick="toggleSwitch(this);updatePromoBanner()"></button></div>
</div>

<div class="card">
  <h2 class="card-title">Scheduled Banners (Time-Based)</h2>
  <div id="scheduledBannersList"></div>
  <button class="btn btn-secondary btn-sm" type="button" style="margin-top:0.5rem;" onclick="addScheduledBanner()">+ Add Scheduled Banner</button>
  <div style="font-size:0.75rem;color:var(--muted);margin-top:0.5rem;">Banners show automatically during their time window. First match wins. Overrides the always-on banner above when active.</div>
</div>

<div class="card">
  <div class="card-title-row"><h2 class="card-title">Specials Section</h2><button class="text-action" type="button" onclick="ensureSpecialsOpen(event)">Open / Add</button></div>
  <div id="specialsList"></div>
  <button class="btn btn-secondary btn-sm" type="button" style="margin-top:0.5rem;" onclick="addSpecial()">+ Add Special</button>
  <div style="font-size:0.75rem;color:var(--muted);margin-top:0.5rem;">These display as a dedicated TV category before products. Use them for brand promos, BOGO offers, staff picks, and non-product discounts.</div>
</div>
</section>

<section class="control-section" id="section-legal" aria-labelledby="sectionLegalTitle">
  <div class="section-head"><button class="section-back" type="button" onclick="closeControlSection()" aria-label="Back to controls">‹</button><div><div class="section-kicker">Required text</div><h2 id="sectionLegalTitle">Compliance</h2></div></div>
<div class="card">
  <h2 class="card-title">Compliance</h2>
  <div class="field"><label for="disclaimer">Disclaimer Text</label><textarea id="disclaimer" placeholder="Must be 21+ with valid ID." rows="2" oninput="debounceConfig('disclaimer',this.value)"></textarea></div>
</div>
</section>

<section class="control-section" id="section-inventory" aria-labelledby="sectionInventoryTitle">
  <div class="section-head"><button class="section-back" type="button" onclick="closeControlSection()" aria-label="Back to controls">‹</button><div><div class="section-kicker">Menu data</div><h2 id="sectionInventoryTitle">Products</h2></div></div>
<div class="card">
  <h2 class="card-title">Products</h2>
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
    <button class="btn btn-sm btn-danger" type="button" onclick="clearMenu()">Clear menu</button>
    <button class="btn btn-sm btn-secondary" type="button" onclick="resetToStarter()">Reset to starter template</button>
  </div>
  <div class="search-bar"><label for="searchInput" class="sr-only">Search products</label><input type="text" id="searchInput" placeholder="Search products..." oninput="filterProducts()"></div>
  <div class="field"><div style="display:flex;gap:0.5rem;"><label for="newCategoryName" class="sr-only">New category name</label><input type="text" id="newCategoryName" placeholder="New category name" style="flex:1;background:var(--surface2);border:none;border-radius:0.5rem;padding:0.75rem;color:var(--text);font-size:1rem;outline:none;" onkeydown="if(event.key==='Enter')addCategory()"><button class="btn btn-primary btn-sm" type="button" onclick="addCategory()">+ Add</button></div></div>
  <div id="categoryList"></div>
</div>
</section>

</main>

</div><!-- /config-column -->

<aside id="simulatorPanel" aria-label="TV preview">
  <div class="sim-header">
    <h2>TV Preview</h2>
  </div>
  <div class="sim-controls">
    <div class="sim-field">
      <label for="simDisplayCount">Displays</label>
      <div class="sim-segmented" id="simDisplayCount" role="radiogroup" aria-label="Number of displays"></div>
    </div>
    <div class="sim-field sim-field-grow">
      <label>Preview Display</label>
      <div class="sim-tabs" id="simDisplayTabs" role="tablist" aria-label="Select display to preview"></div>
    </div>
  </div>
  <div class="sim-controls">
    <div class="sim-field">
      <label for="simThemeOverride">Color Override</label>
      <select id="simThemeOverride" onchange="updateSimulator()">
        <option value="">Match config</option>
        <option value="default">Classic Dark</option>
        <option value="light">Clean Light</option>
        <option value="neon">Bold Neon</option>
        <option value="minimal">Minimal</option>
        <option value="sunset">Sunset</option>
        <option value="forest">Forest</option>
        <option value="royal">Royal</option>
        <option value="gold">Gold Rush</option>
        <option value="ocean">Ocean</option>
        <option value="crimson">Crimson</option>
        <option value="bone">Bone</option>
        <option value="vapor">Vapor</option>
      </select>
    </div>
    <div class="sim-field">
      <label for="simLayoutOverride">Layout Override</label>
      <select id="simLayoutOverride" onchange="updateSimulator()">
        <option value="">Match config</option>
        <option value="grid">Grid</option>
        <option value="list">Price List</option>
        <option value="pricewall">Dense Price Wall</option>
        <option value="poster">Poster</option>
        <option value="cinematic">Cinematic</option>
        <option value="showcase">Showcase</option>
        <option value="editorial">Editorial</option>
        <option value="sparse">Single-Product Hero</option>
      </select>
    </div>
    <div class="sim-field">
      <label for="simViewMode">View</label>
      <div class="sim-segmented" id="simViewMode" role="radiogroup" aria-label="Simulator view mode">
        <button type="button" data-mode="single" onclick="setSimViewMode('single')">Single</button>
        <button type="button" data-mode="compact" onclick="setSimViewMode('compact')">All</button>
      </div>
    </div>
  </div>
  <div class="sim-preview" id="simPreview"></div>
  <div class="sim-footer">
    <span id="simStatus">Previewing display 1 of 1</span>
    <div style="display:flex;gap:0.5rem;">
      <button class="btn btn-sm btn-secondary" type="button" onclick="exportData()">Export Settings</button>
      <button class="btn btn-sm btn-secondary" type="button" onclick="document.getElementById('importInput').click()">Import Settings</button>
      <button class="btn btn-sm btn-secondary" type="button" onclick="rotateSimDisplay()">Next Display</button>
      <button class="btn btn-sm btn-primary" type="button" onclick="sendToConnectedTv()">Send to Connected TV</button>
    </div>
  </div>
</aside>

</div><!-- /desktop-layout -->

<div class="modal-overlay" id="imageLibraryModal" role="dialog" aria-modal="true" aria-labelledby="imageLibraryTitle">
  <div class="modal-panel" id="imageLibraryPanel">
    <div class="modal-header">
      <h2 class="modal-title" id="imageLibraryTitle">Image Library</h2>
      <button class="modal-close" type="button" id="imageLibraryClose" aria-label="Close image library">&times;<span class="sr-only">Close</span></button>
    </div>
    <div class="modal-body" id="imageLibraryBody">
      <div class="lib-toolbar">
        <button class="btn btn-primary btn-sm" type="button" id="imageLibraryUpload">Upload New</button>
        <input type="file" id="imageLibraryUploadInput" accept="image/*" style="display:none;">
      </div>
      <div id="imageLibraryGrid"></div>
    </div>
  </div>
</div>

<div class="modal-overlay" id="mobilePreviewModal" role="dialog" aria-modal="true" aria-labelledby="mobilePreviewTitle">
  <div class="modal-panel mobile-preview-panel">
    <div class="modal-header">
      <h2 class="modal-title" id="mobilePreviewTitle">TV Preview</h2>
      <button class="modal-close" type="button" id="mobilePreviewClose" aria-label="Close TV preview">&times;<span class="sr-only">Close</span></button>
    </div>
    <div class="modal-body mobile-preview-body">
      <div class="mobile-preview-modal-frame" id="mobilePreviewModalFrame" role="img" aria-label="Live TV preview">
        <div class="mobile-preview-placeholder">Loading preview...</div>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast" role="alert" aria-live="assertive"></div>

<script>
const SESSION_ID="${sessionId}";
const ORIGIN="${origin}";
const STARTER_CONFIG=${STARTER_CONFIG};
let ws=null,config=null,reconnectTimer=null,reconnectAttempts=0,debounceTimer=null;

function connect(){
  const proto=location.protocol==='https:'?'wss:':'ws:';
  ws=new WebSocket(proto+'//'+location.host+'/ws/'+SESSION_ID+'?role=phone');
  ws.onopen=function(){reconnectAttempts=0;setStatus('connecting');ws.send(JSON.stringify({type:'join',payload:{role:'phone'}}));};
  ws.onmessage=function(ev){const m=JSON.parse(ev.data);if(m.type==='ping'){ws.send(JSON.stringify({type:'pong'}));return;}if(m.type==='config'){config=m.payload;setStatus('connected');render();return;}if(m.type==='error'){showToast(m.payload||'Update failed');return;}};
  ws.onclose=function(){setStatus('disconnected');if(reconnectAttempts<10){reconnectAttempts++;reconnectTimer=setTimeout(connect,2000*reconnectAttempts);}};
  ws.onerror=function(){ws.close();};
}
function setStatus(s){
  document.getElementById('statusDot').className='status-dot status-'+s;
  document.getElementById('statusText').textContent=s==='connected'?'Connected':s==='disconnected'?'Disconnected':'Connecting...';
}
function canSend(){return !!(ws&&ws.readyState===WebSocket.OPEN);}
function send(t,p){if(canSend())ws.send(JSON.stringify({type:t,payload:p}));}
function sendConfig(k,v){const u={};u[k]=v;send('config_update',u);}
function debounceConfig(k,v){clearTimeout(debounceTimer);debounceTimer=setTimeout(function(){sendConfig(k,v);},400);}
function toggleSwitch(el,key){el.classList.toggle('on');var on=el.classList.contains('on');el.setAttribute('aria-checked',on?'true':'false');if(key)sendConfig(key,on);}
function setSwitch(id,on){var el=document.getElementById(id);if(el){el.classList.toggle('on',on);el.setAttribute('aria-checked',on?'true':'false');}}
function getSwitch(id){var el=document.getElementById(id);return el?el.classList.contains('on'):false;}
function openControlSection(id){
  var target=document.getElementById('section-'+id);
  if(!target)return;
  document.querySelectorAll('.control-section.open').forEach(function(el){el.classList.remove('open');});
  target.classList.add('open');
  document.body.classList.add('section-open');
  document.addEventListener('keydown',controlSectionKeydown,true);
  setTimeout(function(){var back=target.querySelector('.section-back');if(back)back.focus();},0);
}
function closeControlSection(){
  document.querySelectorAll('.control-section.open').forEach(function(el){el.classList.remove('open');});
  document.body.classList.remove('section-open');
  document.removeEventListener('keydown',controlSectionKeydown,true);
}
function controlSectionKeydown(e){
  if(e.key==='Escape'&&document.body.classList.contains('section-open')){e.preventDefault();closeControlSection();}
}

function selectTemplate(t){
  document.querySelectorAll('#templateSelect .theme-option').forEach(function(el){
    var sel=el.dataset.template===t;
    el.classList.toggle('selected',sel);
    el.setAttribute('aria-checked',sel?'true':'false');
    el.setAttribute('tabindex',sel?'0':'-1');
  });
  sendConfig('template',t);
}
// Upgrade theme options to keyboard-operable radio buttons. Each gets
// role="radio", roving tabindex, and Enter/Space/Arrow handlers so the
// radiogroup is fully keyboard accessible (WCAG 2.1 SC 2.1.1, 2.4.3).
function initThemeRadios(){
  var opts=Array.prototype.slice.call(document.querySelectorAll('#templateSelect .theme-option'));
  opts.forEach(function(el,i){
    el.setAttribute('role','radio');
    if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');
    if(!el.hasAttribute('aria-checked'))el.setAttribute('aria-checked','false');
    el.addEventListener('keydown',function(e){
      var k=e.key;
      if(k==='Enter'||k===' '){e.preventDefault();selectTemplate(el.dataset.template);return;}
      var cur=opts.indexOf(document.querySelector('#templateSelect .theme-option[tabindex="0"]'));
      if(cur===-1)cur=i;
      var next=-1;
      if(k==='ArrowRight'||k==='ArrowDown')next=(cur+1)%opts.length;
      else if(k==='ArrowLeft'||k==='ArrowUp')next=(cur-1+opts.length)%opts.length;
      if(next>=0){e.preventDefault();selectTemplate(opts[next].dataset.template);opts[next].focus();}
    });
  });
}

function updatePromoBanner(){
  sendConfig('promoBanner',{
    text:document.getElementById('promoBannerText').value,
    active:document.getElementById('promoBannerActive').classList.contains('on'),
    bgColor:document.getElementById('promoBannerBg').value,
    textColor:document.getElementById('promoBannerTextColor').value
  });
}
function hourLabel(h){
  var period=h>=12?'PM':'AM';
  var hr=h%12;if(hr===0)hr=12;
  return hr+' '+period;
}
function renderScheduledBanners(){
  var list=document.getElementById('scheduledBannersList');
  if(!list)return;
  var banners=config.scheduledBanners||[];
  if(!banners.length){list.innerHTML='<div style="color:var(--muted);padding:0.5rem;font-size:0.875rem;">No scheduled banners. Add one to show promos at specific times.</div>';return;}
  var html='';
  banners.forEach(function(b,idx){
    var opts='';for(var h=0;h<24;h++){opts+='<option value="'+h+'"'+(b.startHour===h?' selected':'')+'>'+hourLabel(h)+'</option>';}
    var opts2='';for(var h2=1;h2<=24;h2++){var val=h2===24?23:h2;opts2+='<option value="'+val+'"'+(b.endHour===val?' selected':'')+'>'+hourLabel(val)+'</option>';}
    html+='<div data-banner-idx="'+idx+'" style="background:var(--surface);border-radius:0.5rem;padding:0.75rem;margin-bottom:0.5rem;">';
    html+='<input type="text" class="sb-text" aria-label="Banner text" value="'+escapeHtml(b.text||'')+'" placeholder="Happy Hour - 20% off all flower!" style="background:var(--surface2);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);width:100%;margin-bottom:0.5rem;font-size:0.9rem;">';
    html+='<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">';
    html+='<select class="sb-start" aria-label="Start time" style="background:var(--surface2);border:none;border-radius:0.375rem;padding:0.4rem;color:var(--text);font-size:0.8rem;">'+opts+'</select>';
    html+='<span style="color:var(--muted);font-size:0.8rem;" aria-hidden="true">to</span>';
    html+='<select class="sb-end" aria-label="End time" style="background:var(--surface2);border:none;border-radius:0.375rem;padding:0.4rem;color:var(--text);font-size:0.8rem;">'+opts2+'</select>';
    html+='<input type="color" class="sb-bg" aria-label="Background color" value="'+escapeHtml(b.bgColor||'#10b981')+'" style="width:32px;height:32px;border:none;border-radius:0.25rem;background:none;cursor:pointer;">';
    html+='<input type="color" class="sb-text-color" aria-label="Text color" value="'+escapeHtml(b.textColor||'#000000')+'" style="width:32px;height:32px;border:none;border-radius:0.25rem;background:none;cursor:pointer;">';
    html+='<button type="button" class="switch sb-active'+(b.active?' on':'')+'" role="switch" aria-checked="'+(b.active?'true':'false')+'" aria-label="Banner active"></button>';
    html+='<button type="button" class="btn btn-danger btn-sm sb-remove">Remove</button>';
    html+='</div></div>';
  });
  list.innerHTML=html;
  list.querySelectorAll('[data-banner-idx]').forEach(function(row){
    var i=parseInt(row.dataset.bannerIdx);
    row.querySelector('.sb-text').addEventListener('input',function(){updateScheduledBanner(i,'text',this.value);});
    row.querySelector('.sb-start').addEventListener('change',function(){updateScheduledBanner(i,'startHour',parseInt(this.value));});
    row.querySelector('.sb-end').addEventListener('change',function(){updateScheduledBanner(i,'endHour',parseInt(this.value));});
    row.querySelector('.sb-bg').addEventListener('change',function(){updateScheduledBanner(i,'bgColor',this.value);});
    row.querySelector('.sb-text-color').addEventListener('change',function(){updateScheduledBanner(i,'textColor',this.value);});
    row.querySelector('.sb-active').addEventListener('click',function(){toggleSwitch(this);updateScheduledBanner(i,'active',this.classList.contains('on'));});
    row.querySelector('.sb-remove').addEventListener('click',function(){removeScheduledBanner(i);});
  });
}
function addScheduledBanner(){
  if(!config.scheduledBanners)config.scheduledBanners=[];
  config.scheduledBanners.push({id:Date.now().toString(),text:'',startHour:8,endHour:12,bgColor:'#10b981',textColor:'#000000',active:false});
  sendConfig('scheduledBanners',config.scheduledBanners);
  renderScheduledBanners();
}
function updateScheduledBanner(idx,field,value){
  if(!config.scheduledBanners||!config.scheduledBanners[idx])return;
  config.scheduledBanners[idx][field]=value;
  sendConfig('scheduledBanners',config.scheduledBanners);
}
function removeScheduledBanner(idx){
  if(!config.scheduledBanners)return;
  config.scheduledBanners.splice(idx,1);
  sendConfig('scheduledBanners',config.scheduledBanners);
  renderScheduledBanners();
}
function renderSpecials(){
  var list=document.getElementById('specialsList');
  if(!list)return;
  var specials=config.specials||[];
  if(!specials.length){list.innerHTML='<div style="color:var(--muted);padding:0.5rem;font-size:0.875rem;">No manual specials. Add one for promos like “10% off Wyld gummies” or “BOGO pre-rolls”.</div>';return;}
  var html='';
  specials.forEach(function(s,idx){
    html+='<div data-special-idx="'+idx+'" style="background:var(--surface);border-radius:0.5rem;padding:0.75rem;margin-bottom:0.5rem;">';
    html+='<input type="text" class="sp-title" aria-label="Special title" value="'+escapeHtml(s.title||'')+'" placeholder="10% off Wyld gummies" style="background:var(--surface2);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);width:100%;margin-bottom:0.5rem;font-size:0.9rem;">';
    html+='<textarea class="sp-description" aria-label="Special description" placeholder="Short promo details shown on the TV menu" rows="2" style="background:var(--surface2);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);width:100%;margin-bottom:0.5rem;font-size:0.85rem;resize:vertical;">'+escapeHtml(s.description||'')+'</textarea>';
    html+='<input type="text" class="sp-brand" aria-label="Brand or category" value="'+escapeHtml(s.brand||'')+'" placeholder="Brand/category (optional)" style="background:var(--surface2);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);width:100%;margin-bottom:0.5rem;font-size:0.85rem;">';
    html+='<input type="url" class="sp-image" aria-label="Special image URL" value="'+escapeHtml(s.image||'')+'" placeholder="Image URL (optional)" style="background:var(--surface2);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);width:100%;margin-bottom:0.5rem;font-size:0.85rem;">';
    html+='<div style="display:flex;gap:0.5rem;align-items:center;justify-content:space-between;"><span style="color:var(--muted);font-size:0.8rem;">Show on TV</span><div style="display:flex;gap:0.5rem;align-items:center;"><button type="button" class="switch sp-active'+(s.active!==false?' on':'')+'" role="switch" aria-checked="'+(s.active!==false?'true':'false')+'" aria-label="Special active"></button><button type="button" class="btn btn-danger btn-sm sp-remove">Remove</button></div></div>';
    html+='</div>';
  });
  list.innerHTML=html;
  list.querySelectorAll('[data-special-idx]').forEach(function(row){
    var i=parseInt(row.dataset.specialIdx);
    row.querySelector('.sp-title').addEventListener('input',function(){updateSpecial(i,'title',this.value);});
    row.querySelector('.sp-description').addEventListener('input',function(){updateSpecial(i,'description',this.value);});
    row.querySelector('.sp-brand').addEventListener('input',function(){updateSpecial(i,'brand',this.value);});
    row.querySelector('.sp-image').addEventListener('input',function(){updateSpecial(i,'image',this.value);});
    row.querySelector('.sp-active').addEventListener('click',function(){toggleSwitch(this);updateSpecial(i,'active',this.classList.contains('on'));});
    row.querySelector('.sp-remove').addEventListener('click',function(){removeSpecial(i);});
  });
}
function saveSpecials(){
  sendConfig('specials',config.specials||[]);
}
function ensureSpecialsOpen(ev){
  if(ev&&ev.stopPropagation)ev.stopPropagation();
  if(!config.specials||!config.specials.length){
    addSpecial();
  }
  setTimeout(function(){
    var first=document.querySelector('#specialsList .sp-title');
    if(first){first.focus();first.scrollIntoView({block:'center',behavior:'smooth'});}
  },0);
}
function addSpecial(){
  if(!config.specials)config.specials=[];
  config.specials.push({id:Date.now().toString(),title:'',description:'',brand:'',image:'',active:true});
  saveSpecials();
  renderSpecials();
}
function updateSpecial(idx,field,value){
  if(!config.specials||!config.specials[idx])return;
  config.specials[idx][field]=value;
  saveSpecials();
}
function removeSpecial(idx){
  if(!config.specials)return;
  config.specials.splice(idx,1);
  saveSpecials();
  renderSpecials();
}
function showToast(msg){var t=document.getElementById('toast');t.textContent=msg;t.className='toast show';setTimeout(function(){t.classList.remove('show');},2500);}
function escapeHtml(s){if(!s)return'';var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function menuProductCount(cfg){
  return cfg&&Array.isArray(cfg.categories)?cfg.categories.reduce(function(total,cat){return total+((cat.products||[]).length);},0):0;
}
function needsSetupWizard(){
  return !config || menuProductCount(config)===0;
}
function renderSetupWizardQuality(data){
  var box=document.getElementById('setupWizardQuality');
  if(!box)return;
  var profile=(data&&data.styleProfile)||(config&&config.styleProfile);
  if(!profile){box.classList.remove('active');box.innerHTML='';return;}
  box.className='wizard-quality active helper';
  box.innerHTML='<strong>Recommended TV setup:</strong> '+escapeHtml(profile.layout||'auto')+' / '+escapeHtml(profile.template||'default')+'. '+escapeHtml(profile.summary||'Visual profile applied.')+' No competitor assets or HTML copied.';
}
function updateSetupWizard(){
  var wizard=document.getElementById('setupWizard');
  if(!wizard)return;
  var need=needsSetupWizard();
  wizard.classList.toggle('active',need);
  document.body.classList.toggle('wizard-body-lock',need);
  var display=document.getElementById('wizardDisplayCount');
  if(display && config && typeof config.displayCount==='number' && display.dataset.userSet!=='1')display.value=String(Math.max(1,Math.min(4,config.displayCount)));
  if(!need)renderSetupWizardQuality();
}
async function runSetupWizard(){
  var src=document.getElementById('wizardMenuUrl');
  var notes=document.getElementById('wizardStyleNotes');
  var displays=document.getElementById('wizardDisplayCount');
  var btn=document.getElementById('setupWizardBtn');
  var status=document.getElementById('setupWizardStatus');
  var url=(src&&src.value||'').trim();
  if(!url){if(status){status.textContent='Paste a Dutchie link, store slug, or store website first.';status.className='wizard-status err';}if(src)src.focus();return;}
  var target=document.getElementById('dutchieUrl');
  var targetNotes=document.getElementById('dutchieStyleNotes');
  var targetDisplays=document.getElementById('dutchieDisplayCount');
  if(target)target.value=url;
  if(targetNotes)targetNotes.value=(notes&&notes.value||'').trim();
  if(targetDisplays&&displays)targetDisplays.value=displays.value;
  if(btn){btn.disabled=true;btn.textContent='Building TV Menu...';}
  if(status){status.textContent='Importing menu data and choosing a TV-safe layout...';status.className='wizard-status';}
  var ok=await importDutchie();
  if(status){
    var normal=document.getElementById('dutchieStatus');
    status.textContent=ok?'TV menu built. The full controls are now unlocked.':(normal&&normal.textContent||'Import failed.');
    status.className='wizard-status '+(ok?'ok':'err');
  }
  if(btn){btn.disabled=false;btn.textContent='Build My TV Menu';}
}

function resetDutchieImportUi(){
  var progress=document.getElementById('dutchieProgress');
  var fill=document.getElementById('dutchieProgressFill');
  var results=document.getElementById('dutchieResults');
  if(progress){progress.className='import-progress';progress.setAttribute('aria-hidden','true');}
  if(fill) fill.style.width='0%';
  if(results){results.className='import-results';results.innerHTML='';}
  document.querySelectorAll('#dutchieProgress .import-step').forEach(function(step){
    step.classList.remove('active','done');
  });
}
function setImportStatus(el,message,state,loading){
  if(!el)return;
  el.className='import-status '+(state||'');
  el.innerHTML=(loading?'<span class="import-spinner" aria-hidden="true"></span>':'')+'<span>'+escapeHtml(message||'')+'</span>';
}
function setDutchieImportStage(stage, pct){
  var progress=document.getElementById('dutchieProgress');
  var fill=document.getElementById('dutchieProgressFill');
  if(progress){progress.className='import-progress active';progress.setAttribute('aria-hidden','false');}
  if(fill) fill.style.width=String(Math.max(0,Math.min(100,pct)))+'%';
  document.querySelectorAll('#dutchieProgress .import-step').forEach(function(step){
    var n=parseInt(step.getAttribute('data-step')||'0',10);
    step.classList.toggle('done',n<stage);
    step.classList.toggle('active',n===stage);
  });
}
function imageCountFromImport(data){
  return (data.categories||[]).reduce(function(total,cat){
    return total + ((cat.products||[]).filter(function(p){return !!(p&&p.image);}).length);
  },0);
}
function renderDutchieImportResults(data){
  var results=document.getElementById('dutchieResults');
  if(!results)return;
  var count=data.productCount||((data.categories||[]).reduce(function(n,c){return n+(c.products?c.products.length:(c.count||0));},0));
  var categoryCount=data.categoryCount||((data.categories||[]).length);
  var imageCount=data.photoCount||imageCountFromImport(data);
  var warnings=(data.warnings||[]).filter(Boolean);
  var sourceLabel=data.source?String(data.source).replace(/-/g,' '):'menu source';
  var warningHtml='';
  if(data.demo){
    warningHtml+='<div class="import-warning">Live Dutchie data was unavailable, so DubMenu loaded the Simply Green demo instead of pretending the scrape succeeded.</div>';
  }
  if(warnings.length){
    warningHtml+='<div class="import-warning">'+escapeHtml(warnings[0])+'</div>';
  }
  var debug=(data.debug||[]).filter(Boolean);
  var debugHtml=debug.length?'<details class="import-debug"><summary>Import debug log</summary><ul>'+debug.map(function(line){return '<li>'+escapeHtml(line)+'</li>';}).join('')+'</ul></details>':'';
  results.innerHTML='<div class="import-result-grid">'+
    '<div class="import-result-stat"><strong>'+count+'</strong><span>products</span></div>'+
    '<div class="import-result-stat"><strong>'+categoryCount+'</strong><span>categories</span></div>'+
    '<div class="import-result-stat"><strong>'+imageCount+'</strong><span>photos</span></div>'+
    '</div><div class="helper">Source: '+escapeHtml(sourceLabel)+'. Product photos are used when imported; missing-photo products render as clean text rows, not icons.</div>'+warningHtml+debugHtml;
  results.className='import-results active';
}
async function readImportJob(statusUrl){
  var res=await fetch(statusUrl,{method:'GET',headers:{'Accept':'application/json'}});
  var data={};
  try{data=await res.json();}catch{}
  if(!res.ok||!data.success)throw new Error(data.error||'Could not read import job status.');
  return data.job;
}
async function pollImportJob(statusUrl,onUpdate){
  var started=Date.now();
  var lastSignature='';
  var lastChange=Date.now();
  while(Date.now()-started<120000){
    var job=await readImportJob(statusUrl);
    var signature=[job.status,job.stage,job.progress,job.updatedAt,job.message].join('|');
    if(signature!==lastSignature){lastSignature=signature;lastChange=Date.now();}
    onUpdate(job);
    if(job.status==='success')return job;
    if(job.status==='error')throw new Error(job.error||job.message||'Import failed');
    if(Date.now()-lastChange>60000)throw new Error('Import job stalled while scanning the website.');
    var sleep=Promise.withResolvers();setTimeout(sleep.resolve,1200);await sleep.promise;
  }
  throw new Error('Import timed out after 2 minutes. Trying the direct importer.');
}

async function runDirectMenuImport(payload,onUpdate){
  onUpdate({status:'running',stage:2,progress:35,message:'Import job stalled; running the direct website importer now.'});
  var controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},240000);
  try{
    var res=await fetch('/api/scrape-dutchie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    var data={};
    try{data=await res.json();}catch{}
    if(!res.ok||!data.success)throw new Error(data.error||'Direct import failed');
    var categories=Array.isArray(data.categories)?data.categories:[];
    var count=typeof data.productCount==='number'?data.productCount:categories.reduce(function(total,cat){return total+((cat.products||[]).length);},0);
    return {
      status:'success',
      stage:5,
      progress:100,
      message:'Imported '+count+' TV-ready products across '+categories.length+' categories.',
      productCount:count,
      categoryCount:categories.length,
      photoCount:categories.reduce(function(total,cat){return total+((cat.products||[]).filter(function(p){return !!p.image;}).length);},0),
      source:data.source||'menu source',
      categories:categories.map(function(cat){return {name:cat.name||'Untitled',count:(cat.products||[]).length};}),
      warnings:data.warnings||[],
      styleProfile:data.styleProfile,
      completedAt:new Date().toISOString()
    };
  }finally{
    clearTimeout(timer);
  }
}

function finishMenuImport(finalJob,status){
  setDutchieImportStage(5,100);
  setImportStatus(status,'Imported '+(finalJob.productCount||0)+' products across '+(finalJob.categoryCount||0)+' categories. Open the TV preview to verify the synced board.','ok',false);
  renderDutchieImportResults(finalJob);
  showToast('Menu imported');
  renderSetupWizardQuality(finalJob);
  updateSetupWizard();
}

async function importDutchie(){
  var input=document.getElementById('dutchieUrl');
  var btn=document.getElementById('dutchieImportBtn');
  var status=document.getElementById('dutchieStatus');
  // Read the value directly from the input element so iOS autofill/paste is captured.
  var rawUrl=(input && input.value || '').trim();
  if(!rawUrl){
    setImportStatus(status,'Paste a menu URL or store slug first.','err',false);
    if(input) input.focus();
    return false;
  }
  var isSlug=/^[a-zA-Z0-9_-]+$/.test(rawUrl);
  var url=rawUrl;
  if(!isSlug && !new RegExp('^https?:\\/\\/','i').test(url)){
    url='https://'+url;
  }
  if(input) input.value=url;
  var isValidUrl=false;
  try{ isValidUrl=!!new URL(url); }catch{}
  if(!isSlug && !isValidUrl){
    setImportStatus(status,'Enter a valid URL, Dutchie link, or store slug.','err',false);
    return false;
  }
  resetDutchieImportUi();
  btn.disabled=true;
  btn.textContent='Import running...';
  setImportStatus(status,'Starting an import job. Keep this tab open; progress will update here.','',true);
  setDutchieImportStage(1,8);
  var styleNotesEl=document.getElementById('dutchieStyleNotes');
  var displayCountEl=document.getElementById('dutchieDisplayCount');
  var displayCount=parseInt(displayCountEl&&displayCountEl.value||'1',10);
  var payload={url:url,session:SESSION_ID,styleNotes:(styleNotesEl&&styleNotesEl.value||'').trim(),displayCount:Math.max(1,Math.min(4,isNaN(displayCount)?1:displayCount))};
  try{
    var startRes=await fetch('/api/import/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    var startData={};
    try{startData=await startRes.json();}catch{}
    if(!startRes.ok||!startData.success)throw new Error(startData.error||'Could not start import job');
    var finalJob=await pollImportJob(startData.statusUrl,function(job){
      setDutchieImportStage(job.stage||1,job.progress||8);
      setImportStatus(status,job.message||'Import running...','',job.status!=='success'&&job.status!=='error');
      renderDutchieImportResults(job);
    });
    finishMenuImport(finalJob,status);
    return true;
  }catch(err){
    try{
      var fallbackJob=await runDirectMenuImport(payload,function(job){
        setDutchieImportStage(job.stage||2,job.progress||35);
        setImportStatus(status,job.message||'Running direct importer...','',true);
        renderDutchieImportResults(job);
      });
      finishMenuImport(fallbackJob,status);
      return true;
    }catch(fallbackErr){
      var primaryMessage=err&&err.message?err.message:'Import failed';
      var fallbackMessage=fallbackErr&&fallbackErr.message?fallbackErr.message:'Direct import failed';
      setImportStatus(status,primaryMessage+' '+fallbackMessage,'err',false);
      setDutchieImportStage(2,100);
      showToast('Menu import failed');
      return false;
    }
  }finally{
    btn.disabled=false;
    btn.textContent='Build TV Menu';
  }
}

// Brand+Weight combined toggle
function updateBrandWeight(){
  var on=getSwitch('showBrandWeight');
  sendConfig('showBrand',on);
}

function analyzeReferenceStyle(url,notes){
  var source=((url||'')+' '+(notes||'')).toLowerCase();
  var productCount=(config&&config.categories?config.categories:[]).reduce(function(total,cat){return total+((cat.products||[]).length);},0);
  var hits=[];
  function hit(words,label){var matched=words.some(function(w){return source.indexOf(w)!==-1;});if(matched)hits.push(label);return matched;}
  var dense=hit(['dense','price wall','pricewall','price board','price list','menu board','tv menu','digital menu','table','columns','many products'],'dense');
  var images=hit(['image','photo','photos','photography','poster','video','gallery','visual','hero'],'image');
  var promos=hit(['deal','deals','special','specials','happy hour','loyalty','discount','promo','promotion','daily'],'promo');
  var single=hit(['single product','one product','hero','sparse','minimal','feature product'],'single');
  var editorial=hit(['editorial','lifestyle','premium','story','curated','cinematic','brand campaign'],'editorial');
  var noPhotos=hit(['no photo','no photos','no image','no images','text only','price only'],'no-photo');
  var layout='grid';
  if(single) layout='sparse';
  else if(dense||productCount>=36) layout='pricewall';
  else if(productCount>0&&productCount<=4) layout='sparse';
  else if(editorial) layout='editorial';
  else if(images&&promos) layout='cinematic';
  else if(images) layout='poster';
  else if(promos) layout='poster';
  var template='default';
  if(hit(['green','forest','leaf','cannabis','emerald'],'forest-color')) template='forest';
  else if(hit(['gold','luxury','premium','black and gold'],'gold-color')) template='gold';
  else if(hit(['blue','ocean','aqua'],'ocean-color')) template='ocean';
  else if(hit(['red','crimson'],'red-color')) template='crimson';
  else if(hit(['purple','vapor','pink'],'vapor-color')) template='vapor';
  else if(hit(['white','clean','light','minimal white'],'light-color')) template='bone';
  else if(hit(['neon','glow','cyber'],'neon-color')) template='neon';
  var showImages=!noPhotos&&(images||layout==='poster'||layout==='cinematic'||layout==='editorial'||layout==='showcase');
  var showDescription=layout==='editorial'||(editorial&&showImages);
  var fontSize=dense?'medium':(single?'large':'medium');
  var displayCount=config&&typeof config.displayCount==='number'?config.displayCount:1;
  if(/\\b(4|four)\\b[^.]{0,24}\\b(display|screen|tv|monitor)s?\\b/.test(source)||/\\b(display|screen|tv|monitor)s?\\b[^.]{0,24}\\b(4|four)\\b/.test(source))displayCount=4;
  else if(/\\b(3|three)\\b[^.]{0,24}\\b(display|screen|tv|monitor)s?\\b/.test(source)||/\\b(display|screen|tv|monitor)s?\\b[^.]{0,24}\\b(3|three)\\b/.test(source))displayCount=3;
  else if(/\\b(2|two)\\b[^.]{0,24}\\b(display|screen|tv|monitor)s?\\b/.test(source)||/\\b(display|screen|tv|monitor)s?\\b[^.]{0,24}\\b(2|two)\\b/.test(source))displayCount=2;
  var confidence=Math.min(0.95,Math.max(0.45,0.45+(hits.length*0.06)+(productCount>=36?0.1:0)));
  var summary='Applied '+layout+' / '+template+' from '+(hits.length?hits.slice(0,5).join(', '):'general menu-board cues')+'.';
  return {
    layout:layout,
    template:template,
    layoutMode:'auto',
    fontSize:fontSize,
    showImages:showImages,
    showDescription:showDescription,
    showPromos:promos||layout==='pricewall',
    showBrand:true,
    showStrain:true,
    displayCount:displayCount,
    styleProfile:{
      sourceUrl:(url||'').trim().slice(0,300)||undefined,
      notes:(notes||'').trim().slice(0,500)||undefined,
      intent:layout==='pricewall'?'dense-menu-board':layout==='sparse'?'single-hero':layout==='editorial'?'editorial-board':showImages?'image-led':'promo-board',
      layout:layout,
      template:template,
      fontSize:fontSize,
      showImages:showImages,
      showDescription:showDescription,
      showPromos:promos||layout==='pricewall',
      showBrand:true,
      showStrain:true,
      confidence:Math.round(confidence*100)/100,
      keywords:hits.slice(0,12),
      summary:summary,
      appliedAt:new Date().toISOString()
    }
  };
}

function renderStyleProfile(){
  var result=document.getElementById('referenceStyleResult');
  if(!result)return;
  var profile=config&&config.styleProfile;
  if(!profile){result.textContent='No reference style applied yet.';return;}
  result.textContent=profile.summary+' Confidence '+Math.round((profile.confidence||0)*100)+'%. No competitor assets or HTML copied.';
  var url=document.getElementById('referenceStyleUrl');
  var notes=document.getElementById('referenceStyleNotes');
  if(url&&!url.value&&profile.sourceUrl)url.value=profile.sourceUrl;
  if(notes&&!notes.value&&profile.notes)notes.value=profile.notes;
}

async function applyReferenceStyle(){
  var urlEl=document.getElementById('referenceStyleUrl');
  var notesEl=document.getElementById('referenceStyleNotes');
  var url=(urlEl&&urlEl.value||'').trim().slice(0,300);
  var notes=(notesEl&&notesEl.value||'').trim().slice(0,500);
  if(!url&&!notes){showToast('Add a reference URL or notes first');if(urlEl)urlEl.focus();return;}
  if(!canSend()){showToast('Reconnect before applying reference style');return;}
  var patch=analyzeReferenceStyle(url,notes);
  try{
    var productCount=(config&&config.categories?config.categories:[]).reduce(function(total,cat){return total+((cat.products||[]).length);},0);
    var res=await fetch('/api/style/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sourceUrl:url,notes:notes,productCount:productCount,currentDisplayCount:config&&config.displayCount})});
    if(res.ok)patch=await res.json();
  }catch(err){}
  send('config_update',patch);
  config=Object.assign({},config,patch);
  render();
  showToast('Reference style applied');
}

function render(){
  if(!config)return;
  syncSimulatorFromConfig();
  document.getElementById('dispensaryName').value=config.dispensaryName||'';
  document.getElementById('logoUrl').value=config.logo||'';
  document.getElementById('primaryColor').value=config.primaryColor||'#10b981';
  document.getElementById('currency').value=config.currency||'$';
  document.getElementById('fontSize').value=config.fontSize||'medium';
  renderStyleProfile();
  updateSetupWizard();
  var wizardDisplays=document.getElementById('dutchieDisplayCount');
  if(wizardDisplays && typeof config.displayCount==='number' && wizardDisplays.dataset.userSet!=='1')wizardDisplays.value=String(Math.max(1,Math.min(4,config.displayCount)));
  document.getElementById('layout').value=config.layout||'auto';
  document.getElementById('promoBannerText').value=config.promoBanner?(config.promoBanner.text||''):'';
  document.getElementById('promoBannerBg').value=config.promoBanner?(config.promoBanner.bgColor||'#10b981'):'#10b981';
  document.getElementById('promoBannerTextColor').value=config.promoBanner?(config.promoBanner.textColor||'#000000'):'#000000';
  document.getElementById('disclaimer').value=config.disclaimer||'';
  setSwitch('showStrain',config.showStrain!==false);
  setSwitch('showBrandWeight',config.showBrand!==false);
  setSwitch('showImages',config.showImages!==false);
  setSwitch('showPromos',config.showPromos!==false);
  setSwitch('autoScroll',config.autoScroll===true);
  document.getElementById('autoScrollSpeed').value=config.autoScrollSpeed||50;
  document.getElementById('scrollSpeedField').style.display=config.autoScroll===true?'block':'none';
  document.getElementById('customFont').value=(config.customFont&&config.customFont!=='system')?config.customFont:'';
  setSwitch('promoBannerActive',config.promoBanner?config.promoBanner.active===true:false);
  renderScheduledBanners();
  renderSpecials();
  document.querySelectorAll('#templateSelect .theme-option').forEach(function(el){var sel=el.dataset.template===(config.template||'default');el.classList.toggle('selected',sel);el.setAttribute('aria-checked',sel?'true':'false');el.setAttribute('tabindex',sel?'0':'-1');});
  renderCategories();
  updateScreenSet();
}

var SCREEN_LAYOUT_OPTIONS=[
  ['','Default'],
  ['grid','Grid'],
  ['list','Price List'],
  ['pricewall','Dense Price Wall'],
  ['poster','Poster'],
  ['cinematic','Cinematic'],
  ['showcase','Showcase'],
  ['editorial','Editorial'],
  ['sparse','Single-Product Hero']
];
function getScreenLayoutOverrides(){
  try{return JSON.parse(localStorage.getItem('dubmenu_screen_layouts')||'{}')||{};}catch(e){return {};}
}
function setScreenLayout(sid,value){
  var overrides=getScreenLayoutOverrides();
  if(value) overrides[sid]=value; else delete overrides[sid];
  localStorage.setItem('dubmenu_screen_layouts',JSON.stringify(overrides));
  updateScreenSet();
  updateSimulator();
}
function tvUrlForScreen(sid,index,total){
  var url=ORIGIN+'/tv/'+sid+'?display='+(index+1)+'&displays='+total;
  var layout=getScreenLayoutOverrides()[sid];
  if(layout) url+='&layout='+encodeURIComponent(layout);
  return url;
}

// Screen set: detect TVs from cookie
function updateScreenSet(){
  var screens=getCookie('dubmenu_screens');
  if(!screens)return;
  var screenIds=screens.split(',').filter(function(s){return s;});
  if(screenIds.length<=1)return;
  var info=document.getElementById('screensetInfo');
  info.classList.add('active');
  document.getElementById('screensetCount').textContent=screenIds.length;
  document.getElementById('screensetPlural').textContent=screenIds.length>1?'s':'';
  var list=document.getElementById('screensetList');
  list.innerHTML='';
  var overrides=getScreenLayoutOverrides();
  screenIds.forEach(function(sid,i){
    var url=tvUrlForScreen(sid,i,screenIds.length);
    var currentLayout=overrides[sid]||'';
    var div=document.createElement('div');
    div.className='screenset-tv';
    var num=document.createElement('div');
    num.className='screenset-tv-num';
    num.textContent=String(i+1);
    var urlEl=document.createElement('div');
    urlEl.className='screenset-tv-url';
    urlEl.textContent=url;
    var select=document.createElement('select');
    select.className='screen-layout-select';
    select.setAttribute('aria-label','Layout for display '+(i+1));
    SCREEN_LAYOUT_OPTIONS.forEach(function(opt){
      var option=document.createElement('option');
      option.value=opt[0];
      option.textContent=opt[1];
      option.selected=opt[0]===currentLayout;
      select.appendChild(option);
    });
    select.addEventListener('change',function(){setScreenLayout(sid,select.value);});
    var button=document.createElement('button');
    button.className='btn btn-sm btn-secondary';
    button.type='button';
    button.textContent='Copy';
    button.addEventListener('click',function(){navigator.clipboard.writeText(url);showToast('Copied!');});
    div.appendChild(num);
    div.appendChild(urlEl);
    div.appendChild(select);
    div.appendChild(button);
    list.appendChild(div);
  });
  sendConfig('displayCount',screenIds.length);
}

function getCookie(n){var m=document.cookie.match(new RegExp('(^| )'+n+'=([^;]+)'));return m?m[2]:null;}
function setCookie(n,v,days){var d=new Date();d.setTime(d.getTime()+(days||7)*86400000);document.cookie=n+'='+v+';expires='+d.toUTCString()+';path=/';}

function filterProducts(){renderCategories();}
function uploadProductImage(input,cid,pid){
  var file=input.files[0];
  if(!file)return;
  var urlField=document.getElementById('ep-'+cid+'-'+pid+'-image');
  var fd=new FormData();
  fd.append('file',file);
  fetch('/api/upload',{method:'POST',body:fd})
    .then(function(r){if(!r.ok)throw new Error('Upload failed');return r.json();})
    .then(function(data){
      var url=data.url;
      if(url){urlField.value=url;var aid=extractAccountId(url);if(aid)ACCOUNT_ID=aid;}
      // Auto-save the product so the uploaded image is persisted immediately.
      saveProduct(cid,pid);
      showToast('Image uploaded & saved');
    })
    .catch(function(err){showToast(err.message||'Upload failed');});
}
function uploadLogoImage(input){
  var file=input.files&&input.files[0];
  if(!file)return;
  var fd=new FormData();
  fd.append('file',file);
  fetch('/api/upload',{method:'POST',body:fd})
    .then(function(r){if(!r.ok)throw new Error('Logo upload failed');return r.json();})
    .then(function(data){
      var url=data.url;
      if(!url)throw new Error('Logo upload failed');
      var logoField=document.getElementById('logoUrl');
      logoField.value=url;
      var aid=extractAccountId(url);if(aid)ACCOUNT_ID=aid;
      sendConfig('logo',url);
      showToast('Logo uploaded & sent to TV');
      input.value='';
    })
    .catch(function(err){showToast(err.message||'Logo upload failed');});
}
function renderCategories(){
  var list=document.getElementById('categoryList');
  if(!config||!config.categories||!config.categories.length){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--muted);">No categories yet.</div>';return;}
  var search=(document.getElementById('searchInput').value||'').toLowerCase();
  var html='';
  config.categories.forEach(function(cat,catIdx){
    html+='<div class="cat-item" draggable="true" data-id="'+escapeHtml(cat.id)+'">';
    html+='<div class="cat-header">';
    html+='<span class="drag-handle" title="Drag to reorder" role="button" tabindex="0" aria-label="Reorder category '+escapeHtml(cat.name)+'. Use arrow keys to move." data-dnd="cat-handle">&#9776;</span>';
    html+='<input type="text" aria-label="Category name" value="'+escapeHtml(cat.name)+'" onchange="updateCategoryName(\\''+cat.id+'\\',this.value)">';
    html+='<div class="dnd-controls">';
    html+='<button class="move-btn" type="button" aria-label="Move category up"'+(catIdx===0?' disabled':'')+' onclick="moveCategory(\\''+cat.id+'\\',-1)"><span aria-hidden="true">&#9650;</span><span class="sr-only">Move category up</span></button>';
    html+='<button class="move-btn" type="button" aria-label="Move category down"'+(catIdx===config.categories.length-1?' disabled':'')+' onclick="moveCategory(\\''+cat.id+'\\',1)"><span aria-hidden="true">&#9660;</span><span class="sr-only">Move category down</span></button>';
    html+='</div>';
    html+='<button class="btn btn-danger btn-sm" type="button" onclick="removeCategory(\\''+cat.id+'\\')">Remove</button>';
    html+='</div>';
    html+='<div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap;"><input type="text" aria-label="New product name" placeholder="Product name" style="flex:2 1 100%;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);font-size:0.9375rem;outline:none;min-width:0;" id="np-'+cat.id+'-name"><input type="number" aria-label="New product price" placeholder="$ Price" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);font-size:0.9375rem;outline:none;min-width:0;" id="np-'+cat.id+'-price" step="0.01"><button class="btn btn-primary btn-sm" type="button" aria-label="Add product" onclick="addProduct(\\''+cat.id+'\\')">+</button></div>';
    if(!cat.products||!cat.products.length){html+='<div style="text-align:center;padding:1rem;color:var(--muted);font-size:0.875rem;">No products yet.</div>';}
    else{
      var visibleProds=cat.products.filter(function(p){return !(search&&p.name&&p.name.toLowerCase().indexOf(search)===-1);});
      visibleProds.forEach(function(p,vIdx){
        html+='<div class="prod-item" draggable="true" data-id="'+escapeHtml(p.id)+'" data-cat-id="'+escapeHtml(cat.id)+'">';
        html+='<div class="prod-top">';
        html+='<div style="display:flex;align-items:center;gap:0.25rem;min-width:0;flex:1;">';
        html+='<span class="drag-handle" title="Drag to reorder" role="button" tabindex="0" aria-label="Reorder product '+escapeHtml(p.name)+'. Use arrow keys to move." data-dnd="prod-handle">&#9776;</span>';
        html+='<span class="prod-name" style="flex:1;min-width:0;word-break:break-word;">'+escapeHtml(p.name)+'</span>';
        html+='</div>';
        html+='<div class="dnd-controls" style="margin-right:0.25rem;">';
        html+='<button class="move-btn" type="button" aria-label="Move product up"'+(vIdx===0?' disabled':'')+' onclick="moveProduct(\\''+cat.id+'\\',\\''+p.id+'\\',-1)"><span aria-hidden="true">&#9650;</span><span class="sr-only">Move product up</span></button>';
        html+='<button class="move-btn" type="button" aria-label="Move product down"'+(vIdx===visibleProds.length-1?' disabled':'')+' onclick="moveProduct(\\''+cat.id+'\\',\\''+p.id+'\\',1)"><span aria-hidden="true">&#9660;</span><span class="sr-only">Move product down</span></button>';
        html+='</div>';
        html+='<span class="prod-price">'+(config.currency||'$')+p.price+'</span>';
        html+='</div>';
        html+='<div class="prod-meta">';
        if(p.strain)html+='<span class="badge badge-'+p.strain+'">'+p.strain+'</span>';
        if(p.thc)html+='<span>THC '+escapeHtml(p.thc)+'</span>';
        if(p.cbd)html+='<span>CBD '+escapeHtml(p.cbd)+'</span>';
        if(p.priceTiers&&p.priceTiers.length)html+='<span>'+p.priceTiers.length+' tiers</span>';
        if(p.originalPrice)html+='<span class="sale-text">Sale</span>';
        if(p.inStock===false)html+='<span class="badge badge-out">Out</span>';else html+='<span class="badge badge-in">In Stock</span>';
        html+='</div>';
        html+='<button class="expand-btn" type="button" aria-expanded="false" onclick="toggleEdit(\\''+cat.id+'\\',\\''+p.id+'\\',this)">Edit</button>';
        html+='<div class="prod-edit" id="edit-'+cat.id+'-'+p.id+'">';
        html+='<div style="margin-bottom:0.5rem;min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-name" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Name</label><input type="text" value="'+escapeHtml(p.name||'')+'" id="ep-'+cat.id+'-'+p.id+'-name" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div>';
        html+='<div class="grid-2"><div style="min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-price" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Price</label><input type="number" value="'+p.price+'" step="0.01" id="ep-'+cat.id+'-'+p.id+'-price" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div>';
        html+='<div style="min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-origprice" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Orig. Price (Sale)</label><input type="number" value="'+(p.originalPrice||'')+'" step="0.01" id="ep-'+cat.id+'-'+p.id+'-origprice" placeholder="e.g. 45" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div></div>';
        html+='<div class="grid-2"><div style="min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-thc" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">THC</label><input type="text" value="'+escapeHtml(p.thc||'')+'" id="ep-'+cat.id+'-'+p.id+'-thc" placeholder="24%" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div>';
        html+='<div style="min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-cbd" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">CBD</label><input type="text" value="'+escapeHtml(p.cbd||'')+'" id="ep-'+cat.id+'-'+p.id+'-cbd" placeholder="<1%" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div></div>';
        html+='<div class="grid-2"><div style="min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-strain" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Strain Type</label><select id="ep-'+cat.id+'-'+p.id+'-strain" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;"><option value="">None</option><option value="indica"'+(p.strain==='indica'?' selected':'')+'>Indica</option><option value="sativa"'+(p.strain==='sativa'?' selected':'')+'>Sativa</option><option value="hybrid"'+(p.strain==='hybrid'?' selected':'')+'>Hybrid</option></select></div>';
        html+='<div style="min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-weight" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Weight/Size</label><input type="text" value="'+escapeHtml(p.weight||'')+'" id="ep-'+cat.id+'-'+p.id+'-weight" placeholder="3.5g" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div></div>';
        html+='<div style="margin-bottom:0.5rem;min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-brand" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Brand</label><input type="text" value="'+escapeHtml(p.brand||'')+'" id="ep-'+cat.id+'-'+p.id+'-brand" placeholder="Brand name" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;"></div>';
        /* Price Tiers — repeatable rows */
        var tiersId='tiers-'+cat.id+'-'+p.id;
        html+='<div style="margin-bottom:0.5rem;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Price Tiers</label><div id="'+tiersId+'" class="tier-rows">';
        var tiers=(p.priceTiers&&p.priceTiers.length)?p.priceTiers:[{label:'',price:''}];
        tiers.forEach(function(t,tIdx){
          html+='<div class="tier-row" style="display:flex;gap:0.5rem;margin-bottom:0.375rem;align-items:center;"><input type="text" class="tier-label" value="'+escapeHtml(t.label||'')+'" placeholder="1g" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);outline:none;min-width:0;font-size:0.875rem;"><input type="text" class="tier-price" value="'+escapeHtml(t.price||'')+'" placeholder="$12" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);outline:none;min-width:0;font-size:0.875rem;"><button type="button" class="lib-btn tier-remove" onclick="this.parentElement.remove()" style="padding:0.35rem 0.5rem;flex:0 0 auto;">&minus;</button></div>';
        });
        html+='</div><button type="button" class="lib-btn" onclick="addTierRow(\\''+tiersId+'\\')" style="margin-top:0.25rem;">+ Add Tier</button></div>';
        html+='<div style="margin-bottom:0.5rem;"><label for="ep-'+cat.id+'-'+p.id+'-image" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Image URL</label><div style="display:flex;gap:0.5rem;"><input type="url" value="'+escapeHtml(p.image||'')+'" id="ep-'+cat.id+'-'+p.id+'-image" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-image-file" class="lib-btn">Upload</label><input type="file" accept="image/*" id="ep-'+cat.id+'-'+p.id+'-image-file" onchange="uploadProductImage(this,\\''+cat.id+'\\',\\''+p.id+'\\')" style="color:var(--text);font-size:0.875rem;max-width:120px;"><button class="lib-btn" type="button" aria-label="Browse image library" onclick="openImageLibrary(\\''+cat.id+'\\',\\''+p.id+'\\')">Library</button></div><div class="helper" style="margin-top:0.35rem;">Upload or pick an image to apply it automatically.</div></div>';
        html+='<div style="margin-bottom:0.5rem;min-width:0;"><label for="ep-'+cat.id+'-'+p.id+'-desc" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Description</label><textarea id="ep-'+cat.id+'-'+p.id+'-desc" rows="2" placeholder="Optional description" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;min-width:0;font-family:inherit;resize:vertical;">'+escapeHtml(p.description||'')+'</textarea></div>';
        html+='<div style="margin-bottom:0.5rem;"><label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.25rem;">Move to category</label><select onchange="if(this.value)moveProductToCategory(\\''+cat.id+'\\',\\''+p.id+'\\',this.value)" style="background:var(--surface);border:none;border-radius:0.5rem;padding:0.625rem;color:var(--text);outline:none;width:100%;"><option value="">Select a category…</option>'+config.categories.filter(function(c){return c.id!==cat.id;}).map(function(c){return '<option value="'+c.id+'">'+escapeHtml(c.name)+'</option>';}).join('')+'</select></div>';
        html+='<div class="actions"><button class="btn btn-sm btn-primary" type="button" onclick="saveProduct(\\''+cat.id+'\\',\\''+p.id+'\\')">Save</button><button class="btn btn-sm btn-secondary" type="button" onclick="duplicateProduct(\\''+cat.id+'\\',\\''+p.id+'\\')">Duplicate</button><button class="btn btn-sm '+(p.inStock===false?'btn-primary':'btn-secondary')+'" type="button" onclick="toggleStock(\\''+cat.id+'\\',\\''+p.id+'\\')">'+(p.inStock===false?'Mark In Stock':'Mark Out of Stock')+'</button><button class="btn btn-sm btn-danger" type="button" onclick="removeProduct(\\''+cat.id+'\\',\\''+p.id+'\\')">Delete</button></div>';
        html+='</div></div>';
      });
    }
    html+='</div>';
  });
  list.innerHTML=html;
  attachDnD(list);
}
function toggleEdit(cid,pid,btn){var el=document.getElementById('edit-'+cid+'-'+pid);if(el){el.classList.toggle('open');if(btn)btn.setAttribute('aria-expanded',el.classList.contains('open')?'true':'false');}}
function addTierRow(containerId){
  var c=document.getElementById(containerId);
  if(!c)return;
  var row=document.createElement('div');
  row.className='tier-row';
  row.style.cssText='display:flex;gap:0.5rem;margin-bottom:0.375rem;align-items:center;';
  row.innerHTML='<input type="text" class="tier-label" placeholder="1g" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);outline:none;min-width:0;font-size:0.875rem;"><input type="text" class="tier-price" placeholder="$12" style="flex:1;background:var(--surface);border:none;border-radius:0.5rem;padding:0.5rem;color:var(--text);outline:none;min-width:0;font-size:0.875rem;"><button type="button" class="lib-btn tier-remove" onclick="this.parentElement.remove()" style="padding:0.35rem 0.5rem;flex:0 0 auto;">&minus;</button>';
  c.appendChild(row);
}
function addCategory(){var inp=document.getElementById('newCategoryName');var name=inp.value.trim();if(!name){inp.setAttribute('aria-invalid','true');showToast('Enter a category name');inp.focus();return;}inp.removeAttribute('aria-invalid');send('category_add',{name:name});inp.value='';}
function updateCategoryName(cid,name){send('category_update',{categoryId:cid,updates:{name:name}});}
function removeCategory(cid){send('category_remove',{categoryId:cid});}
function addProduct(cid){var nameInput=document.getElementById('np-'+cid+'-name');var name=nameInput.value.trim();var priceInput=document.getElementById('np-'+cid+'-price');var price=parseFloat(priceInput.value)||0;if(!name){nameInput.setAttribute('aria-invalid','true');showToast('Enter a product name');nameInput.focus();return;}nameInput.removeAttribute('aria-invalid');send('product_add',{categoryId:cid,product:{name:name,price:price,inStock:true}});nameInput.value='';priceInput.value='';}
function saveProduct(cid,pid){
  var updates={};
  updates.name=document.getElementById('ep-'+cid+'-'+pid+'-name').value;
  updates.price=parseFloat(document.getElementById('ep-'+cid+'-'+pid+'-price').value)||0;
  var origEl=document.getElementById('ep-'+cid+'-'+pid+'-origprice');
  var origVal=origEl?parseFloat(origEl.value):NaN;
  updates.originalPrice=isNaN(origVal)||origVal<=0?undefined:origVal;
  updates.thc=document.getElementById('ep-'+cid+'-'+pid+'-thc').value;
  updates.cbd=document.getElementById('ep-'+cid+'-'+pid+'-cbd').value;
  updates.weight=document.getElementById('ep-'+cid+'-'+pid+'-weight').value;
  updates.brand=document.getElementById('ep-'+cid+'-'+pid+'-brand').value;
  updates.image=document.getElementById('ep-'+cid+'-'+pid+'-image').value;
  updates.strain=document.getElementById('ep-'+cid+'-'+pid+'-strain').value;
  var descEl=document.getElementById('ep-'+cid+'-'+pid+'-desc');
  if(descEl)updates.description=descEl.value;
  /* Collect price tiers */
  var tiersContainer=document.getElementById('tiers-'+cid+'-'+pid);
  if(tiersContainer){
    var rows=tiersContainer.querySelectorAll('.tier-row');
    var tiers=[];
    rows.forEach(function(r){
      var labelEl=r.querySelector('.tier-label');
      var priceEl=r.querySelector('.tier-price');
      var label=labelEl?labelEl.value.trim():'';
      var price=priceEl?priceEl.value.trim():'';
      if(label&&price)tiers.push({label:label,price:price});
    });
    updates.priceTiers=tiers.length?tiers:undefined;
  }
  send('product_update',{categoryId:cid,productId:pid,updates:updates});
  toggleEdit(cid,pid);
  showToast('Saved');
  try{
    fetch('/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'analytics.config.save',payload:{action:'product_update'}})});
  }catch(e){}
}
function toggleStock(cid,pid){send('product_toggle_stock',{categoryId:cid,productId:pid});}
function removeProduct(cid,pid){send('product_remove',{categoryId:cid,productId:pid});}
function moveProductToCategory(fromCatId,prodId,toCatId){send('product_move',{fromCategoryId:fromCatId,toCategoryId:toCatId,productId:prodId});}
function duplicateProduct(catId,prodId){
  var cat=config.categories.find(function(c){return c.id===catId;});
  if(!cat)return;
  var p=cat.products.find(function(x){return x.id===prodId;});
  if(!p)return;
  var copy=JSON.parse(JSON.stringify(p));
  copy.id='dup_'+Date.now();
  copy.name=p.name+' (Copy)';
  send('product_add',{categoryId:catId,product:copy});
}

// ---- Drag-and-drop reordering (native HTML5 DnD + keyboard + mobile buttons) ----
// Module-level drag state. Holds the item kind ('cat'|'prod') and the id
// being dragged while a drag is in progress. Products additionally record
// their categoryId so cross-category drops can be rejected.
var dndDrag=null; // {kind:'cat',id:string} | {kind:'prod',id:string,catId:string}

// Attach native DnD + keyboard listeners to every cat-item / prod-item.
// Called once after each renderCategories() innerHTML write. Using event
// delegation here would be simpler, but per-element listeners keep the
// handlers garbage-collected cleanly across re-renders.
function attachDnD(root){
  root.querySelectorAll('.cat-item[data-id]').forEach(function(el){bindItem(el,'cat');});
  root.querySelectorAll('.prod-item[data-id]').forEach(function(el){bindItem(el,'prod');});
}

function bindItem(el,kind){
  el.addEventListener('dragstart',function(e){
    var id=el.getAttribute('data-id');
    if(!id){if(e.preventDefault)e.preventDefault();return false;}
    dndDrag=kind==='cat'?{kind:'cat',id:id}:{kind:'prod',id:id,catId:el.getAttribute('data-cat-id')};
    el.classList.add('dragging');
    if(e.dataTransfer){
      // Firefox/Safari need data set + an allowed effect to start a drag.
      e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',id);}catch(_e){}
    }
    return true;
  });
  el.addEventListener('dragover',function(e){
    if(!dndDrag)return;
    // Only allow drops of the same kind. Products additionally must match
    // their category (cross-category dragging is intentionally disabled).
    if(dndDrag.kind!==kind)return;
    if(kind==='prod'&&dndDrag.catId!==el.getAttribute('data-cat-id'))return;
    if(e.preventDefault)e.preventDefault();
    if(e.dataTransfer)e.dataTransfer.dropEffect='move';
    return false;
  });
  el.addEventListener('dragenter',function(e){
    if(!dndDrag||dndDrag.kind!==kind)return;
    if(kind==='prod'&&dndDrag.catId!==el.getAttribute('data-cat-id'))return;
    if(el!==currentDraggedEl())el.classList.add('drag-over');
  });
  el.addEventListener('dragleave',function(){
    el.classList.remove('drag-over');
  });
  el.addEventListener('drop',function(e){
    if(!dndDrag)return;
    if(dndDrag.kind!==kind)return;
    if(kind==='prod'&&dndDrag.catId!==el.getAttribute('data-cat-id'))return;
    if(e.preventDefault)e.preventDefault();
    if(e.stopPropagation)e.stopPropagation();
    var targetId=el.getAttribute('data-id');
    handleDrop(kind,targetId);
    return false;
  });
  el.addEventListener('dragend',function(){
    el.classList.remove('dragging');
    clearDragOver();
    dndDrag=null;
  });
  // Keyboard fallback on the drag handle: ArrowUp/ArrowDown move the item
  // within its list. Satisfies WCAG 2.1 SC 2.5.7 and works on touch devices
  // where native HTML5 DnD is unsupported.
  var handle=el.querySelector('[data-dnd]');
  if(handle){
    handle.addEventListener('keydown',function(e){
      var k=e.key;
      if(k!=='ArrowUp'&&k!=='ArrowDown'&&k!=='ArrowLeft'&&k!=='ArrowRight')return;
      e.preventDefault();
      var dir=(k==='ArrowDown'||k==='ArrowRight')?1:-1;
      if(kind==='cat')moveCategory(el.getAttribute('data-id'),dir);
      else moveProduct(el.getAttribute('data-cat-id'),el.getAttribute('data-id'),dir);
    });
  }
}

function currentDraggedEl(){
  if(!dndDrag)return null;
  var sel=dndDrag.kind==='cat'?'.cat-item[data-id="'+cssEscape(dndDrag.id)+'"]':'.prod-item[data-id="'+cssEscape(dndDrag.id)+'"]';
  return document.querySelector(sel);
}
function cssEscape(s){return String(s).split('"').join('\\\\"').split('\\\\').join('\\\\\\\\');}

function clearDragOver(){
  document.querySelectorAll('.drag-over').forEach(function(el){el.classList.remove('drag-over');});
}

// Compute the new id order for the dragged kind, with the dragged item
// inserted at the target's position, then send + apply optimistically.
function handleDrop(kind,targetId){
  if(!dndDrag)return;
  var draggedId=dndDrag.id;
  if(kind==='cat'){
    var catIds=readIds('.cat-item[data-id]');
    catIds=moveId(catIds,draggedId,targetId);
    applyReorderCategories(catIds);
    send('reorder',{type:'categories',ids:catIds});
    return;
  }
  // kind==='prod'
  var catId=dndDrag.catId;
  var prodIds=readIds('.prod-item[data-cat-id="'+cssEscape(catId)+'"][data-id]');
  prodIds=moveId(prodIds,draggedId,targetId);
  applyReorderProducts(catId,prodIds);
  send('reorder',{type:'products',categoryId:catId,ids:prodIds});
}

// Read data-id values off all elements matching a selector, in DOM order.
function readIds(selector){
  var ids=[];
  document.querySelectorAll(selector).forEach(function(el){
    var id=el.getAttribute('data-id');
    if(id)ids.push(id);
  });
  return ids;
}

// Reorder an id array so 'fromId' moves to where 'toId' is.
function moveId(ids,fromId,toId){
  if(fromId===toId)return ids.slice();
  var fromIdx=ids.indexOf(fromId);
  var toIdx=ids.indexOf(toId);
  if(fromIdx===-1||toIdx===-1)return ids.slice();
  var out=ids.slice();
  out.splice(fromIdx,1);
  // Recompute target index after removal (it may have shifted).
  toIdx=out.indexOf(toId);
  out.splice(toIdx,0,fromId);
  return out;
}

// Move button handlers (also used by keyboard). dir is -1 (up) or +1 (down).
function moveCategory(cid,dir){
  if(!config||!config.categories)return;
  var ids=config.categories.map(function(c){return c.id;});
  var idx=ids.indexOf(cid);
  if(idx===-1)return;
  var to=idx+dir;
  if(to<0||to>=ids.length)return;
  var tmp=ids[idx];ids[idx]=ids[to];ids[to]=tmp;
  applyReorderCategories(ids);
  send('reorder',{type:'categories',ids:ids});
  renderCategories();
}
function moveProduct(catId,pid,dir){
  if(!config||!config.categories)return;
  var cat=config.categories.find(function(c){return c.id===catId;});
  if(!cat||!cat.products)return;
  var ids=cat.products.map(function(p){return p.id;});
  var idx=ids.indexOf(pid);
  if(idx===-1)return;
  var to=idx+dir;
  if(to<0||to>=ids.length)return;
  var tmp=ids[idx];ids[idx]=ids[to];ids[to]=tmp;
  applyReorderProducts(catId,ids);
  send('reorder',{type:'products',categoryId:catId,ids:ids});
  renderCategories();
}

// Optimistically reorder the local menuData so the UI feels instant. The WS
// broadcast will confirm/correct on the next render cycle.
function applyReorderCategories(ids){
  if(!config||!config.categories)return;
  var byId={};
  config.categories.forEach(function(c){byId[c.id]=c;});
  var reordered=ids.map(function(id){return byId[id];}).filter(Boolean);
  if(reordered.length===config.categories.length)config.categories=reordered;
}
function applyReorderProducts(catId,ids){
  if(!config||!config.categories)return;
  var cat=config.categories.find(function(c){return c.id===catId;});
  if(!cat||!cat.products)return;
  var byId={};
  cat.products.forEach(function(p){byId[p.id]=p;});
  var reordered=ids.map(function(id){return byId[id];}).filter(Boolean);
  if(reordered.length===cat.products.length)cat.products=reordered;
}

function exportData(){if(!config)return;var blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dubmenu-config.json';a.click();showToast('Exported');}
function importData(ev){var f=ev.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){try{var d=JSON.parse(e.target.result);if(!d.dispensaryName||!d.categories){showToast('Invalid file');return;}send('config_replace',d);showToast('Imported');}catch(err){showToast('Parse error');}};r.readAsText(f);ev.target.value='';}
function clearMenu(){if(!config)return;if(!confirm('Clear your entire menu? This removes all categories and products and cannot be undone.'))return;send('config_replace',{categories:[]});showToast('Menu cleared');}
function resetToStarter(){if(!config)return;if(!confirm('Reset your menu to the starter template? This replaces all categories and products with the demo menu.'))return;send('config_replace',STARTER_CONFIG);showToast('Starter template restored');}


// ---- Image Library ----
// accountId is resolved in three ways (first wins): (1) from the
// /api/uploads GET response field "accountId" (set by loadLibrary), (2) from
// the POST /api/upload response URL (set by uploadProductImage /
// handleLibraryUpload), or (3) derived from any existing upload URL in the
// config via resolveAccountId(). All uploads follow
// /api/uploads/<accountId>/<file>. DELETE targets /api/uploads/<filename>
// (the route accepts a bare filename scoped to the authed account), so
// delete never needs accountId.
var ACCOUNT_ID=null;
var libState={uploads:[],cursor:null,loading:false,pickerTarget:null,lastFocus:null,nextZ:500};

function resolveAccountId(){
  if(ACCOUNT_ID)return ACCOUNT_ID;
  if(!config)return null;
  var found=null;
  if(config.logo&&config.logo.indexOf('/api/uploads/')!==-1){
    found=config.logo;
  }else if(config.categories){
    outer:for(var i=0;i<config.categories.length;i++){
      var c=config.categories[i];
      if(!c.products)continue;
      for(var j=0;j<c.products.length;j++){
        var img=c.products[j].image;
        if(img&&img.indexOf('/api/uploads/')!==-1){found=img;break outer;}
      }
    }
  }
  if(found){var aid=extractAccountId(found);if(aid){ACCOUNT_ID=aid;return ACCOUNT_ID;}}
  return null;
}
function extractAccountId(url){
  if(!url)return null;
  var marker='/api/uploads/';
  var i=url.indexOf(marker);
  if(i===-1)return null;
  var rest=url.slice(i+marker.length);
  var slash=rest.indexOf('/');
  if(slash<=0)return null;
  return rest.slice(0,slash);
}
function uploadUrlFor(filename){
  var aid=resolveAccountId();
  if(!aid)return null;
  return '/api/uploads/'+aid+'/'+filename;
}
function formatSize(bytes){
  if(!bytes)return '0 KB';
  if(bytes>=1048576)return (bytes/1048576).toFixed(1)+' MB';
  return Math.max(1,Math.round(bytes/1024))+' KB';
}
function timeAgo(date){
  var t=date instanceof Date?date.getTime():new Date(date).getTime();
  if(isNaN(t))return '';
  var diff=Date.now()-t;
  if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+'m ago';
  if(diff<86400000)return Math.floor(diff/3600000)+'h ago';
  if(diff<604800000)return Math.floor(diff/86400000)+'d ago';
  return new Date(t).toLocaleDateString();
}
function openImageLibrary(targetCid,targetPid){
  libState.pickerTarget=targetCid&&targetPid?{cid:targetCid,pid:targetPid}:null;
  libState.lastFocus=document.activeElement;
  var modal=document.getElementById('imageLibraryModal');
  modal.classList.add('open');
  modal.style.zIndex=++libState.nextZ;
  // Focus the close button so focus enters the modal.
  setTimeout(function(){var c=document.getElementById('imageLibraryClose');if(c)c.focus();},0);
  document.addEventListener('keydown',libKeydown,true);
  resetLibrary();
  loadLibrary();
}
function closeImageLibrary(){
  var modal=document.getElementById('imageLibraryModal');
  modal.classList.remove('open');
  document.removeEventListener('keydown',libKeydown,true);
  libState.pickerTarget=null;
  if(libState.lastFocus&&libState.lastFocus.focus)libState.lastFocus.focus();
}
// Focus trap + Escape handler (captured so it runs before element handlers).
function libKeydown(e){
  var modal=document.getElementById('imageLibraryModal');
  if(!modal.classList.contains('open'))return;
  if(e.key==='Escape'){e.preventDefault();closeImageLibrary();return;}
  if(e.key==='Tab'){
    var focusable=modal.querySelectorAll('button[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])');
    if(!focusable.length)return;
    var first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
}
function resetLibrary(){
  libState.uploads=[];libState.cursor=null;libState.loading=false;
  document.getElementById('imageLibraryGrid').innerHTML='';
}
function libThumbError(img){
  var d=document.createElement('div');
  d.className='lib-thumb-fallback';
  d.textContent='Image unavailable';
  if(img&&img.parentNode)img.parentNode.replaceChild(d,img);
}
async function loadLibrary(){
  if(libState.loading)return;
  libState.loading=true;
  var grid=document.getElementById('imageLibraryGrid');
  // Show skeletons on first load only.
  if(!libState.uploads.length){
    var sk='';
    for(var s=0;s<6;s++)sk+='<div class="lib-skeleton"></div>';
    grid.innerHTML=sk;
  }
  try{
    var url='/api/uploads?limit=50'+(libState.cursor?'&cursor='+encodeURIComponent(libState.cursor):'');
    var res=await fetch(url);
    if(!res.ok)throw new Error('Failed ('+res.status+')');
    var data=await res.json();
    libState.uploads=libState.uploads.concat(data.uploads||[]);
    libState.cursor=data.nextCursor||null;
    // The server returns the authed accountId so we can resolve upload URLs
    // even when the config has no existing upload-backed image to derive it
    // from (fresh accounts). Prefer this over resolveAccountId() heuristics.
    if(data.accountId)ACCOUNT_ID=data.accountId;
    renderLibrary();
  }catch(err){
    grid.innerHTML='<div class="lib-error">'+escapeHtml(err&&err.message?err.message:'Couldn\\'t load images.')+'<br><button class="btn btn-secondary btn-sm" type="button" style="margin-top:0.75rem;" onclick="loadLibrary()">Try again</button></div>';
  }finally{
    libState.loading=false;
  }
}
function renderLibrary(){
  var grid=document.getElementById('imageLibraryGrid');
  if(!libState.uploads.length){
    grid.innerHTML='<div class="lib-empty"><p>No images yet. Upload your first image.</p><button class="btn btn-primary btn-sm" type="button" onclick="document.getElementById(\\'imageLibraryUploadInput\\').click()">Upload Image</button></div>';
    return;
  }
  var html='';
  libState.uploads.forEach(function(u,idx){
    var serve=uploadUrlFor(u.key);
    var name=escapeHtml(u.originalName||u.key);
    var meta=formatSize(u.size)+(u.uploaded?' &middot; '+escapeHtml(timeAgo(u.uploaded)):'');
    html+='<div class="lib-card" data-lib-idx="'+idx+'">';
    if(serve){
      html+='<img class="lib-thumb" src="'+escapeHtml(serve)+'" alt="'+name+'" loading="lazy" onerror="libThumbError(this)">';
    }else{
      html+='<div class="lib-thumb-fallback">Sign in to view</div>';
    }
    html+='<div class="lib-meta"><div class="lib-name">'+name+'</div>'+meta+'</div>';
    html+='<div class="lib-actions">';
    html+='<button class="btn btn-primary btn-sm" type="button" onclick="useLibraryImage('+idx+')">Use</button>';
    html+='<button class="btn btn-danger btn-sm" type="button" onclick="deleteLibraryImage('+idx+')">Delete</button>';
    html+='</div></div>';
  });
  if(libState.cursor){
    html+='<div class="lib-loadmore" style="grid-column:1/-1;"><button class="btn btn-secondary btn-sm" type="button" onclick="loadLibrary()"'+(libState.loading?' disabled':'')+'>Load More</button></div>';
  }
  grid.innerHTML=html;
}
function useLibraryImage(idx){
  var u=libState.uploads[idx];
  if(!u)return;
  var serve=uploadUrlFor(u.key);
  if(!serve){showToast('Cannot resolve image URL');return;}
  var t=libState.pickerTarget;
  if(t){
    var field=document.getElementById('ep-'+t.cid+'-'+t.pid+'-image');
    if(field){
      field.value=serve;
      // Persist the picked image immediately.
      saveProduct(t.cid,t.pid);
      showToast('Image selected and saved');
    }
  }else{
    showToast('Image URL copied');
    try{navigator.clipboard.writeText(serve);}catch(_e){}
  }
  closeImageLibrary();
}
async function deleteLibraryImage(idx){
  var u=libState.uploads[idx];
  if(!u)return;
  if(!confirm('Delete this image? It will be removed from any products using it.'))return;
  try{
    // DELETE accepts a bare filename scoped to the authed account.
    var res=await fetch('/api/uploads/'+encodeURIComponent(u.key),{method:'DELETE'});
    if(!res.ok)throw new Error('Delete failed ('+res.status+')');
    libState.uploads.splice(idx,1);
    renderLibrary();
    showToast('Image deleted');
  }catch(err){
    showToast(err&&err.message?err.message:'Delete failed');
  }
}
// Upload-from-modal: reuse the existing upload endpoint, then refresh.
async function handleLibraryUpload(input){
  var file=input.files&&input.files[0];
  if(!file)return;
  input.value='';
  var fd=new FormData();fd.append('file',file);
  showToast('Uploading...');
  try{
    var res=await fetch('/api/upload',{method:'POST',body:fd});
    if(!res.ok)throw new Error('Upload failed');
    var data=await res.json();
    if(data.url){var aid=extractAccountId(data.url);if(aid)ACCOUNT_ID=aid;}
    showToast('Image uploaded');
    resetLibrary();loadLibrary();
  }catch(err){
    showToast(err&&err.message?err.message:'Upload failed');
  }
}

// Wire up modal DOM listeners once after the page loads.
function initImageLibrary(){
  var modal=document.getElementById('imageLibraryModal');
  if(!modal)return;
  document.getElementById('imageLibraryClose').addEventListener('click',closeImageLibrary);
  // Backdrop click closes; clicks inside the panel do not.
  modal.addEventListener('click',function(e){if(e.target===modal)closeImageLibrary();});
  document.getElementById('imageLibraryUpload').addEventListener('click',function(){document.getElementById('imageLibraryUploadInput').click();});
  document.getElementById('imageLibraryUploadInput').addEventListener('change',function(){handleLibraryUpload(this);});
}

// ---- Desktop TV Preview ----
// Reuses the real TV renderer (/tv/<session>) inside an iframe so the
// preview always matches what a physical TV would show. Display count,
// selected display, and per-display theme/layout overrides are passed as URL
// params, the same way a real multi-display TV setup is configured.
var simState={displayCount:1,selectedDisplay:1,themeOverride:'',layoutOverride:'',viewMode:'single'};
var SIM_BASE_W=1920,SIM_BASE_H=1080;

function initSimulator(){
  // Default display count from config or existing screen-set cookie.
  if(config && typeof config.displayCount==='number') simState.displayCount=Math.max(1,Math.min(4,config.displayCount));
  var cookie=getCookie('dubmenu_screens');
  if(cookie){
    var ids=cookie.split(',').filter(function(s){return s;});
    if(ids.length) simState.displayCount=Math.max(1,Math.min(4,ids.length));
  }
  simState.selectedDisplay=1;
  renderSimulatorControls();
  renderSimulatorPreview();
  window.addEventListener('resize',debounceScaleFrames,200);
}

function setSimDisplayCount(n){
  n=Math.max(1,Math.min(4,n));
  simState.displayCount=n;
  if(simState.selectedDisplay>n) simState.selectedDisplay=n;
  renderSimulatorControls();
  renderSimulatorPreview();
  sendConfig('displayCount',n);
  // Update the screen-set cookie so real TV URLs and the screen-set info use the same count.
  var ids=[];
  for(var i=0;i<n;i++) ids.push(SESSION_ID);
  setCookie('dubmenu_screens',ids.join(','),7);
  updateScreenSet();
}

function setSimSelectedDisplay(n){
  simState.selectedDisplay=n;
  renderSimulatorControls();
  renderSimulatorPreview();
}

function setSimViewMode(mode){
  simState.viewMode=mode;
  renderSimulatorControls();
  renderSimulatorPreview();
}

function renderSimulatorControls(){
  // Display count segmented buttons.
  var countEl=document.getElementById('simDisplayCount');
  if(countEl){
    var chtml='';
    for(var i=1;i<=4;i++){
      chtml+='<button type="button" role="radio" aria-checked="'+(i===simState.displayCount?'true':'false')+'" onclick="setSimDisplayCount('+i+')"'+(i===simState.displayCount?' class="active"':'')+'>'+i+'</button>';
    }
    countEl.innerHTML=chtml;
  }
  // Display tabs.
  var tabsEl=document.getElementById('simDisplayTabs');
  if(tabsEl){
    var thtml='';
    for(var i=1;i<=simState.displayCount;i++){
      thtml+='<button type="button" class="sim-tab'+(i===simState.selectedDisplay?' active':'')+'" role="tab" aria-selected="'+(i===simState.selectedDisplay?'true':'false')+'" onclick="setSimSelectedDisplay('+i+')">Display '+i+'</button>';
    }
    tabsEl.innerHTML=thtml;
  }
  // View mode segmented buttons.
  var viewEl=document.getElementById('simViewMode');
  if(viewEl){
    viewEl.querySelectorAll('button').forEach(function(btn){
      var active=btn.dataset.mode===simState.viewMode;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-checked',active?'true':'false');
    });
  }
  var statusEl=document.getElementById('simStatus');
  if(statusEl) statusEl.textContent='Previewing display '+simState.selectedDisplay+' of '+simState.displayCount;
}

function renderSimulatorPreview(){
  simState.themeOverride=document.getElementById('simThemeOverride').value;
  simState.layoutOverride=document.getElementById('simLayoutOverride').value;
  var preview=document.getElementById('simPreview');
  if(!preview) return;
  if(simState.viewMode==='compact'){
    renderCompactPreview(preview);
  }else{
    renderSinglePreview(preview);
  }
  scaleFrames();
}

function renderSinglePreview(preview){
  preview.innerHTML='<div class="sim-frame-wrapper" id="simWrapper"><iframe id="simFrame" class="sim-frame" title="TV preview display '+simState.selectedDisplay+'" allowfullscreen></iframe></div>';
  updateSimFrame('simFrame',simState.selectedDisplay);
}

function renderCompactPreview(preview){
  var gridClass='sim-grid';
  if(simState.displayCount<=2) gridClass+=' sim-grid-2';
  else gridClass+=' sim-grid-4';
  var html='<div class="'+gridClass+'">';
  for(var i=1;i<=simState.displayCount;i++){
    html+='<div class="sim-grid-cell"><div class="sim-frame-wrapper" id="simWrapper-'+i+'"><iframe id="simFrame-'+i+'" class="sim-frame" title="TV preview display '+i+'" allowfullscreen></iframe></div></div>';
  }
  html+='</div>';
  preview.innerHTML=html;
  for(var i=1;i<=simState.displayCount;i++) updateSimFrame('simFrame-'+i,i);
}

function updateSimFrame(frameId,displayNum){
  var frame=document.getElementById(frameId);
  if(!frame) return;
  var url='/tv/'+SESSION_ID+'?embed=1&display='+displayNum+'&displays='+simState.displayCount;
  if(simState.themeOverride) url+='&theme='+encodeURIComponent(simState.themeOverride);
  if(simState.layoutOverride) url+='&layout='+encodeURIComponent(simState.layoutOverride);
  var full=location.origin+url;
  if(frame.src!==full) frame.src=full;
}

function scaleFrames(){
  var wrappers=document.querySelectorAll('.sim-frame-wrapper');
  if(!wrappers.length) return;
  wrappers.forEach(function(wrapper){
    var cell=wrapper.parentElement;
    var cellW=cell?cell.clientWidth:0;
    var cellH=cell?cell.clientHeight:0;
    var scale=Math.min(cellW/SIM_BASE_W,cellH/SIM_BASE_H,1);
    if(!(scale>0)) scale=1;
    var scaledW=SIM_BASE_W*scale;
    var scaledH=SIM_BASE_H*scale;
    wrapper.style.width=scaledW+'px';
    wrapper.style.height=scaledH+'px';
    var frame=wrapper.querySelector('.sim-frame');
    if(frame){
      frame.style.width=SIM_BASE_W+'px';
      frame.style.height=SIM_BASE_H+'px';
      frame.style.transform='scale('+scale+')';
      frame.style.transformOrigin='top left';
      frame.style.left='0px';
      frame.style.top='0px';
    }
  });
}
var simScaleTimer=null;
function debounceScaleFrames(){
  if(simScaleTimer) clearTimeout(simScaleTimer);
  simScaleTimer=setTimeout(function(){scaleFrames();scaleMobilePreview();},100);
}

function getSimTvUrl(displayNum,embed){
  var url='/tv/'+SESSION_ID+'?display='+displayNum+'&displays='+simState.displayCount;
  if(embed) url+='&embed=1';
  if(simState.themeOverride) url+='&theme='+encodeURIComponent(simState.themeOverride);
  if(simState.layoutOverride) url+='&layout='+encodeURIComponent(simState.layoutOverride);
  return url;
}


function rotateSimDisplay(){
  setSimSelectedDisplay((simState.selectedDisplay % simState.displayCount)+1);
}

function sendToConnectedTv(){
  // The config is already streamed live to any connected TV via WebSocket.
  // This opens the real TV display URL so the operator can load it on the
  // physical screen with the same display index / count / overrides shown in
  // the simulator.
  showToast('Opening TV display - config is synced to connected TVs');
  window.open(getSimTvUrl(simState.selectedDisplay,false),'_blank');
}

function updateSimulator(){
  renderSimulatorPreview();
  renderMobilePreview();
}

function syncSimulatorFromConfig(){
  if(!config || typeof config.displayCount !== 'number') return;
  var cfgCount=Math.max(1,Math.min(4,config.displayCount));
  if(cfgCount!==simState.displayCount){
    simState.displayCount=cfgCount;
    simState.selectedDisplay=Math.min(simState.selectedDisplay,simState.displayCount);
    renderSimulatorControls();
    renderSimulatorPreview();
  }
}

// ---- Mobile TV Preview ----
// On narrow screens the settings page is primary. The preview loads only
// inside a modal dialog so it does not dominate the operator view.
var mobilePreviewLastFocus=null;

function initMobilePreview(){
  var modal=document.getElementById('mobilePreviewModal');
  if(!modal)return;
  document.getElementById('mobilePreviewClose').addEventListener('click',closeMobilePreview);
  modal.addEventListener('click',function(e){if(e.target===modal)closeMobilePreview();});
}

function openMobilePreview(){
  var modal=document.getElementById('mobilePreviewModal');
  if(!modal)return;
  mobilePreviewLastFocus=document.activeElement;
  modal.classList.add('open');
  document.addEventListener('keydown',mobilePreviewKeydown,true);
  renderMobilePreview();
  setTimeout(function(){var c=document.getElementById('mobilePreviewClose');if(c)c.focus();},0);
}

function closeMobilePreview(){
  var modal=document.getElementById('mobilePreviewModal');
  if(!modal)return;
  modal.classList.remove('open');
  document.removeEventListener('keydown',mobilePreviewKeydown,true);
  if(mobilePreviewLastFocus&&mobilePreviewLastFocus.focus){mobilePreviewLastFocus.focus();}
  mobilePreviewLastFocus=null;
}

function mobilePreviewKeydown(e){
  var modal=document.getElementById('mobilePreviewModal');
  if(!modal||!modal.classList.contains('open'))return;
  if(e.key==='Escape'){e.preventDefault();closeMobilePreview();return;}
  if(e.key==='Tab'){
    var focusable=modal.querySelectorAll('button[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])');
    if(!focusable.length)return;
    var first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
}

function renderMobilePreview(){
  var modal=document.getElementById('mobilePreviewModal');
  if(!modal||!modal.classList.contains('open'))return;
  var container=document.getElementById('mobilePreviewModalFrame');
  if(!container)return;
  container.innerHTML='<iframe id="mobilePreviewFrame" title="TV preview" allowfullscreen></iframe>';
  var frame=document.getElementById('mobilePreviewFrame');
  if(!frame)return;
  var url='/tv/'+SESSION_ID+'?embed=1&display=1&displays=1';
  frame.src=location.origin+url;
  scaleMobilePreview();
}

function scaleMobilePreview(){
  var frame=document.getElementById('mobilePreviewFrame');
  var container=document.getElementById('mobilePreviewModalFrame');
  if(!frame||!container)return;
  var scale=Math.min(container.clientWidth/1920,container.clientHeight/1080,1);
  if(!(scale>0))scale=1;
  frame.style.width='1920px';
  frame.style.height='1080px';
  frame.style.transform='scale('+scale+')';
}

// End simulator

connect();
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){initImageLibrary();initThemeRadios();initSimulator();initMobilePreview();});}else{initImageLibrary();initThemeRadios();initSimulator();initMobilePreview();}
</script>
</body>
</html>`;
}
