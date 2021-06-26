var basePassVertexShaderSource = 
    `#version 300 es

    uniform mat4 proj;
    uniform mat4 view;
    uniform mat4 model;
    
    in vec3 vertex_position;
    in vec3 vertex_normal;
    in vec2 vertex_uv;

    out vec3 frag_worldpos;
    out vec3 frag_normal;
    out vec2 frag_uv;

    void main() 
    {
        gl_Position = proj * view * model * vec4(vertex_position, 1.0);
        frag_worldpos = (model * vec4(vertex_position, 1.0)).xyz;
        frag_normal = (transpose(inverse(model)) * vec4(vertex_normal, 0.0)).xyz;
        frag_uv = vertex_uv;
    }`

var basePassFragmentShaderSource = 
    `#version 300 es

    precision highp float;

    in vec3 frag_worldpos;
    in vec3 frag_normal;
    in vec2 frag_uv;

    layout(location = 0) out vec4 out_color;
    layout(location = 1) out vec4 out_normal;
    layout(location = 2) out vec4 out_uv;

    float grid (vec2 uv, float Thickness)
    {
        return mix(
            0.0, 
            1.0, 
            float((fract(uv.x * 20.0) > Thickness) || 
                (fract(uv.y * 20.0) > Thickness)));
    }

    void main() 
    {
        float a = grid(frag_uv, 0.9);
        out_color = vec4(a, a, a, 1.0);
        out_normal = vec4(frag_normal, 1.0);
        out_uv = vec4(frag_worldpos, 1.0);
    }`