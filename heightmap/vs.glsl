#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec3 color;
layout(location=2) in vec3 normal;
out vec3 vtxnormal;
uniform mat4 mv;
uniform mat4 perspective;
out vec4 color2;
void main() {
    gl_Position = perspective * mv * position;
    vtxnormal = mat3(mv) * normal;
    float cheight = position[1] * 10.0;
    color2 = vec4(sin(cheight), cos(cheight), sin(-1.0 * cheight), 1.0);
}
