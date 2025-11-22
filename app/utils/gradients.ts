export const randomPastelGradient = (): string => {
  const pastelClaro = () => `hsl(${Math.floor(Math.random() * 360)}, 90%, 95%)`;
  const c1 = pastelClaro();
  const c2 = pastelClaro();
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};
