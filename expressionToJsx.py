import sys
import os
import re
from textwrap import indent

# Please modify accordingly to other languages
EFFECT_TYPES = {
    "3D Point": "ADBE Point3D Control",
    "Angle": "ADBE Angle Control",
    "Checkbox": "ADBE Checkbox Control",
    "Color": "ADBE Color Control",
    "Menu": "ADBE Dropdown Control",
    "Layer": "ADBE Layer Control",
    "Point": "ADBE Point Control",
    "Slider": "ADBE Slider Control"
}

def read_js_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def detect_effects(expr):
    # effect("Display Name")("ParamName")
    matches = re.findall(r'effect\(\s*"([^"]+)"\s*\)\s*\(\s*"([^"]+)"\s*\)', expr)
    return matches

def generate_effect_add_code(effects):
    code_lines = []
    code_lines.append("var layerEffects = layer.property(\"Effects\");")
    added = set()
    for display_name, param_name in effects:
        if param_name not in EFFECT_TYPES:
            continue
        match_name = EFFECT_TYPES[param_name]
        key = (display_name, match_name)
        if key in added:
            continue
        added.add(key)
        code_lines.append(f'                    if (!layerEffects.property("{display_name}")) effect = layer.Effects.addProperty("{match_name}"), effect.name = "{display_name}";')
    return "\n".join(code_lines)

def wrap_in_extend_script(expr_code, effects_code):
    expr_lines = expr_code.splitlines()
    escaped_expr = []
    for line in expr_lines:
        escaped_expr.append("'" + line.replace("\\", "\\\\").replace("'", "\\'") + "\\r' +")
    if escaped_expr:
        escaped_expr[-1] = escaped_expr[-1].rstrip('+')
    expr_js = "\n                        ".join(escaped_expr)

    script = f"""(function() {{
    app.beginUndoGroup("Apply Expression");

    if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {{
        var comp = app.project.activeItem;
        if (comp.selectedLayers.length === 1) {{
            var layer = comp.selectedLayers[0];
            var selectedProps = [];
            for (var i = 0; i < layer.selectedProperties.length; i++) {{
                if (layer.selectedProperties[i] instanceof Property) {{
                    selectedProps.push(layer.selectedProperties[i]);
                }}
            }}
            if (selectedProps.length === 1) {{
                var selectedProp = selectedProps[0];
                if (selectedProp.canSetExpression) {{
                    {effects_code}

                    var expr = 
                        {expr_js};
                    selectedProp.expression = expr;
                }} else {{
                    alert("Selected property cannot have an expression.");
                }}
            }} else {{
                alert("Select exactly one property.");
            }}
        }} else {{
            alert("Select exactly one layer.");
        }}
    }} else {{
        alert("Please select a composition.");
    }}

    app.endUndoGroup();
}})();"""
    return script

def main():
    if len(sys.argv) > 1:
        input_path = sys.argv[1]
    else:
        input_path = input("Enter path to AE expression file: ").strip()

    if not os.path.isfile(input_path):
        print("File not found:", input_path)
        return

    expr_code = read_js_file(input_path)
    effects = detect_effects(expr_code)
    effects_code = generate_effect_add_code(effects)
    jsx_code = wrap_in_extend_script(expr_code, effects_code)

    output_path = os.path.splitext(input_path)[0] + ".jsx"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(jsx_code)

    print(f"ExtendScript saved to: {output_path}")

if __name__ == "__main__":
    main()
