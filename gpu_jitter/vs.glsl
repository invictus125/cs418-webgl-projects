#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec4 color;
out vec4 color2;
uniform float motion;
uniform float seconds;
uniform mat4 scaleview;
void main() {
    float vert_seed = float(gl_VertexID) - 6.0;
    vert_seed = vert_seed == 0.0 ? 6.0 : vert_seed;
    float x = ((gl_VertexID % 2 == 0 ? cos(seconds*10.0) : sin(seconds*10.0)) + (vert_seed / 12.0) / position[0]) / vert_seed;
    float y = ((gl_VertexID % 2 == 1 ? cos(seconds*10.0) : sin(seconds*10.0)) + (vert_seed / 12.0) / position[1]) / vert_seed;
    gl_Position = scaleview * vec4(position[0] + (x / 10.0), position[1] + (y / 10.0), 0, 1);
    color2 = color;
}