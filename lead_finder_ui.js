// Zed Leads & Google Maps Lead Finder (1:1 Exact Match with Opportunities & Notes Table View)
(function () {
  const ZL = {
    isOpen: false,
    leads: [],
    selectedLeads: new Set(),
    members: [],
    selectedMemberId: '',
    campaignName: 'Chennai Business Campaign',
    industry: 'Real Estate Agency',
    location: 'Chennai',
    maxResults: 25,
    isLoading: false,
    isAssigning: false,
    statusMessage: null,
    isScraperModalOpen: false,

    async init() {
      await this.fetchMembers();
      this.injectSidebarItem();
      setInterval(() => this.injectSidebarItem(), 1000);

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
      if (!this.industry.trim() || !this.location.trim()) {
        alert('Please enter both Industry and Location.');
        return;
      }
      this.isLoading = true;
      this.statusMessage = null;
      this.render();

      try {
        const res = await fetch('/api/admin/leads/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignName: this.campaignName || `${this.industry} in ${this.location}`,
            industry: this.industry.trim(),
            location: this.location.trim(),
            maxResults: parseInt(this.maxResults, 10) || 25
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
      }
    },

    toggleSelectAll() {
      if (this.selectedLeads.size === this.leads.length) {
        this.selectedLeads.clear();
      } else {
        this.selectedLeads = new Set(this.leads.map((_, i) => i));
      }
      this.render();
    },

    toggleSelect(index) {
      if (this.selectedLeads.has(index)) {
        this.selectedLeads.delete(index);
      } else {
        this.selectedLeads.add(index);
      }
      this.render();
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
      }
    },

    injectSidebarItem() {
      const existingItems = document.querySelectorAll('.zed-leads-sidebar-row');
      if (existingItems.length > 1) {
        for (let i = 1; i < existingItems.length; i++) existingItems[i].remove();
      }
      if (existingItems.length === 1) {
        if (this.isOpen) this.updateSidebarHighlight(true);
        return;
      }

      let notesNode = null;
      const allSpans = document.querySelectorAll('span, div, a');
      for (let i = 0; i < allSpans.length; i++) {
        const el = allSpans[i];
        if (el.children.length === 0 && el.textContent && el.textContent.trim() === 'Notes') {
          if (el.closest('aside, nav, [class*="NavigationDrawer"], [class*="sauq8y3"], [class*="Item"]')) {
            notesNode = el;
            break;
          }
        }
      }

      if (!notesNode) return;

      let parentRow = notesNode;
      while (parentRow && parentRow.parentElement) {
        if (
          parentRow.className.includes('sauq8y3') ||
          parentRow.className.includes('NavigationDrawerItem') ||
          parentRow.tagName === 'LI' ||
          (parentRow.parentElement && parentRow.parentElement.children.length >= 3 && parentRow.parentElement.querySelector('a, div'))
        ) {
          break;
        }
        parentRow = parentRow.parentElement;
      }

      if (!parentRow || !parentRow.parentElement) return;

      const leadsRow = document.createElement(parentRow.tagName || 'div');
      leadsRow.className = parentRow.className + ' zed-leads-sidebar-row';
      leadsRow.id = 'zed-leads-sidebar-item';
      leadsRow.style.cssText = parentRow.style.cssText + '; cursor: pointer; user-select: none;';

      const innerLink = document.createElement('a');
      innerLink.id = 'zed-leads-link';
      innerLink.href = '#leads';
      innerLink.style.cssText = 'display: flex; align-items: center; width: 100%; height: 100%; padding: 6px 12px; border-radius: 6px; color: inherit; text-decoration: none; font-size: 13px; font-weight: 500; box-sizing: border-box; transition: background 0.1s ease;';
      innerLink.style.backgroundColor = this.isOpen ? 'rgba(0, 0, 0, 0.06)' : 'transparent';

      innerLink.innerHTML = `
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; margin-right: 8px; flex-shrink: 0; color: inherit; opacity: 0.85;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </span>
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px;">Leads</span>
      `;

      innerLink.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        ZL.open();
      };

      leadsRow.appendChild(innerLink);
      parentRow.parentElement.insertBefore(leadsRow, parentRow.nextSibling);
      if (this.isOpen) this.updateSidebarHighlight(true);
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

          <!-- 3. Exact Twenty CRM Table Component -->
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
