#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
in vec2 texCoord;

struct Material {
    vec3 diffuse;      // diffuse color
    vec3 specular;     // 표면의 specular color
    float shininess;   // specular 반짝임 정도
};

struct Light {
    //vec3 position;
    vec3 direction;
    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int u_toonLevels;

// value must be in [0, 1]
float quantize(float value, int levels) {
    if (value == 0.0) {
        return 0.0;
    }

    for (int i = 0; i < levels; i++) {
        float lb = float(i) / float(levels);
        float ub = float(i + 1) / float(levels);
        if (lb < value && value <= ub) {
            return lb;
        }
    }

    return 1.0; // should never reach here
}

vec3 quantize(vec3 v, int levels) {
    float intensity = sqrt(v.r*v.r + v.g*v.g + v.b*v.b);
    if (intensity == 0.0) {
        return v;
    }
    float quantizedIntensity = quantize(intensity, levels);
    return v * (quantizedIntensity / intensity);
}


void main() {
    // ambient
    vec3 rgb = material.diffuse;
    vec3 ambient = light.ambient * rgb;
  	
    // diffuse 
    vec3 norm = normalize(normal);
    //vec3 lightDir = normalize(light.position - fragPos);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    diff = quantize(diff, u_toonLevels);
    vec3 diffuse = light.diffuse * diff * rgb;  
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
    spec = quantize(spec, u_toonLevels);
    // there is material.specular, but example video seems to use material.diffuse for specular color.
    // no condition is given to use material.specular as specular light color
    // thus material.diffuse is used.
    vec3 specular = light.specular * spec * material.diffuse;  
        
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
} 
