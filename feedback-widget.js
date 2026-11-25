/* Siglo de Oro — Contextual Feedback Widget v2
   Select any text → comment → sends to Supabase with full context path */
(function(){
const SUPABASE_URL = 'https://vaxidquzijxpkgsnewbv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OfyHIhuyFyLJgLn6F9ns-w_51hM5ufI';

const style = document.createElement('style');
style.textContent = `
#ctx-fb-tooltip{display:none;position:fixed;z-index:10000;background:#AA151B;color:#F0E6D0;font-family:Inter,sans-serif;font-size:.78rem;padding:6px 14px;cursor:pointer;white-space:nowrap;border:1px solid rgba(241,191,0,.3);transition:opacity .15s}
#ctx-fb-tooltip:hover{background:#cc1a22}
#ctx-fb-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:10001;align-items:center;justify-content:center;padding:1rem}
#ctx-fb-overlay.open{display:flex}
#ctx-fb-dialog{background:#12100C;border:1px solid rgba(170,21,27,0.3);width:100%;max-width:480px;padding:0;font-family:Inter,sans-serif}
.ctx-fb-head{padding:12px 16px;border-bottom:1px solid rgba(170,21,27,0.15);display:flex;justify-content:space-between;align-items:center}
.ctx-fb-head h3{font-family:'DM Serif Display',serif;font-size:1rem;color:#F0E6D0;margin:0;font-weight:400}
.ctx-fb-close{background:none;border:1px solid rgba(170,21,27,0.2);color:#6B5D4D;width:36px;height:36px;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ctx-fb-close:hover{color:#F0E6D0;border-color:#AA151B}
.ctx-fb-body{padding:16px}
.ctx-fb-path{font-size:.7rem;color:#6B5D4D;margin-bottom:8px;line-height:1.4;word-break:break-all}
.ctx-fb-selected{font-size:.82rem;color:#F1BF00;font-style:italic;padding:8px 12px;border-left:2px solid #F1BF00;margin-bottom:12px;max-height:80px;overflow:hidden}
.ctx-fb-textarea{width:100%;height:70px;background:#0A0A0A;border:1px solid rgba(170,21,27,0.2);color:#F0E6D0;font-family:Inter,sans-serif;font-size:.85rem;padding:8px;resize:vertical}
.ctx-fb-textarea:focus{outline:none;border-color:#AA151B}
.ctx-fb-send{background:#AA151B;border:none;color:#F0E6D0;font-family:Inter,sans-serif;font-size:.85rem;font-weight:600;padding:10px 16px;cursor:pointer;margin-top:8px;width:100%;min-height:44px}
.ctx-fb-send:hover{background:#cc1a22}
.ctx-fb-send:disabled{opacity:.5;cursor:not-allowed}
.ctx-fb-thanks{text-align:center;padding:16px 0}
.ctx-fb-thanks .check{color:#F1BF00;font-size:2rem}
.ctx-fb-thanks p{color:#F0E6D0;font-size:.9rem;margin:8px 0}
.ctx-fb-email-row{display:flex;gap:6px;margin-top:10px}
.ctx-fb-email-row input{flex:1;background:#0A0A0A;border:1px solid rgba(170,21,27,0.2);color:#F0E6D0;font-family:Inter,sans-serif;font-size:.82rem;padding:8px}
.ctx-fb-email-row input:focus{outline:none;border-color:#AA151B}
.ctx-fb-email-row button{background:#6B5D4D;border:none;color:#F0E6D0;font-size:.78rem;padding:8px 14px;cursor:pointer;white-space:nowrap;min-height:44px}
.ctx-fb-email-row button:hover{background:#AA151B}
.ctx-fb-skip{background:none;border:none;color:#6B5D4D;font-size:.75rem;cursor:pointer;margin-top:8px;text-decoration:underline}
.ctx-fb-skip:hover{color:#F0E6D0}
.ctx-fb-hint{font-size:.68rem;color:#6B5D4D;text-align:center;margin-top:6px}
/* Floating button for general feedback */
#ctx-fb-btn{position:fixed;bottom:20px;right:20px;z-index:9000;width:48px;height:48px;background:#AA151B;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s}
#ctx-fb-btn:hover{background:#cc1a22}
#ctx-fb-btn svg{width:24px;height:24px;fill:#F0E6D0}
`;
document.head.appendChild(style);

// Build context path from selected element
function getContextPath(el) {
  const parts = [];
  const pageName = document.title.split('—')[0]?.trim() || location.pathname.replace(/\//g,'') || 'Inicio';
  parts.push(pageName);
  
  // Walk up the DOM to find meaningful containers
  let node = el;
  const meaningful = [];
  while (node && node !== document.body) {
    // Check for author name (modal)
    const modalTitle = node.querySelector && node.querySelector('.modal-name, h2, h3');
    if (node.id && node.id.startsWith('innovacion-')) {
      const num = node.id.replace('innovacion-','');
      const h2 = node.querySelector('h2');
      meaningful.unshift(h2 ? h2.textContent.trim() : 'Innovación ' + num);
    }
    if (node.classList && node.classList.contains('innovation')) {
      // already handled above
    }
    if (node.id === 'modal-content') {
      const name = node.querySelector('h2');
      if (name) meaningful.unshift(name.textContent.trim());
    }
    // Tab panel
    if (node.classList && node.classList.contains('tabpanel') && node.dataset.panel) {
      meaningful.unshift(node.dataset.panel === 'bio' ? 'Biografía' : node.dataset.panel === 'innov' ? 'Innovación' : node.dataset.panel === 'obras' ? 'Obras' : node.dataset.panel);
    }
    // Card
    if (node.classList && node.classList.contains('card')) {
      const h3 = node.querySelector('h3');
      if (h3) meaningful.unshift(h3.textContent.trim());
    }
    // Sections
    if (node.classList && (node.classList.contains('inn-chain') || node.classList.contains('inn-hoy') || node.classList.contains('inn-narrativo') || node.classList.contains('en-coleccion'))) {
      const h3 = node.querySelector('h3');
      if (h3) meaningful.unshift(h3.textContent.trim());
    }
    // Era in timeline
    if (node.classList && node.classList.contains('era')) {
      const label = node.querySelector('.era-label');
      if (label) meaningful.unshift(label.textContent.trim());
    }
    node = node.parentElement;
  }
  
  // Deduplicate
  const seen = new Set();
  const unique = meaningful.filter(m => { if (seen.has(m)) return false; seen.add(m); return true; });
  return parts.concat(unique).join(' / ');
}

// Tooltip for text selection
const tooltip = document.createElement('div');
tooltip.id = 'ctx-fb-tooltip';
tooltip.textContent = '💬 Comentar selección';
document.body.appendChild(tooltip);

// Overlay dialog
const overlay = document.createElement('div');
overlay.id = 'ctx-fb-overlay';
overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });
document.body.appendChild(overlay);

let selectedText = '';
let contextPath = '';
let currentFeedbackId = null;

function closeDialog() {
  overlay.classList.remove('open');
}

function showDialog(text, path) {
  selectedText = text;
  contextPath = path;
  currentFeedbackId = null;
  overlay.innerHTML = `<div id="ctx-fb-dialog">
    <div class="ctx-fb-head"><h3>💬 Feedback</h3><button class="ctx-fb-close" onclick="document.getElementById('ctx-fb-overlay').classList.remove('open')">✕</button></div>
    <div class="ctx-fb-body" id="ctx-fb-form">
      <div class="ctx-fb-path">${path}</div>
      ${text ? `<div class="ctx-fb-selected">"${text.substring(0,200)}${text.length>200?'...':''}"</div>` : ''}
      <textarea class="ctx-fb-textarea" id="ctx-fb-comment" placeholder="Escribe tu comentario, corrección o sugerencia..."></textarea>
      <button class="ctx-fb-send" id="ctx-fb-submit">Enviar</button>
    </div>
  </div>`;
  overlay.classList.add('open');
  
  document.getElementById('ctx-fb-submit').addEventListener('click', submitFeedback);
  setTimeout(() => document.getElementById('ctx-fb-comment').focus(), 100);
}

async function submitFeedback() {
  const btn = document.getElementById('ctx-fb-submit');
  const comment = document.getElementById('ctx-fb-comment').value.trim();
  if (!comment) return;
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const resp = await fetch(SUPABASE_URL + '/rest/v1/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        page: location.pathname,
        context: contextPath,
        selected_text: selectedText.substring(0, 500),
        comment: comment,
        user_agent: navigator.userAgent.substring(0, 200)
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      currentFeedbackId = data[0]?.id;
      document.getElementById('ctx-fb-form').innerHTML = `
        <div class="ctx-fb-thanks">
          <div class="check">✓</div>
          <p>¡Gracias por tu comentario!</p>
        </div>
        <div style="font-size:.78rem;color:#6B5D4D;text-align:center;line-height:1.5">Si quieres que te informemos, déjanos tu email:</div>
        <div class="ctx-fb-email-row">
          <input type="email" id="ctx-fb-email" placeholder="tu@email.com">
          <button id="ctx-fb-email-send">Enviar</button>
        </div>
        <div style="text-align:center"><button class="ctx-fb-skip" onclick="document.getElementById('ctx-fb-overlay').classList.remove('open')">No, gracias</button></div>
      `;
      document.getElementById('ctx-fb-email-send').addEventListener('click', submitEmail);
    } else {
      btn.textContent = 'Error — reintentar';
      btn.disabled = false;
    }
  } catch(e) {
    btn.textContent = 'Error — reintentar';
    btn.disabled = false;
  }
}

async function submitEmail() {
  const email = document.getElementById('ctx-fb-email').value.trim();
  if (!email || !currentFeedbackId) return;
  try {
    await fetch(SUPABASE_URL + '/rest/v1/feedback?id=eq.' + currentFeedbackId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({ email: email })
    });
    document.getElementById('ctx-fb-form').innerHTML = '<div class="ctx-fb-thanks"><div class="check">✓</div><p>Email guardado. ¡Gracias!</p></div>';
    setTimeout(closeDialog, 1500);
  } catch(e) {}
}

// Listen for text selection
document.addEventListener('mouseup', (e) => {
  const sel = window.getSelection();
  const text = sel.toString().trim();
  if (text.length > 2 && text.length < 1000) {
    // Position tooltip near selection
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    tooltip.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
    tooltip.style.top = (rect.bottom + 6) + 'px';
    tooltip.style.display = 'block';
    tooltip.onclick = () => {
      const path = getContextPath(range.startContainer.parentElement);
      tooltip.style.display = 'none';
      showDialog(text, path);
      sel.removeAllRanges();
    };
  } else {
    tooltip.style.display = 'none';
  }
});

// Touch support for selection
document.addEventListener('selectionchange', () => {
  const sel = window.getSelection();
  const text = sel.toString().trim();
  if (text.length < 3) tooltip.style.display = 'none';
});

// Hide tooltip on scroll/click elsewhere
document.addEventListener('mousedown', (e) => {
  if (e.target !== tooltip) tooltip.style.display = 'none';
});

// Floating button for general (non-selection) feedback
const btn = document.createElement('button');
btn.id = 'ctx-fb-btn';
btn.title = 'Dejar un comentario';
btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
btn.addEventListener('click', () => {
  const page = document.title.split('—')[0]?.trim() || 'Página';
  showDialog('', page);
});
document.body.appendChild(btn);

})();
