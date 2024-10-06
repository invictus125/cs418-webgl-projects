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
        window.perspective = m4perspNegZ(0.1, 15, 1.5, canvas.width, canvas.height);
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

    // Handle the animation of Sol
    var sunRotation = m4rotY(seconds * 2.0);
    var sunMv = m4mul(view, sunRotation);
    gl.uniformMatrix4fv(program.uniforms.mv, false, sunMv);
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);

    // Handle the animation of Earth
    var earthTranslateFactor = 3;
    var earthOrbitFactor = 1;
    var earthRotationFactor = 5;
    var earthRotation = m4rotY(seconds * earthRotationFactor);
    var earthScale = m4scale(0.37, 0.37, 0.37);
    var earthTrans = m4trans(earthTranslateFactor, 0, 0);
    var earthOrbitSun = m4rotY(seconds * earthOrbitFactor);
    var earthM = m4mul(earthOrbitSun, earthTrans, earthRotation, earthScale);
    var earthMv = m4mul(view, earthM);
    gl.uniformMatrix4fv(program.uniforms.mv, false, earthMv);
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);

    // Handle the animation of Mars
    var marsRotation = m4rotY(seconds * (earthRotationFactor / 2.2));
    var marsScale = m4scale(0.2, 0.2, 0.2);
    var marsTrans = m4trans(earthTranslateFactor * 1.6, 0, 0);
    var marsOrbitSun = m4rotY(seconds / (earthOrbitFactor * 1.9));
    var marsM = m4mul(marsOrbitSun, marsTrans, marsRotation, marsScale);
    var marsMv = m4mul(view, marsM);
    gl.uniformMatrix4fv(program.uniforms.mv, false, marsMv);
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);

    // Handle the animation of Luna
    var lunaScale = m4scale(0.3, 0.3, 0.3);
    var lunaRot = m4mul(m4rotZ(20), m4rotY(30), m4rotX(40))
    var lunaTrans = m4trans(2, 0, 0);
    var orbitEarth = m4rotY(seconds / 1.5);
    // var lunaMv = m4mul(view, earthM, orbitEarth, lunaTrans, lunaRot, lunaScale);
    var lunaMv = m4mul(view, earthOrbitSun, earthTrans, earthScale, orbitEarth, lunaTrans, lunaRot, lunaScale);
    gl.uniformMatrix4fv(program.uniforms.mv, false, lunaMv);
    gl.drawElements(tetrahedron.mode, tetrahedron.count, tetrahedron.type, 0);

    // Handle the animation of Phobos
    var phobosOrbitFactor = 0.1;
    var phobosScale = m4scale(0.4, 0.4, 0.4);
    var phobosRot = m4mul(m4rotZ(50), m4rotY(20), m4rotX(45))
    var phobosTrans = m4trans(2, 0, 0);
    var orbitMars = m4rotY(seconds / phobosOrbitFactor);
    var phobosMv = m4mul(view, marsM, orbitMars, phobosTrans, phobosRot, phobosScale);
    gl.uniformMatrix4fv(program.uniforms.mv, false, phobosMv);
    gl.drawElements(tetrahedron.mode, tetrahedron.count, tetrahedron.type, 0);
    
    // Handle the animation of Deimos
    var deimosOrbitFactor = 0.9;
    var deimosScale = m4scale(0.2, 0.2, 0.2);
    var deimosTrans = m4trans(4, 0, 0);
    var orbitMars = m4rotY(seconds / deimosOrbitFactor);
    var deimosMv = m4mul(view, marsM, orbitMars, deimosTrans, deimosScale);
    gl.uniformMatrix4fv(program.uniforms.mv, false, deimosMv);
    gl.drawElements(tetrahedron.mode, tetrahedron.count, tetrahedron.type, 0);
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
    const vs = await fetch('vs.glsl').then(res => res.text());
    const fs = await fetch('fs.glsl').then(res => res.text());
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
