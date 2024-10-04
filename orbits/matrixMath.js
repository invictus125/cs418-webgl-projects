/**
 * Creates and returns a matrix to apply z-axis rotation to an object.
 *
 * @param {number} time Elapsed time in the animation
 * @param {number} period How many seconds it takes to rotate one time
 * @returns {Float32Array} A matrix to use for z-axis rotation at the given period
 */
function zRotationMatrix(time, period) {
    let ang = time / period;
    let c = Math.cos(ang);
    let s = Math.sin(ang);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
}

// TODO: scale function

// TODO: matmul function