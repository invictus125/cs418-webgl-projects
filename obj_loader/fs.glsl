#version 300 es
precision highp float;
uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;
out vec4 fragColor;
in vec3 vtxnormal;
uniform vec4 uniformcolor;
void main() {
    vec3 n = normalize(vtxnormal);
    float lambert = max(dot(n, lightdir), 0.0);
    lambert = lambert * (1.0 - uniformcolor.a);
    float blinn = pow(dot(n, halfway), 50.0);
    blinn = blinn * 3.0 * uniformcolor.a;
    fragColor = vec4(
        (
            uniformcolor.rgb * lightcolor * lambert
            + vec3(1,1,1) * blinn
        ),
        1.0
    );
}