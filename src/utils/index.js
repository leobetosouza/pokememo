export const getRadomItem = (array) =>
  array[(array.length * Math.random()) | 0];

export const arrayBufferToBase64 = (buffer) => {
  const bytes = [...new Uint8Array(buffer)].reduce(
    (acc, b) => acc + String.fromCharCode(b),
    ""
  );

  return "data:image/jpeg;base64," + btoa(bytes);
};
