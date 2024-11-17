#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec3 color;
layout(location=2) in vec3 normal;
layout(location=3) in vec2 texcoord;
out vec3 vtxnormal;
out vec2 vTexCoord;
out vec3 color2;
uniform mat4 mv;
uniform mat4 perspective;
void main() {
    gl_Position = perspective * mv * position;
    vtxnormal = mat3(mv) * normal;
    vTexCoord = texcoord;
    color2 = color;
}
