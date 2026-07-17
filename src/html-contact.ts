export function contactPage(origin: string): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeOrigin = escapeHtml(origin);
  const TV_ORIGIN = 'https://tv.dubmenu.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact | DubMenu - Digital Menu Boards for Dispensaries</title>
  <meta name="description" content="Contact DubMenu. Questions? We're here to help. $99/month. Free 2-week trial. Update from your phone in real time.">
  <link rel="canonical" href="${safeOrigin}/contact">
  <style>
    :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--surface-hover:rgba(255,255,255,0.08);--border:rgba(255,255,255,0.08);--text:#f0f2f5;--text-faint:#889495;--primary:#10b981;--primary-dark:#0a9364;--radius:0.75rem;--shadow:0 4px 24px rgba(0,0,0,0.4);--transition:0.2s ease;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Inter,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh;}
    a{color:var(--primary);text-decoration:none;transition:color var(--transition);}
    a:hover{color:var(--text);}
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1.5rem;background:rgba(10,15,13,0.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);}
    .nav a.logo{font-weight:700;font-size:1.125rem;color:var(--text);display:flex;align-items:center;gap:0.5rem;}
    .nav a.logo svg{width:28px;height:28px;color:var(--primary);}
    .nav-links{display:flex;align-items:center;gap:1.25rem;}
    .nav-links a{font-size:0.875rem;color:var(--text-faint);font-weight:500;transition:color var(--transition);}
    .nav-links a:hover{color:var(--text);}
    .nav-toggle{display:none;background:none;border:none;color:var(--text);cursor:pointer;padding:0.5rem;}
    .nav-toggle svg{width:24px;height:24px;}
    .nav-cta{background:var(--primary);color:#0a0f0d;padding:0.5rem 1rem;border-radius:0.5rem;font-weight:600;font-size:0.875rem;transition:background var(--transition);}
    .nav-cta:hover{background:var(--primary-dark);color:#0a0f0d;}
    .hero{padding:8rem 1.5rem 3rem;text-align:center;max-width:800px;margin:0 auto;}
    .hero h1{font-size:2.5rem;font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin-bottom:1.5rem;}
    .hero p{font-size:1.125rem;color:var(--text-faint);}
    .content{max-width:600px;margin:0 auto;padding:0 1.5rem 4rem;}
    .contact-info{margin:2rem 0;padding:2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);text-align:center;}
    .contact-info h2{font-size:1.5rem;font-weight:700;margin-bottom:1rem;}
    .contact-info p{color:var(--text-faint);margin-bottom:0.5rem;}
    .contact-info a{color:var(--primary);font-weight:600;}
    .form-group{margin-bottom:1.5rem;}
    .form-group label{display:block;margin-bottom:0.5rem;font-weight:600;}
    .form-group input,.form-group textarea{width:100%;padding:0.75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-family:inherit;}
    .form-group input:focus,.form-group textarea:focus{outline:none;border-color:var(--primary);}
    .form-group textarea{min-height:120px;resize:vertical;}
    .submit-btn{display:block;width:100%;padding:1rem;background:var(--primary);color:#0a0f0d;border:none;border-radius:var(--radius);font-weight:600;font-size:1.125rem;cursor:pointer;transition:background var(--transition);}
    .submit-btn:hover{background:var(--primary-dark);}
    .ecosystem-handoff{margin-top:2rem;padding:1.25rem 1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-faint);font-size:0.9375rem;text-align:center;}
    .ecosystem-handoff a{font-weight:600;}
    footer{padding:2rem 1.5rem;text-align:center;color:var(--text-faint);font-size:0.875rem;border-top:1px solid var(--border);margin-top:4rem;}
    @media(max-width:640px){
      .nav-toggle{display:block;}
      .nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:rgba(10,15,13,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);flex-direction:column;padding:1rem;gap:1rem;}
      .nav-links.open{display:flex;}
      .nav-links a{color:var(--text);}
      .hero h1{font-size:2rem;}
      .nav{padding:0.75rem 1rem;}
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="${safeOrigin}/" class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      DUBMENU
    </a>
    <div class="nav-links">
      <a href="${safeOrigin}/">Home</a>
      <a href="${TV_ORIGIN}/tv/demo" target="_blank">Demo</a>
      <a href="${safeOrigin}/pricing">Pricing</a>
      <a href="${safeOrigin}/faq">FAQ</a>
      <a href="${safeOrigin}/about">About</a>
      <a href="${safeOrigin}/contact">Contact</a>
      <a href="${TV_ORIGIN}/tv/demo" class="nav-cta" target="_blank">Launch TV</a>
    </div>
    <button class="nav-toggle" aria-label="Toggle menu" onclick="document.querySelector('.nav-links').classList.toggle('open')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </nav>

  <div class="hero">
    <h1>Contact Us</h1>
    <p>Questions? We're here to help.</p>
  </div>

  <div class="content">
    <div class="contact-info">
      <h2>Get in Touch</h2>
      <p>Email: <a href="mailto:support@dubmenu.com">support@dubmenu.com</a></p>
      <p>Response time: Under 24 hours</p>
    </div>

    <form id="contact-form">
      <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div class="form-group">
        <label for="message">Message</label>
        <textarea id="message" name="message" required></textarea>
      </div>
      <button type="submit" class="submit-btn">Send Message</button>
      <p id="form-status" style="margin-top:1rem;text-align:center;display:none;"></p>
    </form>
    <p class="ecosystem-handoff">Need help beyond your menu board? <a href="https://dubhaven.com" target="_blank" rel="noopener noreferrer">DubHaven</a> also offers cannabis POS through <a href="https://dubledger.com" target="_blank" rel="noopener noreferrer">DubLedger</a> and <a href="https://dubhaven.com/services/web-and-seo" target="_blank" rel="noopener noreferrer">websites, search, and digital marketing services</a>.</p>
    <script>
      document.getElementById('contact-form').addEventListener('submit', async function(e){
        e.preventDefault();
        var btn=this.querySelector('.submit-btn');
        var status=document.getElementById('form-status');
        btn.disabled=true;btn.textContent='Sending...';status.style.display='none';
        try{
          var res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
            name:document.getElementById('name').value,
            email:document.getElementById('email').value,
            message:document.getElementById('message').value
          })});
          var data=await res.json();
          if(res.ok&&data.success){
            status.textContent='Message sent! We\\'ll get back to you within 24 hours.';
            status.style.color='#10b981';status.style.display='block';
            this.reset();
          }else{
            throw new Error(data.error||'Failed to send');
          }
        }catch(err){
          status.textContent=err.message||'Something went wrong. Please email support@dubmenu.com directly.';
          status.style.color='#ef4444';status.style.display='block';
        }finally{
          btn.disabled=false;btn.textContent='Send Message';
        }
      });
    </script>
  </div>

  <footer>
    <p>&copy; 2026 DubMenu, a <a href="https://dubhaven.com" target="_blank" rel="noopener noreferrer">DubHaven</a> product.</p>
  </footer>
</body>
</html>`;
}