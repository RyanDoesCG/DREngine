(function () {
    var canvas = document.getElementById('canv')
    var gl = canvas.getContext("webgl2")
    var ui = document.getElementById("ui")

    var extensions = gl.getSupportedExtensions();
    console.log(extensions)

    var ext = gl.getExtension('EXT_color_buffer_float');

    // SHADERS
    var basePassShaderProgram  = createProgram (gl, 
        createShader  (gl, gl.VERTEX_SHADER,   basePassVertexShaderSource), 
        createShader  (gl, gl.FRAGMENT_SHADER, basePassFragmentShaderSource));

    var presentPassShaderProgram  = createProgram (gl, 
        createShader  (gl, gl.VERTEX_SHADER, presentPassVertexShaderSource), 
        createShader  (gl, gl.FRAGMENT_SHADER, 
            presentPassFragmentShaderHeaderSource +
            presentPassFragmentShaderFooterSource));

    // FRAME BUFFERS
    var albedoBuffer = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE)
    var normalBuffer = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA32F, gl.FLOAT)
    var uvBuffer     = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA32F, gl.FLOAT)
    var depthBuffer  = createDepthTexture(gl, canvas.width, canvas.height)
    var basePassFrameBuffer = createFramebuffer(gl, 
        albedoBuffer, 
        normalBuffer,
        uvBuffer,
        depthBuffer)

    var presentPassAlbedoSampler = gl.getUniformLocation(presentPassShaderProgram, "AlbedoBuffer");
    var presentPassNormalSampler = gl.getUniformLocation(presentPassShaderProgram, "NormalBuffer");
    var presentPassUVSampler     = gl.getUniformLocation(presentPassShaderProgram, "UVBuffer");

    var basePassModelMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "model")
    var basePassViewMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "view");
    var basePassProjMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "proj")

    var presentPassLightPositionsUniform = gl.getUniformLocation(presentPassShaderProgram, "LightPositions")
    var presentPassLightColoursUniform = gl.getUniformLocation(presentPassShaderProgram, "LightColours")
    var presentPassLightPowersUniform = gl.getUniformLocation(presentPassShaderProgram, "LightPowers")

    // Screen Pass Geometry Resources
    var screenGeometryVertexArray = gl.createVertexArray();
    gl.bindVertexArray(screenGeometryVertexArray);
    var screenGeometryPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenGeometryPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, screenGeometryPositions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    var screenGeometryUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenGeometryUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, screenGeometryUVs, gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    // Scene Geometry Resources
    var triangleGeometryVertexArray = gl.createVertexArray();
    gl.bindVertexArray(triangleGeometryVertexArray);

    var triangleGeometryPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeometryPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleGeometryPositions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    var triangleGeometryNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeometryNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleGeometryNormals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    var triangleGeometryUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeometryUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleGeometryUVs, gl.STATIC_DRAW);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(2);

    // LIGHTS
    var LightPositions = [
        -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0),
        -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0),
        -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0),
        -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0),
        -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0), -2.0 + (Math.random() * 4.0),
    ]
    var LightColours = [
        Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(),
    ]
    var LightPowers = [
        Math.random(), 
        Math.random(), 
        Math.random(),
        Math.random(), 
        Math.random()
    ]

    // SCENE
    var BoxPositions = [
        [ 0.0, -3.5, 0.0],
        [ 0.0, 0.0, 0.0],

    ]
    var BoxSizes = [
        [ 6.0, 6.0, 6.0 ],
        [ 1.0, 1.0, 1.0 ],
    ]

    // CAMERA
    var CameraPosition = new Float32Array([0.0, 0.0, -2.0])
    var CameraVelocity = new Float32Array([0.0, 0.0, 0.0])

    var CameraRotation = new Float32Array([0.0, 0.0, 0.0])
    var CameraAngularVelocity = new Float32Array([0.0, 0.0, 0.0])

    // RENDER PASSES
    function BasePass () {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, basePassFrameBuffer);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST)
        gl.cullFace(gl.BACK);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1,gl.COLOR_ATTACHMENT2]);
        gl.useProgram(basePassShaderProgram);
        gl.bindVertexArray(triangleGeometryVertexArray);

        var projMatrix = perspective(100, 0.01, 100.0)
        gl.uniformMatrix4fv(basePassProjMatrixLocation, false, projMatrix)

        var viewMatrix = identity()
        viewMatrix = multiplym(translate(-CameraPosition[0], -CameraPosition[1], CameraPosition[2]), viewMatrix)
        viewMatrix = multiplym(rotate(CameraRotation[0], CameraRotation[1], CameraRotation[2]), viewMatrix) 
        gl.uniformMatrix4fv(basePassViewMatrixLocation, false, viewMatrix)

        for (var i = 0; i < BoxPositions.length; ++i)
        {
            var modelMatrix = identity()
            modelMatrix = multiplym(scale(BoxSizes[i][0], BoxSizes[i][0], BoxSizes[i][0]), modelMatrix)
            modelMatrix = multiplym(translate(BoxPositions[i][0], BoxPositions[i][1], BoxPositions[i][2]), modelMatrix)

            gl.uniformMatrix4fv(basePassModelMatrixLocation, false, modelMatrix);
            gl.drawArrays(gl.TRIANGLES, 0, triangleGeometryPositions.length / 3);
        }
    }

    function PresentPass () {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(presentPassShaderProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, albedoBuffer);
        gl.uniform1i(presentPassAlbedoSampler, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalBuffer);
        gl.uniform1i(presentPassNormalSampler, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, uvBuffer);
        gl.uniform1i(presentPassUVSampler, 2);

        gl.uniform3fv(presentPassLightPositionsUniform, LightPositions);
        gl.uniform3fv(presentPassLightColoursUniform, LightColours);
        gl.uniform1fv(presentPassLightPowersUniform, LightPowers);

        gl.bindVertexArray(screenGeometryVertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function Render () {
        BasePass();
        PresentPass();
    }

    var frameID = 0;
    function Loop () {
        PollInput();
        DoMovement();

        if (ImagesLoaded.every(v => v))
        {
            Render();
        }

        frameID++;
        requestAnimationFrame(Loop)
    }

    Loop()

    var APressed = false;
    var DPressed = false;
    var WPressed = false;
    var SPressed = false;
    var QPressed = false;
    var EPressed = false;

    var LeftArrowPressed = false;
    var RightArrowPressed = false;

    var UpArrowPressed = false;
    var DownArrowPressed = false;

    function PollInput() {
        var speed = 0.01

        var viewMatrix = multiplym(rotate(CameraRotation[0], CameraRotation[1], CameraRotation[2]), identity())
        var forward = multiplyv(vec4(0.0, 0.0, 1.0, 0.0), viewMatrix) 
        var right = cross(forward, vec4(0.0, -1.0, 0.0, 0.0))

        ui.innerHTML  = "<p>" + forward[0].toString() + " " + forward[1].toString() + " " + forward[2].toString() + "</p>"
        ui.innerHTML += "<p>" + right[0].toString() + " " + right[1].toString() + " " + right[2].toString() + "</p>"

        if (DPressed) CameraVelocity = addv(CameraVelocity, multiplys(right,  speed))
        if (APressed) CameraVelocity = addv(CameraVelocity, multiplys(right, -speed))
        if (WPressed) CameraVelocity = addv(CameraVelocity, multiplys(forward, speed))
        if (SPressed) CameraVelocity = addv(CameraVelocity, multiplys(forward, -speed))
        if (QPressed) CameraVelocity[1] -= speed
        if (EPressed) CameraVelocity[1] += speed

        if (LeftArrowPressed)  CameraAngularVelocity[1] -= speed;
        if (RightArrowPressed) CameraAngularVelocity[1] += speed;
        if (UpArrowPressed)    CameraAngularVelocity[0] -= speed;
        if (DownArrowPressed)  CameraAngularVelocity[0] += speed;
        
    }

    function DoMovement() {
        CameraPosition = addv(CameraPosition, CameraVelocity)
        CameraVelocity = multiplys(CameraVelocity, 0.7)

        CameraRotation = addv(CameraRotation, CameraAngularVelocity)
        CameraAngularVelocity = multiplys(CameraAngularVelocity, 0.8)
    }

    function flipkey (event) {
        if      (event.key == 'a') APressed = !APressed
        else if (event.key == 'd') DPressed = !DPressed
        else if (event.key == 's') SPressed = !SPressed
        else if (event.key == 'w') WPressed = !WPressed
        else if (event.key == 'q') QPressed = !QPressed
        else if (event.key == 'e') EPressed = !EPressed
        else if (event.key == 'ArrowLeft') LeftArrowPressed = !LeftArrowPressed
        else if (event.key == 'ArrowRight') RightArrowPressed = !RightArrowPressed
        else if (event.key == 'ArrowUp') UpArrowPressed = !UpArrowPressed
        else if (event.key == 'ArrowDown') DownArrowPressed = !DownArrowPressed
    }

    document.addEventListener('keyup', flipkey)
    document.addEventListener('keydown', flipkey);
}())