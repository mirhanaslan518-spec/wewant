// PAPATYA - 6. gün: üçüncü yaprak, en büyük tomurcuk.
// Ayrıca gövdeden çıkan ince bir DAL var, dalın ucunda da minik bir çiçek
// (dalın çocuğu = minik çiçek kabı, minik çiçeğin çocukları = küçük taç yaprakları + merkez).
const phase6 = {
  left: 156,
  width: 7,
  height: 124,
  radius: 4,
  rotate: -1.5,
  color: "#4CAF50",
  grayColor: "#9a9a9a",
  children: [
    {
      top: 35, //sol yaprak
      left: -25,
      width: 32,
      height: 7,
      radius: 8,
      rotate: 50,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
      children: [
        {
          // yaprağın ucundaki küçük yaprakçık (yaprağın çocuğu)
          top: -5,
          left: 3,
          width: 20,
          height: 5,
          radius: 8,
          rotate: 30,
          color: "#4CAF50",
          grayColor: "#9a9a9a",
        },
        {
          // yaprağın ucundaki küçük yaprakçık (yaprağın çocuğu)
          top: 7,
          left: 3,
          width: 20,
          height: 5,
          radius: 8,
          rotate: -30,
          color: "#4CAF50",
          grayColor: "#9a9a9a",
        },
      ],
    },
    {
      top: 75, //sağ yaprak
      left: 10,
      width: 15,
      height: 4,
      radius: 8,
      rotate: -30,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    {
      top: 100, //sağ alt yaprak
      left: -10,
      width: 15,
      height: 4,
      radius: 8,
      rotate: 60,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    {
      // ince dal
      top: 60,
      left: 10,
      width: 5,
      height: 34,
      radius: 3,
      rotate: 35,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
      /*
      children: [  // dalın ucundaki minik çiçek kabı
        {
          top: -34,
          left: 50,
          width: 46,
          height: 46,
          color: "transparent",
          children: [
            {
              top: -6,
              left: 15,
              width: 14,
              height: 22,
              radius: 7,
              rotate: 0,
              grayColor: "#b5b5b5",
            },
            {
              top: 8,
              left: 26,
              width: 14,
              height: 22,
              radius: 7,
              rotate: 72,
              grayColor: "#b5b5b5",
            },
            {
              top: 24,
              left: 20,
              width: 14,
              height: 22,
              radius: 7,
              rotate: 144,
              grayColor: "#b5b5b5",
            },
            {
              top: 24,
              left: 4,
              width: 14,
              height: 22,
              radius: 7,
              rotate: 216,
              grayColor: "#b5b5b5",
            },
            {
              top: 8,
              left: -2,
              width: 14,
              height: 22,
              radius: 7,
              rotate: 288,
              grayColor: "#b5b5b5",
            },
            {
              top: 15,
              left: 13,
              width: 16,
              height: 16,
              radius: 8,
              color: "#FFD166",
              grayColor: "#c9c9c9",
            },
          ],
        },
      ],*/
    },
    {
      top: -44,
      left: -11,
      width: 28,
      height: 52,
      radius: 14,
      color: "#f778db",
      grayColor: "#a8a8a8",
    },
  ],
};

export default phase6;
