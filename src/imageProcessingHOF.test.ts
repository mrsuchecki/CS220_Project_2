import assert from "assert";
import { COLORS, Image } from "../include/image.js";
import {
  dimCenter,
  imageMapCoord,
  imageMapIf,
  isGrayish,
  makeBorder,
  makeGrayish,
  mapWindow,
} from "./imageProcessingHOF.js";

describe("imageMapCoord", () => {
  function identity(img: Image, x: number, y: number) {
    return img.getPixel(x, y);
  }

  it("should return a different image", () => {
    const input = Image.create(10, 10, COLORS.WHITE);
    const output = imageMapCoord(input, identity);
    assert(input !== output);
  });
  it("should apply the function to every pixel", () => {
    const input = Image.create(2, 2, [255, 0, 0]);
    const expectedOutput = Image.create(2, 2, [0, 255, 255]);
    const output = imageMapCoord(input, (img, x, y) => [
      255 - img.getPixel(x, y)[0],
      255 - img.getPixel(x, y)[1],
      255 - img.getPixel(x, y)[2],
    ]);
    assert.deepStrictEqual(output.getPixel(0, 0), expectedOutput.getPixel(0, 0));
    assert.deepStrictEqual(output.getPixel(0, 1), expectedOutput.getPixel(0, 1));
    assert.deepStrictEqual(output.getPixel(1, 0), expectedOutput.getPixel(1, 0));
    assert.deepStrictEqual(output.getPixel(1, 1), expectedOutput.getPixel(1, 1));
  });

  it("should support modifying only specific color channels", () => {
    const input = Image.create(2, 2, [255, 128, 0]);
    const expectedOutput = Image.create(2, 2, [255, 128, 255]);
    const output = imageMapCoord(input, (img, x, y) => [img.getPixel(x, y)[0], img.getPixel(x, y)[1], 255]);
    assert.deepStrictEqual(output.getPixel(0, 0), expectedOutput.getPixel(0, 0));
    assert.deepStrictEqual(output.getPixel(0, 1), expectedOutput.getPixel(0, 1));
    assert.deepStrictEqual(output.getPixel(1, 0), expectedOutput.getPixel(1, 0));
    assert.deepStrictEqual(output.getPixel(1, 1), expectedOutput.getPixel(1, 1));
  });

  it("should handle edge cases correctly", () => {
    const input1 = Image.create(1, 1, [0, 0, 0]);
    const output1 = imageMapCoord(input1, (img, x, y) => [255, 255, 255]);
    assert.deepStrictEqual(output1.getPixel(0, 0), [255, 255, 255]);
    const input2 = Image.create(100, 100, [255, 255, 255]);
    const output2 = imageMapCoord(input2, (img, x, y) => [0, 0, 0]);
    assert.deepStrictEqual(output2.getPixel(0, 0), [0, 0, 0]);
    assert.deepStrictEqual(output2.getPixel(99, 99), [0, 0, 0]);
    assert.deepStrictEqual(output2.getPixel(50, 50), [0, 0, 0]);
  });
});

describe("imageMapIf", () => {
  it("should return an image with the same dimensions", () => {
    const input = Image.create(2, 2, [255, 0, 0]);
    const output = imageMapIf(
      input,
      () => true,
      c => c
    );
    assert.deepStrictEqual(input.width, output.width);
    assert.deepStrictEqual(input.height, output.height);
  });

  it("should apply the function only to pixels satisfying the condition", () => {
    const input = Image.create(2, 2, [255, 0, 0]);
    const expectedOutput = Image.create(2, 2, [0, 255, 0]);
    const output = imageMapIf(
      input,
      (img, x, y) => img.getPixel(x, y)[1] === 0,
      c => [c[1], c[0], c[2]]
    );
    assert.deepStrictEqual(output.getPixel(0, 0), expectedOutput.getPixel(0, 0));
    assert.deepStrictEqual(output.getPixel(0, 1), expectedOutput.getPixel(0, 1));
    assert.deepStrictEqual(output.getPixel(1, 0), expectedOutput.getPixel(1, 0));
    assert.deepStrictEqual(output.getPixel(1, 1), expectedOutput.getPixel(1, 1));
  });

  it("should not apply the function to any pixel if condition is always false", () => {
    const input = Image.create(2, 2, [255, 0, 0]);
    const output = imageMapIf(
      input,
      () => false,
      c => [c[1], c[2], c[0]]
    );
    assert.deepStrictEqual(output.getPixel(0, 0), input.getPixel(0, 0));
    assert.deepStrictEqual(output.getPixel(0, 1), input.getPixel(0, 1));
    assert.deepStrictEqual(output.getPixel(1, 0), input.getPixel(1, 0));
    assert.deepStrictEqual(output.getPixel(1, 1), input.getPixel(1, 1));
  });
});

describe("mapWindow", () => {
  it("should return an image with the same dimensions as the input image", () => {
    const input = Image.create(3, 3, [255, 255, 255]);
    const output = mapWindow(input, [0, 2], [0, 2], c => c);
    assert.deepStrictEqual(output.width, input.width);
    assert.deepStrictEqual(output.height, input.height);
  });
});

describe("makeBorder", () => {
  const black = Image.create(1, 1, [0, 0, 0]);
  const white = Image.create(1, 1, [255, 255, 255]);

  it("should not modify the original image", () => {
    const input = Image.create(4, 4, [0, 0, 0]);
    makeBorder(input, 1, p => [255 - p[0], 255 - p[1], 255 - p[2]]);
    expect(input.getPixel(0, 0)).toEqual(black.getPixel(0, 0));
    expect(input.getPixel(3, 3)).toEqual(black.getPixel(0, 0));
    expect(input.getPixel(1, 1)).toEqual(black.getPixel(0, 0));
    expect(input.getPixel(2, 2)).toEqual(black.getPixel(0, 0));
  });
});

describe("dimCenter", () => {
  it("should return an image with the same dimensions as the input", () => {
    const input = Image.create(2, 3, COLORS.WHITE);
    const output = dimCenter(input, 1);
    assert.deepStrictEqual(output.width, input.width);
    assert.deepStrictEqual(output.height, input.height);
  });

  it("should return an image with reduced brightness in the center", () => {
    const input = Image.create(4, 4, COLORS.WHITE);
    const thickness = 1;
    const output = dimCenter(input, thickness);
    const centerColor = COLORS.WHITE.map(x => x * 0.8); // expected center color
    for (let x = thickness; x < input.width - thickness; x++) {
      for (let y = thickness; y < input.height - thickness; y++) {
        assert.deepStrictEqual(output.getPixel(x, y), centerColor);
      }
    }
  });
});

describe("isGrayish", () => {
  it("should return true for a grayscale color", () => {
    assert.strictEqual(isGrayish([127, 127, 127]), true);
    assert.strictEqual(isGrayish([0, 0, 0]), true);
    assert.strictEqual(isGrayish([255, 255, 255]), true);
  });

  it("should return false for a non-grayscale color", () => {
    assert.strictEqual(isGrayish([255, 0, 0]), false);
    assert.strictEqual(isGrayish([0, 255, 0]), false);
    assert.strictEqual(isGrayish([0, 0, 255]), false);
    assert.strictEqual(isGrayish([255, 255, 0]), false);
    assert.strictEqual(isGrayish([255, 0, 255]), false);
    assert.strictEqual(isGrayish([0, 255, 255]), false);
  });
});

describe("makeGrayish", () => {
  it("creates a grayish image when given a black image", () => {
    const blackImage = Image.create(10, 10, COLORS.BLACK);
    const grayishImage = makeGrayish(blackImage);
    for (let i = 0; i < grayishImage.width; i++) {
      for (let j = 0; j < grayishImage.height; j++) {
        const pixel = grayishImage.getPixel(i, j);
        expect(pixel[0]).toBeGreaterThanOrEqual(0);
        expect(pixel[0]).toBeLessThanOrEqual(255);
        expect(pixel[0]).toEqual(pixel[1]);
        expect(pixel[1]).toEqual(pixel[2]);
      }
    }
  });

  it("creates a grayish image when given a white image", () => {
    const whiteImage = Image.create(10, 10, COLORS.WHITE);
    const grayishImage = makeGrayish(whiteImage);
    for (let i = 0; i < grayishImage.width; i++) {
      for (let j = 0; j < grayishImage.height; j++) {
        const pixel = grayishImage.getPixel(i, j);
        expect(pixel[0]).toBeGreaterThanOrEqual(0);
        expect(pixel[0]).toBeLessThanOrEqual(255);
        expect(pixel[0]).toEqual(pixel[1]);
        expect(pixel[1]).toEqual(pixel[2]);
      }
    }
  });
});
