/* ============================================================
   CampusSense AI — Campus Graph Visualization with Cytoscape.js
   Renders the BIET campus as an interactive graph with nodes
   for buildings and edges for walking pathways.
   ============================================================ */

/* ---------- Campus Data ---------- */
// These will be populated from the database via /api/locations and /api/routes
window.CAMPUS_LOCATIONS = window.CAMPUS_LOCATIONS || [];
window.CAMPUS_EDGES = window.CAMPUS_EDGES || [];

/* Color map by building type */
const TYPE_COLORS = {
  entrance:   '#f59e0b',
  admin:      '#ec4899',
  library:    '#10b981',
  department: '#3b82f6',
  office:     '#06b6d4',
  facility:   '#8b5cf6',
  parking:    '#64748b',
  ground:     '#22c55e',
};

/* ---------- Global state ---------- */
let cy = null;
let currentHighlight = [];

/* ---------- Initialize Cytoscape Graph ---------- */
function initCampusGraph(containerId = 'cy') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('Cytoscape container not found:', containerId);
    return null;
  }

  // Build Cytoscape elements
  const nodes = CAMPUS_LOCATIONS.map(loc => ({
    data: {
      id: loc.id,
      label: loc.name,
      type: loc.type,
      color: TYPE_COLORS[loc.type] || '#3b82f6',
    },
    position: { x: loc.x, y: loc.y },
  }));

  const edges = CAMPUS_EDGES.map((edge, i) => ({
    data: {
      id: `e${i}`,
      source: edge.source,
      target: edge.destination || edge.target,
      distance: edge.distance,
      accessible: edge.wheelchair_accessible !== undefined ? edge.wheelchair_accessible : edge.accessible,
      label: `${edge.distance}m`,
    },
  }));

  cy = cytoscape({
    container: container,
    elements: { nodes, edges },
    layout: { name: 'preset' },
    style: [
      // --- Node Style ---
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': 'data(color)',
          'border-width': 2,
          'border-color': 'data(color)',
          'border-opacity': 0.4,
          'width': 40,
          'height': 40,
          'font-size': '9px',
          'font-family': 'Inter, system-ui, sans-serif',
          'font-weight': 600,
          'color': '#c8d1de',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 8,
          'text-outline-width': 2,
          'text-outline-color': '#0a0e1a',
          'text-outline-opacity': 0.8,
          'text-wrap': 'wrap',
          'text-max-width': '90px',
          'transition-property': 'background-color, border-color, width, height, border-width',
          'transition-duration': '0.25s',
          'shadow-blur': 15,
          'shadow-color': 'data(color)',
          'shadow-opacity': 0.2,
          'overlay-padding': 6,
        },
      },
      // Active / selected node
      {
        selector: 'node:active, node:selected',
        style: {
          'border-width': 4,
          'border-color': '#00d4aa',
          'shadow-opacity': 0.5,
          'shadow-blur': 25,
        },
      },
      // --- Edge Style ---
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': 'rgba(255, 255, 255, 0.1)',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '7px',
          'font-family': 'Inter, system-ui, sans-serif',
          'color': 'rgba(255, 255, 255, 0.25)',
          'text-rotation': 'autorotate',
          'text-outline-width': 1.5,
          'text-outline-color': '#0a0e1a',
          'text-outline-opacity': 0.9,
          'transition-property': 'line-color, width, opacity',
          'transition-duration': '0.3s',
          'overlay-padding': 4,
        },
      },
      // Inaccessible edges — dashed
      {
        selector: 'edge[?accessible = false]',
        style: {
          'line-style': 'dashed',
          'line-dash-pattern': [6, 4],
          'line-color': 'rgba(244, 63, 94, 0.25)',
        },
      },
      // Inaccessible edge selector via data attribute
      {
        selector: 'edge[accessible = "false"]',
        style: {
          'line-style': 'dashed',
          'line-dash-pattern': [6, 4],
          'line-color': 'rgba(244, 63, 94, 0.25)',
        },
      },
      // Route highlight classes
      {
        selector: '.route-edge',
        style: {
          'line-color': '#00d4aa',
          'width': 4,
          'z-index': 10,
          'shadow-blur': 10,
          'shadow-color': '#00d4aa',
          'shadow-opacity': 0.4,
          'label': 'data(label)',
          'color': '#00d4aa',
        },
      },
      {
        selector: '.route-node',
        style: {
          'background-color': '#00d4aa',
          'border-color': '#00d4aa',
          'border-width': 3,
          'width': 50,
          'height': 50,
          'shadow-opacity': 0.6,
          'shadow-blur': 30,
          'shadow-color': '#00d4aa',
          'color': '#ffffff',
          'font-weight': 700,
          'z-index': 10,
        },
      },
      {
        selector: '.route-start',
        style: {
          'background-color': '#10b981',
          'border-color': '#10b981',
          'shadow-color': '#10b981',
        },
      },
      {
        selector: '.route-end',
        style: {
          'background-color': '#f59e0b',
          'border-color': '#f59e0b',
          'shadow-color': '#f59e0b',
        },
      },
    ],
    // Interaction settings
    minZoom: 0.3,
    maxZoom: 3,
    wheelSensitivity: 0.15,
    boxSelectionEnabled: false,
    autounselectify: true,
  });

  // Fit the graph into view with padding
  cy.fit(undefined, 50);

  // --- Hover tooltip via Cytoscape popper or manual approach ---
  cy.on('mouseover', 'node', (evt) => {
    const node = evt.target;
    const tipEl = document.getElementById('cy-tooltip');
    if (tipEl) {
      tipEl.textContent = node.data('label');
      tipEl.style.display = 'block';
    }
    container.style.cursor = 'pointer';
  });

  cy.on('mouseout', 'node', () => {
    const tipEl = document.getElementById('cy-tooltip');
    if (tipEl) tipEl.style.display = 'none';
    container.style.cursor = 'default';
  });

  cy.on('mousemove', (evt) => {
    const tipEl = document.getElementById('cy-tooltip');
    if (tipEl && tipEl.style.display === 'block') {
      tipEl.style.left = (evt.originalEvent.offsetX + 14) + 'px';
      tipEl.style.top  = (evt.originalEvent.offsetY + 14) + 'px';
    }
  });

  // Node click handler — show building details
  cy.on('tap', 'node', (evt) => {
    const nodeId = evt.target.id();
    showBuildingDetails(nodeId);
  });

  return cy;
}

/* ---------- Show Building Details ---------- */
function showBuildingDetails(nodeId) {
  const loc = CAMPUS_LOCATIONS.find(l => l.id === nodeId);
  if (!loc) return;

  const panel = document.getElementById('building-details');
  if (!panel) return;

  const connections = CAMPUS_EDGES.filter(
    e => e.source === nodeId || e.target === nodeId
  );

  const connList = connections.map(e => {
    const otherId = e.source === nodeId ? e.target : e.source;
    const other = CAMPUS_LOCATIONS.find(l => l.id === otherId);
    return `<div class="info-row"><span>${other ? other.name : otherId}</span><span>${e.distance}m</span></div>`;
  }).join('');

  panel.innerHTML = `
    <h5>${loc.name}</h5>
    <div class="info-row"><span>Type</span><span style="text-transform:capitalize">${loc.type}</span></div>
    <div style="margin-top:10px;font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Connected to</div>
    ${connList}
    <button class="btn btn-primary mt-2" style="width:100%" onclick="setDestination('${loc.id}')">Navigate Here</button>
  `;
}

/* ---------- Highlight Route on Graph ---------- */
function highlightRoute(path) {
  clearRouteHighlight();

  if (!cy || !path || path.length < 2) return;

  // Highlight nodes
  path.forEach((nodeId, idx) => {
    const node = cy.getElementById(nodeId);
    if (node.length) {
      node.addClass('route-node');
      if (idx === 0) node.addClass('route-start');
      if (idx === path.length - 1) node.addClass('route-end');
      currentHighlight.push(node);
    }
  });

  // Highlight edges
  for (let i = 0; i < path.length - 1; i++) {
    const src = path[i];
    const tgt = path[i + 1];

    // Find the edge between these nodes
    const edge = cy.edges().filter(e => {
      const s = e.data('source');
      const t = e.data('target');
      return (s === src && t === tgt) || (s === tgt && t === src);
    });

    if (edge.length) {
      edge.addClass('route-edge');
      currentHighlight.push(edge);
    }
  }

  // Fit view to route with animation
  const routeNodes = cy.collection();
  path.forEach(id => {
    const n = cy.getElementById(id);
    if (n.length) routeNodes.merge(n);
  });

  if (routeNodes.length) {
    cy.animate({
      fit: { eles: routeNodes, padding: 80 },
      duration: 600,
      easing: 'ease-in-out-cubic',
    });
  }
}

/* ---------- Clear Route Highlight ---------- */
function clearRouteHighlight() {
  if (!cy) return;

  cy.elements().removeClass('route-node route-start route-end route-edge');
  currentHighlight = [];
  cy.animate({
    fit: { padding: 50 },
    duration: 400,
  });
}

/* ---------- Set destination from building click ---------- */
function setDestination(locId) {
  const dstSelect = document.getElementById('dst-select');
  if (dstSelect) {
    dstSelect.value = locId;
  }
}

/* ---------- Expose globals ---------- */
window.CAMPUS_LOCATIONS = CAMPUS_LOCATIONS;
window.CAMPUS_EDGES = CAMPUS_EDGES;
window.initCampusGraph = initCampusGraph;
window.highlightRoute = highlightRoute;
window.clearRouteHighlight = clearRouteHighlight;
window.showBuildingDetails = showBuildingDetails;
window.setDestination = setDestination;
