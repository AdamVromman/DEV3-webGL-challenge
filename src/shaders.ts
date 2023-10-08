export const backgroundVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const backgroundFragmentShader = `
      varying vec2 vUv;
      uniform vec3 iResolution;           // viewport resolution (in pixels)
      uniform float iTime;                 // shader playback time (in seconds)
      uniform vec2 iDirection;
      uniform sampler2D iChannel0;          // input channel. XX = 2D/Cube

      // divisions of grid
const float repeats = 30.;

// number of layers
const float layers = 21.;

// star colours
const vec3 blue = vec3(51.,64.,195.)/255.;
const vec3 cyan = vec3(117.,250.,254.)/255.;
const vec3 white = vec3(255.,255.,255.)/255.;
const vec3 yellow = vec3(251.,245.,44.)/255.;
const vec3 red = vec3(247,2.,20.)/255.;

// spectrum function
vec3 spectrum(vec2 pos){
    pos.x *= 4.;
    vec3 outCol = vec3(0);
    if( pos.x > 0.){
        outCol = mix(blue, cyan, fract(pos.x));
    }
    if( pos.x > 1.){
        outCol = mix(cyan, white, fract(pos.x));
    }
    if( pos.x > 2.){
        outCol = mix(white, yellow, fract(pos.x));
    }
    if( pos.x > 3.){
        outCol = mix(yellow, red, fract(pos.x));
    }
    
    return 1.-(pos.y * (1.-outCol));
}

float N21(vec2 p){
    p = fract(p*vec2(233.34, 851.73));
    p+= dot(p, p+23.45);
    return fract(p.x*p.y);
}

vec2 N22 (vec2 p){
	float n = N21(p);
    return vec2 (n, N21(p+n));
}

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = N21(i);
    float b = N21(i + vec2(1.0, 0.0));
    float c = N21(i + vec2(0.0, 1.0));
    float d = N21(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float perlin2(vec2 uv, int octaves, float pscale){
    float col = 1.;
    float initScale = 4.;  
    for ( int l; l < octaves; l++){
        float val = noise(uv*initScale);
        if (col <= 0.01){
            col = 0.;
            break;
        }
        val -= 0.01;
        val *= 0.5;
        col *= val;
        initScale *= pscale;
    }
 	return col;
}

vec3 stars(vec2 uv, float offset){
    
    float timeScale = -(iTime + offset) / layers;
    
    float trans = fract(timeScale);
    
    float newRnd = floor(timeScale);
    
    vec3 col = vec3(0.);
   
    
    // translate uv then scale for center
    uv -= vec2(0.5);
    uv = scale( vec2(trans) ) * (uv + iDirection.xy);
    uv += vec2(0.5);
    
    // create square aspect ratio
    uv.x *= iResolution.x / iResolution.y;
    
    // add nebula colours
    float colR = N21(vec2(offset+newRnd));
    float colB = N21(vec2(offset+newRnd*123.));
    
    // generate perlin noise nebula on every third layer
    if (mod(offset,3.) == 0.){
    	float perl = perlin2(uv+offset+newRnd,3,2.);
    	col += vec3(perl*colR,perl*0.1,perl*colB);
    }
    
    // create boxes
    uv *= repeats;
    
    // get position
    vec2 ipos = floor(uv);
    
    // return uv as 0 to 1
    uv = fract(uv);
    
    // calculate random xy and size
    vec2 rndXY = N22(newRnd + ipos*(offset+1.))*0.9+0.05;
    float rndSize = N21(ipos)*100.+200.;
    
    
    vec2 j = (rndXY - uv)*rndSize;
    float sparkle = 1./dot(j,j);
    
    col += spectrum(fract(rndXY*newRnd*ipos)) * vec3(sparkle);
    
    
	// visualize layers
    /*if ((uv.x > 9. || uv.y > 0.99) && ipos.y == 8.){
        col += vec3(1.,0.,0.)*smoothstep(1.,0.5,trans);
    }
    if (mod(offset,3.) == 0.){
    	if (uv.x > 0.99 || uv.y > 0.99){
        	col += vec3(1.,0.,0.)*smoothstep(0.2,0.1,trans);
    	}
    }*/
    
   	col *= smoothstep(1.,0.8,trans);	
    col *= smoothstep(0.,0.1,trans);
    return col;
       
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    vec3 col = vec3(0.);
	
    for (float i = 0.; i < layers; i++ ){
    	col += stars(uv, i);
    }


    // Output to screen
    fragColor = vec4(col,1.0);
}
    void main()
    {
      mainImage(gl_FragColor, vUv * iResolution.xy);
    }`;

// export const sphereVertexShader = `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//     }
//     `;    

// export const spherefragmentShader = `
// //trying to account for resolution dependant MipBias
// #define MIPs (8.5+iResolution.y/512.0)

// varying vec2 vUv;
// uniform vec3 iResolution;           // viewport resolution (in pixels)
// uniform float iTime;                 // shader playback time (in seconds)
// uniform vec2 iDirection;
// uniform sampler2D iChannel0;          // input channel. XX = 2D/Cube
// uniform vec3 iChannelResolution[4];
// uniform vec4 iMouse;
// uniform sampler2D iChannel1;

// float Sphere (in vec2 Coord, in vec2 Position, in float Size)
// {
//     return clamp(dot(Coord/Size-Position,Coord/Size-Position),0.0,1.0);
// }

// float SelectMip (in float Roughness)
// {
//     return MIPs-1.0-(3.0-1.15*log2(Roughness));
// }

// vec2 Reflection (in vec2 Coord, in vec2 Position, in float Size, in float NormalZ)
// {
//     return (1.0-Size*(Coord/Size-Position)/NormalZ)/2.0;
// }

// vec4 BlurTexture (in vec2 Coord, in sampler2D Tex, in float MipBias)
// {
// 	vec2 TexelSize = MipBias/iChannelResolution[0].xy;
    
//     vec4  Color = texture(Tex, Coord, MipBias);
//     Color += texture(Tex, Coord + vec2(TexelSize.x,-1.0), MipBias);    	
//     Color += texture(Tex, Coord + vec2(-TexelSize.x,-1.0), MipBias);    	
//     Color += texture(Tex, Coord + vec2(0.0,TexelSize.y), MipBias);    	
//     Color += texture(Tex, Coord + vec2(0.0,-TexelSize.y), MipBias);    	
//     Color += texture(Tex, Coord + vec2(TexelSize.x,TexelSize.y), MipBias);    	
//     Color += texture(Tex, Coord + vec2(-TexelSize.x,TexelSize.y), MipBias);    	
//     Color += texture(Tex, Coord + vec2(TexelSize.x,-TexelSize.y), MipBias);    	
//     Color += texture(Tex, Coord + vec2(-TexelSize.x,-TexelSize.y), MipBias);    

//     return Color/9.0;
// }

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 uv = fragCoord.xy/iResolution.yy;    
    
//     //Objects    
//     float s1 = Sphere(uv, vec2(1.5,1.25),0.25);
//     float sph = s1*0.25;
//     float spm = clamp(sph*64.0,0.0,1.0);   
    
//     //Normals    
//     float dx = dFdx(sph)*iResolution.x/4.0;    
//     float dy = dFdy(sph)*iResolution.x/4.0;     
//     vec3 vNormal = normalize(vec3(dx,dy,sqrt(clamp(1.0-dx*dx-dy*dy,0.0,1.0)))); 
    
//     //Shading    
// 	uv = (2.0*fragCoord.xy-iMouse.xy*0.1)/(iResolution.yy*2.0);
    
//     vec2 uvr = ceil(s1)*Reflection(uv, vec2(1.5,1.25),0.25,vNormal.z);    
    
//     vec3 BaseColor = ceil(s1)*vec3(1.0,0.76,0.33);
    
//     float Roughness = ceil(s1)*0.20;
//     	  Roughness = mix(Roughness*1.5, Roughness*0.67, texture(iChannel1,8.0*uvr).x);
       
//     vec3 vLight = normalize(vec3(fragCoord.xy,128.0)-vec3(iMouse.xy,0.0));
    
//     vec3 vEye = vec3(0.0,0.0,-1.0);
    
//     float Fresnel = 1.0-pow(clamp(dot(vNormal,-vEye),0.0,1.0),1.0);
    
//     vec3 Environment = (1.0+Fresnel) * clamp(1.0*BlurTexture(uvr,iChannel0,SelectMip(Roughness)).xyz +
//                        3.0*clamp(texture(iChannel0,uvr,SelectMip(Roughness)+1.0).xxx-0.67,0.0,1.0),0.0,2.0);
    
//     float sh = 0.75+0.25*clamp(dot(vNormal,vLight),0.0,1.0);
    
//     vec3 sp = vec3(1.0-Roughness)*pow(clamp(dot(vNormal,normalize((vLight-vEye)*0.5)),0.0,1.0),1.0/(pow(Roughness+0.1,4.0)));
    
//     vec3 fcol01 = mix(sh*BaseColor*Environment,mix(normalize(BaseColor)*2.5,vec3(1.5),0.4),sp);
    
//     vec3 fcol02 = pow(1.375*texture(iChannel0,(0.2+uv)*vec2(0.4,-0.8),SelectMip(1.0)).xyz,vec3(1.5));

//     fragColor = vec4(mix(fcol02,fcol01,spm),1.0);
// }


// void main()
// {
//     mainImage(gl_FragColor, vUv * iResolution.xy);
// }

// `;
