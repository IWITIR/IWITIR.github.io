/*-------------------------------------------------------------------------
modified from 11_CameraFP.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Cube } from '../util/cube.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;  // start time of the program
let lastFrameTime;  // time of the last frame
let isInitialized = false;  // program initialization flag

let modelMatrix1 = mat4.create();  // model matrix
let modelMatrix2 = mat4.create();
let modelMatrix3 = mat4.create();
let modelMatrix4 = mat4.create();
let modelMatrix5 = mat4.create();
let viewMatrix1 = mat4.create();  // view matrix
let viewMatrix2 = mat4.create();
let projMatrix1 = mat4.create();  // projection matrix
let projMatrix2 = mat4.create();
const cube1 = new Cube(gl);  // create a Cube object
const cube2 = new Cube(gl); 
const cube3 = new Cube(gl);
const cube4 = new Cube(gl);
const cube5 = new Cube(gl);
const axes = new Axes(gl, 2.0); // create an Axes object
let textOverlay1, textOverlay2, textOverlay3; // text overlay elements

// Global variables for camera position and orientation
let cameraPos1 = vec3.fromValues(0, 0, 5);  // camera position initialization
let cameraPos2 = vec3.fromValues(0, 15, 0);
let cameraFront1 = vec3.fromValues(0, 0, -1); // camera front vector initialization
let cameraFront2 = vec3.fromValues(0, -1, 0);
let cameraUp1 = vec3.fromValues(0, 1, 0); // camera up vector (invariant)
let cameraUp2 = vec3.fromValues(0, 0, -1);
let yaw = -90;  // yaw angle, rotation about y-axis (degree)
let pitch = 0;  // pitch angle, rotation about x-axis (degree)
const mouseSensitivity = 0.1;  // mouse sensitivity
const cameraSpeed = 2.5;  // camera speed (unit distance/sec)

// global variables for keyboard input
const keys = {
    'w': false,
    'a': false,
    's': false,
    'd': false
};

// mouse 쓸 때 main call 방법
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

// keyboard event listener for document
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
});

// mouse event listener for canvas
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
    // Changing the pointer lock state
    console.log("Canvas clicked, requesting pointer lock");
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        console.log("Pointer is locked");
        document.addEventListener("mousemove", updateCamera);
    } else {
        console.log("Pointer is unlocked");
        document.removeEventListener("mousemove", updateCamera);
    }
});

// camera update function
function updateCamera(e) {
    const xoffset = e.movementX * mouseSensitivity;  // movementX 사용
    const yoffset = -e.movementY * mouseSensitivity; // movementY 사용

    yaw += xoffset;
    pitch += yoffset;

    // pitch limit
    if (pitch > 89.0) pitch = 89.0;
    if (pitch < -89.0) pitch = -89.0;

    // camera direction calculation
    // sperical coordinates (r, theta, phi) = (r, yaw, pitch) = (sx, sy, sz)
    // sx = cos(yaw) * cos(pitch)
    // sy = sin(pitch)
    // sz = sin(yaw) * cos(pitch)
    const direction = vec3.create();
    direction[0] = Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    direction[1] = Math.sin(glMatrix.toRadian(pitch));
    direction[2] = Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    vec3.normalize(cameraFront1, direction);
}

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 1400;
    canvas.height = 700;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // setup model matrices.
    mat4.translate(modelMatrix2, modelMatrix2, vec3.fromValues(2.0, 0.5, -3.0));
    mat4.translate(modelMatrix3, modelMatrix3, vec3.fromValues(-1.5, 0.5, -2.5));
    mat4.translate(modelMatrix4, modelMatrix4, vec3.fromValues(3.0, 0.0, -4.0));
    mat4.translate(modelMatrix5, modelMatrix5, vec3.fromValues(-3.0, 0.0, 1.0));
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000.0;
    lastFrameTime = currentTime;
    const elapsedTime = (currentTime - startTime) / 1000.0;

    // camera movement based on keyboard input
    const cameraSpeedWithDelta = cameraSpeed * deltaTime;
    
    // vec3.scaleAndAdd(v1, v2, v3, s): v1 = v2 + v3 * s
    if (keys['w']) { // move camera forward (to the +cameraFront1 direction)
        vec3.scaleAndAdd(cameraPos1, cameraPos1, cameraFront1, cameraSpeedWithDelta);
    }
    if (keys['s']) { // move camera backward (to the -cameraFront1 direction)
        vec3.scaleAndAdd(cameraPos1, cameraPos1, cameraFront1, -cameraSpeedWithDelta);
    }
    if (keys['a']) { // move camera to the left (to the -cameraRight direction)
        const cameraRight = vec3.create();
        vec3.cross(cameraRight, cameraFront1, cameraUp1);
        vec3.normalize(cameraRight, cameraRight);
        vec3.scaleAndAdd(cameraPos1, cameraPos1, cameraRight, -cameraSpeedWithDelta);
    }
    if (keys['d']) { // move camera to the right (to the +cameraRight direction)
        const cameraRight = vec3.create();
        vec3.cross(cameraRight, cameraFront1, cameraUp1);
        vec3.normalize(cameraRight, cameraRight);
        vec3.scaleAndAdd(cameraPos1, cameraPos1, cameraRight, cameraSpeedWithDelta);
    }

    gl.enable(gl.SCISSOR_TEST);
    gl.enable(gl.DEPTH_TEST);
    // scissor 1 ------------------------
    gl.viewport(0, 0, 700, 700);
    gl.scissor(0, 0, 700, 700);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    // update view matrix
    mat4.lookAt(viewMatrix1, 
        cameraPos1, // from position (camera position)
        vec3.add(vec3.create(), cameraPos1, cameraFront1), // target position (camera position + cameraFront1)
        cameraUp1); // up vector (camera up vector, usually (0, 1, 0) and invariant)

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw the cube
    shader.use();
    shader.setMat4('u_view', viewMatrix1);
    shader.setMat4('u_projection', projMatrix1);
    shader.setMat4('u_model', modelMatrix1);
    cube1.draw(shader);
    shader.setMat4('u_model', modelMatrix2);
    cube2.draw(shader);
    shader.setMat4('u_model', modelMatrix3);
    cube3.draw(shader);
    shader.setMat4('u_model', modelMatrix4);
    cube4.draw(shader);
    shader.setMat4('u_model', modelMatrix5);
    cube5.draw(shader);

    // draw the axes
    axes.draw(viewMatrix1, projMatrix1);

    // draw the texts
    let l1 = "Camera pos: (" + cameraPos1[0].toFixed(1) + ", " + cameraPos1[1].toFixed(1) + ", " + cameraPos1[2].toFixed(1) + ") | Yaw: " + yaw.toFixed(1) + "° | Pitch: " + pitch.toFixed(1) + "°";
    let l2 = "WASD: move | Mouse: rotate (click to lock) | ESC: unlock";
    let l3 = "Left: Perspective | Right: Orthographic (Top-Down)";
    updateText(textOverlay1, l1);
    updateText(textOverlay2, l2);
    updateText(textOverlay3, l3);

    // scissor 2 ------------------------
    gl.viewport(700, 0, 700, 700);
    gl.scissor(700, 0, 700, 700);
    gl.clearColor(0.05, 0.15, 0.2, 1.0);

    // update view matrix
    mat4.lookAt(viewMatrix2, 
        cameraPos2, // from position (camera position)
        vec3.add(vec3.create(), cameraPos2, cameraFront2), // target position 
        cameraUp2); // up vector

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // draw the cube
    shader.use();
    shader.setMat4('u_view', viewMatrix2);
    shader.setMat4('u_projection', projMatrix2);
    shader.setMat4('u_model', modelMatrix1);
    cube1.draw(shader);
    shader.setMat4('u_model', modelMatrix2);
    cube2.draw(shader);
    shader.setMat4('u_model', modelMatrix3);
    cube3.draw(shader);
    shader.setMat4('u_model', modelMatrix4);
    cube4.draw(shader);
    shader.setMat4('u_model', modelMatrix5);
    cube5.draw(shader);

    axes.draw(viewMatrix2, projMatrix2);

    gl.disable(gl.SCISSOR_TEST)
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('Failed to initialize WebGL');
        }
        
        await initShader();

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix1,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            700 / 700, // aspect ratio
            0.1, // near
            100.0 // far
        );

        mat4.ortho(
            projMatrix2,
            -10, 10, -10, 10,
            0.1, 100.0
        );

        // 시작 시간과 마지막 프레임 시간 초기화
        startTime = Date.now();
        lastFrameTime = startTime;

        // setup text
        let l1 = "Camera pos: (" + cameraPos1[0].toFixed(1) + ", " + cameraPos1[1].toFixed(1) + ", " + cameraPos1[2].toFixed(1) + ") | Yaw: " + yaw.toFixed(1) + "° | Pitch: " + pitch.toFixed(1) + "°";
        let l2 = "WASD: move | Mouse: rotate (click to lock) | ESC: unlock";
        let l3 = "Left: Perspective | Right: Orthographic (Top-Down)";
        textOverlay1 = setupText(canvas, l1, 1);
        textOverlay2 = setupText(canvas, l2, 2);
        textOverlay3 = setupText(canvas, l3, 3);


        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}
