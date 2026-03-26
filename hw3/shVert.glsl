#version 300 es

in vec2 a_position;
out vec2 v_position;

void main() {
    v_position = a_position;
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 10.0; // 점의 크기를 10으로 설정 (intersection point를 크게 보이도록)
} 