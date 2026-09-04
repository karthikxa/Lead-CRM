// Zed Leads & Google Maps Lead Finder (1:1 Exact Match with Opportunities & Notes Table View)
(function () {
  const ZL = {
    isOpen: false,
    isLeadsSidebarOpen: false,
    leads: [],
    selectedLeads: new Set(),
    members: [],
    selectedMemberId: '',
    campaignName: 'Chennai Business Campaign',
    industry: 'Real Estate Agency',
    location: 'Chennai',
    city: 'Chennai',
    place: '',
    keywords: '',
    maxResults: 25,
    sources: { googlemaps: true, reddit: true, indeed: true, x: true, instagram: true, facebook: true, linkedin: true },
    isLoading: false,
    isAssigning: false,
    statusMessage: null,
    isScraperModalOpen: false,

    async init() {
      await this.fetchMembers();
      this.removeSidebarLeads();
      this.injectPeopleLeadsButton();
      this.injectAssignedToMenu();
      this.initInviteListener();
      // persistent header injection - MutationObserver + interval like v13 75561
      const obs = new MutationObserver(() => { this.removeSidebarLeads(); this.injectPeopleLeadsButton(); this.injectAssignedToMenu(); });
      try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
      setInterval(() => {
        this.removeSidebarLeads();
        this.injectPeopleLeadsButton();
        this.injectAssignedToMenu();
        this.initInviteListener();
      }, 1000);

      document.addEventListener('click', (e) => {
        if (!this.isOpen) return;
        if (e.target.closest('#zed-leads-dashboard-view') || e.target.closest('#zed-scraper-modal')) return;

        const navEl = e.target.closest('a, [role="link"], button, [class*="Item"], [class*="sauq8y3"]');
        if (navEl && !navEl.closest('.zed-leads-sidebar-row') && navEl.id !== 'zed-leads-link') {
          const txt = (navEl.textContent || '').trim().toLowerCase();
          if (['companies', 'people', 'opportunities', 'tasks', 'notes', 'dashboards', 'workflows', 'settings'].some(t => txt.includes(t))) {
            this.close();
          }
        }
      }, false);

      window.addEventListener('popstate', () => this.handleRouteChange());
      window.addEventListener('hashchange', () => this.handleRouteChange());
      window.addEventListener('resize', () => {
        if (this.isOpen) this.render();
      });

      this.handleRouteChange();
    },

    initInviteListener() {
      if (!window.location.pathname.includes('/settings/members') && !window.location.hash.includes('invite')) return;

      const inviteBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim() === 'Invite');
      if (inviteBtn && !inviteBtn.dataset.zedBound) {
        inviteBtn.dataset.zedBound = 'true';
        inviteBtn.addEventListener('click', async () => {
          setTimeout(async () => {
            const inputs = document.querySelectorAll('input[type="text"], input[type="email"]');
            let targetEmail = '';
            for (const inp of inputs) {
              const v = (inp.value || '').trim();
              if (v.includes('@')) {
                targetEmail = v;
                break;
              }
            }

            // Get generated invite link
            let inviteLink = window.location.origin;
            for (const inp of inputs) {
              const v = (inp.value || '').trim();
              if (v.includes('/invite/')) {
                inviteLink = v;
                break;
              }
            }

            if (targetEmail) {
              this.showToast(`📧 [Zed Bridge] Sending Gmail invitation to ${targetEmail}...`);
              try {
                const res = await fetch('https://zed-email-relay.onrender.com/invite', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: targetEmail,
                    workspaceName: 'Zed Agency CRM',
                    inviteLink: inviteLink,
                    inviterName: 'Zed Agency Admin'
                  })
                });
                const data = await res.json();
                if (data.success) {
                  this.showToast(`✅ [Zed Bridge] Invitation delivered to ${targetEmail}!`);
                } else {
                  this.showToast(`⚠️ [Zed Bridge] Email notice: ${data.error || 'Check Render server'}`);
                }
              } catch (err) {
                console.warn('[Zed Bridge] Invite dispatch:', err.message);
              }
            }
          }, 600);
        });
      }
    },

    showToast(msg) {
      let toast = document.getElementById('zed-global-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'zed-global-toast';
        toast.style.cssText = 'position: fixed; bottom: 24px; right: 24px; background: #18181b; color: #f4f4f5; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 9999999; display: flex; align-items: center; gap: 8px; border: 1px solid #27272a; transition: all 0.3s ease; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      clearTimeout(window._zedToastTimer);
      window._zedToastTimer = setTimeout(() => {
        if (toast) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
        }
      }, 5000);
    },

    handleRouteChange() {
      if (window.location.hash === '#leads' || window.location.pathname.endsWith('/leads')) {
        this.open();
      } else if (this.isOpen && !window.location.hash.includes('leads')) {
        this.close();
      }
    },

    async fetchMembers() {
      try {
        const res = await fetch('/api/admin/leads/members');
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          this.members = data.members;
          if (this.members.length > 0 && !this.selectedMemberId) {
            this.selectedMemberId = this.members[0].id;
          }
        }
      } catch (e) {
        console.error('[Zed Leads] Error fetching members:', e);
      }
    },

    async open() {
      this.isOpen = true;
      this.fetchMembers();
      this.render();
      if (window.location.hash !== '#leads') {
        window.history.pushState(null, '', '#leads');
      }
      this.updateSidebarHighlight(true);

      if (this.leads.length === 0 && !this.isLoading) {
        this.search();
      }
    },

    close() {
      this.isOpen = false;
      const view = document.getElementById('zed-leads-dashboard-view');
      if (view) view.remove();
      const modal = document.getElementById('zed-scraper-modal');
      if (modal) modal.remove();
      if (window.location.hash === '#leads') {
        window.history.pushState(null, '', window.location.pathname);
      }
      this.updateSidebarHighlight(false);
    },

    updateSidebarHighlight(isActive) {
      const leadsLink = document.getElementById('zed-leads-link');
      if (leadsLink) {
        leadsLink.style.backgroundColor = isActive ? 'rgba(0, 0, 0, 0.06)' : 'transparent';
        leadsLink.style.color = isActive ? '#18181b' : 'inherit';
        leadsLink.style.fontWeight = isActive ? '500' : 'normal';
      }
    },

     async search() {
      // unified: allow keywords + city/place + sources - fallback to industry/location
      const ind = (this.industry || '').trim();
      const loc = (this.location || this.city || '').trim();
      if (!ind && !(this.keywords || '').trim()) {
        alert('Please enter Industry or Keywords.');
        return;
      }
      this.isLoading = true;
      this.statusMessage = null;
      this.render();
      if (this.isLeadsSidebarOpen) this.renderLeadsSidebar();

      try {
        const activeSources = Object.entries(this.sources || {}).filter(([k,v])=>v).map(([k])=>k);
        const res = await fetch('/api/admin/leads/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignName: this.campaignName || `${ind} in ${loc}`,
            industry: ind || this.keywords.trim(),
            location: loc || 'Chennai',
            city: (this.city || '').trim(),
            place: (this.place || '').trim(),
            keywords: (this.keywords || '').trim(),
            maxResults: parseInt(this.maxResults, 10) || 25,
            sources: activeSources.length ? activeSources : ['googlemaps','reddit','indeed','x','instagram','facebook','linkedin']
          })
        });
        const data = await res.json();
        if (data.success) {
          this.leads = data.leads || [];
          this.selectedLeads = new Set(this.leads.map((l, i) => (!l.isDuplicate ? i : null)).filter(x => x !== null));
          this.isScraperModalOpen = false;
        } else {
          this.statusMessage = { type: 'error', text: data.error || 'Failed to fetch leads.' };
        }
      } catch (err) {
        this.statusMessage = { type: 'error', text: err.message };
      } finally {
        this.isLoading = false;
        this.render();
        if (this.isLeadsSidebarOpen) this.renderLeadsSidebar();
      }
    },

    toggleSelectAll() {
      if (this.selectedLeads.size === this.leads.length) {
        this.selectedLeads.clear();
      } else {
        this.selectedLeads = new Set(this.leads.map((_, i) => i));
      }
      this.render();
      if (this.isLeadsSidebarOpen) this.renderLeadsSidebar();
    },

    toggleSelect(index) {
      if (this.selectedLeads.has(index)) {
        this.selectedLeads.delete(index);
      } else {
        this.selectedLeads.add(index);
      }
      this.render();
      if (this.isLeadsSidebarOpen) this.renderLeadsSidebar();
    },

    async assignSelected() {
      if (this.selectedLeads.size === 0) {
        alert('Please select at least one lead.');
        return;
      }
      if (!this.selectedMemberId) {
        alert('Please select a team member.');
        return;
      }

      const leadsToAssign = Array.from(this.selectedLeads).map(i => this.leads[i]);
      const chosenMember = this.members.find(m => m.id === this.selectedMemberId);
      const memberName = chosenMember ? [chosenMember.nameFirstName, chosenMember.nameLastName].filter(Boolean).join(' ') || chosenMember.userEmail : 'Member';

      this.isAssigning = true;
      this.statusMessage = null;
      this.render();

      try {
        const res = await fetch('/api/admin/leads/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leads: leadsToAssign,
            memberId: this.selectedMemberId,
            campaignName: this.campaignName || `${this.industry} in ${this.location}`
          })
        });
        const data = await res.json();
        if (data.success) {
          this.statusMessage = {
            type: 'success',
            text: `✓ Assigned ${data.assignedCount} leads to ${memberName}! (${data.duplicateCount} cross-member duplicates prevented).`
          };
          for (const idx of this.selectedLeads) {
            if (this.leads[idx]) {
              this.leads[idx].isDuplicate = true;
              this.leads[idx].existingOwnerName = memberName;
            }
          }
          this.selectedLeads.clear();
        } else {
          this.statusMessage = { type: 'error', text: data.error || 'Assignment failed.' };
        }
      } catch (err) {
        this.statusMessage = { type: 'error', text: err.message };
      } finally {
        this.isAssigning = false;
        this.render();
        if (this.isLeadsSidebarOpen) this.renderLeadsSidebar();
      }
    },
    importCsv(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          let leads = [];
          if (file.name.endsWith('.json')) {
            const data = JSON.parse(text);
            const arr = Array.isArray(data) ? data : [data];
            leads = arr.map(item => ({
              name: item.title || item.name || item.input_id || 'Unknown',
              phone: item.phone || '',
              website: item.website || '',
              email: (item.emails && item.emails[0]) || '',
              street: item.address || item.complete_address || '',
              city: '',
              state: '',
              industry: item.category || 'Business',
              source: 'Gosom Import',
              rating: item.review_rating || '4.5',
              reviewsCount: item.review_count || 0
            })).filter(l=>l.name && l.name!=='Unknown');
          } else {
            const lines = text.split('\n').filter(l=>l.trim());
            if (lines.length < 2) throw new Error('Empty CSV');
            const headers = lines[0].split(',').map(h=>h.replace(/^"|"$/g,'').trim().toLowerCase());
            const findIdx = (cands) => { for (let c of cands) { const i = headers.findIndex(h=>h.includes(c)); if (i>=0) return i; } return -1; };
            const titleIdx = findIdx(['title','name']); const phoneIdx=findIdx(['phone']); const webIdx=findIdx(['website']); const addrIdx=findIdx(['address','complete_address']); const catIdx=findIdx(['category']); const ratingIdx=findIdx(['review_rating','rating']); const countIdx=findIdx(['review_count']);
            for(let i=1;i<lines.length;i++){
              const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
              const clean = v=> (v||'').replace(/^"|"$/g,'').replace(/""/g,'"').trim();
              const get = idx=> idx>=0 && idx<cols.length ? clean(cols[idx]) : '';
              const name = get(titleIdx) || `Lead ${i}`;
              if (!name || name.startsWith('Lead ')) continue;
              leads.push({ name, phone: get(phoneIdx), website: get(webIdx), street: get(addrIdx), city: '', industry: get(catIdx)||'Business', source: 'Gosom Import', rating: get(ratingIdx)||'4.5', reviewsCount: get(countIdx)||0 });
            }
          }
          this.leads = leads.slice(0, 100);
          this.selectedLeads = new Set(this.leads.map((_,i)=>i));
          this.statusMessage = {type:'success', text: `\u2713 Imported ${this.leads.length} leads from ${file.name} — ready to Assign`};
          this.renderLeadsSidebar();
          this.render();
        } catch(err){ this.statusMessage={type:'error', text: 'Import failed: '+err.message}; this.renderLeadsSidebar(); }
      };
      reader.readAsText(file);
      event.target.value='';
    },

    removeSidebarLeads() {
      document.querySelectorAll('.zed-leads-sidebar-row, #zed-leads-sidebar-item, #zed-leads-link').forEach(el => {
        const row = el.closest('.zed-leads-sidebar-row') || el;
        if (row && row.parentElement) row.remove();
      });
      // also remove any stray Leads row inserted under Notes
      document.querySelectorAll('a[href="#leads"]').forEach(a => {
        const r = a.closest('li, div');
        if (r && (a.textContent || '').trim() === 'Leads') r.remove();
      });
    },
    injectSidebarItem() { this.removeSidebarLeads(); return; },

    injectPeopleLeadsButton() {
      // only on People page
      const isPeople = window.location.pathname.includes('/objects/people') || (window.location.hash || '').includes('people') || document.body.textContent.includes('All People');
      if (!isPeople && !window.location.pathname.includes('/objects/people')) {
        // still try if we see + New Person button
      }
      if (document.getElementById('zed-people-leads-fixed')) return;
      // also catch the docked version
      if (document.getElementById('zed-people-leads-btn')) return;
      const allBtns = Array.from(document.querySelectorAll('button'));
      const newPersonBtn = allBtns.find(b => (b.textContent || '').trim() === '+ New Person' || (b.textContent || '').trim() === 'New Person' || (b.textContent || '').trim().includes('New Person'));
      if (!newPersonBtn) {
        // fallback: create fixed if header not yet rendered - but only after a delay
        if (!document.getElementById('zed-people-leads-fixed-fallback')) {
          const fb = document.createElement('button');
          fb.id = 'zed-people-leads-fixed-fallback';
          fb.textContent = '+ Leads';
          fb.onclick = () => this.openLeadsSidebar();
          fb.style.cssText = 'position: fixed; top: 12px; right: 170px; z-index: 99999; background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 0 14px; height: 32px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(37,99,235,0.2); display: flex; align-items: center; gap: 6px;';
          // only show on people
          if (window.location.pathname.includes('/objects/people')) document.body.appendChild(fb);
          setTimeout(() => { if (fb.parentElement && document.getElementById('zed-people-leads-btn')) fb.remove(); }, 3000);
        }
        return;
      }
      const parent = newPersonBtn.parentElement;
      if (!parent) return;
      // style clone from computedStyle
      const cs = window.getComputedStyle(newPersonBtn);
      const leadsBtn = document.createElement('button');
      leadsBtn.id = 'zed-people-leads-fixed';
      // also keep legacy id for tests
      leadsBtn.setAttribute('data-testid', 'zed-people-leads-btn');
      leadsBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> <span>+ Leads</span>';
      leadsBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.openLeadsSidebar(); };
      // try exact clone
      try {
        leadsBtn.className = newPersonBtn.className;
        leadsBtn.style.cssText = newPersonBtn.style.cssText;
      } catch (e) {}
      // enforce Zed blue if clone missing background
      if (!cs.backgroundColor || cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent') {
        leadsBtn.style.background = '#2563eb';
        leadsBtn.style.color = '#ffffff';
        leadsBtn.style.border = 'none';
        leadsBtn.style.borderRadius = cs.borderRadius || '6px';
        leadsBtn.style.padding = cs.padding || '0 14px';
        leadsBtn.style.height = cs.height || '32px';
        leadsBtn.style.fontSize = cs.fontSize || '13px';
        leadsBtn.style.fontWeight = '600';
        leadsBtn.style.boxShadow = '0 1px 2px rgba(37,99,235,0.2)';
      } else {
        leadsBtn.style.background = cs.backgroundColor;
        leadsBtn.style.color = cs.color;
        leadsBtn.style.border = cs.border;
        leadsBtn.style.borderRadius = cs.borderRadius;
        leadsBtn.style.padding = cs.padding;
        leadsBtn.style.height = cs.height;
      }
      leadsBtn.style.display = 'inline-flex';
      leadsBtn.style.alignItems = 'center';
      leadsBtn.style.gap = '6px';
      leadsBtn.style.cursor = 'pointer';
      // insert before New Person to keep flex gap
      parent.style.display = 'flex';
      parent.style.gap = '8px';
      parent.style.alignItems = 'center';
      parent.insertBefore(leadsBtn, newPersonBtn);
      // remove fallback if present
      const fb = document.getElementById('zed-people-leads-fixed-fallback');
      if (fb) fb.remove();
      // expose second id for legacy check
      const legacy = document.createElement('span');
      legacy.id = 'zed-people-leads-btn';
      legacy.style.display = 'none';
      leadsBtn.appendChild(legacy);
    },

    injectAssignedToMenu() {
      if (document.getElementById('zed-assignedto-menu')) return;
      const importBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim().toLowerCase().includes('import people') || (b.textContent || '').trim() === 'Import');
      const anchor = importBtn || Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim() === '⋮' || (b.textContent || '').trim() === 'Options');
      if (!anchor) return;
      // add three-dots bulk Assigned To if not exists
      const opts = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim() === 'Options');
      if (opts && !opts.dataset.zedAssigned) {
        opts.dataset.zedAssigned = 'true';
        opts.addEventListener('click', () => setTimeout(() => {
          const menu = document.querySelector('[role="menu"], [class*="Dropdown"]');
          if (menu && !menu.querySelector('#zed-bulk-assign')) {
            const it = document.createElement('div');
            it.id = 'zed-bulk-assign';
            it.textContent = 'Assigned To';
            it.style.cssText = 'padding: 8px 12px; font-size: 13px; cursor: pointer;';
            it.onclick = () => this.openBulkAssign();
            menu.appendChild(it);
          }
        }, 200));
      }
    },
    openBulkAssign() { this.showToast('Select leads then use Assign bar'); },

    openLeadsSidebar() {
      this.isLeadsSidebarOpen = true;
      this.fetchMembers();
      this.renderLeadsSidebar();
    },
    closeLeadsSidebar() {
      this.isLeadsSidebarOpen = false;
      const s = document.getElementById('zed-leads-sidebar');
      if (s) s.remove();
      const ov = document.getElementById('zed-leads-overlay');
      if (ov) ov.remove();
    },
    renderLeadsSidebar() {
      let overlay = document.getElementById('zed-leads-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'zed-leads-overlay';
        overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.15); z-index: 10001;';
        overlay.onclick = () => this.closeLeadsSidebar();
        document.body.appendChild(overlay);
      }
      let sidebar = document.getElementById('zed-leads-sidebar');
      if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.id = 'zed-leads-sidebar';
        document.body.appendChild(sidebar);
      }
      const activeCount = Object.values(this.sources).filter(Boolean).length;
      sidebar.style.cssText = 'position: fixed; top: 0; right: 0; width: 480px; max-width: 92vw; height: 100vh; background: #fff; z-index: 10002; box-shadow: -8px 0 24px rgba(0,0,0,0.12); border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden;';
      sidebar.innerHTML = `
        <div style="height: 48px; border-bottom: 1px solid #ebebeb; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: #18181b;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: #e0f2fe; color: #0284c7;">⚡</span>
            <span>+ Leads — Scrape</span>
            <span style="font-size: 12px; color: #71717a; font-weight: 400;">· ${this.leads.length}</span>
          </div>
          <button onclick="window.ZedLeads.closeLeadsSidebar()" style="background: transparent; border: none; font-size: 18px; cursor: pointer; color: #71717a; padding: 4px 8px;">✕</button>
        </div>
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow: auto; flex: 1;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Industry</label><input type="text" value="${this.industry.replace(/"/g,'&quot;')}" oninput="window.ZedLeads.industry=this.value" placeholder="e.g. Dentist" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" /></div>
            <div><label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Max</label><select onchange="window.ZedLeads.maxResults=this.value" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; background: #fff;"><option value="10" ${this.maxResults==10?'selected':''}>10</option><option value="25" ${this.maxResults==25?'selected':''}>25</option><option value="50" ${this.maxResults==50?'selected':''}>50</option><option value="100" ${this.maxResults==100?'selected':''}>100</option></select></div>
            <div><label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">City</label><input type="text" value="${this.city.replace(/"/g,'&quot;')}" oninput="window.ZedLeads.city=this.value; window.ZedLeads.location=this.value" placeholder="Chennai" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" /></div>
            <div><label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Place</label><input type="text" value="${this.place.replace(/"/g,'&quot;')}" oninput="window.ZedLeads.place=this.value" placeholder="e.g. Anna Nagar" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" /></div>
          </div>
          <div><label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Keywords (comma)</label><input type="text" value="${this.keywords.replace(/"/g,'&quot;')}" oninput="window.ZedLeads.keywords=this.value" placeholder="dentist, plumber, real estate" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" /></div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px;">Sources (${activeCount} selected)</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px;">
              ${Object.entries({googlemaps:'Google Maps',reddit:'Reddit',indeed:'Indeed',x:'X (Twitter)',instagram:'Instagram',facebook:'Facebook',linkedin:'LinkedIn'}).map(([k,label])=>`<label style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid ${this.sources[k]?'#2563eb':'#e5e7eb'}; background: ${this.sources[k]?'#eff6ff':'#fff'}; border-radius: 6px; cursor: pointer;"><input type="checkbox" ${this.sources[k]?'checked':''} onchange="window.ZedLeads.sources['${k}']=this.checked; window.ZedLeads.renderLeadsSidebar()" style="cursor: pointer;" /> ${label}</label>`).join('')}
            </div>
          </div>
          <button onclick="window.ZedLeads.search()" style="background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; ${this.isLoading?'opacity:0.6; pointer-events:none':''}">
            ${this.isLoading ? '<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color: transparent; border-radius:50%; animation: spin 0.8s linear infinite;"></span> Scraping…' : 'Scrape All Sources — Unified &rarr;'}
          </button>
          <div style="display: flex; align-items: center; gap: 8px; margin: 2px 0; font-size: 12px; color: #71717a;"><span style="flex:1; height:1px; background:#e5e7eb"></span>OR<span style="flex:1; height:1px; background:#e5e7eb"></span></div>
          <label style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; background: #f8fafc;">
            <input type="file" accept=".csv,.json" style="display:none" onchange="window.ZedLeads.importCsv(event)">
            <span>📄 Import CSV / JSON — Manual (from local gosom at :8080)</span>
          </label>
          <div style="font-size: 11px; color: #94a3b8; text-align: center;">Export from <code>http://localhost:8080</code> → Download CSV → import here → Assign</div>
          ${this.statusMessage ? `<div style="padding: 8px 10px; font-size: 12px; font-weight: 500; border-radius: 6px; ${this.statusMessage.type==='success'?'background:#f0fdf4; color:#166534; border:1px solid #bbf7d0;':'background:#fef2f2; color:#991b1b; border:1px solid #fecaca;'}">${this.statusMessage.text}</div>` : ''}
          <div style="border-top: 1px solid #ebebeb; padding-top: 12px;">
            <div style="font-size: 12px; font-weight: 600; color: #18181b; margin-bottom: 8px;">Results — ${this.leads.length} ${this.isLoading?'(loading…)':''}</div>
            ${this.leads.length===0 ? `<div style="font-size: 12px; color: #71717a; text-align: center; padding: 24px 0;">No leads yet. Pick sources and Scrape.</div>` : `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;"><input type="checkbox" ${this.selectedLeads.size===this.leads.length && this.leads.length>0?'checked':''} onchange="window.ZedLeads.toggleSelectAll(); window.ZedLeads.renderLeadsSidebar()" /> Select all (${this.selectedLeads.size}/${this.leads.length})</label>
                <span style="margin-left: auto; font-size: 12px; color: #71717a;">Assign to</span>
                <select onchange="window.ZedLeads.selectedMemberId=this.value" style="font-size: 12px; padding: 4px 6px; border-radius: 6px; border: 1px solid #cbd5e1;">
                  ${this.members.map(m=>`<option value="${m.id}" ${this.selectedMemberId===m.id?'selected':''}>${[m.nameFirstName,m.nameLastName].filter(Boolean).join(' ')||m.userEmail}</option>`).join('')}
                </select>
                <button onclick="window.ZedLeads.assignSelected(); setTimeout(()=>window.ZedLeads.renderLeadsSidebar(),400)" style="background: #18181b; color: #fff; border: none; border-radius: 20px; padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer;">Assign →</button>
              </div>
              <div style="max-height: 38vh; overflow: auto; border: 1px solid #ebebeb; border-radius: 8px;">
                ${this.leads.map((lead, i)=>`
                  <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid #f4f4f5; font-size: 12px; ${this.selectedLeads.has(i)?'background:#f4f4f5':''}">
                    <input type="checkbox" ${this.selectedLeads.has(i)?'checked':''} onchange="window.ZedLeads.toggleSelect(${i}); window.ZedLeads.renderLeadsSidebar()" />
                    <span style="font-weight: 600; color: #18181b; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lead.name}</span>
                    <span style="background: #e0f2fe; color: #0284c7; padding: 1px 4px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${lead.source||'—'}</span>
                    <span style="color: #71717a; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lead.phone||'—'}</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;
    },

    getSidebarWidth() {
      const sidebarItem = document.getElementById('zed-leads-sidebar-item');
      if (sidebarItem) {
        const rect = sidebarItem.getBoundingClientRect();
        if (rect.right > 50 && rect.right < 320) {
          return rect.right;
        }
      }
      const sidebars = document.querySelectorAll('aside, nav, [class*="NavigationDrawer"]');
      for (const s of sidebars) {
        const r = s.getBoundingClientRect();
        if (r.width > 50 && r.width < 320) return r.right > 0 ? r.right : r.width;
      }
      return 200;
    },

    render() {
      let view = document.getElementById('zed-leads-dashboard-view');
      if (!view) {
        view = document.createElement('div');
        view.id = 'zed-leads-dashboard-view';
        document.body.appendChild(view);
      }

      if (!this.isOpen) {
        view.innerHTML = '';
        return;
      }

      const selectedCount = this.selectedLeads.size;
      const totalCount = this.leads.length;
      const sidebarWidth = this.getSidebarWidth();

      view.innerHTML = `
        <div style="position: fixed; top: 0; left: ${sidebarWidth}px; width: calc(100vw - ${sidebarWidth}px); height: 100vh; background: #ffffff; border-radius: 12px 0 0 0; box-shadow: -4px 0 4px 0 rgba(0,0,0,0.02), 0 0 0 1px #e5e7eb; z-index: 10000; display: flex; flex-direction: column; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          
          <!-- 1. Top Header Bar (1:1 Exact Match with Opportunities / Notes / People Header) -->
          <div style="height: 48px; border-bottom: 1px solid #ebebeb; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: #ffffff; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: #e0f2fe; color: #0284c7;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </span>
              <span style="font-weight: 600; font-size: 15px; color: #18181b;">Leads</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px;">
              <button onclick="window.ZedLeads.isScraperModalOpen = true; window.ZedLeads.render();" style="background: #2563eb; color: #ffffff; border: none; border-radius: 6px; padding: 0 14px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; height: 32px; box-shadow: 0 1px 2px rgba(37,99,235,0.2);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>New Scrape</span>
              </button>
            </div>
          </div>

          <!-- 2. Sub-Header View Controls Bar (1:1 Match with Opportunities Sub-Header) -->
          <div style="height: 38px; border-bottom: 1px solid #ebebeb; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: #ffffff; flex-shrink: 0; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 6px; color: #18181b; font-weight: 500; cursor: pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <span>All Leads</span>
              <span style="color: #71717a; font-weight: 400;">· ${totalCount}</span>
              <span style="font-size: 11px; color: #a1a1aa; margin-left: 2px;">⌄</span>
            </div>

            <div style="display: flex; align-items: center; gap: 14px; color: #71717a; font-size: 12px; font-weight: 500;">
              <span onclick="window.ZedLeads.isScraperModalOpen = true; window.ZedLeads.render();" style="cursor: pointer; display: flex; align-items: center; gap: 4px;">Filter</span>
              <span style="cursor: pointer; display: flex; align-items: center; gap: 4px;">Sort</span>
              <span style="cursor: pointer; display: flex; align-items: center; gap: 4px;">Options</span>
            </div>
          </div>

          ${this.statusMessage ? `
            <div style="padding: 6px 16px; font-size: 12px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; ${this.statusMessage.type === 'success' ? 'background: #f0fdf4; color: #166534; border-bottom: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #991b1b; border-bottom: 1px solid #fecaca;'}">
              <span>${this.statusMessage.text}</span>
              <span onclick="window.ZedLeads.statusMessage = null; window.ZedLeads.render();" style="cursor: pointer; font-weight: bold; padding: 0 4px;">&times;</span>
            </div>
          ` : ''}

          <!-- 3. Exact Zed Table Component -->
          <div style="flex: 1; overflow: auto; background: #ffffff; position: relative;">
            ${this.isLoading && this.leads.length === 0 ? `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 320px; color: #71717a;">
                <span style="display:inline-block; width:22px; height:22px; border:2px solid #e4e4e7; border-top-color:#18181b; border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom: 12px;"></span>
                <div style="font-size: 13px; font-weight: 500; color: #18181b;">Extracting live business listings from Google Maps...</div>
              </div>
            ` : this.leads.length === 0 ? `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 320px; color: #71717a;">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" stroke-width="1.5" style="margin-bottom: 12px;">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
                <div style="font-size: 14px; font-weight: 600; color: #18181b;">No leads loaded yet</div>
                <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Click "+ New Scrape" to search Google Maps.</div>
              </div>
            ` : `
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; table-layout: fixed;">
                <thead>
                  <tr style="border-bottom: 1px solid #ebebeb; background: #ffffff; color: #71717a; font-weight: 500; font-size: 12px; height: 32px; user-select: none; position: sticky; top: 0; z-index: 10;">
                    <th style="padding: 0 10px; width: 34px; border-right: 1px solid #ebebeb; text-align: center;">
                      <input type="checkbox" ${selectedCount === totalCount && totalCount > 0 ? 'checked' : ''} onchange="window.ZedLeads.toggleSelectAll()" style="cursor: pointer; width: 14px; height: 14px; border-radius: 4px;" />
                    </th>
                    <th style="padding: 0 12px; border-right: 1px solid #ebebeb; width: 220px;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                        <span>Name</span>
                      </span>
                    </th>
                    <th style="padding: 0 12px; border-right: 1px solid #ebebeb; width: 140px;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>
                        <span>Category</span>
                      </span>
                    </th>
                    <th style="padding: 0 12px; border-right: 1px solid #ebebeb; width: 140px;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span>Phones</span>
                      </span>
                    </th>
                    <th style="padding: 0 12px; border-right: 1px solid #ebebeb; width: 180px;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        <span>Website</span>
                      </span>
                    </th>
                    <th style="padding: 0 12px; border-right: 1px solid #ebebeb; width: 220px;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>Address</span>
                      </span>
                    </th>
                    <th style="padding: 0 12px; border-right: 1px solid #ebebeb; width: 90px;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span>Rating</span>
                      </span>
                    </th>
                    <th style="padding: 0 12px; border-right: 1px solid #ebebeb; width: 140px;">
                      <span style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        <span>Status</span>
                      </span>
                    </th>
                    <th style="padding: 0 8px; width: 32px; text-align: center; color: #a1a1aa; cursor: pointer;">
                      +
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${this.leads.map((lead, idx) => {
                    const isSelected = this.selectedLeads.has(idx);
                    return `
                      <tr style="border-bottom: 1px solid #ebebeb; height: 32px; ${isSelected ? 'background: #f4f4f5;' : 'background: #ffffff;'} transition: background 0.05s ease;" onmouseenter="if(!${isSelected}) this.style.background='#fafafa'" onmouseleave="if(!${isSelected}) this.style.background='#ffffff'">
                        <td style="padding: 0 10px; border-right: 1px solid #ebebeb; text-align: center;">
                          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="window.ZedLeads.toggleSelect(${idx})" style="cursor: pointer; width: 14px; height: 14px; border-radius: 4px;" />
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #ebebeb; font-weight: 500; color: #18181b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${lead.name}
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #ebebeb; color: #52525b; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${lead.industry}
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #ebebeb; color: #3f3f46; font-family: ui-monospace, monospace; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${lead.phone || '<span style="color:#a1a1aa; font-family: sans-serif;">—</span>'}
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #ebebeb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${lead.website ? `<a href="${lead.website}" target="_blank" style="color: #2563eb; text-decoration: none; font-size: 12px;">${lead.website.replace(/https?:\/\//, '').replace(/\/.*$/, '')}</a>` : '<span style="color:#a1a1aa;">—</span>'}
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #ebebeb; color: #52525b; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${[lead.street, lead.city].filter(Boolean).join(', ')}
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #ebebeb; color: #18181b; font-size: 12px; font-weight: 500;">
                          <span style="color: #f59e0b;">★</span> ${lead.rating} <span style="font-size: 11px; color: #71717a; font-weight: 400;">(${lead.reviewsCount})</span>
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #ebebeb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${lead.isDuplicate ? `
                            <span style="display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                              ⚠ In CRM
                            </span>
                          ` : `
                            <span style="display: inline-flex; align-items: center; gap: 4px; background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                              ✓ Available
                            </span>
                          `}
                        </td>
                        <td style="padding: 0 8px; text-align: center;"></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <!-- Bottom Add New & Calculation Strip (Exact 1:1 Match with Opportunities Footer) -->
              <div style="display: flex; align-items: center; gap: 16px; padding: 8px 16px; border-top: 1px solid #ebebeb; font-size: 13px; color: #71717a; background: #ffffff;">
                <span onclick="window.ZedLeads.isScraperModalOpen = true; window.ZedLeads.render();" style="cursor: pointer; color: #71717a; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                  + Add New
                </span>
                <div style="display: flex; align-items: center; gap: 4px; margin-left: 20px; font-size: 12px;">
                  <span>Calculate ⌄</span>
                </div>
              </div>
            `}
          </div>

          <!-- 4. Floating Bulk Actions Bar -->
          ${this.leads.length > 0 ? `
            <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: #18181b; color: #ffffff; padding: 6px 16px; border-radius: 28px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); display: flex; align-items: center; gap: 14px; z-index: 10001; font-size: 12px;">
              <span style="font-weight: 600;">${selectedCount} of ${totalCount} selected</span>
              <div style="width: 1px; height: 14px; background: rgba(255,255,255,0.2);"></div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: rgba(255,255,255,0.7);">Assign to:</span>
                <select id="zl-target-member" onchange="window.ZedLeads.selectedMemberId = this.value" style="background: #27272a; color: #ffffff; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 3px 8px; font-size: 12px; outline: none; cursor: pointer;">
                  ${this.members.map(m => `
                    <option value="${m.id}" ${this.selectedMemberId === m.id ? 'selected' : ''}>
                      ${[m.nameFirstName, m.nameLastName].filter(Boolean).join(' ') || m.userEmail}
                    </option>
                  `).join('')}
                </select>
              </div>
              <button onclick="window.ZedLeads.assignSelected()" ${this.isAssigning || selectedCount === 0 ? 'disabled' : ''} style="background: #ffffff; color: #18181b; border: none; border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; opacity: ${selectedCount === 0 ? 0.5 : 1};">
                ${this.isAssigning ? 'Assigning...' : 'Assign Leads &rarr;'}
              </button>
            </div>
          ` : ''}

        </div>

        <!-- 5. Native Scraper Configuration Modal -->
        ${this.isScraperModalOpen ? `
          <div id="zed-scraper-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="background: #ffffff; width: 100%; max-width: 480px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); border: 1px solid #e5e7eb; overflow: hidden;">
              <div style="padding: 16px 20px; border-bottom: 1px solid #ebebeb; display: flex; align-items: center; justify-content: space-between; background: #fafafa;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: #18181b;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: #e0f2fe; color: #0284c7;">⚡</span>
                  <span>Scrape Google Maps Leads</span>
                </div>
                <button onclick="window.ZedLeads.isScraperModalOpen = false; window.ZedLeads.render();" style="background: transparent; border: none; font-size: 16px; cursor: pointer; color: #71717a;">✕</button>
              </div>

              <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Campaign Name</label>
                  <input type="text" value="${this.campaignName}" oninput="window.ZedLeads.campaignName = this.value" placeholder="e.g. Chennai Dental Clinics Q3" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" />
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Industry / Keyword *</label>
                  <input type="text" value="${this.industry}" oninput="window.ZedLeads.industry = this.value" placeholder="e.g. Dentist, Real Estate, Plumber" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" />
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Location / City *</label>
                  <input type="text" value="${this.location}" oninput="window.ZedLeads.location = this.value" placeholder="e.g. Chennai, India" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" />
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">Max Results</label>
                  <select onchange="window.ZedLeads.maxResults = this.value" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #fff;">
                    <option value="10" ${this.maxResults == 10 ? 'selected' : ''}>10 leads</option>
                    <option value="25" ${this.maxResults == 25 ? 'selected' : ''}>25 leads</option>
                    <option value="50" ${this.maxResults == 50 ? 'selected' : ''}>50 leads</option>
                    <option value="100" ${this.maxResults == 100 ? 'selected' : ''}>100 leads</option>
                  </select>
                </div>
              </div>

              <div style="padding: 14px 20px; background: #fafafa; border-top: 1px solid #ebebeb; display: flex; justify-content: flex-end; gap: 8px;">
                <button onclick="window.ZedLeads.isScraperModalOpen = false; window.ZedLeads.render();" style="background: #ffffff; border: 1px solid #d4d4d8; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; color: #3f3f46;">Cancel</button>
                <button onclick="window.ZedLeads.search()" style="background: #2563eb; color: #ffffff; border: none; padding: 6px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Scrape Now &rarr;</button>
              </div>
            </div>
          </div>
        ` : ''}

        <style>
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        </style>
      `;
    }
  };

  window.ZedLeads = ZL;
  window.ZedLeadFinder = ZL;

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => ZL.init());
    setTimeout(() => ZL.init(), 300);
  }
})();
