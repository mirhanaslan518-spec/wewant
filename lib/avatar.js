// DiceBear "Notionists" stili için özelleştirilebilir kategoriler.
// Parametre adları "hair" değil "hairVariant" şeklinde (sonunda Variant eki var).
// Çoğu kategori "variant01".."variantNN" formatında numaralı seçeneklere sahip
// (bunlar için `max` kullanılır). "gesture" gibi bazıları ise isimli sabit
// seçeneklere sahip (bunlar için `values` listesi kullanılır).
export const AVATAR_CATEGORIES = [
  { key: "hair", label: "Saç", max: 64, optional: false },
  { key: "eyebrows", label: "Kaşlar", max: 13, optional: false },
  { key: "eyes", label: "Gözler", max: 5, optional: false },
  { key: "nose", label: "Burun", max: 20, optional: false },
  { key: "mouth", label: "Ağız", max: 30, optional: false },
  { key: "clothes", label: "Kıyafet", max: 25, optional: false },
  {
    key: "gesture",
    label: "Poz",
    optional: false,
    values: [
      "hand",
      "handPhone",
      "ok",
      "okLongArm",
      "point",
      "pointLongArm",
      "waveLongArm",
      "waveLongArms",
      "waveOkLongArms",
      "wavePointLongArms",
    ],
  },
  { key: "beard", label: "Sakal", max: 12, optional: true },
  { key: "glasses", label: "Gözlük", max: 11, optional: true },
];

// Uzun tek liste yerine, kategoriler gruplara ayrıldı — her grup kendi
// alt sayfasında açılıyor (örn. "Yüz" -> gözler, kaşlar, burun, ağız).
export const AVATAR_GROUPS = [
  {
    key: "face",
    label: "Yüz",
    categories: ["eyes", "eyebrows", "nose", "mouth"],
  },
  { key: "hair", label: "Saç", categories: ["hair"] },
  { key: "clothes", label: "Kıyafet", categories: ["clothes"] },
  { key: "gesture", label: "Poz", categories: ["gesture"] },
  { key: "accessories", label: "Aksesuar", categories: ["beard", "glasses"] },
];

// Herkesin ilk gördüğü (henüz özelleştirmemiş) varsayılan avatar.
export const DEFAULT_AVATAR_CONFIG = {
  hair: "variant01",
  eyebrows: "variant01",
  eyes: "variant01",
  nose: "variant01",
  mouth: "variant01",
  clothes: "variant01",
  gesture: "hand",
  beard: null,
  glasses: null,
};

function hexNoHash(hex) {
  return (hex || "").replace("#", "");
}

function getOptionCount(cat) {
  return cat.values ? cat.values.length : cat.max;
}

// Bir kategori + config değerinden, o an kaçıncı seçenekte olduğumuzu bulur
// (0 = Kapalı, sadece optional kategorilerde).
export function indexForValue(cat, value) {
  if (!value) return 0;
  if (cat.values) {
    const i = cat.values.indexOf(value);
    return i === -1 ? 0 : i + 1;
  }
  const n = parseInt(value.replace("variant", ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

// Bir kategori + index'ten, config'e yazılacak gerçek değeri üretir.
export function valueForIndex(cat, index) {
  if (index === 0) return null;
  if (cat.values) return cat.values[index - 1];
  return `variant${String(index).padStart(2, "0")}`;
}

// config'i, verilen kategoriyi bir sonraki/önceki seçeneğe ilerleterek günceller.
export function cycleCategory(config, key, direction) {
  const cat = AVATAR_CATEGORIES.find((c) => c.key === key);
  if (!cat) return config;
  const count = getOptionCount(cat);
  const current = indexForValue(cat, config[key]);
  const min = cat.optional ? 0 : 1;
  let next = current + direction;
  if (next > count) next = min;
  if (next < min) next = count;
  return { ...config, [key]: valueForIndex(cat, next) };
}

// config: { hair: 'variant03', gesture: 'ok', beard: null, ... }
// accentHex: '#EC4899' gibi — arka plan bu renkte olacak
// seed: sabit bir kimlik (kullanıcı id'si gibi) — belirtilmeyen rastgele detayları sabitler
// size: piksel cinsinden görsel boyutu
export function buildAvatarUrl(config, accentHex, seed, size = 200) {
  const params = new URLSearchParams();
  params.set("seed", seed || "wewant");
  params.set("size", String(size));
  params.set("backgroundType", "solid");
  params.set("backgroundColor", hexNoHash(accentHex));

  AVATAR_CATEGORIES.forEach((cat) => {
    const value = config?.[cat.key];
    if (value) {
      params.set(`${cat.key}Variant`, value);
      if (cat.optional) params.set(`${cat.key}Probability`, "100");

      if (cat.key === "gesture") {
        // Gerçek parametre adından emin olamadığımız için birkaç olası
        // adı aynı anda deniyoruz — DiceBear tanımadığını yok sayar,
        // hangisi doğruysa o çalışır.
        [
          "gesture",
          "gestureVariant",
          "body",
          "bodyVariant",
          "pose",
          "poseVariant",
        ].forEach((name) => {
          params.set(name, value);
          params.set(`${name}Probability`, "100");
        });
      }
    } else if (cat.optional) {
      params.set(`${cat.key}Probability`, "0");
    }
  });

  return `https://api.dicebear.com/10.x/notionists/png?${params.toString()}`;
}
