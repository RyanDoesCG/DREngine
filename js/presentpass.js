var presentPassVertexShaderSource = 
    `#version 300 es

    in vec4 vertex_position;
    in vec2 vertex_uvs;

    out vec2 frag_uvs;

    void main() 
    {
        gl_Position = vertex_position;
        frag_uvs = vertex_uvs;
    }`

var presentPassFragmentShaderHeaderSource = 
    `#version 300 es

    precision highp float;

    uniform sampler2D AlbedoBuffer;
    uniform sampler2D NormalBuffer;
    uniform sampler2D UVBuffer;

    #define N_LIGHTS 1
    uniform vec3  LightPositions[N_LIGHTS];
    uniform vec3  LightColours[N_LIGHTS];
    uniform float LightPowers[N_LIGHTS];

    in vec2 frag_uvs;

    out vec4 out_color;
`

var presentPassFragmentShaderFooterSource = `
    #define AA_SAMPLES 1
    #define AA_OFFSET 0.000

    float seed = 0.0;
    float random () 
    {
        return fract(sin(dot(vec2(seed += 0.01, 0.0),vec2(12.9898,78.233)))*43758.5453123);
    }

    float random (float min, float max)
    {
        return min + random() * (max - min);
    }

    void main() 
    {
        vec4 Result = vec4(0.0);

        for (int i = 0; i < AA_SAMPLES; ++i)
        {
            vec2 offset = vec2(random(-1.0, 1.0), random(-1.0, 1.0)) * AA_OFFSET;
            vec2 offset_uvs = frag_uvs + offset;

            vec4 Albedo = texture(AlbedoBuffer, offset_uvs);
            vec4 Normal = texture(NormalBuffer, offset_uvs);
            vec4 WorldPosition = texture(UVBuffer, offset_uvs);
            Result += Albedo;
        }

        out_color = Result / float(AA_SAMPLES);
    }`

    /*

     */