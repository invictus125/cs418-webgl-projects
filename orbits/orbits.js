/**
 * Set up entity description data to be projected into the scene.
 */
var tetrahedron_data = {
    triangles: [
        [0,1,2],
        [0,2,3],
        [0,3,1],
        [1,2,3]
    ],
    attributes: [
        // Position
        [
            [1,1,1],
            [-1,-1,1],
            [-1,1,-1],
            [1,-1,-1]
        ],
        // Colors
        [
            [1,1,1],
            [0,0,1],
            [0,1,0],
            [1,0,0]
        ]
    ]
};

var octahedron_data = {
    triangles: [
        [0,1,2],
        [0,2,3],
        [0,3,4],
        [0,4,1],
        [5,1,4],
        [5,4,3],
        [5,3,2],
        [5,2,1]
    ],
    attributes: [
        // Position
        [
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,-1,0],
            [0,0,-1],
            [-1,0,0]
        ],
        // Colors
        [
            [1,0.5,0.5],
            [0.5,1,0.5],
            [0.5,0.5,1],
            [0.5,0,0.5],
            [0.5,0.5,0],
            [0,0.5,0.5]
        ]
    ]
};

/**
 * Resizes the canvas to the largest square the screen can hold
 */
function fillScreen() {
    let canvas = document.querySelector('canvas');
    document.body.style.margin = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    let size = Math.min(canvas.clientWidth, canvas.clientHeight);
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = '';
    canvas.style.height = '';
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height);
        window.perspective = m4perspNegZ(0.1, 10, 1.5, canvas.width, canvas.height);
    }
}

/**
 * Runs the animation using requestAnimationFrame.
 * 
 * @param {Number} milliseconds - milliseconds since web page loaded
 */
function tick(milliseconds) {
    const seconds = milliseconds / 1000;
    draw(seconds);
    requestAnimationFrame(tick);
}

/**
 * Creates matrices for each object and sends them into the GPU as uniforms.
 * Matrices will be based on the time elapsed in the animation.
 *
 * @param seconds The number of seconds into the animation we are
 */
function processMatrices(seconds) {
    var view = m4view([1,1.2,8], [0,0,0], [0,1,0]);
    gl.uniformMatrix4fv(program.uniforms.perspective, false, perspective);

    // Handle the animation of the sun
    var sunRotation = m4rotY(seconds * 2.0);
    var sunScale = m4scale(2.0, 2.0, 2.0);
    var sunMv = m4mul(view, sunRotation, sunScale);
    gl.uniformMatrix4fv(program.uniforms.sunmv, false, sunMv);
}

/**
 * Clears the screen, sends uniforms and input geometry, and asks the GPU to draw the frame
 *
 * @param {Number} seconds - the number of seconds since the animation began
 */
function draw(seconds) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program);
    gl.uniform1f(program.uniforms.seconds, seconds);

    gl.bindVertexArray(octahedron.vao);

    processMatrices(seconds);

    // Draw the sun
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);
}

/**
 * Fetches, reads, and compiles GLSL; sets globals, begins animation
 */
 async function setup() {
    window.gl = document.querySelector('canvas').getContext(
        'webgl2',
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    );
    gl.enable(gl.BLEND);
    const vs = await fetch('sunvs.glsl').then(res => res.text());
    const fs = await fetch('sunfs.glsl').then(res => res.text());
    window.program = compileShader(vs, fs);

    gl.enable(gl.DEPTH_TEST);

    window.octahedron = setupGeometry(octahedron_data);
    window.tetrahedron = setupGeometry(tetrahedron_data);
 
    fillScreen();
    window.addEventListener('resize', fillScreen);

    requestAnimationFrame(tick);
}

// Entry point for the animation program
window.addEventListener('load', setup);
