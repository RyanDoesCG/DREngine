(function (){
    var a = matrix(
        2,  3, -4,  34,
        11, 8,  7,  2,
        2,  5,  3,  5,
        6,  6,  2,  4
    )

    var b = new Float32Array([
        3, 7, 5, 7
    ])

    var c = multiplyv(b, a)
    console.log(c)
})()