/**
 * Set up entity description data to be projected into the scene.
 */
var tetrahedron = {
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

var octahedron = {
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
}

/**
 * Sends per-vertex data to the GPU and connects it to a VS input
 * 
 * @param data    a 2D array of per-vertex data (e.g. [[x,y,z,w],[x,y,z,w],...])
 * @param loc     the layout location of the vertex shader's `in` attribute
 * 
 * @returns the ID of the buffer in GPU memory; useful for changing data later
 */
function supplyDataBuffer(data, loc) {
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)
    
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

/**
 * Creates a Vertex Array Object and puts into it all of the data in the given
 * JSON structure, which should have the following form:
 * 
 * ````
 * {"triangles": a list of lists of indices of vertices
 * ,"attributes":
 *  [ a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 0
 *  , a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 1
 *  , ...
 *  ]
 * }
 * ````
 * 
 * @returns an object with four keys:
 *  - mode = the 1st argument for gl.drawElements
 *  - count = the 2nd argument for gl.drawElements
 *  - type = the 3rd argument for gl.drawElements
 *  - vao = the vertex array object for use with gl.bindVertexArray
 */
function setupGeometry(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let i=0; i < geom.attributes.length; i++) {
        let data = geom.attributes[i]
        supplyDataBuffer(data, i)
    }

    var indices = new Uint16Array(geom.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: triangleArray
    }
}

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
 * Compiles two shaders, links them together, looks up their uniform locations,
 * and returns the result. Reports any shader errors to the console.
 *
 * @param {string} vs_source - the source code of the vertex shader
 * @param {string} fs_source - the source code of the fragment shader
 * @return {WebGLProgram} the compiled and linked program
 */
function compile(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vs_source);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs));
        throw Error("Vertex shader compilation failed");
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fs_source);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs));
        throw Error("Fragment shader compilation failed");
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        throw Error("Linking failed");
    }
    
    const uniforms = {}
    for(let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i += 1) {
        let info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    program.uniforms = uniforms;

    return program;
}

/**
 * Creates matrices for each object and sends them into the GPU as uniforms.
 * Matrices will be based on the time elapsed in the animation.
 *
 * @param seconds The number of seconds into the animation we are
 */
function processMatrices(seconds) {
    // Handle the animation of the sun
    var sunRotation = zRotationMatrix(seconds, 2.0);
    var sunScale = scaleMatrix(2.0);
    gl.uniform4mat(program.uniforms.sunmatrix, matMul(sunScale, sunRotation));
}

/**
 * Clears the screen, sends uniforms and input geometry, and asks the GPU to draw the frame
 *
 * @param {Number} seconds - the number of seconds since the animation began
 */
function draw(seconds) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(program.uniforms.seconds, seconds);

    processMatrices(seconds);

    // TODO: Update geometry for orbital objects
    const connection = gl.TRIANGLES;
    gl.drawArrays(connection, 0, 6);
}

/**
 * Fetches, reads, and compiles GLSL; sets globals, begins animation
 */
 async function setup() {
    window.gl = document.querySelector('canvas').getContext('webgl2');
    gl.enable(gl.BLEND);
    const vs = await fetch('vs.glsl').then(res => res.text());
    const fs = await fetch('fs.glsl').then(res => res.text());
    window.program = compile(vs, fs);
 
    fillScreen();
    window.addEventListener('resize', fillScreen);

    tick(0);
}

// Entry point for the animation program
window.addEventListener('load', setup);
