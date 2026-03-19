#version 300 es

layout (location = 0) in vec3 aPos;
uniform vec2 offset2D;

void main() {
    gl_Position = vec4(aPos[0] + offset2D.x, aPos[1] + offset2D.y, aPos[2], 1.0);
} 