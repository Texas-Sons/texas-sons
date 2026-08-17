const { Jimp } = require('jimp');

async function removeCheckerboard() {
  try {
    const image = await Jimp.read('public/logo.png');
    console.log('Image loaded:', image.bitmap.width, 'x', image.bitmap.height);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      const isNeutral = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
      
      if (isNeutral && r > 150) {
        this.bitmap.data[idx + 3] = 0; // Alpha to 0
      }
    });

    await image.write('public/logo.png');
    console.log('Background removed successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
}

removeCheckerboard();
