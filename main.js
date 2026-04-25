let nodes = [];
let edges = [];
let edgeStartNode = null;
let shiftPressed = false;
let ctrlPressed = false;
let lastTool = "select";
let currentTool = "select";
let selectedObject = null;

const map = L.map('map').setView([50.98720771879944, 12.973063896924302], 16)   // Init map

function generateUUID() {   // UUID generator
    return crypto.randomUUID();
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{  // Tile layer
    maxZoom: 19 // 19 is max supported by OpenStreetMap
}).addTo(map);

map.on('click', function(e) {   // Click on Map
    if (currentTool === "node") {   // Node tool?
        createNode(e.latlng);
    }
});

setTool("select");

function createNode(latlng) {
    const node = {
        id: generateUUID(),
        type: "node",
        lat: latlng.lat,
        lng: latlng.lng,
    };
    nodes.push(node)
    console.log(nodes);
    addNodeToMap(node);
}

// Node selection
function selectNode(node) {
    selectedObject = node;
    console.log("Selected node: ", node.id);
    showInfoPanel(node);
}

function addNodeToMap(node) {
    const marker = L.marker([node.lat, node.lng], {
        draggable: false
    }).addTo(map);
    node.marker = marker;
    
    setTimeout(() => {
    const el = marker.getElement();
    if (el && currentTool === "node") {
        el.classList.add('transparent');
        el.classList.add('no-click');
    }
    }, 0);

    marker.on('click', function() { // Click on Marker
        if (currentTool === "select") { // Node selection
            selectNode(node);

        } else if (currentTool === "node") {    // Ignore marker click in tool "node"
            return;

        } else if (currentTool === "edge") {  // Edge creation
            handleEdgeCreation(node);
        }
    });

    // Node Drag&Drop
    marker.on('drag', function(e) {
        if (!ctrlPressed || currentTool !== "select") return;   // Only with ctrl down and in select tool

        const latlng = e.target.getLatLng();
        node.lat = latlng.lat;
        node.lng = latlng.lng;
        updateConnectedEdges(node);
    });
}

// Update edges dynamically upong node drag&drop
function updateConnectedEdges(node) {
    edges.forEach(edge => {
        if (edge.from === node.id || edge.to === node.id) { // Find every edge that is connected to this node
            const nodeA = nodes.find(n => n.id === edge.from);  // For these edges, find both connected nodes
            const nodeB = nodes.find(n => n.id === edge.to);

            if (!nodeA || !nodeB) return;   // Safety

            const newLatLngs = [    // set new LatLngs
                [nodeA.lat, nodeA.lng],
                [nodeB.lat, nodeB.lng]
            ];

            edge.line.setLatLngs(newLatLngs);
        }
    })
}

// Edge Creation
function handleEdgeCreation(node) {
    if (edgeStartNode === null) {   // Case of first node
        edgeStartNode = node;
        console.log("Edge Start: ", node.id);
    } else {    // Case of second node
        createEdge(edgeStartNode, node);
        edgeStartNode = null;
    }
}

// Edge Creation
function createEdge(nodeA, nodeB) { 
    if (nodeA.id === nodeB.id) {    // Don't create edges from node to itself
        console.log("Can't connect a node to itself. Abort.")
        return;
    };

    const exists = edges.some(edge =>   // Boolean exists is true when (some returns true when edge is found)
    (edge.from === nodeA.id && edge.to === nodeB.id) || // edge already exists or
    (edge.from === nodeB.id && edge.to === nodeA.id)    // reversed edge already exists
    );

    if (exists) {   // Don't create edges that already exist
        console.log("Edge already exists. Abort");
        return;
    }

    const edge = {  // Create edge
        id: generateUUID(),
        type: "edge",
        from: nodeA.id,
        to: nodeB.id
    };

    edges.push(edge);
    addEdgeToMap(nodeA, nodeB, edge);
    console.log(edges);
}

function addEdgeToMap(nodeA, nodeB, edge) {
    const latlngs = [
        [nodeA.lat, nodeA.lng],
        [nodeB.lat, nodeB.lng]
    ];

    const line = L.polyline(latlngs, {
        color: 'blue'
    }).addTo(map);

    edge.line = line;

    line.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (currentTool === "select") {
            selectEdge(edge);
        }
    })
}

// Edge selection
function selectEdge(edge) {
    selectedObject = edge;
    console.log("Selected Edge: ", edge.id);
    showInfoPanel(edge);
}

function setMarkerEditMode(active) {    // activated by Shift-Key-Listener -> UI
    nodes.forEach(node => {
        const el = node.marker.getElement();

        if (!el) return;    // in case of no markers

        if (active) {
            el.classList.add('transparent');
            el.classList.add('no-click');
        } else {
            el.classList.remove('transparent');
            el.classList.remove('no-click');
        }
    });
}

// Shift Key Listener (Shortcut)
document.addEventListener('keydown', function(e) {  // Shift is down?
    if (e.key === 'Shift' && !shiftPressed) {
        shiftPressed = true;    // flip
        lastTool = currentTool; // save current tool
        setTool("node");
    }
});

document.addEventListener('keyup', function(e) {    // Shift is up?
    if (e.key === 'Shift') {
        shiftPressed = false;   // flip and
        setTool(lastTool); // switch back to last used tool
    }
});

// Ctrl Key Listener (Drag&Drop)
document.addEventListener('keydown', function(e) {  // Control is down?
    if (e.key === 'Control') {
        ctrlPressed = true; // flip

        if (currentTool === "select") {
            map.getContainer().style.cursor = 'move';   // Cursor UI move
            nodes.forEach(n => n.marker.dragging.enable()); // Enable dragging for each marker
        }
    }
});

document.addEventListener('keyup', function(e) {    // Control is up?
    if (e.key === 'Control') {
        ctrlPressed = false;    // flip
        map.getContainer().style.cursor = '';   // Cursor UI default
        nodes.forEach(n => n.marker.dragging.disable()); // Disable dragging for each marker
    }
});

// Tool Switching
function setTool(tool) {
    currentTool = tool;
    edgeStartNode = null;
    selectedObject = null;
    hideInfoPanel();

    if (tool === "select") {
        map.getContainer().style.cursor = '';   // Cursor UI -> default
        setMarkerEditMode(false);   // leave Marker-Edit-Mode

    } else if (tool === "node") {
        map.getContainer().style.cursor = 'crosshair';  // Cursor UI -> crosshair
        setMarkerEditMode(true);    // enter Marker-Edit-Mode

    } else if (tool === "edge") {
        map.getContainer().style.cursor = '';   // Cursor UI -> default
        setMarkerEditMode(false);   // leave Marker-Edit-Mode

    }

    document.querySelectorAll('#toolbar button').forEach(btn => btn.classList.remove('active'));    // UI -> Deactivate every button
    document.getElementById(`tool-${tool}`).classList.add('active');    // UI -> Activate current tool
    console.log("Tool switched to: ", tool);
}

    // Upon click: call setTool(tool)
document.getElementById("tool-select").onclick = () => setTool("select");
document.getElementById("tool-node").onclick = () => setTool("node");
document.getElementById("tool-edge").onclick = () => setTool("edge");

// Info Panel
function showInfoPanel(obj) {

    // Define objects via html reference
    const panel = document.getElementById("info-panel");
    const title = document.getElementById("info-title");
    const content = document.getElementById("info-content");

    panel.classList.remove("hidden");   // show

    if (obj.type === "node") {  // For Nodes
        title.textContent = "Node";

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>Lat: ${obj.lat}</div>
            <div>Lng: ${obj.lng}</div>
        `;
    }

    if (obj.type === "edge") {  // For Edges
        title.textContent = "Edge";

        content.innerHTML = `
            <div>UUID: ${obj.id}</div>
            <div>From: ${obj.from}</div>
            <div>To: ${obj.to}</div>
        `;
    }
}

    // Hide Info Panel
function hideInfoPanel() {
    document.getElementById('info-panel').classList.add("hidden"); // hide
}

    // Delete Button
document.getElementById('delete-btn').onClick = function() {
    if (!selectedObject) return;    // Safety, only delete selected objects
    console.log("Delete: ", selectedObject.id);
};
