var basePassVertexShaderSource = 
    `#version 300 es

    uniform mat4 proj;
    uniform mat4 view;
    uniform mat4 model;

    uniform float Time;

    in vec3 vertex_position;
    in vec3 vertex_normal;
    in vec2 vertex_uv;

    out vec3 frag_worldpos;
    out vec3 frag_normal;
    out vec2 frag_uv;

    float random (vec2 st) 
    {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }    

    void main() 
    {
        const float jitter = 0.0025;

        mat4 jitter_proj = proj;
        jitter_proj[2][0] = random(vec2(Time, 0.0)) * jitter;
        jitter_proj[2][1] = random(vec2(0.0, Time)) * jitter;

        gl_Position = jitter_proj * view * model * vec4(vertex_position, 1.0);
        frag_worldpos = (model * vec4(vertex_position, 1.0)).xyz;
        frag_normal = (vec4(vertex_normal, 0.0)).xyz;
        frag_uv = vertex_uv;
    }`

var basePassFragmentShaderSource = 
    `#version 300 es

    precision lowp float;

    in vec3 frag_worldpos;
    in vec3 frag_normal;
    in vec2 frag_uv;

    layout(location = 0) out vec4 out_color;
    layout(location = 1) out vec4 out_normal;
    layout(location = 2) out vec4 out_uv;

    uniform vec3 Color;

    float grid (vec2 uv, float Thickness)
    {
        return mix(
            0.0, 
            1.0, 
            float((fract(uv.x * 20.0) > Thickness) || 
                (fract(uv.y * 20.0) > Thickness)));
    }

    float checkerboard(vec2 uv, float thickness)
    {
        uv *= thickness;
        return mod(floor(uv.x) + floor(uv.y), 2.0);
    }

    void main() 
    {
//         vec2 uv = vec2(0.0, 0.0);
//         if (abs(frag_normal.x) > 0.0) { uv = vec2(frag_worldpos.z, frag_worldpos.y); }
//         if (abs(frag_normal.y) > 0.0) { uv = vec2(frag_worldpos.z, frag_worldpos.x); }
//         if (abs(frag_normal.z) > 0.0) { uv = vec2(frag_worldpos.x, frag_worldpos.y); }
//         uv *= 0.32;

        out_color = vec4(Color, 1.0);
        out_normal = vec4((frag_normal + 1.0) * 0.5, 1.0);
        out_uv = vec4(frag_worldpos, 1.0);
    }`