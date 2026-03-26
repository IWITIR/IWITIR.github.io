#version 300 es
precision highp float;

in vec2 v_position;
out vec4 outColor;
uniform vec4 u_color;

void main() {
    outColor = u_color;
} 