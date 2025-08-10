(function() {
    app.beginUndoGroup("Apply Expression");

    if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
        var comp = app.project.activeItem;
        if (comp.selectedLayers.length === 1) {
            var layer = comp.selectedLayers[0];
            var selectedProps = [];
            for (var i = 0; i < layer.selectedProperties.length; i++) {
                if (layer.selectedProperties[i] instanceof Property) {
                    selectedProps.push(layer.selectedProperties[i]);
                }
            }
            if (selectedProps.length === 1) {
                var selectedProp = selectedProps[0];
                if (selectedProp.canSetExpression) {
                    var layerEffects = layer.Effects;
                    if (!layerEffects.property("Wave Amplitude")) effect = layerEffects.addProperty("ADBE Slider Control"), effect.name = "Wave Amplitude";
                    if (!layerEffects.property("Wave Frequency")) effect = layerEffects.addProperty("ADBE Slider Control"), effect.name = "Wave Frequency";
                    if (!layerEffects.property("Noise Amplitude")) effect = layerEffects.addProperty("ADBE Slider Control"), effect.name = "Noise Amplitude";
                    if (!layerEffects.property("Noise Speed")) effect = layerEffects.addProperty("ADBE Slider Control"), effect.name = "Noise Speed";
                    if (!layerEffects.property("Samples")) effect = layerEffects.addProperty("ADBE Slider Control"), effect.name = "Samples";
                    if (!layerEffects.property("Wave Direction")) effect = layerEffects.addProperty("ADBE Angle Control"), effect.name = "Wave Direction";

                    var expr = 
                        'amp      = effect("Wave Amplitude")("Slider");\r' +
                        'freq     = effect("Wave Frequency")("Slider");\r' +
                        'nAmp     = effect("Noise Amplitude")("Slider");\r' +
                        'nSpeed   = effect("Noise Speed")("Slider");\r' +
                        'samples  = effect("Samples")("Slider");\r' +
                        'angleDeg = effect("Wave Direction")("Angle");\r' +
                        't        = time;\r' +
                        '\r' +
                        'angleRad = degreesToRadians(angleDeg);\r' +
                        'waveDir  = [Math.cos(angleRad), Math.sin(angleRad), 0];\r' +
                        '\r' +
                        'origPath = thisProperty;\r' +
                        'pts      = Array.from({length:samples},(_,idx)=>origPath.pointOnPath((idx+1)/samples));\r' +
                        '\r' +
                        'newPts = [];\r' +
                        'for (i = 0; i < pts.length; i++) {\r' +
                        '    p3 = [pts[i][0], pts[i][1]];\r' +
                        '    waveOffset = Math.sin((i/pts.length + t) * freq * Math.PI*2) * amp;\r' +
                        '    noiseOffset = [\r' +
                        '        (noise([i*0.5, t*nSpeed]) - 0.5) * 2 * nAmp,\r' +
                        '        (noise([i*0.5+100, t*nSpeed]) - 0.5) * 2 * nAmp\r' +
                        '    ];\r' +
                        '    wave = [waveDir[0]*waveOffset, waveDir[1]*waveOffset];\r' +
                        '    displaced = p3 + wave + noiseOffset;\r' +
                        '    newPts.push([...displaced]);\r' +
                        '}\r' +
                        '\r' +
                        'createPath(newPts, [], [], origPath.isClosed());\r' +
                        '\r' ;
                    selectedProp.expression = expr;
                } else {
                    alert("Selected property cannot have an expression.");
                }
            } else {
                alert("Select exactly one property.");
            }
        } else {
            alert("Select exactly one layer.");
        }
    } else {
        alert("Please select a composition.");
    }

    app.endUndoGroup();
})();