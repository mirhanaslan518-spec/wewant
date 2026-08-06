import React from "react";
import { View } from "react-native";

// ============================================================
// TAMAMEN JENERİK düğüm çizici. Hiçbir çiçeğe özel veri/sabit
// içermiyor — sadece "bir düğüm" ne ise onu çizer:
//   width, height          -> boyut
//   color                  -> renk (boş bırakılırsa dışarıdan
//                              verilen accentColor kullanılır)
//   grayColor               -> solmuş/gri haldeyken kullanılacak renk
//                              (boş bırakılırsa varsayılan gri kullanılır)
//   radius                 -> tüm köşeler için ortak yuvarlaklık
//   topLeftRadius / topRightRadius / bottomLeftRadius / bottomRightRadius
//                           -> tek tek köşe yuvarlaklığı (radius'u ezer)
//   rotate                 -> derece cinsinden döndürme
//   children: [ { ...aynı şema..., top, left } ]
//                           -> bu düğümün İÇİNDE, top/left ile
//                              konumlanan alt düğümler. Bir yaprağın
//                              çocuğu bir yaprak, bir dalın çocuğu
//                              minik bir çiçek olabilir — sınırsız
//                              iç içe geçebilir.
// ============================================================
export default function renderNode(node, accentColor, gray) {
  if (!node) return null;

  const color = gray ? (node.grayColor || "#9a9a9a") : (node.color || accentColor);

  return (
    <View
      style={{
        width: node.width,
        height: node.height,
        backgroundColor: color,
        borderTopLeftRadius: node.topLeftRadius ?? node.radius ?? 0,
        borderTopRightRadius: node.topRightRadius ?? node.radius ?? 0,
        borderBottomLeftRadius: node.bottomLeftRadius ?? node.radius ?? 0,
        borderBottomRightRadius: node.bottomRightRadius ?? node.radius ?? 0,
        transform: node.rotate ? [{ rotate: `${node.rotate}deg` }] : [],
      }}
    >
      {(node.children || []).map((child, i) => (
        <View
          key={child.key ?? i}
          style={{ position: "absolute", top: child.top ?? 0, left: child.left ?? 0 }}
        >
          {renderNode(child, accentColor, gray)}
        </View>
      ))}
    </View>
  );
}
