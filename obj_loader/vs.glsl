#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec2 texcoord;
layout(location=2) in vec3 normal;
out vec3 vtxnormal;
out vec2 vTexCoord;
uniform mat4 mv;
uniform mat4 perspective;
void main() {
    gl_Position = perspective * mv * position;
    vtxnormal = mat3(mv) * normal;
    vTexCoord = texcoord;
}
