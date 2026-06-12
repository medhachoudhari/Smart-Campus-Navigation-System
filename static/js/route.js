/* ============================================================
   CampusSense AI — Route Finding UI
   Handles source/destination selection, API calls to find-route,
   result display, and Cytoscape graph highlighting.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await loadCampusData();
  initRouteUI();
});

async function loadCampusData() {
  try {
    const [locRes, routeRes] = await Promise.all([
      fetch('/api/locations?t=' + Date.now()),
      fetch('/api/routes?t=' + Date.now())
    ]);
    
    if (locRes.ok && routeRes.ok) {
      window.CAMPUS_LOCATIONS = await locRes.json();
      window.CAMPUS_EDGES = await routeRes.json();
    }
  } catch (err) {
    console.error("Failed to load campus data from API:", err);
  }
}

function initRouteUI() {
  const srcSelect = document.getElementById('src-select');
  const dstSelect = document.getElementById('dst-select');
  const findBtn   = document.getElementById('find-route-btn');
  const clearBtn  = document.getElementById('clear-route-btn');
  const wheelchair = document.getElementById('wheelchair-toggle');

  if (!srcSelect || !dstSelect) return;

  // Populate dropdowns from campus data
  populateDropdowns(srcSelect, dstSelect);

  // Initialize the Cytoscape graph
  if (typeof initCampusGraph === 'function') {
    initCampusGraph('cy');
  }

  // Populate quick-nav buttons
  populateQuickNav();

  // Find route button
  if (findBtn) {
    findBtn.addEventListener('click', async () => {
      const source = srcSelect.value;
      const destination = dstSelect.value;

      if (!source || !destination) {
        showToast('Please select both source and destination');
        return;
      }
      if (source === destination) {
        showToast('Source and destination cannot be the same');
        return;
      }

      const mode = wheelchair && wheelchair.checked ? 'accessible' : 'walking';
      await findRoute(source, destination, mode);
    });
  }

  // Clear route button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearResults();
      if (typeof clearRouteHighlight === 'function') {
        clearRouteHighlight();
      }
    });
  }
}

/* ---------- Populate Dropdowns ---------- */
function populateDropdowns(srcSelect, dstSelect) {
  const locations = window.CAMPUS_LOCATIONS || [];

  // Add placeholder options
  srcSelect.innerHTML = '<option value="">— Select Source —</option>';
  dstSelect.innerHTML = '<option value="">— Select Destination —</option>';

  locations.forEach(loc => {
    const opt1 = document.createElement('option');
    opt1.value = loc.id;
    opt1.textContent = loc.name;
    srcSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = loc.id;
    opt2.textContent = loc.name;
    dstSelect.appendChild(opt2);
  });

  // Default source to Main Gate
  srcSelect.value = 'main_gate';
}

/* ---------- Quick Navigation Buttons ---------- */
function populateQuickNav() {
  const container = document.getElementById('quick-nav');
  if (!container) return;

  const quickLocations = [
    'cse_dept', 'central_library', 'canteen', 'placement_cell',
    'auditorium', 'admin_block', 'parking_area', 'sports_ground',
  ];

  const locations = window.CAMPUS_LOCATIONS || [];

  quickLocations.forEach(locId => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;

    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.textContent = loc.name;
    btn.addEventListener('click', () => {
      findRoute('main_gate', locId, 'walking');
      // Update dropdowns
      const srcSelect = document.getElementById('src-select');
      const dstSelect = document.getElementById('dst-select');
      if (srcSelect) srcSelect.value = 'main_gate';
      if (dstSelect) dstSelect.value = locId;
    });
    container.appendChild(btn);
  });
}

/* ---------- Find Route via API ---------- */
async function findRoute(source, destination, mode = 'walking') {
  const findBtn = document.getElementById('find-route-btn');
  if (findBtn) {
    findBtn.disabled = true;
    findBtn.textContent = 'Computing...';
  }

  try {
    const response = await fetch('/api/find-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination, mode }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      showToast(err.error || 'No route found');
      return;
    }

    const result = await response.json();
    displayResults(result);

    // Highlight route on graph
    if (typeof highlightRoute === 'function') {
      highlightRoute(result.path);
    }

  } catch (err) {
    console.error('Route request failed:', err);
    showToast('Failed to compute route. Is the server running?');
  } finally {
    if (findBtn) {
      findBtn.disabled = false;
      findBtn.textContent = 'Find Route';
    }
  }
}

/* ---------- Display Route Results ---------- */
function displayResults(result) {
  const placeholder = document.getElementById('results-placeholder');
  const resultsCard = document.getElementById('results-data');

  if (placeholder) placeholder.classList.add('hidden');
  if (resultsCard) resultsCard.classList.remove('hidden');

  // Distance
  const distEl = document.getElementById('res-distance');
  if (distEl) distEl.textContent = result.distance;

  // Walking time
  const timeEl = document.getElementById('res-time');
  if (timeEl) timeEl.textContent = result.walking_time;

  // Nodes
  const nodesEl = document.getElementById('res-nodes');
  if (nodesEl) nodesEl.textContent = result.nodes;

  // Path sequence
  const pathEl = document.getElementById('res-path');
  if (pathEl && result.path) {
    const locations = window.CAMPUS_LOCATIONS || [];
    const pathNames = result.path.map(id => {
      const loc = locations.find(l => l.id === id);
      return loc ? loc.name : id;
    });
    pathEl.innerHTML = pathNames
      .map((name, i) => {
        if (i < pathNames.length - 1) {
          return `<span>${name}</span><span class="path-arrow">→</span>`;
        }
        return `<span>${name}</span>`;
      })
      .join('');
  }
}

/* ---------- Clear Results ---------- */
function clearResults() {
  const placeholder = document.getElementById('results-placeholder');
  const resultsCard = document.getElementById('results-data');

  if (placeholder) placeholder.classList.remove('hidden');
  if (resultsCard) resultsCard.classList.add('hidden');

  const distEl = document.getElementById('res-distance');
  const timeEl = document.getElementById('res-time');
  const nodesEl = document.getElementById('res-nodes');
  const pathEl = document.getElementById('res-path');

  if (distEl) distEl.textContent = '--';
  if (timeEl) timeEl.textContent = '--';
  if (nodesEl) nodesEl.textContent = '--';
  if (pathEl) pathEl.innerHTML = '';
}

/* ---------- Toast Notification ---------- */
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(244, 63, 94, 0.9);
    color: #fff;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 9999;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: fadeInUp 0.3s ease;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* Expose for external use */
window.findRoute = findRoute;
window.clearResults = clearResults;
