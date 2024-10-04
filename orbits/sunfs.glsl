#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec4 color;
out vec4 color2;
uniform mat4 sun_modelview;
uniform mat4 sun_perspective;
void main() {
    gl_Position = sun_perspective * sun_modelview * position;
    color2 = color;
}