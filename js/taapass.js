var TAAPassVertexShaderSource = 
    `#version 300 es
    in vec4 vertex_position;
    in vec2 vertex_uvs;
    out vec2 frag_uvs;
    void main() 
    {
        gl_Position = vertex_position;
        frag_uvs = vertex_uvs;
    }`

var TAAPassFragmentShaderHeaderSource = 
    `#version 300 es
    precision highp float;

    uniform sampler2D WorldPositionBuffer;
    uniform sampler2D DepthBuffer;

    uniform sampler2D Frames[12];
    uniform mat4      View0;
    uniform mat4      View1;
    uniform mat4      View2;
    uniform mat4      View3;
    uniform mat4      View4;
    uniform mat4      View5;
    uniform mat4      View6;
    uniform mat4      View7;
    uniform mat4      View8;
    uniform mat4      View9;
    uniform mat4      View10;
    uniform mat4      View11;
    uniform mat4      View12;

    uniform vec4 CameraPosition;
    uniform vec4 CameraForward;

    uniform float Near;
    uniform float Far;

    uniform float Time;

    in vec2 frag_uvs;
    out vec4 out_color;
`

var TAAPassFragmentShaderFooterSource = `

    bool shouldRejectSample (vec2 uv)
    {
        bool inRange = uv.x < 1.0 && uv.x > 0.0 && uv.y < 1.0 && uv.y > 0.0;
        bool farFromCurrentPixel = length(uv - frag_uvs) > 0.9;
        return !inRange || farFromCurrentPixel;
    }

    void main() 
    {
        vec4 Result = vec4(0.0, 0.0, 0.0, 1.0);

        vec4 position = texture(WorldPositionBuffer, frag_uvs);

        float samples = 0.0;

        vec4 pl = position;
        vec2 uv = frag_uvs;
        Result += texture(Frames[0],  uv) * 1.0;
        samples += 1.0;

        //out_color = vec4(Result.xyz, 1.0);
        //return;


        pl = View1 * position;
        uv = (0.5 * (pl.xy / pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[1],  uv);
            samples += 1.0;
        }
        
        pl = View2 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[2],  uv);
            samples += 1.0;
        }

        pl = View3 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[3],  uv);
            samples += 1.0;
        }

        pl = View4 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[4],  uv);
            samples += 1.0;
        }

        pl = View5 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[5],  uv);
            samples += 1.0;
        }

        pl = View6 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[6],  uv);
            samples += 1.0;
        }

        pl = View7 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[7],  uv);
            samples += 1.0;
        }

        pl = View8 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[8],  uv);
            samples += 1.0;
        }

        pl = View9 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[9],  uv);
            samples += 1.0;
        }

        pl = View10 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[10],  uv);
            samples += 1.0;
        }

        pl = View11 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        if (!shouldRejectSample(uv))
        {
            Result += texture(Frames[11],  uv);
            samples += 1.0;
        }
        
        out_color = vec4(Result.xyz / samples, 1.0);
    }`



    /*
            vec4 Result = vec4(0.0, 0.0, 0.0, 1.0);

        float z = linearDepth(texture(DepthBuffer, frag_uvs).r);
        vec3 p = depthToWorldPosition(z);

        vec2 uv = frag_uvs;
        
        //vec4 pl = View0 * vec4(p, 1.0);
        //vec2 uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[0],  uv);

        //pl = View1 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[1],  uv);

        //pl = View2 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[2],  uv);
    
        //pl = View3 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[3],  uv);

        //pl = View4 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[4],  uv);

        //pl = View5 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[5],  uv);

        //pl = View6 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[6],  uv);
    
        //pl = View7 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[7],  uv);

        //pl = View8 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[8],  uv);

        //pl = View9 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[9],  uv);

        //pl = View10 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[10],  uv);

        //pl = View11 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[11],  uv);

        //pl = View12 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[12],  uv);
    
        //pl = View13 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[13],  uv);

        //pl = View14 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[14],  uv);

        out_color = vec4(Result.xyz / 15.0, 1.0);
     */