/**
 * Takes a geometry with vertices defined in the first attribute array and defines triangles to cover the entire plane.
 *
 * @param {object} geometry The geometry which contains triangles and attributes
 * @returns The geometry with triangles added
 */
function tesselate(geometry) {
    var vertices = geometry.attributes[0].length;
    var n = Math.sqrt(vertices);
    var verticesWithoutLastRow = vertices - n - 1;
    for (var i = 0; i < verticesWithoutLastRow; i++) {
        // Check to see if we're at the end of a row in the grid
        if (i == 0 || ((i+1) % n) !== 0) {
            geometry.triangles.push([i, i+1, i+n]);
            geometry.triangles.push([i+1, i+n, i+n+1]);
        }
    }

    return geometry;
}

/**
 * Adds "steps" in the Y-directions, or faults, to an existing grid model. Normalizes all the heights after adding the faults.
 * Returns the updated model.
 *
 * @param {object} geometry The geometry which contains triangles and attributes
 * @param {int} faults The number of faults to create
 * @returns The model updated to include faults
 */
function createFaults(geometry, faults) {
    var vertices = geometry.attributes[0].length;

    for (var f = 0; f < faults; f++) {
        // Create a random change in height.
        var changeInHeight = Math.random();

        // Select a vertex to build the plane from
        var vertex = geometry.attributes[0][Math.floor(Math.random() * vertices)];

        // Create a random normal on the x-z plane to describe the vertical plane
        var nz = Math.random() - Math.random();
        var nx = Math.random() - Math.random();
        var normal = [nx, 0, nz];

        for (var v = 0; v < geometry.attributes[0].length; v++) {
            var vec = sub(geometry.attributes[0][v], vertex);
            if (dot(vec, normal) > 0) {
                geometry.attributes[0][v][1] += changeInHeight;
            } else {
                geometry.attributes[0][v][1] -= changeInHeight;
            }
        }
    }

    // Normalize the heights
    var minHeight = geometry.attributes[0][0][1];
    var maxHeight = geometry.attributes[0][0][1];
    for (var i = 0; i < vertices; i++) {
        if (geometry.attributes[0][i][1] < minHeight) {
            minHeight = geometry.attributes[0][i][1];
        } else if (geometry.attributes[0][i][1] > maxHeight) {
            maxHeight = geometry.attributes[0][i][1];
        }
    }
    var c = 0.8;
    var maxPlusMin = maxHeight + minHeight;
    var maxMinusMin = maxHeight - minHeight;
    for (var i = 0; i < vertices; i++) {
        geometry.attributes[0][i][1] = c * ((geometry.attributes[0][i][1] - 0.5 * maxPlusMin) / maxMinusMin);
    }

    return geometry;
}

/**
 * Computes a normal vector for each vertex, and adds an attribute array to the geometry to house them.
 * Returns the updated geometry array.
 *
 * @param {object} geometry The geometry which contains triangles and attributes
 *
 * @returns The geometry object with a new attribute array for normals added
 */
function addNormalsAttribute(geometry) {
    geometry.attributes.push([]);
    var normIdx = geometry.attributes.length - 1;
    var vertices = geometry.attributes[0].length;
    var rowLength = Math.sqrt(vertices);

    for (var i = 0; i < vertices; i++) {
        // Set vertices to use for normal computation based on whether or not this one is on a border.
        var n = geometry.attributes[0][i];
        var s = geometry.attributes[0][i];
        var e = geometry.attributes[0][i];
        var w = geometry.attributes[0][i];
        if (i >= rowLength) {
            s = geometry.attributes[0][i - rowLength];
        }
        if (i < vertices - rowLength) {
            n = geometry.attributes[0][i + rowLength];
        }
        if (i > 0 && i % rowLength !== 0) {
            // Not beginning of a row
            w = geometry.attributes[0][i - 1];
        }
        if ((i + 1) % rowLength !== 0) {
            e = geometry.attributes[0][i + 1];
        }

        // The normal for a vertex is (n - s) x (w - e) in a square grid
        var normal = cross(sub(w, e), sub(n, s));
        geometry.attributes[normIdx].push(normal);
    }
    for(let i = 0; i < geometry.attributes[0].length; i+=1) {
        geometry.attributes[normIdx][i] = normalize(geometry.attributes[normIdx][i]);
    }

    return geometry;
}

/**
 * Generates and returns a grid geometry object. Puts the position and color data into buffers usable by WebGL2.
 * The color will always be (0.75, 0.5, 0.25, 1).
 * The grid will be in the X-Z plane, and positive Y will be "up" w.r.t. the model.
 *
 * @param {int} gridsize The number of vertices on each side of the grid. Generated grid will have dimension gridsize x gridsize
 * @param {int} faults The number of faults to apply to the generated grid
 * 
 * @returns An object containing triangles and attributes parameters
 */
function generateGridGeom(gridsize, faults) {
    var gridGeom = {
        triangles: [],
        attributes: [
            // Positions
            [],
            // Colors
            [],
        ],
    };
    var stepSize = 2.0 / gridsize;
    var xCoord = -1.0;
    var zCoord = -1.0;
    for (var z=0; z < gridsize; z++) {
        for (var x=0; x < gridsize; x++) {
            gridGeom.attributes[0].push([xCoord, 0, zCoord]);
            gridGeom.attributes[1].push([0.75, 0.5, 0.25]);
            xCoord += stepSize;
        }
        zCoord += stepSize
        xCoord = -1.0;
    }

    // Connect the vertices with triangles
    gridGeom = tesselate(gridGeom);
    
    // Adjust heights to match the required number of faults
    gridGeom = createFaults(gridGeom, faults);

    // Compute the normals
    gridGeom = addNormalsAttribute(gridGeom);

    console.log(gridGeom);

    return setupGeometry(gridGeom);
}

/**
 * Resizes the canvas to the largest square the screen can hold
 */
function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    gl.viewport(0,0, canvas.width, canvas.height)
    window.perspective = m4perspNegZ(0.1, 15, 1.5, canvas.width, canvas.height);
    // TO DO: compute a new projection matrix based on the width/height aspect ratio
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
 * Clears the screen, sends uniforms and input geometry, and asks the GPU to draw the frame
 *
 * @param {Number} seconds - the number of seconds since the animation began
 */
function draw(seconds) {
    if (!window.gridGeom) {
        return;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program);
    
    // Set up view and rotation
    var view = m4view([1,1.2,1.5], [0,0,0], [0,1,0]);
    gl.uniformMatrix4fv(program.uniforms.perspective, false, perspective);
    var modelRot = m4rotY(seconds / 2.0);
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(view, modelRot));

    // Set up lights
    var ld = normalize([1,1,1]);
    gl.uniform3fv(program.uniforms.lightcolor, [1,1,1]);
    gl.uniform3fv(program.uniforms.lightdir, ld);
    var h = normalize(add(ld, [0,0,1]));
    gl.uniform3fv(program.uniforms.halfway, h);
    
    // Draw
    gl.bindVertexArray(window.gridGeom.vao);
    gl.drawElements(window.gridGeom.mode, window.gridGeom.count, window.gridGeom.type, 0);
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
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    const vs = await fetch('vs.glsl').then(res => res.text());
    const fs = await fetch('fs.glsl').then(res => res.text());
    window.program = compileShader(vs, fs);

    gl.enable(gl.DEPTH_TEST);
 
    fillScreen();
    window.addEventListener('resize', fillScreen);

    document.querySelector('#submit').addEventListener('click', event => {
        console.log('Creating new geometry...');
        const gridsize = Number(document.querySelector('#gridsize').value) || 2
        const faults = Number(document.querySelector('#faults').value) || 0
        window.gridGeom = generateGridGeom(gridsize, faults);
    });

    requestAnimationFrame(tick);
}

// Entry point for the animation program
window.addEventListener('load', setup);
