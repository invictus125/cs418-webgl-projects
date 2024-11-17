/**
 * Computes a normal vector for each vertex, and adds an attribute array to the geometry to house them.
 * Returns the updated geometry array.
 *
 * @param {object} geometry The geometry which contains triangles and attributes
 *
 * @returns The geometry object with a new attribute array for normals added
 */
function addNormalsAttribute(geometry) {
    // Create map of vertices to triangles and compute normals for each triangle
    var triNormals = {};
    var vertToTriMap = {};
    geometry.triangles.forEach((triangle, idx) => {
        var vertices = [];
        triangle.forEach((vertex) => {
            if (!vertToTriMap[vertex]) {
                vertToTriMap[vertex] = [];
            }
            vertToTriMap[vertex].push(idx);
            vertices.push(geometry.attributes[0][vertex]);
        });
        var e1 = sub(vertices[0], vertices[1]);
        var e2 = sub(vertices[0], vertices[2]);
        var normal = cross(e1, e2);
        triNormals[idx] = div(normal, mag(normal));
    });

    geometry.attributes.push([]);
    var normIdx = geometry.attributes.length - 1;

    // Calculate the normal at each vertex by averaging the normals around it (all triangles it's connected to)
    for (var v = 0; v < geometry.attributes[0].length; v++) {
        var triangles = vertToTriMap[v];
        var normal = [0, 0, 0];
        if (triangles && triangles.length) {
            triangles.forEach((triangle) => {
                normal = add(normal, triNormals[triangle]);
            });
            normal = div(normal, triangles.length);
        } else {
            console.log('WARNING: vertex ' + v + ' is not part of any triangles');
        }
        geometry.attributes[normIdx].push(normal);
    }

    return geometry;
}

function scaleVertices(geometry) {
    var maxDist = -1;
    var avgPoint = [0, 0, 0];
    for (var i = 0; i < geometry.attributes[0].length; i++) {
        avgPoint = add(avgPoint, geometry.attributes[0][i]);
        for (var j = i+1; j < geometry.attributes[0].length; j++) {
            var dist = mag(sub(geometry.attributes[0][i], geometry.attributes[0][j]));
            if (dist > maxDist) {
                maxDist = dist;
            }
        }
    }
    avgPoint = div(avgPoint, geometry.attributes[0].length);

    var centerOffset = sub([0, 0, 0], avgPoint);
    var scalingFactor = 1.8 / maxDist;
    for (var i = 0; i < geometry.attributes[0].length; i++) {
        // Center
        geometry.attributes[0][i] = add(geometry.attributes[0][i], centerOffset);

        // Scale
        geometry.attributes[0][i] = mul(geometry.attributes[0][i], scalingFactor);
    }

    return geometry;
}

/**
 * Takes the parsed contents of a .obj file and sets up usable geometry from them.
 *
 * @param {Object} obj An object containing information from the obj file such as vertices, colors, triangles, and normals.
 * @returns A built geometry usable by WebGL2
 */
function processObjContents(obj) {
    var geometry = {
        triangles: obj.triangles,
        attributes: [
            // Positions
            obj.vertices,
            // Colors
            obj.colors,
        ],
    };

    // Scale the vertices
    geometry = scaleVertices(geometry);

    // Handle normals
    if (obj.normals.length) {
        geometry.attributes.push(obj.normals);
    } else {
        geometry = addNormalsAttribute(geometry);
    }

    // Handle texcoords
    if (obj.textureCoords.length) {
        geometry.attributes.push(obj.textureCoords);
    }

    console.log(geometry);

    return setupGeometry(geometry);
}

/**
 * Parses and builds geometry from an obj file.
 *
 * @param {string} value The file location
 * @returns Usable geometry for WebGL2
 */
async function loadObjFile(value) {
    if(/[.]obj$/.test(value)) {
        var parsed = {
            vertices: [],
            colors: [],
            triangles: [],
            normals: [],
            textureCoords: [],
        };
        var contents = await fetch(value).then((res) => res.text());
        var lines = contents.split('\n');
        lines.forEach((line) => {
            line = line.trim();
            if (/^v\s/.test(line)) {
                // Vertex
                var parts = line.split(/\s+/);
                parsed.vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
                if (parts.length > 4) {
                    parsed.colors.push([parseFloat(parts[4]), parseFloat(parts[5]), parseFloat(parts[6])]);
                } else {
                    // Light grey
                    parsed.colors.push([0.7, 0.7, 0.7]);
                }
            } else if (/^f\s/.test(line)) {
                // Face
                var parts = line.split(/\s+/);
                parsed.triangles.push([parseInt(parts[1]) - 1, parseInt(parts[2]) - 1, parseInt(parts[3]) - 1]);
                for (var i = 5; i < parts.length; i++) {
                    parsed.triangles.push([parseInt(parts[1]), parseInt(parts[i-1]), parseInt(parts[i])]);
                }
            } else if (/^vn\s/.test(line)) {
                // Vertex Normal
                var parts = line.split(/\s+/);
                parsed.normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
            } else if (/^vt\s/.test(line)) {
                // Vertex Texture Coord
                var parts = line.split(/\s+/);
                parsed.textureCoords.push([parseFloat(parts[1]), parseFloat(parts[2])]);
            }
        });
        
        return processObjContents(parsed);
    }

    return window.geom;
}

/**
 * Loads a texture if one is provided. Otherwise uses silver.
 * @param {string} value A color code or file name to use as a texture
 */
function loadTexture(value) {
    if (value == '') {
        // Use (1, 1, 1, 0.3) across the entire image
        window.uniformColor = [1, 1, 1, 0.3];
        window.program = compileShader(window.vs, window.fs);
    } else if(/^#[0-9a-f]{8}$/i.test(value)) {
        // Set uniform color
        var r = Number('0x' + value.substring(1, 3)) / 255.0;
        var g = Number('0x' + value.substring(3, 5)) / 255.0;
        var b = Number('0x' + value.substring(5, 7)) / 255.0;
        var a = Number('0x' + value.substring(7, 9)) / 255.0;
        window.uniformColor = [r, g, b, a];
        window.program = compileShader(window.vs, window.fs);
    } else if(/[.](jpg|png)$/.test(value)) {
        // Load image
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = value;
        img.addEventListener('load', (_event) => {
            // Create and bind texture
            var slot = 0;
            var texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + slot);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Configure texture
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Load image to GPU
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );
            gl.generateMipmap(gl.TEXTURE_2D);

            // Tell the next frame to use the texture shader!
            window.uniformColor = undefined;

            // Load the correct program
            window.program = compileShader(window.vs, window.tfs);
        });
        img.addEventListener('error', (_event) => {
            window.uniformColor = [1, 0, 1, 0];
            window.program = compileShader(window.vs, window.fs);
        });
    }
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

    // Use the texture if there is one, otherwise use the uniform color
    if (window.uniformColor) {
        gl.uniform4fv(program.uniforms.uniformcolor, window.uniformColor);
    } else {
        gl.uniform1i(program.uniforms.loadedtexture, 0);
    }
    
    // Set up view and rotation
    var view = m4view([0,0.5,1.5], [0,0,0], [0,1,0]);
    gl.uniformMatrix4fv(program.uniforms.perspective, false, perspective);
    var modelRot = m4mul(m4rotY(seconds / 2.0));
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(view, modelRot));


    // // var earthOrbitSun = m4rotY(seconds * earthOrbitFactor);
    // // var earthM = m4mul(earthOrbitSun, earthTrans, earthRotation, earthScale);
    // // var earthMv = m4mul(view, earthM);
    // var view = m4view([0,1.2,1.5], [0,0,0], [0,1,0]);
    // gl.uniformMatrix4fv(program.uniforms.perspective, false, perspective);
    // var cameraRot = m4rotY(seconds / 2.0);
    // var cameraTranslate = m4trans(1, 0, 0);
    // var camera = m4mul(cameraRot, cameraTranslate);
    // gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(view, camera));

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
    window.vs = await fetch('vs.glsl').then(res => res.text());
    window.fs = await fetch('fs.glsl').then(res => res.text());
    window.tfs = await fetch('tfs.glsl').then(res => res.text());
    window.uniformColor = [1, 1, 1, 0.3];
    window.program = compileShader(window.vs, window.fs);

    gl.enable(gl.DEPTH_TEST);
 
    fillScreen();
    window.addEventListener('resize', fillScreen);

    // Listen for changes to the value of the texture input
    document.querySelector('#texture').addEventListener('change', event => {
        const texture = document.querySelector('#texture').value;
        loadTexture(texture);
    });

    document.querySelector('#submit').addEventListener('click', async event => {
        console.log('Loading geometry...');
        const objfile = document.querySelector('#objfile').value;
        const texture = document.querySelector('#texture').value;
        window.geom = await loadObjFile(objfile);
        loadTexture(texture);
    });

    requestAnimationFrame(tick);
}

// Entry point for the animation program
window.addEventListener('load', setup);
