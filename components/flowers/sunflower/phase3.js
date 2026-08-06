// AYÇİÇEĞİ - 3. gün: ilk yaprak (üstten/alttan sivri, ortası geniş).
// Bu "marquise" şekli: köşegen köşeleri yuvarlatıp 45° çevirerek yapılıyor,
// rotate değeri = istediğin eğim + 45.
const phase3 = {
  left: 156,
  width: 9,
  height: 54,
  radius: 4,
  color: "#4CAF50",
  grayColor: "#9a9a9a",
  children: [
    {
      top: 16,
      left: -46,
      width: 44,
      height: 24,
      topRightRadius: 44,
      bottomLeftRadius: 44,
      rotate: 20, // = -25 (istenen eğim) + 45
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    {
      top: -8,
      left: -3,
      width: 15,
      height: 15,
      radius: 10,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
  ],
};

export default phase3;
