(function () {
    var canvas = document.getElementById('canv')
    var gl = canvas.getContext("webgl2")
    var ui = document.getElementById("ui")
    var notes = document.getElementById("notes")
    var size = document.getElementById("size")

    var extensions = gl.getSupportedExtensions();
    console.log(extensions)
    var ext = gl.getExtension('EXT_color_buffer_float');

    let FORWARD = vec4(0.0, 0.0, -1.0, 0.0);
    let RIGHT = vec4(1.0, 0.0, 0.0, 0.0);
    let UP = vec4(0.0, 1.0, 0.0, 0.0);

    // SHADERS
    var basePassShaderProgram  = createProgram (gl, 
        createShader  (gl, gl.VERTEX_SHADER,   basePassVertexShaderSource), 
        createShader  (gl, gl.FRAGMENT_SHADER, basePassFragmentShaderSource));

    var LightingPassShaderProgram  = createProgram (gl, 
        createShader  (gl, gl.VERTEX_SHADER, LightingPassVertexShaderSource), 
        createShader  (gl, gl.FRAGMENT_SHADER, 
            LightingPassFragmentShaderHeaderSource +
            LightingPassFragmentShaderFooterSource));

    var TAAPassShaderProgram = createProgram(gl,
        createShader(gl, gl.VERTEX_SHADER, TAAPassVertexShaderSource),
        createShader(gl, gl.FRAGMENT_SHADER, 
            TAAPassFragmentShaderHeaderSource +
            TAAPassFragmentShaderFooterSource))

    var SharpenPassShaderProram = createProgram(gl, 
        createShader(gl, gl.VERTEX_SHADER, SharpenPassVertexShaderSource),
        createShader(gl, gl.FRAGMENT_SHADER, SharpenPassFragmentShaderSource))

    // FRAME BUFFERS
    var albedoBuffer = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE)
    var normalBuffer = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE)
    var uvBuffer     = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA32F, gl.FLOAT)
    var depthBuffer  = createDepthTexture(gl, canvas.width, canvas.height)
    var basePassFrameBuffer = createFramebuffer(gl, 
        albedoBuffer, 
        normalBuffer,
        uvBuffer,
        depthBuffer)

    var LightingBuffers = [15]
    for (var i = 0; i < 15; ++i)
        LightingBuffers[i] = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE)

    var AABuffer = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE)
    var AAFrameBuffer = createFramebuffer(gl, 
        AABuffer)

    var ViewTransforms = [15]
    for (var i = 0; i < 15; ++i)
        ViewTransforms[i] = identity()

    var LightingPassFrameBuffer = createFramebuffer(gl, LightingBuffers[0])

    // TEXTURES
    var PerlinNoiseTexture = loadTexture(gl, 'images/noise/simplex.png')
    var WhiteNoiseTexture = loadTexture(gl, 'images/noise/white.png')
    var BlueNoiseTexture = loadTexture(gl, 'images/noise/blue.png')

    // UNIFORMS
    var basePassModelMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "model")
    var basePassViewMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "view");
    var basePassProjMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "proj")
    var basePassTimeUniform = gl.getUniformLocation(basePassShaderProgram, "Time")

    var LightingPassPerlinNoiseSampler = gl.getUniformLocation(LightingPassShaderProgram, "PerlinNoise")
    var LightingPassWhiteNoiseSampler = gl.getUniformLocation(LightingPassShaderProgram, "WhiteNoise")
    var LightingPassBlueNoiseSampler= gl.getUniformLocation(LightingPassShaderProgram, "BlueNoise")

    var LightingPassLightPositionsUniform = gl.getUniformLocation(LightingPassShaderProgram, "LightPositions")
    var LightingPassLightColoursUniform = gl.getUniformLocation(LightingPassShaderProgram, "LightColours")
    var LightingPassLightPowersUniform = gl.getUniformLocation(LightingPassShaderProgram, "LightPowers")

    var LightingPassBoxPositions = gl.getUniformLocation(LightingPassShaderProgram, "BoxPositions")
    var LightingPassBoxSizes = gl.getUniformLocation(LightingPassShaderProgram, "BoxSizes")

    var LightingPassAlbedoSampler = gl.getUniformLocation(LightingPassShaderProgram, "AlbedoBuffer");
    var LightingPassNormalSampler = gl.getUniformLocation(LightingPassShaderProgram, "NormalBuffer");
    var LightingPassUVSampler     = gl.getUniformLocation(LightingPassShaderProgram, "UVBuffer");
    var LightingPassTimeUniform = gl.getUniformLocation(LightingPassShaderProgram, "Time")
    var LightingPassCameraPositionUniform = gl.getUniformLocation(LightingPassShaderProgram, "CameraPosition")
    var LightingPassViewToWorldUniform = gl.getUniformLocation(LightingPassShaderProgram, "ViewToWorld");
    var LightingPassWorldToViewUniform = gl.getUniformLocation(LightingPassShaderProgram, "WorldToView")

    var TAAPassDepthBufferSampler = gl.getUniformLocation(TAAPassShaderProgram, "DepthBuffer")
    var TAAPassFrameBufferSamplers = gl.getUniformLocation(TAAPassShaderProgram, "Frames")

    var TAAPassView0Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View0")
    var TAAPassView1Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View1")
    var TAAPassView2Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View2")
    var TAAPassView3Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View3")
    var TAAPassView4Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View4")
    var TAAPassView5Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View5")
    var TAAPassView6Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View6")
    var TAAPassView7Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View7")
    var TAAPassView8Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View8")
    var TAAPassView9Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View9")
    var TAAPassView10Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View10")
    var TAAPassView11Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View11")
    var TAAPassView12Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View12")
    var TAAPassView13Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View13")
    var TAAPassView14Uniform = gl.getUniformLocation(TAAPassShaderProgram, "View14")

    var TAAPassCameraPositionUniform = gl.getUniformLocation(TAAPassShaderProgram, "CameraPosition")
    var TAAPassCameraForwardUniform = gl.getUniformLocation(TAAPassShaderProgram, "CameraForward")


    var TAAPassNearUniform = gl.getUniformLocation(TAAPassShaderProgram, "Near")
    var TAAPassFarUniform = gl.getUniformLocation(TAAPassShaderProgram, "Far")
    var TAAPassTimeUniform = gl.getUniformLocation(TAAPassShaderProgram, "Time")
    
    var SharpenPassFramebufferSampler = gl.getUniformLocation(SharpenPassShaderProram, "FrameBuffer")

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
        0.0, 1.8, -8.0
    ]
    var LightColours = [
        1.0, 1.0, 1.0,
    ]
    var LightPowers = [
        1.0, 
    ]

    // SCENE
    var BoxPositions = [
         0.0,  -2.0, -8.0,
         2.0,  0.0,  -8.0,
         -2.0, 0.0,  -8.0,
         0.0,  0.0,  -9.95, // z inverted
         0.0,  2.0,  -8.0,
         0.0,  -1.45, -8.0
        ]

    var BoxSizes = [
        3.9, 0.1, 4.0,
        0.1, 4.1, 4.0,
        0.1, 4.1, 4.0,
        4.0, 4.0, 0.1,
        3.9, 0.1, 4.0,
        1.0, 1.0, 1.0,]

    // CAMERA
    var CameraPosition = vec4(0.0, 0.0, 0.0, 1.0)
    var CameraVelocity = vec4(0.0, 0.0, 0.0, 0.0)

    var CameraRotation = new Float32Array([0.0, 0.0, 0.0])
    var CameraAngularVelocity = new Float32Array([0.0, 0.0, 0.0])

    var LastCameraPosition = CameraPosition
    var LastCameraRotation = CameraRotation
    var ViewTransformHasChanged = true;

    var Near = 0.01
    var Far = 50.0
    var FOV = 45.0;

    var projMatrix = identity();
    var worldToViewMatrix = identity();
    var viewToWorldMatrix = identity();
    var modelMatrix = identity();

    var CameraForward = FORWARD;
    var CameraRight = RIGHT;
    var CameraUp = UP;

    function ComputeView () {
        projMatrix = perspective(FOV, Near, Far)

        worldToViewMatrix = identity()
        worldToViewMatrix = multiplym(translate(-CameraPosition[0], -CameraPosition[1], -CameraPosition[2]), worldToViewMatrix)
        worldToViewMatrix = multiplym(rotate(CameraRotation[0], CameraRotation[1], CameraRotation[2]), worldToViewMatrix) 
        
        viewToWorldMatrix = identity()
        viewToWorldMatrix = multiplym(translate(CameraPosition[0], CameraPosition[1], CameraPosition[2]), viewToWorldMatrix)
        viewToWorldMatrix = multiplym(rotate(-CameraRotation[0], -CameraRotation[1], -CameraRotation[2]), viewToWorldMatrix)

        CameraForward = normalize(multiplyv(FORWARD, viewToWorldMatrix))
        CameraRight = normalize(multiplyv(RIGHT, viewToWorldMatrix))
        CameraUp = normalize(multiplyv(UP, viewToWorldMatrix))
    }

    // RENDER PASSES
    function BasePass () {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, basePassFrameBuffer);
        gl.clearColor(1.0, 1.0, 1.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.DEPTH_TEST)
        gl.disable(gl.BLEND)
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1,gl.COLOR_ATTACHMENT2]);
        gl.useProgram(basePassShaderProgram);
        gl.bindVertexArray(triangleGeometryVertexArray);

        gl.uniform1f(basePassTimeUniform, frameID);
        gl.uniformMatrix4fv(basePassProjMatrixLocation, false, projMatrix)
        gl.uniformMatrix4fv(basePassViewMatrixLocation, false, worldToViewMatrix)
        
        var LastView = ViewTransforms.pop();
        ViewTransforms.unshift(multiplym(projMatrix, worldToViewMatrix))

        for (var i = 0; i < BoxPositions.length * 3; i += 3)
        {
            modelMatrix = identity()
            modelMatrix = multiplym(scale(BoxSizes[i + 0], BoxSizes[i + 1], BoxSizes[i + 2]), modelMatrix)
            modelMatrix = multiplym(translate(BoxPositions[i + 0], BoxPositions[i + 1], BoxPositions[i + 2]), modelMatrix)

            gl.uniformMatrix4fv(basePassModelMatrixLocation, false, modelMatrix);
            gl.drawArrays(gl.TRIANGLES, 0, triangleGeometryPositions.length / 3);
        }

        //gl.depthFunc(gl.GREATER);
    }

    function LightingPass () {
        gl.viewport(0, 0, canvas.width, canvas.height);

        var LastBuffer = LightingBuffers.pop();
        LightingBuffers.unshift(LastBuffer);

        LightingPassFrameBuffer = createFramebuffer(gl, LightingBuffers[0])

        gl.bindFramebuffer(gl.FRAMEBUFFER, LightingPassFrameBuffer);
        gl.useProgram(LightingPassShaderProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, albedoBuffer);
        gl.uniform1i(LightingPassAlbedoSampler, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalBuffer);
        gl.uniform1i(LightingPassNormalSampler, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, uvBuffer);
        gl.uniform1i(LightingPassUVSampler, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, PerlinNoiseTexture);
        gl.uniform1i(LightingPassPerlinNoiseSampler, 3);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, WhiteNoiseTexture);
        gl.uniform1i(LightingPassWhiteNoiseSampler, 4);

        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, BlueNoiseTexture);
        gl.uniform1i(LightingPassBlueNoiseSampler, 5);

        gl.uniform3fv(LightingPassLightPositionsUniform, LightPositions);
        gl.uniform3fv(LightingPassLightColoursUniform, LightColours);
        gl.uniform1fv(LightingPassLightPowersUniform, LightPowers);

        gl.uniform3fv(LightingPassBoxPositions, BoxPositions)
        gl.uniform3fv(LightingPassBoxSizes, BoxSizes)

        gl.uniform1f(LightingPassTimeUniform, frameID);

        gl.uniform4fv(LightingPassCameraPositionUniform, CameraPosition);
        gl.uniformMatrix4fv(LightingPassViewToWorldUniform, false, (viewToWorldMatrix))
        gl.uniformMatrix4fv(LightingPassWorldToViewUniform, false, (worldToViewMatrix))

        gl.bindVertexArray(screenGeometryVertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disable(gl.BLEND)
    }

    function TAAPass () {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, AAFrameBuffer);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(TAAPassShaderProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthBuffer);
        gl.uniform1i(TAAPassDepthBufferSampler, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[0]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[1]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[2]);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[3]);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[4]);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[5]);
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[6]);
        gl.activeTexture(gl.TEXTURE8);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[7]);
        gl.activeTexture(gl.TEXTURE9);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[8]);
        gl.activeTexture(gl.TEXTURE10);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[9]);
        gl.activeTexture(gl.TEXTURE11);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[10]);
        gl.activeTexture(gl.TEXTURE12);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[11]);
        gl.activeTexture(gl.TEXTURE13);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[12]);
        gl.activeTexture(gl.TEXTURE14);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[13]);
        gl.activeTexture(gl.TEXTURE15);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[14]);
        gl.activeTexture(gl.TEXTURE16);
        gl.bindTexture(gl.TEXTURE_2D, LightingBuffers[15]);
        gl.uniform1iv(TAAPassFrameBufferSamplers, [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ])

        gl.uniformMatrix4fv(TAAPassView0Uniform,  false, ViewTransforms[0])
        gl.uniformMatrix4fv(TAAPassView1Uniform,  false, ViewTransforms[1])
        gl.uniformMatrix4fv(TAAPassView2Uniform,  false, ViewTransforms[2])
        gl.uniformMatrix4fv(TAAPassView3Uniform,  false, ViewTransforms[3])
        gl.uniformMatrix4fv(TAAPassView4Uniform,  false, ViewTransforms[4])
        gl.uniformMatrix4fv(TAAPassView5Uniform,  false, ViewTransforms[5])
        gl.uniformMatrix4fv(TAAPassView6Uniform,  false, ViewTransforms[6])
        gl.uniformMatrix4fv(TAAPassView7Uniform,  false, ViewTransforms[7])
        gl.uniformMatrix4fv(TAAPassView8Uniform,  false, ViewTransforms[8])
        gl.uniformMatrix4fv(TAAPassView9Uniform,  false, ViewTransforms[9])
        gl.uniformMatrix4fv(TAAPassView10Uniform, false, ViewTransforms[10])
        gl.uniformMatrix4fv(TAAPassView11Uniform, false, ViewTransforms[11])
        gl.uniformMatrix4fv(TAAPassView12Uniform, false, ViewTransforms[12])
        gl.uniformMatrix4fv(TAAPassView13Uniform, false, ViewTransforms[13])
        gl.uniformMatrix4fv(TAAPassView14Uniform, false, ViewTransforms[14])

        gl.uniform4fv(TAAPassCameraPositionUniform, CameraPosition)

        gl.uniform4fv(TAAPassCameraPositionUniform, multiplyv(FORWARD, viewToWorldMatrix))

        gl.uniform1f(TAAPassNearUniform, Near);
        gl.uniform1f(TAAPassFarUniform, Far);
        gl.uniform1f(TAAPassTimeUniform, frameID);

        gl.bindVertexArray(screenGeometryVertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function SharpenPass() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(SharpenPassShaderProram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, AABuffer);
        gl.uniform1i(SharpenPassFramebufferSampler, 0);

        gl.bindVertexArray(screenGeometryVertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function Render () {
        BasePass();
        LightingPass();
        TAAPass();
        SharpenPass();
        frameID++;
    }

    var hideUI = false;
    var frameID = 1;
    function Loop () {
        PollInput();
        DoMovement();

        if (ImagesLoaded.every(v => v))
        {
            ComputeView();
            Render();
        }

        if (hideUI)
        {
            ui.style.opacity = "0.0";
            notes.style.opacity = "0.0";
            size.style.opacity = "0.0";
        }
        else
        {
            ui.style.opacity = "1.0";
            notes.style.opacity = "1.0";
            size.style.opacity = "1.0";
        }

        ui.innerHTML = "<p>" + 
            CameraPosition[0].toFixed(1) + ", " + 
            CameraPosition[1].toFixed(1) + ", " + 
            CameraPosition[2].toFixed(1) + "</p>"
        
        ui.innerHTML += "<p>" + 
            CameraForward[0].toFixed(1) + ", " + 
            CameraForward[1].toFixed(1) + ", " + 
            CameraForward[2].toFixed(1) + "</p>"

        size.innerHTML = "<p>" + canvas.width + " x " + canvas.height + "</p>"
        size.innerHTML += "<p>" + canvas.clientWidth + " x " + canvas.clientHeight + "</p>"
        
        requestAnimationFrame(Loop)
    }

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
        var speed = 0.02
        var maxVelocity = 1.0
        var minVelocity = 0.01

        if (DPressed) CameraVelocity = addv(CameraVelocity, multiplys(CameraRight,  speed))
        if (APressed) CameraVelocity = addv(CameraVelocity, multiplys(CameraRight, -speed))
        if (WPressed) CameraVelocity = addv(CameraVelocity, multiplys(CameraForward, speed))
        if (SPressed) CameraVelocity = addv(CameraVelocity, multiplys(CameraForward, -speed))
        if (QPressed) CameraVelocity[1] -= speed
        if (EPressed) CameraVelocity[1] += speed

        if (length(CameraVelocity) > maxVelocity)
        {
            CameraVelocity = multiplys(normalize(CameraVelocity), maxVelocity)
        }
        
        if (length(CameraVelocity) < minVelocity)
        {
            CameraVelocity = vec4(0.0, 0.0, 0.0, 0.0)
        }

        var lookSpeed = 0.005
        if (LeftArrowPressed)  CameraAngularVelocity[1] -= lookSpeed;
        if (RightArrowPressed) CameraAngularVelocity[1] += lookSpeed;
        if (UpArrowPressed)    CameraAngularVelocity[0] -= lookSpeed;
        if (DownArrowPressed)  CameraAngularVelocity[0] += lookSpeed;
        
    }

    function DoMovement() {
        CameraPosition = addv(CameraPosition, CameraVelocity)
        CameraVelocity = multiplys(CameraVelocity, 0.9)

        CameraRotation = addv(CameraRotation, CameraAngularVelocity)
        CameraAngularVelocity = multiplys(CameraAngularVelocity, 0.8)

        if (Math.abs(CameraPosition[0] - LastCameraPosition[0]) > 0.000 || 
            Math.abs(CameraPosition[1] - LastCameraPosition[1]) > 0.000 || 
            Math.abs(CameraPosition[2] - LastCameraPosition[2]) > 0.000 ||
            Math.abs(CameraRotation[0] - LastCameraRotation[0]) > 0.000 || 
            Math.abs(CameraRotation[1] - LastCameraRotation[1]) > 0.000 || 
            Math.abs(CameraRotation[2] - LastCameraRotation[2]) > 0.000)
        {
            ViewTransformHasChanged = true
        }
        else
        {
            ViewTransformHasChanged = false
        }

        LastCameraPosition = CameraPosition
        LastCameraRotation = CameraRotation

        document.cookie = "LastCameraX="     + CameraPosition[0];
        document.cookie = "LastCameraY="     + CameraPosition[1];
        document.cookie = "LastCameraZ="     + CameraPosition[2];
        document.cookie = "LastCameraRotationX=" + CameraRotation[0];
        document.cookie = "LastCameraRotationY=" + CameraRotation[1];
        document.cookie = "LastCameraRotationZ=" + CameraRotation[2];

    }

    function flipkey (event) {
        if (!event.repeat)
        {
            if      (event.key == 'a') APressed = !APressed
            else if (event.key == 'd') DPressed = !DPressed
            else if (event.key == 's') SPressed = !SPressed
            else if (event.key == 'w') WPressed = !WPressed
            else if (event.key == 'q') QPressed = !QPressed
            else if (event.key == 'e') EPressed = !EPressed
            else if (event.key == 'ArrowLeft')  LeftArrowPressed  = !LeftArrowPressed
            else if (event.key == 'ArrowRight') RightArrowPressed = !RightArrowPressed
            else if (event.key == 'ArrowUp')    UpArrowPressed    = !UpArrowPressed
            else if (event.key == 'ArrowDown')  DownArrowPressed  = !DownArrowPressed
        }
    }

    function handleKeyDown (event)
    {
        if (event.key == 'u')
        {
            hideUI = !hideUI;
        }

        if (event.key == 'r')
        {
            CameraPosition = vec4(0.0, 0.0, 0.0, 0.0);
            CameraRotation = new Float32Array([0.0, 0.0, 0.0]);
        }
    }

    document.addEventListener('keyup', flipkey)
    document.addEventListener('keydown', flipkey);
    document.addEventListener('keydown', handleKeyDown);

    var CookieRecord = document.cookie;
    console.log(CookieRecord);

    var IndividualCookies = CookieRecord.split(' ');
    if (CookieRecord.includes("LastCameraX"))
    {
      for (var i = 0; i < IndividualCookies.length; ++i)
      {
        if      (IndividualCookies[i].includes("LastCameraX")) CameraPosition[0] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraY")) CameraPosition[1] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraZ")) CameraPosition[2] = parseFloat(IndividualCookies[i].split('=')[1]); 
      }
    }

    if (CookieRecord.includes("LastCameraRotationX"))
    {
      for (var i = 0; i < IndividualCookies.length; ++i)
      {
        if      (IndividualCookies[i].includes("LastCameraRotationX")) CameraRotation[0] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraRotationY")) CameraRotation[1] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraRotationZ")) CameraRotation[2] = parseFloat(IndividualCookies[i].split('=')[1]); 
      }
    }
    Loop()
}())