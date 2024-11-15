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

    // BEGIN CUSTOM (TODO)


    // END CUSTOM

    // var vertices = geometry.attributes[0].length;
    // var rowLength = Math.sqrt(vertices);

    // for (var i = 0; i < vertices; i++) {
    //     // Set vertices to use for normal computation based on whether or not this one is on a border.
    //     var n = geometry.attributes[0][i];
    //     var s = geometry.attributes[0][i];
    //     var e = geometry.attributes[0][i];
    //     var w = geometry.attributes[0][i];
    //     if (i >= rowLength) {
    //         s = geometry.attributes[0][i - rowLength];
    //     }
    //     if (i < vertices - rowLength) {
    //         n = geometry.attributes[0][i + rowLength];
    //     }
    //     if (i > 0 && i % rowLength !== 0) {
    //         // Not beginning of a row
    //         w = geometry.attributes[0][i - 1];
    //     }
    //     if ((i + 1) % rowLength !== 0) {
    //         e = geometry.attributes[0][i + 1];
    //     }

    //     // The normal for a vertex is (n - s) x (w - e) in a square grid
    //     var normal = cross(sub(w, e), sub(n, s));
    //     geometry.attributes[normIdx].push(normal);
    // }
    // for(let i = 0; i < geometry.attributes[0].length; i+=1) {
    //     geometry.attributes[normIdx][i] = normalize(geometry.attributes[normIdx][i]);
    // }

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
                parsed.triangles.push([parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])]);
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
    var view = m4view([1,1.2,1.5], [0,0,0], [0,1,0]);
    gl.uniformMatrix4fv(program.uniforms.perspective, false, perspective);
    var modelRot = m4rotY(seconds / 2.0);
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
