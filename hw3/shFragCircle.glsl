#version 300 es
precision highp float;
in vec2 v_position;

out vec4 outColor;
uniform vec4 u_color; // Circle color
uniform vec2 center; // Circle center 
uniform float radius; // Circle radius

void main() {
    // Remap UV coordinates so the center is (0.5, 0.5)
    float distance = length(v_position - center);

    float w = fwidth(distance) / 2.0f; // resize-invariant, fwidth = abs(dFdx(distance)) + abs(dFdy(distance)). is higher when the canvas is smaller

    if (distance > radius - w && distance < radius + w) {
        outColor = u_color; // Use the uniform color inside
    } else {
        discard; // Discard fragments outside the circle
    }
}