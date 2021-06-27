var LightingPassVertexShaderSource = 
    `#version 300 es

    in vec4 vertex_position;
    in vec2 vertex_uvs;

    out vec2 frag_uvs;

    void main() 
    {
        gl_Position = vertex_position;
        frag_uvs = vertex_uvs;
    }`

var LightingPassFragmentShaderHeaderSource = 
    `#version 300 es

    precision highp float;

    uniform sampler2D AlbedoBuffer;
    uniform sampler2D NormalBuffer;
    uniform sampler2D UVBuffer;
    uniform sampler2D DepthBuffer;

    uniform float Time;

    #define N_LIGHTS 1
    vec3  LightPositions[N_LIGHTS];
    vec3  LightColours[N_LIGHTS];
    float LightPowers[N_LIGHTS];

    in vec2 frag_uvs;

    out vec4 out_color;
`

var LightingPassFragmentShaderFooterSource = `
    void main() 
    {
        vec4 Result = vec4(0.2, 0.2, 0.2, 1.0);

        vec4 Albedo = texture(AlbedoBuffer, frag_uvs);
        if (Albedo.a < 1.0)
        {
            out_color = vec4(1.0); 
            return;
        }
        vec4 Normal = vec4(normalize(texture(NormalBuffer, frag_uvs).xyz).xyz, 1.0);
        vec4 WorldPosition = texture(UVBuffer, frag_uvs);

        LightPositions[0] = vec3( 0.0, 3.8,  0.0);

        for (int i = 0; i < N_LIGHTS; ++i)
        {
            float h = 0.8;
            vec3 L = normalize(LightPositions[i] - WorldPosition.xyz);
            float d = max(dot(L, Normal.xyz), 0.0);
            d = d * h + 1.0 - h;
            Result.xyz += Albedo.xyz * d;
        }

        out_color = (Result / float(N_LIGHTS));
    }`