/**
 * Generates a sphere geometry based on input values. Geometry will have the specified numbers of
 * rings and vertical slices representing latitude and longitude.
 *
 * @param {int} rings The number of rings the geometry should have
 * @param {int} slices The number of vertical slices the geometry should have
 * 
 * @returns An object containing triangles and attributes parameters
 */
function generateSphereGeom(rings, slices) {
    var geom = {
        triangles: [],
        attributes: [
            // Positions
            [],
            // Colors
            [],
            // Normals
            [],
        ],
    };

    // Create the poles as the first and second point in the array (north and south)
    geom.attributes[0].push([0, 1, 0]);
    geom.attributes[1].push([0.75, 0.5, 0.25]);
    geom.attributes[2].push([0, 1, 0]);
    geom.attributes[0].push([0, -1, 0]);
    geom.attributes[1].push([0.75, 0.5, 0.25]);
    geom.attributes[2].push([0, -1, 0]);

    // Build rings from north pole down to south pole
    var yStep = 2.0 / (rings + 1);
    var yPos = 1.0 - yStep;
    var currentRingStartPos = 2;
    var previousRingStartPos = 2 - slices;
    for (var r = 0; r < rings; r++) {
        var radius = Math.sqrt(1 - Math.pow(Math.abs(yPos), 2));
        
        for (var s = 0; s < slices; s++) {
            var angle = s * (2 * Math.PI) / slices;
            var vertex = [Math.cos(angle) * radius, yPos, Math.sin(angle) * radius];
            geom.attributes[0].push(vertex);
            geom.attributes[1].push([0.75, 0.5, 0.25]);

            // Calculate normal which is just a unit vector in the opposite direction of the origin from the current vertex
            var normal = normalize(vertex);
            geom.attributes[2].push(normal);

            // Connection logic
            if (s > 0) {
                if (r == 0) {
                    // Connect this ring to the north pole
                    geom.triangles.push([0, currentRingStartPos + s, currentRingStartPos + (s - 1)]);

                    if (s == (slices - 1)) {
                        // Connect the final face of the triangle
                        geom.triangles.push([0, currentRingStartPos + s, currentRingStartPos]);
                    }
                } else {
                    // Connect this ring to the previous ring.
                    geom.triangles.push([previousRingStartPos + s, currentRingStartPos + s, currentRingStartPos + s - 1]);
                    geom.triangles.push([previousRingStartPos + s, previousRingStartPos + s - 1, currentRingStartPos + s - 1]);

                    if (s == (slices - 1)) {
                        // Connect the final face
                        geom.triangles.push([previousRingStartPos, currentRingStartPos + s, currentRingStartPos]);
                        geom.triangles.push([previousRingStartPos, previousRingStartPos + s, currentRingStartPos + s]);
                    }
                }
            }
        }

        yPos -= yStep;
        currentRingStartPos += slices;
        previousRingStartPos += slices;
    }

    // Connect the final ring to the south pole
    currentRingStartPos -= slices;
    var end = currentRingStartPos + slices;
    for (var v = currentRingStartPos + 1; v < end; v++) {
        geom.triangles.push([1, v-1, v]);
    }
    // Final face
    geom.triangles.push([1, geom.attributes[0].length - slices, geom.attributes[0].length - 1]);

    return geom;
}

function generateTorusGeom(rings, slices) {
    var geom = {
        triangles: [],
        attributes: [
            // Positions
            [],
            // Colors
            [],
            // Normals
            [],
        ],
    };

    var currentRingStartPos = 0;
    var previousRingStartPos = -slices;
    var torusRadius = 0.3;
    var centerRadius = 0.7
    for (var r = 0; r < rings; r++) {
        // Figure out radius and y offset for this ring
        var rAngle = r * (2 * Math.PI) / rings;
        var radius = (torusRadius + Math.cos(rAngle) * torusRadius) + centerRadius;
        var yPos = Math.sin(rAngle) * torusRadius;
        
        for (var s = 0; s < slices; s++) {
            var angle = s * (2 * Math.PI) / slices;
            var vertex = [Math.cos(angle) * radius, yPos, Math.sin(angle) * radius];
            geom.attributes[0].push(vertex);
            geom.attributes[1].push([0.75, 0.5, 0.25]);

            // Calculate normal which is just a unit vector in the opposite direction of the origin from the current vertex
            var torusCenter = [Math.cos(angle), 0, Math.sin(angle)];
            var normal = normalize(sub(vertex, torusCenter));
            geom.attributes[2].push(normal);

            // Connection logic
            if (s > 0) {
                if (r > 0) {
                    // Connect this ring to the previous ring.
                    geom.triangles.push([previousRingStartPos + s, currentRingStartPos + s, currentRingStartPos + s - 1]);
                    geom.triangles.push([previousRingStartPos + s, previousRingStartPos + s - 1, currentRingStartPos + s - 1]);

                    if (s == (slices - 1)) {
                        // Connect the final face
                        geom.triangles.push([previousRingStartPos, currentRingStartPos + s, currentRingStartPos]);
                        geom.triangles.push([previousRingStartPos, previousRingStartPos + s, currentRingStartPos + s]);
                    }
                }
            }
        }

        currentRingStartPos += slices;
        previousRingStartPos += slices;
    }

    currentRingStartPos -= slices;
    var end = currentRingStartPos + slices;
    var offs = 1;
    for (var v = currentRingStartPos + 1; v < end; v++) {
        geom.triangles.push([offs, v-1, v]);
        geom.triangles.push([offs - 1, offs, v - 1]);
        offs++;
    }
    // Final face
    geom.triangles.push([0, geom.attributes[0].length - slices, geom.attributes[0].length - 1]);
    geom.triangles.push([0, slices - 1, geom.attributes[0].length - 1])

    return geom;
}

/**
 * Generates a geometry based on input values. Geometry will be a sphere unless the torus param is true, and will have the
 * specified numbers of rings and vertical slices representing latitude and longitude.
 *
 * @param {int} rings The number of rings the geometry should have
 * @param {int} slices The number of vertical slices the geometry should have
 * @param {boolean} torus Whether or not the generated geometry should be a torus shape
 * 
 * @returns An object containing triangles and attributes parameters
 */
function generateGeom(rings, slices, torus) {
    var geom;
    if (!torus) {
        geom = generateSphereGeom(rings, slices);
    } else {
        geom = generateTorusGeom(rings, slices);
    }

    console.log(geom);

    return setupGeometry(geom);
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
    if (!window.geom) {
        return;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program);
    
    // Set up view and rotation
    var view = m4view([1, window.torus ? 0.75 : 0.5 ,1.7], [0,0,0], [0,1,0]);
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
    gl.bindVertexArray(window.geom.vao);
    gl.drawElements(window.geom.mode, window.geom.count, window.geom.type, 0);
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
        const rings = Number(document.querySelector('#rings').value) || 1;
        const slices = Number(document.querySelector('#slices').value) || 3;
        const torus = document.querySelector('#torus').checked || false;
        window.torus = torus;
        window.geom = generateGeom(rings, slices, torus);
    });

    requestAnimationFrame(tick);
}

// Entry point for the animation program
window.addEventListener('load', setup);
