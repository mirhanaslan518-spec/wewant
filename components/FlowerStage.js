import React from "react";
import { View } from "react-native";
import renderNode from "./nodeRenderer";
import POT from "./parts/pot";
import ROSE from "./flowers/rose";
import DAISY from "./flowers/daisy";
import SUNFLOWER from "./flowers/sunflower";

// Her çiçek artık kendi klasöründe (components/flowers/<isim>/),
// her günü kendi dosyasında (phase1.js ... phase7.js), tamamen
// bağımsız, elle yazılmış bir düğüm ağacı olarak tanımlı.
export const FLOWER_VARIANTS = [ROSE, DAISY, SUNFLOWER];

function getVariant(key) {
  return FLOWER_VARIANTS.find((v) => v.key === key) || ROSE;
}

// stage: 0 (sadece saksı) , 1-7 (o günün ağacı)
// gray: solmuş/eşleşme yok hali
// variant: 'rose' | 'daisy' | 'sunflower'
export default function FlowerStage({ stage, gray, accentColor, variant = "rose" }) {
  const v = getVariant(variant);
  const phaseNode = stage >= 1 ? v.phases[Math.min(stage, 7)] : null;

  return (
    <View style={{ width: 320, height: 440, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ width: 320, height: 330 }}>
        {phaseNode && (
          <View style={{ position: "absolute", bottom: 0, left: phaseNode.left ?? 130 }}>
            {renderNode(phaseNode, accentColor, gray)}
          </View>
        )}
      </View>

      {/* Saksı — components/parts/pot.js içinde, bağımsız */}
      <View style={{ alignItems: "center", marginTop: -3 }}>
        {renderNode(POT.rim, accentColor, gray)}
        {renderNode(POT.body, accentColor, gray)}
      </View>
    </View>
  );
}
