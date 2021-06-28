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

    precision lowp float;

    uniform sampler2D AlbedoBuffer;
    uniform sampler2D NormalBuffer;
    uniform sampler2D UVBuffer;

    uniform vec4 CameraPosition;
    uniform vec4 CameraForward;
    uniform vec4 CameraRight;

    uniform float Time;
    uniform mat4 View;

    #define N_LIGHTS 1
    vec3  LightPositions[N_LIGHTS];
    vec3  LightColours[N_LIGHTS];
    float LightPowers[N_LIGHTS];

    #define NUM_BOXES 5
    #if NUM_BOXES > 0
    uniform vec3 BoxPositions[NUM_BOXES];
    uniform vec3 BoxSizes[NUM_BOXES];
    #endif

    in vec2 frag_uvs;

    out vec4 out_color;
`

var LightingPassFragmentShaderFooterSource = `
    float random (vec2 st) 
    {
        return fract(sin(dot(st.xy + Time,
            vec2(12.9898,78.233)))*
            43758.5453123);
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

        SpherePosition.z = -SpherePosition.z;

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

        if (maxt >= max(0.0, mint))
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
            vec3(0.0, 1.0, 0.0));

        #if NUM_BOXES > 0
        for (int i = 0; i < NUM_BOXES; ++i)
        {
            result = IntersectRayBox(ray, 
                Box(BoxPositions[i], 
                BoxSizes[i]), result);
        }
        #endif

        return result;
    }

    Ray generateEyeRay ()
    {
        vec3 CameraUp = cross(CameraForward.xyz, CameraRight.xyz);

        vec2 ViewPlaneUV = (vec2(-1.0, -1.0) + frag_uvs * 2.0);
        vec3 ViewPlaneYAxis = CameraUp.xyz;
        vec3 ViewPlaneXAxis = CameraRight.xyz;

        vec3 ViewPlaneWorldPosition = CameraPosition.xyz + (CameraForward.xyz) + (ViewPlaneYAxis * ViewPlaneUV.y) + (ViewPlaneXAxis * ViewPlaneUV.x);     
        vec3 CameraToViewPlane = ViewPlaneWorldPosition - CameraPosition.xyz;

        return Ray(CameraPosition.xyz, (CameraToViewPlane));
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
        LightPositions[0] = vec3( 0.0, 3.8,  0.0);
        for (int i = 0; i < N_LIGHTS; ++i)
        {
            float h = 0.8;
            vec3 L = normalize(LightPositions[i] - WorldPosition.xyz);
            float d = max(dot(L, Normal.xyz), 0.0);
            d = d * h + 1.0 - h;
            Result.xyz += Albedo.xyz * d;
        }
        return Result;
    }

    vec4 raytraced ()
    {
        Ray ray = generateEyeRay();

        Hit result = IntersectScene(ray);

        if (IntersectRaySphereDebug (ray, BoxPositions[0]))
        {
            return vec4(1.0, 0.0, 0.0, 1.0);
        }

        if (IntersectRaySphereDebug (ray, BoxPositions[1]))
        {
            return vec4(1.0, 0.0, 0.0, 1.0);
        }

        if (IntersectRaySphereDebug (ray, BoxPositions[2]))
        {
            return vec4(1.0, 0.0, 0.0, 1.0);
        }

        if (IntersectRaySphereDebug (ray, BoxPositions[3]))
        {
            return vec4(1.0, 0.0, 0.0, 1.0);
        }

        if (IntersectRaySphereDebug (ray, BoxPositions[4]))
        {
            return vec4(1.0, 0.0, 0.0, 1.0);
        }

        return vec4(0.0);
    }

    void main() 
    {
        vec4 Result;

       // if (frag_uvs.x < 0.5)
        {
            Result = lambertian();
        }
      //  else
        {
         //  Result =  raytraced();
        }

        float dithering = (random(frag_uvs) / 255.0);
        out_color = (Result / float(N_LIGHTS)) + dithering;

        float gamma = 2.2;
        out_color.rgb = pow(out_color.rgb, vec3(1.0/gamma));

    }`