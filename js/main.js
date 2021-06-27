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

    var LightingPassShaderProgram  = createProgram (gl, 
        createShader  (gl, gl.VERTEX_SHADER, LightingPassVertexShaderSource), 
        createShader  (gl, gl.FRAGMENT_SHADER, 
            LightingPassFragmentShaderHeaderSource +
            LightingPassFragmentShaderFooterSource));

    var PresentPassShaderProgram = createProgram(gl,
        createShader(gl, gl.VERTEX_SHADER, presentPassVertexShaderSource),
        createShader(gl, gl.FRAGMENT_SHADER, 
            presentPassFragmentShaderHeaderSource +
            presentPassFragmentShaderFooterSource))

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

    var LightingBuffers = [15]
    for (var i = 0; i < 15; ++i)
        LightingBuffers[i] = createColourTexture(gl, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE)

    console.log(LightingBuffers)

    var ViewTransforms = [15]
    for (var i = 0; i < 15; ++i)
        ViewTransforms[i] = identity()

    var LightingPassFrameBuffer = createFramebuffer(gl, LightingBuffers[0])

    var basePassModelMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "model")
    var basePassViewMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "view");
    var basePassProjMatrixLocation = gl.getUniformLocation(basePassShaderProgram, "proj")
    var basePassTimeUniform = gl.getUniformLocation(basePassShaderProgram, "Time")

    var LightingPassLightPositionsUniform = gl.getUniformLocation(LightingPassShaderProgram, "LightPositions")
    var LightingPassLightColoursUniform = gl.getUniformLocation(LightingPassShaderProgram, "LightColours")
    var LightingPassLightPowersUniform = gl.getUniformLocation(LightingPassShaderProgram, "LightPowers")

    var LightingPassAlbedoSampler = gl.getUniformLocation(LightingPassShaderProgram, "AlbedoBuffer");
    var LightingPassNormalSampler = gl.getUniformLocation(LightingPassShaderProgram, "NormalBuffer");
    var LightingPassUVSampler     = gl.getUniformLocation(LightingPassShaderProgram, "UVBuffer");
    var LightingPassTimeUniform = gl.getUniformLocation(LightingPassShaderProgram, "Time")
    var LightingPassValidFramesUniform = gl.getUniformLocation(LightingPassShaderProgram, "ValidFrames")

    var presentPassDepthBufferSampler = gl.getUniformLocation(PresentPassShaderProgram, "DepthBuffer")
    var presentPassFrameBufferSamplers = gl.getUniformLocation(PresentPassShaderProgram, "Frames")

    var presentPassView0Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View0")
    var presentPassView1Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View1")
    var presentPassView2Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View2")
    var presentPassView3Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View3")
    var presentPassView4Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View4")
    var presentPassView5Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View5")
    var presentPassView6Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View6")
    var presentPassView7Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View7")
    var presentPassView8Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View8")
    var presentPassView9Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View9")
    var presentPassView10Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View10")
    var presentPassView11Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View11")
    var presentPassView12Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View12")
    var presentPassView13Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View13")
    var presentPassView14Uniform = gl.getUniformLocation(PresentPassShaderProgram, "View14")

    var presentPassCameraPositionUniform = gl.getUniformLocation(PresentPassShaderProgram, "CameraPosition")

    var presentPassNearUniform = gl.getUniformLocation(PresentPassShaderProgram, "Near")
    var presentPassFarUniform = gl.getUniformLocation(PresentPassShaderProgram, "Far")
    var presentPassTimeUniform = gl.getUniformLocation(PresentPassShaderProgram, "Time")
    
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
        0.0, 3.8, 0.0
    ]
    var LightColours = [
        1.0, 1.0, 1.0,
    ]
    var LightPowers = [
        1.0, 
    ]

    // SCENE
    var BoxPositions = [
        [ 0.0, 0.0, 0.0],
        [ 2.0, 2.0, 0.0],
        [ -2.0, 2.0, 0.0],
        [ 0.0, 2.0, -1.95],
        [ 0.0, 4.0, 0.0],

        [ 0.0, 0.55, 0.0],

    ]
    var BoxSizes = [
        [ 3.9, 0.1, 4.0 ],
        [ 0.1, 4.1, 4.0 ],
        [ 0.1, 4.1, 4.0 ],
        [ 4.0, 4.0, 0.1 ],
        [ 3.9, 0.1, 4.0 ],

        [ 1.0, 1.0, 1.0 ],
    ]

    // CAMERA
    var CameraPosition = new Float32Array([0.0, 2.0, -8.0])
    var CameraVelocity = new Float32Array([0.0, 0.0, 0.0, 0.0])

    var CameraRotation = new Float32Array([0.0, 0.0, 0.0])
    var CameraAngularVelocity = new Float32Array([0.0, 0.0, 0.0])

    var LastCameraPosition = CameraPosition
    var LastCameraRotation = CameraRotation
    var ViewTransformHasChanged = true;

    var Near = 0.01
    var Far = 50.0
    var FOV = 45.0;

    // RENDER PASSES
    function BasePass () {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, basePassFrameBuffer);
        gl.clearColor(1.0, 1.0, 1.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST)
        gl.cullFace(gl.BACK);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1,gl.COLOR_ATTACHMENT2]);
        gl.useProgram(basePassShaderProgram);
        gl.bindVertexArray(triangleGeometryVertexArray);

        gl.uniform1f(basePassTimeUniform, frameID);

        var projMatrix = perspective(FOV, Near, Far)
        gl.uniformMatrix4fv(basePassProjMatrixLocation, false, projMatrix)

        var viewMatrix = identity()
        viewMatrix = multiplym(translate(-CameraPosition[0], -CameraPosition[1], CameraPosition[2]), viewMatrix)
        viewMatrix = multiplym(rotate(CameraRotation[0], CameraRotation[1], CameraRotation[2]), viewMatrix) 
        gl.uniformMatrix4fv(basePassViewMatrixLocation, false, viewMatrix)
        
        var LastView = ViewTransforms.pop();
        ViewTransforms.unshift(multiplym(projMatrix, viewMatrix))

        for (var i = 0; i < BoxPositions.length; ++i)
        {
            var modelMatrix = identity()
            modelMatrix = multiplym(scale(BoxSizes[i][0], BoxSizes[i][1], BoxSizes[i][2]), modelMatrix)
            modelMatrix = multiplym(translate(BoxPositions[i][0], BoxPositions[i][1], BoxPositions[i][2]), modelMatrix)

            gl.uniformMatrix4fv(basePassModelMatrixLocation, false, modelMatrix);
            gl.drawArrays(gl.TRIANGLES, 0, triangleGeometryPositions.length / 3);
        }
    }

    function LightingPass () {
        
        var LastBuffer = LightingBuffers.pop();
        LightingBuffers.unshift(LastBuffer);

        LightingPassFrameBuffer = createFramebuffer(gl, LightingBuffers[0])

        gl.bindFramebuffer(gl.FRAMEBUFFER, LightingPassFrameBuffer);
        //gl.enable(gl.BLEND);
        //gl.blendEquation(gl.FUNC_ADD);
        //gl.blendFunc(gl.ONE, gl.ONE)
        gl.useProgram(LightingPassShaderProgram);

 //       if (ViewTransformHasChanged)
 //       {
 //           gl.clearColor(1.0, 1.0, 1.0, 1.0);
 //           gl.clear(gl.COLOR_BUFFER_BIT);
 //           frameID = 1
 //       }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, albedoBuffer);
        gl.uniform1i(LightingPassAlbedoSampler, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalBuffer);
        gl.uniform1i(LightingPassNormalSampler, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, uvBuffer);
        gl.uniform1i(LightingPassUVSampler, 2);

        gl.uniform3fv(LightingPassLightPositionsUniform, LightPositions);
        gl.uniform3fv(LightingPassLightColoursUniform, LightColours);
        gl.uniform1fv(LightingPassLightPowersUniform, LightPowers);

        gl.uniform1f(LightingPassTimeUniform, frameID);

        gl.bindVertexArray(screenGeometryVertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disable(gl.BLEND)
    }

    function PresentPass () {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(PresentPassShaderProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthBuffer);
        gl.uniform1i(presentPassDepthBufferSampler, 0);
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
        gl.uniform1iv(presentPassFrameBufferSamplers, [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ])

        gl.uniformMatrix4fv(presentPassView0Uniform,  false, ViewTransforms[0])
        gl.uniformMatrix4fv(presentPassView1Uniform,  false, ViewTransforms[1])
        gl.uniformMatrix4fv(presentPassView2Uniform,  false, ViewTransforms[2])
        gl.uniformMatrix4fv(presentPassView3Uniform,  false, ViewTransforms[3])
        gl.uniformMatrix4fv(presentPassView4Uniform,  false, ViewTransforms[4])
        gl.uniformMatrix4fv(presentPassView5Uniform,  false, ViewTransforms[5])
        gl.uniformMatrix4fv(presentPassView6Uniform,  false, ViewTransforms[6])
        gl.uniformMatrix4fv(presentPassView7Uniform,  false, ViewTransforms[7])
        gl.uniformMatrix4fv(presentPassView8Uniform,  false, ViewTransforms[8])
        gl.uniformMatrix4fv(presentPassView9Uniform,  false, ViewTransforms[9])
        gl.uniformMatrix4fv(presentPassView10Uniform, false, ViewTransforms[10])
        gl.uniformMatrix4fv(presentPassView11Uniform, false, ViewTransforms[11])
        gl.uniformMatrix4fv(presentPassView12Uniform, false, ViewTransforms[12])
        gl.uniformMatrix4fv(presentPassView13Uniform, false, ViewTransforms[13])
        gl.uniformMatrix4fv(presentPassView14Uniform, false, ViewTransforms[14])

        gl.uniform3fv(presentPassCameraPositionUniform, CameraPosition)

        gl.uniform1f(presentPassNearUniform, Near);
        gl.uniform1f(presentPassFarUniform, Far);
        gl.uniform1f(presentPassTimeUniform, frameID);

        gl.bindVertexArray(screenGeometryVertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function Render () {
        BasePass();
        LightingPass();

        PresentPass();
        frameID++;
    }

    var frameID = 1;
    function Loop () {
        PollInput();
        DoMovement();

        if (ImagesLoaded.every(v => v))
        {
            Render();
        }

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
        var maxVelocity = 0.1
        var minVelocity = 0.01

        var viewMatrix = multiplym(rotate(CameraRotation[0], CameraRotation[1], CameraRotation[2]), identity())
        var forward = multiplyv(vec4(0.0, 0.0, 1.0, 0.0), viewMatrix) 
        var right = cross(forward, vec4(0.0, -1.0, 0.0, 0.0))

        if (DPressed) CameraVelocity = addv(CameraVelocity, multiplys(right,  speed))
        if (APressed) CameraVelocity = addv(CameraVelocity, multiplys(right, -speed))
        if (WPressed) CameraVelocity = addv(CameraVelocity, multiplys(forward, speed))
        if (SPressed) CameraVelocity = addv(CameraVelocity, multiplys(forward, -speed))
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

        ui.innerHTML = "<p>" + ViewTransformHasChanged + "</p>"

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

    document.addEventListener('keyup', flipkey)
    document.addEventListener('keydown', flipkey);

    
    var CookieRecord = document.cookie;
    console.log(CookieRecord);

    var IndividualCookies = CookieRecord.split(' ');
    if (CookieRecord.includes("LastCameraX"))
    {
      for (var i = 0; i < IndividualCookies.length; ++i)
      {
        if      (IndividualCookies[i].includes("LastCameraX")) 
            CameraPosition[0] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraY")) 
            CameraPosition[1] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraZ")) 
            CameraPosition[2] = parseFloat(IndividualCookies[i].split('=')[1]); 
      }
    }

    if (CookieRecord.includes("LastCameraRotationX"))
    {
      for (var i = 0; i < IndividualCookies.length; ++i)
      {
        if      (IndividualCookies[i].includes("LastCameraRotationX")) 
            CameraRotation[0] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraRotationY")) 
            CameraRotation[1] = parseFloat(IndividualCookies[i].split('=')[1]); 
        else if (IndividualCookies[i].includes("LastCameraRotationZ")) 
            CameraRotation[2] = parseFloat(IndividualCookies[i].split('=')[1]); 
      }
    }
    
    Loop()
}())