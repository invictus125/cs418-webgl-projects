#version 300 es
uniform float seconds;
out float x;
out float y;
void main() {
    // Vertex 0 - (-1, -1)
    // Vertex 1 - (1, -1)
    // Vertex 2 - (1, 1)
    // Vertex 3 - (-1, -1)
    // Vertex 4 - (-1, 1)
    // Vertex 5 - (1, 1)
    x = gl_VertexID == 0 || gl_VertexID == 3 || gl_VertexID == 4 ? -1.0 : 1.0;
    y = gl_VertexID == 0 || gl_VertexID == 1 || gl_VertexID == 3 ? -1.0 : 1.0;
    gl_Position = vec4(float(x), float(y), float(0), float(1));
}