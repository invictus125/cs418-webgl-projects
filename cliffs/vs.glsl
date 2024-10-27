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
    color2 = normal[1] > 0.6 ? vec4(0.2, 0.6, 0.1, 1.0) : vec4(0.6, 0.3, 0.3, 1.0);
}
