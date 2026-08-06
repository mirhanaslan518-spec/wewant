// GÜL - 3. gün: gövde uzuyor, ilk yaprak çıkıyor
const phase3 = {
  left: 156,
  width: 8,
  height: 50,
  radius: 4,
  color: "#4CAF50",
  grayColor: "#9a9a9a",
  children: [
    // ilk yaprak — sivri uçlu, sola bakan
    {
      top: 16,
      left: -40,
      width: 44,
      height: 22,
      topLeftRadius: 22,
      bottomRightRadius: 22,
      rotate: -20,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
    // gövdenin ucundaki minik yeşil filiz
    {
      top: -8,
      left: -3,
      width: 14,
      height: 14,
      radius: 10,
      color: "#4CAF50",
      grayColor: "#9a9a9a",
    },
  ],
};

export default phase3;
