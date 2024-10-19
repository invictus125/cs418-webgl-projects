#version 300 es
precision highp float;
uniform vec3 lightdir;
uniform vec3 lightcolor;
out vec4 fragColor;
in vec3 vtxnormal;
in vec4 color2;
void main() {
    float lambert = max(dot(normalize(vtxnormal), lightdir), 0.0);
    // fragColor = vec4(normalize(vtxnormal) * 255.0, 1.0);
    fragColor = vec4(color2.rgb * lightcolor * lambert, color2.a);
}