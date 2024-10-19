#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec3 color;
layout(location=2) in vec3 normal;
out vec4 color2;
uniform mat4 mv;
uniform mat4 perspective;
void main() {
    gl_Position = perspective * mv * position;
    color2 = vec4(color.rgb, 1);
}
