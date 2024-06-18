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

    #define NFrames 15

    uniform sampler2D Frames[NFrames];
    uniform sampler2D WorldPositionBuffer;
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

    uniform vec2 WindowSize;
    uniform float Time;

    in vec2 frag_uvs;
    out vec4 out_color;
`

var TAAPassFragmentShaderFooterSource = `
    void main() 
    {
        vec4 Result = vec4(0.0, 0.0, 0.0, 1.0);

        vec4 position = texture(WorldPositionBuffer, frag_uvs);

        vec4 NeighbourMin = vec4(1.0);
        vec4 NeighbourMax = vec4(0.0);

        ivec2 frag_uvs_int = ivec2(frag_uvs * WindowSize);

        vec4 Neighbour0 = texelFetch(Frames[0], frag_uvs_int + ivec2(0, 1), 0);
        NeighbourMin = min(NeighbourMin, Neighbour0);
        NeighbourMax = max(NeighbourMax, Neighbour0);

        vec4 Neighbour1 = texelFetch(Frames[0], frag_uvs_int + ivec2(0, -1), 0);
        NeighbourMin = min(NeighbourMin, Neighbour1);
        NeighbourMax = max(NeighbourMax, Neighbour1);

        vec4 Neighbour2 = texelFetch(Frames[0], frag_uvs_int + ivec2(1, 0), 0);
        NeighbourMin = min(NeighbourMin, Neighbour2);
        NeighbourMax = max(NeighbourMax, Neighbour2);

        vec4 Neighbour3 = texelFetch(Frames[0], frag_uvs_int + ivec2(-1, 0), 0);
        NeighbourMin = min(NeighbourMin, Neighbour3);
        NeighbourMax = max(NeighbourMax, Neighbour3);

        vec4 pl = position;
        vec2 uv = frag_uvs;
        Result += clamp(texture(Frames[0], uv), NeighbourMin, NeighbourMax);

        if (position.w == 0.0)
        {
            out_color = vec4(Result.xyz, 1.0);
            return;
        }

        pl = View1 * position;
        uv = (0.5 * (pl.xy / pl.w) + 0.5);
        Result += clamp(texture(Frames[1], uv), NeighbourMin, NeighbourMax);

        pl = View2 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[2], uv), NeighbourMin, NeighbourMax);

        pl = View3 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[3], uv), NeighbourMin, NeighbourMax);

        pl = View4 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[4], uv), NeighbourMin, NeighbourMax);

        pl = View5 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[5], uv), NeighbourMin, NeighbourMax);

        pl = View6 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[6], uv), NeighbourMin, NeighbourMax);

        pl = View7 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[7], uv), NeighbourMin, NeighbourMax);

        pl = View8 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[8], uv), NeighbourMin, NeighbourMax);

        pl = View9 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[9], uv), NeighbourMin, NeighbourMax);

        pl = View10 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[10], uv), NeighbourMin, NeighbourMax);

        pl = View11 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[11], uv), NeighbourMin, NeighbourMax);

        pl = View12 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[12], uv), NeighbourMin, NeighbourMax);

        pl = View13 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[13], uv), NeighbourMin, NeighbourMax);

        pl = View14 * position;
        uv = (0.5 * (pl.xy/ pl.w) + 0.5);
        Result += clamp(texture(Frames[14], uv), NeighbourMin, NeighbourMax);

        out_color = vec4(Result.xyz * 0.0666, 1.0);
    }`
