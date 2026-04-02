/*-------------------------------------------------------------------------
modified from 08_Transformation.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao_pole;
let vao_bigWing;
let vao_smallWing;
let rotationAngle_Big = 0;
let rotationAngle_Small = 0;
let startTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers() {
    // 기본 사각형 (높이 1, 너비 0.2)
    const rectVertices = new Float32Array([
        -0.1,  0.5,  // 좌상단
        -0.1, -0.5,  // 좌하단
         0.1, -0.5,  // 우하단
         0.1,  0.5   // 우상단
    ]);

    const rectIndices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const BrownColors = new Float32Array([
        0.43, 0.30, 0.16, 1.0, // 갈색
        0.43, 0.30, 0.16, 1.0,
        0.43, 0.30, 0.16, 1.0,
        0.43, 0.30, 0.16, 1.0
    ]);

    const WhiteColors = new Float32Array([
        1.0, 1.0, 1.0, 1.0,  // 흰색
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ]);

    const GreyColors = new Float32Array([
        0.5, 0.5, 0.5, 1.0,  // 회색
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0
    ]);

    vao_pole = gl.createVertexArray();
    gl.bindVertexArray(vao_pole);
    
    // VBO for position
    const polePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, polePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rectVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);
    
    // VBO for color Brown
    const BrownColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, BrownColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, BrownColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const poleIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, poleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rectIndices, gl.STATIC_DRAW);

    vao_bigWing = gl.createVertexArray();
    gl.bindVertexArray(vao_bigWing);

    const WhiteColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, polePositionBuffer);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);
    // different color buffer 
    gl.bindBuffer(gl.ARRAY_BUFFER, WhiteColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, WhiteColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, poleIndexBuffer);

    vao_smallWing = gl.createVertexArray();
    gl.bindVertexArray(vao_smallWing);

    gl.bindBuffer(gl.ARRAY_BUFFER, polePositionBuffer);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);
    // different color buffer
    const GreyColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, GreyColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, GreyColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, poleIndexBuffer);
    

    gl.bindVertexArray(null);
}

function applyTransform() {
    const poleTransform = mat4.create();
    const bigWingTransform = mat4.create();
    const smallWingLeftTransform = mat4.create();
    const smallWingRightTransform = mat4.create();

    const trans_to_top = mat4.create();
    mat4.translate(trans_to_top, trans_to_top, [0, 0.5, 0]);
    const big_rotation = mat4.create();
    // + 90 degrees to start horizontally long
    mat4.rotate(big_rotation, big_rotation, rotationAngle_Big, [0, 0, 1]);
    const rotation_90 = mat4.create();
    mat4.rotate(rotation_90, rotation_90, Math.PI / 2, [0, 0, 1]);
    const scale_half = mat4.create();
    mat4.scale(scale_half, scale_half, [0.5, 0.5, 1]);

    // get big Wing transform
    mat4.multiply(bigWingTransform, scale_half, bigWingTransform);
    mat4.multiply(bigWingTransform, rotation_90, bigWingTransform);
    mat4.multiply(bigWingTransform, big_rotation, bigWingTransform);
    mat4.multiply(bigWingTransform, trans_to_top, bigWingTransform);

    const trans_to_left = mat4.create();
    mat4.translate(trans_to_left, trans_to_left, [-0.25, 0, 0]);
    const trans_to_right = mat4.create();
    mat4.translate(trans_to_right, trans_to_right, [0.25, 0, 0]);
    const small_rotation = mat4.create();
    mat4.rotate(small_rotation, small_rotation, rotationAngle_Small, [0, 0, 1]);
    const scale_quarter = mat4.create();
    mat4.scale(scale_quarter, scale_quarter, [0.25, 0.25, 1]);

    // get small wing transforms
    mat4.multiply(smallWingLeftTransform, scale_quarter, smallWingLeftTransform);
    mat4.multiply(smallWingLeftTransform, rotation_90, smallWingLeftTransform);
    mat4.multiply(smallWingLeftTransform, small_rotation, smallWingLeftTransform);
    mat4.multiply(smallWingLeftTransform, trans_to_left, smallWingLeftTransform);
    mat4.multiply(smallWingLeftTransform, big_rotation, smallWingLeftTransform);
    mat4.multiply(smallWingLeftTransform, trans_to_top, smallWingLeftTransform);
    
    mat4.multiply(smallWingRightTransform, scale_quarter, smallWingRightTransform);
    mat4.multiply(smallWingRightTransform, rotation_90, smallWingRightTransform);
    mat4.multiply(smallWingRightTransform, small_rotation, smallWingRightTransform);
    mat4.multiply(smallWingRightTransform, trans_to_right, smallWingRightTransform);
    mat4.multiply(smallWingRightTransform, big_rotation, smallWingRightTransform);
    mat4.multiply(smallWingRightTransform, trans_to_top, smallWingRightTransform);

    return {poleTransform, bigWingTransform, smallWingLeftTransform, smallWingRightTransform};
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();
    const { poleTransform, bigWingTransform, smallWingLeftTransform, smallWingRightTransform } = applyTransform();

    // draw pole
    shader.setMat4("u_transform", poleTransform);
    gl.bindVertexArray(vao_pole);
    // gl.drawElements(mode, index_count, type, byte_offset);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // draw big wing
    shader.setMat4("u_transform", bigWingTransform);
    gl.bindVertexArray(vao_bigWing);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // draw small wing
    shader.setMat4("u_transform", smallWingLeftTransform);
    gl.bindVertexArray(vao_smallWing);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_transform", smallWingRightTransform);
    gl.bindVertexArray(vao_smallWing);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {
    if (!startTime) startTime = currentTime; 
    const elapsedTime = (currentTime - startTime) / 1000; // ms to seconds

    rotationAngle_Big = Math.sin(elapsedTime) * Math.PI * 2.0;
    rotationAngle_Small = Math.sin(elapsedTime) * Math.PI * -10.0;
    render();

    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        await initShader();

        setupBuffers();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
