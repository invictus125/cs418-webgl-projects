# version 300 es
precision highp float;
out vec4 color;
uniform float seconds;
in float x;
in float y;
float r_seed;
float g_seed;
float b_seed;
float r;
float g;
float b;

void main() {
    // Option 1: Swirls at edges, middle is stationary
    // r_seed = ((x*x) + y*y + 2.0*x + 1.5*y) / 0.25*x*y;
    // g_seed = ((0.5*x*x / 2.0*y) + y*y - 2.0*x + 1.5*y) / 0.5*y*y;
    // b_seed = 2.0*x*x + (0.75*y*y / 2.0*x) + x - y;

    // r = sin(r_seed * g_seed * seconds);
    // g = cos(g_seed * g_seed * seconds);
    // b = sin(b_seed * r_seed * seconds);

    // Option 2: Dancing ovals
    r_seed = 1.0 / (x*x + 0.7*x*y + y*y + 1.0);
    g_seed = (x*x - x*y + 0.5*y*y + 2.0);
    b_seed = (x*x + 0.5*x*y + 0.25*y*y + 5.0);

    r = sin(r_seed * seconds);
    g = cos(g_seed * seconds);
    b = sin(b_seed * seconds);

    color = vec4(r, g, b, 1);
}