let nodes = [];
let edges = [];
let edgeStartNode = null;
let shiftPressed = false;
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
    const marker = L.marker([node.lat, node.lng]).addTo(map);
    node.marker = marker;
    setMarkerEditMode(true);

    marker.on('click', function() { // Click on Marker
        if (currentTool === "select") { // Node selection
            selectNode(node);

        } else if (currentTool === "node") {    // Ignore marker click in tool "node"
            return;

        } else if (currentTool === "edge") {  // Edge creation
            handleEdgeCreation(node);
        }
    });
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
function createEdge(nodeA, nodeB) { // dont create edges from node to itself
    if (nodeA.id === nodeB.id) {
        console.log("Cant connect a node to itself. Abort.")
        return;
    };  

    const edge = {
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

// Info Panel
function showInfoPanel(obj) {
    if (obj.type === "node") {
        console.log("UUID: ", obj.id);
        console.log("Lat: ", obj.lat);
        console.log("Lng: ", obj.lng);
    }

    if (obj.type === "edge") {
        console.log("UUID: ", obj.id);
        console.log("From: ", obj.from);
        console.log("To: ", obj.to);
    }
}

// Tool Switching
function setTool(tool) {
    currentTool = tool;

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
