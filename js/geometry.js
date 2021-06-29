// SCREEN QUAD GEOMETRY
var screenGeometryPositions = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, 1.0, 1.0,
    -1.0,  1.0,-1.0, -1.0, 1.0, 1.0])
    
var screenGeometryUVs = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 0.0, 1.0, 1.0])

// BOX GEOMETRY
var boxGeometryPositions = new Float32Array([
    -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,  0.5,  0.5, -0.5, -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  
     0.5, -0.5,  0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5, -0.5, -0.5, -0.5, -0.5,  0.5,  0.5, 
    -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, 
    -0.5,  0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5, 
    -0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5, 
    -0.5, -0.5,  0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5 ])

var boxGeometryNormals = new Float32Array([
     0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,
     1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,
     0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,
     0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,
     0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0 ])

var boxGeometryUVs = new Float32Array([
    0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 
    0.0, 1.0, 1.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 
    1.0, 0.0, 0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 
    0.0, 0.0, 1.0, 1.0, 1.0, 0.0,
    0.0, 1.0, 1.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0,  
    0.0, 1.0, 0.0, 0.0, 1.0, 1.0 ])

// SPHERE GEOMETRY
var sphereGeometryPositions// = new Float32Array([])
var sphereGeometryNormals// = new Float32Array([])
var sphereGeometryUVs// = new Float32Array([])

(function (){
    sphereGeometryPositions = boxGeometryPositions
    sphereGeometryNormals   = boxGeometryNormals
    sphereGeometryUVs       = boxGeometryUVs

    let TesselationLevel = 4;
    for (var t = 0; t < TesselationLevel; ++t)
    {
        var TesselatedBoxPositions = []
        var TesselatedBoxNormals = []
        var TesselatedBoxUVs = []

        for (var i = 0; i < sphereGeometryPositions.length; i += 9)
        {
            // clockwise
            A = normalize(vec3(sphereGeometryPositions[i + 0], sphereGeometryPositions[i + 1], sphereGeometryPositions[i + 2]))
            B = normalize(vec3(sphereGeometryPositions[i + 3], sphereGeometryPositions[i + 4], sphereGeometryPositions[i + 5]))
            C = normalize(vec3(sphereGeometryPositions[i + 6], sphereGeometryPositions[i + 7], sphereGeometryPositions[i + 8]))
            D = normalize(lerp(A, B, 0.5))
            E = normalize(lerp(B, C, 0.5))
            F = normalize(lerp(C, A, 0.5))
 
            TesselatedBoxPositions.push(...A);
            TesselatedBoxPositions.push(...D);
            TesselatedBoxPositions.push(...F);
            TesselatedBoxPositions.push(...D);
            TesselatedBoxPositions.push(...B);
            TesselatedBoxPositions.push(...E);
            TesselatedBoxPositions.push(...E);
            TesselatedBoxPositions.push(...C);
            TesselatedBoxPositions.push(...F);
            TesselatedBoxPositions.push(...F);
            TesselatedBoxPositions.push(...D);
            TesselatedBoxPositions.push(...E);
            TesselatedBoxNormals.push  (...A);
            TesselatedBoxNormals.push  (...D);
            TesselatedBoxNormals.push  (...F);
            TesselatedBoxNormals.push  (...D);
            TesselatedBoxNormals.push  (...B);
            TesselatedBoxNormals.push  (...E);
            TesselatedBoxNormals.push  (...E);
            TesselatedBoxNormals.push  (...C);
            TesselatedBoxNormals.push  (...F);
            TesselatedBoxNormals.push  (...F);
            TesselatedBoxNormals.push  (...D);
            TesselatedBoxNormals.push  (...E);
    
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
            TesselatedBoxUVs.push(0.0);
        }

        console.log(TesselatedBoxNormals)

        sphereGeometryPositions = new Float32Array(TesselatedBoxPositions)
        sphereGeometryNormals = new Float32Array(TesselatedBoxNormals)
        sphereGeometryUVs = new Float32Array(TesselatedBoxUVs)
        
    }
}())