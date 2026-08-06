// GÜL - 4. gün: ikinci yaprak, küçük bir tomurcuk başlıyor
const phase4 = {
  left: 156,
  width: 8,
  height: 80,
  radius: 4,
  color: "#4CAF50",
  grayColor: "#9a9a9a",
  children: [
    {
      top: 22,
      left: -40,
      width: 44,
      height: 22,
      topLeftRadius: 22,
      bottomRightRadius: 22,
      rotate: -20,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    {
      top: 44,
      left: 6,
      width: 44,
      height: 22,
      topRightRadius: 22,
      bottomLeftRadius: 22,
      rotate: 25,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    // tomurcuk — rengi boş bırakıldı, uygulamanın seçili rengini (accentColor) kullanır
    {
      top: -26,
      left: -6,
      width: 20,
      height: 30,
      radius: 10,
      grayColor: "#a8a8a8",
    },
  ],
};

export default phase4;
