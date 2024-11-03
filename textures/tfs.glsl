#version 300 es
precision highp float;
uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;
out vec4 fragColor;
in vec3 vtxnormal;
in vec2 vTexCoord;
uniform sampler2D loadedtexture;
void main() {
    vec3 n = normalize(vtxnormal);
    float lambert = max(dot(n, lightdir), 0.0);
    vec4 texcolor = texture(loadedtexture, vTexCoord);
    fragColor = vec4(
        (
            texcolor.rgb * lightcolor * lambert
        ),
        1.0
    );
}
