// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 500x500
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1.0);

// Start rendering
render();

// Render loop
function render() {
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);    
    // Draw something here

    const midWidth = Math.floor(canvas.width / 2); // rounding down to prevent flickering
    const midHeight = Math.floor(canvas.height / 2); // rounding down to prevent flickering

    gl.enable(gl.SCISSOR_TEST)
    // green
    colorScissor(0, midHeight, midWidth, canvas.height - midHeight, 0, 1, 0, 1);
    // red
    colorScissor(midWidth, midHeight, canvas.width - midWidth, canvas.height - midHeight, 1, 0, 0, 1);
    // blue
    colorScissor(0, 0, midWidth, midHeight, 0, 0, 1, 1);
    // yellow
    colorScissor(midWidth, 0, canvas.width - midWidth, midHeight, 1, 1, 0, 1);

    gl.clearColor(0, 0, 0, 1.0);
    gl.disable(gl.SCISSOR_TEST);
}

function colorScissor(x, y, width, height, colorR, colorG, colorB, colorA) {
    gl.scissor(x, y, width, height);
    gl.clearColor(colorR, colorG, colorB, colorA);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    const min = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = min;
    canvas.height = min;

    render();
});

