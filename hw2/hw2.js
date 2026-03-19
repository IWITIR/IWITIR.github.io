/*-------------------------------------------------------------------------
modified from 06_FlipTriangle.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;   // shader program
let vao;      // vertex array object
let overlay;
let offsetSquare = [0.0, 0.0];

const initVertices = new Float32Array([
    -0.1, -0.1, 0.0,  // Bottom left
    0.1, -0.1, 0.0,  // Bottom right
    0.1,  0.1, 0.0,  // Top right
    -0.1,  0.1, 0.0   // Top left
]);

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'ArrowUp') {
            moveSquare(0, 0.01);
        }
        else if (event.key == 'ArrowDown') {
            moveSquare(0, -0.01);
        }
        else if (event.key == 'ArrowLeft') {
            moveSquare(-0.01, 0);
        }
        else if (event.key == 'ArrowRight') {
            moveSquare(0.01, 0);
        }
    });
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, initVertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const color = [1.0, 0.0, 0.0, 1.0]; // square is red

    shader.setVec4("uColor", color);
    shader.setVec2("offset2D", offsetSquare);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    requestAnimationFrame(() => render());
}

function moveSquare(dx, dy) {
    // x bound check
    if (initVertices[0] + offsetSquare[0] + dx < -1.0) {
        dx = -1.0 - initVertices[0] - offsetSquare[0]; // left bound
    }
    if (initVertices[3] + offsetSquare[0] + dx > 1.0) {
        dx = 1.0 - initVertices[3] - offsetSquare[0]; // right bound
    }

    // y bound check
    if (initVertices[1] + offsetSquare[1] + dy < -1.0) {
        dy = -1.0 - initVertices[1] - offsetSquare[1]; // bottom bound
    }
    if (initVertices[7] + offsetSquare[1] + dy > 1.0) {
        dy = 1.0 - initVertices[7] - offsetSquare[1]; // top bound
    }

    offsetSquare[0] += dx;
    offsetSquare[1] += dy;
}

async function main() {
    try {

        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        // 셰이더 초기화
        await initShader();

        // setup text overlay (see util.js)
        overlay = setupText(canvas, "Use arrow keys to move the rectangle", 1);

        // 키보드 이벤트 설정
        setupKeyboardEvents();
        
        // 나머지 초기화
        setupBuffers(shader);
        shader.use();
        
        // 렌더링 시작
        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

// call main function
main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});
