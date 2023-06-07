import type { Image, Color } from "../include/image.js";

export function imageMap(img: Image, func: (c: Color) => Color) {
  const newImg = img.copy();
  for (let i = 0; i < newImg.width; ++i) {
    for (let j = 0; j < newImg.height; ++j) {
      const pixel = newImg.getPixel(i, j);
      newImg.setPixel(i, j, func(pixel));
    }
  }
  return newImg;
}

export function mapLine(img: Image, lineNo: number, func: (c: Color) => Color): void {
  if (lineNo < 0 || lineNo >= img.height) {
    return;
  }
  for (let i = 0; i < img.width; ++i) {
    img.setPixel(i, lineNo, func(img.getPixel(i, lineNo)));
  }
}

export function imageMapCoord(img: Image, func: (img: Image, x: number, y: number) => Color): Image {
  const newImg = img.copy();
  for (let i = 0; i < newImg.width; ++i) {
    for (let j = 0; j < newImg.height; ++j) {
      newImg.setPixel(i, j, func(img, i, j));
    }
  }
  return newImg;
}

export function imageMapIf(
  img: Image,
  cond: (img: Image, x: number, y: number) => boolean,
  func: (p: Color) => Color
): Image {
  return imageMapCoord(img, (img, x, y) => (cond(img, x, y) ? func(img.getPixel(x, y)) : img.getPixel(x, y)));
}

export function mapWindow(
  img: Image,
  xInterval: number[], // Assumed to be a two element array containing [x_min, x_max]
  yInterval: number[], // Assumed to be a two element array containing [y_min, y_max]
  func: (p: Color) => Color
): Image {
  return imageMapIf(
    img,
    (img, x, y) => xInterval[0] <= x && xInterval[1] >= x && yInterval[0] <= y && yInterval[1] >= y,
    func
  );
}

export function makeBorder(img: Image, thickness: number, func: (p: Color) => Color): Image {
  const newImg = img.copy();
  for (let i = 0; i < img.width; ++i) {
    for (let j = 0; j < img.height; ++j) {
      if (i < thickness || j < thickness || i >= img.width - thickness || j >= img.height - thickness) {
        newImg.setPixel(i, j, func(img.getPixel(i, j)));
      }
    }
  }
  return newImg;
}

// export function dimCenter(img: Image, thickness: number): Image {
//   const xRange = [thickness, img.width - thickness];
//   const yRange = [thickness, img.height - thickness];
//   const dimPixel = (pixel: Color): Color => {
//     const [r, g, b] = pixel;
//     const dimmedR = Math.floor(r * 0.8);
//     const dimmedG = Math.floor(g * 0.8);
//     const dimmedB = Math.floor(b * 0.8);
//     return [dimmedR, dimmedG, dimmedB];
//   };
//   return mapWindow(img, xRange, yRange, dimPixel);
// }
export function dimCenter(img: Image, thickness: number): Image {
  const xRange = [thickness, img.width - thickness];
  const yRange = [thickness, img.height - thickness];
  return imageMapIf(
    img,
    (img, x, y) => {
      const distToEdge = Math.min(x - xRange[0], xRange[1] - x, y - yRange[0], yRange[1] - y);
      return distToEdge < thickness;
    },
    pixel => pixel.map(channel => Math.floor(channel * 0.8))
  );
}

export function isGrayish(p: Color): boolean {
  const maxValue = Math.max(...p);
  const minValue = Math.min(...p);
  return maxValue - minValue <= 85;
}

export function makeGrayish(img: Image): Image {
  if (img.width === 1 && img.height === 1) {
    const pixel = img.getPixel(0, 0);
    if (!isGrayish(pixel)) {
      const average = (pixel[0] + pixel[1] + pixel[2]) / 3;
      img.setPixel(0, 0, [average, average, average]);
      return img;
    } else {
      return img;
    }
  } else {
    return imageMapIf(
      img,
      (img, x, y) => isGrayish(img.getPixel(x, y)),
      pixel => {
        if (!isGrayish(pixel)) {
          const average = (pixel[0] + pixel[1] + pixel[2]) / 3;
          return [average, average, average];
        } else {
          return pixel;
        }
      }
    );
  }
}
