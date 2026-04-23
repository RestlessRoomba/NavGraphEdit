// @ts-check
const { func } = require("joi");

let nodes = [];
let edges = [];
let selectedNode = null;

const map = L.map('map').setView([50.98720771879944, 12.973063896924302], 16)

function generateUUID() {
    return crypto.randomUUID();
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 23
}).addTo(map);

map.on('click', function(e) {
    createNode(e.latlng);
});

function createNode(latlng) {
    const node = {
        id: generateUUID(),
        type: "node",
        lat: latlng.lat,
        lng: latlng.lng,
    };
    nodes.push(node);
    console.log(nodes);
    addNodeToMap(node);
}

function addNodeToMap(node) {
    const marker = L.marker([node.lat, node.lng]).addTo(map);
    node.marker = marker;

    marker.on('click', function() {
        handleNodeClick(node);
    });
}

function handleNodeClick(node){
    if (selectedNode === null) {
        selectedNode = node;
        console.log("Selected start node: ", node.id);
        node.marker.bindPopup("Start").openPopup();

    } else {
        createEdge(selectedNode, node);
        selectedNode = null;
    }
}

function createEdge(nodeA, nodeB) {
    const edge = {
        id: generateUUID(),
        type: edge,
        from: nodeA.id,
        tto: nodeB.id
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
}
