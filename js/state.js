export let nodes = [];
export let edges = [];

export let edgeStartNode = null;
export let shiftPressed = false;
export let ctrlPressed = false;

export let lastTool = "select";
export let currentTool = "select";
export let selectedObject = null;


export function setEdgeStartNode() {
    edgeStartNode = null;
}

export function setShiftPressed() {
    shiftPressed = false;
}

export function setCtrlPressed() {
    ctrlPressed = false;
}

export function setLastTool(tool) {
    lastTool = "select";
}

export function setCurrentTool(tool) {
    currentTool = tool;
}

export function setSelectedObject() {
    selectedObject = null;
}
