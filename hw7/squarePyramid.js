/*-----------------------------------------------------------------------------
modified from cube.js

1) Vertex positions
    A Pyramid have 5 faces. side faces are 1 triangle
    and bottom face consists of 2 triangle 
    The total number of vertices is 16 (4 * 3 + 4)
    So, vertices need 48 floats (16 * 3 (x, y, z)) in the vertices array

2) Vertex indices
        v0
        /\\
       /: \ \
      / :  \  \
     /__:___\ _ \
     v1 v4  v2 v3


    The order of faces and their vertex indices is as follows:
        side_front (0,1,2), side_right (0,2,3), side_back (0,3,4), side_left (0,4,1)
        bottom (1,4,3,2)
-----------------------------------------------------------------------------*/

export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data
        this.vertices = new Float32Array([
            // side_front
            0, 1, 0,   -0.5, 0, 0.5,   0.5, 0, 0.5,
            // side_right
            0, 1, 0,   0.5, 0, 0.5,    0.5, 0, -0.5,
            // side_back
            0, 1, 0,   0.5, 0, -0.5,   -0.5, 0, -0.5,
            // side_left
            0, 1, 0,   -0.5, 0, -0.5,  -0.5, 0, 0.5,
            // bottom
            -0.5, 0, 0.5,   -0.5, 0, -0.5,    0.5, 0, -0.5,   0.5, 0, 0.5
        ]);

        const OneOverSqrt5 = 1 / Math.sqrt(5);
        const TwoOverSqrt5 = 2 / Math.sqrt(5);
        this.normals = new Float32Array([
            // side_front
            0, OneOverSqrt5, TwoOverSqrt5,   0, OneOverSqrt5, TwoOverSqrt5,   0, OneOverSqrt5, TwoOverSqrt5,
            // side_right
            TwoOverSqrt5, OneOverSqrt5, 0,   TwoOverSqrt5, OneOverSqrt5, 0,   TwoOverSqrt5, OneOverSqrt5, 0,
            // side_back
            0, OneOverSqrt5, -TwoOverSqrt5,   0, OneOverSqrt5, -TwoOverSqrt5,   0, OneOverSqrt5, -TwoOverSqrt5,
            // side_left
            -TwoOverSqrt5, OneOverSqrt5, 0,   -TwoOverSqrt5, OneOverSqrt5, 0,   -TwoOverSqrt5, OneOverSqrt5, 0,
            // bottom
            0, -1, 0,   0, -1, 0,   0, -1, 0,   0, -1, 0
        ]);

        // if color is provided, set all vertices' color to the given color
        if (options.color) {
            for (let i = 0; i < 16 * 4; i += 4) {
                this.colors[i] = options.color[0];
                this.colors[i+1] = options.color[1];
                this.colors[i+2] = options.color[2];
                this.colors[i+3] = options.color[3];
            }
        }
        else {
            this.colors = new Float32Array([
                // side_front - red
                1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1, 
                // side_right - yellow
                1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,
                // side_back - magenta
                1, 0, 1, 1,   1, 0, 1, 1,   1, 0, 1, 1,
                // side_left - cyan
                0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1,
                // bottom - blue
                0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,
            ]);
        }

        // texCoord Settings. (most likely from video)
        this.texCoords = new Float32Array([
            // side_front
            0.25, 1,   0, 0,   0.25, 0,
            // side_right
            0.5, 1,   0.25, 0,   0.5, 0, 
            // side_back
            0.75, 1,   0.5, 0,   0.75, 0, 
            // side_left
            1, 1,   0.75, 0,   1, 0,  
            // bottom face - seems texture is heading backward (v1-v4-v3-v2)
            0, 0,   0, 1,   1, 1,  1, 0
        ]);

        this.indices = new Uint16Array([
            // side_front
            0, 1, 2,
            // side_right
            3, 4, 5,
            // side_back
            6, 7, 8,
            // side_left
            9, 10, 11,
            // bottom face
            13, 14, 15,  15, 12, 13, // v4-v3-v2, v2-v1-v4

        ]);

        this.sameVertices = new Uint16Array([
            0, 3, 6, 9,    // indices of the same vertices as v0
            1, 11, 12,  // indices of the same vertices as v1
            2, 4, 15,  // indices of the same vertices as v2
            5, 7, 14,   // indices of the same vertices as v3
            8, 10, 13,  // indices of the same vertices as v4
        ]);

        this.vertexNormals = new Float32Array(48);
        this.faceNormals = new Float32Array(48);
        this.faceNormals.set(this.normals);

        // compute vertex normals (by averaging face normals)

        let i = 0;
        let vn_x, vn_y, vn_z;
        while (i < 16) {
            if (i == 0) {
                vn_x = (this.vertexNormals[this.sameVertices[i] * 3] +
                        this.vertexNormals[this.sameVertices[i+1] * 3] +
                        this.vertexNormals[this.sameVertices[i+2] * 3] +
                        this.vertexNormals[this.sameVertices[i+3] * 3]) / 4;
                vn_y = (this.vertexNormals[this.sameVertices[i] * 3 + 1] +
                        this.vertexNormals[this.sameVertices[i+1] * 3 + 1] +
                        this.vertexNormals[this.sameVertices[i+2] * 3 + 1] +
                        this.vertexNormals[this.sameVertices[i+3] * 3 + 1]) / 4;
                vn_z = (this.vertexNormals[this.sameVertices[i] * 3 + 2] +
                        this.vertexNormals[this.sameVertices[i+1] * 3 + 2] +
                        this.vertexNormals[this.sameVertices[i+2] * 3 + 2] +
                        this.vertexNormals[this.sameVertices[i+3] * 3 + 2]) / 4;

                this.vertexNormals[this.sameVertices[i]*3] = vn_x;
                this.vertexNormals[this.sameVertices[i+1]*3] = vn_x;
                this.vertexNormals[this.sameVertices[i+2]*3] = vn_x;
                this.vertexNormals[this.sameVertices[i+3]*3] = vn_x;
                this.vertexNormals[this.sameVertices[i]*3 + 1] = vn_y;
                this.vertexNormals[this.sameVertices[i+1]*3 + 1] = vn_y;
                this.vertexNormals[this.sameVertices[i+2]*3 + 1] = vn_y;
                this.vertexNormals[this.sameVertices[i+3]*3 + 1] = vn_y;
                this.vertexNormals[this.sameVertices[i]*3 + 2] = vn_z;
                this.vertexNormals[this.sameVertices[i+1]*3 + 2] = vn_z;
                this.vertexNormals[this.sameVertices[i+2]*3 + 2] = vn_z;
                this.vertexNormals[this.sameVertices[i+3]*3 + 2] = vn_z;

                i += 4;
            } else {
                vn_x = (this.vertexNormals[this.sameVertices[i] * 3] +
                        this.vertexNormals[this.sameVertices[i+1] * 3] +
                        this.vertexNormals[this.sameVertices[i+2] * 3]) / 3;
                vn_y = (this.vertexNormals[this.sameVertices[i] * 3 + 1] +
                        this.vertexNormals[this.sameVertices[i+1] * 3 + 1] +
                        this.vertexNormals[this.sameVertices[i+2] * 3 + 1]) / 3;
                vn_z = (this.vertexNormals[this.sameVertices[i] * 3 + 2] +
                        this.vertexNormals[this.sameVertices[i+1] * 3 + 2] +
                        this.vertexNormals[this.sameVertices[i+2] * 3 + 2]) / 3;

                this.vertexNormals[this.sameVertices[i]*3] = vn_x;
                this.vertexNormals[this.sameVertices[i+1]*3] = vn_x;
                this.vertexNormals[this.sameVertices[i+2]*3] = vn_x;
                this.vertexNormals[this.sameVertices[i]*3 + 1] = vn_y;
                this.vertexNormals[this.sameVertices[i+1]*3 + 1] = vn_y;
                this.vertexNormals[this.sameVertices[i+2]*3 + 1] = vn_y;
                this.vertexNormals[this.sameVertices[i]*3 + 2] = vn_z;
                this.vertexNormals[this.sameVertices[i+1]*3 + 2] = vn_z;
                this.vertexNormals[this.sameVertices[i+2]*3 + 2] = vn_z;

                i += 3;
            }
        }

        this.initBuffers();
    }

    copyVertexNormalsToNormals() {
        this.normals.set(this.vertexNormals);
    }

    copyFaceNormalsToNormals() {
        this.normals.set(this.faceNormals);
    }

    initBuffers() {
        const gl = this.gl;

        // 버퍼 크기 계산
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // VBO에 데이터 복사
        // gl.bufferSubData(target, offset, data): target buffer의 
        //     offset 위치부터 data를 copy (즉, data를 buffer의 일부에만 copy)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // EBO에 인덱스 데이터 복사
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertex attributes 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);  // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);  // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);  // texCoord

        // vertex attributes 활성화
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // 버퍼 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        // normals 데이터만 업데이트
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {

        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 