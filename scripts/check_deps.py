import importlib.util
pkgs=['jsonschema','fastapi','uvicorn','mcp','numpy','PIL','cv2']
for p in pkgs:
    spec=importlib.util.find_spec(p)
    print(p+': ok' if spec else p+': missing')
