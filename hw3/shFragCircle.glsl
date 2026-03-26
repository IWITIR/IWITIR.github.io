#version 300 es
precision highp float;
in vec2 v_position;

out vec4 outColor;
uniform vec4 u_color; // Circle color
uniform vec2 center; // Circle center 
uniform float radius; // Circle radius
float lineWidth = 0.001;

void main() {
    // Remap UV coordinates so the center is (0.5, 0.5)
    float distance = length(v_position - center);

    if (distance > radius - lineWidth && distance < radius + lineWidth) {
        outColor = u_color; // Use the uniform color inside
    } else {
        discard; // Discard fragments outside the circle
    }
}