// PAPATYA - 5. gün: tomurcuk büyüyor.
// Buradaki ilk yaprağın kendi İÇİNDE, ucunda küçük bir yaprakçık (çocuk düğüm) var —
// istersen bu yaprakçığı silebilir, büyütebilir ya da başka yaprağa da ekleyebilirsin.
const phase5 = {
  left: 156,
  width: 7,
  height: 98,
  radius: 4,
  color: "#4CAF50",
  grayColor: "#9a9a9a",
  children: [
    {
      // ana yaprak
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
      top: 60, //sağ yaprak
      left: 2,
      width: 20,
      height: 5,
      radius: 8,
      rotate: -50,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    {
      top: -34,
      left: -9,
      width: 24,
      height: 40,
      radius: 12,
      color: "#f778db",
      grayColor: "#a8a8a8",
    },
  ],
};

export default phase5;
