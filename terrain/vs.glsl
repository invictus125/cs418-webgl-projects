#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec3 color;
layout(location=2) in vec3 normal;
out vec3 vtxnormal;
uniform mat4 mv;
uniform mat4 perspective;
out vec4 color2;
void main() {
    // gl_Position = perspective * mv * vec4(position.xyz + normal.xyz * 0.3, position.w);
    gl_Position = perspective * mv * position;
    vtxnormal = mat3(mv) * normal;
    color2 = vec4(color.rgb, 1);
}
