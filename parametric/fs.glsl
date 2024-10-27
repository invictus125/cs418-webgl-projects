#version 300 es
precision highp float;
uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;
out vec4 fragColor;
in vec3 vtxnormal;
in vec4 color2;
void main() {
    vec3 n = normalize(vtxnormal);
    float lambert = max(dot(n, lightdir), 0.0);
    float blinn = pow(dot(n, halfway), 50.0);
    fragColor = vec4(
        (
            color2.rgb * lightcolor * lambert
            + vec3(1,1,1) * blinn
        ),
        color2.a
    );
}