/*-------------------------------------------------------------------------
modified from 07_LineSegments.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader; // 선분을 그리기 위한 shader program
let shaderCircle; // Circle을 그리기 위한 shader program
let vaoLine; // line을 위한 vertex array object
let vaoCircle; // circle을 위한 vertex array object
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let screenBoundBuffer; // 화면 전체를 덮는 사각형의 vertex buffer
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치
let lines = []; // 그려진 선분들을 저장하는 array
let textOverlay; // Circle 정보 표시
let textOverlay2; // Line segment 정보 표시
let textOverlay3; // Intersection 정보 표시
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)
let intersectionPoints = [];

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
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
    window.addEventListener('resize', () => { render() }); // 화면 크기가 조정될 때마다 render 함수를 호출하여 화면을 다시 그리도록 함

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vaoLine = gl.createVertexArray();
    gl.bindVertexArray(vaoLine);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    vaoCircle = gl.createVertexArray();
    gl.bindVertexArray(vaoCircle);
    const Bounds = [-1,-1,  1,-1,  -1,1,  -1,1,  1,-1,  1,1];
    screenBoundBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenBoundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Bounds), gl.STATIC_DRAW);
    shaderCircle.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}


function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표
        
        if (!isDrawing && lines.length < 2) { 
            // 1번 또는 2번 선분을 그리고 있는 도중이 아닌 경우 (즉, mouse down 상태가 아닌 경우)
            // 캔버스 좌표를 WebGL 좌표로 변환하여 선분의 시작점을 설정
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
        }
    }

    function handleMouseMove(event) {
        if (isDrawing) { // 1번 또는 2번 선분을 그리고 있는 도중인 경우
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY]; // 임시 선분의 끝 point
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            // lines.push([...startPoint, ...tempEndPoint])
            //   : startPoint와 tempEndPoint를 펼쳐서 하나의 array로 합친 후 lines에 추가
            // ex) lines = [] 이고 startPoint = [1, 2], tempEndPoint = [3, 4] 이면,
            //     lines = [[1, 2, 3, 4]] 이 됨
            // ex) lines = [[1, 2, 3, 4]] 이고 startPoint = [5, 6], tempEndPoint = [7, 8] 이면,
            //     lines = [[1, 2, 3, 4], [5, 6, 7, 8]] 이 됨

            lines.push([...startPoint, ...tempEndPoint]); 

            if (lines.length == 1) {
                updateText(textOverlay, "Circle: center (" + lines[0][0].toFixed(2) + ", " + lines[0][1].toFixed(2) + ") radius = " + dist(lines[0][0], lines[0][1], lines[0][2], lines[0][3]).toFixed(2));
            }
            else { // lines.length == 2
                updateText(textOverlay2, "Line segment: (" + lines[1][0].toFixed(2) + ", " + lines[1][1].toFixed(2) + 
                    ") ~ (" + lines[1][2].toFixed(2) + ", " + lines[1][3].toFixed(2) + ")");

                calcIntersection(lines[0], lines[1]);
                let text3;
                if (intersectionPoints.length == 0) {
                    text3 = "No intersection";
                } else {
                    text3 = "Intersection Points: " + intersectionPoints.length + " ";
                }
                for (let i = 0; i < intersectionPoints.length; i++) {
                    text3 += "Point " + (i + 1).toString() + ": (" + intersectionPoints[i][0].toFixed(2) + ", " + intersectionPoints[i][1].toFixed(2) + ") ";
                }
                updateText(textOverlay3, text3);
            }

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // 저장된 선들 그리기
    let num = 0;
    for (let line of lines) {
        if (num == 0) { // 첫 번째인 경우, purple circle
            shaderCircle.use();
            shaderCircle.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
            shaderCircle.setVec2("center", [line[0], line[1]]);
            shaderCircle.setFloat("radius", dist(line[0], line[1], line[2], line[3]));
            gl.bindVertexArray(vaoCircle);
            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }
        else { // num == 1 (2번째 선분인 경우), white line + intersection point에 point size 10
            shader.use();
            shader.setVec4("u_color", [1.0, 1.0, 1.0, 1.0]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vaoLine);
            gl.drawArrays(gl.LINES, 0, 2);
        }
        num++;
    }

    // intersection point 그리기
    for (let point of intersectionPoints) {
        shader.use();
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // intersection point는 yellow
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);
        gl.bindVertexArray(vaoLine);
        gl.drawArrays(gl.POINTS, 0, 1); // point size는 shader에서 설정
    }


    // 임시 Circle 그리기
    if (isDrawing && startPoint && tempEndPoint && lines.length == 0) { // 1번째에만 임시 Circle 그리기
        shaderCircle.use();
        shaderCircle.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);

        shaderCircle.setVec2("center", [startPoint[0], startPoint[1]]);
        shaderCircle.setFloat("radius", dist(startPoint[0], startPoint[1], tempEndPoint[0], tempEndPoint[1]));
        gl.bindVertexArray(vaoCircle);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // 임시 선 그리기
    if (isDrawing && startPoint && tempEndPoint && lines.length == 1) { // 2번째에만 임시 선 그리기
        shader.use();
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), 
                      gl.STATIC_DRAW);
        gl.bindVertexArray(vaoLine);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    const circleFragmentShaderSource = await readShaderFile('shFragCircle.glsl');

    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
    shaderCircle = new Shader(gl, vertexShaderSource, circleFragmentShaderSource);
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 교차점 이차방정식 계산
function calcIntersection(circle, line) {
    const A = (line[2] - line[0]) ** 2 + (line[3] - line[1]) ** 2;
    const B = 2 * ((line[2] - line[0]) * (line[0] - circle[0]) + (line[3] - line[1]) * (line[1] - circle[1]));
    const C = (line[0] - circle[0]) ** 2 + (line[1] - circle[1]) ** 2 - (circle[0] - circle[2])** 2 - (circle[1] - circle[3])** 2;

    const discriminant = B ** 2 - 4 * A * C;

    if (discriminant > 0) {
        const t1 = (-B + Math.sqrt(discriminant)) / (2 * A);
        const t2 = (-B - Math.sqrt(discriminant)) / (2 * A);

        if (0 <= t1 && t1 <= 1) {
            intersectionPoints.push([line[0] + t1 * (line[2] - line[0]), line[1] + t1 * (line[3] - line[1])]);
        }
        if (0 <= t2 && t2 <= 1) {
            intersectionPoints.push([line[0] + t2 * (line[2] - line[0]), line[1] + t2 * (line[3] - line[1])]);
        }
    }
    else if (discriminant === 0) {
        const t = (-B / (2 * A));

        if (0 <= t && t <= 1) {
            intersectionPoints.push([line[0] + t * (line[2] - line[0]), line[1] + t * (line[3] - line[1])]);
        }
    }
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
            return false; 
        }

        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
