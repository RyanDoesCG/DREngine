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

    uniform sampler2D DepthBuffer;
    uniform sampler2D Frames[15];
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
    uniform mat4      View13;
    uniform mat4      View14;


    uniform vec4 CameraPosition;
    uniform vec4 CameraForward;

    uniform float Near;
    uniform float Far;

    uniform float Time;

    in vec2 frag_uvs;
    out vec4 out_color;
`

var TAAPassFragmentShaderFooterSource = `

    float linearDepth (float rawDepth)
    {
        float nDepth = 2.0 * rawDepth - 1.0;
        return 2.0 * Near * Far / (Far + Near - nDepth * (Far - Near));
    }

    vec3 depthToWorldPosition (float depth)
    {
        vec2 uvs = frag_uvs;
        uvs = (vec2(-1.0) + uvs * 2.0);
        
        vec3 origin = CameraPosition.xyz + (vec3(uvs.x, uvs.y, 0.0));
        vec3 direction = (CameraForward.xyz);
        return origin + direction * depth;
    }

    void main() 
    {
        vec4 Result = vec4(0.0, 0.0, 0.0, 1.0);

        float z = linearDepth(texture(DepthBuffer, frag_uvs).r);
        vec3 p = depthToWorldPosition(z);

        vec4 pl = vec4(p, 1.0);
        vec2 uv = frag_uvs;
        Result += texture(Frames[0],  uv);

        pl = View1 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[1],  uv);

        pl = View2 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[2],  uv);
    
        pl = View3 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[3],  uv);

        pl = View4 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[4],  uv);

        pl = View5 * vec4(p, 1.0);
        //uv = 0.5 * (pl.xy / pl.w) + 0.5;
        Result += texture(Frames[5],  uv);

        out_color = vec4(Result.xyz / 6.0, 1.0);
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