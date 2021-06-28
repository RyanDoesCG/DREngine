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
        float z = linearDepth(texture(DepthBuffer, frag_uvs).r);

        vec4 p = vec4(depthToWorldPosition(z), 1.0);

        vec4 Result = vec4(0.0, 0.0, 0.0, 1.0);
        vec2 uvs = frag_uvs;

//        vec4 p0 = inverse(View0) * p;
//        uvs = 0.5 * ((p0.xy ) * 3.0) + 0.5;
        Result += texture(Frames[0], uvs);

        vec4 p1 = View1 * p;
        //uvs =     0.5 * (p1.xy / p1.w) + 0.5;
        Result += texture(Frames[1], uvs);
 
        vec4 p2 = View2 * p;
        //uvs =     0.5 * (p2.xy / p2.w) + 0.5;
        Result += texture(Frames[2], uvs);
     
        vec4 p3 = View3 * p;
        //uvs =     0.5 * (p3.xy / p3.w) + 0.5;
        Result += texture(Frames[3], uvs);
 
        vec4 p4 = View4 * p;
        //uvs =     0.5 * (p4.xy / p4.w) + 0.5;
        Result += texture(Frames[4], uvs);

        vec4 p5 = View5 * p;
        //uvs =     0.5 * (p5.xy / p5.w) + 0.5;
        Result += texture(Frames[5], uvs);
        
        vec4 p6 = View6 * p;
        //uvs =     0.5 * (p6.xy / p6.w) + 0.5;
        Result += texture(Frames[6], uvs);

        vec4 p7 = View7 * p;
        //uvs =     0.5 * (p7.xy / p7.w) + 0.5;
        Result += texture(Frames[7], uvs);

        vec4 p8 = View8 * p;
        //uvs =     0.5 * (p8.xy / p8.w) + 0.5;
        Result += texture(Frames[8], uvs);
   
        vec4 p9 = View9 * p;
        //uvs =     0.5 * (p9.xy / p9.w) + 0.5;
        Result += texture(Frames[9], uvs);

        vec4 p10 = View10 * p;
        //uvs =     0.5 * (p10.xy / p10.w) + 0.5;
        Result += texture(Frames[10], uvs);
  
        vec4 p11 = View11 * p;
        //uvs =     0.5 * (p11.xy / p11.w) + 0.5;
        Result += texture(Frames[11], uvs);
 
        vec4 p12 = View12 * p;
        //uvs =     0.5 * (p12.xy / p12.w) + 0.5;
        Result += texture(Frames[12], uvs);
   
        vec4 p13 = View13 * p;
        //uvs =     0.5 * (p13.xy / p13.w) + 0.5;
        Result += texture(Frames[13], uvs);

        vec4 p14 = View14 * p;
        //uvs =     0.5 * (p14.xy / p14.w) + 0.5;
        Result += texture(Frames[14], uvs);
    
        out_color = vec4(Result.xyz / 15.0, 1.0);
    }`