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

    #define PI 3.1415926535

    precision lowp float;

    uniform sampler2D AlbedoBuffer;
    uniform sampler2D NormalBuffer;
    uniform sampler2D UVBuffer;

    uniform sampler2D PerlinNoise;
    uniform sampler2D WhiteNoise;
    uniform sampler2D BlueNoise;

    uniform float Time;
    uniform vec4 CameraPosition;
    uniform mat4 ViewToWorld;
    uniform mat4 WorldToView;

    #define N_LIGHTS 1
    vec3  LightPositions[N_LIGHTS];
    vec3  LightColours[N_LIGHTS];
    float LightPowers[N_LIGHTS];

    #define NUM_BOXES 6
    uniform vec3 BoxPositions[NUM_BOXES];
    uniform vec3 BoxSizes[NUM_BOXES];

    in vec2 frag_uvs;

    out vec4 out_color;
`

var LightingPassFragmentShaderFooterSource = `
    float seed = 0.0;
    float random ()
    {
        seed += 0.1;
        return texture(BlueNoise, vec2(sin(Time * 0.2), cos(Time * 0.2)) + (frag_uvs * 2.0) + vec2(seed)).x;
    }

    float random (float min, float max)
    {
        return min + random() * (max - min);
    }

    vec3 randomDirection()
    {
        float x = random(-1.0, 1.0);
        float y = random(-1.0, 1.0);
        float z = random(-1.0, 1.0);

        return normalize(vec3(x, y, z));
    }

    struct Ray {
        vec3 origin;
        vec3 direction;
    };

    struct Box {
        vec3 position;
        vec3 size;
    };

    struct Hit {
        float t;
        vec3 position;
        vec3 normal;
    };

    bool IntersectRaySphereDebug (Ray ray, vec3 SpherePosition)
    {
        float SphereRadius = 1.5;
        vec3 oc = ray.origin - SpherePosition;
        float a = dot (ray.direction, ray.direction);
        float b = 2.0 * dot (oc, ray.direction);
        float c = dot (oc, oc) - SphereRadius * SphereRadius;
        float d = b * b - 4.0 * a * c;

        if (d > 0.0)
        {
            float t  = (-b - sqrt(d)) / (2.0 * a);

            if (t > 0.0)
            {
                return true;
            }
        }

        return false;
    }

    Hit IntersectRayBox (Ray ray, Box box, Hit last) 
    {
        box.size *= 0.5;

        vec3 InverseRay = 1.0 / ray.direction; 
        vec3 BoxMin     = box.position - (box.size);
        vec3 BoxMax     = box.position + (box.size);
        float tx1       = (BoxMin.x - ray.origin.x) * InverseRay.x;
        float tx2       = (BoxMax.x - ray.origin.x) * InverseRay.x;
        float mint      = min(tx1, tx2);
        float maxt      = max(tx1, tx2);
        float ty1       = (BoxMin.y - ray.origin.y) * InverseRay.y;
        float ty2       = (BoxMax.y - ray.origin.y) * InverseRay.y;
        mint            = max(mint, min(ty1, ty2));
        maxt            = min(maxt, max(ty1, ty2));
        float tz1       = (BoxMin.z - ray.origin.z) * InverseRay.z;
        float tz2       = (BoxMax.z - ray.origin.z) * InverseRay.z;
        mint            = max(mint, min(tz1, tz2));
        maxt            = min(maxt, max(tz1, tz2));

        if (maxt >= max(0.0, mint) && mint < last.t)
        {
            vec3 HitPositionWorldSpace = ray.origin + ray.direction * mint;
            vec3 HitPositionLocalSpace = HitPositionWorldSpace - box.position;
    
            vec3 HitNormal = vec3(
                (float(abs(HitPositionLocalSpace.x - box.size.x) < 0.00001)) - (float(abs(HitPositionLocalSpace.x - -box.size.x) < 0.00001)), 
                (float(abs(HitPositionLocalSpace.y - box.size.y) < 0.00001)) - (float(abs(HitPositionLocalSpace.y - -box.size.y) < 0.00001)), 
                (float(abs(HitPositionLocalSpace.z - box.size.z) < 0.00001)) - (float(abs(HitPositionLocalSpace.z - -box.size.z) < 0.00001)));
            
            return Hit (
                mint,
                HitPositionWorldSpace,
                HitNormal);
        }

        return last;
    }

    Hit IntersectScene (Ray ray)
    {
        const float maxt = 10000.0;
        Hit result = Hit(
            maxt, 
            ray.origin + ray.direction * maxt,
            vec3(0.0, 0.0, 0.0));

        for (int i = 0; i < NUM_BOXES; ++i)
        {
            result = IntersectRayBox(ray, 
                Box(BoxPositions[i], 
                BoxSizes[i]), result);
        }

        return result;
    }

    Ray generateEyeRay (float fov)
    {
        Ray ray;

        vec2 ss = frag_uvs;
        ss = ss + vec2(random(-1.0, 1.0), random(-1.0, 1.0)) * 0.001;
        ss = vec2(-1.0) + ss * 2.0;
        ss = ss * tan(fov / 2.0 * PI / 180.0);

        ray.origin    = CameraPosition.xyz;
        ray.direction = normalize(vec3(ss.x, ss.y, -1.0) - ray.origin);
        ray.direction = (ViewToWorld * vec4(ray.direction, 0.0)).xyz;
        ray.direction = normalize(ray.direction);
        return ray;
    }

    vec4 lambertian ()
    {
        vec4 Result = vec4(0.2, 0.2, 0.2, 1.0);
        vec4 Albedo = texture(AlbedoBuffer, frag_uvs);
        if (Albedo.a < 1.0)
        {
            return vec4(1.0);
        }
        vec4 Normal = vec4(normalize(vec3(-1.0) + texture(NormalBuffer, frag_uvs).xyz * 2.0).xyz, 1.0);
        vec4 WorldPosition = texture(UVBuffer, frag_uvs);
        for (int i = 0; i < N_LIGHTS; ++i)
        {
            float h = 1.0;
            vec3 L = normalize(LightPositions[i] - WorldPosition.xyz);
            float d = max(dot(L, Normal.xyz), 0.0);
            d = d * h + 1.0 - h;
            Result.xyz += Albedo.xyz * d;
        }
        return Result;
    }

    vec4 raytraced ()
    {
        vec4 Result = vec4(0.4, 0.4, 0.4, 0.0);
        Ray ray = generateEyeRay(45.0);

        vec4 Normal = vec4(normalize(vec3(-1.0) + texture(NormalBuffer, frag_uvs).xyz * 2.0).xyz, 1.0);
        vec4 WorldPosition = texture(UVBuffer, frag_uvs);
 
        const int N_Samples = 12;
        for (int i = 0; i < N_Samples; ++i)
        {
            Ray BounceRay = Ray(
                WorldPosition.xyz + Normal.xyz * 0.0001, 
                normalize((Normal.xyz + randomDirection())));
            Hit BounceHit = IntersectScene(BounceRay);
            if (BounceHit.t < 1000.0)
            {
                Result *= vec4(0.9, 0.9, 0.9, 1.0);
            }
        }        
        

        return Result;
    }

    void main() 
    {
        vec4 Result;

        Result =  raytraced();

        float dithering = (random() / 255.0);
        out_color = (Result / float(N_LIGHTS)) + dithering;

        float gamma = 2.2;
        out_color.rgb = pow(out_color.rgb, vec3(1.0/gamma));

    }`