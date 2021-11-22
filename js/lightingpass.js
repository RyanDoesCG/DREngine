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

    #define NUM_BOXES 184
    uniform vec3 BoxPositions[NUM_BOXES];
    uniform vec3 BoxColours[NUM_BOXES];
    uniform vec3 BoxSizes[NUM_BOXES];

    #define NUM_SPHERES 0
    #if NUM_SPHERES > 0
    uniform vec3 SpherePositions[NUM_SPHERES];
    uniform vec3 SphereColours[NUM_SPHERES];
    uniform float SphereSizes[NUM_SPHERES];
    #endif

    in vec2 frag_uvs;

    out vec4 out_color;
`

var LightingPassFragmentShaderFooterSource = `
    float seed = 0.0;
    float random ()
    {
        seed += 0.1;
        return texture(
            BlueNoise, 
            vec2(sin(Time * 0.0001), cos(Time * 0.0001)) 
            
            + 
            (frag_uvs * 2.0)+ 
            vec2(seed)
            
            ).x;
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
        vec3 colour;
        vec3 size;
    };

    struct Sphere {
        vec3 position;
        vec3 colour;
        float size;
    };

    struct Hit {
        float t;
        vec3 position;
        vec3 normal;
        vec3 colour;
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

        if (maxt >= max(0.0, mint) && mint > 0.01 && mint < last.t)
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
                HitNormal,
                box.colour);
        }

        return last;
    }

    Hit IntersectRaySphere(Ray ray, Sphere sphere, Hit last)
    {
        vec3 oc = ray.origin - sphere.position;
        float a = dot (ray.direction, ray.direction);
        float b = 2.0 * dot (oc, ray.direction);
        float c = dot (oc, oc) - sphere.size * sphere.size;
        float d = b * b - 4.0 * a * c;

        if (d > 0.0)
        {
            float t  = (-b - sqrt(d)) / (2.0 * a);

            if (t > 0.0)
            {
                vec3 p = ray.origin + ray.direction * t;
                vec3 n = normalize(p - sphere.position);
                return Hit(t, p , n, sphere.colour);
            }
        }

        return last;
    }

    Hit IntersectScene (Ray ray)
    {
        const float maxt = 10000.0;
        Hit result = Hit(
            maxt, 
            ray.origin + ray.direction * maxt,
            vec3(0.0, 0.0, 0.0), 
            vec3(0.0, 0.0, 0.0));

        for (int i = 0; i < NUM_BOXES; ++i)
        {
            result = IntersectRayBox(ray, 
                Box(
                    BoxPositions[i],
                    BoxColours[i],
                    BoxSizes[i]), result);
        }

        #if NUM_SPHERES > 0
        for (int i = 0; i < NUM_SPHERES; ++i)
        {
            result = IntersectRaySphere(ray, Sphere(SpherePositions[i], SphereColours[i], SphereSizes[i]), result);
        }
        #endif

        return result;
    }

    vec4 raytraced_diffuse ()
    {
        vec4 Result = vec4(0.0, 0.0, 0.0, 1.0);

        vec4 Albedo = texture(AlbedoBuffer, frag_uvs);
        vec4 Normal = vec4(normalize(vec3(-1.0) + texture(NormalBuffer, frag_uvs).xyz * 2.0).xyz, 1.0);
        vec4 WorldPosition = texture(UVBuffer, frag_uvs);
 
        Result += Albedo;

        if (WorldPosition.w > 0.0)
        {
            const int N_Samples = 4;
            vec3 s = vec3(0.0);
            for (int i = 0; i < N_Samples; ++i)
            {
                Ray BounceRay = Ray(
                    WorldPosition.xyz + Normal.xyz * 0.0001, 
                    normalize(Normal.xyz + randomDirection()));

                Hit BounceHit = IntersectScene(BounceRay);
                if (BounceHit.t < 1000.0)
                {
                    s += BounceHit.colour;
                    Result *= vec4(1.0 - (1.0 / float(N_Samples)));
                }
            }
            Result.xyz += (s / float(N_Samples)) * 0.2;
        }

        return Result;
    }

    vec4 raytraced_exp ()
    {
        vec4 Result = vec4(0.0, 0.0, 0.0, 1.0);

        vec4 Albedo = texture(AlbedoBuffer, frag_uvs);
        vec4 Normal = vec4(normalize(vec3(-1.0) + texture(NormalBuffer, frag_uvs).xyz * 2.0).xyz, 1.0);
        vec4 WorldPosition = texture(UVBuffer, frag_uvs);
 
        Result.xyz += randomDirection().xyz;


        return Result;
    }

    void main() 
    {
        vec4 Result;

        Result = (raytraced_diffuse());

        out_color = Result;

        out_color = min(vec4(1.0), max(vec4(0.0), Result));

        float gamma = 2.2;
        out_color.rgb = pow(out_color.rgb, vec3(1.0/gamma));

    }`