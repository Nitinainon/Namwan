type Region = readonly [number, number, number, number];

// Display artwork from the supplied reference as image regions; all UI remains HTML.
export function ReferenceArt({ region, className = "", label }: { region: Region; className?: string; label?: string }) {
  const [x, y, width, height] = region;
  return <svg className={`reference-art ${className}`} viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="xMidYMid slice" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
    <image href="/images/shop-reference.jpg" width="841" height="1870" />
  </svg>;
}

const categoryRegions: Region[] = [
  [38, 538, 98, 117], [154, 535, 99, 120], [265, 535, 99, 120],
  [376, 535, 100, 120], [488, 535, 99, 120], [600, 535, 99, 120], [712, 535, 99, 120],
];
export function referenceCategory(name: string, index: number): Region {
  if (/อาหาร|ขนม/.test(name)) return categoryRegions[1];
  if (/ของเล่น/.test(name)) return categoryRegions[2];
  if (/ดูแล|บิวตี้/.test(name)) return categoryRegions[3];
  if (/น่ารัก/.test(name)) return categoryRegions[4];
  if (/เที่ยว|เดินทาง/.test(name)) return categoryRegions[5];
  if (/เสื้อ|แฟชั่น/.test(name)) return categoryRegions[6];
  if (/บ้าน|แมว/.test(name)) return categoryRegions[0];
  return categoryRegions[index % categoryRegions.length];
}
