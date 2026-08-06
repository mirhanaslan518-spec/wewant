// GÜL - 7. gün: tam açmış çiçek (6 taç yaprağı, ortada bir merkez)
const phase7 = {
  left: 156,
  width: 8,
  height: 170,
  radius: 4,
  rotate: -2.5,
  color: "#4CAF50",
  grayColor: "#9a9a9a",
  children: [
    {
      top: 44,
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
      top: 88,
      left: 6,
      width: 44,
      height: 22,
      topRightRadius: 22,
      bottomLeftRadius: 22,
      rotate: 25,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    {
      top: 122,
      left: -30,
      width: 30,
      height: 15,
      topLeftRadius: 22,
      bottomRightRadius: 22,
      rotate: -20,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    // Çiçek başı — kendi içinde 6 taç yaprağı + merkez barındıran bir kap
    {
      top: -130,
      left: -66,
      width: 140,
      height: 140,
      color: "transparent",
      children: [
        { top: -7, left: 45, width: 50, height: 70, radius: 30, rotate: 0, grayColor: "#b5b5b5" },
        { top: 14, left: 81, width: 50, height: 70, radius: 30, rotate: 60, grayColor: "#b5b5b5" },
        { top: 56, left: 81, width: 50, height: 70, radius: 30, rotate: 120, grayColor: "#b5b5b5" },
        { top: 77, left: 45, width: 50, height: 70, radius: 30, rotate: 180, grayColor: "#b5b5b5" },
        { top: 56, left: 9, width: 50, height: 70, radius: 30, rotate: 240, grayColor: "#b5b5b5" },
        { top: 14, left: 9, width: 50, height: 70, radius: 30, rotate: 300, grayColor: "#b5b5b5" },
        { top: 47, left: 47, width: 46, height: 46, radius: 23, color: "#FFD166", grayColor: "#c9c9c9" },
      ],
    },
  ],
};

export default phase7;
