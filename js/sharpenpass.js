var SharpenPassVertexShaderSource = 
    `#version 300 es
    in vec4 vertex_position;
    in vec2 vertex_uvs;
    out vec2 frag_uvs;
    void main() 
    {
        gl_Position = vertex_position;
        frag_uvs = vertex_uvs;
    }`

var SharpenPassFragmentShaderSource = 
    `#version 300 es
    precision highp float;

    uniform sampler2D FrameBuffer;

    in vec2 frag_uvs;
    out vec4 out_color;

    vec3 saturate(vec3 v)
    {
        return clamp(v, 0.0, 1.0);
    }

    void main() 
    {
        const float offset = 0.000;

        vec4 center = texture(FrameBuffer, frag_uvs);

        vec4 up    = texture(FrameBuffer, frag_uvs + vec2(0.0, 1.0) * offset);
        vec4 down  = texture(FrameBuffer, frag_uvs + vec2(0.0, -1.0) * offset);
        vec4 left  = texture(FrameBuffer, frag_uvs + vec2(1.0, 0.0) * offset);
        vec4 right = texture(FrameBuffer, frag_uvs + vec2(-1.0, 0.0) * offset);
     
        out_color = vec4(saturate(center.xyz + 4.0 * center.xyz - up.xyz - down.xyz - left.xyz - right.xyz), 1.0);
    }`