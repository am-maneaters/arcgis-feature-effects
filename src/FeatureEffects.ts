type Factor = number;
type Percentage = number;
type Pixels = number;

type BloomProps = (
  strength: Factor | Percentage,
  radius: Pixels,
  threshold: number
) => string;

export type EffectName =
  | 'bloom'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'drop-shadow'
  | 'grayscale'
  | 'hue-rotate'
  | 'invert'
  | 'opacity'
  | 'saturate'
  | 'sepia';

export type EffectArgSuffix = 'px' | '%' | 'deg' | undefined;
export type EffectArg = { value: number; suffix?: EffectArgSuffix };

export type Effect = {
  name: EffectName;
  args: EffectArg[];
  enabled?: boolean;
};

export function bloom(strength: number, radius: Pixels, threshold: Percentage) {
  return `bloom(${strength}, ${radius}px, ${threshold}%)`;
}

export function brightness(amount: Percentage) {
  return `brightness(${amount}%)`;
}

export function contrast(amount: Percentage) {
  return `contrast(${amount}%)`;
}

export function dropShadow(x: Pixels, y: Pixels, blur: Pixels, color: string) {
  return `drop-shadow(${x}px ${y}px ${blur}px ${color})`;
}

export default {};
